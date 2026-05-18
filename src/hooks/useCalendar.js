import { useWidgetData } from '../lib/widgetHelpers'
import { fetchGoogle } from '../lib/googleApi'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'

function todayBounds() {
  const now = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end = new Date(now); end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

async function fetchTodayEvents() {
  const { start, end } = todayBounds()
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(start)}` +
    `&timeMax=${encodeURIComponent(end)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=20`
  const data = await fetchGoogle(url)
  return data.items ?? []
}

function mockEvents() {
  const d = (h, m) => { const t = new Date(); t.setHours(h, m, 0, 0); return t.toISOString() }
  const now = new Date()
  return [
    { id: '1', summary: 'Standup', start: { dateTime: d(9, 0) }, end: { dateTime: d(9, 15) } },
    { id: '2', summary: 'Design review', start: { dateTime: d(11, 0) }, end: { dateTime: d(12, 0) }, hangoutLink: 'https://meet.google.com/xxx-yyy-zzz' },
    { id: '3', summary: 'Lunch with team', start: { dateTime: d(12, 30) }, end: { dateTime: d(13, 30) } },
    { id: '4', summary: '1:1 with manager', start: { dateTime: d(15, 0) }, end: { dateTime: d(15, 30) }, hangoutLink: 'https://meet.google.com/aaa-bbb-ccc' },
    { id: '5', summary: 'Sprint planning', start: { dateTime: d(16, 0) }, end: { dateTime: d(17, 0) } },
  ]
}

export function useCalendar() {
  const hook = useWidgetData(MOCK ? () => Promise.resolve(mockEvents()) : fetchTodayEvents)
  return hook
}

export function getRemainingEvents(events) {
  if (!events) return 0
  const now = new Date()
  return events.filter((e) => {
    const t = e.start?.dateTime || e.start?.date
    return t && new Date(t) > now
  }).length
}
