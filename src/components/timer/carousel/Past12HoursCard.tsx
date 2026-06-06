import { CarouselCardShell } from './CarouselCardShell'

const PLACEHOLDER_ENTRIES = [
  { time: '11:48 PM', amount: '1.80 mL', interval: '1h 34m', barPct: 75 },
  { time: '10:14 PM', amount: '1.80 mL', interval: '1h 28m', barPct: 75 },
  { time: '8:46 PM', amount: '1.20 mL', interval: '—', barPct: 50 },
]

const PLACEHOLDER = {
  entries: 3,
  total: '4.80 mL',
  lastEntry: '11:48 PM',
  windowProgress: 62,
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-base text-[var(--color-text)]">{value}</p>
    </div>
  )
}

export function Past12HoursCard() {
  return (
    <CarouselCardShell className="pb-6">
      <h3 className="text-lg font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]">
        PAST 12 HOURS
      </h3>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatBlock label="ENTRIES" value={String(PLACEHOLDER.entries)} />
        <StatBlock label="TOTAL" value={PLACEHOLDER.total} />
        <StatBlock label="LAST ENTRY" value={PLACEHOLDER.lastEntry} />
      </div>

      <ul className="mt-6 space-y-4">
        {PLACEHOLDER_ENTRIES.map((entry) => (
          <li key={entry.time}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-[var(--color-text)]">{entry.time}</span>
              <span className="text-[var(--color-text-dim)]">{entry.amount}</span>
              <span className="text-[var(--color-text-muted)]">{entry.interval}</span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)]"
                style={{ width: `${entry.barPct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          <span>WINDOW PROGRESS</span>
          <span>{PLACEHOLDER.windowProgress}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)]"
            style={{ width: `${PLACEHOLDER.windowProgress}%` }}
          />
        </div>
      </div>
    </CarouselCardShell>
  )
}
