import { GateLayout } from './GateLayout'

type AgeGateProps = {
  onConfirm: () => void
}

export function AgeGate({ onConfirm }: AgeGateProps) {
  return (
    <GateLayout
      title="Age Requirement"
      actionLabel="I CONFIRM MY AGE"
      onAction={onConfirm}
    >
      <p>
        Doser is intended for adults only. You must be at least 18 years old
        to use this app.
      </p>
      <p className="mt-4">
        By continuing, you confirm that you meet this age requirement.
      </p>
    </GateLayout>
  )
}
