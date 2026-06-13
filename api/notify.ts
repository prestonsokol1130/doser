import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import type {
  DocumentData,
  DocumentReference,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { getFirestore } from 'firebase-admin/firestore'

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
  missedDoseSentForDoseId?: string
  missedDoseSentAt?: number
  sessionAutoEndedForDoseId?: string
  sessionAutoEndedAt?: number
  dailySummaryLastSentDate?: string
  dailySummaryLastSentAt?: number
  stashLowActive?: boolean
  stashLowSentAt?: number
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

async function processAllUsers(): Promise<number> {
  const usersSnapshot = await db.collection('users').get()
  console.log('Processing notification queue', {
    userCount: usersSnapshot.size,
  })

  for (const userDoc of usersSnapshot.docs) {
    try {
      await processUser(userDoc)
    } catch (error) {
      console.error('Notification processing failed', {
        uid: userDoc.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return usersSnapshot.size
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

  const latestDose = await fetchLatestDose(userDoc.ref)
  if (latestDose) {
    await processDoseWindowNotifications(
      uid,
      profile,
      latestDose,
      state,
      patch,
      nowMs,
    )
  }

  await processDailySummary(
    userDoc.ref,
    profile,
    state,
    patch,
    nowMs,
  )

  await processStashAlert(
    userDoc.ref,
    profile,
    state,
    patch,
    nowMs,
  )

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = nowMs
    await stateRef.set(patch, { merge: true })
  }
}

async function processDoseWindowNotifications(
  uid: string,
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
    nowMs < nextWindowAt
  ) {
    const sent = await sendOneSignalPush(
      uid,
      'Dose due soon',
      `Your next ${normalizeTrackedSubstance(latestDose.substance)} window opens at ${formatClockTime(nextWindowAt, DEFAULT_TIME_ZONE)}.`,
    )
    if (sent) {
      patch.doseDueSentForDoseId = latestDose.id
      patch.doseDueSentAt = nowMs
    }
  }

  if (
    profile.notif?.missedDoseAlert === true &&
    state.missedDoseSentForDoseId !== latestDose.id &&
    nowMs >= missedDoseAt
  ) {
    const sent = await sendOneSignalPush(
      uid,
      'No dose logged',
      `It has been 1 hour since your ${normalizeTrackedSubstance(latestDose.substance)} redose window opened and no new dose was logged.`,
    )
    if (sent) {
      patch.missedDoseSentForDoseId = latestDose.id
      patch.missedDoseSentAt = nowMs
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
  profile: UserProfile,
  state: NotificationState,
  patch: Partial<NotificationState>,
  nowMs: number,
): Promise<void> {
  if (profile.notif?.dailyUsageSummary !== true) return

  const summaryTime = sanitizeDailySummaryTime(profile.notif?.dailySummaryTime)
  const localNow = getLocalNow(DEFAULT_TIME_ZONE, nowMs)
  if (localNow.timeKey !== summaryTime) return
  if (state.dailySummaryLastSentDate === localNow.dateKey) return

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
  )

  if (sent) {
    patch.dailySummaryLastSentDate = localNow.dateKey
    patch.dailySummaryLastSentAt = nowMs
  }
}

async function processStashAlert(
  userRef: DocumentReference,
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
    return
  }

  const refillAt = Math.max(0, stash.refillAt ?? 0)
  const dosesSinceRefill = await fetchDosesSince(userRef, refillAt)
  const consumedMl = dosesSinceRefill.reduce((sum, dose) => sum + dose.amountMl, 0)
  const fullMl = (stash.fullMl ?? 0) > 0 ? stash.fullMl ?? 0 : stash.capacityMl ?? 0
  const remainingMl = Math.max(0, fullMl - consumedMl)
  const remainingPct =
    fullMl > 0 ? Math.round((remainingMl / fullMl) * 100) : 0
  const isLow = remainingPct <= (notif.stashLowThresholdPct ?? 20)

  if (isLow && !state.stashLowActive) {
    const sent = await sendOneSignalPush(
      userRef.id,
      'Stash running low',
      `${remainingMl.toFixed(1)} mL remaining (${remainingPct}%).`,
    )
    if (sent) {
      patch.stashLowActive = true
      patch.stashLowSentAt = nowMs
    }
    return
  }

  if (!isLow && state.stashLowActive) {
    patch.stashLowActive = false
  }
}

async function sendOneSignalPush(
  uid: string,
  title: string,
  body: string,
): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('OneSignal env vars missing')
    return false
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [uid] },
        target_channel: 'push',
        headings: { en: title },
        contents: { en: body },
      }),
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

    console.log('Sent notification via OneSignal', { uid, title })
    return true
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
