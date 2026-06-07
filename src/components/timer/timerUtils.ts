import type { Dose, Profile, Substance } from '../../types'

export const DOSE_MIN = 0.1
export const DOSE_MAX = 10.0
export const DOSE_STEP = 0.1

export type TimerPhase = 'safe' | 'wait'

export interface TimerState {
  phase: TimerPhase
  elapsedMs: number
  remainingMs: number
  nextWindowMs: number | null
  ringProgress: number
  lastDoseTs: number | null
}

export function preferredDoseForSubstance(
  profile: Profile,
  substance: Substance,
): number {
  return substance === 'GBL'
    ? profile.gbl.preferredDoseMl
    : profile.bdo.preferredDoseMl
}

export function preferredIntervalForSubstance(
  profile: Profile,
  substance: Substance,
): number {
  return substance === 'GBL'
    ? profile.gbl.preferredIntervalMinutes
    : profile.bdo.preferredIntervalMinutes
}

export function dosesForSubstance(doses: Dose[], substance: Substance): Dose[] {
  return doses
    .filter((d) => d.substance === substance)
    .sort((a, b) => a.ts - b.ts)
}

export function lastDose(doses: Dose[], substance: Substance): Dose | null {
  const filtered = dosesForSubstance(doses, substance)
  return filtered.length > 0 ? filtered[filtered.length - 1]! : null
}

export function sessionTotalMl(doses: Dose[], substance: Substance): number {
  return dosesForSubstance(doses, substance).reduce(
    (sum, d) => sum + d.amountMl,
    0,
  )
}

export function computeTimerState(
  doses: Dose[],
  substance: Substance,
  profile: Profile,
  nowMs: number,
): TimerState {
  const latest = lastDose(doses, substance)

  if (!latest) {
    return {
      phase: 'safe',
      elapsedMs: 0,
      remainingMs: 0,
      nextWindowMs: null,
      ringProgress: 0,
      lastDoseTs: null,
    }
  }

  const intervalMs =
    preferredIntervalForSubstance(profile, substance) * 60 * 1000
  const nextWindowMs = latest.ts + intervalMs
  const elapsedMs = Math.max(0, nowMs - latest.ts)

  if (nowMs < nextWindowMs) {
    const remainingMs = nextWindowMs - nowMs
    return {
      phase: 'wait',
      elapsedMs,
      remainingMs,
      nextWindowMs,
      ringProgress: remainingMs / intervalMs,
      lastDoseTs: latest.ts,
    }
  }

  return {
    phase: 'safe',
    elapsedMs,
    remainingMs: 0,
    nextWindowMs,
    ringProgress: 0,
    lastDoseTs: latest.ts,
  }
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function formatTimeShort(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDoseAmount(ml: number): string {
  return ml.toFixed(2)
}

export function formatSessionTotal(ml: number): string {
  return `${ml.toFixed(2)} mL`
}

export function formatLastEntry(dose: Dose | null): string {
  if (!dose) return '—'
  return `${formatDoseAmount(dose.amountMl)} • ${formatTimeShort(dose.ts)}`
}

export function clampDoseAmount(amount: number): number {
  const v = Math.round(amount * 10) / 10
  if (v > DOSE_MAX) return DOSE_MIN
  if (v < DOSE_MIN) return DOSE_MAX
  return v
}

export function snapDoseToStep(amount: number): number {
  return clampDoseAmount(Math.round(amount / DOSE_STEP) * DOSE_STEP)
}

export function createDoseId(): string {
  return crypto.randomUUID()
}
