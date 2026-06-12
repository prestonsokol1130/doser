import { useMemo, useState } from 'react'
import {
  buildDoseBuddySuggestion,
  type DoseBuddySuggestion,
} from '@/lib/doseBuddy'
import type { Dose, DoseContext, Profile, Substance } from '@/types'
import {
  DoseBuddySelector,
  FOOD_OPTIONS,
  HYDRATION_OPTIONS,
  LAST_DOSE_FEEDBACK_OPTIONS,
  SLEEP_OPTIONS,
} from '../tools/DoseBuddyControls'

type DoseBuddyCheckInSheetProps = {
  profile: Profile
  doses: Dose[]
  doseContexts: Record<string, DoseContext>
  substance: Substance
  amountMl: number
  nowMs: number
  isRedose: boolean
  context: DoseContext
  onContextChange: React.Dispatch<React.SetStateAction<DoseContext>>
  onSkip: () => void
  onBack: () => void
  onConfirm: () => void
}

function toneClasses(tone: DoseBuddySuggestion['tone']) {
  if (tone === 'wait') {
    return {
      dot: 'bg-[var(--color-action)]',
      text: 'text-[var(--color-action)]',
      border: 'border-[var(--color-action)]',
      surface: 'bg-[color-mix(in_srgb,var(--color-action)_12%,transparent)]',
    }
  }
  if (tone === 'lighter') {
    return {
      dot: 'bg-[var(--color-load)]',
      text: 'text-[var(--color-load)]',
      border: 'border-[var(--color-load)]',
      surface: 'bg-[color-mix(in_srgb,var(--color-load)_12%,transparent)]',
    }
  }
  return {
    dot: 'bg-[var(--color-ring)]',
    text: 'text-[var(--color-ring)]',
    border: 'border-[var(--color-ring)]',
    surface: 'bg-[color-mix(in_srgb,var(--color-ring)_12%,transparent)]',
  }
}

export function DoseBuddyCheckInSheet({
  profile,
  doses,
  doseContexts,
  substance,
  amountMl,
  nowMs,
  isRedose,
  context,
  onContextChange,
  onSkip,
  onBack,
  onConfirm,
}: DoseBuddyCheckInSheetProps) {
  const [showWhy, setShowWhy] = useState(false)

  const suggestion = useMemo(
    () =>
      buildDoseBuddySuggestion({
        substance,
        profile,
        doses,
        doseContexts,
        draftContext: context,
        nowMs,
      }),
    [context, doseContexts, doses, nowMs, profile, substance],
  )

  const palette = toneClasses(suggestion.tone)

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[var(--app-bg)]">
      <div className="relative flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
        <span
          className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-ring)]"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          Dose Buddy
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="text-[10px] uppercase tracking-[0.18em] text-[var(--app-dim)] outline-none transition-opacity duration-[150ms] hover:opacity-80"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          Skip
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(16px,env(safe-area-inset-bottom))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)]">
          <div className="px-4 pt-5">
            <h2
              className="text-[30px] leading-tight text-[var(--app-text)]"
              style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
            >
              Ready to dose?
            </h2>

            {profile.doseBuddy.showRecommendation ? (
              <>
                <div
                  className={`mt-4 rounded-[16px] border px-4 py-3.5 ${palette.border} ${palette.surface}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${palette.dot}`} />
                    <p
                      className={`text-[14px] leading-snug ${palette.text}`}
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                    >
                      Suggested dose: {suggestion.suggestedMinMl.toFixed(1)}–
                      {suggestion.suggestedMaxMl.toFixed(1)} mL
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-bg)]">
                  <button
                    type="button"
                    onClick={() => setShowWhy((value) => !value)}
                    aria-expanded={showWhy}
                    className="flex w-full items-center justify-between px-4 py-3 text-left outline-none transition-opacity duration-[150ms] hover:opacity-80"
                  >
                    <span
                      className="text-[13px] text-[var(--app-dim)]"
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                    >
                      Why this suggestion
                    </span>
                    <span
                      className="text-[20px] leading-none text-[var(--app-dim)]"
                      style={{ fontFamily: 'var(--font-body)' }}
                      aria-hidden
                    >
                      {showWhy ? '−' : '+'}
                    </span>
                  </button>

                  {showWhy ? (
                    <div className="max-h-[28vh] overflow-y-auto border-t border-[var(--app-divider)] px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex flex-col gap-2.5">
                        <div>
                          <p
                            className={`text-[14px] leading-snug ${palette.text}`}
                            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                          >
                            {suggestion.headline}
                          </p>
                          <p
                            className="mt-1.5 text-[13px] leading-5 text-[var(--app-dim)]"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            {suggestion.summary}
                          </p>
                        </div>

                        {suggestion.reasons.map((reason) => (
                          <div key={reason.label}>
                            <p
                              className="text-[10px] uppercase tracking-[0.16em] text-[var(--app-faint)]"
                              style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
                            >
                              {reason.label}
                            </p>
                            <p
                              className="mt-1 text-[13px] leading-5 text-[var(--app-text)]"
                              style={{ fontFamily: 'var(--font-body)' }}
                            >
                              {reason.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="mt-4 pb-1">
              <div className="dose-buddy-checkin-selectors rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-bg)] p-3 [&_.grid]:gap-2 [&_button]:min-h-[42px] [&_button]:px-2.5 [&_button]:py-2 [&_button]:text-[13px] [&_div.flex.flex-col]:gap-2">
                <div className="flex flex-col gap-2.5">
                  <DoseBuddySelector
                    label="Sleep"
                    value={context.sleepLevel}
                    options={SLEEP_OPTIONS}
                    onChange={(sleepLevel) =>
                      onContextChange((prev) => ({ ...prev, sleepLevel }))
                    }
                  />
                  <DoseBuddySelector
                    label="Food"
                    value={context.foodState}
                    options={FOOD_OPTIONS}
                    onChange={(foodState) =>
                      onContextChange((prev) => ({ ...prev, foodState }))
                    }
                  />
                  <DoseBuddySelector
                    label="Hydration"
                    value={context.hydrationState}
                    options={HYDRATION_OPTIONS}
                    onChange={(hydrationState) =>
                      onContextChange((prev) => ({ ...prev, hydrationState }))
                    }
                  />

                  {isRedose ? (
                    <DoseBuddySelector
                      label="How was your last dose?"
                      value={context.lastDoseFeedback ?? null}
                      options={LAST_DOSE_FEEDBACK_OPTIONS}
                      onChange={(lastDoseFeedback) =>
                        onContextChange((prev) => ({
                          ...prev,
                          lastDoseFeedback,
                        }))
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--app-divider)] px-4 pb-5 pt-4">
            <button
              type="button"
              onClick={onConfirm}
              className="flex h-[60px] w-full items-center justify-center rounded-[14px] bg-[var(--color-action)] text-black outline-none transition-opacity duration-[150ms] hover:opacity-90"
            >
              <span
                className="text-[20px] uppercase tracking-[0.04em]"
                style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
              >
                Log Dose
              </span>
              <span
                className="ml-2.5 text-[15px] text-black/60"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                · {amountMl.toFixed(1)} mL {substance}
              </span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="mt-3 w-full py-1 text-center text-[14px] text-[var(--app-dim)] outline-none transition-opacity duration-[150ms] hover:opacity-80"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
