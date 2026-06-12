// Insights data layer — computes interpretation-first signals from real dose logs.
// Ported from the v0 Insights design's InsightSet contract, wired to the app's
// actual data (doses + profile) and the existing session/tolerance helpers.
// No mock data: every field is derived from the user's logged doses.

import { HOUR_MS, MINUTE_MS } from '@/lib/perceivedEffect/effectCurves'
import { calculateBehavioralTolerance } from '@/lib/perceivedEffect/toleranceModel'
import { splitIntoSessions } from '@/lib/sessionStats'
import type { Dose, Profile } from '@/types'

const DAY_MS = 24 * HOUR_MS

export type InsightFilter = 'all' | 'gbl' | 'bdo'
export type TrendDir = 'up' | 'down' | 'flat'

export interface InsightSet {
  lifetimeMl: number
  last7Ml: number
  last30Ml: number
  prev30Ml: number
  sessions7: number
  sessions30: number
  prevSessions30: number
  activeDays30: number
  avgDose: number
  medianDose: number
  largestDose: number
  doseVariability: number
  prevAvgDose: number
  avgSpacing: number
  medianSpacing: number
  preferredInterval: number
  prevAvgSpacing: number
  spacingVariability: number
  tooSoon: number
  borderline: number
  wellSpaced: number
  avgSessionLen: number
  longestSessionLen: number
  avgSessionTotal: number
  highestSessionTotal: number
  avgDosesPerSession: number
  medianSessionTotal: number
  medianSessionLen: number
  medianDosesPerSession: number
  escalation: number[]
  buildPattern: { escalates: number; flat: number; tapers: number }
  buildLabel: 'Escalates' | 'Flat' | 'Tapers'
  toleranceDir: TrendDir
  toleranceConfidence: number
  toleranceDrivers: { label: string; weight: number }[]
  avgRecoveryGap: number
  longestRecoveryGap: number
  shortestRecoveryGap: number
  timeOfDay: number[]
  dayOfWeek: number[]
  spacingLadder: number[]
  sessionShapes: number[][]
  calendar: number[]
  mostCommonStart: string
  typicalWindow: string
  shareOfUse: { gbl: number; bdo: number }
}

// ─── small math helpers ────────────────────────────────────────────────────────

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0)
}
function mean(xs: number[]): number {
  return xs.length ? sum(xs) / xs.length : 0
}
function median(xs: number[]): number {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}
/** Coefficient of variation, clamped to 0..1 (0 = perfectly steady). */
function variability(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  if (m === 0) return 0
  const sd = Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
  return clamp01(sd / m)
}
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function pctChange(now: number, prev: number): number {
  if (prev === 0) return 0
  return Math.round(((now - prev) / prev) * 100)
}

export function fmtMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// ─── builder ────────────────────────────────────────────────────────────────────

function filterDoses(doses: Dose[], filter: InsightFilter): Dose[] {
  if (filter === 'all') return doses
  const want = filter === 'gbl' ? 'GBL' : 'BDO'
  return doses.filter((d) => d.substance === want)
}

function preferredIntervalFor(profile: Profile, filter: InsightFilter): number {
  if (filter === 'gbl') return profile.gbl.preferredIntervalMinutes
  if (filter === 'bdo') return profile.bdo.preferredIntervalMinutes
  return Math.round(
    (profile.gbl.preferredIntervalMinutes + profile.bdo.preferredIntervalMinutes) / 2,
  )
}

/** In-session gaps in minutes, paired with the timestamp of the later dose. */
function inSessionGaps(sessions: Dose[][]): { gapMin: number; ts: number }[] {
  const out: { gapMin: number; ts: number }[] = []
  for (const session of sessions) {
    for (let i = 1; i < session.length; i++) {
      out.push({ gapMin: (session[i]!.ts - session[i - 1]!.ts) / MINUTE_MS, ts: session[i]!.ts })
    }
  }
  return out
}

