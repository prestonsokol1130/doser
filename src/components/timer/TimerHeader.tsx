import type { Substance } from '../../types'
import { ChevronDownIcon, FlashlightIcon } from './TimerIcons'

type TimerHeaderProps = {
  substance: Substance
  onToggleSubstance: () => void
}

export function TimerHeader({ substance, onToggleSubstance }: TimerHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[3.5rem] font-light lowercase leading-none tracking-[0.16em] text-[var(--color-text)]">
          doser
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.34em] text-[var(--color-purple)]">
          TIMING AWARENESS
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Flashlight"
          className="flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
        >
          <FlashlightIcon />
        </button>

        <button
          type="button"
          onClick={onToggleSubstance}
          aria-label={`Selected substance ${substance}. Tap to switch.`}
          className="flex h-[4.75rem] min-w-[8rem] items-center justify-center gap-2 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text)]"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-accent)]"
            aria-hidden
          />
          <span>{substance}</span>
          <ChevronDownIcon className="text-[var(--color-text-dim)]" />
        </button>
      </div>
    </header>
  )
}
