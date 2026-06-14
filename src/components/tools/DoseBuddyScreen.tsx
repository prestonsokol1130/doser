import { useMemo, useState } from 'react'
import {
  buildDoseBuddySuggestion,
  DEFAULT_DOSE_CONTEXT,
} from '@/lib/doseBuddy'
import { HOUR_MS } from '@/lib/perceivedEffect/effectCurves'
import {
  formatTimeAgo,
  formatIntervalMinutes,
  sessionMetrics,
  splitIntoSessions,
} from '@/lib/sessionStats'
import type { Dose, DoseContext, Profile, Substance } from '@/types'
import { formatTimeShort } from '../timer/timerUtils'
import {
  DoseBuddySelector,
  FOOD_OPTIONS,
  formatLastDoseFeedback,
  HYDRATION_OPTIONS,
  LAST_DOSE_FEEDBACK_OPTIONS,
  SLEEP_OPTIONS,
} from './DoseBuddyControls'
import { SubScreenHeader } from './SubScreenHeader'

type DoseBuddyScreenProps = {
  profile: Profile
  onProfileChange: (profile: Profile) => void
  doses: Dose[]
  doseContexts: Record<string, DoseContext>
  onDoseContextsChange: (contexts: Record<string, DoseContext>) => void
  onBack: () => void
}

type DoseBuddyTab = 'setup' | 'previous-inputs'

