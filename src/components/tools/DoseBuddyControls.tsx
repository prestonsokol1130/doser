import type {
  DoseBuddyLastDoseFeedback,
  FoodState,
  HydrationState,
  SleepLevel,
} from '@/types'

type SelectorOption<T extends string> = {
  value: T
  label: string
}

type DoseBuddySelectorProps<T extends string> = {
  label: string
  value: T | null | undefined
  options: readonly SelectorOption<T>[]
  onChange: (value: T) => void
}

export const FOOD_OPTIONS = [
  { value: 'empty' as FoodState, label: 'Empty' },
  { value: 'snack' as FoodState, label: 'Recent' },
  { value: 'full' as FoodState, label: 'Full' },
] as const

export const HYDRATION_OPTIONS = [
  { value: 'low' as HydrationState, label: 'Low' },
  { value: 'ok' as HydrationState, label: 'OK' },
  { value: 'good' as HydrationState, label: 'Good' },
] as const

export const SLEEP_OPTIONS = [
  { value: 'poor' as SleepLevel, label: 'Tired' },
  { value: 'ok' as SleepLevel, label: 'OK' },
  { value: 'good' as SleepLevel, label: 'Rested' },
] as const

export const LAST_DOSE_FEEDBACK_OPTIONS = [
  { value: 'too_much' as DoseBuddyLastDoseFeedback, label: 'Too much' },
  { value: 'not_enough' as DoseBuddyLastDoseFeedback, label: 'Not enough' },
  { value: 'just_right' as DoseBuddyLastDoseFeedback, label: 'Just right' },
  {
    value: 'couldnt_feel_it' as DoseBuddyLastDoseFeedback,
    label: "Couldn't feel it",
  },
  {
    value: 'dont_remember' as DoseBuddyLastDoseFeedback,
    label: "Don't remember",
  },
] as const

export function formatLastDoseFeedback(
  feedback: DoseBuddyLastDoseFeedback | null | undefined,
): string {
  return (
    LAST_DOSE_FEEDBACK_OPTIONS.find((option) => option.value === feedback)
      ?.label ?? '—'
  )
}

export function DoseBuddySelector<T extends string>({
  label,
  value,
  options,
  onChange,
}: DoseBuddySelectorProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
        style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
      >
        {label}
      </span>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const active = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`min-h-[52px] rounded-[10px] border px-3 py-3 text-center text-[13px] outline-none transition-opacity duration-[150ms] ${
                active
                  ? 'border-[var(--color-ring)] bg-[color-mix(in_srgb,var(--color-ring)_14%,transparent)] text-[var(--color-ring)]'
                  : 'border-[var(--app-divider)] bg-[var(--app-surface)] text-[var(--app-dim)]'
              }`}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
