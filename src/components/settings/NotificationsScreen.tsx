import type { NotificationPrefs, Profile } from '@/types'
import { FormField, ToggleField } from '../tools/FormField'
import { SubScreenHeader } from '../tools/SubScreenHeader'

type NotificationsScreenProps = {
  profile: Profile
  onProfileChange: (profile: Profile) => void
  onBack: () => void
}

function updateNotif(
  profile: Profile,
  patch: Partial<NotificationPrefs>,
): Profile {
  return {
    ...profile,
    notif: { ...profile.notif, ...patch },
  }
}

export function NotificationsScreen({
  profile,
  onProfileChange,
  onBack,
}: NotificationsScreenProps) {
  const { notif } = profile

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader
        title="Notifications"
        subtitle="Reminders and alerts"
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-3">
          <ToggleField
            label="Dose Due Reminder"
            description="Notify when your next dose window is approaching."
            checked={notif.doseDueReminder}
            onChange={(doseDueReminder) =>
              onProfileChange(
                updateNotif(profile, {
                  doseDueReminder,
                  doseReminders: doseDueReminder,
                }),
              )
            }
          />

          {notif.doseDueReminder ? (
            <FormField
              id="notif-lead"
              label="Lead Time (minutes before window)"
              type="number"
              inputMode="numeric"
              min={1}
              value={String(notif.doseDueLeadMinutes)}
              onChange={(value) => {
                const minutes = Number(value)
                onProfileChange(
                  updateNotif(profile, {
                    doseDueLeadMinutes:
                      Number.isFinite(minutes) && minutes > 0
                        ? Math.round(minutes)
                        : notif.doseDueLeadMinutes,
                  }),
                )
              }}
            />
          ) : null}

          <ToggleField
            label="Dose Logged Confirmation"
            description="Confirm each time a dose is logged."
            checked={notif.doseLoggedConfirmation}
            onChange={(doseLoggedConfirmation) =>
              onProfileChange(updateNotif(profile, { doseLoggedConfirmation }))
            }
          />

          <ToggleField
            label="Daily Usage Summary"
            description="One summary notification per day."
            checked={notif.dailyUsageSummary}
            onChange={(dailyUsageSummary) =>
              onProfileChange(updateNotif(profile, { dailyUsageSummary }))
            }
          />

          {notif.dailyUsageSummary ? (
            <FormField
              id="notif-summary-time"
              label="Daily Summary Time"
              value={notif.dailySummaryTime}
              onChange={(dailySummaryTime) =>
                onProfileChange(updateNotif(profile, { dailySummaryTime }))
              }
              placeholder="09:00"
            />
          ) : null}

          <ToggleField
            label="Stash Running Low"
            description="Alert when supply drops below threshold."
            checked={notif.stashRunningLow}
            onChange={(stashRunningLow) =>
              onProfileChange(
                updateNotif(profile, {
                  stashRunningLow,
                  stashAlerts: stashRunningLow,
                }),
              )
            }
          />

          {notif.stashRunningLow ? (
            <FormField
              id="stash-threshold"
              label="Low Threshold (%)"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={String(notif.stashLowThresholdPct)}
              onChange={(value) => {
                const pct = Number(value)
                onProfileChange(
                  updateNotif(profile, {
                    stashLowThresholdPct:
                      Number.isFinite(pct) && pct >= 1 && pct <= 100
                        ? Math.round(pct)
                        : notif.stashLowThresholdPct,
                  }),
                )
              }}
            />
          ) : null}

          <ToggleField
            label="Spacing Reminders"
            checked={notif.spacingReminders}
            onChange={(spacingReminders) =>
              onProfileChange(updateNotif(profile, { spacingReminders }))
            }
          />

          <ToggleField
            label="Hydration Reminders"
            checked={notif.hydration}
            onChange={(hydration) =>
              onProfileChange(updateNotif(profile, { hydration }))
            }
          />

          <ToggleField
            label="Sleep Reminders"
            checked={notif.sleepReminders}
            onChange={(sleepReminders) =>
              onProfileChange(updateNotif(profile, { sleepReminders }))
            }
          />

          <ToggleField
            label="Silent Mode"
            description="Suppress notification sounds."
            checked={notif.silent}
            onChange={(silent) => onProfileChange(updateNotif(profile, { silent }))}
          />
        </div>
      </div>
    </div>
  )
}
