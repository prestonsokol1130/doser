import type { ReactNode } from 'react'
import type { Dose, Substance } from '../../types'
import { BarChartIcon, ClockIcon } from './TimerIcons'
import {
  formatTimeShort,
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
  subTime,
}: {
  icon: ReactNode
  label: string
  value: string
  subTime?: string
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-[14px]">
      <div className="shrink-0 text-[var(--color-ring)]">{icon}</div>
      <div className="flex min-w-0 flex-col gap-1">
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-[var(--app-faint)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {label}
        </span>
        <span
          className="truncate text-[18px] leading-[1.1] text-[var(--app-text)]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}
        >
          {value}
        </span>
        {subTime !== undefined && (
          <span
            className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-load)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {subTime}
          </span>
        )}
      </div>
    </div>
  )
}

export function TopStatRow({ doses, substance }: TopStatRowProps) {
  const latest = lastDose(doses, substance)
  const total = sessionTotalMl(doses, substance)

  const lastEntryValue = latest ? `${latest.amountMl.toFixed(2)} mL` : '—'
  const lastEntrySubTime = latest ? `AT ${formatTimeShort(latest.ts)}` : undefined
  const sessionTotalValue = `${total.toFixed(1)} mL`

  return (
    <div className="flex shrink-0 gap-3 px-3 pt-3">
      <StatCard
        icon={<ClockIcon className="h-5 w-5" />}
        label="LAST ENTRY"
        value={lastEntryValue}
        subTime={lastEntrySubTime}
      />
      <StatCard
        icon={<BarChartIcon className="h-5 w-5" />}
        label="SESSION TOTAL"
        value={sessionTotalValue}
      />
    </div>
  )
}
