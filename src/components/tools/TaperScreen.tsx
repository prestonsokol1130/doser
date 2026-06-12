import { useState } from 'react'
import type { Profile, Substance } from '@/types'
import {
  taperDaysUntilNextStep,
  taperedDoseMl,
  taperStepsCompleted,
} from '@/lib/taper'
import { FormField, ToggleField } from './FormField'
import { SubScreenHeader } from './SubScreenHeader'

type TaperScreenProps = {
  profile: Profile
  onProfileChange: (profile: Profile) => void
  nowMs: number
  onBack: () => void
}

function parsePositive(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function TaperScreen({
  profile,
  onProfileChange,
  nowMs,
  onBack,
}: TaperScreenProps) {
  const { taper } = profile
  const [startStr, setStartStr] = useState(() => String(taper.startDoseMl))
  const [targetStr, setTargetStr] = useState(() => String(taper.targetDoseMl))
  const [reductionStr, setReductionStr] = useState(() =>
    String(taper.reductionMlPerStep),
  )
  const [intervalStr, setIntervalStr] = useState(() =>
    String(taper.stepIntervalDays),
  )

  const todayDose = taperedDoseMl(taper, nowMs)
  const steps = taperStepsCompleted(taper, nowMs)
  const daysUntil = taperDaysUntilNextStep(taper, nowMs)

  function patchTaper(patch: Partial<Profile['taper']>) {
    onProfileChange({
      ...profile,
      taper: { ...taper, ...patch },
    })
  }

  function commitFields() {
    patchTaper({
      startDoseMl: parsePositive(startStr, taper.startDoseMl),
      targetDoseMl: parsePositive(targetStr, taper.targetDoseMl),
      reductionMlPerStep: parsePositive(reductionStr, taper.reductionMlPerStep),
      stepIntervalDays: Math.round(
        parsePositive(intervalStr, taper.stepIntervalDays),
      ),
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader
        title="Taper"
        subtitle="Gradual dose reduction schedule"
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ToggleField
          label="Active Taper"
          description="Follow a step-down schedule you define."
          checked={taper.active}
          onChange={(active) =>
            patchTaper({
              active,
              startedAt: active ? Date.now() : taper.startedAt,
            })
          }
        />

        {taper.active && todayDose != null ? (
          <div className="mt-4 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
            <p
              className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Today&apos;s Target
            </p>
            <p
              className="mt-1 text-[28px] text-[var(--color-ring)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {todayDose.toFixed(2)} mL
            </p>
            <p
              className="mt-2 text-[12px] text-[var(--app-dim)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Step {steps} completed
              {daysUntil != null ? ` · Next step in ${daysUntil} day(s)` : ''}
            </p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <span
              className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Substance
            </span>
            <div className="mt-2 flex gap-2">
              {(['GBL', 'BDO'] as Substance[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => patchTaper({ substance: option })}
                  className={`flex-1 rounded-[10px] border py-2 text-[10px] uppercase tracking-[0.12em] outline-none ${
                    taper.substance === option
                      ? 'border-[var(--color-ring)] text-[var(--color-ring)]'
                      : 'border-[var(--app-divider)] text-[var(--app-faint)]'
                  }`}
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <FormField
            id="taper-start"
            label="Starting Dose (mL)"
            type="text"
            inputMode="decimal"
            value={startStr}
            onChange={setStartStr}
            onBlur={commitFields}
          />
          <FormField
            id="taper-target"
            label="Target Dose (mL)"
            type="text"
            inputMode="decimal"
            value={targetStr}
            onChange={setTargetStr}
            onBlur={commitFields}
          />
          <FormField
            id="taper-reduction"
            label="Reduction Per Step (mL)"
            type="text"
            inputMode="decimal"
            value={reductionStr}
            onChange={setReductionStr}
            onBlur={commitFields}
          />
          <FormField
            id="taper-interval"
            label="Days Between Steps"
            type="number"
            inputMode="numeric"
            min={1}
            value={intervalStr}
            onChange={setIntervalStr}
            onBlur={commitFields}
          />

          <p
            className="text-[12px] text-[var(--app-dim)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            This schedule is a planning aid only. Adjust with a clinician if you
            are reducing use. Doser does not guarantee safety at any dose level.
          </p>
        </div>
      </div>
    </div>
  )
}
