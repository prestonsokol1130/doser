import type { Profile } from '@/types'
import { SubScreenHeader } from '../tools/SubScreenHeader'

type ThemesScreenProps = {
  profile: Profile
  onBack: () => void
}

export function ThemesScreen({ profile, onBack }: ThemesScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader title="Themes" subtitle="Appearance" onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="rounded-[16px] border border-[var(--color-ring)] bg-[var(--app-surface)] p-4">
          <p
            className="text-[13px] uppercase tracking-[0.12em] text-[var(--color-ring)]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Dark
          </p>
          <p
            className="mt-2 text-[12px] text-[var(--app-dim)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Doser uses a single dark theme for clinical readability. Light mode
            is not available.
          </p>
        </div>

        <p
          className="mt-4 text-[12px] text-[var(--app-faint)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Current theme: {profile.themeId}
        </p>
      </div>
    </div>
  )
}
