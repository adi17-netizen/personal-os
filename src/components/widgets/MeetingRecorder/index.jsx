import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, FileText } from 'lucide-react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function MeetingRecorder() {
  const [status, setStatus]               = useState('idle')      // 'idle' | 'recording' | 'done'
  const [meetingName, setMeetingName]     = useState('')
  const [finalText, setFinalText]         = useState('')
  const [interimText, setInterimText]     = useState('')
  const [seconds, setSeconds]             = useState(0)

  const recognitionRef  = useRef(null)
  const audioCtxRef     = useRef(null)
  const oscillatorRef   = useRef(null)
  const timerRef        = useRef(null)
  const transcriptRef   = useRef(null)

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [finalText, interimText])

  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome.')
      return
    }

    // Silent AudioContext to keep tab alive when minimized
    audioCtxRef.current = new AudioContext()
    oscillatorRef.current = audioCtxRef.current.createOscillator()
    const gain = audioCtxRef.current.createGain()
    gain.gain.value = 0.00001
    oscillatorRef.current.connect(gain)
    gain.connect(audioCtxRef.current.destination)
    oscillatorRef.current.start()

    // Browser notification
    const notify = () => new Notification('🔴 Personal OS is recording — keep browser open', {
      silent: true,
      tag: 'meeting-recorder',
    })
    if (Notification.permission === 'granted') {
      notify()
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => { if (p === 'granted') notify() })
    }

    // Speech recognition
    const rec = new SpeechRecognition()
    rec.continuous      = true
    rec.interimResults  = true
    rec.lang            = 'en-US'

    rec.onresult = (e) => {
      let interim = ''
      let final   = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t + ' '
        else interim += t
      }
      if (final) setFinalText(prev => prev + final)
      setInterimText(interim)
    }

    // Auto-restart on end (browser may stop after silence)
    rec.onend = () => {
      if (recognitionRef.current === rec) rec.start()
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return  // non-fatal, will restart
      console.warn('SpeechRecognition error:', e.error)
    }

    rec.start()
    recognitionRef.current = rec

    // Timer
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)

    setFinalText('')
    setInterimText('')
    setStatus('recording')
  }, [])

  const stopRecording = useCallback(() => {
    // Stop recognition
    if (recognitionRef.current) {
      recognitionRef.current.onend = null  // prevent auto-restart
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    // Stop AudioContext
    if (oscillatorRef.current) { oscillatorRef.current.stop(); oscillatorRef.current = null }
    if (audioCtxRef.current)   { audioCtxRef.current.close(); audioCtxRef.current = null }
    // Stop timer
    clearInterval(timerRef.current)
    setInterimText('')
    setStatus('done')
  }, [])

  const reset = () => {
    setStatus('idle')
    setFinalText('')
    setInterimText('')
    setSeconds(0)
    setMeetingName('')
  }

  /* ── Render ────────────────────────────────────────────── */

  if (status === 'idle') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5 px-5 py-4">
        <input
          type="text"
          placeholder="Meeting name (optional)"
          value={meetingName}
          onChange={e => setMeetingName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && startRecording()}
          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
          style={{
            fontSize: 15,
            background: 'rgba(var(--color-border) / 0.15)',
            border: '0.5px solid var(--theme-card-border)',
            color: 'var(--theme-text-1)',
          }}
        />
        <button
          onClick={startRecording}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
          style={{ background: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.65)' }}
        >
          <Mic size={24} strokeWidth={1.8} />
        </button>
        {!SpeechRecognition && (
          <p className="text-sm text-center" style={{ color: 'var(--theme-text-3)' }}>
            Use Chrome for speech recognition
          </p>
        )}
      </div>
    )
  }

  if (status === 'recording') {
    return (
      <div className="h-full flex flex-col px-4 py-3 gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>
            {meetingName || 'Recording'}
          </span>
          <span className="font-mono text-sm font-medium" style={{ color: 'var(--theme-text-2)' }}>
            {formatTime(seconds)}
          </span>
        </div>

        {/* Live transcript */}
        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto text-sm leading-relaxed min-h-0"
          style={{ color: 'var(--theme-text-1)' }}
        >
          <span>{finalText}</span>
          <span style={{ color: 'var(--theme-text-3)' }}>{interimText}</span>
          {!finalText && !interimText && (
            <span className="text-sm" style={{ color: 'var(--theme-text-3)' }}>
              Listening…
            </span>
          )}
        </div>

        {/* Pulsing mic — tap to stop */}
        <div className="shrink-0 flex flex-col items-center gap-1 pb-1">
          <button
            onClick={stopRecording}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
            style={{
              background: 'rgba(239,68,68,0.22)',
              color: '#EF4444',
              animation: 'mic-pulse 1.4s ease-in-out infinite',
            }}
          >
            <Mic size={28} strokeWidth={1.8} />
          </button>
          <span className="text-[10px]" style={{ color: 'rgba(239,68,68,0.6)' }}>tap to stop</span>
        </div>
      </div>
    )
  }

  // status === 'done'
  return (
    <div className="h-full flex flex-col px-4 py-3 gap-3">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold" style={{ color: 'var(--theme-text-2)' }}>
          {meetingName || 'Meeting'} · {formatTime(seconds)}
        </span>
        <button
          onClick={reset}
          className="text-[11px] hover:opacity-60 transition-opacity"
          style={{ color: 'var(--theme-text-3)' }}
        >
          New recording
        </button>
      </div>

      {/* Full transcript */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto text-sm leading-relaxed min-h-0"
        style={{ color: 'var(--theme-text-1)' }}
      >
        {finalText || <span style={{ color: 'var(--theme-text-3)' }}>No transcript captured.</span>}
      </div>

      {/* Save & Summarize — wired up later */}
      <button
        disabled
        className="shrink-0 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all opacity-50 cursor-not-allowed"
        style={{ background: 'rgba(var(--color-accent) / 0.12)', color: `rgb(var(--color-accent))`, border: '0.5px solid rgba(var(--color-accent) / 0.25)' }}
      >
        <FileText size={13} />
        Save & Summarize
      </button>
    </div>
  )
}
