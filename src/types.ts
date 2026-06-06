export type Substance = 'GBL' | 'BDO'

/** Legacy logged doses only — not selectable for new logs */
export type LegacySubstance = 'GHB'

export type DoseSubstance = Substance | LegacySubstance

export type NotifPresetId =
  | 'all'
  | 'dose_only'
  | 'daily_only'
  | 'silent'
  | 'custom'

export interface SubstancePrefs {
  preferredDoseMl: number
  preferredIntervalMinutes: number
}

export interface NotificationPrefs {
  preset: NotifPresetId
  doseDueReminder: boolean
  doseDueLeadMinutes: number
  stashRunningLow: boolean
  stashLowThresholdPct: number
  doseLoggedConfirmation: boolean
  dailyUsageSummary: boolean
  dailySummaryTime: string
  missedDoseAlert: boolean
  missedDoseGraceHours: number
  doseReminders: boolean
  spacingReminders: boolean
  hydration: boolean
  stashAlerts: boolean
  sleepReminders: boolean
  hapticOnly: boolean
  silent: boolean
}

export type WeightUnit = 'kg' | 'lbs'

export type HeightUnit = 'cm' | 'in'

export type BiologicalSex = 'male' | 'female'

export interface Profile {
  nickname: string
  age: number
  /** Body height stored canonically in centimeters; UI handles conversion. 0 means unset. */
  heightCm: number
  /** UI preference only; persisted so the form remembers user choice. */
  heightUnit: HeightUnit
  /** Body weight stored canonically in kilograms; UI handles conversion. 0 means unset. */
  weightKg: number
  /** UI preference only; persisted so the form remembers user choice. */
  weightUnit: WeightUnit
  biologicalSex: BiologicalSex | null
  gbl: SubstancePrefs
  bdo: SubstancePrefs
  avatarId: string
  accentHex: string
  glowHex: string
  notif: NotificationPrefs
}

export interface Dose {
  id: string
  substance: DoseSubstance
  amountMl: number
  ts: number
  updatedAt?: number
}
