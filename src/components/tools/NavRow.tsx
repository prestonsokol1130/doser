type NavRowProps = {
  label: string
  description?: string
  onClick: () => void
}

export function NavRow({ label, description, onClick }: NavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-4 text-left outline-none transition-opacity duration-[150ms] hover:opacity-90"
    >
      <div className="min-w-0">
        <p
          className="text-[13px] uppercase tracking-[0.12em] text-[var(--app-text)]"
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
      <span
        className="shrink-0 text-[var(--app-faint)]"
        aria-hidden
      >
        ›
      </span>
    </button>
  )
}
