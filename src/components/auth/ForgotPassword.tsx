import { sendPasswordResetEmail } from 'firebase/auth'
import { useState } from 'react'
import { auth } from '../../lib/firebase'
import { AuthField } from './AuthField'
import { AuthLayout } from './AuthLayout'
import { AuthLink } from './AuthLink'

type ForgotPasswordProps = {
  onLogIn: () => void
}

export function ForgotPassword({ onLogIn }: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/`,
      })
      setMessage(
        'If an account exists for that email, a reset link has been sent.',
      )
    } catch (resetError) {
      console.error(resetError)
      setError('Unable to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Forgot Password"
      actionLabel="SEND RESET LINK"
      onAction={handleSubmit}
      actionDisabled={loading || !email.trim()}
      error={error}
      message={message}
      footer={
        <p className="text-[var(--color-text-dim)]">
          <AuthLink label="Back to Log In" onClick={onLogIn} />
        </p>
      }
    >
      <p className="text-base leading-relaxed text-[var(--color-text-dim)]">
        Enter the email associated with your account. We will send you a link to
        reset your password.
      </p>
      <AuthField
        id="forgot-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
    </AuthLayout>
  )
}
