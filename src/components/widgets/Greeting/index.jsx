import { useAuth } from '../../../contexts/AuthContext'
import { useCalendar, getRemainingEvents } from '../../../hooks/useCalendar'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Greeting() {
  const { user } = useAuth()
  const { data: events, status } = useCalendar()

  const firstName = user?.displayName?.split(' ')[0] ?? ''
  const greeting = `${getGreeting()}${firstName ? `, ${firstName}` : ''}`
  const remaining = getRemainingEvents(events)

  return (
    <div className="h-full flex flex-col justify-center px-5 py-4">
      <h2 className="text-2xl font-semibold tracking-tight leading-tight mb-2" style={{ color: 'var(--theme-text-1)' }}>
        {greeting}
      </h2>
      {status === 'loading' && (
        <div className="shimmer rounded h-4 w-40" />
      )}
      {status === 'success' && (
        <p className="text-sm" style={{ color: 'var(--theme-text-2)' }}>
          {remaining === 0
            ? 'No more events today.'
            : `You have ${remaining} event${remaining === 1 ? '' : 's'} remaining today.`}
        </p>
      )}
      {status === 'empty' && (
        <p className="text-sm" style={{ color: 'var(--theme-text-2)' }}>Nothing left on the calendar today.</p>
      )}
    </div>
  )
}
