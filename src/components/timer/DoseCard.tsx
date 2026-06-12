import { useMemo } from 'react'
import {
  DOSE_STEP,
  clampDoseAmount,
  snapDoseToStep,
} from './timerUtils'
import { MinusIcon, PlusIcon, TargetIcon } from './TimerIcons'

const TICK_WIDTH = 20

// Display-only: 0.1 to 10.0 in 0.1 steps (100 ticks, 2000px total track).
// Snap/clamp logic uses DOSE_STEP from timerUtils.
const RENDER_TICKS = Array.from({ length: 100 }, (_, i) =>
  Math.round(i + 1) / 10,
)

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
    <div className="shrink-0 pb-2">
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
                {activeAmount.toFixed(1)}
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

          {/* scrolling tick track */}
          <div
            className="absolute top-0 flex h-full items-end transition-[left] duration-[120ms] ease-out"
            style={{ left: `calc(50% - ${scaleOffset}px)` }}
          >
            {RENDER_TICKS.map((tick) => {
              const isActive = Math.abs(tick - activeAmount) < 0.005
              const rounded = Math.round(tick * 10) / 10
              const isWhole =
                Number.isInteger(Math.round(rounded * 10) / 10) &&
                Math.abs(rounded - Math.round(rounded)) < 0.005 &&
                rounded >= 1.0
              const isHalf =
                !isWhole &&
                Math.abs((Math.round(tick * 10) % 5)) < 0.01

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
                        : isWhole
                          ? 'w-px h-[22px] bg-[rgba(255,255,255,0.30)]'
                          : isHalf
                            ? 'w-px h-[18px] bg-[rgba(255,255,255,0.22)]'
                            : 'w-px h-[12px] bg-[rgba(255,255,255,0.14)]'
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
                    {isWhole && !isActive ? String(Math.round(tick)) : ''}
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
