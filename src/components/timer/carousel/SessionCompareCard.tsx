import { useMemo } from 'react'
import {
  compareTrend,
  currentSession,
  formatIntervalMinutes,
  sessionMetrics,
  sessionsInLookback,
  trendLabel,
  trendSymbol,
} from '@/lib/sessionStats'
import { HOUR_MS } from '@/lib/perceivedEffect/effectCurves'
import { CardHeader } from './CardStat'
import { CarouselCardShell } from './CarouselCardShell'
import type { CarouselCardData } from './carouselTypes'

type CompareRowProps = {
  label: string
  current: string
  average: string
  trend: ReturnType<typeof compareTrend>
  barPct: number
}

function CompareRow({ label, current, average, trend, barPct }: CompareRowProps) {
  return (
    <div className="rounded-[10px] border border-[var(--app-divider)] bg-[var(--app-surface-alt)] p-2">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {label}
        </span>
        <span
          className="text-[10px] text-[var(--color-action)]"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          {trendSymbol(trend)} {trendLabel(trend)}
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span
          className="text-[18px] text-[var(--app-text)]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 200 }}
        >
          {current}
        </span>
        <span
          className="text-[11px] text-[var(--color-load)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          avg {average}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div
          className="h-full rounded-full bg-[var(--color-ring)]"
          style={{ width: `${Math.min(100, Math.max(8, barPct * 100))}%` }}
        />
      </div>
    </div>
  )
}

export function SessionCompareCard({
  doses,
  substance,
  nowMs,
}: CarouselCardData) {
  const { current, averages } = useMemo(() => {
    const session = currentSession(doses, substance, nowMs)
    const currentMetrics = sessionMetrics(session)

    const lookbackSessions = sessionsInLookback(
      doses,
      substance,
      nowMs,
      7 * 24 * HOUR_MS,
    )
    const priorSessions = lookbackSessions.filter((s) => {
      const lastTs = s[s.length - 1]?.ts ?? 0
      const currentLast = session[session.length - 1]?.ts ?? -1
      return lastTs !== currentLast
    })

    const priorMetrics = priorSessions.map(sessionMetrics)
    const count = priorMetrics.length

    const avg = (pick: (m: ReturnType<typeof sessionMetrics>) => number | null) => {
      const vals = priorMetrics
        .map(pick)
        .filter((v): v is number => v != null && Number.isFinite(v))
      if (vals.length === 0) return null
      return vals.reduce((a, b) => a + b, 0) / vals.length
    }

    return {
      current: currentMetrics,
      averages: {
        doseCount: avg((m) => m.doseCount),
        avgDoseMl: avg((m) => m.avgDoseMl),
        avgSpacing: avg((m) => m.avgSpacingMinutes),
        totalMl: avg((m) => m.totalMl),
      },
      priorCount: count,
    }
  }, [doses, substance, nowMs])

  const doseSizeTrend = compareTrend(current.avgDoseMl, averages.avgDoseMl)
  const spacingTrend = compareTrend(current.avgSpacingMinutes, averages.avgSpacing)
  const totalTrend = compareTrend(current.totalMl, averages.totalMl)

  const maxDose = Math.max(current.avgDoseMl ?? 0, averages.avgDoseMl ?? 0, 0.1)
  const maxSpace = Math.max(
    current.avgSpacingMinutes ?? 0,
    averages.avgSpacing ?? 0,
    1,
  )
  const maxTotal = Math.max(current.totalMl, averages.totalMl ?? 0, 0.1)

  return (
    <CarouselCardShell>
      <CardHeader
        title="SESSION COMPARE"
        subtitle="vs 7-day average"
      />
      {current.doseCount === 0 ? (
        <p
          className="flex flex-1 items-center justify-center text-[12px] text-[var(--app-faint)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Log doses to compare your session.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CompareRow
            label="DOSE SIZE"
            current={
              current.avgDoseMl != null
                ? `${current.avgDoseMl.toFixed(2)} mL`
                : '—'
            }
            average={
              averages.avgDoseMl != null
                ? `${averages.avgDoseMl.toFixed(2)} mL`
                : '—'
            }
            trend={doseSizeTrend}
            barPct={(current.avgDoseMl ?? 0) / maxDose}
          />
          <CompareRow
            label="SPACING"
            current={formatIntervalMinutes(current.avgSpacingMinutes)}
            average={formatIntervalMinutes(averages.avgSpacing)}
            trend={spacingTrend}
            barPct={(current.avgSpacingMinutes ?? 0) / maxSpace}
          />
          <CompareRow
            label="TOTAL AMOUNT"
            current={`${current.totalMl.toFixed(1)} mL`}
            average={
              averages.totalMl != null
                ? `${averages.totalMl.toFixed(1)} mL`
                : '—'
            }
            trend={totalTrend}
            barPct={current.totalMl / maxTotal}
          />
          <p
            className="mt-auto text-center text-[10px] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {current.doseCount} dose{current.doseCount === 1 ? '' : 's'} this session
          </p>
        </div>
      )}
    </CarouselCardShell>
  )
}
