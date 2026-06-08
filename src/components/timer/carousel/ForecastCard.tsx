import { useMemo } from 'react'
import { HOUR_MS } from '@/lib/perceivedEffect/effectCurves'
import { computePerceivedEffectLevelAt } from '@/lib/perceivedEffect/perceivedEffectModel'
import { perceivedEffectLabel } from '@/lib/pelDisplay'
import { formatTimeShort } from '../timerUtils'
import { CardHeader } from './CardStat'
import { CarouselCardShell } from './CarouselCardShell'
import type { CarouselCardData } from './carouselTypes'

const FORECAST_HOURS = 8
const SAMPLE_COUNT = 33

type ForecastPoint = { offsetMs: number; percent: number }

function buildForecast(
  doses: CarouselCardData['doses'],
  profile: CarouselCardData['profile'],
  nowMs: number,
): ForecastPoint[] {
  const step = (FORECAST_HOURS * HOUR_MS) / (SAMPLE_COUNT - 1)
  const points: ForecastPoint[] = []
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const offsetMs = i * step
    const atMs = nowMs + offsetMs
    const { percent } = computePerceivedEffectLevelAt(doses, profile, atMs)
    points.push({ offsetMs, percent })
  }
  return points
}

function ForecastChart({
  points,
  nowMs,
  nextWindowMs,
}: {
  points: ForecastPoint[]
  nowMs: number
  nextWindowMs: number | null
}) {
  const width = 280
  const height = 120
  const padX = 28
  const padY = 14
  const chartW = width - padX * 2
  const chartH = height - padY * 2
  const maxMs = FORECAST_HOURS * HOUR_MS

  const coords = points.map((p, i) => {
    const x = padX + (p.offsetMs / maxMs) * chartW
    const y = padY + chartH - (p.percent / 100) * chartH
    return { x, y, percent: p.percent, i }
  })

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ')

  const areaPath = `${linePath} L ${coords[coords.length - 1]!.x.toFixed(1)} ${(padY + chartH).toFixed(1)} L ${coords[0]!.x.toFixed(1)} ${(padY + chartH).toFixed(1)} Z`

  const safePoint = useMemo(() => {
    if (nextWindowMs == null || nextWindowMs <= nowMs) return null
    const offset = nextWindowMs - nowMs
    if (offset > maxMs) return null
    const x = padX + (offset / maxMs) * chartW
    const idx = Math.round((offset / maxMs) * (points.length - 1))
    const percent = points[Math.min(idx, points.length - 1)]!.percent
    const y = padY + chartH - (percent / 100) * chartH
    return { x, y, percent }
  }, [nextWindowMs, nowMs, maxMs, padX, chartW, points, padY, chartH])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-hidden>
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = padY + chartH - (pct / 100) * chartH
        return (
          <line
            key={pct}
            x1={padX}
            y1={y}
            x2={width - padX}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        )
      })}
      <text x={4} y={padY + 4} fill="var(--app-faint)" fontSize="7" fontFamily="var(--font-body)">
        High
      </text>
      <text x={4} y={padY + chartH * 0.5} fill="var(--app-faint)" fontSize="7" fontFamily="var(--font-body)">
        Mod
      </text>
      <text x={4} y={padY + chartH} fill="var(--app-faint)" fontSize="7" fontFamily="var(--font-body)">
        Low
      </text>
      <path d={areaPath} fill="color-mix(in srgb, var(--color-ring) 18%, transparent)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-ring)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={coords[0]!.x}
        cy={coords[0]!.y}
        r="4"
        fill="var(--color-ring)"
      />
      {safePoint != null && (
        <>
          <line
            x1={safePoint.x}
            y1={padY}
            x2={safePoint.x}
            y2={padY + chartH}
            stroke="var(--color-load)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity={0.7}
          />
          <circle cx={safePoint.x} cy={safePoint.y} r="3" fill="var(--color-load)" />
        </>
      )}
      <text
        x={padX}
        y={height - 2}
        fill="var(--app-faint)"
        fontSize="7"
        fontFamily="var(--font-body)"
      >
        NOW
      </text>
      <text
        x={width - padX - 24}
        y={height - 2}
        fill="var(--app-faint)"
        fontSize="7"
        fontFamily="var(--font-body)"
      >
        +8H
      </text>
      {nextWindowMs != null && nextWindowMs > nowMs && (
        <text
          x={safePoint?.x ?? padX + chartW * 0.35}
          y={height - 2}
          fill="var(--color-load)"
          fontSize="7"
          fontFamily="var(--font-body)"
          textAnchor="middle"
        >
          NEXT
        </text>
      )}
    </svg>
  )
}

export function ForecastCard({ doses, profile, nowMs, timer }: CarouselCardData) {
  const points = useMemo(
    () => buildForecast(doses, profile, nowMs),
    [doses, profile, nowMs],
  )
  const current = points[0]!.percent
  const atWindow = useMemo(() => {
    if (timer.nextWindowMs == null || timer.nextWindowMs <= nowMs) return current
    const offset = timer.nextWindowMs - nowMs
    const idx = Math.round((offset / (FORECAST_HOURS * HOUR_MS)) * (points.length - 1))
    return points[Math.min(Math.max(0, idx), points.length - 1)]!.percent
  }, [timer.nextWindowMs, nowMs, points, current])

  return (
    <CarouselCardShell>
      <div className="flex shrink-0 items-start justify-between gap-2">
        <CardHeader title="FORECAST" subtitle="PREDICTED LEVEL" />
        <div className="text-right">
          <p
            className="text-[9px] uppercase tracking-[0.12em] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            AT NEXT WINDOW
          </p>
          <p
            className="text-[14px] text-[var(--color-load)]"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}
          >
            {perceivedEffectLabel(atWindow)}
          </p>
          {timer.nextWindowMs != null && timer.nextWindowMs > nowMs && (
            <p
              className="text-[10px] text-[var(--app-dim)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {formatTimeShort(timer.nextWindowMs)}
            </p>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ForecastChart
          points={points}
          nowMs={nowMs}
          nextWindowMs={timer.nextWindowMs}
        />
      </div>
      <p
        className="mt-1 shrink-0 text-center text-[10px] text-[var(--app-faint)]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        Now {current}% · 8-hour projection
      </p>
    </CarouselCardShell>
  )
}
