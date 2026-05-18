import { tokenStore } from './tokenStore'

export class TokenExpiredError extends Error {
  constructor() {
    super('Google session expired. Please reconnect.')
    this.name = 'TokenExpiredError'
  }
}

export async function fetchGoogle(url, options = {}) {
  const token = tokenStore.get()
  if (!token) throw new TokenExpiredError()

  const { headers: extraHeaders, ...rest } = options
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  })

  if (res.status === 401) {
    tokenStore.clear()
    throw new TokenExpiredError()
  }

  if (!res.ok) {
    let body = ''
    try { body = await res.text() } catch {}
    console.error(`[fetchGoogle] ${res.status} ${url}`, body)
    const err = new Error(`Google API error ${res.status}`)
    err.status = res.status
    err.body = body
    throw err
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}
