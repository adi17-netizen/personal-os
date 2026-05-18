import { tokenStore } from '../lib/tokenStore'

export function useGoogleToken() {
  if (import.meta.env.VITE_IS_EXTENSION === 'true') {
    // Extension mode: token comes from chrome.identity — implement separately
    return null
  }
  return tokenStore.get()
}
