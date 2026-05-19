import { useState } from 'react'
import { Plus, ListTodo, Calendar, Sun } from 'lucide-react'
import { format } from 'date-fns'
import { useTasks } from '../../../hooks/useTasks'
import SkeletonList from '../../layout/SkeletonList'
import ErrorState from '../../layout/ErrorState'
import EmptyState from '../../layout/EmptyState'
import TaskRow from './TaskRow'

export default function Tasks() {
  const { tasks, status, error, retry, completeTask, addTask, updateTaskTitle, deleteTask } = useTasks()
  const [newTitle, setNewTitle] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDue, setSelectedDue] = useState(null) // null = no date

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const title = newTitle.trim()
    setNewTitle('')
    const due = selectedDue
    setSelectedDue(null)
    setShowDatePicker(false)
    await addTask(title, due)
  }

  const setQuickDate = (type) => {
    const d = new Date()
    if (type === 'tomorrow') d.setDate(d.getDate() + 1)
    if (type === 'nextWeek') d.setDate(d.getDate() + 7)
    setSelectedDue(d.toISOString())
    setShowDatePicker(false)
  }

  const setCustomDate = (dateStr) => {
    if (!dateStr) return
    setSelectedDue(new Date(dateStr + 'T00:00:00').toISOString())
    setShowDatePicker(false)
  }

  // Sort: pending first, completed last
  const sorted = [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1
    return 0
  })

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto min-h-0 px-4 py-2">
        {status === 'loading' && <SkeletonList rows={4} />}
        {status === 'error' && <ErrorState message={error?.message} onRetry={retry} />}
        {status === 'empty' && (
          <EmptyState icon={ListTodo} message="No tasks — add one below to get started." />
        )}
        {status === 'success' && sorted.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={completeTask}
            onUpdateTitle={updateTaskTitle}
            onDelete={deleteTask}
          />
        ))}
      </div>
      {(status === 'success' || status === 'empty') && (
        <div className="shrink-0 border-t border-border/40">
          <form onSubmit={handleAdd} className="flex items-center gap-2 px-4 py-2">
            <Plus size={14} className="shrink-0" style={{ color: 'var(--theme-text-2)' }} />
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Add a task…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--theme-text-1)' }}
            />
            <button
              type="button"
              onClick={() => setShowDatePicker(p => !p)}
              className="shrink-0 flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md transition-opacity hover:opacity-60"
              style={{
                color: selectedDue ? `rgb(var(--color-accent))` : 'var(--theme-text-3)',
                background: selectedDue ? `rgb(var(--color-accent) / 0.1)` : 'transparent',
              }}
            >
              <Calendar size={11} />
              {selectedDue ? format(new Date(selectedDue), 'MMM d') : 'Date'}
            </button>
          </form>

          {/* Date picker dropdown */}
          {showDatePicker && (
            <div
              className="flex items-center gap-1 px-4 pb-2 flex-wrap"
            >
              <button
                onClick={() => setQuickDate('today')}
                className="text-[11px] px-2 py-1 rounded-md transition-opacity hover:opacity-70"
                style={{ background: 'rgb(var(--color-accent) / 0.1)', color: `rgb(var(--color-accent))` }}
              >
                <Sun size={10} className="inline mr-1" />Today
              </button>
              <button
                onClick={() => setQuickDate('tomorrow')}
                className="text-[11px] px-2 py-1 rounded-md transition-opacity hover:opacity-70"
                style={{ background: 'rgb(var(--color-accent) / 0.1)', color: `rgb(var(--color-accent))` }}
              >
                Tomorrow
              </button>
              <button
                onClick={() => setQuickDate('nextWeek')}
                className="text-[11px] px-2 py-1 rounded-md transition-opacity hover:opacity-70"
                style={{ background: 'rgb(var(--color-accent) / 0.1)', color: `rgb(var(--color-accent))` }}
              >
                Next week
              </button>
              <input
                type="date"
                onChange={e => setCustomDate(e.target.value)}
                className="text-[11px] px-2 py-1 rounded-md outline-none cursor-pointer"
                style={{ background: 'rgba(var(--color-border) / 0.3)', color: 'var(--theme-text-2)' }}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              {selectedDue && (
                <button
                  onClick={() => { setSelectedDue(null); setShowDatePicker(false) }}
                  className="text-[11px] px-2 py-1 rounded-md hover:opacity-70"
                  style={{ color: 'var(--theme-text-3)' }}
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
