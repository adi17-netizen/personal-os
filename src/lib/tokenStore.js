const TOKEN_KEY = 'goog_access_token'
const EXPIRY_KEY = 'goog_token_expiry'

export const tokenStore = {
  set(token, expiresInSeconds = 3600) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresInSeconds * 1000))
  },

  get() {
    const expiry = Number(localStorage.getItem(EXPIRY_KEY))
    if (!expiry || Date.now() > expiry - 60_000) return null
    return localStorage.getItem(TOKEN_KEY)
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXPIRY_KEY)
  },

  isValid() {
    return this.get() !== null
  },
}
