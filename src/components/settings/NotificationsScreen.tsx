import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import {
  getBrowserPushPermission,
  syncPushRegistration,
} from '@/lib/pushRegistration'
import type { NotificationPrefs, Profile } from '@/types'
import { FormField, ToggleField } from '../tools/FormField'
import { SubScreenHeader } from '../tools/SubScreenHeader'

type NotificationsScreenProps = {
  profile: Profile
  localOnly?: boolean
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

function isBrowserPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

function hasOneSignalConfig(): boolean {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID
  return typeof appId === 'string' && appId.length > 0
}

export function NotificationsScreen({
  profile,
  localOnly = false,
  onProfileChange,
  onBack,
}: NotificationsScreenProps) {
  const { notif } = profile
  const [permission, setPermission] = useState(() => getBrowserPushPermission())
  const [requestingPermission, setRequestingPermission] = useState(false)

  useEffect(() => {
    const refreshPermission = () => {
      setPermission(getBrowserPushPermission())
    }

    refreshPermission()
    window.addEventListener('focus', refreshPermission)
    return () => window.removeEventListener('focus', refreshPermission)
  }, [])

  async function handleEnableNotifications() {
    const uid = auth.currentUser?.uid ?? null
    if (!uid || localOnly) return

    setRequestingPermission(true)
    try {
      const nextPermission = await Notification.requestPermission()
      setPermission(getBrowserPushPermission())
      if (nextPermission === 'granted') {
        const currentUid = auth.currentUser?.uid ?? null
        if (currentUid && currentUid === uid) {
          await syncPushRegistration(currentUid)
        }
      }
    } catch (error) {
      console.error('Failed to request browser push permission', error)
      setPermission(getBrowserPushPermission())
    } finally {
      setRequestingPermission(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubScreenHeader
        title="Notifications"
        subtitle="Reminders and alerts"
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-3">
          {localOnly ? (
            <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-4">
              <p
                className="text-[12px] uppercase tracking-[0.1em] text-[var(--app-text)]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Account required
              </p>
              <p
                className="mt-1 text-[12px] text-[var(--app-dim)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Background notifications only work for signed-in accounts in this version.
              </p>
            </div>
          ) : !isBrowserPushSupported() ? (
            <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-4">
              <p
                className="text-[12px] uppercase tracking-[0.1em] text-[var(--app-text)]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Browser not supported
              </p>
              <p
                className="mt-1 text-[12px] text-[var(--app-dim)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                This browser cannot receive background push notifications.
              </p>
            </div>
          ) : !hasOneSignalConfig() ? (
            <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-4">
              <p
                className="text-[12px] uppercase tracking-[0.1em] text-[var(--app-text)]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Push setup missing
              </p>
              <p
                className="mt-1 text-[12px] text-[var(--app-dim)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                This build is missing the OneSignal app ID, so reminders cannot reach this device yet.
              </p>
            </div>
          ) : permission === 'denied' ? (
            <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-4">
              <p
                className="text-[12px] uppercase tracking-[0.1em] text-[var(--app-text)]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Browser notifications blocked
              </p>
              <p
                className="mt-1 text-[12px] text-[var(--app-dim)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                This browser is blocking notifications for Doser. Re-enable them in site settings to restore reminders.
              </p>
            </div>
          ) : permission !== 'granted' ? (
            <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-4">
              <p
                className="text-[12px] uppercase tracking-[0.1em] text-[var(--app-text)]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Browser notifications
              </p>
              <p
                className="mt-1 text-[12px] text-[var(--app-dim)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Allow notifications on this device before reminders can arrive in the background.
              </p>
              <button
                type="button"
                onClick={() => {
                  handleEnableNotifications().catch((error) => {
                    console.error('Failed to enable notifications', error)
                  })
                }}
                disabled={requestingPermission}
                className="mt-3 inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--color-action)] px-4 text-[12px] uppercase tracking-[0.1em] text-black disabled:opacity-60"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                {requestingPermission ? 'Enabling…' : 'Enable Notifications'}
              </button>
            </div>
          ) : (
            <div className="rounded-[16px] border border-[var(--app-divider)] bg-[var(--app-surface)] px-4 py-4">
              <p
                className="text-[12px] uppercase tracking-[0.1em] text-[var(--app-text)]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Browser notifications on
              </p>
              <p
                className="mt-1 text-[12px] text-[var(--app-dim)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                This device can receive background reminders while you are signed in.
              </p>
            </div>
          )}

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
            label="Missed-Dose Alert"
            description="Notify 1 hour after your next window opens if no new dose is logged."
            checked={notif.missedDoseAlert}
            onChange={(missedDoseAlert) =>
              onProfileChange(
                updateNotif(profile, {
                  missedDoseAlert,
                  missedDoseGraceHours: 1,
                }),
              )
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
