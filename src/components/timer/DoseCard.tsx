import {
  DOSE_SCALE_MAX,
  DOSE_SCALE_MIN,
  DOSE_SCALE_STEP,
  DOSE_SCALE_TICKS,
  formatDoseMl,
  scaleTickValues,
  snapDoseToScale,
} from './timerUtils'
import { MinusIcon, PlusIcon, TargetIcon } from './TimerIcons'

type DoseCardProps = {
  doseMl: number
  onDoseChange: (value: number) => void
  onLogEntry: () => void
}

export function DoseCard({ doseMl, onDoseChange, onLogEntry }: DoseCardProps) {
  const ticks = scaleTickValues()
  const activeIndex = Math.round((doseMl - DOSE_SCALE_MIN) / DOSE_SCALE_STEP)

  function step(delta: number) {
    onDoseChange(snapDoseToScale(doseMl + delta * DOSE_SCALE_STEP))
  }

  return (
    <div className="mt-6 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          aria-label="Decrease dose"
          onClick={() => step(-1)}
          disabled={doseMl <= DOSE_SCALE_MIN}
          className="flex h-[5.375rem] w-[5.375rem] shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-accent)] disabled:opacity-40"
        >
          <MinusIcon />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-[0.9375rem] uppercase tracking-[0.34em] text-[var(--color-purple)]">
            DOSE AMOUNT
          </p>
          <p className="mt-1 flex items-baseline justify-center gap-2">
            <span className="text-[5.25rem] font-light leading-none text-[var(--color-text)]">
              {formatDoseMl(doseMl)}
            </span>
            <span className="text-[1.375rem] text-[var(--color-purple)]">mL</span>
          </p>
        </div>

        <button
          type="button"
          aria-label="Increase dose"
          onClick={() => step(1)}
          disabled={doseMl >= DOSE_SCALE_MAX}
          className="flex h-[5.375rem] w-[5.375rem] shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-accent)] disabled:opacity-40"
        >
          <PlusIcon />
        </button>
      </div>

      <div className="relative mt-8 h-14">
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between">
          {ticks.map((tick, index) => {
            const isCenter = index === activeIndex
            const isMajor = index % 4 === 0
            const height = isCenter ? '3.5rem' : isMajor ? '2rem' : '1rem'
            const color = isCenter
              ? 'var(--color-accent)'
              : isMajor
                ? 'var(--color-tick-major)'
                : 'var(--color-tick-minor)'

            return (
              <div key={tick} className="flex flex-col items-center gap-2">
                {index % 4 === 0 ? (
                  <span
                    className={`text-base ${
                      isCenter
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-dim)]'
                    }`}
                  >
                    {tick.toFixed(2)}
                  </span>
                ) : (
                  <span className="h-4" aria-hidden />
                )}
                <button
                  type="button"
                  aria-label={`Set dose to ${tick.toFixed(2)} milliliters`}
                  onClick={() => onDoseChange(tick)}
                  className="w-px rounded-full"
                  style={{ height, backgroundColor: color }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onLogEntry}
        className="mt-8 flex h-[5.125rem] w-full items-center justify-center gap-3 rounded-[18px] bg-[var(--color-cta)] text-[1.375rem] font-semibold uppercase tracking-[0.18em] text-black"
      >
        <TargetIcon />
        LOG ENTRY
      </button>
    </div>
  )
}

export { DOSE_SCALE_TICKS }
