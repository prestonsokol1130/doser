import {
  DOSE_SCALE_TICKS,
  DOSE_STEP,
  clampDoseAmount,
  formatDoseAmount,
  snapDoseToStep,
} from './timerUtils'
import { MinusIcon, PlusIcon, TargetIcon } from './TimerIcons'

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

  return (
    <div className="shrink-0 px-4 pb-2">
      <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Decrease dose"
            onClick={() =>
              onDoseAmountChange(clampDoseAmount(activeAmount - DOSE_STEP))
            }
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <MinusIcon className="h-7 w-7 text-[var(--color-accent)]" />
          </button>

          <div className="flex min-w-0 flex-col items-center">
            <span className="text-[11px] uppercase tracking-[0.34em] text-[var(--color-purple)]">
              DOSE AMOUNT
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[clamp(36px,12vw,56px)] font-light leading-none text-[var(--color-text)]">
                {formatDoseAmount(activeAmount)}
              </span>
              <span className="text-[16px] text-[var(--color-purple)]">mL</span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Increase dose"
            onClick={() =>
              onDoseAmountChange(clampDoseAmount(activeAmount + DOSE_STEP))
            }
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <PlusIcon className="h-7 w-7 text-[var(--color-accent)]" />
          </button>
        </div>

        <div className="mt-3 px-1">
          <div className="flex items-end justify-between">
            {DOSE_SCALE_TICKS.map((tick) => {
              const isActive = Math.abs(tick - activeAmount) < 0.01
              return (
                <div
                  key={tick}
                  className="flex flex-col items-center gap-1"
                  style={{ width: `${100 / DOSE_SCALE_TICKS.length}%` }}
                >
                  <div
                    className={`w-px rounded-full ${
                      isActive ? 'h-8 bg-[var(--color-accent)]' : 'h-4 bg-[var(--color-tick-major)]'
                    }`}
                  />
                  <span
                    className={`text-[10px] ${
                      isActive
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-dim)]'
                    }`}
                  >
                    {tick.toFixed(2)}
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
          className="mt-4 flex h-[60px] w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--color-cta)] disabled:opacity-50"
        >
          <TargetIcon className="h-5 w-5 text-black" />
          <span className="text-[16px] font-semibold uppercase tracking-[0.18em] text-black">
            LOG ENTRY
          </span>
        </button>
      </div>
    </div>
  )
}
