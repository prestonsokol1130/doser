import type { ReactNode } from 'react'
import { Wordmark } from '../gate/Wordmark'

type OnboardingLayoutProps = {
  title: string
  children: ReactNode
  actionLabel: string
  onAction: () => void
  actionDisabled?: boolean
  onBack?: () => void
  error?: string | null
}

export function OnboardingLayout({
  title,
  children,
  actionLabel,
  onAction,
  actionDisabled = false,
  onBack,
  error,
}: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <Wordmark />

      <div className="mt-12 flex flex-1 flex-col">
        <h2 className="text-lg font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]">
          {title}
        </h2>

        <form
          className="mt-6 flex flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            onAction()
          }}
        >
          <div className="flex flex-1 flex-col gap-5">{children}</div>

          {error ? (
            <p className="mt-4 text-sm text-[var(--color-cta)]">{error}</p>
          ) : null}

          <div className={`mt-8 flex gap-3 ${onBack ? '' : ''}`}>
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="h-[4.125rem] flex-1 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] text-lg font-semibold uppercase tracking-[0.18em] text-[var(--color-text)]"
              >
                Back
              </button>
            ) : null}
            <button
              type="submit"
              disabled={actionDisabled}
              className={`h-[4.125rem] rounded-[18px] bg-[var(--color-cta)] text-lg font-semibold uppercase tracking-[0.18em] text-black disabled:opacity-50 ${onBack ? 'flex-1' : 'w-full'}`}
            >
              {actionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
