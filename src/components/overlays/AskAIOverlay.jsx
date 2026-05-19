import { useState, useEffect, useRef } from 'react'
import { Sparkles, X, Search } from 'lucide-react'

const LS_KEY = 'personal-os-ai-history'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] }
}
function saveHistory(q) {
  const h = [q, ...loadHistory().filter(x => x !== q)].slice(0, 5)
  localStorage.setItem(LS_KEY, JSON.stringify(h))
}

export default function AskAIOverlay({ onClose }) {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState(loadHistory)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const openAI = (q) => {
    const term = (q || query).trim()
    if (!term) return
    saveHistory(term)
    setHistory(loadHistory())
    window.open(`https://www.google.com/search?q=${encodeURIComponent(term)}&udm=50`, '_blank')
    onClose()
  }

  const openGemini = (q) => {
    const term = (q || query).trim()
    if (!term) return
    saveHistory(term)
    setHistory(loadHistory())
    window.open(`https://gemini.google.com/app`, '_blank')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[18vh] z-50"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl flex flex-col gap-2"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{
            background: 'var(--theme-card-bg)',
            border: `0.5px solid rgba(var(--color-accent) / 0.3)`,
            backdropFilter: 'blur(40px)',
          }}
        >
          <Sparkles size={18} style={{ color: `rgb(var(--color-accent))`, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && openAI()}
            placeholder="Ask anything…"
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: 'var(--theme-text-1)', fontSize: 17 }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--theme-text-3)' }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Action buttons */}
        {query.trim() && (
          <div
            className="flex items-center gap-2 px-2"
          >
            <button
              onClick={() => openAI()}
              className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: `rgb(var(--color-accent))`, color: '#fff' }}
            >
              <Search size={14} /> Google AI Mode
            </button>
            <button
              onClick={() => openGemini()}
              className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'rgba(var(--color-border) / 0.4)', color: 'var(--theme-text-1)' }}
            >
              <Sparkles size={14} /> Open Gemini
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: 'var(--theme-card-bg)',
              border: '0.5px solid var(--theme-card-border)',
              backdropFilter: 'blur(40px)',
            }}
          >
            <p className="text-[11px] font-semibold px-4 pt-3 pb-1" style={{ color: 'var(--theme-text-3)' }}>
              Recent
            </p>
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => openAI(h)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:opacity-70 transition-opacity text-left"
                style={{ color: 'var(--theme-text-2)', borderTop: i === 0 ? 'none' : '0.5px solid var(--theme-card-border)' }}
              >
                <Sparkles size={13} style={{ flexShrink: 0, color: `rgb(var(--color-accent))` }} />
                {h}
              </button>
            ))}
          </div>
        )}

        <p className="text-center text-[11px]" style={{ color: 'var(--theme-text-3)' }}>
          Enter → Google AI Mode · Esc to close
        </p>
      </div>
    </div>
  )
}
