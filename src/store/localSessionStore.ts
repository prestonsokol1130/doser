const LOCAL_ONLY_KEY = 'doser.localOnly'
const LOCAL_ONLY_AUTH_FLOW_KEY = 'doser.localOnlyAuthFlow'

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
    localStorage.removeItem(LOCAL_ONLY_AUTH_FLOW_KEY)
    return true
  } catch (error) {
    console.error('Failed to enable local-only mode:', error)
    return false
  }
}

export function clearLocalOnlyMode(): void {
  try {
    localStorage.removeItem(LOCAL_ONLY_KEY)
    localStorage.removeItem(LOCAL_ONLY_AUTH_FLOW_KEY)
  } catch (error) {
    console.error('Failed to clear local-only mode:', error)
  }
}

export function isLocalOnlyAuthFlow(): boolean {
  try {
    return localStorage.getItem(LOCAL_ONLY_AUTH_FLOW_KEY) === 'true'
  } catch {
    return false
  }
}

export function enterLocalOnlyAuthFlow(): boolean {
  try {
    localStorage.setItem(LOCAL_ONLY_AUTH_FLOW_KEY, 'true')
    return true
  } catch (error) {
    console.error('Failed to enter local-only auth flow:', error)
    return false
  }
}

export function clearLocalOnlyAuthFlow(): void {
  try {
    localStorage.removeItem(LOCAL_ONLY_AUTH_FLOW_KEY)
  } catch (error) {
    console.error('Failed to clear local-only auth flow:', error)
  }
}
