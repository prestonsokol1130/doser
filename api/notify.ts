import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import type {
  DocumentData,
  DocumentReference,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { Filter, getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  })
}

const db = getFirestore()

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY

const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000
const FIXED_MISSED_DOSE_DELAY_MS = HOUR_MS
const FIXED_SESSION_AUTO_END_DELAY_MS = 3 * HOUR_MS
const STATE_COLLECTION = 'system'
const STATE_DOC_ID = 'notificationState'
const DEFAULT_TIME_ZONE = 'UTC'
const USER_BATCH_SIZE = 100
const STALE_CLAIM_MS = 5 * MINUTE_MS

type Substance = 'GBL' | 'BDO'
type DoseSubstance = Substance | 'GHB'

type SubstancePrefs = {
  preferredIntervalMinutes?: number
}

type NotificationPrefs = {
  doseDueReminder?: boolean
  doseDueLeadMinutes?: number
  missedDoseAlert?: boolean
  dailyUsageSummary?: boolean
  dailySummaryTime?: string
  stashRunningLow?: boolean
  stashLowThresholdPct?: number
  silent?: boolean
}

type StashPrefs = {
  capacityMl?: number
  fullMl?: number
  refillAt?: number
}

type UserProfile = {
  gbl?: SubstancePrefs
  bdo?: SubstancePrefs
  notif?: NotificationPrefs
  stash?: StashPrefs
}

type DoseDoc = {
  id: string
  substance: DoseSubstance
  amountMl: number
  ts: number
}

type NotificationState = {
  doseDueSentForDoseId?: string
  doseDueSentAt?: number
  doseDueClaimedForDoseId?: string
  doseDueClaimedAt?: number
  missedDoseSentForDoseId?: string
  missedDoseSentAt?: number
  missedDoseClaimedForDoseId?: string
  missedDoseClaimedAt?: number
  sessionAutoEndedForDoseId?: string
  sessionAutoEndedAt?: number
  dailySummaryLastSentDate?: string
  dailySummaryLastSentAt?: number
  dailySummaryClaimedDate?: string
  dailySummaryClaimedAt?: number
  stashLowActive?: boolean
  stashLowSentAt?: number
  stashLowClaimedAt?: number
  updatedAt?: number
}

type LocalNow = {
  dateKey: string
  timeKey: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const secret = req.headers['x-cron-secret']
  if (!secret || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return
  }

  try {
    const processed = await processAllUsers()
    res.status(200).json({ ok: true, processed })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Notification queue processing failed', { error: message })
    res.status(500).json({ ok: false, error: message })
  }
}

function usersWithNotificationsEnabledQuery() {
  return db
    .collection('users')
    .where(
      Filter.or(
        Filter.where('profile.notif.doseDueReminder', '==', true),
        Filter.where('profile.notif.missedDoseAlert', '==', true),
        Filter.where('profile.notif.dailyUsageSummary', '==', true),
        Filter.where('profile.notif.stashRunningLow', '==', true),
      ),
    )
    .orderBy('__name__')
}

