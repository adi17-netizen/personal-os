import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Square, FileText, X, Loader } from 'lucide-react'
import { fetchGoogle } from '../../lib/googleApi'
import { useAuth } from '../../contexts/AuthContext'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function MeetingRecorderCard({ onClose }) {
  const { user } = useAuth()
  const [phase, setPhase]           = useState('idle')   // idle | recording | transcribing | done | error
  const [meetingName, setMeetingName] = useState('')
  const [seconds, setSeconds]       = useState(0)
  const [transcript, setTranscript] = useState('')
  const [saving, setSaving]         = useState(false)
  const [errorMsg, setErrorMsg]     = useState('')

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const streamRef        = useRef(null)
  const audioCtxRef      = useRef(null)
  const oscillatorRef    = useRef(null)
  const timerRef         = useRef(null)
  const transcriptRef    = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleClose = () => {
    stopResources()
    onClose()
  }

  const stopResources = () => {
    clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (oscillatorRef.current) { try { oscillatorRef.current.stop() } catch {} ; oscillatorRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Silent oscillator to keep tab alive when minimised
      audioCtxRef.current = new AudioContext()
      oscillatorRef.current = audioCtxRef.current.createOscillator()
      const gain = audioCtxRef.current.createGain()
      gain.gain.value = 0.00001
      oscillatorRef.current.connect(gain)
      gain.connect(audioCtxRef.current.destination)
      oscillatorRef.current.start()

      // Browser notification
      const notify = () => new Notification('🔴 Personal OS is recording — keep browser open', { silent: true, tag: 'meeting-recorder' })
      if (Notification.permission === 'granted') notify()
      else if (Notification.permission !== 'denied') Notification.requestPermission().then(p => { if (p === 'granted') notify() })

      // MediaRecorder
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(1000)
      mediaRecorderRef.current = mr

      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
      setPhase('recording')
    } catch (e) {
      setErrorMsg(e.message || 'Microphone access denied')
      setPhase('error')
    }
  }, [])

  const stopRecording = useCallback(async () => {
    clearInterval(timerRef.current)
    if (oscillatorRef.current) { try { oscillatorRef.current.stop() } catch {} ; oscillatorRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
    streamRef.current?.getTracks().forEach(t => t.stop())

    setPhase('transcribing')

    const mr = mediaRecorderRef.current
    if (!mr) return

    // Wait for final chunk
    await new Promise(resolve => {
      mr.onstop = resolve
      if (mr.state !== 'inactive') mr.stop()
      else resolve()
    })

    const blob = new Blob(chunksRef.current, { type: mr.mimeType })

    try {
      let text = ''
      if (MOCK || !GROQ_KEY) {
        await new Promise(r => setTimeout(r, 1500))
        text = `Mock transcript for "${meetingName || 'Meeting'}": The team discussed project milestones and agreed on deliverables for Q2. Action items were assigned and next steps were outlined.`
      } else {
        const form = new FormData()
        form.append('file', blob, 'recording.webm')
        form.append('model', 'whisper-large-v3-turbo')
        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${GROQ_KEY}` },
          body: form,
        })
        if (!res.ok) throw new Error(`Groq ${res.status}`)
        const data = await res.json()
        text = data.text || ''
      }
      setTranscript(text)
      setPhase('done')
    } catch (e) {
      setErrorMsg(e.message || 'Transcription failed')
      setPhase('error')
    }
  }, [meetingName])

  const saveAndSummarize = useCallback(async () => {
    if (!transcript) return
    setSaving(true)
    try {
      let summary = ''
      if (MOCK || !GROQ_KEY) {
        await new Promise(r => setTimeout(r, 1000))
        summary = `**Summary:** The meeting covered key project updates and next steps.\n\n**Action Items:**\n- Follow up on deliverables\n- Schedule next sync`
      } else {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{
              role: 'user',
              content: `Summarize this meeting transcript. Return three sections:\n1. Summary (3-5 sentences)\n2. Action Items (bullet list)\n3. Key Decisions (bullet list)\n\nTranscript:\n${transcript}`,
            }],
          }),
        })
        if (!res.ok) throw new Error(`Groq ${res.status}`)
        const data = await res.json()
        summary = data.choices?.[0]?.message?.content || ''
      }

      const title = `${meetingName || 'Meeting'} — ${new Date().toLocaleDateString()}`
      const docContent = `${summary}\n\n---\n\nRaw Transcript:\n${transcript}`

      if (!MOCK) {
        // Create Google Doc
        const doc = await fetchGoogle('https://docs.googleapis.com/v1/documents', {
          method: 'POST',
          body: JSON.stringify({ title }),
        })
        const docId = doc.documentId
        await fetchGoogle(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
          method: 'POST',
          body: JSON.stringify({
            requests: [{
              insertText: { location: { index: 1 }, text: docContent },
            }],
          }),
        })
        window.open(`https://docs.google.com/document/d/${docId}`, '_blank')
      } else {
        // Mock: show the summary in an alert
        alert(`[Mock] Doc created:\n\n${title}\n\n${summary}`)
      }
    } catch (e) {
      alert('Save failed: ' + e.message)
    }
    setSaving(false)
  }, [transcript, meetingName])

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[12vh] z-50"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'rgb(var(--color-card))',
          border: '0.5px solid var(--theme-card-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 32px 64px rgba(0,0,0,0.2)',
          animation: 'settings-drop 0.2s cubic-bezier(0.2,0,0,1) forwards',
          maxHeight: '70vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 shrink-0" style={{ borderBottom: '0.5px solid var(--theme-card-border)' }}>
          <div className="flex items-center gap-2">
            {phase === 'recording' && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#EF4444' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#EF4444' }} />
              </span>
            )}
            <span className="text-[13px] font-semibold" style={{ color: phase === 'recording' ? '#EF4444' : 'var(--theme-text-1)' }}>
              {phase === 'recording' ? (meetingName || 'Recording') : 'Meeting Recorder'}
            </span>
            {(phase === 'recording') && (
              <span className="font-mono text-xs" style={{ color: 'var(--theme-text-3)' }}>{formatTime(seconds)}</span>
            )}
          </div>
          <button onClick={handleClose} className="hover:opacity-60 transition-opacity" style={{ color: 'var(--theme-text-3)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Idle */}
          {phase === 'idle' && (
            <div className="flex flex-col items-center justify-center gap-5 px-6 py-8">
              <input
                type="text"
                placeholder="Meeting name (optional)"
                value={meetingName}
                onChange={e => setMeetingName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startRecording()}
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{
                  fontSize: 14,
                  background: 'rgba(var(--color-border) / 0.2)',
                  border: '0.5px solid var(--theme-card-border)',
                  color: 'var(--theme-text-1)',
                }}
              />
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
                style={{ background: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.65)' }}
              >
                <Mic size={28} strokeWidth={1.8} />
              </button>
              <p className="text-xs" style={{ color: 'var(--theme-text-3)' }}>
                {GROQ_KEY || MOCK ? 'Whisper transcription' : 'Add VITE_GROQ_API_KEY for transcription'}
              </p>
            </div>
          )}

          {/* Recording */}
          {phase === 'recording' && (
            <div className="flex flex-col px-5 py-4 gap-3 flex-1 overflow-hidden">
              <p className="text-xs shrink-0" style={{ color: 'var(--theme-text-3)' }}>
                Recording audio… transcript will appear after you stop.
              </p>
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={stopRecording}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
                  style={{ background: 'rgba(239,68,68,0.22)', color: '#EF4444', animation: 'mic-pulse 1.4s ease-in-out infinite' }}
                >
                  <Square size={20} strokeWidth={2.5} />
                </button>
              </div>
              <p className="text-center text-[10px] shrink-0" style={{ color: 'rgba(239,68,68,0.6)' }}>tap to stop</p>
            </div>
          )}

          {/* Transcribing */}
          {phase === 'transcribing' && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-10">
              <Loader size={24} className="animate-spin" style={{ color: `rgb(var(--color-accent))` }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-2)' }}>Transcribing with Whisper…</p>
            </div>
          )}

          {/* Done */}
          {phase === 'done' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div
                ref={transcriptRef}
                className="flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed"
                style={{ color: 'var(--theme-text-1)' }}
              >
                {transcript}
              </div>
              <div className="shrink-0 flex gap-2 px-5 py-3" style={{ borderTop: '0.5px solid var(--theme-card-border)' }}>
                <button
                  onClick={() => { setPhase('idle'); setTranscript(''); setSeconds(0) }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium hover:opacity-70 transition-opacity"
                  style={{ background: 'rgba(var(--color-border) / 0.2)', color: 'var(--theme-text-2)' }}
                >
                  New recording
                </button>
                <button
                  onClick={saveAndSummarize}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
                  style={{ background: `rgba(var(--color-accent) / 0.12)`, color: `rgb(var(--color-accent))`, border: `0.5px solid rgba(var(--color-accent) / 0.25)` }}
                >
                  {saving ? <Loader size={13} className="animate-spin" /> : <FileText size={13} />}
                  {saving ? 'Saving…' : 'Save & Summarize'}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-8">
              <p className="text-sm text-red-400">{errorMsg}</p>
              <button
                onClick={() => setPhase('idle')}
                className="text-xs hover:opacity-60 transition-opacity"
                style={{ color: 'var(--theme-text-3)' }}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
