import { deleteDoc, doc, setDoc } from 'firebase/firestore'
import { getMessaging, getToken } from 'firebase/messaging'
import { db, firebaseApp } from '@/lib/firebase'
import type { PushPermissionState } from '@/lib/notifications'

const DEVICE_ID_KEY = 'doser.notificationDeviceId'
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export type PushRegistrationState = PushPermissionState | 'config-missing'

function deviceDocRef(uid: string, deviceId: string) {
  return doc(db, 'users', uid, 'notificationDevices', deviceId)
}

function getDeviceId(createIfMissing = true): string | null {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing
  if (!createIfMissing) return null
  const next = crypto.randomUUID()
  window.localStorage.setItem(DEVICE_ID_KEY, next)
  return next
}

export function isBrowserPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

export function getBrowserPushPermission(): PushPermissionState {
  if (!isBrowserPushSupported()) return 'unsupported'
  return Notification.permission
}

export function hasPushConfig(): boolean {
  return typeof VAPID_KEY === 'string' && VAPID_KEY.length > 0
}

async function upsertDevice(uid: string, token: string): Promise<void> {
  const deviceId = getDeviceId()
  if (!deviceId) return

  await setDoc(
    deviceDocRef(uid, deviceId),
    {
      deviceId,
      token,
      permission: 'granted',
      platform: 'web',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
      userAgent: navigator.userAgent,
      updatedAt: Date.now(),
    },
    { merge: true },
  )
}

export async function removeBrowserPushRegistration(uid: string): Promise<void> {
  const deviceId = getDeviceId(false)
  if (!deviceId) return
  await deleteDoc(deviceDocRef(uid, deviceId))
}

export async function syncBrowserPushRegistration(
  uid: string,
): Promise<PushRegistrationState> {
  const permission = getBrowserPushPermission()
  if (permission === 'unsupported') return permission
  if (!hasPushConfig()) return 'config-missing'

  if (permission !== 'granted') {
    await removeBrowserPushRegistration(uid).catch(() => undefined)
    return permission
  }

  const registration = await navigator.serviceWorker.ready
  const messaging = getMessaging(firebaseApp)
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  })

  if (!token) {
    await removeBrowserPushRegistration(uid).catch(() => undefined)
    return permission
  }

  await upsertDevice(uid, token)
  return permission
}

export async function requestBrowserPushPermission(
  uid: string,
): Promise<PushRegistrationState> {
  const permission = getBrowserPushPermission()
  if (permission === 'unsupported') return permission
  if (!hasPushConfig()) return 'config-missing'

  const nextPermission =
    permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()

  if (nextPermission !== 'granted') {
    await removeBrowserPushRegistration(uid).catch(() => undefined)
    return nextPermission
  }

  return syncBrowserPushRegistration(uid)
}
