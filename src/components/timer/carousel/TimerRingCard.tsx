import { useEffect, useRef, useState } from 'react'
import type { TimerState } from '../timerUtils'
import { formatCountdown, formatTimeShort } from '../timerUtils'
import { CarouselCardShell } from './CarouselCardShell'

type TimerRingCardProps = {
  timer: TimerState
}

const RING_R = 135
const CIRC = 2 * Math.PI * RING_R // ≈ 848.23
const ROTATION = -90              // fill starts at 12 o'clock

type ProgressRingProps = {
  progress: number
  fillAnimating: boolean
  onAnimationEnd: () => void
}

function ProgressRing({ progress, fillAnimating, onAnimationEnd }: ProgressRingProps) {
  const filled = Math.max(0, Math.min(1, progress)) * CIRC

  return (
    <>
      <style>{`
        @keyframes ringFillIn {
          from { stroke-dasharray: 0 ${CIRC.toFixed(2)}; }
          to   { stroke-dasharray: ${CIRC.toFixed(2)} 0; }
        }
      `}</style>
      <svg
        viewBox="0 0 280 280"
        className="block w-full"
        aria-hidden
      >
        {/* track — plain closed circle, no dasharray */}
        <circle
          cx="140"
          cy="140"
          r={RING_R}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="10"
          strokeLinecap="butt"
          transform={`rotate(${ROTATION} 140 140)`}
        />
        {/* fill arc */}
        <circle
          cx="140"
          cy="140"
          r={RING_R}
          fill="none"
          stroke="var(--color-ring)"
          strokeWidth="10"
          strokeLinecap="butt"
          transform={`rotate(${ROTATION} 140 140)`}
          {...(fillAnimating
            ? {
                style: { animation: 'ringFillIn 4s ease-in-out forwards' },
                onAnimationEnd: onAnimationEnd,
              }
            : {
                style: {
                  strokeDasharray: `${filled.toFixed(2)} ${(CIRC - filled).toFixed(2)}`,
                  transition: 'stroke-dasharray 1.2s linear',
                },
              })}
        />
      </svg>
    </>
  )
}

export function TimerRingCard({ timer }: TimerRingCardProps) {
  const isWait = timer.phase === 'wait'
  const displayMs = isWait ? timer.remainingMs : timer.elapsedMs
  const stateLabel = isWait ? 'WAIT' : 'SAFE'
  const nextWindowLabel =
    timer.nextWindowMs != null ? formatTimeShort(timer.nextWindowMs) : '—'

  const [fillAnimating, setFillAnimating] = useState(false)
  const prevLastDoseTsRef = useRef<number | null>(timer.lastDoseTs)

  useEffect(() => {
    if (
      timer.lastDoseTs != null &&
      timer.lastDoseTs !== prevLastDoseTsRef.current
    ) {
      prevLastDoseTsRef.current = timer.lastDoseTs
      setFillAnimating(true)
    }
  }, [timer.lastDoseTs])

  return (
    <CarouselCardShell>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative mx-auto w-full max-w-[280px]">
          <ProgressRing
            progress={timer.ringProgress}
            fillAnimating={fillAnimating}
            onAnimationEnd={() => setFillAnimating(false)}
          />

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
