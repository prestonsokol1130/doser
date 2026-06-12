import { signInWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { auth } from '../../lib/firebase'
import { enableLocalOnlyMode } from '../../store/localSessionStore'
import { AuthField } from './AuthField'
import { AuthLayout } from './AuthLayout'
import { AuthLink } from './AuthLink'

type LogInProps = {
  onSignUp: () => void
  onForgotPassword: () => void
  onRestoreAccount: () => void
  onSuccess: () => void
  onLocalOnly: () => void
}

export function LogIn({
  onSignUp,
  onForgotPassword,
  onRestoreAccount,
  onSuccess,
  onLocalOnly,
}: LogInProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      onSuccess()
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Unable to log in.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Log In"
      actionLabel="LOG IN"
      onAction={handleSubmit}
      actionDisabled={loading || !email.trim() || !password}
      error={error}
      footer={
        <div className="flex flex-col gap-3 text-[var(--color-text-dim)]">
          <p>
            <AuthLink
              label="Continue on this device"
              onClick={() => {
                if (enableLocalOnlyMode()) {
                  onLocalOnly()
                } else {
                  setError('Unable to save local-only preference on this device.')
                }
              }}
            />
          </p>
          <p>
            Need an account? <AuthLink label="Sign Up" onClick={onSignUp} />
          </p>
          <p>
            <AuthLink label="Forgot Password" onClick={onForgotPassword} />
          </p>
          <p>
            <AuthLink label="Restore Account" onClick={onRestoreAccount} />
          </p>
        </div>
      }
    >
      <AuthField
        id="login-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <AuthField
        id="login-password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />
    </AuthLayout>
  )
}
