import type { TimerState } from '../timerUtils'
import { formatCountdown, formatTimeShort } from '../timerUtils'
import { CarouselCardShell } from './CarouselCardShell'

type TimerRingCardProps = {
  timer: TimerState
}

const RING_R = 135
const CIRC = 2 * Math.PI * RING_R
const GAP_DEG = 16
const GAP_LEN = (GAP_DEG / 360) * CIRC
const ARC_LEN = CIRC - GAP_LEN
const ROTATION = -90 + GAP_DEG / 2

function ProgressRing({ progress }: { progress: number }) {
  const filled = Math.max(0, Math.min(1, progress)) * ARC_LEN

  return (
    <svg
      viewBox="0 0 280 280"
      className="block w-full"
      aria-hidden
    >
      <circle
        cx="140"
        cy="140"
        r={RING_R}
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="10"
        strokeLinecap="butt"
        strokeDasharray={`${ARC_LEN.toFixed(2)} ${GAP_LEN.toFixed(2)}`}
        transform={`rotate(${ROTATION} 140 140)`}
      />
      <circle
        cx="140"
        cy="140"
        r={RING_R}
        fill="none"
        stroke="var(--color-ring)"
        strokeWidth="10"
        strokeLinecap="butt"
        strokeDasharray={`${filled.toFixed(2)} ${(CIRC - filled).toFixed(2)}`}
        transform={`rotate(${ROTATION} 140 140)`}
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
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative mx-auto w-full max-w-[280px]">
          {/* ambient breathe glow */}
          <div
            className="absolute inset-0 rounded-full animate-[breathe_3500ms_ease-in-out_infinite]"
            style={{ background: 'var(--ring-glow-sm)' }}
            aria-hidden
          />

          <ProgressRing progress={timer.ringProgress} />

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4">
            <p
              className="text-[20px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ring)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {`• ${stateLabel} •`}
            </p>
            <p
              className="mt-1 leading-none text-[var(--app-text)]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 200,
                fontSize: '74px',
                letterSpacing: '-0.02em',
              }}
            >
              {formatCountdown(displayMs)}
            </p>
            <div className="my-2 h-px w-[140px] bg-[rgba(255,255,255,0.12)]" />
            <p
              className="text-[14px] text-[var(--color-load)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              next window
            </p>
            <p className="mt-0.5 text-[18px] text-[var(--app-text)]">
              {nextWindowLabel}
            </p>
          </div>
        </div>
      </div>
    </CarouselCardShell>
  )
}
