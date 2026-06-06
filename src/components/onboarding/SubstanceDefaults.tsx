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

export function SubstanceDefaults({
  profile,
  onChange,
  onNext,
  onBack,
}: SubstanceDefaultsProps) {
  const gblValid = isSubstancePrefsValid(
    profile.gbl.preferredDoseMl,
    profile.gbl.preferredIntervalMinutes,
  )
  const bdoValid = isSubstancePrefsValid(
    profile.bdo.preferredDoseMl,
    profile.bdo.preferredIntervalMinutes,
  )

  return (
    <OnboardingLayout
      title="Substance Defaults"
      actionLabel="Continue"
      onAction={onNext}
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
            type="number"
            inputMode="decimal"
            step={0.1}
            min={0}
            value={String(profile.gbl.preferredDoseMl)}
            onChange={(value) =>
              onChange({
                ...profile,
                gbl: {
                  ...profile.gbl,
                  preferredDoseMl: Number(value),
                },
              })
            }
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
            type="number"
            inputMode="decimal"
            step={0.1}
            min={0}
            value={String(profile.bdo.preferredDoseMl)}
            onChange={(value) =>
              onChange({
                ...profile,
                bdo: {
                  ...profile.bdo,
                  preferredDoseMl: Number(value),
                },
              })
            }
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
