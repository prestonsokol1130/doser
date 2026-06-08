import { preferredIntervalMinutes } from '@/store/appStore'
import type { Dose, Profile } from '@/types'

export type RedoseClass = 'tooSoon' | 'borderline' | 'spaced'

export function classifyRedose(
  dose: Dose,
  prev: Dose,
  profile: Profile,
): RedoseClass {
  const gapMs = dose.ts - prev.ts
  if (gapMs <= 0) return 'tooSoon'

  const substance = dose.substance
  let intervalMin = 90
  if (substance === 'GBL') {
    intervalMin = preferredIntervalMinutes('GBL', profile)
  } else if (substance === 'BDO') {
    intervalMin = preferredIntervalMinutes('BDO', profile)
  }

  const intervalMs = intervalMin * 60 * 1000
  if (gapMs < intervalMs * 0.75) return 'tooSoon'
  if (gapMs < intervalMs) return 'borderline'
  return 'spaced'
}
