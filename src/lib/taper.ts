import type { TaperPrefs } from '@/types'

export function taperedDoseMl(prefs: TaperPrefs, nowMs: number): number | null {
  if (!prefs.active) return null

  const dayMs = 86_400_000
  const daysElapsed = Math.max(0, Math.floor((nowMs - prefs.startedAt) / dayMs))
  const steps =
    prefs.stepIntervalDays > 0
      ? Math.floor(daysElapsed / prefs.stepIntervalDays)
      : 0
  const dose = prefs.startDoseMl - steps * prefs.reductionMlPerStep
  return Math.max(prefs.targetDoseMl, dose)
}

export function taperStepsCompleted(prefs: TaperPrefs, nowMs: number): number {
  if (!prefs.active || prefs.stepIntervalDays <= 0) return 0
  const daysElapsed = Math.max(
    0,
    Math.floor((nowMs - prefs.startedAt) / 86_400_000),
  )
  return Math.floor(daysElapsed / prefs.stepIntervalDays)
}

export function taperDaysUntilNextStep(
  prefs: TaperPrefs,
  nowMs: number,
): number | null {
  if (!prefs.active || prefs.stepIntervalDays <= 0) return null
  const dayMs = 86_400_000
  const daysElapsed = Math.max(0, Math.floor((nowMs - prefs.startedAt) / dayMs))
  const intoStep = daysElapsed % prefs.stepIntervalDays
  return prefs.stepIntervalDays - intoStep
}
