import { OnboardingLayout } from './OnboardingLayout'

type FinishIntoTimerProps = {
  nickname: string
  onFinish: () => void
  onBack: () => void
  loading?: boolean
  error?: string | null
}

export function FinishIntoTimer({
  nickname,
  onFinish,
  onBack,
  loading = false,
  error,
}: FinishIntoTimerProps) {
  const greeting = nickname.trim()
    ? `You're set, ${nickname.trim()}.`
    : "You're set."

  return (
    <OnboardingLayout
      title="Finish Into Timer"
      actionLabel="Open Timer"
      onAction={onFinish}
      onBack={onBack}
      actionDisabled={loading}
      error={error}
    >
      <p className="text-base leading-relaxed text-[var(--color-text-dim)]">
        {greeting}
      </p>
      <p className="text-base leading-relaxed text-[var(--color-text-dim)]">
        Your profile and preferences are ready. Tap below to open the Timer and
        start tracking your next window.
      </p>
    </OnboardingLayout>
  )
}
