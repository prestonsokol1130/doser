import type { ReactNode } from 'react'
import { BarChartIcon, ClockIcon } from './TimerIcons'

type TopStatRowProps = {
  lastEntryLabel: string
  sessionTotalLabel: string
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex-1 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="text-[var(--color-accent)]">{icon}</div>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-base text-[var(--color-text)]">{value}</p>
    </div>
  )
}

export function TopStatRow({
  lastEntryLabel,
  sessionTotalLabel,
}: TopStatRowProps) {
  return (
    <div className="mt-6 flex gap-3">
      <StatCard
        icon={<ClockIcon />}
        label="LAST ENTRY"
        value={lastEntryLabel}
      />
      <StatCard
        icon={<BarChartIcon />}
        label="SESSION TOTAL"
        value={sessionTotalLabel}
      />
    </div>
  )
}
