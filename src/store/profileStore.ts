import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Dose, NotificationPrefs, Profile } from '../types'
import { VALID_DOSE_SUBSTANCES } from '../types'

const USERS_COLLECTION = 'users'

export type UserDocument = {
  onboardingComplete: boolean
  profile: Profile
}

export function defaultNotificationPrefs(): NotificationPrefs {
  return {
    preset: 'custom',
    doseDueReminder: false,
    doseDueLeadMinutes: 5,
    stashRunningLow: false,
    stashLowThresholdPct: 20,
    doseLoggedConfirmation: true,
    dailyUsageSummary: false,
    dailySummaryTime: '09:00',
    missedDoseAlert: false,
    missedDoseGraceHours: 1,
    doseReminders: false,
    spacingReminders: false,
    hydration: false,
    stashAlerts: false,
    sleepReminders: false,
    hapticOnly: false,
    silent: false,
  }
}

export function defaultProfile(): Profile {
  return {
    nickname: '',
    age: 0,
    heightCm: 0,
    heightUnit: 'cm',
    weightKg: 0,
    weightUnit: 'kg',
    biologicalSex: null,
    gbl: { preferredDoseMl: 1.8, preferredIntervalMinutes: 90 },
    bdo: { preferredDoseMl: 1.8, preferredIntervalMinutes: 120 },
    avatarId: 'orb',
    accentHex: '#9b9ba3',
    glowHex: '#c4c4cc',
    notif: defaultNotificationPrefs(),
  }
}

function userDocRef(uid: string) {
  return doc(db, USERS_COLLECTION, uid)
}

export async function fetchUserDocument(
  uid: string,
): Promise<UserDocument | null> {
  const snapshot = await getDoc(userDocRef(uid))
  if (!snapshot.exists()) return null

  const data = snapshot.data()
  if (!data || typeof data !== 'object') return null

  const onboardingComplete = data.onboardingComplete === true
  const profile = data.profile

  if (!profile || typeof profile !== 'object') {
    return { onboardingComplete, profile: defaultProfile() }
  }

  return {
    onboardingComplete,
    profile: profile as Profile,
  }
}

export async function isOnboardingComplete(uid: string): Promise<boolean> {
  const snapshot = await getDoc(userDocRef(uid))
  if (!snapshot.exists()) return false

  const data = snapshot.data()
  if (!data || typeof data !== 'object') return false

  return (
    data.onboardingComplete === true &&
    data.profile != null &&
    typeof data.profile === 'object'
  )
}

export async function saveOnboardingProfile(
  uid: string,
  profile: Profile,
): Promise<void> {
  await setDoc(
    userDocRef(uid),
    {
      onboardingComplete: true,
      profile,
    },
    { merge: true },
  )
}
