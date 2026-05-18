import { format, parseISO } from 'date-fns'
import { Video } from 'lucide-react'

export default function EventRow({ event }) {
  const startStr = event.start?.dateTime || event.start?.date
  const isAllDay = !event.start?.dateTime
  const start = startStr ? parseISO(startStr) : null
  const isPast = start && start < new Date()

  return (
    <div className={`flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0 ${isPast ? 'opacity-50' : ''}`}>
      <div className="shrink-0 text-right w-12">
        {isAllDay ? (
          <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--theme-text-2)' }}>All day</span>
        ) : start ? (
          <span className="text-xs font-mono" style={{ color: 'var(--theme-text-2)' }}>{format(start, 'HH:mm')}</span>
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate leading-snug" style={{ color: 'var(--theme-text-1)' }}>{event.summary || '(No title)'}</p>
        {event.location && (
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--theme-text-2)' }}>{event.location}</p>
        )}
      </div>
      {event.hangoutLink && (
        <a
          href={event.hangoutLink}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 flex items-center gap-1 text-[11px] text-accent hover:text-white bg-accent/10 hover:bg-accent/20 px-2 py-1 rounded-md transition-colors"
        >
          <Video size={11} />
          Join
        </a>
      )}
    </div>
  )
}
