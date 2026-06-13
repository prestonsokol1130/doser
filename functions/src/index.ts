import * as admin from 'firebase-admin'
import { logger } from 'firebase-functions'
import { onSchedule } from 'firebase-functions/v2/scheduler'

admin.initializeApp()

const db = admin.firestore()
const messaging = admin.messaging()

const APP_ORIGIN = 'https://usedoser.com'
const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000
const FIXED_MISSED_DOSE_DELAY_MS = HOUR_MS
const FIXED_SESSION_AUTO_END_DELAY_MS = 3 * HOUR_MS
const STATE_COLLECTION = 'system'
const STATE_DOC_ID = 'notificationState'

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

type NotificationDeviceDoc = {
  token?: string
  permission?: string
  timeZone?: string
  updatedAt?: number
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

export const processNotificationQueue = onSchedule(
  {
    schedule: 'every 1 minutes',
    region: 'us-central1',
    timeZone: 'Etc/UTC',
  },
  async () => {
    const usersSnapshot = await db.collection('users').get()
    logger.info('Processing notification queue', {
      userCount: usersSnapshot.size,
    })

    for (const userDoc of usersSnapshot.docs) {
      try {
        await processUser(userDoc)
      } catch (error) {
        logger.error('Notification processing failed', {
          uid: userDoc.id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  },
)

async function processUser(
  userDoc: admin.firestore.QueryDocumentSnapshot,
): Promise<void> {
  const profile = readProfile(userDoc.data())
  if (!profile) return

  const devicesSnapshot = await userDoc.ref.collection('notificationDevices').get()
  const devices = devicesSnapshot.docs
    .map((doc) => doc.data() as NotificationDeviceDoc)
    .filter((device) => device.permission === 'granted' && typeof device.token === 'string')

  if (devices.length === 0) {
    return
  }

  const timeZone = pickTimeZone(devices)
  const nowMs = Date.now()
  const stateRef = userDoc.ref.collection(STATE_COLLECTION).doc(STATE_DOC_ID)
  const stateSnapshot = await stateRef.get()
  const state = readState(stateSnapshot.data())
  const patch: Partial<NotificationState> = {}

  const latestDose = await fetchLatestDose(userDoc.ref)
  if (latestDose) {
    await processDoseWindowNotifications(
      userDoc.id,
      profile,
      latestDose,
      devicesSnapshot.docs,
      state,
      patch,
      nowMs,
    )
  }

  await processDailySummary(
    userDoc.ref,
    profile,
    devicesSnapshot.docs,
    timeZone,
    state,
    patch,
    nowMs,
  )

  await processStashAlert(
    userDoc.ref,
    profile,
    devicesSnapshot.docs,
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
  deviceDocs: admin.firestore.QueryDocumentSnapshot[],
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
    await sendToDevices(
      uid,
      deviceDocs,
      buildNotificationMessage(
        'Dose due soon',
        `Your next ${normalizeTrackedSubstance(latestDose.substance)} window opens at ${formatClockTime(nextWindowAt)}.`,
        `dose-due-${latestDose.id}`,
        {
          type: 'dose-due',
          doseId: latestDose.id,
        },
        profile.notif?.silent === true,
      ),
    )
    patch.doseDueSentForDoseId = latestDose.id
    patch.doseDueSentAt = nowMs
  }

  if (
    profile.notif?.missedDoseAlert === true &&
    state.missedDoseSentForDoseId !== latestDose.id &&
    nowMs >= missedDoseAt
  ) {
    await sendToDevices(
      uid,
      deviceDocs,
      buildNotificationMessage(
        'No dose logged',
        `It has been 1 hour since your ${normalizeTrackedSubstance(latestDose.substance)} redose window opened and no new dose was logged.`,
        `missed-dose-${latestDose.id}`,
        {
          type: 'missed-dose',
          doseId: latestDose.id,
        },
        profile.notif?.silent === true,
      ),
    )
    patch.missedDoseSentForDoseId = latestDose.id
    patch.missedDoseSentAt = nowMs
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
  userRef: admin.firestore.DocumentReference,
  profile: UserProfile,
  deviceDocs: admin.firestore.QueryDocumentSnapshot[],
  timeZone: string,
  state: NotificationState,
  patch: Partial<NotificationState>,
  nowMs: number,
): Promise<void> {
  if (profile.notif?.dailyUsageSummary !== true) return

  const summaryTime = sanitizeDailySummaryTime(profile.notif?.dailySummaryTime)
  const localNow = getLocalNow(timeZone, nowMs)
  if (localNow.timeKey !== summaryTime) return
  if (state.dailySummaryLastSentDate === localNow.dateKey) return

  const todayStartMs = getStartOfLocalDayMs(timeZone, nowMs)
  const dosesToday = await fetchDosesSince(userRef, todayStartMs)
  const doseCount = dosesToday.length
  const totalMl = dosesToday.reduce((sum, dose) => sum + dose.amountMl, 0)
  const lastDoseTs = dosesToday[dosesToday.length - 1]?.ts ?? null
  const lastDoseLabel =
    lastDoseTs == null ? 'No dose logged today.' : `Last dose at ${formatClockTime(lastDoseTs, timeZone)}.`

  await sendToDevices(
    userRef.id,
    deviceDocs,
    buildNotificationMessage(
      'Daily summary',
      `${doseCount} dose${doseCount === 1 ? '' : 's'} today. ${totalMl.toFixed(1)} mL total. ${lastDoseLabel}`,
      `daily-summary-${localNow.dateKey}`,
      {
        type: 'daily-summary',
        date: localNow.dateKey,
      },
      profile.notif?.silent === true,
    ),
  )

  patch.dailySummaryLastSentDate = localNow.dateKey
  patch.dailySummaryLastSentAt = nowMs
}

async function processStashAlert(
  userRef: admin.firestore.DocumentReference,
  profile: UserProfile,
  deviceDocs: admin.firestore.QueryDocumentSnapshot[],
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
  const remainingMl = Math.max(0, (stash.capacityMl ?? 0) - consumedMl)
  const fullMl = (stash.fullMl ?? 0) > 0 ? stash.fullMl ?? 0 : stash.capacityMl ?? 0
  const remainingPct =
    fullMl > 0 ? Math.round((remainingMl / fullMl) * 100) : 0
  const isLow = remainingPct <= (notif.stashLowThresholdPct ?? 20)

  if (isLow && !state.stashLowActive) {
    await sendToDevices(
      userRef.id,
      deviceDocs,
      buildNotificationMessage(
        'Stash running low',
        `${remainingMl.toFixed(1)} mL remaining (${remainingPct}%).`,
        'stash-low',
        {
          type: 'stash-low',
        },
        notif.silent === true,
      ),
    )
    patch.stashLowActive = true
    patch.stashLowSentAt = nowMs
    return
  }

  if (!isLow && state.stashLowActive) {
    patch.stashLowActive = false
  }
}

async function sendToDevices(
  uid: string,
  deviceDocs: admin.firestore.QueryDocumentSnapshot[],
  message: Omit<admin.messaging.MulticastMessage, 'tokens'>,
): Promise<void> {
  const activeDeviceDocs = deviceDocs.filter((doc) => {
    const device = doc.data() as NotificationDeviceDoc
    return device.permission === 'granted' && typeof device.token === 'string'
  })
  const tokens = [...new Set(activeDeviceDocs.map((doc) => (doc.data() as NotificationDeviceDoc).token!))]
  if (tokens.length === 0) return

  const response = await messaging.sendEachForMulticast({
    ...message,
    tokens,
  })

  const staleDocDeletes: Promise<unknown>[] = []
  response.responses.forEach((result, index) => {
    if (result.success) return
    const code = result.error?.code ?? ''
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    ) {
      const token = tokens[index]
      const staleDoc = activeDeviceDocs.find(
        (doc) => (doc.data() as NotificationDeviceDoc).token === token,
      )
      if (staleDoc) staleDocDeletes.push(staleDoc.ref.delete())
    }
  })

  if (staleDocDeletes.length > 0) {
    await Promise.allSettled(staleDocDeletes)
  }

  logger.info('Sent notification', {
    uid,
    successCount: response.successCount,
    failureCount: response.failureCount,
  })
}

function buildNotificationMessage(
  title: string,
  body: string,
  tag: string,
  data: Record<string, string>,
  silent: boolean,
): Omit<admin.messaging.MulticastMessage, 'tokens'> {
  const icon = new URL('/favicon.svg', APP_ORIGIN).toString()
  return {
    notification: {
      title,
      body,
    },
    data,
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        tag,
        icon,
        badge: icon,
        silent,
      },
      fcmOptions: {
        link: APP_ORIGIN,
      },
    },
  }
}

function readProfile(data: admin.firestore.DocumentData): UserProfile | null {
  const profile = data.profile
  if (!profile || typeof profile !== 'object') return null
  return profile as UserProfile
}

function readState(data: admin.firestore.DocumentData | undefined): NotificationState {
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
  return /^\d{2}:\d{2}$/.test(value) ? value : '09:00'
}

function pickTimeZone(devices: NotificationDeviceDoc[]): string {
  const sorted = [...devices].sort(
    (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
  )
  return sorted[0]?.timeZone ?? 'UTC'
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
  const offsetMs = getTimeZoneOffsetMs(timeZone, nowMs)
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0) - offsetMs
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
  userRef: admin.firestore.DocumentReference,
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
  userRef: admin.firestore.DocumentReference,
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