const EMPTY: InsightSet = {
  lifetimeMl: 0, last7Ml: 0, last30Ml: 0, prev30Ml: 0,
  sessions7: 0, sessions30: 0, prevSessions30: 0, activeDays30: 0,
  avgDose: 0, medianDose: 0, largestDose: 0, doseVariability: 0, prevAvgDose: 0,
  avgSpacing: 0, medianSpacing: 0, preferredInterval: 0, prevAvgSpacing: 0, spacingVariability: 0,
  tooSoon: 0, borderline: 0, wellSpaced: 0,
  avgSessionLen: 0, longestSessionLen: 0, avgSessionTotal: 0, highestSessionTotal: 0,
  avgDosesPerSession: 0, medianSessionTotal: 0, medianSessionLen: 0, medianDosesPerSession: 0,
  escalation: [1], buildPattern: { escalates: 0, flat: 0, tapers: 0 }, buildLabel: 'Flat',
  toleranceDir: 'flat', toleranceConfidence: 0, toleranceDrivers: [],
  avgRecoveryGap: 0, longestRecoveryGap: 0, shortestRecoveryGap: 0,
  timeOfDay: Array(24).fill(0), dayOfWeek: Array(7).fill(0), spacingLadder: [],
  sessionShapes: [], calendar: Array(30).fill(0),
  mostCommonStart: '—', typicalWindow: '—', shareOfUse: { gbl: 0, bdo: 0 },
}

