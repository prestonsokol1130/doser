import { useMemo } from 'react'
import {
  computePerceivedEffectLevelAt,
  formatPerceivedEffectPct,
} from '@/lib/perceivedEffect/perceivedEffectModel'
import {
  formatToleranceIndex,
  describeToleranceState,
  toleranceTrendLabel,
} from '@/lib/perceivedEffect/toleranceModel'
import {
  pelGaugeColor,
  perceivedEffectLabel,
} from '@/lib/pelDisplay'
import { dosesPast12Hours, totalMl } from '@/lib/sessionStats'
import { formatTimeShort } from '../timerUtils'
import { CardHeader, CardStat } from './CardStat'
import { CarouselCardShell } from './CarouselCardShell'
import type { CarouselCardData } from './carouselTypes'

const GAUGE_R = 52
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R

function PelGauge({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const filled = (clamped / 100) * GAUGE_CIRC * 0.75
  const gap = GAUGE_CIRC * 0.25
  const color = pelGaugeColor(clamped)
  const needleAngle = -135 + (clamped / 100) * 270

  return (
    <svg viewBox="0 0 140 100" className="h-auto w-full max-w-[160px]" aria-hidden>
      <path
        d="M 20 80 A 52 52 0 1 1 120 80"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M 20 80 A 52 52 0 1 1 120 80"
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${filled.toFixed(2)} ${(GAUGE_CIRC - filled + gap).toFixed(2)}`}
        strokeDashoffset={GAUGE_CIRC * 0.125}
      />
      <line
        x1="70"
        y1="80"
        x2="70"
        y2="34"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        transform={`rotate(${needleAngle} 70 80)`}
      />
      <circle cx="70" cy="80" r="4" fill={color} />
      <text x="14" y="96" fill="var(--app-faint)" fontSize="8" fontFamily="var(--font-body)">
        LOW
      </text>
      <text x="108" y="96" fill="var(--app-faint)" fontSize="8" fontFamily="var(--font-body)">
        HIGH
      </text>
    </svg>
  )
}

export function CurrentStateCard({ doses, profile, nowMs, timer }: CarouselCardData) {
  const pel = useMemo(
    () => computePerceivedEffectLevelAt(doses, profile, nowMs),
    [doses, profile, nowMs],
  )
  const tolerance = describeToleranceState(pel.tolerance)
  const stateLabel = perceivedEffectLabel(pel.percent)
  const trend = toleranceTrendLabel(pel.tolerance.trend)

  return (
    <CarouselCardShell>
      <CardHeader title="CURRENT STATE" subtitle="PERCEIVED EFFECT" />
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p
            className="text-[48px] leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 200,
              color: pelGaugeColor(pel.percent),
            }}
          >
            {formatPerceivedEffectPct(pel.percent)}
          </p>
          <p
            className="mt-1 text-[20px] text-[var(--app-text)]"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}
          >
            {stateLabel}
          </p>
          <p
            className="mt-0.5 text-[11px] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {trend}
          </p>
          <p
            className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-load)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {tolerance.label} · {formatToleranceIndex(pel.toleranceIndex)}
          </p>
        </div>
        <div className="flex items-center">
          <PelGauge percent={pel.percent} />
        </div>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-[var(--app-divider)] pt-2">
        <CardStat
          label="NEXT WINDOW"
          value={
            timer.nextWindowMs != null
              ? formatTimeShort(timer.nextWindowMs)
              : '—'
          }
        />
        <CardStat
          label="SESSION COUNT"
          value={String(pel.contributingDoses)}
        />
        <CardStat
          label="TOTAL"
          value={`${totalMl(dosesPast12Hours(doses, nowMs)).toFixed(1)} mL`}
        />
      </div>
    </CarouselCardShell>
  )
}
