import type { Profile, Substance } from '../types'

export function preferredDoseMl(substance: Substance, profile: Profile): number {
  const prefs = substance === 'GBL' ? profile.gbl : profile.bdo
  return prefs.preferredDoseMl
}

export function preferredIntervalMinutes(
  substance: Substance,
  profile: Profile,
): number {
  const prefs = substance === 'GBL' ? profile.gbl : profile.bdo
  return prefs.preferredIntervalMinutes
}
