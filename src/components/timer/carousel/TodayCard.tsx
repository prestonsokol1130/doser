import {
  averageIntervalMinutes,
  dosesToday,
  formatDurationShort,
  formatIntervalMinutes,
  formatTimeAgo,
  substanceBreakdown,
  totalMl,
} from '@/lib/sessionStats'
import { formatTimeShort } from '../timerUtils'
import { CardHeader, CardStat } from './CardStat'
import { CarouselCardShell } from './CarouselCardShell'
import type { CarouselCardData } from './carouselTypes'

export function TodayCard({ doses, nowMs }: CarouselCardData) {
  const today = dosesToday(doses, nowMs)
  const count = today.length
  const total = totalMl(today)
  const avgInterval = averageIntervalMinutes(today)
  const first = today[0] ?? null
  const last = today[today.length - 1] ?? null
  const windowLabel =
    first && last
      ? `${formatTimeShort(first.ts)} → ${formatTimeShort(last.ts)}`
      : '—'
  const sinceLast = last ? formatTimeAgo(last.ts, nowMs) : '—'
  const sessionSpan =
    first && last ? formatDurationShort(last.ts - first.ts) : '—'

  return (
    <CarouselCardShell>
      <CardHeader title="TODAY" subtitle="Session summary" />
      <div className="min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-2 gap-3">
          <CardStat
            label="DOSES TODAY"
            value={count > 0 ? String(count) : '—'}
            sub={count > 0 ? `${total.toFixed(1)} mL total` : undefined}
          />
          <CardStat
            label="TOTAL"
            value={count > 0 ? `${total.toFixed(1)} mL` : '—'}
          />
          <CardStat
            label="AVG INTERVAL"
            value={formatIntervalMinutes(avgInterval)}
          />
          <CardStat
            label="SESSION WINDOW"
            value={windowLabel}
            sub={sessionSpan !== '—' ? `span ${sessionSpan}` : undefined}
          />
          <CardStat
            label="FIRST ENTRY"
            value={first ? `${first.amountMl.toFixed(2)} mL` : '—'}
            sub={first ? formatTimeShort(first.ts) : undefined}
          />
          <CardStat
            label="LAST ENTRY"
            value={last ? `${last.amountMl.toFixed(2)} mL` : '—'}
            sub={last ? `since ${sinceLast}` : undefined}
          />
        </div>
        {count > 0 && (
          <p
            className="mt-3 text-[11px] leading-snug text-[var(--app-dim)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {substanceBreakdown(today)}
          </p>
        )}
      </div>
    </CarouselCardShell>
  )
}
