import { CarouselCardShell } from './CarouselCardShell'

const PLACEHOLDER_ROWS = [
  {
    label: 'Dose Size',
    value: '1.80 mL',
    barPct: 72,
    delta: '+8% vs avg',
  },
  {
    label: 'Spacing',
    value: '1h 32m',
    barPct: 58,
    delta: '-12m vs avg',
  },
  {
    label: 'Total Amount',
    value: '5.40 mL',
    barPct: 81,
    delta: '+0.6 mL vs avg',
  },
]

export function SessionCompareCard() {
  return (
    <CarouselCardShell>
      <h3 className="text-lg font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]">
        SESSION COMPARE
      </h3>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-purple)]">
        vs your average (last 10 sessions)
      </p>

      <ul className="mt-6 space-y-6">
        {PLACEHOLDER_ROWS.map((row) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {row.label}
              </p>
              <p className="text-sm text-[var(--color-cta)]">{row.delta}</p>
            </div>
            <p className="mt-1 text-lg text-[var(--color-text)]">{row.value}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)]"
                style={{ width: `${row.barPct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </CarouselCardShell>
  )
}
