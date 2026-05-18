import { useState, useEffect, useCallback, useRef } from 'react'
import { TokenExpiredError } from './googleApi'

export function useWidgetData(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const result = await fetchFn()
      if (!mountedRef.current) return
      if (result === null || result === undefined || (Array.isArray(result) && result.length === 0)) {
        setStatus('empty')
        setData(null)
      } else {
        setData(result)
        setStatus('success')
      }
    } catch (e) {
      if (!mountedRef.current) return
      if (e instanceof TokenExpiredError) {
        setError({ type: 'token', message: e.message })
      } else {
        setError({ type: 'api', message: e.message || 'Something went wrong' })
      }
      setStatus('error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  return { data, status, error, retry: load }
}

export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
