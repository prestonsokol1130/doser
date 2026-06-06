import { Wordmark } from '../gate/Wordmark'

export function TimerScreen() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <Wordmark />
      <p className="mt-12 text-sm uppercase tracking-[0.34em] text-[var(--color-purple)]">
        Timing Awareness
      </p>
      <p className="mt-6 text-base text-[var(--color-text-dim)]">
        Timer screen coming in Phase 3.
      </p>
    </div>
  )
}
