import { useState } from 'react'
import type { Dose, Profile } from '@/types'
import { NavRow } from './NavRow'
import { SubScreenHeader } from './SubScreenHeader'
import { DoseBuddyScreen } from './DoseBuddyScreen'
import { EmergencyResourcesScreen } from './EmergencyResourcesScreen'
import { SafetyReferenceScreen } from './SafetyReferenceScreen'
import { StashScreen } from './StashScreen'
import { TaperScreen } from './TaperScreen'
import {
  isStashLow,
  stashRemainingMl,
  stashRemainingPct,
} from '@/lib/stash'

export type ToolScreenId =
  | 'hub'
  | 'stash'
  | 'dose-buddy'
  | 'taper'
  | 'emergency'
  | 'safety'

type ToolsScreenProps = {
  profile: Profile
  onProfileChange: (profile: Profile) => void
  doses: Dose[]
  doseContexts: Record<string, import('@/types').DoseContext>
  onDoseContextsChange: (
    contexts: Record<string, import('@/types').DoseContext>,
  ) => void
  nowMs: number
}

export function ToolsScreen({
  profile,
  onProfileChange,
  doses,
  doseContexts,
  onDoseContextsChange,
  nowMs,
}: ToolsScreenProps) {
  const [screen, setScreen] = useState<ToolScreenId>('hub')

  if (screen === 'stash') {
    return (
      <StashScreen
        profile={profile}
        onProfileChange={onProfileChange}
        doses={doses}
        onBack={() => setScreen('hub')}
      />
    )
  }

  if (screen === 'dose-buddy') {
    return (
      <DoseBuddyScreen
        profile={profile}
        onProfileChange={onProfileChange}
        doses={doses}
        doseContexts={doseContexts}
        onDoseContextsChange={onDoseContextsChange}
        onBack={() => setScreen('hub')}
      />
    )
  }

  if (screen === 'taper') {
    return (
      <TaperScreen
        profile={profile}
        onProfileChange={onProfileChange}
        nowMs={nowMs}
        onBack={() => setScreen('hub')}
      />
    )
  }

  if (screen === 'emergency') {
    return (
      <EmergencyResourcesScreen onBack={() => setScreen('hub')} />
    )
  }

  if (screen === 'safety') {
    return <SafetyReferenceScreen onBack={() => setScreen('hub')} />
  }

  const remaining = stashRemainingMl(profile.stash, doses)
  const stashSummary =
    profile.stash.capacityMl > 0
      ? `${remaining.toFixed(1)} mL remaining (${stashRemainingPct(profile.stash, doses)}%)`
      : 'Set your supply to track usage'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader title="Tools" subtitle="Harm reduction utilities" />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex flex-col gap-2">
          <li>
            <NavRow
              label="Stash"
              description={
                isStashLow(profile, doses)
                  ? `Low supply — ${stashSummary}`
                  : stashSummary
              }
              onClick={() => setScreen('stash')}
            />
          </li>
          <li>
            <NavRow
              label="Dose Buddy"
              description={
                profile.doseBuddy.enabled
                  ? 'Setup, check-ins, and previous inputs'
                  : 'Supportive context check-ins before dosing'
              }
              onClick={() => setScreen('dose-buddy')}
            />
          </li>
          <li>
            <NavRow
              label="Taper"
              description={
                profile.taper.active
                  ? 'Active taper plan'
                  : 'Plan a gradual dose reduction'
              }
              onClick={() => setScreen('taper')}
            />
          </li>
          <li>
            <NavRow
              label="Emergency Resources"
              description="Crisis lines and urgent help"
              onClick={() => setScreen('emergency')}
            />
          </li>
          <li>
            <NavRow
              label="Safety Reference"
              description="Timing and harm reduction basics"
              onClick={() => setScreen('safety')}
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
