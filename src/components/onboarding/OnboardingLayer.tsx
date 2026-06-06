import { useState } from 'react'
import { auth } from '../../lib/firebase'
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
  onComplete: () => void
}

export function OnboardingLayer({ onComplete }: OnboardingLayerProps) {
  const [step, setStep] = useState<OnboardingStep>('profile')
  const [profile, setProfile] = useState<Profile>(() => defaultProfile())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinish() {
    const uid = auth.currentUser?.uid
    if (!uid) {
      setError('You must be signed in to complete onboarding.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      await saveOnboardingProfile(uid, profile)
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
        onNext={() => setStep('notification')}
        onBack={() => setStep('profile')}
      />
    )
  }

  if (step === 'notification') {
    return (
      <NotificationBasics
        profile={profile}
        onChange={setProfile}
        onNext={() => setStep('finish')}
        onBack={() => setStep('substance')}
      />
    )
  }

  if (step === 'finish') {
    return (
      <FinishIntoTimer
        nickname={profile.nickname}
        onFinish={() => void handleFinish()}
        onBack={() => setStep('notification')}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <ProfileSetup
      profile={profile}
      onChange={setProfile}
      onNext={() => setStep('substance')}
    />
  )
}
