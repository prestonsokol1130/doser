import { CarouselCardShell } from './CarouselCardShell'

const PLACEHOLDER = {
  dosesToday: 3,
  totalMl: '5.40',
  avgInterval: '1h 32m',
  firstEntry: '9:14 PM',
  lastEntry: '11:48 PM',
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg text-[var(--color-text)]">{value}</p>
    </div>
  )
}

export function TodayCard() {
  return (
    <CarouselCardShell>
      <h3 className="text-lg font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]">
        TODAY
      </h3>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
        <StatBlock label="DOSES TODAY" value={String(PLACEHOLDER.dosesToday)} />
        <StatBlock label="TOTAL" value={`${PLACEHOLDER.totalMl} mL`} />
        <StatBlock label="AVG INTERVAL" value={PLACEHOLDER.avgInterval} />
        <StatBlock label="FIRST ENTRY" value={PLACEHOLDER.firstEntry} />
        <StatBlock label="LAST ENTRY" value={PLACEHOLDER.lastEntry} />
      </div>
    </CarouselCardShell>
  )
}
