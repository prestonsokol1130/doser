import { useState } from 'react'
import type { Profile } from '@/types'
import { NavRow } from '../tools/NavRow'
import { SubScreenHeader } from '../tools/SubScreenHeader'
import { AccountScreen } from './AccountScreen'
import { InstallAppScreen } from './InstallAppScreen'
import { LegalScreen } from './LegalScreen'
import { NotificationsScreen } from './NotificationsScreen'
import { ProfileSettingsScreen } from './ProfileSettingsScreen'
import { ThemesScreen } from './ThemesScreen'

export type SettingsScreenId =
  | 'hub'
  | 'account'
  | 'profile'
  | 'notifications'
  | 'themes'
  | 'install'
  | 'legal'

type SettingsScreenProps = {
  profile: Profile
  onProfileChange: (profile: Profile) => void
  userEmail: string | null
}

export function SettingsScreen({
  profile,
  onProfileChange,
  userEmail,
}: SettingsScreenProps) {
  const [screen, setScreen] = useState<SettingsScreenId>('hub')

  if (screen === 'account') {
    return <AccountScreen userEmail={userEmail} onBack={() => setScreen('hub')} />
  }

  if (screen === 'profile') {
    return (
      <ProfileSettingsScreen
        profile={profile}
        onProfileChange={onProfileChange}
        onBack={() => setScreen('hub')}
      />
    )
  }

  if (screen === 'notifications') {
    return (
      <NotificationsScreen
        profile={profile}
        onProfileChange={onProfileChange}
        onBack={() => setScreen('hub')}
      />
    )
  }

  if (screen === 'themes') {
    return (
      <ThemesScreen profile={profile} onBack={() => setScreen('hub')} />
    )
  }

  if (screen === 'install') {
    return <InstallAppScreen onBack={() => setScreen('hub')} />
  }

  if (screen === 'legal') {
    return <LegalScreen onBack={() => setScreen('hub')} />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader title="Settings" subtitle="Account and preferences" />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex flex-col gap-2">
          <li>
            <NavRow
              label="Account"
              description={userEmail ?? 'Signed in'}
              onClick={() => setScreen('account')}
            />
          </li>
          <li>
            <NavRow
              label="Profile"
              description={
                profile.nickname
                  ? profile.nickname
                  : 'Dose defaults and body profile'
              }
              onClick={() => setScreen('profile')}
            />
          </li>
          <li>
            <NavRow
              label="Notifications"
              description="Reminders and alerts"
              onClick={() => setScreen('notifications')}
            />
          </li>
          <li>
            <NavRow
              label="Themes"
              description="Appearance"
              onClick={() => setScreen('themes')}
            />
          </li>
          <li>
            <NavRow
              label="Install App"
              description="Add Doser to your home screen"
              onClick={() => setScreen('install')}
            />
          </li>
          <li>
            <NavRow
              label="Legal"
              description="Terms and privacy"
              onClick={() => setScreen('legal')}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
