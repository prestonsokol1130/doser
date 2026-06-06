/**
 * Perceived Effect Level — deterministic subjective-intensity engine.
 *
 * Single source of truth for current-state %, forecast sampling, and Dose Buddy inputs.
 * GBL + BDO doses combine into one overlapping depressant effect reading.
 */

import { preferredDoseMl } from "@/store/appStore";
import type { BiologicalSex, Dose, DoseContext, FoodState, HydrationState, Profile, SleepLevel } from "@/types";
import {
  baseEffectFraction,
  DEFAULT_SUBSTANCE_DOSE_ML,
  HOUR_MS,
  isDepressantSubstance,
  isWithinPerceptualWindow,
  MAX_PERCEPTUAL_WEAR_OFF_MS,
  MINUTE_MS,
  peakElapsedMinutes,
  type EffectCurveModifiers,
  type PerceivedSubstance,
} from "@/lib/perceivedEffect/effectCurves";
import {
  calculateBehavioralTolerance,
  depressantDoses,
  type ToleranceConfidence,
  type ToleranceEstimate,
} from "@/lib/perceivedEffect/toleranceModel";

export { HOUR_MS, depressantDoses };

/** Lookback aligned to longest perceptual wear-off window. */
export const PERCEIVED_LOOKBACK_MS = MAX_PERCEPTUAL_WEAR_OFF_MS;
export const PERCEIVED_LOOKBACK_HOURS = PERCEIVED_LOOKBACK_MS / HOUR_MS;

/** Minimum single-dose contribution (0–1 scale) before counting as perceptually active. */
export const MIN_CONTRIBUTION_FRACTION = 0.02;

/**
 * Display saturation tuning.
 *
 * Below SOFT_SAT_LINEAR_CEIL the ratio (stacked intensity / single-dose reference)
 * maps linearly to the displayed percent, so low/mid intensities and the decline
 * tail stay honest. Above it, the curve compresses asymptotically toward 100% so
 * that:
 *   - one solid anchor-size dose at peak reads ~88% (a strong, not maxed, state)
 *   - ordinary overlap reads high-90s but does not peg at 100%
 *   - 100% is only reached in genuinely extreme stacked/large-dose states
 * Width chosen so ratio 1.0 -> 0.88, ratio 1.37 (two equal peaks) -> ~0.96.
 */
const SOFT_SAT_LINEAR_CEIL = 0.6;
const SOFT_SAT_WIDTH = 0.33;

/** Optional per-dose context lookup: dose id -> food/hydration captured for it. */
export type DoseContextMap = Map<string, DoseContext>;

/**
 * Food/hydration context modifiers (moderate by design — never dominant).
 *
 * Food shifts onset/rise timing within the substance's intended peak window and
 * nudges peak intensity:
 *   - empty: faster onset, sharper rise, somewhat stronger peak
 *   - snack (ate recently): neutral baseline
 *   - full:  slower onset, smoother rise, slightly blunted peak
 * Hydration only nudges peak intensity slightly (low = modestly worse landing,
 * good = mild stabilizing); it is intentionally not strongly protective.
 */
const FOOD_CURVE_MODIFIERS: Record<FoodState, EffectCurveModifiers & { intensityScale: number }> = {
  empty: { onsetScale: 0.85, riseScale: 0.92, intensityScale: 1.08 },
  snack: { onsetScale: 1, riseScale: 1, intensityScale: 1 },
  full: { onsetScale: 1.25, riseScale: 1.15, intensityScale: 0.93 },
};

const HYDRATION_INTENSITY_SCALE: Record<HydrationState, number> = {
  low: 1.03,
  ok: 1,
  good: 0.99,
};

/**
 * Sleep debt modestly raises felt intensity and slightly speeds onset; rested
 * states are a mild stabilizer. Kept moderate — never dominant over dose size.
 */
const SLEEP_INTENSITY_SCALE: Record<SleepLevel, number> = {
  poor: 1.05,
  ok: 1,
  good: 0.98,
};

