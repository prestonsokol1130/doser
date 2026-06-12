type FormFieldProps = {
  id: string
  label: string
  type?: 'text' | 'number'
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  inputMode?: 'decimal' | 'numeric' | 'text'
  min?: number
  max?: number
  step?: number
}

export function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  inputMode,
  min,
  max,
  step,
}: FormFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span
        className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
        style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
      >
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        className="mt-2 h-12 w-full rounded-[14px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 text-[14px] text-[var(--app-text)] outline-none focus:border-[var(--color-ring)]"
        style={{ fontFamily: 'var(--font-body)' }}
      />
    </label>
  )
}

type ToggleFieldProps = {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-4">
      <div>
        <p
          className="text-[12px] uppercase tracking-[0.1em] text-[var(--app-text)]"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          {label}
        </p>
        {description ? (
          <p
            className="mt-1 text-[12px] text-[var(--app-dim)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border border-[var(--app-divider)] transition-opacity duration-[150ms] ${
          checked ? 'bg-[var(--color-ring)]' : 'bg-[var(--app-surface-alt)]'
        }`}
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--app-text)] transition-[left] duration-[150ms] ${
            checked ? 'left-[calc(100%-1.375rem)]' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}
