import { useState, useEffect } from 'react'
import { Play, Pause, Square } from 'lucide-react'
import { useFocus } from '../../contexts/FocusContext'

const PRESETS = [
  { label: '25m', secs: 25 * 60 },
  { label: '45m', secs: 45 * 60 },
  { label: '90m', secs: 90 * 60 },
]

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function FocusOverlay({ onClose }) {
  const { status, remaining, progress, start, pause, resume, stop } = useFocus()
  const [hours, setHours]     = useState('')
  const [minutes, setMinutes] = useState('25')

  // Auto-dismiss 2s after completion
  useEffect(() => {
    if (status === 'done') {
      const t = setTimeout(() => { stop(); onClose() }, 2000)
      return () => clearTimeout(t)
    }
  }, [status, stop, onClose])

  const handleStart = () => {
    const h = parseInt(hours, 10) || 0
    const m = parseInt(minutes, 10) || 0
    const total = h * 3600 + m * 60
    if (total > 0) start(total)
  }

  const handleStop = () => {
    stop()
    onClose()
  }

  const applyPreset = (secs) => {
    setHours('')
    setMinutes(String(secs / 60))
    start(secs)
  }

  // ── Setup (idle) ──────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xs rounded-2xl flex flex-col items-center gap-5 px-8 py-8"
          style={{
            background: 'var(--theme-card-bg)',
            border: '0.5px solid var(--theme-card-border)',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            animation: 'settings-drop 0.2s cubic-bezier(0.2,0,0,1) forwards',
          }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-1)' }}>Focus Timer</p>

          {/* Time inputs */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <input
                type="number"
                min="0" max="23"
                value={hours}
                onChange={e => setHours(e.target.value)}
                placeholder="0"
                className="w-16 text-center text-2xl font-mono font-semibold rounded-xl py-2 outline-none"
                style={{
                  background: 'rgba(var(--color-border) / 0.2)',
                  border: '0.5px solid var(--theme-card-border)',
                  color: 'var(--theme-text-1)',
                }}
              />
              <span className="text-xs mt-1" style={{ color: 'var(--theme-text-3)' }}>hr</span>
            </div>
            <span className="text-2xl font-semibold mb-5" style={{ color: 'var(--theme-text-3)' }}>:</span>
            <div className="flex flex-col items-center">
              <input
                type="number"
                min="0" max="59"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                placeholder="25"
                className="w-16 text-center text-2xl font-mono font-semibold rounded-xl py-2 outline-none"
                style={{
                  background: 'rgba(var(--color-border) / 0.2)',
                  border: '0.5px solid var(--theme-card-border)',
                  color: 'var(--theme-text-1)',
                }}
              />
              <span className="text-xs mt-1" style={{ color: 'var(--theme-text-3)' }}>min</span>
            </div>
          </div>

          {/* Presets */}
          <div className="flex gap-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.secs)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{
                  background: 'rgba(var(--color-border) / 0.25)',
                  color: 'var(--theme-text-2)',
                  border: '0.5px solid var(--theme-card-border)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Start */}
          <button
            onClick={handleStart}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{
              background: `rgba(var(--color-accent) / 0.12)`,
              color: `rgb(var(--color-accent))`,
              border: `0.5px solid rgba(var(--color-accent) / 0.25)`,
            }}
          >
            Start Focus
          </button>
        </div>
      </div>
    )
  }

  // ── Active (running / paused) ─────────────────────────────────────────────
  if (status === 'running' || status === 'paused') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      >
        <div
          className="w-full max-w-xs rounded-2xl flex flex-col items-center gap-5 px-8 py-8"
          style={{
            background: 'var(--theme-card-bg)',
            border: '0.5px solid var(--theme-card-border)',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          }}
        >
          {/* Countdown */}
          <div
            className="font-mono font-semibold leading-none"
            style={{ fontSize: 48, color: 'var(--theme-text-1)', letterSpacing: '-0.04em' }}
          >
            {formatTime(remaining)}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(var(--color-border) / 0.3)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress * 100}%`, background: `rgb(var(--color-accent))` }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={status === 'running' ? pause : resume}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: `rgba(var(--color-accent) / 0.12)`,
                color: `rgb(var(--color-accent))`,
                border: `0.5px solid rgba(var(--color-accent) / 0.25)`,
              }}
            >
              {status === 'running' ? <Pause size={14} strokeWidth={2.5} /> : <Play size={14} strokeWidth={2.5} />}
              {status === 'running' ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: 'rgba(var(--color-border) / 0.2)',
                color: 'var(--theme-text-2)',
                border: '0.5px solid var(--theme-card-border)',
              }}
            >
              <Square size={12} strokeWidth={3} />
              Stop
            </button>
          </div>

          {status === 'paused' && (
            <p className="text-xs" style={{ color: 'var(--theme-text-3)' }}>Paused</p>
          )}
        </div>
      </div>
    )
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (status === 'done') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      >
        <div
          className="w-full max-w-xs rounded-2xl flex flex-col items-center gap-3 px-8 py-8"
          style={{
            background: 'var(--theme-card-bg)',
            border: '0.5px solid var(--theme-card-border)',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          }}
        >
          <div className="text-3xl">&#10003;</div>
          <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-1)' }}>Session complete</p>
        </div>
      </div>
    )
  }

  return null
}
