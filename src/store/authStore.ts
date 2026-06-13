import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { removeBrowserPushRegistration } from '@/lib/pushRegistration'

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
  const uid = auth.currentUser?.uid ?? null
  if (uid) {
    await removeBrowserPushRegistration(uid).catch((error) => {
      console.error('Failed to remove browser push registration on sign-out', error)
    })
  }
  await signOut(auth)
}
