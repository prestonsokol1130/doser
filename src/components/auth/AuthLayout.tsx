import type { ReactNode } from 'react'
import { Wordmark } from '../gate/Wordmark'

type AuthLayoutProps = {
  title: string
  children: ReactNode
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
  footer?: ReactNode
  message?: string | null
  error?: string | null
}

export function AuthLayout({
  title,
  children,
  actionLabel,
  onAction,
  actionDisabled = false,
  footer,
  message,
  error,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <Wordmark />

      <div className="mt-12 flex flex-1 flex-col">
        <h2 className="text-lg font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]">
          {title}
        </h2>

        <div className="mt-6 flex flex-1 flex-col">
          {actionLabel && onAction ? (
            <form
              className="flex flex-1 flex-col"
              onSubmit={(event) => {
                event.preventDefault()
                onAction()
              }}
            >
              <div className="flex flex-col gap-5">{children}</div>

              {error ? (
                <p className="mt-4 text-sm text-[var(--color-cta)]">{error}</p>
              ) : null}

              {message ? (
                <p className="mt-4 text-sm text-[var(--color-text-dim)]">{message}</p>
              ) : null}

              <button
                type="submit"
                disabled={actionDisabled}
                className="mt-8 h-[4.125rem] w-full rounded-[18px] bg-[var(--color-cta)] text-lg font-semibold uppercase tracking-[0.18em] text-black disabled:opacity-50"
              >
                {actionLabel}
              </button>
            </form>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="flex flex-col gap-5">{children}</div>
            </div>
          )}
        </div>

        {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
      </div>
    </div>
  )
}
