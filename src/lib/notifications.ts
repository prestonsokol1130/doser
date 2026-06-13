import { HOUR_MS, MINUTE_MS } from '@/lib/perceivedEffect/effectCurves'
import type { Dose, DoseSubstance, Profile, Substance } from '@/types'

export const FIXED_MISSED_DOSE_DELAY_MS = HOUR_MS
export const FIXED_SESSION_AUTO_END_DELAY_MS = 3 * HOUR_MS

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
  return (
    (substance === 'GBL'
      ? profile.gbl.preferredIntervalMinutes
      : profile.bdo.preferredIntervalMinutes) * MINUTE_MS
  )
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
  return dose.ts + preferredIntervalMsForDose(profile, dose)
}

export function doseDueReminderAt(
  profile: Profile,
  dose: Pick<Dose, 'ts' | 'substance'>,
): number {
  const intervalMs = preferredIntervalMsForDose(profile, dose)
  const requestedLeadMs = profile.notif.doseDueLeadMinutes * MINUTE_MS
  const clampedLeadMs = Math.min(
    Math.max(0, requestedLeadMs),
    Math.max(0, intervalMs - MINUTE_MS),
  )
  return nextDoseWindowAt(profile, dose) - clampedLeadMs
}

export function missedDoseAlertAt(
  profile: Profile,
  dose: Pick<Dose, 'ts' | 'substance'>,
): number {
  return nextDoseWindowAt(profile, dose) + FIXED_MISSED_DOSE_DELAY_MS
}

export function sessionAutoEndAt(
  profile: Profile,
  dose: Pick<Dose, 'ts' | 'substance'>,
): number {
  return nextDoseWindowAt(profile, dose) + FIXED_SESSION_AUTO_END_DELAY_MS
}

export function isDoseStillInActiveSession(
  profile: Profile,
  dose: Pick<Dose, 'ts' | 'substance'>,
  nowMs: number,
): boolean {
  return nowMs <= sessionAutoEndAt(profile, dose)
}
