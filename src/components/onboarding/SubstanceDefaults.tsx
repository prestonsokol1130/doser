import { useState } from 'react'
import type { Profile } from '../../types'
import { OnboardingField } from './OnboardingField'
import { OnboardingLayout } from './OnboardingLayout'

type SubstanceDefaultsProps = {
  profile: Profile
  onChange: (profile: Profile) => void
  onNext: () => void
  onBack: () => void
}

function isSubstancePrefsValid(
  doseMl: number,
  intervalMinutes: number,
): boolean {
  return (
    Number.isFinite(doseMl) &&
    doseMl > 0 &&
    Number.isFinite(intervalMinutes) &&
    intervalMinutes >= 15
  )
}

function parseDoseMl(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function SubstanceDefaults({
  profile,
  onChange,
  onNext,
  onBack,
}: SubstanceDefaultsProps) {
  const [gblDoseStr, setGblDoseStr] = useState(
    () => String(profile.gbl.preferredDoseMl),
  )
  const [bdoDoseStr, setBdoDoseStr] = useState(
    () => String(profile.bdo.preferredDoseMl),
  )

  function commitGblDose(value: string) {
    onChange({
      ...profile,
      gbl: {
        ...profile.gbl,
        preferredDoseMl: parseDoseMl(value),
      },
    })
  }

  function commitBdoDose(value: string) {
    onChange({
      ...profile,
      bdo: {
        ...profile.bdo,
        preferredDoseMl: parseDoseMl(value),
      },
    })
  }

  const gblValid = isSubstancePrefsValid(
    parseDoseMl(gblDoseStr),
    profile.gbl.preferredIntervalMinutes,
  )
  const bdoValid = isSubstancePrefsValid(
    parseDoseMl(bdoDoseStr),
    profile.bdo.preferredIntervalMinutes,
  )

  function handleContinue() {
    onChange({
      ...profile,
      gbl: {
        ...profile.gbl,
        preferredDoseMl: parseDoseMl(gblDoseStr),
      },
      bdo: {
        ...profile.bdo,
        preferredDoseMl: parseDoseMl(bdoDoseStr),
      },
    })
    onNext()
  }

  return (
    <OnboardingLayout
      title="Substance Defaults"
      actionLabel="Continue"
      onAction={handleContinue}
      onBack={onBack}
      actionDisabled={!gblValid || !bdoValid}
    >
      <p className="text-sm leading-relaxed text-[var(--color-text-dim)]">
        Set your preferred dose and interval for each substance. You can change
        these later in Settings.
      </p>

      <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-purple)]">
          GBL
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <OnboardingField
            id="gbl-dose"
            label="Preferred Dose (mL)"
            type="text"
            inputMode="decimal"
            value={gblDoseStr}
            onChange={setGblDoseStr}
            onBlur={() => commitGblDose(gblDoseStr)}
          />
          <OnboardingField
            id="gbl-interval"
            label="Preferred Interval (minutes)"
            type="number"
            inputMode="numeric"
            step={5}
            min={15}
            value={String(profile.gbl.preferredIntervalMinutes)}
            onChange={(value) =>
              onChange({
                ...profile,
                gbl: {
                  ...profile.gbl,
                  preferredIntervalMinutes: Number(value),
                },
              })
            }
          />
        </div>
      </div>

      <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-purple)]">
          BDO
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <OnboardingField
            id="bdo-dose"
            label="Preferred Dose (mL)"
            type="text"
            inputMode="decimal"
            value={bdoDoseStr}
            onChange={setBdoDoseStr}
            onBlur={() => commitBdoDose(bdoDoseStr)}
          />
          <OnboardingField
            id="bdo-interval"
            label="Preferred Interval (minutes)"
            type="number"
            inputMode="numeric"
            step={5}
            min={15}
            value={String(profile.bdo.preferredIntervalMinutes)}
            onChange={(value) =>
              onChange({
                ...profile,
                bdo: {
                  ...profile.bdo,
                  preferredIntervalMinutes: Number(value),
                },
              })
            }
          />
        </div>
      </div>
    </OnboardingLayout>
  )
}
