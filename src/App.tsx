import { useEffect, useState } from 'react'
import { AuthLayer } from './components/auth/AuthLayer'
import { GateLayer } from './components/gate/GateLayer'
import { OnboardingLayer } from './components/onboarding/OnboardingLayer'
import { MainApp } from './components/MainApp'
import { auth } from './lib/firebase'
import { subscribeToAuth } from './store/authStore'
import { isGateComplete } from './store/gateStore'
import { isLocalOnboardingComplete } from './store/localDataStore'
import {
  clearLocalOnlyMode,
  isLocalOnlyMode,
} from './store/localSessionStore'
import { isOnboardingComplete } from './store/profileStore'

type AppPhase = 'gate' | 'auth' | 'onboarding-check' | 'onboarding' | 'timer'

function resolveLocalPhase(): AppPhase {
  return isLocalOnboardingComplete() ? 'timer' : 'onboarding'
}

function getInitialPhase(): AppPhase {
  if (!isGateComplete()) return 'gate'
  if (isLocalOnlyMode()) return resolveLocalPhase()
  return 'auth'
}

function App() {
  const [gateComplete, setGateComplete] = useState(() => isGateComplete())
  const [phase, setPhase] = useState<AppPhase>(getInitialPhase)
  const [userId, setUserId] = useState<string | null>(null)
  const [localOnly, setLocalOnly] = useState(() => isLocalOnlyMode())

  useEffect(() => {
    if (!gateComplete) return

    return subscribeToAuth((session) => {
      if (session) {
        clearLocalOnlyMode()
        setLocalOnly(false)
        setUserId(session.user.id)
        setPhase('onboarding-check')
        return
      }

      if (isLocalOnlyMode()) {
        setLocalOnly(true)
        setUserId(null)
        setPhase(resolveLocalPhase())
        return
      }

      setLocalOnly(false)
      setUserId(null)
      setPhase('auth')
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
          if (isLocalOnlyMode()) {
            setLocalOnly(true)
            setPhase(resolveLocalPhase())
          } else {
            setPhase('auth')
          }
        }}
      />
    )
  }

  if (phase === 'auth') {
    return (
      <AuthLayer
        onComplete={() => {
          clearLocalOnlyMode()
          setLocalOnly(false)
          const uid = auth.currentUser?.uid ?? null
          if (!uid) return
          setUserId(uid)
          setPhase('onboarding-check')
        }}
        onLocalOnly={() => {
          setLocalOnly(true)
          setUserId(null)
          setPhase(resolveLocalPhase())
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
        uid={localOnly ? undefined : userId ?? undefined}
        localOnly={localOnly}
        onComplete={() => setPhase('timer')}
      />
    )
  }

  return (
    <MainApp
      localOnly={localOnly}
      onExitLocalOnly={() => {
        clearLocalOnlyMode()
        setLocalOnly(false)
        setUserId(null)
        setPhase('auth')
      }}
    />
  )
}

export default App
