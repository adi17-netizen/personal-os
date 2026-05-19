import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { fetchGoogle, TokenExpiredError } from '../lib/googleApi'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

async function fetchMessages(mode) {
  const q = mode === 'unread' ? '&q=is:unread' : ''
  const listUrl = `${GMAIL_API}/users/me/messages?maxResults=10&labelIds=INBOX${q}`
  const list = await fetchGoogle(listUrl)
  const ids = (list.messages || []).map(m => m.id)
  if (!ids.length) return []

  // Fetch metadata for each message in parallel
  const msgs = await Promise.all(
    ids.map(id =>
      fetchGoogle(
        `${GMAIL_API}/users/me/messages/${id}?format=metadata` +
        `&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
      )
    )
  )

  return msgs.map(msg => {
    const headers = msg.payload?.headers || []
    const get = (name) => headers.find(h => h.name === name)?.value || ''
    const isUnread = (msg.labelIds || []).includes('UNREAD')
    return {
      id: msg.id,
      threadId: msg.threadId,
      from: get('From'),
      subject: get('Subject'),
      date: get('Date'),
      snippet: msg.snippet || '',
      isUnread,
    }
  })
}

function parseSender(fromHeader) {
  // "John Doe <john@example.com>" → "John Doe"
  // "john@example.com" → "john"
  const nameMatch = fromHeader.match(/^"?([^"<]+)"?\s*</)
  if (nameMatch) return nameMatch[1].trim()
  const emailMatch = fromHeader.match(/([^@]+)@/)
  if (emailMatch) return emailMatch[1]
  return fromHeader
}

function mockMessages() {
  const ago = (mins) => new Date(Date.now() - mins * 60000).toISOString()
  return [
    { id: '1', threadId: '1', from: 'GitHub <noreply@github.com>', subject: 'New pull request: Fix auth flow', date: ago(5), snippet: 'A new PR has been opened...', isUnread: true },
    { id: '2', threadId: '2', from: 'Linear <notifications@linear.app>', subject: 'Issue assigned: Dashboard performance', date: ago(25), snippet: 'You have been assigned...', isUnread: true },
    { id: '3', threadId: '3', from: 'Stripe <receipts@stripe.com>', subject: 'Your receipt from Stripe', date: ago(90), snippet: 'Amount paid: $29.00', isUnread: false },
    { id: '4', threadId: '4', from: 'Google Cloud <cloud-noreply@google.com>', subject: 'Your billing summary for May', date: ago(180), snippet: 'Total charges: $12.47', isUnread: false },
    { id: '5', threadId: '5', from: 'Vercel <ship@vercel.com>', subject: 'Deployment successful: personal-os', date: ago(300), snippet: 'Your deployment is live...', isUnread: false },
  ]
}

export function useGmail() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [mode, setMode] = useState('recent') // 'recent' | 'unread'
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Load saved mode preference from Firestore
  useEffect(() => {
    if (MOCK || !user) return
    const prefRef = doc(db, 'userPrefs', user.uid)
    getDoc(prefRef).then(snap => {
      const data = snap.data() || {}
      if (data.gmailMode === 'unread' || data.gmailMode === 'recent') {
        setMode(data.gmailMode)
      }
    }).catch(() => {})
  }, [user])

  const load = useCallback(async (currentMode) => {
    setStatus(prev => prev === 'success' ? 'success' : 'loading')
    setError(null)
    try {
      const msgs = MOCK ? mockMessages() : await fetchMessages(currentMode)
      if (!mountedRef.current) return
      if (currentMode === 'unread') {
        // Filter to only unread for unread mode (API q=is:unread should handle this but be safe)
        const filtered = msgs.filter(m => m.isUnread)
        setMessages(filtered)
        setStatus(filtered.length ? 'success' : 'empty')
      } else {
        setMessages(msgs)
        setStatus(msgs.length ? 'success' : 'empty')
      }
    } catch (e) {
      if (!mountedRef.current) return
      if (e instanceof TokenExpiredError) {
        setError({ type: 'token', message: e.message })
      } else {
        setError({ type: 'api', message: e.message || 'Failed to load emails' })
      }
      setStatus('error')
    }
  }, [])

  // Fetch on mount and when mode changes
  useEffect(() => {
    load(mode)
  }, [mode, load])

  const switchMode = useCallback(async (newMode) => {
    setMode(newMode)
    // Persist preference
    if (!MOCK && user) {
      setDoc(doc(db, 'userPrefs', user.uid), { gmailMode: newMode }, { merge: true }).catch(() => {})
    }
  }, [user])

  return { messages, mode, switchMode, status, error, retry: () => load(mode), parseSender }
}
