import type { Dose, Profile } from '@/types'

export function stashConsumedMl(doses: Dose[], refillAt: number): number {
  return doses
    .filter((dose) => dose.ts >= refillAt)
    .reduce((sum, dose) => sum + dose.amountMl, 0)
}

export function stashRemainingMl(
  stash: Profile['stash'],
  doses: Dose[],
): number {
  if (stash.capacityMl <= 0) return 0
  const consumed = stashConsumedMl(doses, stash.refillAt)
  return Math.max(0, stash.capacityMl - consumed)
}

/** Full reference volume (100% tank level). Falls back to the current baseline for
 *  legacy data that predates the fullMl field. */
export function stashFullMl(stash: Profile['stash']): number {
  const full = stash.fullMl ?? 0
  return full > 0 ? full : stash.capacityMl
}

export function stashRemainingPct(
  stash: Profile['stash'],
  doses: Dose[],
): number {
  const full = stashFullMl(stash)
  if (full <= 0) return 0
  const remaining = stashRemainingMl(stash, doses)
  return Math.round((remaining / full) * 100)
}

export function isStashLow(profile: Profile, doses: Dose[]): boolean {
  const { stash, notif } = profile
  if (stash.capacityMl <= 0) return false
  const pct = stashRemainingPct(stash, doses)
  return pct <= notif.stashLowThresholdPct
}
