const LOCAL_ONLY_KEY = 'doser.localOnly'

export function isLocalOnlyMode(): boolean {
  try {
    return localStorage.getItem(LOCAL_ONLY_KEY) === 'true'
  } catch {
    return false
  }
}

export function enableLocalOnlyMode(): boolean {
  try {
    localStorage.setItem(LOCAL_ONLY_KEY, 'true')
    return true
  } catch (error) {
    console.error('Failed to enable local-only mode:', error)
    return false
  }
}

export function clearLocalOnlyMode(): void {
  try {
    localStorage.removeItem(LOCAL_ONLY_KEY)
  } catch (error) {
    console.error('Failed to clear local-only mode:', error)
  }
}
