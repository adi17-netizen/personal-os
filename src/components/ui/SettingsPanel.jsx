import { useEffect, useRef } from 'react'
import { X, RotateCcw } from 'lucide-react'
import { useTheme, THEMES, TEXT_SIZES } from '../../contexts/ThemeContext'
import { useGrid } from '../../contexts/GridContext'

export default function SettingsPanel({ onClose }) {
  const { theme, setTheme, textSize, setTextSize } = useTheme()
  const { resetLayout } = useGrid()
  const panelRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 52,
        right: 12,
        width: 360,
        background: 'rgb(var(--color-card))',
        border: '0.5px solid var(--theme-card-border)',
        borderRadius: 14,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1), 0 16px 48px rgba(0,0,0,0.12)',
        zIndex: 50,
        overflow: 'hidden',
        animation: 'settings-drop 0.2s cubic-bezier(0.2,0,0,1) forwards',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '0.5px solid var(--theme-card-border)' }}
      >
        <span
          className="text-[13px] font-semibold"
          style={{ color: 'var(--theme-text-1)' }}
        >
          Settings
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:opacity-60 transition-opacity"
          style={{
            color: 'var(--theme-text-3)',
            background: 'rgba(var(--color-border) / 0.3)',
          }}
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-5">

        <Section label="Theme">
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  borderRadius: 12,
                  border: `1.5px solid ${theme === t.id ? `rgb(var(--color-accent))` : 'var(--theme-card-border)'}`,
                  overflow: 'hidden',
                  background: theme === t.id ? `rgba(var(--color-accent) / 0.06)` : 'transparent',
                  transition: 'all 0.2s',
                  padding: '6px 6px 0',
                }}
              >
                <div
                  style={{
                    height: 44,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]}, ${t.colors[2]})`,
                    overflow: 'hidden',
                  }}
                />
                <div
                  className="flex items-center gap-1 px-1.5 py-2"
                  style={{ color: 'var(--theme-text-1)' }}
                >
                  <span className="text-xs">{t.emoji}</span>
                  <span className="text-[11px] font-medium truncate">{t.label}</span>
                  {theme === t.id && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: `rgb(var(--color-accent))` }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </Section>

        <Section label="Text size">
          <div
            className="flex rounded-xl overflow-hidden"
            style={{
              border: '0.5px solid var(--theme-card-border)',
              background: 'rgba(var(--color-border) / 0.15)',
            }}
          >
            {TEXT_SIZES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setTextSize(s.id)}
                className="flex-1 py-2 flex items-center justify-center transition-all"
                style={{
                  background: textSize === s.id ? 'var(--theme-card-bg)' : 'transparent',
                  color: textSize === s.id ? 'var(--theme-text-1)' : 'var(--theme-text-3)',
                  borderRight: i < TEXT_SIZES.length - 1 ? '0.5px solid var(--theme-card-border)' : 'none',
                  fontWeight: textSize === s.id ? 600 : 400,
                  borderRadius: textSize === s.id ? 10 : 0,
                  boxShadow: textSize === s.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <span style={{
                  fontSize: s.id === 'sm' ? 10 : s.id === 'md' ? 13 : s.id === 'lg' ? 16 : 20,
                  lineHeight: 1,
                }}>
                  A
                </span>
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-1" style={{ color: 'var(--theme-text-3)' }}>
            {TEXT_SIZES.find(t => t.id === textSize)?.label}
          </p>
        </Section>

        <Section label="Layout">
          <button
            onClick={() => { resetLayout(); onClose() }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:opacity-70"
            style={{
              border: '0.5px solid var(--theme-card-border)',
              color: 'var(--theme-text-2)',
              background: 'rgba(var(--color-border) / 0.1)',
            }}
          >
            <RotateCcw size={13} />
            Reset layout
          </button>
        </Section>

      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[11px] font-semibold"
        style={{ color: 'var(--theme-text-3)' }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}
