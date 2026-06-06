import type { ReactNode } from 'react'
import type { Dose, Substance } from '../../types'
import { BarChartIcon, ClockIcon } from './TimerIcons'
import {
  formatLastEntry,
  formatSessionTotal,
  lastDose,
  sessionTotalMl,
} from './timerUtils'

type TopStatRowProps = {
  doses: Dose[]
  substance: Substance
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
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="shrink-0 text-[var(--color-accent)]">{icon}</div>
      <div className="flex min-w-0 flex-col">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          {label}
        </span>
        <span className="truncate text-[18px] text-[var(--color-text)]">
          {value}
        </span>
      </div>
    </div>
  )
}

export function TopStatRow({ doses, substance }: TopStatRowProps) {
  const latest = lastDose(doses, substance)
  const total = sessionTotalMl(doses, substance)

  return (
    <div className="flex shrink-0 gap-3 px-4 pt-3">
      <StatCard
        icon={<ClockIcon className="h-5 w-5" />}
        label="LAST ENTRY"
        value={formatLastEntry(latest)}
      />
      <StatCard
        icon={<BarChartIcon className="h-5 w-5" />}
        label="SESSION TOTAL"
        value={formatSessionTotal(total)}
      />
    </div>
  )
}
