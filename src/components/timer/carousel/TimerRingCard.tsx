import type { TimerState } from '../timerUtils'
import { formatCountdown, formatTimeShort } from '../timerUtils'
import { CarouselCardShell } from './CarouselCardShell'

type TimerRingCardProps = {
  timer: TimerState
}

const GAP_DEGREES = 16

function ProgressRing({ progress }: { progress: number }) {
  const size = 280
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  const gapLength = (GAP_DEGREES / 360) * circumference
  const arcLength = circumference - gapLength
  const filled = Math.max(0, Math.min(1, progress)) * arcLength
  const rotation = -90 + GAP_DEGREES / 2

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto aspect-square w-full max-w-[280px]"
      aria-hidden
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--color-ring-gap)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${arcLength} ${gapLength}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${cx} ${cy})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${cx} ${cy})`}
      />
    </svg>
  )
}

export function TimerRingCard({ timer }: TimerRingCardProps) {
  const isWait = timer.phase === 'wait'
  const displayMs = isWait ? timer.remainingMs : timer.elapsedMs
  const stateLabel = isWait ? 'WAIT' : 'SAFE'
  const nextWindowLabel =
    timer.nextWindowMs != null ? formatTimeShort(timer.nextWindowMs) : '—'

  return (
    <CarouselCardShell>
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
        <ProgressRing progress={timer.ringProgress} />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4">
          <p className="text-[20px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            {isWait ? `• ${stateLabel} •` : stateLabel}
          </p>
          <p className="mt-1 text-[clamp(36px,12vw,56px)] font-light tracking-[-0.04em] text-[var(--color-text)]">
            {formatCountdown(displayMs)}
          </p>
          <div className="my-2 h-px w-[min(140px,40%)] bg-[rgba(255,255,255,0.12)]" />
          <p className="text-[14px] text-[var(--color-purple)]">next window</p>
          <p className="mt-0.5 text-[18px] text-[var(--color-text)]">
            {nextWindowLabel}
          </p>
        </div>
      </div>
    </CarouselCardShell>
  )
}
