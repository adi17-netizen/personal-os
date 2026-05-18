import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const FocusContext = createContext(null)

export function FocusProvider({ children }) {
  const [status, setStatus]     = useState('idle')  // 'idle' | 'running' | 'paused' | 'done'
  const [duration, setDuration] = useState(0)        // total seconds
  const [remaining, setRemaining] = useState(0)      // seconds left
  const intervalRef = useRef(null)

  const start = useCallback((seconds) => {
    setDuration(seconds)
    setRemaining(seconds)
    setStatus('running')
  }, [])

  const pause  = useCallback(() => setStatus('paused'), [])
  const resume = useCallback(() => setStatus('running'), [])

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    setStatus('idle')
    setRemaining(0)
    setDuration(0)
  }, [])

  // Tick
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current)
            setStatus('done')
            return 0
          }
          return r - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [status])

  // Tab title
  useEffect(() => {
    if (status === 'running' || status === 'paused') {
      const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
      const ss = String(remaining % 60).padStart(2, '0')
      document.title = `⏱ ${mm}:${ss} — Focus`
    } else {
      document.title = 'Personal OS'
    }
  }, [status, remaining])

  const isFocusing = status === 'running' || status === 'paused'
  const progress   = duration > 0 ? (duration - remaining) / duration : 0

  return (
    <FocusContext.Provider value={{ status, duration, remaining, progress, start, pause, resume, stop, isFocusing }}>
      {children}
    </FocusContext.Provider>
  )
}

export function useFocus() {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useFocus must be inside FocusProvider')
  return ctx
}
