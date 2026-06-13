import { useCallback, useState } from 'react'
import type { Dose, DoseContext, Profile, Substance } from '../../types'
import {
  CAROUSEL_CARD_COUNT,
  PaginationDots,
  TimerCarousel,
} from './carousel/TimerCarousel'
import { DoseBuddyCheckInSheet } from './DoseBuddyCheckInSheet'
import { DoseCard } from './DoseCard'
import { TimerHeader } from './TimerHeader'
import { TopStatRow } from './TopStatRow'
import { DEFAULT_DOSE_CONTEXT } from '@/lib/doseBuddy'
import { currentSession } from '@/lib/sessionStats'
import {
  computeTimerState,
  createDoseId,
  preferredDoseForSubstance,
  snapDoseToStep,
} from './timerUtils'

type TimerScreenProps = {
  profile: Profile
  doses: Dose[]
  doseContexts: Record<string, DoseContext>
  onDoseContextsChange: React.Dispatch<
    React.SetStateAction<Record<string, DoseContext>>
  >
  setDoses: React.Dispatch<React.SetStateAction<Dose[]>>
  nowMs: number
}

export function TimerScreen({
  profile,
  doses,
  doseContexts,
  onDoseContextsChange,
  setDoses,
  nowMs,
}: TimerScreenProps) {
  const [substance, setSubstance] = useState<Substance>('GBL')
  const [doseAmount, setDoseAmount] = useState(() =>
    snapDoseToStep(preferredDoseForSubstance(profile, 'GBL')),
  )
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [draftContext, setDraftContext] = useState<DoseContext>(DEFAULT_DOSE_CONTEXT)

  const timer = computeTimerState(doses, substance, profile, nowMs)
  const activeSession = currentSession(doses, substance, profile, nowMs)
  const isRedose = activeSession.length > 0

  const commitDose = useCallback(
    (context: DoseContext | null) => {
      const amount = snapDoseToStep(doseAmount)
      const dose: Dose = {
        id: createDoseId(),
        substance,
        amountMl: amount,
        ts: Date.now(),
      }
      setDoses((prev) => [...prev, dose])
      if (context) {
        onDoseContextsChange((prev) => ({
          ...prev,
          [dose.id]: context,
        }))
      }
      setDraftContext(DEFAULT_DOSE_CONTEXT)
      setCheckInOpen(false)
    },
    [doseAmount, onDoseContextsChange, setDoses, substance],
  )

  const handleLogEntry = useCallback(() => {
    if (!profile.doseBuddy.enabled || !profile.doseBuddy.checkInBeforeDose) {
      commitDose(null)
      return
    }
    setDraftContext(DEFAULT_DOSE_CONTEXT)
    setCheckInOpen(true)
  }, [commitDose, profile.doseBuddy.checkInBeforeDose, profile.doseBuddy.enabled])

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
  }, [])

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]"
    >
      <TimerHeader substance={substance} onSubstanceClick={handleSubstanceToggle} />

      <TopStatRow doses={doses} substance={substance} />

      <TimerCarousel
        activeIndex={carouselIndex}
        onActiveIndexChange={handleCarouselIndexChange}
        timer={timer}
        doses={doses}
        profile={profile}
        substance={substance}
        nowMs={nowMs}
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

      {checkInOpen ? (
        <DoseBuddyCheckInSheet
          profile={profile}
          doses={doses}
          doseContexts={doseContexts}
          substance={substance}
          amountMl={snapDoseToStep(doseAmount)}
          nowMs={nowMs}
          isRedose={isRedose}
          context={draftContext}
          onContextChange={setDraftContext}
          onSkip={() => commitDose(null)}
          onBack={() => setCheckInOpen(false)}
          onConfirm={() => commitDose(draftContext)}
        />
      ) : null}
    </div>
  )
}
