import { useMemo } from 'react'
import { HOUR_MS } from '@/lib/perceivedEffect/effectCurves'
import {
  dosesPast12Hours,
  formatTimeAgo,
  totalMl,
} from '@/lib/sessionStats'
import { formatTimeShort } from '../timerUtils'
import { CardHeader, CardStat } from './CardStat'
import { CarouselCardShell } from './CarouselCardShell'
import type { CarouselCardData } from './carouselTypes'

function spacingBars(doses: { ts: number; amountMl: number }[]): number[] {
  if (doses.length < 2) return []
  const gaps: number[] = []
  for (let i = 1; i < doses.length; i++) {
    gaps.push(doses[i]!.ts - doses[i - 1]!.ts)
  }
  const max = Math.max(...gaps, 1)
  return gaps.map((g) => g / max)
}

export function Past12HoursCard({ doses, nowMs }: CarouselCardData) {
  const recent = useMemo(() => dosesPast12Hours(doses, nowMs), [doses, nowMs])
  const total = totalMl(recent)
  const last = recent[recent.length - 1] ?? null
  const bars = spacingBars(recent)
  const maxAmount = Math.max(...recent.map((d) => d.amountMl), 0.1)
  const windowProgress =
    recent.length > 0
      ? Math.min(100, ((nowMs - recent[0]!.ts) / (12 * HOUR_MS)) * 100)
      : 0

  return (
    <CarouselCardShell>
      <CardHeader title="PAST 12 HOURS" />
      <div className="grid grid-cols-3 gap-2">
        <CardStat label="ENTRIES" value={recent.length > 0 ? String(recent.length) : '—'} />
        <CardStat label="TOTAL" value={recent.length > 0 ? `${total.toFixed(1)} mL` : '—'} />
        <CardStat
          label="LAST ENTRY"
          value={last ? `${last.amountMl.toFixed(2)} mL` : '—'}
          sub={last ? formatTimeShort(last.ts) : undefined}
        />
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {recent.length === 0 ? (
          <p
            className="py-4 text-center text-[12px] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            No entries in the last 12 hours.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((dose, index) => {
              const prev = index > 0 ? recent[index - 1]! : null
              const intervalMin =
                prev != null
                  ? Math.round((dose.ts - prev.ts) / 60_000)
                  : null
              return (
                <li
                  key={dose.id}
                  className="rounded-[10px] border border-[var(--app-divider)] bg-[var(--app-surface-alt)] p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="text-[13px] text-[var(--app-text)]"
                        style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                      >
                        {formatTimeShort(dose.ts)} · {dose.amountMl.toFixed(2)} mL
                      </p>
                      <p
                        className="text-[10px] text-[var(--color-load)]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {dose.substance} · {formatTimeAgo(dose.ts, nowMs)}
                        {intervalMin != null ? ` · +${intervalMin}m` : ''}
                      </p>
                    </div>
                    <div
                      className="h-2 shrink-0 rounded-[2px] bg-[var(--color-ring)]"
                      style={{
                        width: `${Math.max(12, (dose.amountMl / maxAmount) * 48)}px`,
                        opacity: 0.85,
                      }}
                      aria-hidden
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {bars.length > 0 && (
        <div className="mt-2">
          <p
            className="mb-1 text-[9px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            DOSE SPACING
          </p>
          <div className="flex h-3 items-end gap-0.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-[1px] bg-[var(--color-ring)]"
                style={{ height: `${Math.max(15, h * 100)}%`, opacity: 0.55 }}
              />
            ))}
          </div>
        </div>
      )}
      <div className="mt-2">
        <p
          className="mb-1 text-[9px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          WINDOW PROGRESS
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
          <div
            className="h-full rounded-full bg-[var(--color-ring)]"
            style={{ width: `${windowProgress}%` }}
          />
        </div>
      </div>
    </CarouselCardShell>
  )
}
