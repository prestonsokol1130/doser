import { useEffect, useRef, useState } from 'react'
import { auth } from '../lib/firebase'
import {
  defaultProfile,
  fetchDoses,
  fetchUserDocument,
  saveDoses,
} from '../store/profileStore'
import type { Dose, Profile } from '../types'
import { HistoryScreen } from './history/HistoryScreen'
import { BottomNav } from './timer/BottomNav'
import { TimerScreen } from './timer/TimerScreen'

type NavTab = 'insights' | 'history' | 'timer' | 'tools' | 'settings'

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
      <p
        className="text-[14px] uppercase tracking-[0.18em] text-[var(--app-faint)]"
        style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}
      >
        {title}
      </p>
      <p
        className="mt-2 text-center text-[12px] text-[var(--app-dim)]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        Coming in a future phase.
      </p>
    </div>
  )
}

export function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('timer')
  const [profile, setProfile] = useState<Profile>(defaultProfile())
  const [doses, setDoses] = useState<Dose[]>([])
  const [loading, setLoading] = useState(() => !!auth.currentUser?.uid)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const isInitialLoadRef = useRef(true)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    let active = true

    Promise.all([fetchUserDocument(uid), fetchDoses(uid)])
      .then(([profileDoc, loadedDoses]) => {
        if (!active) return
        setProfile(profileDoc?.profile ?? defaultProfile())
        setDoses(loadedDoses)
      })
      .catch((error) => {
        if (!active) return
        console.error('Failed to load profile or doses:', error)
        setProfile(defaultProfile())
        setDoses([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      return
    }

    const timeoutId = setTimeout(() => {
      saveDoses(uid, doses).catch((error) => {
        console.error('Failed to save doses:', error)
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [doses])

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

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[var(--color-bg)]">
      {activeTab === 'timer' && (
        <TimerScreen
          profile={profile}
          doses={doses}
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
      {activeTab === 'insights' && <PlaceholderTab title="Insights" />}
      {activeTab === 'tools' && <PlaceholderTab title="Tools" />}
      {activeTab === 'settings' && <PlaceholderTab title="Settings" />}

      <BottomNav activeTab={activeTab} onTabSelect={setActiveTab} />
    </div>
  )
}
