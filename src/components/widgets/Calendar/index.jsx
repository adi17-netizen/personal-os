import { CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { useCalendar } from '../../../hooks/useCalendar'
import SkeletonList from '../../layout/SkeletonList'
import ErrorState from '../../layout/ErrorState'
import EmptyState from '../../layout/EmptyState'
import EventRow from './EventRow'

export default function Calendar() {
  const { data: events, status, error, retry } = useCalendar()

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-border/40 shrink-0">
        <p className="text-[11px]" style={{ color: 'var(--theme-text-2)' }}>{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>
      <div className="flex-1 overflow-auto min-h-0 px-4">
        {status === 'loading' && <SkeletonList rows={5} />}
        {status === 'error' && <ErrorState message={error?.message} onRetry={retry} />}
        {status === 'empty' && (
          <EmptyState icon={CalendarDays} message="Nothing on your calendar today — enjoy the clear schedule." />
        )}
        {status === 'success' && events.map(event => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
