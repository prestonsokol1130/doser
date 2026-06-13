import OneSignal from 'react-onesignal'

let initialized = false

export async function syncPushRegistration(uid: string): Promise<void> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID
    if (!appId || typeof appId !== 'string' || appId.length === 0) return

    if (!initialized) {
      await OneSignal.init({
        appId,
        serviceWorkerPath: 'OneSignalSDKWorker.js',
      })
      initialized = true
    }

    await OneSignal.login(uid)
  } catch (error) {
    console.error(error)
  }
}

export function getBrowserPushPermission(): 'granted' | 'denied' | 'default' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default'
  }
  return Notification.permission
}
