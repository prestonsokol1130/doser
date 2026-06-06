import type { Substance } from '../../types'
import { ChevronDownIcon, FlashlightIcon } from './TimerIcons'

type TimerHeaderProps = {
  substance: Substance
  onSubstanceClick?: () => void
}

export function TimerHeader({ substance, onSubstanceClick }: TimerHeaderProps) {
  return (
    <header className="flex shrink-0 items-start justify-between px-4 pt-3">
      <div className="flex flex-col">
        <h1 className="font-display text-[clamp(28px,10vw,40px)] font-light lowercase tracking-[0.16em] text-[var(--color-text)]">
          doser
        </h1>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.34em] text-[var(--color-purple)]">
          TIMING AWARENESS
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Flashlight"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <FlashlightIcon className="h-5 w-5 text-[var(--color-text)]" />
        </button>

        <button
          type="button"
          aria-label={`Selected substance: ${substance}`}
          onClick={onSubstanceClick}
          className="flex h-14 min-w-[100px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]"
            aria-hidden
          />
          <span className="text-sm text-[var(--color-text)]">{substance}</span>
          <ChevronDownIcon className="h-4 w-4 text-[var(--color-text)]" />
        </button>
      </div>
    </header>
  )
}
