import { SubScreenHeader } from '../tools/SubScreenHeader'

type LegalScreenProps = {
  onBack: () => void
}

const LINKS = [
  {
    label: 'Terms of Use',
    href: 'https://usedoser.com/terms',
    description: 'How the app works and your responsibilities as a user.',
  },
  {
    label: 'Privacy Policy',
    href: 'https://usedoser.com/privacy',
    description: 'How your data is handled.',
  },
]

export function LegalScreen({ onBack }: LegalScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader title="Legal" subtitle="Terms and privacy" onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <p
          className="mb-4 text-[12px] text-[var(--app-dim)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Doser is a harm reduction timing aid, not a medical device. It does not
          guarantee safety.
        </p>

        <ul className="flex flex-col gap-2">
          {LINKS.map((link) => (
            <li
              key={link.href}
              className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4"
            >
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] uppercase tracking-[0.1em] text-[var(--color-ring)] underline underline-offset-4"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                {link.label}
              </a>
              <p
                className="mt-2 text-[12px] text-[var(--app-dim)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {link.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
