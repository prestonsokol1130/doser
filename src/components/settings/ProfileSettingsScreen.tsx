import { useEffect, useState } from 'react'
import {
  cmToIn,
  kgToLbs,
  normalizeHeightToCm,
  normalizeWeightToKg,
} from '@/lib/metabolicProfile'
import type { BiologicalSex, Profile, Substance, WeightUnit } from '@/types'
import { FormField } from '../tools/FormField'
import { SubScreenHeader } from '../tools/SubScreenHeader'

type ProfileSettingsScreenProps = {
  profile: Profile
  onProfileChange: (profile: Profile) => void
  onBack: () => void
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

function parseDoseMl(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function parseIntervalMinutes(value: string, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 15) return fallback
  return Math.round(parsed)
}

export function ProfileSettingsScreen({
  profile,
  onProfileChange,
  onBack,
}: ProfileSettingsScreenProps) {
  const [weightInput, setWeightInput] = useState(() =>
    formatWeightInput(profile.weightKg, profile.weightUnit),
  )
  const [gblDoseStr, setGblDoseStr] = useState(
    () => String(profile.gbl.preferredDoseMl),
  )
  const [bdoDoseStr, setBdoDoseStr] = useState(
    () => String(profile.bdo.preferredDoseMl),
  )

  useEffect(() => {
    setWeightInput(formatWeightInput(profile.weightKg, profile.weightUnit))
    setGblDoseStr(String(profile.gbl.preferredDoseMl))
    setBdoDoseStr(String(profile.bdo.preferredDoseMl))
  }, [
    profile.weightKg,
    profile.weightUnit,
    profile.gbl.preferredDoseMl,
    profile.bdo.preferredDoseMl,
  ])

  const heightDisplay =
    profile.heightUnit === 'in' && profile.heightCm > 0
      ? cmToIn(profile.heightCm)
      : profile.heightCm

  function commitWeight() {
    onProfileChange({
      ...profile,
      weightKg: parseWeightKg(weightInput, profile.weightUnit),
    })
  }

  function commitGblDose() {
    onProfileChange({
      ...profile,
      gbl: {
        ...profile.gbl,
        preferredDoseMl: parseDoseMl(gblDoseStr),
      },
    })
  }

  function commitBdoDose() {
    onProfileChange({
      ...profile,
      bdo: {
        ...profile.bdo,
        preferredDoseMl: parseDoseMl(bdoDoseStr),
      },
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader
        title="Profile"
        subtitle="Body profile and dose defaults"
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-4">
          <FormField
            id="profile-nickname"
            label="Nickname"
            value={profile.nickname}
            onChange={(nickname) => onProfileChange({ ...profile, nickname })}
          />

          <FormField
            id="profile-age"
            label="Age"
            type="number"
            inputMode="numeric"
            min={18}
            value={profile.age > 0 ? String(profile.age) : ''}
            onChange={(value) => {
              const trimmed = value.trim()
              if (trimmed === '') return
              const age = Number(trimmed)
              if (!Number.isFinite(age) || age < 18) return
              onProfileChange({ ...profile, age })
            }}
          />

          <FormField
            id="profile-height"
            label={`Height (${profile.heightUnit})`}
            type="number"
            inputMode="decimal"
            value={heightDisplay > 0 ? String(heightDisplay) : ''}
            onChange={(raw) => {
              const value = Number(raw)
              if (!Number.isFinite(value) || value <= 0) {
                onProfileChange({ ...profile, heightCm: 0 })
                return
              }
              onProfileChange({
                ...profile,
                heightCm: normalizeHeightToCm(value, profile.heightUnit),
              })
            }}
          />

          <FormField
            id="profile-weight"
            label={`Weight (${profile.weightUnit})`}
            type="text"
            inputMode="decimal"
            value={weightInput}
            onChange={setWeightInput}
            onBlur={commitWeight}
          />

          <div>
            <span
              className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Biological Sex
            </span>
            <div className="mt-2 flex gap-2">
              {(
                [
                  { value: 'male' as BiologicalSex, label: 'Male' },
                  { value: 'female' as BiologicalSex, label: 'Female' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onProfileChange({
                      ...profile,
                      biologicalSex: option.value,
                    })
                  }
                  className={`flex-1 rounded-[10px] border py-2 text-[10px] uppercase tracking-[0.12em] outline-none ${
                    profile.biologicalSex === option.value
                      ? 'border-[var(--color-ring)] text-[var(--color-ring)]'
                      : 'border-[var(--app-divider)] text-[var(--app-faint)]'
                  }`}
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span
              className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Primary Substance
            </span>
            <div className="mt-2 flex gap-2">
              {(
                [
                  { value: 'GBL' as Substance, label: 'GBL' },
                  { value: 'BDO' as Substance, label: 'BDO' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onProfileChange({
                      ...profile,
                      defaultSubstance: option.value,
                    })
                  }
                  className={`flex-1 rounded-[10px] border py-2 text-[10px] uppercase tracking-[0.12em] outline-none ${
                    (profile.defaultSubstance ?? 'GBL') === option.value
                      ? 'border-[var(--color-ring)] text-[var(--color-ring)]'
                      : 'border-[var(--app-divider)] text-[var(--app-faint)]'
                  }`}
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
            <p
              className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-load)]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              GBL Defaults
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <FormField
                id="gbl-dose"
                label="Preferred Dose (mL)"
                type="text"
                inputMode="decimal"
                value={gblDoseStr}
                onChange={setGblDoseStr}
                onBlur={commitGblDose}
              />
              <FormField
                id="gbl-interval"
                label="Preferred Interval (minutes)"
                type="number"
                inputMode="numeric"
                min={15}
                value={String(profile.gbl.preferredIntervalMinutes)}
                onChange={(value) =>
                  onProfileChange({
                    ...profile,
                    gbl: {
                      ...profile.gbl,
                      preferredIntervalMinutes: parseIntervalMinutes(
                        value,
                        profile.gbl.preferredIntervalMinutes,
                      ),
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
            <p
              className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-load)]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              BDO Defaults
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <FormField
                id="bdo-dose"
                label="Preferred Dose (mL)"
                type="text"
                inputMode="decimal"
                value={bdoDoseStr}
                onChange={setBdoDoseStr}
                onBlur={commitBdoDose}
              />
              <FormField
                id="bdo-interval"
                label="Preferred Interval (minutes)"
                type="number"
                inputMode="numeric"
                min={15}
                value={String(profile.bdo.preferredIntervalMinutes)}
                onChange={(value) =>
                  onProfileChange({
                    ...profile,
                    bdo: {
                      ...profile.bdo,
                      preferredIntervalMinutes: parseIntervalMinutes(
                        value,
                        profile.bdo.preferredIntervalMinutes,
                      ),
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
