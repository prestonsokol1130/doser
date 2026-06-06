import { useState } from 'react'
import {
  cmToIn,
  kgToLbs,
  normalizeHeightToCm,
  normalizeWeightToKg,
} from '../../lib/metabolicProfile'
import type { BiologicalSex, Profile, WeightUnit } from '../../types'
import {
  OnboardingField,
  SegmentSelector,
  UnitToggle,
} from './OnboardingField'
import { OnboardingLayout } from './OnboardingLayout'

type ProfileSetupProps = {
  profile: Profile
  onChange: (profile: Profile) => void
  onNext: () => void
}

function formatWeightInput(kg: number, unit: WeightUnit): string {
  if (kg <= 0) return ''
  return unit === 'lbs' ? String(kgToLbs(kg)) : String(kg)
}

function parseWeightKg(raw: string, unit: WeightUnit): number {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '.') return 0
  const value = Number(trimmed)
  if (!Number.isFinite(value) || value <= 0) return 0
  return normalizeWeightToKg(value, unit)
}

export function ProfileSetup({ profile, onChange, onNext }: ProfileSetupProps) {
  const [weightInput, setWeightInput] = useState(() =>
    formatWeightInput(profile.weightKg, profile.weightUnit),
  )

  const heightDisplay =
    profile.heightUnit === 'in' && profile.heightCm > 0
      ? cmToIn(profile.heightCm)
      : profile.heightCm

  const ageValid = profile.age >= 18 && profile.age <= 120
  const weightKg = parseWeightKg(weightInput, profile.weightUnit)
  const weightValid = weightKg >= 20 && weightKg <= 400
  const heightValid = profile.heightCm >= 50 && profile.heightCm <= 250
  const sexValid =
    profile.biologicalSex === 'male' || profile.biologicalSex === 'female'

  const canContinue = ageValid && weightValid && heightValid && sexValid

  function commitWeight() {
    onChange({ ...profile, weightKg: parseWeightKg(weightInput, profile.weightUnit) })
  }

  function handleNext() {
    const nextWeightKg = parseWeightKg(weightInput, profile.weightUnit)
    onChange({ ...profile, weightKg: nextWeightKg })
    onNext()
  }

  function setHeight(raw: string) {
    const value = Number(raw)
    if (!Number.isFinite(value) || value <= 0) {
      onChange({ ...profile, heightCm: 0 })
      return
    }
    onChange({
      ...profile,
      heightCm: normalizeHeightToCm(value, profile.heightUnit),
    })
  }

  return (
    <OnboardingLayout
      title="Essential Profile Setup"
      actionLabel="Continue"
      onAction={handleNext}
      actionDisabled={!canContinue}
    >
      <OnboardingField
        id="onboarding-nickname"
        label="Nickname"
        value={profile.nickname}
        onChange={(value) => onChange({ ...profile, nickname: value })}
        placeholder="Optional"
      />

      <OnboardingField
        id="onboarding-age"
        label="Age"
        type="number"
        inputMode="numeric"
        min={18}
        value={profile.age > 0 ? String(profile.age) : ''}
        onChange={(value) => {
          const age = Number(value)
          onChange({
            ...profile,
            age: Number.isFinite(age) && age > 0 ? Math.round(age) : 0,
          })
        }}
        placeholder="18+"
      />

      <div className="grid grid-cols-[1fr,auto] items-end gap-3">
        <label htmlFor="onboarding-weight" className="block">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Weight
          </span>
          <input
            id="onboarding-weight"
            type="number"
            inputMode="decimal"
            step={0.1}
            min={0}
            value={weightInput}
            onChange={(event) => setWeightInput(event.target.value)}
            onBlur={commitWeight}
            placeholder={profile.weightUnit}
            className="mt-2 h-14 w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <UnitToggle
          label="Unit"
          value={profile.weightUnit}
          options={['kg', 'lbs']}
          onChange={(weightUnit) => {
            const kg = parseWeightKg(weightInput, profile.weightUnit)
            setWeightInput(formatWeightInput(kg, weightUnit))
            onChange({ ...profile, weightUnit, weightKg: kg })
          }}
        />
      </div>

      <div className="grid grid-cols-[1fr,auto] items-end gap-3">
        <OnboardingField
          id="onboarding-height"
          label="Height"
          type="number"
          inputMode="decimal"
          step={0.1}
          min={0}
          value={heightDisplay > 0 ? String(heightDisplay) : ''}
          onChange={setHeight}
          placeholder={profile.heightUnit}
        />
        <UnitToggle
          label="Unit"
          value={profile.heightUnit}
          options={['cm', 'in']}
          onChange={(heightUnit) => onChange({ ...profile, heightUnit })}
        />
      </div>

      <SegmentSelector<BiologicalSex>
        label="Biological Sex"
        value={profile.biologicalSex}
        options={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ]}
        onChange={(biologicalSex) => onChange({ ...profile, biologicalSex })}
      />
    </OnboardingLayout>
  )
}
