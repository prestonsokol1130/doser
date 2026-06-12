type SubScreenHeaderProps = {
  title: string
  subtitle?: string
  onBack?: () => void
}

export function SubScreenHeader({
  title,
  subtitle,
  onBack,
}: SubScreenHeaderProps) {
  return (
    <header className="shrink-0 px-4 pt-4 pb-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-load)] outline-none transition-opacity duration-[150ms] hover:opacity-80"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          BACK
        </button>
      ) : null}
      <h1
        className="text-[18px] uppercase tracking-[0.2em] text-[var(--app-text)]"
        style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className="mt-0.5 text-[11px] text-[var(--color-load)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  )
}