export function buildInsightSet(
  allDoses: Dose[],
  profile: Profile,
  nowMs: number,
  filter: InsightFilter,
): InsightSet {
  const doses = filterDoses(allDoses, filter)
    .filter((d) => d.ts <= nowMs)
    .sort((a, b) => a.ts - b.ts)
  if (doses.length === 0) return { ...EMPTY, preferredInterval: preferredIntervalFor(profile, filter) }

  const within = (fromAgo: number, toAgo = 0) =>
    doses.filter((d) => d.ts >= nowMs - fromAgo * DAY_MS && d.ts < nowMs - toAgo * DAY_MS)

  const last7 = within(7)
  const last30 = within(30)
  const prev30 = within(60, 30)

  // Sessions
  const sessions = splitIntoSessions(doses)
  const sessionStart = (s: Dose[]) => s[0]!.ts
  const sessionEnd = (s: Dose[]) => s[s.length - 1]!.ts
  const sessionsSince = (ago: number) => sessions.filter((s) => sessionStart(s) >= nowMs - ago * DAY_MS)
  const sessions30List = sessionsSince(30)

  // Dose size — current window (last 30d, falling back to everything)
  const sizeWindow = last30.length ? last30 : doses
  const sizes = sizeWindow.map((d) => d.amountMl)
  const prevSizes = prev30.map((d) => d.amountMl)

  // Spacing — in-session gaps
  const gaps = inSessionGaps(sessions)
  const gaps30 = gaps.filter((g) => g.ts >= nowMs - 30 * DAY_MS)
  const gapsCur = (gaps30.length ? gaps30 : gaps).map((g) => g.gapMin)
  const gapsPrev = gaps
    .filter((g) => g.ts >= nowMs - 60 * DAY_MS && g.ts < nowMs - 30 * DAY_MS)
    .map((g) => g.gapMin)
  const preferredInterval = preferredIntervalFor(profile, filter)

  // Redose quality shares
  let tooSoon = 0, borderline = 0, wellSpaced = 0
  for (const g of gapsCur) {
    if (g < preferredInterval * 0.7) tooSoon++
    else if (g < preferredInterval) borderline++
    else wellSpaced++
  }
  const gapCount = gapsCur.length || 1
  tooSoon /= gapCount
  borderline /= gapCount
  wellSpaced /= gapCount

  // Session shape stats
  const sLens = sessions.map((s) => (sessionEnd(s) - sessionStart(s)) / MINUTE_MS)
  const sTotals = sessions.map((s) => sum(s.map((d) => d.amountMl)))
  const sCounts = sessions.map((s) => s.length)

  // Escalation: average normalized dose-by-position across multi-dose sessions
  const multi = sessions.filter((s) => s.length >= 2)
  const maxLen = Math.min(8, Math.max(3, Math.round(median(multi.map((s) => s.length)) || 3)))
  const escalation: number[] = []
  for (let i = 0; i < maxLen; i++) {
    const ratios = multi
      .filter((s) => s.length > i && s[0]!.amountMl > 0)
      .map((s) => s[i]!.amountMl / s[0]!.amountMl)
    escalation.push(ratios.length ? round1(mean(ratios)) : escalation[i - 1] ?? 1)
  }
  if (escalation.length === 0) escalation.push(1)

  // Build pattern classification
  let esc = 0, flat = 0, tap = 0
  for (const s of multi) {
    const first = s[0]!.amountMl
    const last = s[s.length - 1]!.amountMl
    if (first === 0) { flat++; continue }
    const ratio = last / first
    if (ratio > 1.1) esc++
    else if (ratio < 0.9) tap++
    else flat++
  }
  const buildTotal = (esc + flat + tap) || 1
  const buildPattern = { escalates: esc / buildTotal, flat: flat / buildTotal, tapers: tap / buildTotal }
  const buildLabel: InsightSet['buildLabel'] =
    esc + flat + tap === 0
      ? 'Flat'
      : buildPattern.escalates >= buildPattern.flat && buildPattern.escalates >= buildPattern.tapers
        ? 'Escalates'
        : buildPattern.tapers >= buildPattern.flat
          ? 'Tapers'
          : 'Flat'

  // Tolerance
  const tol = calculateBehavioralTolerance(doses, profile, nowMs)
  const toleranceDir: TrendDir = tol.trend === 'easing' ? 'down' : tol.trend === 'rising' ? 'up' : 'flat'
  const toleranceConfidence = tol.confidence === 'full' ? 0.9 : tol.confidence === 'partial' ? 0.6 : 0.2
  const driverWeight = (c: string, i: number) =>
    clamp01((c === 'elevating' ? 0.85 : c === 'reducing' ? 0.62 : 0.4) - i * 0.06)
  const toleranceDrivers = tol.drivers
    .slice(0, 4)
    .map((d, i) => ({ label: d.label, weight: driverWeight(d.contribution, i) }))

  // Recovery gaps between sessions (hours)
  const recovery: number[] = []
  for (let i = 1; i < sessions.length; i++) {
    recovery.push((sessionStart(sessions[i]!) - sessionEnd(sessions[i - 1]!)) / HOUR_MS)
  }

  // Distributions
  const timeOfDay = Array(24).fill(0)
  for (const d of doses) timeOfDay[new Date(d.ts).getHours()] += d.amountMl
  const maxHour = Math.max(...timeOfDay, 0.0001)
  const timeOfDayNorm = timeOfDay.map((v) => clamp01(v / maxHour))

  const dayOfWeek = Array(7).fill(0)
  for (const d of last30.length ? last30 : doses) {
    const idx = (new Date(d.ts).getDay() + 6) % 7 // Mon..Sun
    dayOfWeek[idx] += d.amountMl
  }

  const spacingLadder = gaps
    .slice(-12)
    .map((g) => Math.round(g.gapMin))

  const sessionShapes = multi
    .slice(-3)
    .map((s) => s.map((d) => round1(d.amountMl / (s[0]!.amountMl || 1))))

  const calendar = Array.from({ length: 30 }, (_, i) => {
    const dayStart = nowMs - (29 - i) * DAY_MS
    const dStart = new Date(dayStart); dStart.setHours(0, 0, 0, 0)
    const start = dStart.getTime()
    const dayTotal = doses
      .filter((d) => d.ts >= start && d.ts < start + DAY_MS)
      .reduce((a, d) => a + d.amountMl, 0)
    return dayTotal
  })
  const maxCal = Math.max(...calendar, 0.0001)
  const calendarNorm = calendar.map((v) => clamp01(v / maxCal))

  // Start window
  const startMinutes = sessions.map((s) => {
    const dt = new Date(sessionStart(s))
    return dt.getHours() * 60 + dt.getMinutes()
  })
  const medStart = Math.round(median(startMinutes))
  const medLen = Math.round(median(sLens.filter((l) => l > 0)) || 0)
  const fmtClock = (totalMin: number) => `${pad2(Math.floor((totalMin % 1440) / 60))}:${pad2(Math.round(totalMin % 60))}`
  const mostCommonStart = startMinutes.length ? fmtClock(medStart) : '—'
  const typicalWindow = startMinutes.length ? `${fmtClock(medStart)} – ${fmtClock(medStart + medLen)}` : '—'

  // Share of use (by mL in last 30 days, falling back to all)
  const shareWindow = filterDoses(last30.length ? last30 : doses, 'all') // already filtered above for substance tabs
  const shareIds = new Set(shareWindow.map((d) => d.id))
  const gblMl = sum(allDoses.filter((d) => d.substance === 'GBL' && shareIds.has(d.id)).map((d) => d.amountMl))
  const bdoMl = sum(allDoses.filter((d) => d.substance === 'BDO' && shareIds.has(d.id)).map((d) => d.amountMl))
  const shareTotal = gblMl + bdoMl || 1
  const shareOfUse =
    filter === 'gbl' ? { gbl: 1, bdo: 0 }
      : filter === 'bdo' ? { gbl: 0, bdo: 1 }
        : { gbl: gblMl / shareTotal, bdo: bdoMl / shareTotal }

  const activeDays = new Set(
    last30.map((d) => new Date(d.ts).toDateString()),
  ).size

  return {
    lifetimeMl: Math.round(sum(doses.map((d) => d.amountMl))),
    last7Ml: round1(sum(last7.map((d) => d.amountMl))),
    last30Ml: round1(sum(last30.map((d) => d.amountMl))),
    prev30Ml: round1(sum(prev30.map((d) => d.amountMl))),
    sessions7: sessionsSince(7).length,
    sessions30: sessions30List.length,
    prevSessions30: sessions.filter(
      (s) => sessionStart(s) >= nowMs - 60 * DAY_MS && sessionStart(s) < nowMs - 30 * DAY_MS,
    ).length,
    activeDays30: activeDays,
    avgDose: round1(mean(sizes)),
    medianDose: round1(median(sizes)),
    largestDose: round1(Math.max(...doses.map((d) => d.amountMl))),
    doseVariability: round1(variability(sizes)),
    prevAvgDose: round1(prevSizes.length ? mean(prevSizes) : mean(sizes)),
    avgSpacing: Math.round(mean(gapsCur)),
    medianSpacing: Math.round(median(gapsCur)),
    preferredInterval,
    prevAvgSpacing: Math.round(gapsPrev.length ? mean(gapsPrev) : mean(gapsCur)),
    spacingVariability: round1(variability(gapsCur)),
    tooSoon: round1(tooSoon),
    borderline: round1(borderline),
    wellSpaced: round1(wellSpaced),
    avgSessionLen: Math.round(mean(sLens)),
    longestSessionLen: Math.round(Math.max(...sLens, 0)),
    avgSessionTotal: round1(mean(sTotals)),
    highestSessionTotal: round1(Math.max(...sTotals, 0)),
    avgDosesPerSession: round1(mean(sCounts)),
    medianSessionTotal: round1(median(sTotals)),
    medianSessionLen: Math.round(median(sLens)),
    medianDosesPerSession: Math.round(median(sCounts)),
    escalation,
    buildPattern,
    buildLabel,
    toleranceDir,
    toleranceConfidence,
    toleranceDrivers,
    avgRecoveryGap: Math.round(median(recovery)),
    longestRecoveryGap: Math.round(Math.max(...recovery, 0)),
    shortestRecoveryGap: Math.round(recovery.length ? Math.min(...recovery) : 0),
    timeOfDay: timeOfDayNorm,
    dayOfWeek,
    spacingLadder,
    sessionShapes,
    calendar: calendarNorm,
    mostCommonStart,
    typicalWindow,
    shareOfUse,
  }
}
