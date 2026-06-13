import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import type {
  DocumentData,
  DocumentReference,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import type { MulticastMessage } from 'firebase-admin/messaging'
import { getMessaging } from 'firebase-admin/messaging'

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
const messaging = getMessaging()

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
  deviceDocs: QueryDocumentSnapshot[],
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
    const doseDueSuccessCount = await sendToDevices(
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
    if (doseDueSuccessCount > 0) {
      patch.doseDueSentForDoseId = latestDose.id
      patch.doseDueSentAt = nowMs
    }
  }

  if (
    profile.notif?.missedDoseAlert === true &&
    state.missedDoseSentForDoseId !== latestDose.id &&
    nowMs >= missedDoseAt
  ) {
    const missedDoseSuccessCount = await sendToDevices(
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
    if (missedDoseSuccessCount > 0) {
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
  deviceDocs: QueryDocumentSnapshot[],
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

  const dailySummarySuccessCount = await sendToDevices(
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

  if (dailySummarySuccessCount > 0) {
    patch.dailySummaryLastSentDate = localNow.dateKey
    patch.dailySummaryLastSentAt = nowMs
  }
}

async function processStashAlert(
  userRef: DocumentReference,
  profile: UserProfile,
  deviceDocs: QueryDocumentSnapshot[],
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
  const remainingMl = Math.max(0, (stash.capacityMl ?? 0) - consumedMl)
  const remainingPct =
    fullMl > 0 ? Math.round((remainingMl / fullMl) * 100) : 0
  const isLow = remainingPct <= (notif.stashLowThresholdPct ?? 20)

  if (isLow && !state.stashLowActive) {
    const stashLowSuccessCount = await sendToDevices(
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
    if (stashLowSuccessCount > 0) {
      patch.stashLowActive = true
      patch.stashLowSentAt = nowMs
    }
    return
  }

  if (!isLow && state.stashLowActive) {
    patch.stashLowActive = false
  }
}

async function sendToDevices(
  uid: string,
  deviceDocs: QueryDocumentSnapshot[],
  message: Omit<MulticastMessage, 'tokens'>,
): Promise<number> {
  const activeDeviceDocs = deviceDocs.filter((doc) => {
    const device = doc.data() as NotificationDeviceDoc
    return device.permission === 'granted' && typeof device.token === 'string'
  })
  const tokens = [...new Set(activeDeviceDocs.map((doc) => (doc.data() as NotificationDeviceDoc).token!))]
  if (tokens.length === 0) return 0

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

  console.log('Sent notification', {
    uid,
    successCount: response.successCount,
    failureCount: response.failureCount,
  })

  return response.successCount
}

function buildNotificationMessage(
  title: string,
  body: string,
  tag: string,
  data: Record<string, string>,
  silent: boolean,
): Omit<MulticastMessage, 'tokens'> {
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
  return /^\d{2}:\d{2}$/.test(value) ? value : '09:00'
}

function pickTimeZone(devices: NotificationDeviceDoc[]): string {
  const sorted = [...devices].sort(
    (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
  )
  const timeZone = sorted[0]?.timeZone ?? 'UTC'
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
    return timeZone
  } catch {
    return 'UTC'
  }
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
