import { formatTimeShort, pelEffectLabel, toleranceTrendLabel } from '../timerUtils'
import { CarouselCardShell } from './CarouselCardShell'

type CurrentStateCardProps = {
  pelPercent: number
  trend: 'rising' | 'stable' | 'easing'
  nextWindowMs: number | null
  sessionCount: number
  sessionTotalMl: number
}

function EffectGauge({ percent }: { percent: number }) {
  const needleAngle = -90 + (percent / 100) * 180

  return (
    <div className="relative mx-auto aspect-[2/1] w-[min(100%,12rem)]">
      <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * 251} 251`}
        />
        <g transform={`rotate(${needleAngle} 100 100)`}>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke="var(--color-text)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="5" fill="var(--color-text)" />
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between text-xs uppercase text-[var(--color-text-muted)]">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  )
}

function BottomStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-base text-[var(--color-text)]">{value}</p>
    </div>
  )
}

export function CurrentStateCard({
  pelPercent,
  trend,
  nextWindowMs,
  sessionCount,
  sessionTotalMl,
}: CurrentStateCardProps) {
  return (
    <CarouselCardShell>
      <h3 className="text-lg font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]">
        CURRENT STATE
      </h3>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-purple)]">
        PERCEIVED EFFECT
      </p>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[clamp(2rem,8vw,2.75rem)] font-light text-[var(--color-text)]">
            {pelEffectLabel(pelPercent)}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {toleranceTrendLabel(trend)}
          </p>
        </div>
        <EffectGauge percent={pelPercent} />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-6">
        <BottomStat
          label="NEXT WINDOW"
          value={nextWindowMs ? formatTimeShort(nextWindowMs) : '—'}
        />
        <BottomStat label="SESSION COUNT" value={String(sessionCount)} />
        <BottomStat
          label="TOTAL"
          value={`${sessionTotalMl.toFixed(2)} mL`}
        />
      </div>
    </CarouselCardShell>
  )
}
