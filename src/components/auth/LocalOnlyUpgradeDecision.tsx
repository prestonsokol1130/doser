import { useState } from 'react'
import type { LocalDataStatus } from '../../store/localDataStore'

type LocalOnlyUpgradeDecisionProps = {
  userEmail: string | null
  localDataStatus: LocalDataStatus
  onContinueToAccount: () => void
  onStayOnDevice: () => Promise<void>
}

type PendingAction = 'account' | 'device' | null

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
      <p
        className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
        style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-[14px] text-[var(--app-text)]"
        style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
      >
        {value}
      </p>
    </div>
  )
}

export function LocalOnlyUpgradeDecision({
  userEmail,
  localDataStatus,
  onContinueToAccount,
  onStayOnDevice,
}: LocalOnlyUpgradeDecisionProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleStayOnDevice() {
    setError(null)
    setPendingAction('device')

    try {
      await onStayOnDevice()
    } catch (stayError) {
      setError(
        stayError instanceof Error
          ? stayError.message
          : 'Unable to return to device-only mode.',
      )
      setPendingAction(null)
    }
  }

  function handleContinueToAccount() {
    setError(null)
    setPendingAction('account')
    onContinueToAccount()
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-6 text-[var(--app-text)]">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-[440px] flex-col justify-center gap-4">
        <div className="rounded-[20px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-5">
          <p
            className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-load)]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Storage decision
          </p>
          <h1
            className="mt-2 text-[22px] uppercase tracking-[0.18em] text-[var(--app-text)]"
            style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}
          >
            Choose how to continue
          </h1>
          <p
            className="mt-3 text-[14px] leading-relaxed text-[var(--app-dim)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            This device still has local-only data. Your signed-in account uses a
            separate storage path. Nothing has been moved, deleted, or merged.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SummaryCard
            label="Signed-in account"
            value={userEmail ?? 'Email not available'}
          />
          <SummaryCard
            label="Local profile"
            value={
              localDataStatus.onboardingComplete || localDataStatus.hasProfile
                ? 'Saved on this device'
                : 'Not saved'
            }
          />
          <SummaryCard
            label="Saved doses"
            value={`${localDataStatus.doseCount}`}
          />
          <SummaryCard
            label="Saved check-ins"
            value={`${localDataStatus.doseContextCount}`}
          />
        </div>

        <div className="rounded-[20px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-5">
          <p
            className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            What happens next
          </p>
          <div
            className="mt-3 space-y-3 text-[14px] leading-relaxed text-[var(--app-dim)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <p>
              Continue with account storage: the app switches to your signed-in
              account. Local-only data stays on this device for later import.
            </p>
            <p>
              Stay on this device: the app signs this account back out and keeps
              using your local-only data on this device.
            </p>
            <p>
              If this account already has cloud-backed data, it stays separate
              and will not be overwritten.
            </p>
          </div>
        </div>

        {error ? (
          <p
            className="text-[12px] text-[var(--color-action)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleContinueToAccount}
            disabled={pendingAction !== null}
            className="h-12 w-full rounded-[14px] bg-[var(--color-action)] text-[13px] uppercase tracking-[0.14em] text-black outline-none transition-opacity duration-[150ms] disabled:opacity-40"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            {pendingAction === 'account'
              ? 'Opening account storage…'
              : 'Use account storage'}
          </button>
          <button
            type="button"
            onClick={() => void handleStayOnDevice()}
            disabled={pendingAction !== null}
            className="h-12 w-full rounded-[14px] border border-[var(--app-divider)] bg-[var(--app-surface)] text-[13px] uppercase tracking-[0.14em] text-[var(--app-text)] outline-none transition-opacity duration-[150ms] disabled:opacity-40"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            {pendingAction === 'device'
              ? 'Returning to device-only mode…'
              : 'Stay on this device'}
          </button>
        </div>
      </div>
    </div>
  )
}