const SLEEP_ONSET_SCALE: Record<SleepLevel, number> = {
  poor: 0.96,
  ok: 1,
  good: 1.02,
};

function contextCurveModifiers(
  context: DoseContext | undefined,
  declineScale: number,
): { modifiers: EffectCurveModifiers; intensityScale: number } {
  const food = context ? FOOD_CURVE_MODIFIERS[context.foodState] : FOOD_CURVE_MODIFIERS.snack;
  const hydrationIntensity = context ? HYDRATION_INTENSITY_SCALE[context.hydrationState] : 1;
  const sleepLevel = context?.sleepLevel ?? "ok";
  return {
    modifiers: {
      onsetScale: (food.onsetScale ?? 1) * SLEEP_ONSET_SCALE[sleepLevel],
      riseScale: food.riseScale ?? 1,
      declineScale,
    },
    intensityScale: food.intensityScale * hydrationIntensity * SLEEP_INTENSITY_SCALE[sleepLevel],
  };
}

/**
 * Stacking saturation: each additional active dose is discounted by how much
 * perceived intensity is ALREADY present (dynamic overlap discounting), scaled to
 * the single-dose reference. exp(-already/scale) -> the closer you already are to a
 * full felt peak, the less a redose adds. This produces believable diminishing
 * returns instead of additive pile-up.
 */
const SATURATION_HEADROOM = 1.0;

function softSaturate(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  if (ratio <= SOFT_SAT_LINEAR_CEIL) return ratio;
  const over = ratio - SOFT_SAT_LINEAR_CEIL;
  return SOFT_SAT_LINEAR_CEIL + (1 - SOFT_SAT_LINEAR_CEIL) * (1 - Math.exp(-over / SOFT_SAT_WIDTH));
}

export interface PerceivedEffectAt {
  /** Display percent 0–100. */
  percent: number;
  /** Pre-clamp stacked intensity on 0–1+ scale relative to reference peak. */
  rawIntensity: number;
  /** Reference peak intensity used for percent calibration. */
  referencePeak: number;
  toleranceIndex: number;
  contributingDoses: number;
  confidence: ToleranceConfidence;
  tolerance: ToleranceEstimate;
}

function clampWeightKg(weightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return 0;
  return Math.min(200, Math.max(35, weightKg));
}

function clampAdultAge(age: number): number {
  if (!Number.isFinite(age) || age <= 0) return 0;
  return Math.min(90, Math.max(18, Math.floor(age)));
}

function profileIntensityModifier(profile: Profile): number {
  const weightKg = clampWeightKg(profile.weightKg);
  const weightMod = weightKg > 0 ? Math.pow(75 / weightKg, 0.1) : 1;

  const age = clampAdultAge(profile.age);
  const ageMod = age > 0 ? Math.max(0.88, 1 - (age - 30) * 0.0035) : 1;

  let sexMod = 1;
  const sex: BiologicalSex | null = profile.biologicalSex;
  if (sex === "female") sexMod = 1.04;
  else if (sex === "male") sexMod = 0.98;

  return weightMod * ageMod * sexMod;
}

function resolveAnchorDoseMl(
  substance: PerceivedSubstance,
  profile: Profile,
  doses: Dose[],
  nowMs: number,
): number {
  const recent = depressantDoses(doses).filter(
    (d) => d.substance === substance && d.ts >= nowMs - 30 * 24 * HOUR_MS && d.ts <= nowMs,
  );
  if (recent.length >= 3) {
    return recent.reduce((s, d) => s + d.amountMl, 0) / recent.length;
  }

  const preferred = preferredDoseMl(substance, profile);
  if (preferred > 0) return preferred;

  return DEFAULT_SUBSTANCE_DOSE_ML[substance];
}

function toleranceIntensityScale(index: number): number {
  return Math.pow(Math.max(0.5, index), -0.88);
}

