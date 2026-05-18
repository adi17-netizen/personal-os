const TOKEN_KEY = 'goog_access_token'
const EXPIRY_KEY = 'goog_token_expiry'

export const tokenStore = {
  set(token, expiresInSeconds = 3600) {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresInSeconds * 1000))
  },

  get() {
    const expiry = Number(sessionStorage.getItem(EXPIRY_KEY))
    if (!expiry || Date.now() > expiry - 60_000) return null
    return sessionStorage.getItem(TOKEN_KEY)
  },

  clear() {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(EXPIRY_KEY)
  },

  isValid() {
    return this.get() !== null
  },
}