async function processAllUsers(): Promise<number> {
  let processed = 0
  let lastDoc: QueryDocumentSnapshot | undefined

  while (true) {
    let query = usersWithNotificationsEnabledQuery().limit(USER_BATCH_SIZE)
    if (lastDoc) {
      query = query.startAfter(lastDoc)
    }

    const usersSnapshot = await query.get()
    if (usersSnapshot.empty) break

    console.log('Processing notification queue batch', {
      batchSize: usersSnapshot.size,
      processedSoFar: processed,
    })

    for (const userDoc of usersSnapshot.docs) {
      try {
        await processUser(userDoc)
        processed += 1
      } catch (error) {
        console.error('Notification processing failed', {
          uid: userDoc.id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1]
    if (usersSnapshot.size < USER_BATCH_SIZE) break
  }

  console.log('Finished processing notification queue', { processed })
  return processed
}

async function processUser(
  userDoc: QueryDocumentSnapshot,
): Promise<void> {
  const profile = readProfile(userDoc.data())
  if (!profile) return

  const uid = userDoc.id
  const nowMs = Date.now()
  const stateRef = userDoc.ref.collection(STATE_COLLECTION).doc(STATE_DOC_ID)
  const stateSnapshot = await stateRef.get()
  const state = readState(stateSnapshot.data())
  const patch: Partial<NotificationState> = {}

  try {
    const latestDose = await fetchLatestDose(userDoc.ref)
    if (latestDose) {
      await processDoseWindowNotifications(
        uid,
        userDoc.ref,
        stateRef,
        profile,
        latestDose,
        state,
        patch,
        nowMs,
      )
    }

    await processDailySummary(
      userDoc.ref,
      stateRef,
      profile,
      state,
      patch,
      nowMs,
    )

    await processStashAlert(
      userDoc.ref,
      stateRef,
      profile,
      state,
      patch,
      nowMs,
    )
  } finally {
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = nowMs
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await stateRef.set(patch, { merge: true })
          break
        } catch (error) {
          if (attempt === 2) {
            console.error('Failed to merge notification state patch', {
              uid,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        }
      }
    }
  }
}

async function claimNotificationSlot(
  stateRef: DocumentReference,
  isAlreadyTaken: (state: NotificationState) => boolean,
  claimPatch: Partial<NotificationState>,
  nowMs: number,
): Promise<boolean> {
  try {
    return await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(stateRef)
      const currentState = readState(snapshot.data())
      if (isAlreadyTaken(currentState)) {
        return false
      }

      transaction.set(
        stateRef,
        { ...claimPatch, updatedAt: nowMs },
        { merge: true },
      )
      return true
    })
  } catch {
    return false
  }
}

function isStaleClaim(claimedAt: number | undefined, nowMs: number): boolean {
  return claimedAt != null && nowMs - claimedAt >= STALE_CLAIM_MS
}

async function persistNotificationSend(
  stateRef: DocumentReference,
  fields: Partial<NotificationState>,
  nowMs: number,
): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await stateRef.set({ ...fields, updatedAt: nowMs }, { merge: true })
      return true
    } catch (error) {
      if (attempt === 2) {
        console.error('Failed to persist notification send state', {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }
  return false
}

async function releaseNotificationClaim(
  stateRef: DocumentReference,
  fields: Partial<NotificationState>,
  nowMs: number,
): Promise<void> {
  try {
    await stateRef.set({ ...fields, updatedAt: nowMs }, { merge: true })
  } catch {
    // best-effort; stale-claim recovery will unblock a later retry
  }
}

async function persistSentNotificationState(
  stateRef: DocumentReference,
  patch: Partial<NotificationState>,
  sentState: Partial<NotificationState>,
  claimReleaseFields: Partial<NotificationState>,
  nowMs: number,
  errorContext: Record<string, unknown>,
): Promise<void> {
  const persisted = await persistNotificationSend(stateRef, sentState, nowMs)
  if (persisted) {
    Object.assign(patch, sentState)
    return
  }

  console.error('Push sent but immediate state persist failed', errorContext)
  await releaseNotificationClaim(stateRef, claimReleaseFields, nowMs)
}

async function processDoseWindowNotifications(
  uid: string,
  userRef: DocumentReference,
  stateRef: DocumentReference,
  profile: UserProfile,
  latestDose: DoseDoc,
  state: NotificationState,
  patch: Partial<NotificationState>,
  nowMs: number,
): Promise<void> {
  const nextWindowAt = getNextDoseWindowAt(profile, latestDose)
  const dueReminderAt = getDoseDueReminderAt(profile, latestDose)
  const missedDoseAt = nextWindowAt + FIXED_MISSED_DOSE_DELAY_MS
  const sessionAutoEndAt = nextWindowAt + FIXED_SESSION_AUTO_END_DELAY_MS

  if (
    profile.notif?.doseDueReminder === true &&
    state.doseDueSentForDoseId !== latestDose.id &&
    nowMs >= dueReminderAt &&
    nowMs <= nextWindowAt
  ) {
    const claimed = await claimNotificationSlot(
      stateRef,
      (currentState) => {
        if (currentState.doseDueSentForDoseId === latestDose.id) return true
        if (currentState.doseDueClaimedForDoseId !== latestDose.id) return false
        return !isStaleClaim(currentState.doseDueClaimedAt, nowMs)
      },
      {
        doseDueClaimedForDoseId: latestDose.id,
        doseDueClaimedAt: nowMs,
      },
      nowMs,
    )
    if (claimed) {
      const currentLatest = await fetchLatestDose(userRef)
      const doseStillEligible =
        currentLatest != null &&
        currentLatest.id === latestDose.id &&
        currentLatest.ts <= latestDose.ts &&
        nowMs <= getNextDoseWindowAt(profile, currentLatest)

      if (!doseStillEligible) {
        await releaseNotificationClaim(stateRef, {
          doseDueClaimedForDoseId: null,
          doseDueClaimedAt: null,
        }, nowMs)
      } else {
        const reminderWindowAt = getNextDoseWindowAt(profile, currentLatest)
        const sent = await sendOneSignalPush(
          uid,
          'Dose due soon',
          `Your next ${normalizeTrackedSubstance(currentLatest.substance)} window opens at ${formatClockTime(reminderWindowAt, DEFAULT_TIME_ZONE)}.`,
          profile.notif?.silent === true,
        )
        if (sent) {
          await persistSentNotificationState(
            stateRef,
            patch,
            {
              doseDueSentForDoseId: currentLatest.id,
              doseDueSentAt: nowMs,
              doseDueClaimedForDoseId: null,
              doseDueClaimedAt: null,
            },
            {
              doseDueClaimedForDoseId: null,
              doseDueClaimedAt: null,
            },
            nowMs,
            { uid, doseId: currentLatest.id, type: 'dose-due' },
          )
        } else {
          await releaseNotificationClaim(stateRef, {
            doseDueClaimedForDoseId: null,
            doseDueClaimedAt: null,
          }, nowMs)
        }
      }
    }
  }

  if (
    profile.notif?.missedDoseAlert === true &&
    state.missedDoseSentForDoseId !== latestDose.id &&
    nowMs >= missedDoseAt
  ) {
    const claimed = await claimNotificationSlot(
      stateRef,
      (currentState) => {
        if (currentState.missedDoseSentForDoseId === latestDose.id) return true
        if (currentState.missedDoseClaimedForDoseId !== latestDose.id) {
          return false
        }
        return !isStaleClaim(currentState.missedDoseClaimedAt, nowMs)
      },
      {
        missedDoseClaimedForDoseId: latestDose.id,
        missedDoseClaimedAt: nowMs,
      },
      nowMs,
    )
    if (claimed) {
      const currentLatest = await fetchLatestDose(userRef)
      const doseStillLatest =
        currentLatest != null &&
        currentLatest.id === latestDose.id &&
        currentLatest.ts <= latestDose.ts

      if (!doseStillLatest) {
        await releaseNotificationClaim(stateRef, {
          missedDoseClaimedForDoseId: null,
          missedDoseClaimedAt: null,
        }, nowMs)
      } else {
        const sent = await sendOneSignalPush(
          uid,
          'No dose logged',
          `It has been 1 hour since your ${normalizeTrackedSubstance(latestDose.substance)} redose window opened and no new dose was logged.`,
          profile.notif?.silent === true,
        )
        if (sent) {
          await persistSentNotificationState(
            stateRef,
            patch,
            {
              missedDoseSentForDoseId: latestDose.id,
              missedDoseSentAt: nowMs,
              missedDoseClaimedForDoseId: null,
              missedDoseClaimedAt: null,
            },
            {
              missedDoseClaimedForDoseId: null,
              missedDoseClaimedAt: null,
            },
            nowMs,
            { uid, doseId: latestDose.id, type: 'missed-dose' },
          )
        } else {
          await releaseNotificationClaim(stateRef, {
            missedDoseClaimedForDoseId: null,
            missedDoseClaimedAt: null,
          }, nowMs)
        }
      }
    }
  }

  if (
    state.sessionAutoEndedForDoseId !== latestDose.id &&
    nowMs >= sessionAutoEndAt
  ) {
    patch.sessionAutoEndedForDoseId = latestDose.id
    patch.sessionAutoEndedAt = nowMs
  }
}

async function processDailySummary(
  userRef: DocumentReference,
  stateRef: DocumentReference,
  profile: UserProfile,
  state: NotificationState,
  patch: Partial<NotificationState>,
  nowMs: number,
): Promise<void> {
  if (profile.notif?.dailyUsageSummary !== true) return

  const summaryTime = sanitizeDailySummaryTime(profile.notif?.dailySummaryTime)
  const localNow = getLocalNow(DEFAULT_TIME_ZONE, nowMs)
  if (localNow.timeKey < summaryTime) return
  if (state.dailySummaryLastSentDate === localNow.dateKey) return

  const claimed = await claimNotificationSlot(
    stateRef,
    (currentState) => {
      if (currentState.dailySummaryLastSentDate === localNow.dateKey) return true
      if (currentState.dailySummaryClaimedDate !== localNow.dateKey) return false
      return !isStaleClaim(currentState.dailySummaryClaimedAt, nowMs)
    },
    {
      dailySummaryClaimedDate: localNow.dateKey,
      dailySummaryClaimedAt: nowMs,
    },
    nowMs,
  )
  if (!claimed) return

  const todayStartMs = getStartOfLocalDayMs(DEFAULT_TIME_ZONE, nowMs)
  const dosesToday = await fetchDosesSince(userRef, todayStartMs)
  const doseCount = dosesToday.length
  const totalMl = dosesToday.reduce((sum, dose) => sum + dose.amountMl, 0)
  const lastDoseTs = dosesToday[dosesToday.length - 1]?.ts ?? null
  const lastDoseLabel =
    lastDoseTs == null
      ? 'No dose logged today.'
      : `Last dose at ${formatClockTime(lastDoseTs, DEFAULT_TIME_ZONE)}.`

  const sent = await sendOneSignalPush(
    userRef.id,
    'Daily summary',
    `${doseCount} dose${doseCount === 1 ? '' : 's'} today. ${totalMl.toFixed(1)} mL total. ${lastDoseLabel}`,
    profile.notif?.silent === true,
  )

  if (sent) {
    await persistSentNotificationState(
      stateRef,
      patch,
      {
        dailySummaryLastSentDate: localNow.dateKey,
        dailySummaryLastSentAt: nowMs,
        dailySummaryClaimedDate: null,
        dailySummaryClaimedAt: null,
      },
      {
        dailySummaryClaimedDate: null,
        dailySummaryClaimedAt: null,
      },
      nowMs,
      { uid: userRef.id, dateKey: localNow.dateKey, type: 'daily-summary' },
    )
  } else {
    await releaseNotificationClaim(stateRef, {
      dailySummaryClaimedDate: null,
      dailySummaryClaimedAt: null,
    }, nowMs)
  }
}

async function processStashAlert(
  userRef: DocumentReference,
  stateRef: DocumentReference,
  profile: UserProfile,
  state: NotificationState,
  patch: Partial<NotificationState>,
  nowMs: number,
): Promise<void> {
  const stash = profile.stash
  const notif = profile.notif
  if (notif?.stashRunningLow !== true || !stash || (stash.capacityMl ?? 0) <= 0) {
    if (state.stashLowActive) {
      patch.stashLowActive = false
    }
    if (state.stashLowClaimedAt != null) {
      patch.stashLowClaimedAt = null
    }
    return
  }

  const refillAt = Math.max(0, stash.refillAt ?? 0)
  const thresholdPct = notif.stashLowThresholdPct ?? 20
  const stashLevel = await getStashLevel(userRef, stash, refillAt, thresholdPct)

  if (stashLevel.isLow && !state.stashLowActive) {
    const claimed = await claimNotificationSlot(
      stateRef,
      (currentState) => {
        if (currentState.stashLowActive === true) return true
        if (currentState.stashLowClaimedAt == null) return false
        return !isStaleClaim(currentState.stashLowClaimedAt, nowMs)
      },
      {
        stashLowClaimedAt: nowMs,
      },
      nowMs,
    )
    if (!claimed) return

    const freshLevel = await getStashLevel(userRef, stash, refillAt, thresholdPct)
    if (!freshLevel.isLow) {
      await releaseNotificationClaim(stateRef, {
        stashLowClaimedAt: null,
      }, nowMs)
      return
    }

    const sent = await sendOneSignalPush(
      userRef.id,
      'Stash running low',
      `${freshLevel.remainingMl.toFixed(1)} mL remaining (${freshLevel.remainingPct}%).`,
      notif.silent === true,
    )
    if (sent) {
      await persistSentNotificationState(
        stateRef,
        patch,
        {
          stashLowActive: true,
          stashLowSentAt: nowMs,
          stashLowClaimedAt: null,
        },
        {
          stashLowClaimedAt: null,
        },
        nowMs,
        { uid: userRef.id, type: 'stash-low' },
      )
    } else {
      await releaseNotificationClaim(stateRef, {
        stashLowClaimedAt: null,
      }, nowMs)
    }
    return
  }

  if (!stashLevel.isLow && state.stashLowActive) {
    patch.stashLowActive = false
    patch.stashLowClaimedAt = null
  }
}

type StashLevel = {
  remainingMl: number
  remainingPct: number
  isLow: boolean
}

async function getStashLevel(
  userRef: DocumentReference,
  stash: StashPrefs,
  refillAt: number,
  thresholdPct: number,
): Promise<StashLevel> {
  const dosesSinceRefill = await fetchDosesSince(userRef, refillAt)
  const consumedMl = dosesSinceRefill.reduce((sum, dose) => sum + dose.amountMl, 0)
  const capacityMl = stash.capacityMl ?? 0
  const remainingMl = Math.max(0, capacityMl - consumedMl)
  const fullMl = (stash.fullMl ?? 0) > 0 ? stash.fullMl ?? 0 : capacityMl
  const remainingPct =
    fullMl > 0 ? Math.round((remainingMl / fullMl) * 100) : 0
  return {
    remainingMl,
    remainingPct,
    isLow: remainingPct <= thresholdPct,
  }
}

function hasOneSignalErrors(result: Record<string, unknown>): boolean {
  const errors = result.errors
  if (Array.isArray(errors) && errors.length > 0) return true
  if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
    return true
  }
  return false
}

function wasOneSignalPushDelivered(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false

  const result = body as Record<string, unknown>
  if (hasOneSignalErrors(result)) return false

  const id = result.id
  if (typeof id !== 'string' || id.length === 0) return false

  const recipients = result.recipients
  if (typeof recipients !== 'number' || recipients <= 0) return false

  return true
}

async function sendOneSignalPush(
  uid: string,
  title: string,
  body: string,
  silent = false,
): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('OneSignal env vars missing')
    return false
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    try {
      const payload: Record<string, unknown> = {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [uid] },
        target_channel: 'push',
        headings: { en: title },
        contents: { en: body },
      }
      if (silent) {
        payload.priority = 5
        payload.data = { silent: 'true' }
        payload.ios_sound = 'nil'
        payload.android_sound = 'nil'
        payload.huawei_sound = 'nil'
      }

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('OneSignal send failed', {
          uid,
          status: response.status,
          body: text,
        })
        return false
      }

      const text = await response.text()
      let responseBody: unknown
      try {
        responseBody = JSON.parse(text)
      } catch {
        console.error('OneSignal returned non-JSON response', { uid, title, text })
        return false
      }

      if (!wasOneSignalPushDelivered(responseBody)) {
        console.error('OneSignal send did not deliver', { uid, title, responseBody })
        return false
      }

      console.log('Sent notification via OneSignal', { uid, title, responseBody })
      return true
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    console.error('OneSignal send error', {
      uid,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

function readProfile(data: DocumentData): UserProfile | null {
  const profile = data.profile
  if (!profile || typeof profile !== 'object') return null
  return profile as UserProfile
}

function readState(data: DocumentData | undefined): NotificationState {
  if (!data || typeof data !== 'object') return {}
  return data as NotificationState
}

function normalizeTrackedSubstance(substance: DoseSubstance): Substance {
  return substance === 'BDO' ? 'BDO' : 'GBL'
}

function preferredIntervalMs(profile: UserProfile, dose: DoseDoc): number {
  const substance = normalizeTrackedSubstance(dose.substance)
  const minutes =
    substance === 'BDO'
      ? profile.bdo?.preferredIntervalMinutes ?? 120
      : profile.gbl?.preferredIntervalMinutes ?? 90
  return Math.max(1, minutes) * MINUTE_MS
}

function getNextDoseWindowAt(profile: UserProfile, dose: DoseDoc): number {
  return dose.ts + preferredIntervalMs(profile, dose)
}

function getDoseDueReminderAt(profile: UserProfile, dose: DoseDoc): number {
  const intervalMs = preferredIntervalMs(profile, dose)
  const requestedLeadMs = (profile.notif?.doseDueLeadMinutes ?? 5) * MINUTE_MS
  const clampedLeadMs = Math.min(
    Math.max(0, requestedLeadMs),
    Math.max(0, intervalMs - MINUTE_MS),
  )
  return getNextDoseWindowAt(profile, dose) - clampedLeadMs
}

function sanitizeDailySummaryTime(value: string | undefined): string {
  if (!value) return '09:00'
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value) ? value : '09:00'
}

function getLocalNow(timeZone: string, nowMs: number): LocalNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(nowMs))

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return {
    dateKey: `${map.year}-${map.month}-${map.day}`,
    timeKey: `${map.hour}:${map.minute}`,
  }
}