/**
 * Tolerance shortens felt duration (faster decline) without moving the peak.
 * Mild and clamped: index 2.0 -> ~1.18x faster post-peak decay.
 */
function toleranceDurationScale(index: number): number {
  const i = Number.isFinite(index) ? index : 1;
  return Math.min(1.45, Math.max(1, 1 + (i - 1) * 0.18));
}

/** True when a dose could still contribute to felt effect at `atMs`. */
export function isDoseInPerceptualWindow(dose: Dose, atMs: number): boolean {
  if (!isDepressantSubstance(dose.substance)) return false;
  if (atMs < dose.ts) return false;
  const elapsedMinutes = (atMs - dose.ts) / MINUTE_MS;
  return isWithinPerceptualWindow(dose.substance, elapsedMinutes);
}

function singleDoseIntensity(
  dose: Dose,
  profile: Profile,
  atMs: number,
  tolerance: ToleranceEstimate,
  allDoses: Dose[],
  context?: DoseContext,
): number {
  if (!isDepressantSubstance(dose.substance)) return 0;
  if (atMs < dose.ts) return 0;

  const substance = dose.substance;
  const elapsedMinutes = (atMs - dose.ts) / MINUTE_MS;
  if (!isWithinPerceptualWindow(substance, elapsedMinutes)) return 0;

  const declineScale = toleranceDurationScale(tolerance.index);
  const { modifiers, intensityScale } = contextCurveModifiers(context, declineScale);
  const base = baseEffectFraction(substance, elapsedMinutes, modifiers);
  if (base <= 0) return 0;

  const anchor = resolveAnchorDoseMl(substance, profile, allDoses, atMs);
  const doseRatio = Math.pow(Math.max(0.1, dose.amountMl / anchor), 0.82);

  const profileMod = profileIntensityModifier(profile);
  const tolMod = toleranceIntensityScale(tolerance.index);

  return base * doseRatio * profileMod * tolMod * intensityScale;
}

/**
 * Combine overlapping per-dose intensities into one felt intensity.
 *
 * The strongest active dose contributes fully; every subsequent dose is discounted
 * by (a) tolerance-driven stack efficiency and (b) how much felt intensity is
 * already present (dynamic overlap discounting via exp headroom). Two doses peaking
 * together therefore read meaningfully higher than one, but a third/fourth add
 * progressively less — believable diminishing returns without additive blow-up.
 */
function combineIntensities(
  intensities: number[],
  toleranceIndex: number,
  saturationScale: number,
): number {
  const sorted = intensities.filter((v) => v > MIN_CONTRIBUTION_FRACTION).sort((a, b) => b - a);
  if (sorted.length === 0) return 0;

  const stackEfficiency = Math.pow(Math.max(0.6, toleranceIndex), -0.3);
  const scale = saturationScale > 0 ? saturationScale * SATURATION_HEADROOM : 1;

  let combined = 0;
  for (let i = 0; i < sorted.length; i++) {
    const efficiency = i === 0 ? 1 : stackEfficiency;
    const headroom = Math.exp(-combined / scale);
    combined += sorted[i] * efficiency * headroom;
  }
  return combined;
}

function substancesInPlay(doses: Dose[], atMs: number): PerceivedSubstance[] {
  const set = new Set<PerceivedSubstance>();
  for (const d of depressantDoses(doses)) {
    if (isDoseInPerceptualWindow(d, atMs) && isDepressantSubstance(d.substance)) {
      set.add(d.substance);
    }
  }
  if (set.size === 0) {
    return ["GBL", "BDO"];
  }
  return [...set];
}

/**
 * Single-dose reference peak: the felt intensity of ONE strong anchor-size dose at
 * its own peak, for a naive (tolerance = 1) user. 100% display is anchored to this
 * realistic single-dose peak — NOT to a stacked sum — so overlap is measured against
 * "one solid dose" rather than "everything peaking at once." Across substances in
 * play we take the max single-dose peak (the dominant substance defines the scale),
 * which lets mixed/overlapping sessions exceed it internally while the displayed
 * percent stays meaningful.
 */
