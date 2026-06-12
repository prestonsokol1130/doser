import { computePerceivedEffectLevelAt } from '@/lib/perceivedEffect/perceivedEffectModel'
import {
  calculateBehavioralTolerance,
  describeToleranceState,
} from '@/lib/perceivedEffect/toleranceModel'
import { currentSession, formatIntervalMinutes } from '@/lib/sessionStats'
import { preferredDoseMl, preferredIntervalMinutes } from '@/store/appStore'
import type {
  Dose,
  DoseBuddyLastDoseFeedback,
  DoseContext,
  FoodState,
  HydrationState,
  Profile,
  SleepLevel,
  Substance,
} from '@/types'

export type DoseContextMap = Map<string, DoseContext>

export function buildDoseContextMap(
  contexts: Record<string, DoseContext>,
): DoseContextMap {
  return new Map(Object.entries(contexts))
}

export const DEFAULT_DOSE_CONTEXT: DoseContext = {
  foodState: 'snack',
  hydrationState: 'ok',
  sleepLevel: 'ok',
  lastDoseFeedback: null,
}

type SuggestionTone = 'clear' | 'lighter' | 'wait'

type SuggestionReason = {
  label: string
  detail: string
}

export type DoseBuddySuggestion = {
  tone: SuggestionTone
  headline: string
  summary: string
  suggestedMinMl: number
  suggestedMaxMl: number
  reasons: SuggestionReason[]
}

export function isValidLastDoseFeedback(
  value: unknown,
): value is DoseBuddyLastDoseFeedback {
  return (
    value === 'too_much' ||
    value === 'not_enough' ||
    value === 'just_right' ||
    value === 'couldnt_feel_it' ||
    value === 'dont_remember'
  )
}

function clampDoseAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0.1
  return Math.max(0.1, Math.min(10, Math.round(amount * 10) / 10))
}

function formatContextSummary(
  sleepLevel: SleepLevel,
  foodState: FoodState,
  hydrationState: HydrationState,
): string {
  const sleep =
    sleepLevel === 'poor' ? 'lighter sleep' : sleepLevel === 'good' ? 'rested' : 'average sleep'
  const food =
    foodState === 'empty' ? 'empty stomach' : foodState === 'full' ? 'full stomach' : 'recent food'
  const hydration =
    hydrationState === 'low' ? 'low hydration' : hydrationState === 'good' ? 'good hydration' : 'steady hydration'
  return `${sleep}, ${food}, ${hydration}.`
}

function feedbackAdjustment(
  feedback: DoseBuddyLastDoseFeedback | null | undefined,
): number {
  if (feedback === 'too_much') return -0.18
  if (feedback === 'just_right') return -0.08
  if (feedback === 'dont_remember') return -0.06
  if (feedback === 'not_enough') return 0.02
  return 0
}

export function buildDoseBuddySuggestion(args: {
  substance: Substance
  profile: Profile
  doses: Dose[]
  doseContexts: Record<string, DoseContext>
  draftContext: DoseContext
  nowMs: number
}): DoseBuddySuggestion {
  const { substance, profile, doses, doseContexts, draftContext, nowMs } = args
  const pool = [...doses].sort((a, b) => a.ts - b.ts)
  const session = currentSession(pool, substance, nowMs)
  const lastSameSubstanceDose = session[session.length - 1] ?? null
  const isRedose = lastSameSubstanceDose != null

  const contextMap = buildDoseContextMap(doseContexts)
  const perceived = computePerceivedEffectLevelAt(pool, profile, nowMs, contextMap)
  const tolerance = calculateBehavioralTolerance(pool, profile, nowMs)
  const toleranceState = describeToleranceState(tolerance)

  const preferredDose = preferredDoseMl(substance, profile)
  const preferredInterval = preferredIntervalMinutes(substance, profile)

  let multiplier = 1
  let caution = 0

  if (draftContext.sleepLevel === 'poor') {
    multiplier -= 0.08
    caution += 0.16
  }
  if (draftContext.foodState === 'empty') {
    multiplier -= 0.06
    caution += 0.12
  }
  if (draftContext.hydrationState === 'low') {
    multiplier -= 0.05
    caution += 0.08
  }

  const feedbackDelta = feedbackAdjustment(draftContext.lastDoseFeedback)
  multiplier += feedbackDelta
  if (draftContext.lastDoseFeedback === 'too_much') caution += 0.16
  if (draftContext.lastDoseFeedback === 'dont_remember') caution += 0.04

  if (isRedose) {
    if (perceived.percent >= 70) {
      multiplier -= 0.16
      caution += 0.26
    } else if (perceived.percent >= 45) {
      multiplier -= 0.1
      caution += 0.14
    } else if (perceived.percent >= 20) {
      multiplier -= 0.05
      caution += 0.06
    }
  }

  if (session.length >= 3) {
    multiplier -= 0.05
    caution += 0.06
  }

  if (tolerance.confidence !== 'calibrating' && tolerance.index > 1.3) {
    multiplier += Math.min(0.05, (tolerance.index - 1.3) * 0.08)
  }

  const center = clampDoseAmount(preferredDose * multiplier)
  const windowTightness = caution >= 0.22 ? 0.1 : 0.2
  const suggestedMinMl = clampDoseAmount(center - windowTightness)
  const suggestedMaxMl = clampDoseAmount(center + windowTightness)

  const reasons: SuggestionReason[] = []

  if (lastSameSubstanceDose) {
    const gapMinutes = Math.max(1, Math.round((nowMs - lastSameSubstanceDose.ts) / 60000))
    reasons.push({
      label: 'Spacing',
      detail: `${gapMinutes}m since last ${substance} dose; preferred interval ${formatIntervalMinutes(preferredInterval)}.`,
    })
  } else {
    reasons.push({
      label: 'Spacing',
      detail: `No prior ${substance} dose in this session; preferred interval ${formatIntervalMinutes(preferredInterval)}.`,
    })
  }

  reasons.push({
    label: 'Active load',
    detail: `Perceived effect level ${perceived.percent}% with ${perceived.contributingDoses} active contribution${perceived.contributingDoses === 1 ? '' : 's'}.`,
  })

  reasons.push({
    label: 'Current inputs',
    detail: formatContextSummary(
      draftContext.sleepLevel,
      draftContext.foodState,
      draftContext.hydrationState,
    ),
  })

  reasons.push({
    label: 'Tolerance trend',
    detail: `${toleranceState.label}. ${toleranceState.detail}`,
  })

  if (caution >= 0.34 || (isRedose && perceived.percent >= 70)) {
    return {
      tone: 'wait',
      headline: 'Better to wait a bit',
      summary: 'Current load or context suggests holding off before another dose.',
      suggestedMinMl,
      suggestedMaxMl,
      reasons,
    }
  }

  if (caution >= 0.16) {
    return {
      tone: 'lighter',
      headline: 'Go lighter if you continue',
      summary: 'These inputs point toward a smaller, more conservative dose.',
      suggestedMinMl,
      suggestedMaxMl,
      reasons,
    }
  }

  return {
    tone: 'clear',
    headline: 'Clear to keep it measured',
    summary: 'Spacing and current inputs look manageable if you stay conservative.',
    suggestedMinMl,
    suggestedMaxMl,
    reasons,
  }
}
