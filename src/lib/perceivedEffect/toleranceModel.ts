/**
 * Behavior-derived tolerance estimate for GBL + BDO (shared backbone).
 * Pure and deterministic — recomputed from dose history at any instant.
 */

import { classifyRedose } from "@/lib/insightsAdvanced";
import { preferredDoseMl, preferredIntervalMinutes } from "@/store/appStore";
import type { Dose, Profile } from "@/types";
import {
  HOUR_MS,
  isDepressantSubstance,
  PERCEIVED_WEAR_OFF_MINUTES,
  type PerceivedSubstance,
} from "@/lib/perceivedEffect/effectCurves";

export { HOUR_MS };
export const DAY_MS = 24 * HOUR_MS;

export type ToleranceTrend = "rising" | "stable" | "easing";
export type ToleranceConfidence = "calibrating" | "partial" | "full";

export type ToleranceDriverContribution = "elevating" | "neutral" | "reducing";

export interface ToleranceDriver {
  id: string;
  label: string;
  contribution: ToleranceDriverContribution;
  detail: string;
}

export interface ToleranceEstimate {
  /** ~0.6 (sensitive) to ~2.2 (heavy tolerance). 1.0 = typical occasional use. */
  index: number;
  trend: ToleranceTrend;
  confidence: ToleranceConfidence;
  drivers: ToleranceDriver[];
  doseSizeScore: number;
  frequencyScore: number;
  intervalScore: number;
  volumeScore: number;
  activeDayScore: number;
  streakScore: number;
  earlyRedoseScore: number;
  escalationScore: number;
  recoveryScore: number;
  rawComposite: number;
}

const TOLERANCE_MIN = 0.6;
const TOLERANCE_MAX = 2.2;
const TOLERANCE_MAX_GAP_MS = 18 * HOUR_MS;
const MIN_DOSES_CALIBRATING = 3;
const MIN_DOSES_PARTIAL = 8;

const W_DOSE = 0.18;
const W_FREQ = 0.14;
const W_INTERVAL = 0.14;
const W_VOLUME = 0.12;
const W_ACTIVE_DAYS = 0.1;
const W_STREAK = 0.08;
const W_EARLY_REDOSE = 0.12;
const W_ESCALATION = 0.07;
const W_RECOVERY = 0.05;

function sortAsc(doses: Dose[]): Dose[] {
  return [...doses].sort((a, b) => a.ts - b.ts);
}

export function depressantDoses(doses: Dose[]): Dose[] {
  return doses.filter((d) => isDepressantSubstance(d.substance));
}

function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dosesInWindow(doses: Dose[], nowMs: number, days: number): Dose[] {
  const start = nowMs - days * DAY_MS;
  return doses.filter((d) => d.ts >= start && d.ts <= nowMs);
}

function avgDoseMl(doses: Dose[]): number {
  if (doses.length === 0) return 0;
  return doses.reduce((s, d) => s + d.amountMl, 0) / doses.length;
}

function avgGapMs(sortedAsc: Dose[]): number | null {
  if (sortedAsc.length < 2) return null;
  let sum = 0;
  let count = 0;
  for (let i = 1; i < sortedAsc.length; i++) {
    const gap = sortedAsc[i].ts - sortedAsc[i - 1].ts;
    if (gap <= 0 || gap > TOLERANCE_MAX_GAP_MS) continue;
    sum += gap;
    count += 1;
  }
  return count > 0 ? sum / count : null;
}

function totalMl(doses: Dose[]): number {
  return doses.reduce((s, d) => s + d.amountMl, 0);
}

function activeDayFraction(doses: Dose[], nowMs: number, days: number): number {
  if (days <= 0) return 0;
  const start = nowMs - days * DAY_MS;
  const daysSet = new Set<number>();
  for (const d of doses) {
    if (d.ts >= start && d.ts <= nowMs) daysSet.add(startOfLocalDay(d.ts));
  }
  return daysSet.size / days;
}

function consecutiveUseStreak(doses: Dose[], nowMs: number): number {
  const daysSet = new Set<number>();
  for (const d of doses) {
    if (d.ts <= nowMs) daysSet.add(startOfLocalDay(d.ts));
  }
  if (daysSet.size === 0) return 0;

  let streak = 0;
  let day = startOfLocalDay(nowMs);
  while (daysSet.has(day)) {
    streak += 1;
    day -= DAY_MS;
  }
  return streak;
}

