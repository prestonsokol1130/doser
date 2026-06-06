import type { ReactNode } from 'react'
import { Wordmark } from './Wordmark'

type GateLayoutProps = {
  title: string
  children: ReactNode
  actionLabel: string
  onAction: () => void
}

export function GateLayout({
  title,
  children,
  actionLabel,
  onAction,
}: GateLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <Wordmark />

      <div className="mt-12 flex flex-1 flex-col">
        <h2 className="text-lg font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]">
          {title}
        </h2>

        <div className="mt-6 flex-1 text-base leading-relaxed text-[var(--color-text-dim)]">
          {children}
        </div>

        <button
          type="button"
          onClick={onAction}
          className="mt-8 h-[4.125rem] w-full rounded-[18px] bg-[var(--color-cta)] text-lg font-semibold uppercase tracking-[0.18em] text-black"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