function referencePeakIntensity(
  profile: Profile,
  doses: Dose[],
  atMs: number,
  substances: PerceivedSubstance[],
): number {
  const naiveTolerance: ToleranceEstimate = {
    ...calculateBehavioralTolerance([], profile, atMs),
    index: 1,
  };

  let maxPeak = 0;
  for (const substance of substances) {
    const anchor = resolveAnchorDoseMl(substance, profile, doses, atMs);
    const peakMin = peakElapsedMinutes(substance);
    const synthetic: Dose = {
      id: "__ref__",
      substance,
      amountMl: anchor,
      ts: atMs - peakMin * MINUTE_MS,
    };
    maxPeak = Math.max(maxPeak, singleDoseIntensity(synthetic, profile, atMs, naiveTolerance, doses));
  }

  return Math.max(MIN_CONTRIBUTION_FRACTION, maxPeak);
}

/**
 * Combined perceived effect level at a single instant.
 * Includes all GBL + BDO doses (mixed sessions show one combined reading).
 */
export function computePerceivedEffectLevelAt(
  doses: Dose[],
  profile: Profile,
  atMs: number,
  contextByDoseId?: DoseContextMap,
): PerceivedEffectAt {
  const pool = depressantDoses(doses);
  const tolerance = calculateBehavioralTolerance(pool, profile, atMs);

  const intensities: number[] = [];
  for (const dose of pool) {
    if (!isDoseInPerceptualWindow(dose, atMs)) continue;
    const context = contextByDoseId?.get(dose.id);
    const intensity = singleDoseIntensity(dose, profile, atMs, tolerance, pool, context);
    if (intensity > MIN_CONTRIBUTION_FRACTION) intensities.push(intensity);
  }

  const substances = substancesInPlay(pool, atMs);
  const referencePeak = referencePeakIntensity(profile, pool, atMs, substances);
  const rawIntensity = combineIntensities(intensities, tolerance.index, referencePeak);

  const ratio = referencePeak > 0 ? rawIntensity / referencePeak : 0;
  const percent = Math.min(100, Math.max(0, Math.round(softSaturate(ratio) * 100)));

  return {
    percent,
    rawIntensity,
    referencePeak,
    toleranceIndex: tolerance.index,
    contributingDoses: intensities.length,
    confidence: tolerance.confidence,
    tolerance,
  };
}

/** Per-dose perceived contribution percent relative to reference peak. */
export function computeDosePerceivedPercentAt(
  dose: Dose,
  profile: Profile,
  atMs: number,
  allDoses: Dose[],
  contextByDoseId?: DoseContextMap,
): number {
  if (!isDoseInPerceptualWindow(dose, atMs)) return 0;

  const pool = depressantDoses(allDoses);
  const tolerance = calculateBehavioralTolerance(pool, profile, atMs);
  const intensity = singleDoseIntensity(dose, profile, atMs, tolerance, pool, contextByDoseId?.get(dose.id));
  if (intensity <= MIN_CONTRIBUTION_FRACTION) return 0;

  const substances = substancesInPlay(pool, atMs);
  const referencePeak = referencePeakIntensity(profile, pool, atMs, substances);
  if (referencePeak <= 0) return 0;

  const ratio = intensity / referencePeak;
  return Math.min(100, Math.max(0, Math.round(softSaturate(ratio) * 100)));
}

export function isDosePerceptuallyActive(
  dose: Dose,
  profile: Profile,
  atMs: number,
  allDoses: Dose[],
  contextByDoseId?: DoseContextMap,
): boolean {
  return computeDosePerceivedPercentAt(dose, profile, atMs, allDoses, contextByDoseId) > 0;
}

export function formatPerceivedEffectPct(percent: number): string {
  return `${Math.max(0, Math.round(percent))}%`;
}
