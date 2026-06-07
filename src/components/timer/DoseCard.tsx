import { useMemo } from 'react'
import {
  DOSE_STEP,
  clampDoseAmount,
  formatDoseAmount,
  snapDoseToStep,
} from './timerUtils'
import { MinusIcon, PlusIcon, TargetIcon } from './TimerIcons'

const TICK_WIDTH = 20

// Display-only tick range: 1.0 to 2.6 in 0.1 steps (17 ticks, 340px total).
// Snap logic still uses DOSE_SCALE_TICKS from timerUtils.
const RENDER_TICKS = Array.from({ length: 17 }, (_, i) =>
  Math.round((10 + i) * 10) / 100,
)

// Labels shown only on the locked major values
const LABELED_TICKS = new Set([1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4])

type DoseCardProps = {
  doseAmount: number
  onDoseAmountChange: (amount: number) => void
  onLogEntry: () => void
  logDisabled?: boolean
}

export function DoseCard({
  doseAmount,
  onDoseAmountChange,
  onLogEntry,
  logDisabled = false,
}: DoseCardProps) {
  const activeAmount = snapDoseToStep(doseAmount)

  const activeRenderIndex = useMemo(() => {
    const index = RENDER_TICKS.findIndex(
      (t) => Math.abs(t - activeAmount) < 0.005,
    )
    return index >= 0 ? index : 0
  }, [activeAmount])

  const scaleOffset = (activeRenderIndex + 0.5) * TICK_WIDTH

  return (
    <div className="shrink-0 px-3 pb-2">
      <div className="rounded-[22px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Decrease dose"
            onClick={() =>
              onDoseAmountChange(clampDoseAmount(activeAmount - DOSE_STEP))
            }
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--app-divider)] bg-[var(--app-surface)] text-[var(--color-ring)] outline-none"
          >
            <MinusIcon className="h-7 w-7" />
          </button>

          <div className="flex min-w-0 flex-col items-center">
            <span
              className="text-[11px] uppercase tracking-[0.34em] text-[var(--color-load)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              DOSE AMOUNT
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span
                className="leading-none text-[var(--app-text)]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 200,
                  fontSize: '52px',
                }}
              >
                {formatDoseAmount(activeAmount)}
              </span>
              <span
                className="text-[16px] text-[var(--color-load)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                mL
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Increase dose"
            onClick={() =>
              onDoseAmountChange(clampDoseAmount(activeAmount + DOSE_STEP))
            }
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--app-divider)] bg-[var(--app-surface)] text-[var(--color-ring)] outline-none"
          >
            <PlusIcon className="h-7 w-7" />
          </button>
        </div>

        {/* Scale ruler */}
        <div className="relative mt-[14px] h-[50px] overflow-hidden">
          {/* fixed center indicator */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 z-10 h-[30px] w-[2px] -translate-x-1/2 rounded-[1px] bg-[var(--color-ring)]"
            aria-hidden
          />

          {/* left fade */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0 z-[2] w-[72px]"
            style={{
              background:
                'linear-gradient(to right, var(--app-surface) 30%, transparent)',
            }}
            aria-hidden
          />

          {/* right fade */}
          <div
            className="pointer-events-none absolute bottom-0 right-0 top-0 z-[2] w-[72px]"
            style={{
              background:
                'linear-gradient(to left, var(--app-surface) 30%, transparent)',
            }}
            aria-hidden
          />

          {/* scrolling tick track — centered on active tick via absolute left */}
          <div
            className="absolute top-0 flex h-full items-end transition-[left] duration-[120ms] ease-out"
            style={{ left: `calc(50% - ${scaleOffset}px)` }}
          >
            {RENDER_TICKS.map((tick) => {
              const isActive = Math.abs(tick - activeAmount) < 0.005
              const isLabeled = LABELED_TICKS.has(tick)
              return (
                <div
                  key={tick}
                  className="flex shrink-0 flex-col items-center gap-[3px]"
                  style={{ width: `${TICK_WIDTH}px` }}
                >
                  <div
                    className={`rounded-[1px] ${
                      isActive
                        ? 'w-[2px] h-[30px] bg-[var(--color-ring)]'
                        : isLabeled
                          ? 'w-px h-[24px] bg-[rgba(255,255,255,0.30)]'
                          : 'w-px h-[14px] bg-[rgba(255,255,255,0.18)]'
                    }`}
                  />
                  <span
                    className={`block text-[10px] text-center leading-[1.4] ${
                      isActive
                        ? 'text-[var(--color-ring)]'
                        : 'text-[var(--app-faint)]'
                    }`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {isLabeled && !isActive ? tick.toFixed(1) : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={logDisabled}
          onClick={onLogEntry}
          className="mt-[14px] flex h-[60px] w-full items-center justify-center gap-[10px] rounded-[14px] bg-[var(--color-action)] outline-none disabled:opacity-50"
        >
          <TargetIcon className="h-5 w-5 text-black" />
          <span
            className="text-[16px] font-semibold uppercase tracking-[0.18em] text-black"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            LOG ENTRY
          </span>
        </button>
      </div>
    </div>
  )
}
