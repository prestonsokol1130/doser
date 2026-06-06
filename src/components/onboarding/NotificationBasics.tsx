import type { NotificationPrefs, Profile } from '../../types'
import { OnboardingField, ToggleRow } from './OnboardingField'
import { OnboardingLayout } from './OnboardingLayout'

type NotificationBasicsProps = {
  profile: Profile
  onChange: (profile: Profile) => void
  onNext: () => void
  onBack: () => void
}

function updateNotif(
  profile: Profile,
  patch: Partial<NotificationPrefs>,
): Profile {
  return {
    ...profile,
    notif: {
      ...profile.notif,
      ...patch,
    },
  }
}

export function NotificationBasics({
  profile,
  onChange,
  onNext,
  onBack,
}: NotificationBasicsProps) {
  const { notif } = profile
  const remindersEnabled = notif.doseDueReminder

  return (
    <OnboardingLayout
      title="Notification Basics"
      actionLabel="Continue"
      onAction={onNext}
      onBack={onBack}
    >
      <p className="text-sm leading-relaxed text-[var(--color-text-dim)]">
        Reminders help you stay on your preferred dosing interval. You can fine
        tune all notification types later in Settings.
      </p>

      <ToggleRow
        label="Dose Reminders"
        description="Notify when your next dose window is approaching."
        checked={notif.doseDueReminder}
        onChange={(doseDueReminder) =>
          onChange(
            updateNotif(profile, {
              doseDueReminder,
              doseReminders: doseDueReminder,
            }),
          )
        }
      />

      {remindersEnabled ? (
        <>
          <OnboardingField
            id="notif-lead-minutes"
            label="Lead Time (minutes before window)"
            type="number"
            inputMode="numeric"
            step={1}
            min={1}
            value={String(notif.doseDueLeadMinutes)}
            onChange={(value) => {
              const minutes = Number(value)
              onChange(
                updateNotif(profile, {
                  doseDueLeadMinutes:
                    Number.isFinite(minutes) && minutes > 0
                      ? Math.round(minutes)
                      : notif.doseDueLeadMinutes,
                }),
              )
            }}
          />

          <ToggleRow
            label="Dose Logged Confirmation"
            description="Confirm each time a dose is logged."
            checked={notif.doseLoggedConfirmation}
            onChange={(doseLoggedConfirmation) =>
              onChange(updateNotif(profile, { doseLoggedConfirmation }))
            }
          />

          <ToggleRow
            label="Daily Usage Summary"
            description="One summary notification per day."
            checked={notif.dailyUsageSummary}
            onChange={(dailyUsageSummary) =>
              onChange(updateNotif(profile, { dailyUsageSummary }))
            }
          />

          {notif.dailyUsageSummary ? (
            <OnboardingField
              id="notif-summary-time"
              label="Daily Summary Time"
              type="text"
              value={notif.dailySummaryTime}
              onChange={(dailySummaryTime) =>
                onChange(updateNotif(profile, { dailySummaryTime }))
              }
              placeholder="09:00"
            />
          ) : null}
        </>
      ) : null}
    </OnboardingLayout>
  )
}
