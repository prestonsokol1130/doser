import { useCallback, useEffect, useState } from 'react'
import { getSession, subscribeToAuth } from '../../store/authStore'
import { ForgotPassword } from './ForgotPassword'
import { LogIn } from './LogIn'
import { RecoveryAccount } from './RecoveryAccount'
import { SignUp } from './SignUp'

export type AuthStep = 'login' | 'signup' | 'forgot-password' | 'recovery'

type AuthLayerProps = {
  onComplete: () => void
}

export function AuthLayer({ onComplete }: AuthLayerProps) {
  const [step, setStep] = useState<AuthStep>('login')
  const [checkingSession, setCheckingSession] = useState(true)

  const completeIfSession = useCallback(
    (session: { user: { id: string } } | null) => {
      if (session) {
        onComplete()
      }
    },
    [onComplete],
  )

  useEffect(() => {
    let active = true

    getSession().then((session) => {
      if (!active) return
      completeIfSession(session)
      setCheckingSession(false)
    })

    const unsubscribe = subscribeToAuth((session) => {
      completeIfSession(session)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [completeIfSession])

  if (checkingSession) {
    return <div className="min-h-screen bg-[var(--color-bg)]" />
  }

  if (step === 'signup') {
    return (
      <SignUp
        onLogIn={() => setStep('login')}
        onSuccess={onComplete}
      />
    )
  }

  if (step === 'forgot-password') {
    return <ForgotPassword onLogIn={() => setStep('login')} />
  }

  if (step === 'recovery') {
    return <RecoveryAccount onLogIn={() => setStep('login')} />
  }

  return (
    <LogIn
      onSignUp={() => setStep('signup')}
      onForgotPassword={() => setStep('forgot-password')}
      onRestoreAccount={() => setStep('recovery')}
      onSuccess={onComplete}
    />
  )
}
