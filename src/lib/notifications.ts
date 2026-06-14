import { HOUR_MS, MINUTE_MS } from '@/lib/perceivedEffect/effectCurves'
import type { Dose, DoseSubstance, Profile, Substance } from '@/types'

export const FIXED_MISSED_DOSE_DELAY_MS = HOUR_MS
export const FIXED_SESSION_AUTO_END_DELAY_MS = 3 * HOUR_MS

const DEFAULT_GBL_INTERVAL_MINUTES = 90
const DEFAULT_BDO_INTERVAL_MINUTES = 120
const DEFAULT_DOSE_DUE_LEAD_MINUTES = 5

function defaultIntervalMinutesForSubstance(substance: Substance): number {
  return substance === 'GBL'
    ? DEFAULT_GBL_INTERVAL_MINUTES
    : DEFAULT_BDO_INTERVAL_MINUTES
}

function sanitizeMinutes(value: number | undefined, fallbackMinutes: number): number {
  if (value == null || !Number.isFinite(value)) return fallbackMinutes
  return Math.max(1, value)
}

function ensureFiniteMs(value: number, fallbackMs: number): number {
  return Number.isFinite(value) ? value : fallbackMs
}

export type PushPermissionState = NotificationPermission | 'unsupported'

export function normalizeTrackedSubstance(
  substance: DoseSubstance,
): Substance {
  return substance === 'BDO' ? 'BDO' : 'GBL'
}

export function preferredIntervalMsForSubstance(
  profile: Profile,
  substance: Substance,
): number {
  const fallbackMinutes = defaultIntervalMinutesForSubstance(substance)
  let minutes: number
  if (substance === 'GBL') {
    minutes = sanitizeMinutes(
      profile.gbl?.preferredIntervalMinutes,
      fallbackMinutes,
    )
  } else {
    // BDO
    minutes = sanitizeMinutes(
      profile.bdo?.preferredIntervalMinutes,
      fallbackMinutes,
    )
  }
  return ensureFiniteMs(minutes * MINUTE_MS, fallbackMinutes * MINUTE_MS)
}

export function preferredIntervalMsForDose(
  profile: Profile,
  dose: Pick<Dose, 'substance'>,
): number {
  return preferredIntervalMsForSubstance(
    profile,
    normalizeTrackedSubstance(dose.substance),
  )
}

export function nextDoseWindowAt(
  profile: Profile,
  dose: Pick<Dose, 'ts' | 'substance'>,
): number {
  const substance = normalizeTrackedSubstance(dose.substance)
  const fallbackMs =
    defaultIntervalMinutesForSubstance(substance) * MINUTE_MS
  const safeTs = Number.isFinite(dose.ts) ? dose.ts : 0
  return ensureFiniteMs(
    safeTs + preferredIntervalMsForDose(profile, dose),
    safeTs + fallbackMs,
  )
}

export function doseDueReminderAt(
  profile: Profile,
  dose: Pick<Dose, 'ts' | 'substance'>,
): number {
  const substance = normalizeTrackedSubstance(dose.substance)
  const fallbackIntervalMs =
    defaultIntervalMinutesForSubstance(substance) * MINUTE_MS
  const intervalMs = preferredIntervalMsForDose(profile, dose)
  const leadMinutes = sanitizeMinutes(
    profile.notif?.doseDueLeadMinutes,
    DEFAULT_DOSE_DUE_LEAD_MINUTES,
  )
  const requestedLeadMs = leadMinutes * MINUTE_MS
  const clampedLeadMs = Math.min(
    Math.max(0, requestedLeadMs),
    Math.max(0, intervalMs - MINUTE_MS),
  )
  const fallbackLeadMs = Math.min(
    DEFAULT_DOSE_DUE_LEAD_MINUTES * MINUTE_MS,
    Math.max(0, fallbackIntervalMs - MINUTE_MS),
  )
  const safeTs = Number.isFinite(dose.ts) ? dose.ts : 0
  return ensureFiniteMs(
    nextDoseWindowAt(profile, dose) - clampedLeadMs,
    safeTs + fallbackIntervalMs - fallbackLeadMs,
  )
}

export function missedDoseAlertAt(
  profile: Profile,
  dose: Pick<Dose, 'ts' | 'substance'>,
): number {
  const substance = normalizeTrackedSubstance(dose.substance)
  const safeTs = Number.isFinite(dose.ts) ? dose.ts : 0
  const fallbackMs =
    safeTs +
    defaultIntervalMinutesForSubstance(substance) * MINUTE_MS +
    FIXED_MISSED_DOSE_DELAY_MS
  return ensureFiniteMs(
    nextDoseWindowAt(profile, dose) + FIXED_MISSED_DOSE_DELAY_MS,
    fallbackMs,
  )
}

export function sessionAutoEndAt(
  profile: Profile,
  dose: Pick<Dose, 'ts' | 'substance'>,
): number {
  const substance = normalizeTrackedSubstance(dose.substance)
  const safeTs = Number.isFinite(dose.ts) ? dose.ts : 0
  const fallbackMs =
    safeTs +
    defaultIntervalMinutesForSubstance(substance) * MINUTE_MS +
    FIXED_SESSION_AUTO_END_DELAY_MS
  return ensureFiniteMs(
    nextDoseWindowAt(profile, dose) + FIXED_SESSION_AUTO_END_DELAY_MS,
    fallbackMs,
  )
}

export function isDoseStillInActiveSession(
  profile: Profile,
  dose: Pick<Dose, 'ts' | 'substance'>,
  nowMs: number,
): boolean {
  return nowMs <= sessionAutoEndAt(profile, dose)
}
