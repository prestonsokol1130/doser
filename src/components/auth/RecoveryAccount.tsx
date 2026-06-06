import { AuthLayout } from './AuthLayout'
import { AuthLink } from './AuthLink'

type RecoveryAccountProps = {
  onLogIn: () => void
}

export function RecoveryAccount({ onLogIn }: RecoveryAccountProps) {
  return (
    <AuthLayout
      title="Restore Account"
      footer={
        <p className="text-[var(--color-text-dim)]">
          <AuthLink label="Back to Log In" onClick={onLogIn} />
        </p>
      }
    >
      <p className="text-base leading-relaxed text-[var(--color-text-dim)]">
        Account restore from backup will be available in a future update. This
        screen is a placeholder for the recovery flow.
      </p>
    </AuthLayout>
  )
}
