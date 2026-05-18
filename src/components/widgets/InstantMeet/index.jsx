import { useState } from 'react'
import { Video, Copy, Check, AlertCircle } from 'lucide-react'
import { fetchGoogle } from '../../../lib/googleApi'

export default function InstantMeet() {
  const [state, setState] = useState('idle') // idle | loading | success | error
  const [meetUrl, setMeetUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const createMeet = async () => {
    setState('loading')
    try {
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

      const url = event.conferenceData?.entryPoints?.[0]?.uri
      if (!url) throw new Error('No Meet link returned')

      setMeetUrl(url)
      setState('success')
      await navigator.clipboard.writeText(url).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
      window.open(url, '_blank')
    } catch (e) {
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(meetUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state === 'success') {
    return (
      <div className="h-full flex items-center gap-2 px-3">
        <Video size={14} className="text-accent shrink-0" />
        <span className="text-xs flex-1 truncate" style={{ color: 'var(--theme-text-2)' }}>{meetUrl}</span>
        <button onClick={copyLink} className="shrink-0 hover:opacity-60 transition-opacity" style={{ color: 'var(--theme-text-2)' }}>
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
        </button>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="h-full flex items-center gap-2 px-3">
        <AlertCircle size={14} className="text-red-400 shrink-0" />
        <span className="text-xs text-red-400">Failed to create Meet</span>
      </div>
    )
  }

  return (
    <button
      onClick={createMeet}
      disabled={state === 'loading'}
      className="h-full w-full flex items-center justify-center gap-2 px-3 text-sm hover:opacity-70 transition-opacity disabled:opacity-60"
      style={{ color: 'var(--theme-text-1)' }}
    >
      {state === 'loading' ? (
        <div className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin" />
      ) : (
        <Video size={14} className="text-accent" />
      )}
      {state === 'loading' ? 'Creating…' : 'New Meet'}
    </button>
  )
}
