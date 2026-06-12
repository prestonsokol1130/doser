import { useState } from 'react'
import { logOut } from '@/store/authStore'
import { isLocalOnlyMode } from '@/store/localSessionStore'
import { SubScreenHeader } from '../tools/SubScreenHeader'

type AccountScreenProps = {
  userEmail: string | null
  onBack: () => void
}

export function AccountScreen({ userEmail, onBack }: AccountScreenProps) {
  const localOnly = isLocalOnlyMode()
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignOut() {
    setError(null)
    setSigningOut(true)
    try {
      await logOut()
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : 'Unable to sign out.',
      )
    } finally {
      setSigningOut(false)
    }
  }

  if (localOnly) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SubScreenHeader
          title="Account"
          subtitle="Device-only storage"
          onBack={onBack}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
            <p
              className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Storage mode
            </p>
            <p
              className="mt-1 text-[14px] text-[var(--app-text)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              This device only
            </p>
          </div>

          <div className="mt-3 rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
            <p
              className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Cloud sync
            </p>
            <p
              className="mt-1 text-[14px] leading-relaxed text-[var(--app-dim)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Your profile and doses stay on this device. Sign in or create an
              account from the log in screen when you want cloud backup.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader title="Account" subtitle="Sign in details" onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4">
          <p
            className="text-[10px] uppercase tracking-[0.14em] text-[var(--app-faint)]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Email
          </p>
          <p
            className="mt-1 text-[14px] text-[var(--app-text)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {userEmail ?? 'Not available'}
          </p>
        </div>

        {error ? (
          <p
            className="mt-4 text-[12px] text-[var(--color-action)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="mt-6 h-12 w-full rounded-[14px] border border-[var(--color-action)] text-[13px] uppercase tracking-[0.14em] text-[var(--color-action)] outline-none transition-opacity duration-[150ms] disabled:opacity-40"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
