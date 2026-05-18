import { useState, useEffect, useRef } from 'react'
import { Video, Copy, Check, X } from 'lucide-react'
import { fetchGoogle } from '../../lib/googleApi'
import { formatDistanceToNow } from 'date-fns'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const LS_KEY = 'personal-os-meet-history'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] }
}
function addToHistory(url) {
  const h = [{ url, createdAt: new Date().toISOString() }, ...loadHistory()].slice(0, 3)
  localStorage.setItem(LS_KEY, JSON.stringify(h))
  return h
}

export default function InstantMeetPopover({ anchorRef, onClose }) {
  const [state, setState]       = useState('idle')  // idle | loading | done | error
  const [meetUrl, setMeetUrl]   = useState('')
  const [copied, setCopied]     = useState(false)
  const [history, setHistory]   = useState(loadHistory)
  const panelRef = useRef(null)

  // Position below toolbar button
  const [pos, setPos] = useState({ top: 52, right: 12 })
  useEffect(() => {
    if (anchorRef?.current) {
      const r = anchorRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
  }, [anchorRef])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (panelRef.current && !panelRef.current.contains(e.target) && !anchorRef?.current?.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    const clickHandler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && !anchorRef?.current?.contains(e.target)) {
        onClose()
      }
    }
    const id = setTimeout(() => document.addEventListener('mousedown', clickHandler), 50)
    return () => {
      document.removeEventListener('keydown', handler)
      clearTimeout(id)
      document.removeEventListener('mousedown', clickHandler)
    }
  }, [onClose, anchorRef])

  const createMeet = async () => {
    setState('loading')
    try {
      let url
      if (MOCK) {
        await new Promise(r => setTimeout(r, 800))
        url = `https://meet.google.com/mock-${Math.random().toString(36).slice(2, 8)}`
      } else {
        const now = new Date()
        const end = new Date(now.getTime() + 60 * 60 * 1000)
        const event = await fetchGoogle(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
          {
            method: 'POST',
            body: JSON.stringify({
              summary: 'Instant Meet',
              start: { dateTime: now.toISOString() },
              end: { dateTime: end.toISOString() },
              conferenceData: {
                createRequest: {
                  requestId: crypto.randomUUID(),
                  conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
              },
            }),
          }
        )
        url = event.conferenceData?.entryPoints?.[0]?.uri
        if (!url) throw new Error('No Meet link returned')
      }

      setMeetUrl(url)
      const h = addToHistory(url)
      setHistory(h)
      setState('done')
      await navigator.clipboard.writeText(url).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
      window.open(url, '_blank')
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  const copyUrl = async (url) => {
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(url)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-50 rounded-2xl overflow-hidden flex flex-col"
      style={{
        top: pos.top,
        right: pos.right,
        width: 280,
        background: 'rgb(var(--color-card))',
        border: '0.5px solid var(--theme-card-border)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.14)',
        animation: 'settings-drop 0.18s cubic-bezier(0.2,0,0,1) forwards',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '0.5px solid var(--theme-card-border)' }}>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--theme-text-1)' }}>Instant Meet</span>
        <button onClick={onClose} className="hover:opacity-60 transition-opacity" style={{ color: 'var(--theme-text-3)' }}>
          <X size={13} />
        </button>
      </div>

      {/* Create button */}
      <div className="px-4 py-3">
        {state === 'error' ? (
          <p className="text-xs text-red-400">Failed to create. Try again.</p>
        ) : state === 'done' ? (
          <div className="flex items-center gap-2">
            <Video size={13} style={{ color: `rgb(var(--color-accent))`, flexShrink: 0 }} />
            <span className="text-xs flex-1 truncate" style={{ color: 'var(--theme-text-2)' }}>{meetUrl}</span>
            <button onClick={() => copyUrl(meetUrl)} className="shrink-0 hover:opacity-60 transition-opacity" style={{ color: 'var(--theme-text-2)' }}>
              {copied === meetUrl ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            </button>
          </div>
        ) : (
          <button
            onClick={createMeet}
            disabled={state === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: `rgba(var(--color-accent) / 0.12)`, color: `rgb(var(--color-accent))`, border: `0.5px solid rgba(var(--color-accent) / 0.25)` }}
          >
            {state === 'loading' ? (
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `rgb(var(--color-accent))`, borderTopColor: 'transparent' }} />
            ) : (
              <Video size={14} />
            )}
            {state === 'loading' ? 'Creating…' : 'New Meet'}
          </button>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ borderTop: '0.5px solid var(--theme-card-border)' }}>
          <p className="text-[10px] font-semibold px-4 pt-2 pb-1" style={{ color: 'var(--theme-text-3)' }}>Recent</p>
          {history.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2" style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--theme-card-border)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate" style={{ color: 'var(--theme-text-2)' }}>{item.url}</p>
                <p className="text-[10px]" style={{ color: 'var(--theme-text-3)' }}>
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
              <button onClick={() => copyUrl(item.url)} className="shrink-0 hover:opacity-60 transition-opacity" style={{ color: 'var(--theme-text-3)' }}>
                {copied === item.url ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
