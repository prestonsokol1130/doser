import { GateLayout } from './GateLayout'

type HarmReductionGateProps = {
  onUnderstand: () => void
}

export function HarmReductionGate({ onUnderstand }: HarmReductionGateProps) {
  return (
    <GateLayout
      title="Harm Reduction"
      actionLabel="I UNDERSTAND"
      onAction={onUnderstand}
    >
      <p>
        Doser is a timing and safety aid. It helps you track dosing intervals
        and patterns — it is not a guarantee of safety.
      </p>
      <p className="mt-4">
        This app does not provide medical advice, diagnosis, or treatment. It
        is not a medical device. Always use your own judgment and seek
        professional help when needed.
      </p>
    </GateLayout>
  )
}
