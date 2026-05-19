import { Mail, ExternalLink, Inbox } from 'lucide-react'
import { formatDistanceToNow, isValid } from 'date-fns'
import { useGmail } from '../../../hooks/useGmail'
import SkeletonList from '../../layout/SkeletonList'
import ErrorState from '../../layout/ErrorState'
import EmptyState from '../../layout/EmptyState'

function timeAgo(dateStr) {
  try {
    const d = new Date(dateStr)
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : ''
  } catch { return '' }
}

export default function Gmail() {
  const { messages, mode, switchMode, status, error, retry, parseSender } = useGmail()

  return (
    <div className="h-full flex flex-col">
      {/* Mode tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/40 shrink-0">
        <button
          onClick={() => switchMode('recent')}
          className="text-[11px] font-medium px-2 py-0.5 rounded-md transition-opacity"
          style={{
            color: mode === 'recent' ? `rgb(var(--color-accent))` : 'var(--theme-text-3)',
            background: mode === 'recent' ? `rgb(var(--color-accent) / 0.1)` : 'transparent',
          }}
        >
          Recent
        </button>
        <button
          onClick={() => switchMode('unread')}
          className="text-[11px] font-medium px-2 py-0.5 rounded-md transition-opacity"
          style={{
            color: mode === 'unread' ? `rgb(var(--color-accent))` : 'var(--theme-text-3)',
            background: mode === 'unread' ? `rgb(var(--color-accent) / 0.1)` : 'transparent',
          }}
        >
          Unread
        </button>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-auto min-h-0 px-3">
        {status === 'loading' && <div className="py-2"><SkeletonList rows={5} /></div>}
        {status === 'error' && <ErrorState message={error?.message} onRetry={retry} />}
        {status === 'empty' && (
          <EmptyState
            icon={mode === 'unread' ? Inbox : Mail}
            message={mode === 'unread' ? 'All caught up ✨' : 'No recent emails'}
          />
        )}
        {status === 'success' && messages.map(msg => (
          <a
            key={msg.id}
            href={`https://mail.google.com/mail/u/0/#inbox/${msg.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-2 py-2 border-b last:border-0 hover:opacity-70 transition-opacity"
            style={{ borderColor: 'rgba(var(--color-border) / 0.25)' }}
          >
            {/* Unread dot */}
            <div className="shrink-0 pt-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: msg.isUnread ? `rgb(var(--color-accent))` : 'transparent',
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              {/* Sender + time */}
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[11px] truncate"
                  style={{
                    color: 'var(--theme-text-2)',
                    fontWeight: msg.isUnread ? 600 : 400,
                  }}
                >
                  {parseSender(msg.from)}
                </span>
                <span className="text-[10px] shrink-0" style={{ color: 'var(--theme-text-3)' }}>
                  · {timeAgo(msg.date)}
                </span>
              </div>
              {/* Subject */}
              <p
                className="text-[12px] leading-snug line-clamp-1 mt-0.5"
                style={{
                  color: 'var(--theme-text-1)',
                  fontWeight: msg.isUnread ? 500 : 400,
                }}
              >
                {msg.subject || '(No subject)'}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-3 py-1.5" style={{ borderTop: '0.5px solid var(--theme-card-border)' }}>
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1 text-[11px] font-medium py-1 rounded-md hover:opacity-70 transition-opacity"
          style={{ color: `rgb(var(--color-accent))` }}
        >
          Open Gmail <ExternalLink size={10} />
        </a>
      </div>
    </div>
  )
}
