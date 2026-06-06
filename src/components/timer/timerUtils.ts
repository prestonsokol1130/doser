import { preferredIntervalMinutes } from '../../store/appStore'
import type { Dose, Profile, Substance } from '../../types'

export const DOSE_SCALE_MIN = 1.2
export const DOSE_SCALE_MAX = 2.4
export const DOSE_SCALE_TICKS = 37
export const DOSE_SCALE_STEP =
  (DOSE_SCALE_MAX - DOSE_SCALE_MIN) / (DOSE_SCALE_TICKS - 1)

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export function formatTimeShort(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDoseMl(value: number): string {
  return value.toFixed(2)
}

export function pelEffectLabel(percent: number): string {
  if (percent <= 0) return 'None'
  if (percent < 35) return 'Low'
  if (percent < 70) return 'Moderate'
  return 'High'
}

export function toleranceTrendLabel(trend: 'rising' | 'stable' | 'easing'): string {
  if (trend === 'rising') return 'Rising'
  if (trend === 'easing') return 'Easing'
  return 'Steady'
}

export function startOfLocalDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function dosesForSubstance(doses: Dose[], substance: Substance): Dose[] {
  return doses
    .filter((d) => d.substance === substance)
    .sort((a, b) => a.ts - b.ts)
}

export function sessionDosesToday(
  doses: Dose[],
  substance: Substance,
  nowMs: number,
): Dose[] {
  const dayStart = startOfLocalDay(nowMs)
  return dosesForSubstance(doses, substance).filter((d) => d.ts >= dayStart)
}

export function lastDose(
  doses: Dose[],
  substance: Substance,
): Dose | null {
  const sorted = dosesForSubstance(doses, substance)
  return sorted.length > 0 ? sorted[sorted.length - 1] : null
}

export function computeNextWindowMs(
  doses: Dose[],
  substance: Substance,
  profile: Profile,
): number | null {
  const recent = lastDose(doses, substance)
  if (!recent) return null
  const intervalMs = preferredIntervalMinutes(substance, profile) * 60 * 1000
  return recent.ts + intervalMs
}

export function isWaitingForWindow(
  nextWindowMs: number | null,
  nowMs: number,
): boolean {
  if (nextWindowMs === null) return false
  return nowMs < nextWindowMs
}

export function timingStateLabel(waiting: boolean): string {
  return waiting ? 'WAIT' : 'SAFE'
}

export function snapDoseToScale(value: number): number {
  const clamped = Math.min(DOSE_SCALE_MAX, Math.max(DOSE_SCALE_MIN, value))
  const index = Math.round((clamped - DOSE_SCALE_MIN) / DOSE_SCALE_STEP)
  return (
    Math.round((DOSE_SCALE_MIN + index * DOSE_SCALE_STEP) * 100) / 100
  )
}

export function scaleTickValues(): number[] {
  return Array.from({ length: DOSE_SCALE_TICKS }, (_, i) =>
    Math.round((DOSE_SCALE_MIN + i * DOSE_SCALE_STEP) * 100) / 100,
  )
}

export function createDoseId(): string {
  return crypto.randomUUID()
}

export function formatIntervalMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function averageIntervalMinutes(doses: Dose[]): number | null {
  if (doses.length < 2) return null
  let total = 0
  for (let i = 1; i < doses.length; i++) {
    total += (doses[i].ts - doses[i - 1].ts) / 60000
  }
  return total / (doses.length - 1)
}
