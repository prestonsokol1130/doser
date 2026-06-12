import { useState } from 'react'
import { saveLocalOnboardingProfile } from '../../store/localDataStore'
import {
  defaultProfile,
  saveOnboardingProfile,
} from '../../store/profileStore'
import type { Profile } from '../../types'
import { FinishIntoTimer } from './FinishIntoTimer'
import { NotificationBasics } from './NotificationBasics'
import { ProfileSetup } from './ProfileSetup'
import { SubstanceDefaults } from './SubstanceDefaults'

export type OnboardingStep =
  | 'profile'
  | 'substance'
  | 'notification'
  | 'finish'

type OnboardingLayerProps = {
  uid?: string
  localOnly?: boolean
  onComplete: () => void
}

export function OnboardingLayer({
  uid,
  localOnly = false,
  onComplete,
}: OnboardingLayerProps) {
  const [step, setStep] = useState<OnboardingStep>('profile')
  const [profile, setProfile] = useState<Profile>(() => defaultProfile())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function goToStep(nextStep: OnboardingStep) {
    setError(null)
    setStep(nextStep)
  }

  async function handleFinish() {
    setError(null)
    setLoading(true)

    try {
      if (localOnly) {
        saveLocalOnboardingProfile(profile)
      } else {
        if (!uid) {
          throw new Error('Missing account session.')
        }
        await saveOnboardingProfile(uid, profile)
      }
      onComplete()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save your profile.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (step === 'substance') {
    return (
      <SubstanceDefaults
        profile={profile}
        onChange={setProfile}
        onNext={() => goToStep('notification')}
        onBack={() => goToStep('profile')}
      />
    )
  }

  if (step === 'notification') {
    return (
      <NotificationBasics
        profile={profile}
        onChange={setProfile}
        onNext={() => goToStep('finish')}
        onBack={() => goToStep('substance')}
      />
    )
  }

  if (step === 'finish') {
    return (
      <FinishIntoTimer
        nickname={profile.nickname}
        onFinish={() => void handleFinish()}
        onBack={() => goToStep('notification')}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <ProfileSetup
      profile={profile}
      onChange={setProfile}
      onNext={() => goToStep('substance')}
    />
  )
}
