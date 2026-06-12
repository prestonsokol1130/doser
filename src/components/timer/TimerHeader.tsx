import type { Substance } from '../../types'
import { ChevronDownIcon, FlashlightIcon } from './TimerIcons'

type TimerHeaderProps = {
  substance: Substance
  onSubstanceClick?: () => void
}

export function TimerHeader({ substance, onSubstanceClick }: TimerHeaderProps) {
  return (
    <header className="flex shrink-0 items-start justify-between pt-3.5">
      <div className="flex flex-col">
        <h1
          className="font-display text-[38px] font-light lowercase leading-[1.05] tracking-[0.16em] text-[var(--app-text)]"
        >
          doser
        </h1>
        <p
          className="mt-0.5 text-[11px] uppercase tracking-[0.34em] text-[var(--color-load)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          TIMING AWARENESS
        </p>
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          aria-label="Toggle flashlight"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[var(--app-divider)] bg-[var(--app-surface)] text-[var(--app-text)] outline-none"
        >
          <FlashlightIcon className="h-6 w-6" />
        </button>

        <button
          type="button"
          aria-label={`Selected substance: ${substance}`}
          onClick={onSubstanceClick}
          className="flex h-14 min-w-[106px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-[14px] text-[var(--app-text)] outline-none"
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-ring)]"
            aria-hidden
          />
          <span>{substance}</span>
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  )
}