function earlyRedoseRate(doses: Dose[], profile: Profile): number {
  const sorted = sortAsc(doses);
  if (sorted.length < 2) return 0;

  let early = 0;
  let counted = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const dose = sorted[i];
    const gap = dose.ts - prev.ts;
    if (gap <= 0) continue;

    counted += 1;
    const redoseClass = classifyRedose(dose, prev, profile);
    const substance = dose.substance as PerceivedSubstance;
    const wearOffMs =
      isDepressantSubstance(substance) ? PERCEIVED_WEAR_OFF_MINUTES[substance] * 60 * 1000 : 2 * HOUR_MS;

    if (redoseClass === "tooSoon" || redoseClass === "borderline" || gap < wearOffMs) {
      early += 1;
    }
  }
  return counted > 0 ? early / counted : 0;
}

function avgPreferredDoseMl(profile: Profile): number {
  const gbl = preferredDoseMl("GBL", profile);
  const bdo = preferredDoseMl("BDO", profile);
  if (gbl > 0 && bdo > 0) return (gbl + bdo) / 2;
  return gbl > 0 ? gbl : bdo > 0 ? bdo : 1.8;
}

function avgPreferredIntervalMs(profile: Profile): number {
  const gbl = preferredIntervalMinutes("GBL", profile) * 60 * 1000;
  const bdo = preferredIntervalMinutes("BDO", profile) * 60 * 1000;
  if (gbl > 0 && bdo > 0) return (gbl + bdo) / 2;
  return gbl > 0 ? gbl : bdo > 0 ? bdo : 90 * 60 * 1000;
}

interface WindowMetrics {
  avgDose: number;
  avgGapMs: number | null;
  totalMlPerDay: number;
  dosesPerDay: number;
  activeDayFraction: number;
}

function windowMetrics(doses: Dose[], nowMs: number, days: number): WindowMetrics {
  const window = dosesInWindow(doses, nowMs, days);
  const sorted = sortAsc(window);
  return {
    avgDose: avgDoseMl(window),
    avgGapMs: avgGapMs(sorted),
    totalMlPerDay: totalMl(window) / days,
    dosesPerDay: window.length / days,
    activeDayFraction: activeDayFraction(doses, nowMs, days),
  };
}

function ratioScore(value: number, baseline: number, invert = false): number {
  if (baseline <= 0) return 1;
  const ratio = value / baseline;
  return invert ? baseline / Math.max(value, 1e-6) : ratio;
}

function clampIndex(raw: number): number {
  if (!Number.isFinite(raw)) return 1;
  return Math.min(TOLERANCE_MAX, Math.max(TOLERANCE_MIN, raw));
}

function mapCompositeToIndex(composite: number): number {
  // composite ~1.0 at baseline occasional use
  const centered = composite - 1;
  const index = 1 + centered * 0.55 + Math.sign(centered) * centered * centered * 0.12;
  return clampIndex(index);
}

