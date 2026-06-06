import { useCallback, useState } from 'react'
import {
  acceptAgeGate,
  acceptHarmReductionGate,
  acceptLegalGate,
  getGateStep,
  type GateStep,
} from '../../store/gateStore'
import { AgeGate } from './AgeGate'
import { HarmReductionGate } from './HarmReductionGate'
import { LegalGate } from './LegalGate'

type GateLayerProps = {
  onComplete: () => void
}

export function GateLayer({ onComplete }: GateLayerProps) {
  const [step, setStep] = useState<GateStep>(() => getGateStep())

  const advance = useCallback(
    (next: GateStep) => {
      setStep(next)
      if (next === 'complete') {
        onComplete()
      }
    },
    [onComplete],
  )

  if (step === 'age') {
    return (
      <AgeGate
        onConfirm={() => {
          acceptAgeGate()
          advance('legal')
        }}
      />
    )
  }

  if (step === 'legal') {
    return (
      <LegalGate
        onAccept={() => {
          acceptLegalGate()
          advance('harm-reduction')
        }}
      />
    )
  }

  if (step === 'harm-reduction') {
    return (
      <HarmReductionGate
        onUnderstand={() => {
          acceptHarmReductionGate()
          advance('complete')
        }}
      />
    )
  }

  return null
}
