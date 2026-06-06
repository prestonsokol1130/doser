type AuthFieldProps = {
  id: string
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (value: string) => void
  autoComplete?: string
}

export function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
}: AuthFieldProps) {
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
        autoComplete={autoComplete}
        className="mt-2 h-14 w-full rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
      />
    </label>
  )
}
