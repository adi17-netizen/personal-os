import { useState, useRef } from 'react'
import { Check } from 'lucide-react'

export default function TaskRow({ task, onComplete, onUpdateTitle }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const inputRef = useRef(null)

  const handleDoubleClick = () => {
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
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0 group">
      <button
        onClick={() => onComplete(task.id)}
        className="shrink-0 w-5 h-5 rounded-full border border-border/60 hover:border-accent/60 hover:bg-accent/10 flex items-center justify-center transition-colors group-hover:border-accent/40"
      >
        <Check size={11} className="text-accent opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>
      {editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm outline-none border-b border-accent/60 pb-0.5"
          style={{ color: 'var(--theme-text-1)' }}
        />
      ) : (
        <span
          className="flex-1 text-sm leading-snug cursor-default select-none"
          style={{ color: 'var(--theme-text-1)' }}
          onDoubleClick={handleDoubleClick}
          title="Double-click to edit"
        >
          {task.title}
        </span>
      )}
    </div>
  )
}
