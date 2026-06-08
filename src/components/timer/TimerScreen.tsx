import { useCallback, useState } from 'react'
import type { Dose, Profile, Substance } from '../../types'
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

type TimerScreenProps = {
  profile: Profile
  doses: Dose[]
  setDoses: React.Dispatch<React.SetStateAction<Dose[]>>
  nowMs: number
}

export function TimerScreen({
  profile,
  doses,
  setDoses,
  nowMs,
}: TimerScreenProps) {
  const [substance, setSubstance] = useState<Substance>('GBL')
  const [doseAmount, setDoseAmount] = useState(() =>
    snapDoseToStep(preferredDoseForSubstance(profile, 'GBL')),
  )
  const [carouselIndex, setCarouselIndex] = useState(0)

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
  }, [doseAmount, substance, setDoses])

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
    </div>
  )
}