function computeCompositeScores(
  doses: Dose[],
  profile: Profile,
  nowMs: number,
): Omit<ToleranceEstimate, "index" | "trend" | "confidence" | "drivers"> {
  const baselineDose = avgPreferredDoseMl(profile);
  const baselineInterval = avgPreferredIntervalMs(profile);
  const baselineDosesPerDay = 3 / 7; // ~3 doses/week occasional anchor
  const baselineMlPerDay = (baselineDose * 3) / 7;
  const baselineActiveDay = 3 / 7;

  const w7 = windowMetrics(doses, nowMs, 7);
  const w30 = windowMetrics(doses, nowMs, 30);
  const w60 = windowMetrics(doses, nowMs, 60);

  const blend = (a: number, b: number, c: number) => a * 0.5 + b * 0.3 + c * 0.2;

  const doseSizeScore = blend(
    ratioScore(w7.avgDose, baselineDose),
    ratioScore(w30.avgDose, baselineDose),
    ratioScore(w60.avgDose, baselineDose),
  );

  const freqScore = blend(
    ratioScore(w7.dosesPerDay, baselineDosesPerDay),
    ratioScore(w30.dosesPerDay, baselineDosesPerDay),
    ratioScore(w60.dosesPerDay, baselineDosesPerDay),
  );

  const interval7 = w7.avgGapMs ?? baselineInterval;
  const interval30 = w30.avgGapMs ?? baselineInterval;
  const interval60 = w60.avgGapMs ?? baselineInterval;
  const intervalScore = blend(
    ratioScore(interval7, baselineInterval, true),
    ratioScore(interval30, baselineInterval, true),
    ratioScore(interval60, baselineInterval, true),
  );

  const volumeScore = blend(
    ratioScore(w7.totalMlPerDay, baselineMlPerDay),
    ratioScore(w30.totalMlPerDay, baselineMlPerDay),
    ratioScore(w60.totalMlPerDay, baselineMlPerDay),
  );

  const activeDayScore = blend(
    ratioScore(w7.activeDayFraction, baselineActiveDay),
    ratioScore(w30.activeDayFraction, baselineActiveDay),
    ratioScore(w60.activeDayFraction, baselineActiveDay),
  );

  const streak = consecutiveUseStreak(doses, nowMs);
  const streakScore = 1 + Math.min(0.45, Math.max(0, streak - 2) * 0.06);

  const earlyRedoseScore = 1 + earlyRedoseRate(dosesInWindow(doses, nowMs, 30), profile) * 0.65;

  const escalationScore =
    1 +
    Math.max(0, ratioScore(w7.totalMlPerDay, w30.totalMlPerDay) - 1) * 0.35 +
    Math.max(0, ratioScore(w30.totalMlPerDay, w60.totalMlPerDay) - 1) * 0.2;

  const recoveryScore =
    1 -
    Math.max(0, 1 - ratioScore(w7.totalMlPerDay, w30.totalMlPerDay)) * 0.4 -
    Math.max(0, 1 - ratioScore(w30.totalMlPerDay, w60.totalMlPerDay)) * 0.25;

  const rawComposite =
    W_DOSE * doseSizeScore +
    W_FREQ * freqScore +
    W_INTERVAL * intervalScore +
    W_VOLUME * volumeScore +
    W_ACTIVE_DAYS * activeDayScore +
    W_STREAK * streakScore +
    W_EARLY_REDOSE * earlyRedoseScore +
    W_ESCALATION * escalationScore +
    W_RECOVERY * recoveryScore;

  return {
    doseSizeScore,
    frequencyScore: freqScore,
    intervalScore,
    volumeScore,
    activeDayScore,
    streakScore,
    earlyRedoseScore,
    escalationScore,
    recoveryScore,
    rawComposite,
  };
}

function resolveConfidence(doseCount: number): ToleranceConfidence {
  if (doseCount < MIN_DOSES_CALIBRATING) return "calibrating";
  if (doseCount < MIN_DOSES_PARTIAL) return "partial";
  return "full";
}

function resolveTrend(
  doses: Dose[],
  profile: Profile,
  nowMs: number,
  currentComposite: number,
): ToleranceTrend {
  const pastMs = nowMs - 14 * DAY_MS;
  if (depressantDoses(dosesInWindow(doses, nowMs, 30)).length < MIN_DOSES_PARTIAL) {
    return "stable";
  }
  const pastComposite = computeCompositeScores(doses, profile, pastMs).rawComposite;
  const delta = currentComposite - pastComposite;
  if (delta > 0.06) return "rising";
  if (delta < -0.06) return "easing";
  return "stable";
}

