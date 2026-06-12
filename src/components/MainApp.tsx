import { useEffect, useRef, useState } from 'react'
import { auth } from '../lib/firebase'
import {
  fetchLocalDoseContexts,
  fetchLocalDoses,
  fetchLocalProfile,
  saveLocalDoseContexts,
  saveLocalDoses,
  saveLocalProfile,
} from '../store/localDataStore'
import {
  defaultProfile,
  fetchDoseContexts,
  fetchDoses,
  fetchUserDocument,
  saveDoseContexts,
  saveDoses,
  saveUserProfile,
} from '../store/profileStore'
import type { Dose, DoseContext, Profile } from '../types'
import { HistoryScreen } from './history/HistoryScreen'
import { InsightsScreen } from './insights/InsightsScreen'
import { SettingsScreen } from './settings/SettingsScreen'
import { BottomNav } from './timer/BottomNav'
import { TimerScreen } from './timer/TimerScreen'
import { ToolsScreen } from './tools/ToolsScreen'

type NavTab = 'insights' | 'history' | 'timer' | 'tools' | 'settings'

type MainAppProps = {
  localOnly?: boolean
  onExitLocalOnly?: () => void
}

function getInitialLocalProfile(localOnly: boolean): Profile {
  if (!localOnly) return defaultProfile()
  try {
    return fetchLocalProfile()
  } catch (error) {
    console.error('Failed to load local profile:', error)
    return defaultProfile()
  }
}

function getInitialLocalDoses(localOnly: boolean): Dose[] {
  if (!localOnly) return []
  try {
    return fetchLocalDoses()
  } catch (error) {
    console.error('Failed to load local doses:', error)
    return []
  }
}

function getInitialLocalDoseContexts(
  localOnly: boolean,
): Record<string, DoseContext> {
  if (!localOnly) return {}
  try {
    return fetchLocalDoseContexts()
  } catch (error) {
    console.error('Failed to load local dose contexts:', error)
    return {}
  }
}

export function MainApp({
  localOnly = false,
  onExitLocalOnly,
}: MainAppProps) {
  const [activeTab, setActiveTab] = useState<NavTab>('timer')
  const [profile, setProfile] = useState<Profile>(() =>
    getInitialLocalProfile(localOnly),
  )
  const [doses, setDoses] = useState<Dose[]>(() => getInitialLocalDoses(localOnly))
  const [doseContexts, setDoseContexts] = useState<
    Record<string, DoseContext>
  >(() => getInitialLocalDoseContexts(localOnly))
  const [loading, setLoading] = useState(() =>
    localOnly ? false : !!auth.currentUser?.uid,
  )
  const [nowMs, setNowMs] = useState(() => Date.now())
  const isInitialDoseLoadRef = useRef(true)
  const isInitialProfileLoadRef = useRef(true)
  const isInitialContextsLoadRef = useRef(true)
  const allowProfilePersistRef = useRef(localOnly)

  useEffect(() => {
    if (localOnly) return

    const uid = auth.currentUser?.uid
    if (!uid) return

    let active = true

    Promise.all([
      fetchUserDocument(uid),
      fetchDoses(uid),
      fetchDoseContexts(uid),
    ])
      .then(([profileDoc, loadedDoses, loadedContexts]) => {
        if (!active) return
        setProfile(profileDoc?.profile ?? defaultProfile())
        setDoses(loadedDoses)
        setDoseContexts(loadedContexts)
        allowProfilePersistRef.current = true
      })
      .catch((error) => {
        if (!active) return
        console.error('Failed to load profile or doses:', error)
        setDoses([])
        setDoseContexts({})
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [localOnly])

  useEffect(() => {
    if (localOnly) {
      if (isInitialDoseLoadRef.current) {
        isInitialDoseLoadRef.current = false
        return
      }

      const timeoutId = setTimeout(() => {
        try {
          saveLocalDoses(doses)
        } catch (error) {
          console.error('Failed to save local doses:', error)
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    }

    const uid = auth.currentUser?.uid
    if (!uid) return

    if (isInitialDoseLoadRef.current) {
      isInitialDoseLoadRef.current = false
      return
    }

    const timeoutId = setTimeout(() => {
      saveDoses(uid, doses).catch((error) => {
        console.error('Failed to save doses:', error)
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [doses, localOnly])

  useEffect(() => {
    if (localOnly) {
      if (isInitialProfileLoadRef.current) {
        isInitialProfileLoadRef.current = false
        return
      }

      if (!allowProfilePersistRef.current) return

      const timeoutId = setTimeout(() => {
        try {
          saveLocalProfile(profile)
        } catch (error) {
          console.error('Failed to save local profile:', error)
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    }

    const uid = auth.currentUser?.uid
    if (!uid) return

    if (isInitialProfileLoadRef.current) {
      isInitialProfileLoadRef.current = false
      return
    }

    if (!allowProfilePersistRef.current) return

    const timeoutId = setTimeout(() => {
      saveUserProfile(uid, profile).catch((error) => {
        console.error('Failed to save profile:', error)
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [profile, localOnly])

  useEffect(() => {
    if (localOnly) {
      if (isInitialContextsLoadRef.current) {
        isInitialContextsLoadRef.current = false
        return
      }

      const timeoutId = setTimeout(() => {
        try {
          saveLocalDoseContexts(doseContexts)
        } catch (error) {
          console.error('Failed to save local dose contexts:', error)
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    }

    const uid = auth.currentUser?.uid
    if (!uid) return

    if (isInitialContextsLoadRef.current) {
      isInitialContextsLoadRef.current = false
      return
    }

    const timeoutId = setTimeout(() => {
      saveDoseContexts(uid, doseContexts).catch((error) => {
        console.error('Failed to save dose contexts:', error)
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [doseContexts, localOnly])

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[var(--color-bg)]">
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      </div>
    )
  }

  const userEmail = localOnly ? null : (auth.currentUser?.email ?? null)

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[var(--color-bg)]">
      {activeTab === 'timer' && (
        <TimerScreen
          profile={profile}
          doses={doses}
          doseContexts={doseContexts}
          onDoseContextsChange={setDoseContexts}
          setDoses={setDoses}
          nowMs={nowMs}
        />
      )}
      {activeTab === 'history' && (
        <HistoryScreen
          doses={doses}
          setDoses={setDoses}
          profile={profile}
          nowMs={nowMs}
        />
      )}
      {activeTab === 'insights' && (
        <InsightsScreen doses={doses} profile={profile} nowMs={nowMs} />
      )}
      {activeTab === 'tools' && (
        <ToolsScreen
          profile={profile}
          onProfileChange={setProfile}
          doses={doses}
          doseContexts={doseContexts}
          onDoseContextsChange={setDoseContexts}
          nowMs={nowMs}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsScreen
          profile={profile}
          onProfileChange={setProfile}
          userEmail={userEmail}
          onExitLocalOnly={onExitLocalOnly}
        />
      )}

      <BottomNav activeTab={activeTab} onTabSelect={setActiveTab} />
    </div>
  )
}
