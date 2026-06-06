import { useEffect, useState } from 'react'
import { AuthLayer } from './components/auth/AuthLayer'
import { GateLayer } from './components/gate/GateLayer'
import { OnboardingLayer } from './components/onboarding/OnboardingLayer'
import { TimerScreen } from './components/timer/TimerScreen'
import { auth } from './lib/firebase'
import { subscribeToAuth } from './store/authStore'
import { isGateComplete } from './store/gateStore'
import { isOnboardingComplete } from './store/profileStore'

type AppPhase = 'gate' | 'auth' | 'onboarding-check' | 'onboarding' | 'timer'

function App() {
  const [gateComplete, setGateComplete] = useState(() => isGateComplete())
  const [phase, setPhase] = useState<AppPhase>(() =>
    isGateComplete() ? 'auth' : 'gate',
  )
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!gateComplete) return

    return subscribeToAuth((session) => {
      if (!session) {
        setUserId(null)
        setPhase('auth')
        return
      }

      setUserId(session.user.id)
      setPhase('onboarding-check')
    })
  }, [gateComplete])

  useEffect(() => {
    if (phase !== 'onboarding-check') return

    const uid = userId ?? auth.currentUser?.uid ?? null
    if (!uid) return

    let active = true

    isOnboardingComplete(uid)
      .then((complete) => {
        if (!active) return
        setPhase(complete ? 'timer' : 'onboarding')
      })
      .catch(() => {
        if (!active) return
        setPhase('auth')
      })

    return () => {
      active = false
    }
  }, [phase, userId])

  if (phase === 'gate') {
    return (
      <GateLayer
        onComplete={() => {
          setGateComplete(true)
          setPhase('auth')
        }}
      />
    )
  }

  if (phase === 'auth') {
    return (
      <AuthLayer
        onComplete={() => {
          const uid = auth.currentUser?.uid ?? null
          if (!uid) return
          setUserId(uid)
          setPhase('onboarding-check')
        }}
      />
    )
  }

  if (phase === 'onboarding-check') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]"
      >
        <p className="text-sm text-[var(--color-text-dim)]">
          Checking your profile…
        </p>
      </div>
    )
  }

  if (phase === 'onboarding') {
    return (
      <OnboardingLayer
        uid={userId!}
        onComplete={() => setPhase('timer')}
      />
    )
  }

  return <TimerScreen />
}

export default App
