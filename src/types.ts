export type Substance = 'GBL' | 'BDO'

/** Legacy logged doses only — not selectable for new logs */
export type LegacySubstance = 'GHB'

export type DoseSubstance = Substance | LegacySubstance

export const VALID_DOSE_SUBSTANCES = ['GBL', 'BDO', 'GHB'] as const satisfies readonly DoseSubstance[]

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

export type FoodState = 'empty' | 'snack' | 'full'

export const VALID_FOOD_STATES = ['empty', 'snack', 'full'] as const satisfies readonly FoodState[]

export type HydrationState = 'low' | 'ok' | 'good'

export const VALID_HYDRATION_STATES = ['low', 'ok', 'good'] as const satisfies readonly HydrationState[]

export type SleepLevel = 'poor' | 'ok' | 'good'

export const VALID_SLEEP_LEVELS = ['poor', 'ok', 'good'] as const satisfies readonly SleepLevel[]

export type DoseBuddyLastDoseFeedback =
  | 'too_much'
  | 'not_enough'
  | 'just_right'
  | 'couldnt_feel_it'
  | 'dont_remember'

export const VALID_LAST_DOSE_FEEDBACK = [
  'too_much',
  'not_enough',
  'just_right',
  'couldnt_feel_it',
  'dont_remember',
] as const satisfies readonly DoseBuddyLastDoseFeedback[]

export interface DoseContext {
  foodState: FoodState
  hydrationState: HydrationState
  sleepLevel: SleepLevel
  lastDoseFeedback?: DoseBuddyLastDoseFeedback | null
}

export type ThemeId = 'dark'

export interface StashPrefs {
  /** Current on-hand baseline volume; doses logged after refillAt deplete from this. */
  capacityMl: number
  /** Full reference volume = the 100% tank level. Set on refill; tank empties as the
   *  current amount drops below it. Falls back to capacityMl when unset (legacy data). */
  fullMl?: number
  /** Timestamp of the last refill; doses logged after this count toward consumption. */
  refillAt: number
}

export interface TaperPrefs {
  active: boolean
  substance: Substance
  startDoseMl: number
  targetDoseMl: number
  stepIntervalDays: number
  reductionMlPerStep: number
  startedAt: number
}

export interface DoseBuddyPrefs {
  enabled: boolean
  checkInBeforeDose: boolean
  showRecommendation: boolean
  localPeerContribution: boolean
}

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
  defaultSubstance?: Substance
  gbl: SubstancePrefs
  bdo: SubstancePrefs
  avatarId: string
  accentHex: string
  glowHex: string
  notif: NotificationPrefs
  stash: StashPrefs
  taper: TaperPrefs
  doseBuddy: DoseBuddyPrefs
  themeId: ThemeId
}

export interface Dose {
  id: string
  substance: DoseSubstance
  amountMl: number
  ts: number
  updatedAt?: number
}