type ToggleRowProps = {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7">
      <path
        d="M12 3.5 5.5 6v5.1c0 4.2 2.6 7.9 6.5 9.4 3.9-1.5 6.5-5.2 6.5-9.4V6L12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p
          className="text-[15px] text-[var(--app-text)]"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          {label}
        </p>
        <p
          className="mt-1 text-[13px] leading-5 text-[var(--app-dim)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-10 w-[68px] shrink-0 rounded-full border transition-opacity duration-[150ms] ${
          checked
            ? 'border-[var(--color-ring)] bg-[var(--color-ring)]'
            : 'border-[var(--app-divider)] bg-[var(--app-bg)]'
        }`}
      >
        <span
          className={`absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full transition-[left] duration-[150ms] ${
            checked ? 'left-[calc(100%-2.25rem)] bg-[var(--app-bg)]' : 'left-1 bg-[var(--app-text)]'
          }`}
        />
      </button>
    </div>
  )
}

function formatSessionLabel(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function DoseBuddyScreen({
  profile,
  onProfileChange,
  doses,
  doseContexts,
  onDoseContextsChange,
  onBack,
}: DoseBuddyScreenProps) {
  const [tab, setTab] = useState<DoseBuddyTab>('setup')

  const updateDoseBuddyPrefs = (patch: Partial<Profile['doseBuddy']>) =>
    onProfileChange({
      ...profile,
      doseBuddy: {
        ...profile.doseBuddy,
        ...patch,
      },
    })

  const updateContext = (doseId: string, patch: Partial<DoseContext>) => {
    const current = doseContexts[doseId] ?? DEFAULT_DOSE_CONTEXT
    onDoseContextsChange({
      ...doseContexts,
      [doseId]: { ...current, ...patch },
    })
  }

  const dosesWithInputs = useMemo(() => {
    return [...doses]
      .filter((dose) => doseContexts[dose.id])
      .sort((a, b) => a.ts - b.ts)
  }, [doseContexts, doses])

  const groupedSessions = useMemo(() => {
    return splitIntoSessions(dosesWithInputs, 6 * HOUR_MS).reverse()
  }, [dosesWithInputs])

  const recentSubstance: Substance = useMemo(() => {
    if (doses.length === 0) return 'GBL'
    const latest = doses.reduce((a, b) => (a.ts >= b.ts ? a : b))
    return latest.substance === 'BDO' ? 'BDO' : 'GBL'
  }, [doses])
  const previewSuggestion = useMemo(
    () =>
      buildDoseBuddySuggestion({
        substance: recentSubstance,
        profile,
        doses,
        doseContexts,
        draftContext: DEFAULT_DOSE_CONTEXT,
        nowMs: Date.now(),
      }),
    [doseContexts, doses, profile, recentSubstance],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader
        title="Dose Buddy"
        subtitle="Supportive check-ins and safer suggestions"
        onBack={onBack}
      />

      <div className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-2 rounded-[14px] border border-[var(--app-divider)] bg-[var(--app-bg)] p-1">
          {(
            [
              { id: 'setup' as const, label: 'Setup' },
              { id: 'previous-inputs' as const, label: 'Previous Inputs' },
            ] as const
          ).map((option) => {
            const active = tab === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTab(option.id)}
                className={`rounded-[10px] px-3 py-3 text-[12px] uppercase tracking-[0.14em] outline-none transition-opacity duration-[150ms] ${
                  active
                    ? 'bg-[color-mix(in_srgb,var(--color-ring)_14%,transparent)] text-[var(--color-ring)]'
                    : 'text-[var(--app-dim)]'
                }`}
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tab === 'setup' ? (
          <div className="flex flex-col gap-4">
            <section className="overflow-hidden rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)]">
              <div className="border-b border-[var(--app-divider)] px-5 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-bg)] text-[var(--color-ring)]">
                    <ShieldIcon />
                  </div>
                  <div className="min-w-0">
                    <h2
                      className="text-[19px] text-[var(--app-text)]"
                      style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
                    >
                      Guidance you control
                    </h2>
                    <p
                      className="mt-2 text-[14px] leading-6 text-[var(--app-dim)]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Dose Buddy helps you slow down for a quick check-in before a dose
                      and turns your logged patterns into gentler suggestions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-5">
                <p
                  className="text-[11px] uppercase tracking-[0.22em] text-[var(--app-faint)]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
                >
                  How it works
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  {[
                    {
                      step: '01',
                      title: 'You log a dose',
                      body: 'Dose Buddy can prompt for a quick sleep, food, and hydration check-in.',
                    },
                    {
                      step: '02',
                      title: 'We read the context',
                      body: 'Suggestions are shaped by your profile, prior inputs, timing, and logged patterns.',
                    },
                    {
                      step: '03',
                      title: 'You keep the final say',
                      body: 'It points toward a safer direction, but you decide what to log.',
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-bg)] px-4 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-divider)] bg-[var(--app-surface)] text-[var(--color-ring)]">
                          <span
                            className="text-[12px]"
                            style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
                          >
                            {item.step}
                          </span>
                        </div>
                        <div>
                          <p
                            className="text-[16px] text-[var(--app-text)]"
                            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                          >
                            {item.title}
                          </p>
                          <p
                            className="mt-1 text-[14px] leading-6 text-[var(--app-dim)]"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            {item.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-bg)] px-4 py-4">
                  <p
                    className="text-[14px] leading-6 text-[var(--app-dim)]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Dose Buddy offers guidance based on your profile and prior inputs.
                    It is only a suggestion, not medical advice.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      'Age',
                      'Body weight',
                      'Height',
                      'Biological sex',
                      'Prior check-ins',
                      'Dose patterns',
                      'Tolerance trends',
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-[10px] border border-[var(--color-action)] bg-[color-mix(in_srgb,var(--color-action)_12%,transparent)] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-action)]"
                        style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)]">
              <div className="px-5 py-4">
                <p
                  className="text-[11px] uppercase tracking-[0.22em] text-[var(--app-faint)]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
                >
                  Settings
                </p>
              </div>

              <ToggleRow
                label="Enable Dose Buddy"
                description="Turn on check-ins and supportive dose guidance."
                checked={profile.doseBuddy.enabled}
                onChange={(enabled) => updateDoseBuddyPrefs({ enabled })}
              />
              <div className="mx-5 border-t border-[var(--app-divider)]" />
              <ToggleRow
                label="Check-in before dose"
                description="Prompt before logging at session start and on redose."
                checked={profile.doseBuddy.checkInBeforeDose}
                onChange={(checkInBeforeDose) =>
                  updateDoseBuddyPrefs({ checkInBeforeDose })
                }
              />
              <div className="mx-5 border-t border-[var(--app-divider)]" />
              <ToggleRow
                label="Show recommendation"
                description={`Surface a conservative suggestion around ${previewSuggestion.suggestedMinMl.toFixed(1)}-${previewSuggestion.suggestedMaxMl.toFixed(1)} mL when the check-in opens.`}
                checked={profile.doseBuddy.showRecommendation}
                onChange={(showRecommendation) =>
                  updateDoseBuddyPrefs({ showRecommendation })
                }
              />
            </section>
          </div>
        ) : dosesWithInputs.length === 0 ? (
          <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-5 py-8 text-center">
            <p
              className="text-[16px] text-[var(--app-text)]"
              style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
            >
              No previous inputs yet
            </p>
            <p
              className="mt-2 text-[14px] leading-6 text-[var(--app-dim)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Once Dose Buddy check-ins are used during a session, they will show up
              here for review and editing.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groupedSessions.map((session, sessionIndex) => {
              const metrics = sessionMetrics(session)
              const firstTs = session[0]?.ts ?? Date.now()
              return (
                <section
                  key={`${firstTs}-${sessionIndex}`}
                  className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-divider)] pb-4">
                    <div>
                      <p
                        className="text-[16px] text-[var(--app-text)]"
                        style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
                      >
                        Session {groupedSessions.length - sessionIndex}
                      </p>
                      <p
                        className="mt-1 text-[13px] text-[var(--app-dim)]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {formatSessionLabel(firstTs)} · {metrics.doseCount} dose{metrics.doseCount === 1 ? '' : 's'} · {metrics.totalMl.toFixed(1)} mL
                      </p>
                    </div>
                    <span
                      className="rounded-[10px] border border-[var(--app-divider)] bg-[var(--app-bg)] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-[var(--app-dim)]"
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                    >
                      Avg spacing {formatIntervalMinutes(metrics.avgSpacingMinutes)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-4">
                    {[...session].reverse().map((dose) => {
                      const ctx = doseContexts[dose.id] ?? DEFAULT_DOSE_CONTEXT
                      const suggestion = buildDoseBuddySuggestion({
                        substance: dose.substance === 'BDO' ? 'BDO' : 'GBL',
                        profile,
                        doses: doses.filter((item) => item.ts <= dose.ts),
                        doseContexts,
                        draftContext: ctx,
                        nowMs: dose.ts,
                      })

                      return (
                        <article
                          key={dose.id}
                          className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-bg)] p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p
                                className="text-[15px] text-[var(--app-text)]"
                                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                              >
                                {dose.amountMl.toFixed(2)} mL {dose.substance}
                              </p>
                              <p
                                className="mt-1 text-[13px] text-[var(--app-dim)]"
                                style={{ fontFamily: 'var(--font-body)' }}
                              >
                                {formatTimeShort(dose.ts)} · {formatTimeAgo(dose.ts, Date.now())}
                              </p>
                            </div>
                            <span
                              className="rounded-[10px] border border-[var(--color-ring)] bg-[color-mix(in_srgb,var(--color-ring)_14%,transparent)] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ring)]"
                              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                            >
                              {suggestion.suggestedMinMl.toFixed(1)}-{suggestion.suggestedMaxMl.toFixed(1)} mL
                            </span>
                          </div>

                          <div className="mt-4 flex flex-col gap-4">
                            <DoseBuddySelector
                              label="Sleep"
                              value={ctx.sleepLevel}
                              options={SLEEP_OPTIONS}
                              onChange={(sleepLevel) =>
                                updateContext(dose.id, { sleepLevel })
                              }
                            />
                            <DoseBuddySelector
                              label="Food"
                              value={ctx.foodState}
                              options={FOOD_OPTIONS}
                              onChange={(foodState) =>
                                updateContext(dose.id, { foodState })
                              }
                            />
                            <DoseBuddySelector
                              label="Hydration"
                              value={ctx.hydrationState}
                              options={HYDRATION_OPTIONS}
                              onChange={(hydrationState) =>
                                updateContext(dose.id, { hydrationState })
                              }
                            />

                            {ctx.lastDoseFeedback != null ? (
                              <DoseBuddySelector
                                label="Last dose felt"
                                value={ctx.lastDoseFeedback}
                                options={LAST_DOSE_FEEDBACK_OPTIONS}
                                onChange={(lastDoseFeedback) =>
                                  updateContext(dose.id, { lastDoseFeedback })
                                }
                              />
                            ) : (
                              <div className="rounded-[10px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-3">
                                <p
                                  className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
                                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                                >
                                  Last dose felt
                                </p>
                                <p
                                  className="mt-2 text-[14px] text-[var(--app-dim)]"
                                  style={{ fontFamily: 'var(--font-body)' }}
                                >
                                  Not collected for this dose.
                                </p>
                              </div>
                            )}
                          </div>

                          <p
                            className="mt-4 text-[12px] leading-5 text-[var(--app-faint)]"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            Suggestion at log time: {suggestion.headline.toLowerCase()}
                            {ctx.lastDoseFeedback
                              ? ` · prior response: ${formatLastDoseFeedback(ctx.lastDoseFeedback).toLowerCase()}`
                              : ''}
                          </p>
                        </article>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
