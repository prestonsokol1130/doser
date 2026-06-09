type CardStatProps = {
  label: string
  value: string
  sub?: string
}

export function CardStat({ label, value, sub }: CardStatProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span
        className="text-[10px] uppercase tracking-[0.18em] text-[var(--app-faint)]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
      <span
        className="truncate text-[16px] leading-tight text-[var(--app-text)]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}
      >
        {value}
      </span>
      {sub !== undefined && (
        <span
          className="truncate text-[10px] text-[var(--color-load)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {sub}
        </span>
      )}
    </div>
  )
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2 shrink-0">
      <p
        className="text-[12px] uppercase tracking-[0.18em] text-[var(--app-dim)]"
        style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}
      >
        {title}
      </p>
      {subtitle !== undefined && (
        <p
          className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-load)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
