import { useEffect, useState } from 'react'
import { AuthLayer } from './components/auth/AuthLayer'
import { LocalOnlyUpgradeDecision } from './components/auth/LocalOnlyUpgradeDecision'
import { GateLayer } from './components/gate/GateLayer'
import { OnboardingLayer } from './components/onboarding/OnboardingLayer'
import { MainApp } from './components/MainApp'
import { auth } from './lib/firebase'
import { logOut, subscribeToAuth } from './store/authStore'
import { isGateComplete } from './store/gateStore'
import {
  getLocalDataStatus,
  isLocalOnboardingComplete,
} from './store/localDataStore'
import {
  clearLocalOnlyAuthFlow,
  clearLocalOnlyMode,
  enterLocalOnlyAuthFlow,
  isLocalOnlyAuthFlow,
  isLocalOnlyMode,
} from './store/localSessionStore'
import { isOnboardingComplete } from './store/profileStore'

type AppPhase =
  | 'gate'
  | 'auth'
  | 'local-upgrade'
  | 'onboarding-check'
  | 'onboarding'
  | 'timer'

function resolveLocalPhase(): AppPhase {
  return isLocalOnboardingComplete() ? 'timer' : 'onboarding'
}

function shouldPauseForLocalUpgrade(): boolean {
  return isLocalOnlyMode() && getLocalDataStatus().hasAnyData
}

function getInitialPhase(): AppPhase {
  if (!isGateComplete()) return 'gate'
  if (shouldPauseForLocalUpgrade() && auth.currentUser?.uid) {
    return 'local-upgrade'
  }
  if (isLocalOnlyAuthFlow()) return 'auth'
  if (isLocalOnlyMode()) return resolveLocalPhase()
  return 'auth'
}

function App() {
  const [gateComplete, setGateComplete] = useState(() => isGateComplete())
  const [phase, setPhase] = useState<AppPhase>(getInitialPhase)
  const [userId, setUserId] = useState<string | null>(null)
  const [localOnly, setLocalOnly] = useState(() => isLocalOnlyMode())
  const [localDataStatus, setLocalDataStatus] = useState(() => getLocalDataStatus())

  useEffect(() => {
    if (!gateComplete) return

    return subscribeToAuth((session) => {
      if (session) {
        setUserId(session.user.id)

        if (shouldPauseForLocalUpgrade()) {
          setLocalOnly(true)
          setLocalDataStatus(getLocalDataStatus())
          setPhase('local-upgrade')
          return
        }

        clearLocalOnlyMode()
        setLocalOnly(false)
        setPhase('onboarding-check')
        return
      }

      if (isLocalOnlyAuthFlow()) {
        setLocalOnly(true)
        setUserId(null)
        setPhase('auth')
        return
      }

      if (isLocalOnlyMode()) {
        setLocalOnly(true)
        setUserId(null)
        setLocalDataStatus(getLocalDataStatus())
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
            setLocalDataStatus(getLocalDataStatus())
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
          const uid = auth.currentUser?.uid ?? null
          if (!uid) return
          setUserId(uid)

          if (shouldPauseForLocalUpgrade()) {
            setLocalOnly(true)
            setLocalDataStatus(getLocalDataStatus())
            setPhase('local-upgrade')
            return
          }

          clearLocalOnlyAuthFlow()
          clearLocalOnlyMode()
          setLocalOnly(false)
          setPhase('onboarding-check')
        }}
        onLocalOnly={() => {
          clearLocalOnlyAuthFlow()
          setLocalOnly(true)
          setUserId(null)
          setLocalDataStatus(getLocalDataStatus())
          setPhase(resolveLocalPhase())
        }}
      />
    )
  }

  if (phase === 'local-upgrade') {
    return (
      <LocalOnlyUpgradeDecision
        userEmail={auth.currentUser?.email ?? null}
        localDataStatus={localDataStatus}
        onContinueToAccount={() => {
          const uid = userId ?? auth.currentUser?.uid ?? null
          if (!uid) {
            setPhase('auth')
            return
          }

          clearLocalOnlyMode()
          setLocalOnly(false)
          setUserId(uid)
          setPhase('onboarding-check')
        }}
        onStayOnDevice={async () => {
          clearLocalOnlyAuthFlow()
          await logOut()
          setLocalOnly(true)
          setUserId(null)
          setLocalDataStatus(getLocalDataStatus())
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
        if (!enterLocalOnlyAuthFlow()) {
          return
        }
        setLocalOnly(true)
        setUserId(null)
        setPhase('auth')
      }}
    />
  )
}

export default App
