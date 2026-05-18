import { GripVertical } from 'lucide-react'

export default function WidgetShell({ children, title, icon: Icon }) {
  return (
    <div className="widget-card">
      <div
        className="drag-handle flex items-center gap-1.5 px-3 py-1.5 shrink-0"
        style={{ borderBottom: '0.5px solid var(--theme-card-border)' }}
      >
        <GripVertical
          size={10}
          strokeWidth={2}
          style={{ color: 'var(--theme-text-3)', flexShrink: 0, opacity: 0.5 }}
        />
        {Icon && (
          <Icon
            size={11}
            strokeWidth={2}
            style={{ color: `rgb(var(--color-accent))`, flexShrink: 0, opacity: 0.8 }}
          />
        )}
        {title && (
          <span
            className="text-[13px] font-medium truncate"
            style={{ color: 'var(--theme-text-2)', letterSpacing: '-0.003em' }}
          >
            {title}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {children}
      </div>
    </div>
  )
}
