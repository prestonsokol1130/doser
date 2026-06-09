import type { Dose, Profile, Substance } from '@/types'
import type { TimerState } from '../timerUtils'

export type CarouselCardData = {
  doses: Dose[]
  profile: Profile
  substance: Substance
  nowMs: number
  timer: TimerState
}
