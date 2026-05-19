import { useState, useRef } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { format, isToday, isTomorrow, isValid } from 'date-fns'

function dateLabel(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (!isValid(d)) return null
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d')
}

export default function TaskRow({ task, onComplete, onUpdateTitle, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const inputRef = useRef(null)
  const done = task.status === 'completed'
  const due = dateLabel(task.due)
  const updated = task.updated ? format(new Date(task.updated), 'MMM d') : null

  const handleDoubleClick = () => {
    if (done) return
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleBlur = () => {
    setEditing(false)
    if (title.trim() && title !== task.title) {
      onUpdateTitle(task.id, title.trim())
    } else {
      setTitle(task.title)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') inputRef.current?.blur()
    if (e.key === 'Escape') { setTitle(task.title); setEditing(false) }
  }

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0 group">
      <button
        onClick={() => onComplete(task.id)}
        className="shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-colors"
        style={done
          ? { background: `rgb(var(--color-accent))`, border: 'none' }
          : { border: '1.5px solid rgba(var(--color-border) / 0.6)' }
        }
      >
        {done ? (
          <Check size={10} strokeWidth={3} style={{ color: '#fff' }} />
        ) : (
          <Check size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: `rgb(var(--color-accent))` }} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm outline-none border-b pb-0.5"
            style={{ color: 'var(--theme-text-1)', borderColor: `rgb(var(--color-accent) / 0.6)` }}
          />
        ) : (
          <div onDoubleClick={handleDoubleClick} className="cursor-default select-none" title={done ? 'Click circle to undo' : 'Double-click to edit'}>
            <span
              className="text-sm leading-snug block truncate"
              style={{
                color: done ? 'var(--theme-text-3)' : 'var(--theme-text-1)',
                textDecoration: done ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </span>
            <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--theme-text-3)' }}>
              {due && <span>Due {due}</span>}
              {due && updated && <span>·</span>}
              {updated && <span>Added {updated}</span>}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
        style={{ color: 'var(--theme-text-3)' }}
        title="Delete task"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
