import type { Dose, DoseContext, DoseSubstance, Profile } from '../types'
import {
  VALID_DOSE_SUBSTANCES,
  VALID_FOOD_STATES,
  VALID_HYDRATION_STATES,
  VALID_LAST_DOSE_FEEDBACK,
  VALID_SLEEP_LEVELS,
} from '../types'
import { defaultProfile } from './profileStore'

const ONBOARDING_KEY = 'doser.local.onboardingComplete'
const PROFILE_KEY = 'doser.local.profile'
const DOSES_KEY = 'doser.local.doses'
const DOSE_CONTEXTS_KEY = 'doser.local.doseContexts'

const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function isUnsafeObjectKey(key: string): boolean {
  return UNSAFE_OBJECT_KEYS.has(key)
}

function emptyDoseContextMap(): Record<string, DoseContext> {
  return Object.create(null) as Record<string, DoseContext>
}

function parseDoseContext(value: unknown): DoseContext | null {
  if (!value || typeof value !== 'object') return null
  const ctx = value as DoseContext
  const validFood = VALID_FOOD_STATES.includes(ctx.foodState)
  const validHydration = VALID_HYDRATION_STATES.includes(ctx.hydrationState)
  const validSleep = VALID_SLEEP_LEVELS.includes(ctx.sleepLevel)
  const validFeedback =
    ctx.lastDoseFeedback == null ||
    VALID_LAST_DOSE_FEEDBACK.includes(ctx.lastDoseFeedback)
  if (!validFood || !validHydration || !validSleep || !validFeedback) {
    return null
  }

  return {
    foodState: ctx.foodState,
    hydrationState: ctx.hydrationState,
    sleepLevel: ctx.sleepLevel,
    lastDoseFeedback: ctx.lastDoseFeedback ?? null,
  }
}

function sanitizeDoseContexts(
  raw: Record<string, unknown>,
): Record<string, DoseContext> {
  const result = emptyDoseContextMap()
  for (const [doseId, value] of Object.entries(raw)) {
    if (isUnsafeObjectKey(doseId)) continue
    const parsed = parseDoseContext(value)
    if (parsed) {
      result[doseId] = parsed
    }
  }
  return result
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to write ${key} to localStorage:`, error)
    throw error
  }
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

export function isLocalOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true'
  } catch {
    return false
  }
}

export function fetchLocalProfile(): Profile {
  const raw = readJson<Partial<Profile>>(PROFILE_KEY)
  if (!raw || typeof raw !== 'object') return defaultProfile()
  return mergeProfileDefaults(raw)
}

export async function saveLocalOnboardingProfile(profile: Profile): Promise<void> {
  writeJson(PROFILE_KEY, profile)
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true')
  } catch (error) {
    console.error('Failed to mark local onboarding complete:', error)
    throw error
  }
}

export function saveLocalProfile(profile: Profile): void {
  writeJson(PROFILE_KEY, profile)
}

export function fetchLocalDoses(): Dose[] {
  const raw = readJson<unknown[]>(DOSES_KEY)
  if (!Array.isArray(raw)) return []

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const dose = entry as Dose
      if (
        typeof dose.id !== 'string' ||
        !VALID_DOSE_SUBSTANCES.includes(dose.substance) ||
        typeof dose.amountMl !== 'number' ||
        typeof dose.ts !== 'number'
      ) {
        console.warn('Invalid local dose skipped:', entry)
        return null
      }

      return {
        id: dose.id,
        substance: dose.substance as DoseSubstance,
        amountMl: dose.amountMl,
        ts: dose.ts,
        updatedAt:
          typeof dose.updatedAt === 'number' ? dose.updatedAt : dose.ts,
      } as Dose
    })
    .filter((dose): dose is Dose => dose !== null)
}

export function saveLocalDoses(doses: Dose[]): void {
  const validDoses = doses.filter((dose) => {
    const isValid =
      typeof dose.id === 'string' &&
      VALID_DOSE_SUBSTANCES.includes(dose.substance) &&
      typeof dose.amountMl === 'number' &&
      typeof dose.ts === 'number'

    if (!isValid) {
      console.warn('Invalid dose skipped during local save:', dose)
    }
    return isValid
  })

  writeJson(DOSES_KEY, validDoses)
}

export function fetchLocalDoseContexts(): Record<string, DoseContext> {
  const raw = readJson<Record<string, unknown>>(DOSE_CONTEXTS_KEY)
  if (!raw || typeof raw !== 'object') return emptyDoseContextMap()
  return sanitizeDoseContexts(raw)
}

export function saveLocalDoseContexts(
  contexts: Record<string, DoseContext>,
): void {
  writeJson(DOSE_CONTEXTS_KEY, sanitizeDoseContexts(contexts))
}
