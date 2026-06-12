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
  const [showWhy, setShowWhy] = useState(isRedose)

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
      <div className="relative flex items-center justify-between px-5 pt-5">
        <span
          className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-ring)]"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          Dose Buddy
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="text-[11px] uppercase tracking-[0.2em] text-[var(--app-dim)] outline-none transition-opacity duration-[150ms] hover:opacity-80"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          Skip
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)]">
          <div className="px-5 pt-8">
            <h2
              className="text-[34px] leading-[0.98] text-[var(--app-text)]"
              style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
            >
              Ready to dose?
            </h2>
            <p
              className="mt-4 text-[14px] leading-6 text-[var(--app-dim)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {isRedose
                ? 'Redose check-in · take a moment to confirm context before logging.'
                : 'First dose of this session · take a moment to set up.'}
            </p>

            {profile.doseBuddy.showRecommendation ? (
              <>
                <div
                  className={`mt-7 rounded-[16px] border px-5 py-5 ${palette.border} ${palette.surface}`}
                >
                  <div className="grid grid-cols-[1fr,auto] gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`h-4 w-4 rounded-full ${palette.dot}`} />
                        <p
                          className={`text-[16px] ${palette.text}`}
                          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                        >
                          {suggestion.headline}
                        </p>
                      </div>
                      <p
                        className="mt-3 text-[14px] leading-6 text-[var(--app-dim)]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {suggestion.summary}
                      </p>
                    </div>

                    <div className="flex min-w-[112px] flex-col items-end justify-center border-l border-[var(--app-divider)] pl-4">
                      <p
                        className="text-[17px] text-[var(--app-text)]"
                        style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
                      >
                        {suggestion.suggestedMinMl.toFixed(1)}-{suggestion.suggestedMaxMl.toFixed(1)} mL
                      </p>
                      <span
                        className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
                        style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                      >
                        Suggested
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-bg)]">
                  <button
                    type="button"
                    onClick={() => setShowWhy((value) => !value)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left outline-none"
                  >
                    <span
                      className="text-[14px] text-[var(--app-dim)]"
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                    >
                      Why this suggestion
                    </span>
                    <span
                      className="text-[26px] leading-none text-[var(--app-dim)]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {showWhy ? '−' : '+'}
                    </span>
                  </button>

                  {showWhy ? (
                    <div className="border-t border-[var(--app-divider)] px-5 py-4">
                      <div className="flex flex-col gap-4">
                        {suggestion.reasons.map((reason) => (
                          <div key={reason.label}>
                            <p
                              className="text-[11px] uppercase tracking-[0.18em] text-[var(--app-faint)]"
                              style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
                            >
                              {reason.label}
                            </p>
                            <p
                              className="mt-2 text-[14px] leading-6 text-[var(--app-text)]"
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

            <div className="mt-7 pb-6">
              <p
                className="text-[12px] uppercase tracking-[0.24em] text-[var(--app-dim)]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Before this dose · optional
              </p>

              <div className="mt-5 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-bg)] p-4">
                <div className="flex flex-col gap-4">
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

          <div className="border-t border-[var(--app-divider)] px-5 pb-8 pt-6">
            <button
              type="button"
              onClick={onConfirm}
              className="flex h-[78px] w-full items-center justify-center rounded-[14px] bg-[var(--color-action)] text-black outline-none transition-opacity duration-[150ms] hover:opacity-90"
            >
              <span
                className="text-[24px] uppercase tracking-[0.04em]"
                style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
              >
                Log Dose
              </span>
              <span
                className="ml-3 text-[18px] text-black/60"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                · {amountMl.toFixed(1)} mL {substance}
              </span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="mt-5 w-full text-center text-[15px] text-[var(--app-dim)] outline-none transition-opacity duration-[150ms] hover:opacity-80"
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
