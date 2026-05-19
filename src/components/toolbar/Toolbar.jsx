import { useRef } from 'react'
import { Sun, Search, Sparkles, Video, Mic, Timer, Settings } from 'lucide-react'
import { useFocus } from '../../contexts/FocusContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import SettingsPanel from '../ui/SettingsPanel'
import ToolbarMascot from '../ambient/ToolbarMascot'

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function Toolbar({ activeOverlay, setActiveOverlay, settingsOpen, setSettingsOpen }) {
  const { isFocusing, remaining, status: focusStatus } = useFocus()
  const { user, signOut } = useAuth()
  const meetButtonRef = useRef(null)

  const toggle = (key) => setActiveOverlay(prev => prev === key ? null : key)

  const TOOLS = [
    { key: 'brief',    icon: Sun,      label: 'Daily Brief' },
    { key: 'search',   icon: Search,   label: 'Search',  shortcut: '/' },
    { key: 'ai',       icon: Sparkles, label: 'Ask AI',  shortcut: 'A' },
    { key: 'meet',     icon: Video,    label: 'Meet',    ref: meetButtonRef },
    { key: 'recorder', icon: Mic,      label: 'Record'  },
  ]

  return (
    <header
      className="flex items-center justify-between px-4 shrink-0 relative z-20"
      style={{
        height: 44,
        background: 'var(--theme-header-bg)',
        borderBottom: '0.5px solid var(--theme-header-border)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      {/* Left — brand */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="pos-logo"
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: `linear-gradient(145deg, rgba(var(--color-accent) / 0.95), rgba(var(--color-accent) / 0.7))`,
            boxShadow: `
              0 1px 3px rgba(0,0,0,0.2),
              0 0.5px 0 rgba(255,255,255,0.25) inset,
              0 -0.5px 1px rgba(0,0,0,0.15) inset
            `,
            border: '0.5px solid rgba(255,255,255,0.18)',
          }}
        >
          {/* Glass highlight */}
          <div style={{
            position: 'absolute',
            top: 1,
            left: 2,
            right: 2,
            height: '45%',
            borderRadius: '5px 5px 50% 50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none',
          }} />
          <span style={{
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            position: 'relative',
            zIndex: 1,
          }}>P</span>
        </div>
        <span
          className="text-[15px] font-semibold"
          style={{ color: 'var(--theme-text-1)', letterSpacing: '-0.015em' }}
        >
          Personal OS
        </span>
      </div>

      {/* Center — tool buttons */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map(({ key, icon: Icon, label, shortcut, ref }) => (
          <button
            key={key}
            ref={ref}
            onClick={() => toggle(key)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:opacity-80"
            style={{
              background: activeOverlay === key ? `rgba(var(--color-accent) / 0.12)` : 'transparent',
              color: activeOverlay === key ? `rgb(var(--color-accent))` : 'var(--theme-text-2)',
            }}
            title={shortcut ? `${label} (${shortcut})` : label}
          >
            <Icon size={13} strokeWidth={1.8} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}

        {/* Focus — shows countdown when active */}
        <button
          onClick={() => toggle('focus')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:opacity-80"
          style={{
            background: isFocusing ? 'rgba(var(--color-accent) / 0.12)' : activeOverlay === 'focus' ? 'rgba(var(--color-accent) / 0.12)' : 'transparent',
            color: isFocusing || activeOverlay === 'focus' ? `rgb(var(--color-accent))` : 'var(--theme-text-2)',
          }}
          title="Focus Timer"
        >
          <Timer size={13} strokeWidth={1.8} />
          {isFocusing ? (
            <span className="font-mono text-[11px]">{formatTime(remaining)}</span>
          ) : (
            <span className="hidden sm:inline">Focus</span>
          )}
        </button>
      </div>

      {/* Right — avatar + settings */}
      <div className="flex items-center gap-1.5 shrink-0">
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'User'}
            className="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            style={{ border: '0.5px solid var(--theme-card-border)' }}
            title={user.displayName}
            onClick={signOut}
          />
        )}
        {!user?.photoURL && (
          <button
            onClick={signOut}
            className="text-[13px] font-medium px-2 py-1 rounded-lg transition-opacity hover:opacity-60"
            style={{ color: 'var(--theme-text-2)' }}
          >
            Sign out
          </button>
        )}
        <button
          onClick={() => setSettingsOpen(o => !o)}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:opacity-60"
          style={{
            background: settingsOpen ? `rgba(var(--color-accent) / 0.1)` : 'transparent',
            color: settingsOpen ? `rgb(var(--color-accent))` : 'var(--theme-text-3)',
          }}
          title="Settings"
        >
          <Settings size={15} strokeWidth={1.8} />
        </button>
      </div>

      <ToolbarMascot />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </header>
  )
}
