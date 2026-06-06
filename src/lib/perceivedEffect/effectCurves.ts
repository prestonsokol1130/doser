/**
 * Tunable perceived-effect curves per substance.
 * These model subjective intensity over time — not pharmacokinetic concentration.
 */

export const HOUR_MS = 60 * 60 * 1000;
export const MINUTE_MS = 60 * 1000;

export type PerceivedSubstance = "GBL" | "BDO";

/** Fixed substance defaults when profile/history is sparse. */
export const DEFAULT_SUBSTANCE_DOSE_ML: Record<PerceivedSubstance, number> = {
  GBL: 1.5,
  BDO: 1.8,
};

export interface EffectCurveParams {
  /** Minutes after dose before noticeable effect. */
  onsetMinutes: number;
  /** Minutes from onset to peak plateau. */
  riseMinutes: number;
  /** Minutes at peak plateau before decline begins. */
  peakPlateauMinutes: number;
  /** Perceived decline half-life in minutes (shorter than PK elimination). */
  declineHalfLifeMinutes: number;
}

export const EFFECT_CURVES: Record<PerceivedSubstance, EffectCurveParams> = {
  GBL: {
    onsetMinutes: 10,
    riseMinutes: 18,
    peakPlateauMinutes: 12,
    declineHalfLifeMinutes: 38,
  },
  BDO: {
    onsetMinutes: 22,
    riseMinutes: 28,
    peakPlateauMinutes: 15,
    declineHalfLifeMinutes: 58,
  },
};

/**
 * Minutes after dose when perceived effect is treated as fully worn off.
 * Used for redose detection, dose filtering, and hard curve cutoff.
 */
export const PERCEIVED_WEAR_OFF_MINUTES: Record<PerceivedSubstance, number> = {
  GBL: 180,
  BDO: 300,
};

/** Longest perceptual window across depressants (for lookback alignment). */
export const MAX_PERCEPTUAL_WEAR_OFF_MS =
  Math.max(...Object.values(PERCEIVED_WEAR_OFF_MINUTES)) * MINUTE_MS;

/** Minutes after dose when base curve first reaches peak (end of rise phase). */
export function peakElapsedMinutes(substance: PerceivedSubstance): number {
  const c = EFFECT_CURVES[substance];
  return c.onsetMinutes + c.riseMinutes;
}

export function perceptualWearOffMs(substance: PerceivedSubstance): number {
  return PERCEIVED_WEAR_OFF_MINUTES[substance] * MINUTE_MS;
}

export function isWithinPerceptualWindow(
  substance: PerceivedSubstance,
  elapsedMinutes: number,
): boolean {
  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 0) return false;
  return elapsedMinutes < PERCEIVED_WEAR_OFF_MINUTES[substance];
}

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function posScale(value: number | undefined): number {
  return Number.isFinite(value) && (value as number) > 0 ? (value as number) : 1;
}

export interface EffectCurveModifiers {
  /** Multiplies onset delay. <1 = faster onset (e.g. empty stomach). */
  onsetScale?: number;
  /** Multiplies rise duration. >1 = smoother/slower rise (e.g. full stomach). */
  riseScale?: number;
  /** Multiplies post-peak decline rate. >1 = shorter felt duration (e.g. tolerance). */
  declineScale?: number;
}

/**
 * Base perceived intensity for a single unit dose (0–1) at elapsed minutes since dose.
 * Does not include dose size, profile, tolerance, or context intensity scaling.
 * Returns 0 after perceptual wear-off — no pharmacological tail floor.
 *
 * Modifiers shift onset/rise timing and decline rate only; they never raise the
 * curve above its unit peak (intensity scaling is applied by the caller). Heavy
 * tolerance compresses felt duration; food shifts onset/rise within the substance's
 * intended peak window.
 */
export function baseEffectFraction(
  substance: PerceivedSubstance,
  elapsedMinutes: number,
  modifiers: EffectCurveModifiers = {},
): number {
  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 0) return 0;
  if (!isWithinPerceptualWindow(substance, elapsedMinutes)) return 0;

  const c = EFFECT_CURVES[substance];
  const onsetScale = posScale(modifiers.onsetScale);
  const riseScale = posScale(modifiers.riseScale);
  const declineScale = posScale(modifiers.declineScale);

  const onset = c.onsetMinutes * onsetScale;
  if (elapsedMinutes < onset) return 0;

  const rise = c.riseMinutes * riseScale;
  const riseEnd = onset + rise;
  const peakEnd = riseEnd + c.peakPlateauMinutes;

  let value: number;
  if (elapsedMinutes <= riseEnd) {
    value = smoothstep((elapsedMinutes - onset) / rise);
  } else if (elapsedMinutes <= peakEnd) {
    value = 1;
  } else {
    const declineElapsed = (elapsedMinutes - peakEnd) * declineScale;
    value = Math.pow(0.5, declineElapsed / c.declineHalfLifeMinutes);
  }

  const wearOff = PERCEIVED_WEAR_OFF_MINUTES[substance];
  const fadeStart = wearOff - 25;
  if (elapsedMinutes >= fadeStart) {
    const fade = (wearOff - elapsedMinutes) / (wearOff - fadeStart);
    value *= Math.max(0, fade);
  }

  return Math.max(0, Math.min(1, value));
}

export function isDepressantSubstance(substance: string): substance is PerceivedSubstance {
  return substance === "GBL" || substance === "BDO";
}
