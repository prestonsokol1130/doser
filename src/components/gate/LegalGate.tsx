import { GateLayout } from './GateLayout'

type LegalGateProps = {
  onAccept: () => void
}

export function LegalGate({ onAccept }: LegalGateProps) {
  return (
    <GateLayout title="Terms of Use" actionLabel="I ACCEPT" onAction={onAccept}>
      <p>
        Before using Doser, please review and accept our terms of use. These
        terms describe how the app works, what it does not provide, and your
        responsibilities as a user.
      </p>
      <p className="mt-4">
        <a
          href="https://usedoser.com/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-purple)] underline underline-offset-4"
        >
          Read full terms at usedoser.com/terms
        </a>
      </p>
    </GateLayout>
  )
}
