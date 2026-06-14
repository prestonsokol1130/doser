import { onAuthStateChanged, signOut } from 'firebase/auth'
import OneSignal from 'react-onesignal'
import { auth } from '../lib/firebase'

export type AuthSession = {
  user: { id: string }
} | null

function toSession(user: { uid: string } | null): AuthSession {
  if (!user) return null
  return { user: { id: user.uid } }
}

export function getSession(): Promise<AuthSession> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(toSession(user))
    })
  })
}

export function subscribeToAuth(
  onChange: (session: AuthSession) => void,
): () => void {
  return onAuthStateChanged(auth, (user) => {
    onChange(toSession(user))
  })
}

export async function logOut(): Promise<void> {
  await signOut(auth)
  try {
    await OneSignal.logout()
  } catch (error) {
    console.warn('Failed to logout OneSignal on sign-out', error)
  }
}