function getStartOfLocalDayMs(timeZone: string, nowMs: number): number {
  const localNow = getLocalNow(timeZone, nowMs)
  const [year, month, day] = localNow.dateKey.split('-').map(Number)
  try {
    const midnightMs = Date.UTC(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0)
    const offsetMs = getTimeZoneOffsetMs(timeZone, midnightMs)
    return midnightMs - offsetMs
  } catch {
    const utcDate = new Date(nowMs)
    return Date.UTC(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
    )
  }
}

function getTimeZoneOffsetMs(timeZone: string, nowMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(new Date(nowMs))
  const offsetValue =
    parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+0'
  const match = offsetValue.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2] ?? '0')
  const minutes = Number(match[3] ?? '0')
  return sign * (hours * 60 + minutes) * MINUTE_MS
}

function formatClockTime(ts: number, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ts))
}

async function fetchLatestDose(
  userRef: DocumentReference,
): Promise<DoseDoc | null> {
  const snapshot = await userRef
    .collection('doses')
    .orderBy('ts', 'desc')
    .limit(1)
    .get()
  const doc = snapshot.docs[0]
  if (!doc) return null
  const data = doc.data()
  if (
    typeof data.id !== 'string' ||
    typeof data.substance !== 'string' ||
    typeof data.amountMl !== 'number' ||
    typeof data.ts !== 'number'
  ) {
    return null
  }
  return {
    id: data.id,
    substance: data.substance as DoseSubstance,
    amountMl: data.amountMl,
    ts: data.ts,
  }
}

async function fetchDosesSince(
  userRef: DocumentReference,
  sinceMs: number,
): Promise<DoseDoc[]> {
  const snapshot = await userRef
    .collection('doses')
    .where('ts', '>=', sinceMs)
    .orderBy('ts', 'asc')
    .get()

  return snapshot.docs
    .map((doc) => doc.data())
    .filter(
      (data) =>
        typeof data.id === 'string' &&
        typeof data.substance === 'string' &&
        typeof data.amountMl === 'number' &&
        typeof data.ts === 'number',
    )
    .map((data) => ({
      id: data.id as string,
      substance: data.substance as DoseSubstance,
      amountMl: data.amountMl as number,
      ts: data.ts as number,
    }))
}
