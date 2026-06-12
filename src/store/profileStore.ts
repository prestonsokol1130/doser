import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Dose, DoseContext, DoseSubstance, NotificationPrefs, Profile } from '../types'
import {
  VALID_DOSE_SUBSTANCES,
  VALID_FOOD_STATES,
  VALID_HYDRATION_STATES,
  VALID_LAST_DOSE_FEEDBACK,
  VALID_SLEEP_LEVELS,
} from '../types'

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
    stash: { capacityMl: 0, fullMl: 0, refillAt: 0 },
    taper: {
      active: false,
      substance: 'GBL',
      startDoseMl: 1.8,
      targetDoseMl: 1.0,
      stepIntervalDays: 7,
      reductionMlPerStep: 0.1,
      startedAt: Date.now(),
    },
    doseBuddy: {
      enabled: false,
      checkInBeforeDose: true,
      showRecommendation: true,
      localPeerContribution: false,
    },
    themeId: 'dark',
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
    profile: mergeProfileDefaults(profile as Partial<Profile>),
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

export async function saveUserProfile(
  uid: string,
  profile: Profile,
): Promise<void> {
  await setDoc(userDocRef(uid), { profile }, { merge: true })
}

function mergeProfileDefaults(profile: Partial<Profile>): Profile {
  const defaults = defaultProfile()
  return {
    ...defaults,
    ...profile,
    gbl: { ...defaults.gbl, ...(profile.gbl ?? {}) },
    bdo: { ...defaults.bdo, ...(profile.bdo ?? {}) },
    notif: { ...defaults.notif, ...(profile.notif ?? {}) },
    stash: { ...defaults.stash, ...(profile.stash ?? {}) },
    taper: { ...defaults.taper, ...(profile.taper ?? {}) },
    doseBuddy: { ...defaults.doseBuddy, ...(profile.doseBuddy ?? {}) },
  }
}

export async function fetchDoseContexts(
  uid: string,
): Promise<Record<string, DoseContext>> {
  const snapshot = await getDoc(userDocRef(uid))
  if (!snapshot.exists()) return {}

  const data = snapshot.data()
  const raw = data?.doseContexts
  if (!raw || typeof raw !== 'object') return {}

  const result: Record<string, DoseContext> = {}
  for (const [doseId, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object') continue
    const ctx = value as DoseContext
    const validFood = VALID_FOOD_STATES.includes(ctx.foodState)
    const validHydration = VALID_HYDRATION_STATES.includes(ctx.hydrationState)
    const validSleep = VALID_SLEEP_LEVELS.includes(ctx.sleepLevel)
    const validFeedback =
      ctx.lastDoseFeedback == null ||
      VALID_LAST_DOSE_FEEDBACK.includes(ctx.lastDoseFeedback)
    if (validFood && validHydration && validSleep && validFeedback) {
      result[doseId] = {
        foodState: ctx.foodState,
        hydrationState: ctx.hydrationState,
        sleepLevel: ctx.sleepLevel,
        lastDoseFeedback: ctx.lastDoseFeedback ?? null,
      }
    }
  }
  return result
}

export async function saveDoseContexts(
  uid: string,
  contexts: Record<string, DoseContext>,
): Promise<void> {
  await setDoc(userDocRef(uid), { doseContexts: contexts }, { merge: true })
}

export async function saveDoses(uid: string, doses: Dose[]): Promise<void> {
  try {
    const dosesRef = collection(db, 'users', uid, 'doses')

    // Validate doses before persisting
    const validDoses = doses.filter((dose) => {
      const isValid =
        typeof dose.id === 'string' &&
        VALID_DOSE_SUBSTANCES.includes(dose.substance) &&
        typeof dose.amountMl === 'number' &&
        typeof dose.ts === 'number'

      if (!isValid) {
        console.warn('Invalid dose skipped during save:', dose)
      }
      return isValid
    })

    // Differential sync: read existing IDs, delete ones no longer in the local array
    const existing = await getDocs(dosesRef)
    const existingIds = new Set(existing.docs.map((d) => d.id))
    const newIds = new Set(validDoses.map((d) => d.id))
    const toDelete = [...existingIds].filter((id) => !newIds.has(id))

    // Batch operations in chunks to avoid 500-operation limit
    let batch = writeBatch(db)
    let operationCount = 0

    // Delete doses that no longer exist locally
    for (const id of toDelete) {
      batch.delete(doc(dosesRef, id))
      operationCount++

      // Commit and start a new batch if we hit 400 operations (safety margin)
      if (operationCount >= 400) {
        await batch.commit()
        batch = writeBatch(db)
        operationCount = 0
      }
    }

    // Write/overwrite current doses
    for (const dose of validDoses) {
      batch.set(
        doc(dosesRef, dose.id),
        {
          id: dose.id,
          substance: dose.substance,
          amountMl: dose.amountMl,
          ts: dose.ts,
          updatedAt: dose.updatedAt ?? dose.ts,
        },
        { merge: false }
      )
      operationCount++

      if (operationCount >= 400) {
        await batch.commit()
        batch = writeBatch(db)
        operationCount = 0
      }
    }

    // Final commit for any remaining operations
    if (operationCount > 0) {
      await batch.commit()
    }
  } catch (error) {
    console.error('Failed to save doses:', error)
    throw error
  }
}

export async function fetchDoses(uid: string): Promise<Dose[]> {
  try {
    const dosesRef = collection(db, 'users', uid, 'doses')
    const snapshot = await getDocs(dosesRef)
    return snapshot.docs
      .map((doseDoc) => {
        const data = doseDoc.data()

        // Validate required fields exist and have correct types
        if (
          typeof data.id !== 'string' ||
          !VALID_DOSE_SUBSTANCES.includes(data.substance) ||
          typeof data.amountMl !== 'number' ||
          typeof data.ts !== 'number'
        ) {
          console.warn('Invalid dose document skipped:', data)
          return null
        }

        return {
          id: data.id,
          substance: data.substance as DoseSubstance,
          amountMl: data.amountMl,
          ts: data.ts,
          updatedAt:
            typeof data.updatedAt === 'number' ? data.updatedAt : data.ts,
        } as Dose
      })
      .filter((dose): dose is Dose => dose !== null)
  } catch (error) {
    console.error('Failed to fetch doses:', error)
    return []
  }
}
