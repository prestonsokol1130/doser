import {
  formatCountdown,
  formatTimeShort,
  timingStateLabel,
} from '../timerUtils'

type TimerRingCardProps = {
  pelPercent: number
  waiting: boolean
  countdownMs: number
  nextWindowMs: number | null
}

const RING_GAP_DEG = 16

export function TimerRingCard({
  pelPercent,
  waiting,
  countdownMs,
  nextWindowMs,
}: TimerRingCardProps) {
  const availableDeg = 360 - RING_GAP_DEG
  const arcDeg = (pelPercent / 100) * availableDeg
  const ringStyle = {
    background: `conic-gradient(from -90deg, var(--color-ring-gap) 0deg ${RING_GAP_DEG}deg, var(--color-accent) ${RING_GAP_DEG}deg ${RING_GAP_DEG + arcDeg}deg, var(--color-ring-gap) ${RING_GAP_DEG + arcDeg}deg 360deg)`,
  }

  return (
    <div className="flex w-full justify-center">
      <div
        className="relative aspect-square w-full max-w-[min(100%,29.375rem)] rounded-full"
        style={ringStyle}
      >
        <div className="absolute left-1/2 top-1/2 flex aspect-square w-[88%] max-w-[88%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[var(--color-ring-inner)] px-3 text-center">
          <p className="text-[1.75rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            {timingStateLabel(waiting)}
          </p>
          <p className="mt-2 text-[clamp(2.75rem,14vw,6rem)] font-light leading-none tracking-[-0.04em] text-[var(--color-text)]">
            {formatCountdown(countdownMs)}
          </p>
          <div className="mt-4 h-px w-[8.75rem] bg-white/[0.12]" />
          <p className="mt-4 text-[1.3125rem] text-[var(--color-purple)]">
            next window
          </p>
          <p className="mt-1 text-[1.625rem] text-[var(--color-text)]">
            {nextWindowMs ? formatTimeShort(nextWindowMs) : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
