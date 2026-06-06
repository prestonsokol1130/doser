import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { auth } from '../../lib/firebase'
import { AuthField } from './AuthField'
import { AuthLayout } from './AuthLayout'
import { AuthLink } from './AuthLink'

type SignUpProps = {
  onLogIn: () => void
  onSuccess: () => void
}

export function SignUp({ onLogIn, onSuccess }: SignUpProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      )

      if (userCredential.user) {
        onSuccess()
        return
      }

      setMessage('Check your email to confirm your account, then log in.')
    } catch (signUpError) {
      setError(
        signUpError instanceof Error
          ? signUpError.message
          : 'Unable to create account.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Sign Up"
      actionLabel="CREATE ACCOUNT"
      onAction={handleSubmit}
      actionDisabled={
        loading || !email.trim() || !password || !confirmPassword
      }
      error={error}
      message={message}
      footer={
        <p className="text-[var(--color-text-dim)]">
          Already have an account? <AuthLink label="Log In" onClick={onLogIn} />
        </p>
      }
    >
      <AuthField
        id="signup-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <AuthField
        id="signup-password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />
      <AuthField
        id="signup-confirm-password"
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
      />
    </AuthLayout>
  )
}
