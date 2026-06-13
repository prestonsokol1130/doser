import type { Profile, Substance } from '../../types'
import { SegmentSelector } from './OnboardingField'
import { OnboardingLayout } from './OnboardingLayout'

type SubstancePreferenceProps = {
  profile: Profile
  onChange: (profile: Profile) => void
  onNext: () => void
  onBack: () => void
}

export function SubstancePreference({
  profile,
  onChange,
  onNext,
  onBack,
}: SubstancePreferenceProps) {
  const selected: Substance = profile.defaultSubstance ?? 'GBL'

  function handleContinue() {
    onChange({
      ...profile,
      defaultSubstance: profile.defaultSubstance ?? 'GBL',
    })
    onNext()
  }

  return (
    <OnboardingLayout
      title="Primary Substance"
      actionLabel="Continue"
      onAction={handleContinue}
      onBack={onBack}
    >
      <p className="text-sm leading-relaxed text-[var(--color-text-dim)]">
        Which substance do you primarily use? The timer will start on this
        choice each session. You can change it later in Settings.
      </p>

      <SegmentSelector<Substance>
        label="Primary Substance"
        value={selected}
        options={[
          { value: 'GBL', label: 'GBL' },
          { value: 'BDO', label: 'BDO' },
        ]}
        onChange={(defaultSubstance) =>
          onChange({ ...profile, defaultSubstance })
        }
      />
    </OnboardingLayout>
  )
}
