import { useState } from 'react'
import { Plus, ListTodo } from 'lucide-react'
import { useTasks } from '../../../hooks/useTasks'
import SkeletonList from '../../layout/SkeletonList'
import ErrorState from '../../layout/ErrorState'
import EmptyState from '../../layout/EmptyState'
import TaskRow from './TaskRow'

export default function Tasks() {
  const { tasks, status, error, retry, completeTask, addTask, updateTaskTitle } = useTasks()
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const title = newTitle.trim()
    setNewTitle('')
    await addTask(title)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto min-h-0 px-4 py-2">
        {status === 'loading' && <SkeletonList rows={4} />}
        {status === 'error' && <ErrorState message={error?.message} onRetry={retry} />}
        {status === 'empty' && (
          <EmptyState icon={ListTodo} message="No tasks — add one below to get started." />
        )}
        {status === 'success' && tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={completeTask}
            onUpdateTitle={updateTaskTitle}
          />
        ))}
      </div>
      {(status === 'success' || status === 'empty') && (
        <form
          onSubmit={handleAdd}
          className="shrink-0 flex items-center gap-2 px-4 py-2 border-t border-border/40"
        >
          <Plus size={14} className="shrink-0" style={{ color: 'var(--theme-text-2)' }} />
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Add a task…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--theme-text-1)' }}
          />
        </form>
      )}
    </div>
  )
}