function buildDrivers(scores: Omit<ToleranceEstimate, "index" | "trend" | "confidence" | "drivers">, streak: number): ToleranceDriver[] {
  const drivers: ToleranceDriver[] = [];

  const push = (
    id: string,
    label: string,
    score: number,
    highDetail: string,
    lowDetail: string,
    neutralDetail: string,
  ) => {
    let contribution: ToleranceDriverContribution = "neutral";
    let detail = neutralDetail;
    if (score > 1.08) {
      contribution = "elevating";
      detail = highDetail;
    } else if (score < 0.92) {
      contribution = "reducing";
      detail = lowDetail;
    }
    drivers.push({ id, label, contribution, detail });
  };

  push(
    "dose-size",
    "Dose size",
    scores.doseSizeScore,
    "Recent average doses are larger than your baseline.",
    "Recent average doses are smaller than your baseline.",
    "Recent dose sizes are near your baseline.",
  );
  push(
    "frequency",
    "Frequency",
    scores.frequencyScore,
    "You are dosing more often than your baseline pattern.",
    "Dosing frequency has been lower than your baseline.",
    "Dosing frequency is near your baseline.",
  );
  push(
    "interval",
    "Spacing",
    scores.intervalScore,
    "Dose intervals have been compressing.",
    "Dose intervals have been widening.",
    "Spacing between doses is near baseline.",
  );
  push(
    "early-redose",
    "Early redosing",
    scores.earlyRedoseScore,
    "Frequent redoses before prior doses likely wore off.",
    "Redosing has mostly waited for prior effects to fade.",
    "Early redosing pattern is moderate.",
  );
  push(
    "escalation",
    "Recent escalation",
    scores.escalationScore,
    "Consumption has been trending up over recent weeks.",
    "Consumption has been trending down over recent weeks.",
    "Recent consumption is steady versus prior weeks.",
  );

  if (streak >= 4) {
    drivers.push({
      id: "streak",
      label: "Use streak",
      contribution: "elevating",
      detail: `${streak} consecutive active day${streak === 1 ? "" : "s"} adds streak pressure.`,
    });
  } else if (streak <= 1 && scores.recoveryScore < 0.98) {
    drivers.push({
      id: "recovery",
      label: "Recovery pattern",
      contribution: "reducing",
      detail: "Sustained lighter use is easing tolerance pressure.",
    });
  }

  return drivers.slice(0, 6);
}

export function calculateBehavioralTolerance(
  doses: Dose[],
  profile: Profile,
  nowMs: number,
): ToleranceEstimate {
  const pool = depressantDoses(doses.filter((d) => d.ts <= nowMs));
  const confidence = resolveConfidence(pool.length);

  if (pool.length < MIN_DOSES_CALIBRATING) {
    return {
      index: 1,
      trend: "stable",
      confidence,
      drivers: [
        {
          id: "calibrating",
          label: "Calibrating",
          contribution: "neutral",
          detail: "Log more doses to refine your tolerance estimate.",
        },
      ],
      doseSizeScore: 1,
      frequencyScore: 1,
      intervalScore: 1,
      volumeScore: 1,
      activeDayScore: 1,
      streakScore: 1,
      earlyRedoseScore: 1,
      escalationScore: 1,
      recoveryScore: 1,
      rawComposite: 1,
    };
  }

  const scores = computeCompositeScores(pool, profile, nowMs);
  const index = mapCompositeToIndex(scores.rawComposite);
  const trend = resolveTrend(pool, profile, nowMs, scores.rawComposite);
  const streak = consecutiveUseStreak(pool, nowMs);
  const drivers = buildDrivers(scores, streak);

  return {
    index,
    trend,
    confidence,
    drivers,
    ...scores,
  };
}

export function formatToleranceIndex(index: number): string {
  if (!Number.isFinite(index)) return "1.00×";
  return `${index.toFixed(2)}×`;
}

export function toleranceTrendLabel(trend: ToleranceTrend): string {
  if (trend === "rising") return "Rising";
  if (trend === "easing") return "Easing";
  return "Stable";
}

export function describeToleranceState(tolerance: ToleranceEstimate): {
  status: "calibrating" | "baseline" | "elevated" | "high";
  label: string;
  detail: string;
} {
  if (tolerance.confidence === "calibrating") {
    return {
      status: "calibrating",
      label: "Calibrating",
      detail: "Log more doses to estimate how your use pattern affects perceived intensity.",
    };
  }
  if (tolerance.index <= 1.05) {
    return {
      status: "baseline",
      label: "Baseline sensitivity",
      detail: "Effects likely land close to your anchor dose at peak.",
    };
  }
  if (tolerance.index <= 1.45) {
    return {
      status: "elevated",
      label: "Elevated tolerance",
      detail: "Same doses likely feel weaker and wear off sooner for you.",
    };
  }
  return {
    status: "high",
    label: "High tolerance",
    detail: "Heavy recent use likely dampens peak perceived effects noticeably.",
  };
}
