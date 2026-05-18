import { useTheme, THEMES } from '../../contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className="flex items-center rounded-full p-0.5 gap-0.5"
      style={{
        background: 'rgba(var(--color-border) / 0.4)',
        border: '1px solid rgba(var(--color-border) / 0.6)',
      }}
    >
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.label}
          style={theme === t.id ? {
            background: 'rgba(var(--color-accent) / 0.25)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          } : {}}
          className={`
            flex items-center gap-1 px-2.5 h-6 rounded-full text-[11px] font-medium transition-all duration-200
            ${theme === t.id ? 'scale-105' : 'opacity-50 hover:opacity-75'}
          `}
        >
          <span>{t.emoji}</span>
          <span style={{ color: 'var(--theme-text-2)' }}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}
