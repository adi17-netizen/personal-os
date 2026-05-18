import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { X, Video } from 'lucide-react'
import { useCalendar, getRemainingEvents } from '../../hooks/useCalendar'
import { useTasks } from '../../hooks/useTasks'
import { useWeather } from '../../hooks/useWeather'
import { useNewsFeed } from '../../hooks/useNewsFeed'
import { useAuth } from '../../contexts/AuthContext'

function getGreeting(name) {
  const h = new Date().getHours()
  const salutation = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return name ? `${salutation}, ${name}` : salutation
}

function WeatherLine({ data, status }) {
  if (status !== 'success' || !data?.current) return null
  return (
    <span>{data.current.temp}°C — feels {data.current.feelsLike}°C in {data.current.name}</span>
  )
}

export default function DailyBriefPanel({ onClose }) {
  const { user } = useAuth()
  const { data: events, status: calStatus } = useCalendar()
  const { tasks, status: taskStatus }       = useTasks()
  const { data: weather, status: wxStatus } = useWeather()
  const { articles, status: newsStatus }    = useNewsFeed()
  const panelRef = useRef(null)

  const firstName = user?.displayName?.split(' ')[0] ?? ''

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const todayEvents = (events || []).slice(0, 5)
  const pendingTasks = (tasks || []).filter(t => !t.completed).slice(0, 3)
  const headlines = (articles || []).slice(0, 3)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl mt-16 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--theme-card-bg)',
          border: '0.5px solid var(--theme-card-border)',
          backdropFilter: 'blur(40px)',
          animation: 'settings-drop 0.25s cubic-bezier(0.2,0,0,1) forwards',
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0"
          style={{ borderBottom: '0.5px solid var(--theme-card-border)' }}
        >
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--theme-text-1)' }}>
              {getGreeting(firstName)}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-3)' }}>
              {format(new Date(), 'EEEE, MMMM d')} ·{' '}
              <WeatherLine data={weather} status={wxStatus} />
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:opacity-60 transition-opacity shrink-0"
            style={{ background: 'rgba(var(--color-border) / 0.3)', color: 'var(--theme-text-3)' }}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-5">

          {/* Calendar */}
          <Section title="Today's schedule">
            {calStatus === 'loading' && <LoadingLine />}
            {calStatus === 'empty' && <EmptyLine text="No events today — enjoy the clear schedule." />}
            {calStatus === 'success' && todayEvents.map(ev => {
              const startStr = ev.start?.dateTime || ev.start?.date
              const time = startStr && ev.start?.dateTime
                ? format(new Date(startStr), 'HH:mm')
                : 'All day'
              return (
                <div key={ev.id} className="flex items-center gap-3">
                  <span className="text-xs font-mono w-10 shrink-0" style={{ color: 'var(--theme-text-3)' }}>{time}</span>
                  <span className="text-sm flex-1 truncate" style={{ color: 'var(--theme-text-1)' }}>{ev.summary}</span>
                  {ev.hangoutLink && (
                    <a
                      href={ev.hangoutLink}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md"
                      style={{ background: `rgba(var(--color-accent) / 0.1)`, color: `rgb(var(--color-accent))` }}
                      onClick={e => e.stopPropagation()}
                    >
                      <Video size={10} /> Join
                    </a>
                  )}
                </div>
              )
            })}
          </Section>

          {/* Tasks */}
          <Section title="Top tasks">
            {taskStatus === 'loading' && <LoadingLine />}
            {(taskStatus === 'empty' || pendingTasks.length === 0) && <EmptyLine text="No pending tasks." />}
            {taskStatus === 'success' && pendingTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: `rgb(var(--color-accent))` }}
                />
                <span className="text-sm truncate" style={{ color: 'var(--theme-text-1)' }}>{t.title}</span>
              </div>
            ))}
          </Section>

          {/* News */}
          <Section title="In the news">
            {newsStatus === 'loading' && <LoadingLine />}
            {newsStatus === 'success' && headlines.map((a, i) => (
              <a
                key={i}
                href={a.link}
                target="_blank"
                rel="noreferrer"
                className="text-sm hover:opacity-70 transition-opacity leading-snug line-clamp-1"
                style={{ color: 'var(--theme-text-2)' }}
                onClick={e => e.stopPropagation()}
              >
                {a.title}
              </a>
            ))}
          </Section>
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-6 py-4"
          style={{ borderTop: '0.5px solid var(--theme-card-border)' }}
        >
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: `rgb(var(--color-accent))`, color: '#fff' }}
          >
            Start your day →
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-3)' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function LoadingLine() {
  return <div className="shimmer rounded h-4 w-3/4" />
}

function EmptyLine({ text }) {
  return <p className="text-sm" style={{ color: 'var(--theme-text-3)' }}>{text}</p>
}
