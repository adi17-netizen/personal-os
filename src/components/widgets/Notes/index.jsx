import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useNotes } from '../../../hooks/useNotes'
import SkeletonList from '../../layout/SkeletonList'
import ErrorState from '../../layout/ErrorState'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

const SAVE_LABELS = {
  saving: 'Saving…',
  saved:  'Saved',
  error:  'Save failed',
}

export default function Notes() {
  const { content, handleChange, status, error, saveState } = useNotes()
  const [listening, setListening]   = useState(false)
  const recognitionRef              = useRef(null)

  const toggleAudio = useCallback(() => {
    if (listening) {
      // Stop
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      setListening(false)
      return
    }

    if (!SpeechRecognition) {
      alert('Speech recognition requires Chrome.')
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous     = true
    rec.interimResults = false
    rec.lang           = 'en-US'

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .slice(e.resultIndex)
        .filter(r => r.isFinal)
        .map(r => r[0].transcript)
        .join(' ')
      if (transcript) handleChange(content + (content ? ' ' : '') + transcript)
    }

    rec.onend = () => {
      if (recognitionRef.current === rec) rec.start()
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return
      setListening(false)
      recognitionRef.current = null
    }

    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }, [listening, content, handleChange])

  if (status === 'loading') return <div className="p-4"><SkeletonList rows={6} /></div>
  if (status === 'error')   return <ErrorState message={error?.message} />

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative min-h-0">
        <textarea
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder={listening ? 'Listening… speak your notes' : 'Start typing your notes…'}
          className="absolute inset-0 w-full h-full resize-none bg-transparent text-sm font-mono outline-none p-4 leading-relaxed"
          style={{ color: 'var(--theme-text-1)' }}
          spellCheck={false}
        />
      </div>

      <div
        className="shrink-0 flex items-center justify-between px-4 py-2"
        style={{ borderTop: '0.5px solid var(--theme-card-border)' }}
      >
        <span className="text-[10px]" style={{ color: 'var(--theme-text-2)' }}>Syncs to Google Docs</span>

        <div className="flex items-center gap-3">
          <span className="text-[10px]" style={{ color: saveState === 'error' ? '#EF4444' : 'var(--theme-text-2)' }}>
            {SAVE_LABELS[saveState]}
          </span>

          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            title={listening ? 'Stop dictation' : 'Dictate notes'}
            className="flex items-center justify-center rounded-full transition-all hover:opacity-80"
            style={{
              width: 60, height: 60,
              background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(var(--color-border) / 0.15)',
              color: listening ? 'rgba(239,68,68,0.8)' : 'var(--theme-text-3)',
            }}
          >
            {listening ? <MicOff size={30} strokeWidth={2} /> : <Mic size={30} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Listening indicator */}
      {listening && (
        <div
          className="shrink-0 flex items-center gap-1.5 px-4 py-1"
          style={{ background: 'rgba(239,68,68,0.06)', borderTop: '0.5px solid rgba(239,68,68,0.12)' }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: '#EF4444' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: '#EF4444' }} />
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(239,68,68,0.7)' }}>Listening</span>
        </div>
      )}
    </div>
  )
}
