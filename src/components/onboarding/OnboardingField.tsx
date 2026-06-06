type OnboardingFieldProps = {
  id: string
  label: string
  type?: 'text' | 'number'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputMode?: 'decimal' | 'numeric' | 'text'
  min?: number
  step?: number
}

export function OnboardingField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  inputMode,
  min,
  step,
}: OnboardingFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        step={step}
        className="mt-2 h-14 w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
      />
    </label>
  )
}

type UnitToggleProps<T extends string> = {
  label: string
  value: T
  options: readonly [T, T]
  onChange: (value: T) => void
}

export function UnitToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: UnitToggleProps<T>) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="mt-2 inline-flex overflow-hidden rounded-[18px] border border-[var(--color-border)]"
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`h-14 min-w-[4.5rem] px-5 text-sm font-semibold uppercase tracking-[0.08em] ${
              value === option
                ? 'bg-[var(--color-surface)] text-[var(--color-accent)]'
                : 'bg-transparent text-[var(--color-text-dim)]'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

type SegmentSelectorProps<T extends string> = {
  label: string
  value: T | null
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

export function SegmentSelector<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentSelectorProps<T>) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        {label}
      </span>
      <div className="mt-2 flex gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`h-14 flex-1 rounded-[18px] border text-sm font-semibold uppercase tracking-[0.08em] ${
              value === option.value
                ? 'border-[var(--color-accent)] bg-[var(--color-surface)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

type ToggleRowProps = {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--color-text)]">
          {label}
        </p>
        {description ? (
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full border border-[var(--color-border)] transition ${
          checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface)]'
        }`}
      >
        <span
          className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--color-text)] transition ${
            checked ? 'left-[calc(100%-1.75rem)]' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}
