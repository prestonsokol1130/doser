import { SubScreenHeader } from './SubScreenHeader'

type EmergencyResourcesScreenProps = {
  onBack: () => void
}

type ResourceLink = {
  title: string
  detail: string
  href?: string
  tel?: string
}

const RESOURCES: ResourceLink[] = [
  {
    title: 'Poison Control (US)',
    detail: '24/7 guidance for suspected poisoning or overdose.',
    tel: '1-800-222-1222',
  },
  {
    title: '988 Suicide and Crisis Lifeline (US)',
    detail: 'Free, confidential support 24/7.',
    tel: '988',
  },
  {
    title: 'Emergency Services',
    detail: 'If someone is unresponsive or in immediate danger, call local emergency services.',
    tel: '911',
  },
  {
    title: 'Doser Terms and Disclaimers',
    detail: 'Review what this app does and does not provide.',
    href: 'https://usedoser.com/terms',
  },
]

export function EmergencyResourcesScreen({
  onBack,
}: EmergencyResourcesScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader
        title="Emergency Resources"
        subtitle="Urgent help and crisis lines"
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <p
          className="mb-4 text-[12px] text-[var(--app-dim)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Doser is a timing aid, not emergency medical care. If you are unsure
          whether someone needs urgent help, err on the side of calling for help.
        </p>

        <ul className="flex flex-col gap-2">
          {RESOURCES.map((resource) => (
            <li
              key={resource.title}
              className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] p-4"
            >
              <p
                className="text-[13px] uppercase tracking-[0.1em] text-[var(--app-text)]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                {resource.title}
              </p>
              <p
                className="mt-1 text-[12px] text-[var(--app-dim)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {resource.detail}
              </p>
              {resource.tel ? (
                <a
                  href={`tel:${resource.tel.replace(/-/g, '')}`}
                  className="mt-2 inline-block text-[14px] text-[var(--color-ring)] underline underline-offset-4"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  {resource.tel}
                </a>
              ) : null}
              {resource.href ? (
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[14px] text-[var(--color-ring)] underline underline-offset-4"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  Open link
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
