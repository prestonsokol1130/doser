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
        className="block h-full w-full"
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
  const stateLabel = isWait ? 'WAIT' : 'Ready'
  const centerText = isWait ? formatCountdown(timer.remainingMs) : '--:--:--'
  const bottomLabel = isWait ? 'next window' : 'awaiting entry'
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
        <div
          className="relative mx-auto"
          style={{
            width: 'clamp(260px, 40vh, 350px)',
            height: 'clamp(260px, 40vh, 350px)',
          }}
        >
          <ProgressRing
            progress={timer.ringProgress}
            fillAnimating={fillAnimating}
            onAnimationEnd={() => setFillAnimating(false)}
          />

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2">
            <p
              className="font-semibold uppercase tracking-[0.18em] text-[var(--color-ring)]"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(20px, 3vh, 26px)',
              }}
            >
              {`• ${stateLabel} •`}
            </p>
            <p
              className="mt-1 leading-none text-[var(--app-text)]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 200,
                fontSize: 'clamp(60px, 11vh, 96px)',
                letterSpacing: '-0.02em',
              }}
            >
              {centerText}
            </p>
            <div className="my-2 h-px w-[140px] bg-[rgba(255,255,255,0.12)]" />
            <p
              className="text-[var(--color-load)]"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(14px, 2vh, 18px)',
              }}
            >
              {bottomLabel}
            </p>
            {isWait && (
              <p
                className="mt-0.5 text-[var(--app-text)]"
                style={{ fontSize: 'clamp(18px, 2.6vh, 24px)' }}
              >
                {nextWindowLabel}
              </p>
            )}
          </div>
        </div>
      </div>
    </CarouselCardShell>
  )
}
