import { SubScreenHeader } from './SubScreenHeader'

type SafetyReferenceScreenProps = {
  onBack: () => void
}

const SECTIONS = [
  {
    title: 'What Doser Does',
    body: 'Doser tracks dosing timing and patterns. It helps you wait for your preferred interval and understand perceived effect levels. It is not a medical device and does not guarantee safety.',
  },
  {
    title: 'Timing Intervals',
    body: 'Set your preferred dose and interval in Settings → Profile. The timer shows WAIT until your interval has passed, then SAFE when the next window opens. Spacing doses reduces stacking risk.',
  },
  {
    title: 'Perceived Effect Level',
    body: 'PEL reflects how strongly effects may feel subjectively — not blood concentration. A single dose at peak typically reads around 88%. Values near 100% only appear in extreme stacking scenarios.',
  },
  {
    title: 'Tolerance',
    body: 'After a long break, PEL may read 0% while tolerance is still elevated. That is intentional calibration, not a bug. The app uses your logged history to estimate tolerance over time.',
  },
  {
    title: 'Context Modifiers',
    body: 'Food, hydration, and sleep (via Dose Buddy) can shift perceived effect estimates slightly. Use them to reflect conditions around a dose — they do not replace spacing or dose limits.',
  },
  {
    title: 'Harm Reduction Basics',
    body: 'Use measured doses. Avoid mixing with alcohol or depressants. Never dose alone if possible. Seek medical help for unresponsiveness, vomiting while sedated, or breathing difficulty.',
  },
]

export function SafetyReferenceScreen({ onBack }: SafetyReferenceScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader
        title="Safety Reference"
        subtitle="Timing and harm reduction basics"
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex flex-col gap-3">
          {SECTIONS.map((section) => (
            <li
              key={section.title}
              className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4"
            >
              <p
                className="text-[12px] uppercase tracking-[0.12em] text-[var(--color-load)]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                {section.title}
              </p>
              <p
                className="mt-2 text-[13px] leading-relaxed text-[var(--app-dim)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {section.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
