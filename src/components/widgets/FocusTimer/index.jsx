import { useState } from 'react'
import { Play, Pause, Square } from 'lucide-react'
import { useFocus } from '../../../contexts/FocusContext'

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

export default function FocusTimer() {
  const { status, remaining, progress, start, pause, resume, stop } = useFocus()
  const [hours, setHours]   = useState('')
  const [minutes, setMinutes] = useState('25')

  const handleStart = () => {
    const h = parseInt(hours, 10) || 0
    const m = parseInt(minutes, 10) || 0
    const total = h * 3600 + m * 60
    if (total > 0) start(total)
  }

  const applyPreset = (secs) => {
    setHours('')
    setMinutes(String(secs / 60))
    start(secs)
  }

  // Idle / setup
  if (status === 'idle') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-3 gap-1.5 overflow-hidden">
        {/* Time inputs — inline labels */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            max="23"
            value={hours}
            onChange={e => setHours(e.target.value)}
            placeholder="0"
            className="w-10 text-center text-sm font-mono font-semibold rounded-lg py-1 outline-none"
            style={{
              background: 'rgba(var(--color-border) / 0.2)',
              border: '0.5px solid var(--theme-card-border)',
              color: 'var(--theme-text-1)',
            }}
          />
          <span className="text-xs" style={{ color: 'var(--theme-text-3)' }}>h</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--theme-text-3)' }}>:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            placeholder="25"
            className="w-10 text-center text-sm font-mono font-semibold rounded-lg py-1 outline-none"
            style={{
              background: 'rgba(var(--color-border) / 0.2)',
              border: '0.5px solid var(--theme-card-border)',
              color: 'var(--theme-text-1)',
            }}
          />
          <span className="text-xs" style={{ color: 'var(--theme-text-3)' }}>m</span>
        </div>

        {/* Presets */}
        <div className="flex gap-1">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.secs)}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md transition-all hover:opacity-80"
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
          className="w-full py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
          style={{
            background: `rgba(var(--color-accent) / 0.12)`,
            color: `rgb(var(--color-accent))`,
            border: `0.5px solid rgba(var(--color-accent) / 0.25)`,
          }}
        >
          Start Focus
        </button>
      </div>
    )
  }

  // Active / paused
  if (status === 'running' || status === 'paused') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-3 gap-2 overflow-hidden">
        {/* Countdown */}
        <div
          className="font-mono font-semibold leading-none"
          style={{ fontSize: 30, color: 'var(--theme-text-1)', letterSpacing: '-0.04em' }}
        >
          {formatTime(remaining)}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(var(--color-border) / 0.3)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress * 100}%`, background: `rgb(var(--color-accent))` }}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-1.5">
          <button
            onClick={status === 'running' ? pause : resume}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: `rgba(var(--color-accent) / 0.12)`, color: `rgb(var(--color-accent))`, border: `0.5px solid rgba(var(--color-accent) / 0.25)` }}
          >
            {status === 'running' ? <Pause size={10} strokeWidth={2.5} /> : <Play size={10} strokeWidth={2.5} />}
            {status === 'running' ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={stop}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(var(--color-border) / 0.2)', color: 'var(--theme-text-2)', border: '0.5px solid var(--theme-card-border)' }}
          >
            <Square size={10} strokeWidth={3} />
            Stop
          </button>
        </div>

        {status === 'paused' && (
          <p className="text-[10px]" style={{ color: 'var(--theme-text-3)' }}>Paused</p>
        )}
      </div>
    )
  }

  // Done
  if (status === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 px-3 overflow-hidden">
        <div className="text-2xl">✓</div>
        <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-1)' }}>Session complete</p>
        <button
          onClick={stop}
          className="text-xs hover:opacity-60 transition-opacity"
          style={{ color: 'var(--theme-text-3)' }}
        >
          Start another
        </button>
      </div>
    )
  }

  return null
}
