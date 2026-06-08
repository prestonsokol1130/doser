import { useCallback, useEffect, useRef, useState } from 'react'
import { auth } from '../../lib/firebase'
import {
  defaultProfile,
  fetchUserDocument,
} from '../../store/profileStore'
import type { Dose, Profile, Substance } from '../../types'
import { BottomNav } from './BottomNav'
import {
  CAROUSEL_CARD_COUNT,
  PaginationDots,
  TimerCarousel,
} from './carousel/TimerCarousel'
import { DoseCard } from './DoseCard'
import { TimerHeader } from './TimerHeader'
import { TopStatRow } from './TopStatRow'
import {
  computeTimerState,
  createDoseId,
  preferredDoseForSubstance,
  snapDoseToStep,
} from './timerUtils'

export function TimerScreen() {
  const [profile, setProfile] = useState<Profile>(defaultProfile())
  const [profileLoading, setProfileLoading] = useState(
    () => !!auth.currentUser?.uid,
  )
  const [substance, setSubstance] = useState<Substance>('GBL')
  const [doses, setDoses] = useState<Dose[]>([])
  const [doseAmount, setDoseAmount] = useState(() =>
    snapDoseToStep(preferredDoseForSubstance(defaultProfile(), 'GBL')),
  )
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const carouselScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    let active = true

    fetchUserDocument(uid)
      .then((doc) => {
        if (!active) return
        const loaded = doc?.profile ?? defaultProfile()
        setProfile(loaded)
        setDoseAmount(
          snapDoseToStep(preferredDoseForSubstance(loaded, 'GBL')),
        )
      })
      .catch(() => {
        if (!active) return
        setProfile(defaultProfile())
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const timer = computeTimerState(doses, substance, profile, nowMs)

  const handleLogEntry = useCallback(() => {
    const amount = snapDoseToStep(doseAmount)
    const dose: Dose = {
      id: createDoseId(),
      substance,
      amountMl: amount,
      ts: Date.now(),
    }
    setDoses((prev) => [...prev, dose])
    setNowMs(Date.now())
  }, [doseAmount, substance])

  const handleSubstanceToggle = useCallback(() => {
    setSubstance((prev) => {
      const next: Substance = prev === 'GBL' ? 'BDO' : 'GBL'
      setDoseAmount(
        snapDoseToStep(preferredDoseForSubstance(profile, next)),
      )
      return next
    })
  }, [profile])

  const handleCarouselIndexChange = useCallback((index: number) => {
    setCarouselIndex(index)
  }, [])

  const handleDotSelect = useCallback((index: number) => {
    setCarouselIndex(index)
    const el = carouselScrollRef.current
    if (el) {
      el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
    }
  }, [])

  if (profileLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[var(--color-bg)]">
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[var(--color-bg)]">
      <TimerHeader substance={substance} onSubstanceClick={handleSubstanceToggle} />

      <TopStatRow doses={doses} substance={substance} />

      <TimerCarousel
        activeIndex={carouselIndex}
        onActiveIndexChange={handleCarouselIndexChange}
        timer={timer}
        scrollRef={carouselScrollRef}
      />

      <PaginationDots
        count={CAROUSEL_CARD_COUNT}
        activeIndex={carouselIndex}
        onSelect={handleDotSelect}
      />

      <DoseCard
        doseAmount={doseAmount}
        onDoseAmountChange={setDoseAmount}
        onLogEntry={handleLogEntry}
      />

      <BottomNav activeTab="timer" />
    </div>
  )
}
