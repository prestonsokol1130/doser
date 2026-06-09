import { HOUR_MS, MINUTE_MS } from '@/lib/perceivedEffect/effectCurves'
import type { Dose, DoseSubstance, Substance } from '@/types'

/** Gap with no doses that starts a new session. */
export const SESSION_GAP_MS = 6 * HOUR_MS

export function startOfTodayMs(nowMs: number): number {
  const d = new Date(nowMs)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function dosesToday(doses: Dose[], nowMs: number): Dose[] {
  const start = startOfTodayMs(nowMs)
  return doses
    .filter((d) => d.ts >= start && d.ts <= nowMs)
    .sort((a, b) => a.ts - b.ts)
}

export function dosesPast12Hours(doses: Dose[], nowMs: number): Dose[] {
  const cutoff = nowMs - 12 * HOUR_MS
  return doses
    .filter((d) => d.ts >= cutoff && d.ts <= nowMs)
    .sort((a, b) => a.ts - b.ts)
}

export function dosesPast7Days(doses: Dose[], nowMs: number): Dose[] {
  const cutoff = nowMs - 7 * 24 * HOUR_MS
  return doses.filter((d) => d.ts >= cutoff && d.ts <= nowMs)
}

export function totalMl(doses: Dose[]): number {
  return doses.reduce((sum, d) => sum + d.amountMl, 0)
}

export function substanceBreakdown(doses: Dose[]): string {
  const totals = new Map<DoseSubstance, number>()
  for (const dose of doses) {
    totals.set(dose.substance, (totals.get(dose.substance) ?? 0) + dose.amountMl)
  }
  if (totals.size === 0) return '—'
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([substance, ml]) => `${ml.toFixed(1)} mL ${substance}`)
    .join(', ')
}

export function averageIntervalMinutes(doses: Dose[]): number | null {
  if (doses.length < 2) return null
  let totalGap = 0
  for (let i = 1; i < doses.length; i++) {
    totalGap += doses[i]!.ts - doses[i - 1]!.ts
  }
  return totalGap / (doses.length - 1) / MINUTE_MS
}

export function formatDurationShort(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / MINUTE_MS))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function formatTimeAgo(ts: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - ts)
  const min = Math.floor(diff / MINUTE_MS)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  const rem = min % 60
  if (h < 24) return rem > 0 ? `${h}h ${rem}m ago` : `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function formatIntervalMinutes(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes)) return '—'
  if (minutes < 60) return `${Math.round(minutes)}m`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export type SessionMetrics = {
  doseCount: number
  totalMl: number
  avgDoseMl: number | null
  avgSpacingMinutes: number | null
}

export function sessionMetrics(doses: Dose[]): SessionMetrics {
  const count = doses.length
  const total = totalMl(doses)
  return {
    doseCount: count,
    totalMl: total,
    avgDoseMl: count > 0 ? total / count : null,
    avgSpacingMinutes: averageIntervalMinutes(doses),
  }
}

/** Split doses into sessions separated by gaps longer than SESSION_GAP_MS. */
export function splitIntoSessions(doses: Dose[], gapMs = SESSION_GAP_MS): Dose[][] {
  const sorted = [...doses].sort((a, b) => a.ts - b.ts)
  if (sorted.length === 0) return []

  const sessions: Dose[][] = [[sorted[0]!]]
  for (let i = 1; i < sorted.length; i++) {
    const dose = sorted[i]!
    const prev = sorted[i - 1]!
    if (dose.ts - prev.ts > gapMs) {
      sessions.push([dose])
    } else {
      sessions[sessions.length - 1]!.push(dose)
    }
  }
  return sessions
}

export function currentSession(
  doses: Dose[],
  substance: Substance,
  nowMs: number,
): Dose[] {
  const filtered = doses
    .filter((d) => d.substance === substance)
    .sort((a, b) => a.ts - b.ts)
  if (filtered.length === 0) return []

  const sessions = splitIntoSessions(filtered)
  const last = sessions[sessions.length - 1]!
  const lastDoseTs = last[last.length - 1]!.ts
  if (nowMs - lastDoseTs > SESSION_GAP_MS) return []
  return last
}

export function sessionsInLookback(
  doses: Dose[],
  substance: Substance,
  nowMs: number,
  lookbackMs: number,
): Dose[][] {
  const cutoff = nowMs - lookbackMs
  const filtered = doses
    .filter((d) => d.substance === substance && d.ts >= cutoff && d.ts <= nowMs)
    .sort((a, b) => a.ts - b.ts)
  return splitIntoSessions(filtered)
}

export type CompareTrend = 'up' | 'down' | 'flat'

export function compareTrend(
  current: number | null,
  average: number | null,
  thresholdPct = 0.12,
): CompareTrend {
  if (current == null || average == null || average === 0) return 'flat'
  const ratio = (current - average) / average
  if (ratio > thresholdPct) return 'up'
  if (ratio < -thresholdPct) return 'down'
  return 'flat'
}

export function trendSymbol(trend: CompareTrend): string {
  if (trend === 'up') return '↑'
  if (trend === 'down') return '↓'
  return '→'
}

export function trendLabel(trend: CompareTrend): string {
  if (trend === 'up') return 'more aggressive'
  if (trend === 'down') return 'lighter'
  return 'consistent'
}
