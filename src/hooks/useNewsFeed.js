import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const LS_KEY = 'personal-os-topics'
const LS_X_KEY = 'personal-os-xhandle'
const DEFAULT_TOPICS = ['Technology', 'AI', 'Science']
const DEFAULT_X_HANDLE = 'elonmusk'
const MAX_TOPICS = 7
const REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes

async function fetchTopic(topic) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-IN&gl=IN&ceid=IN:en`
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=10`
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error(data.message || 'RSS error')
  return data.items.map(item => ({
    title: item.title ?? '',
    link: item.link ?? '',
    pubDate: item.pubDate ?? '',
    source: item.author ?? '',
    topic,
  }))
}

export function useNewsFeed() {
  const { user } = useAuth()
  const [articles, setArticles] = useState([])
  const [topics, setTopics] = useState(() => {
    if (MOCK) {
      try { return JSON.parse(localStorage.getItem(LS_KEY)) || DEFAULT_TOPICS } catch { return DEFAULT_TOPICS }
    }
    return DEFAULT_TOPICS
  })
  const [xHandle, setXHandle] = useState(() => localStorage.getItem(LS_X_KEY) || DEFAULT_X_HANDLE)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const intervalRef = useRef(null)

  const load = useCallback(async (currentTopics) => {
    setStatus(prev => prev === 'success' ? 'success' : 'loading') // don't flash loading on refresh
    setError(null)
    try {
      const results = await Promise.allSettled(currentTopics.map(fetchTopic))
      const all = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 30)

      if (all.length === 0) { setStatus('empty') }
      else { setArticles(all); setStatus('success'); setLastRefreshed(new Date()) }
    } catch (e) {
      setError(e.message); setStatus('error')
    }
  }, [])

  // Load topics + X handle from Firestore then fetch articles
  useEffect(() => {
    if (MOCK) { load(topics); return }
    if (!user) return
    const prefRef = doc(db, 'userPrefs', user.uid)
    getDoc(prefRef).then(snap => {
      const data = snap.data() || {}
      const t = data.newsTopics?.length ? data.newsTopics : DEFAULT_TOPICS
      setTopics(t)
      if (data.xHandle) setXHandle(data.xHandle)
      load(t)
    }).catch(() => load(DEFAULT_TOPICS))
  }, [user, load])

  // Auto-refresh every 15 minutes
  useEffect(() => {
    intervalRef.current = setInterval(() => load(topics), REFRESH_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [topics, load])

  const updateTopics = useCallback(async (newTopics) => {
    const capped = newTopics.slice(0, MAX_TOPICS)
    setTopics(capped)
    if (MOCK) {
      localStorage.setItem(LS_KEY, JSON.stringify(capped))
    } else if (user) {
      await setDoc(doc(db, 'userPrefs', user.uid), { newsTopics: capped }, { merge: true })
    }
    load(capped)
  }, [user, load])

  const updateXHandle = useCallback(async (newHandle) => {
    const clean = newHandle.replace(/^@/, '').trim()
    if (!clean) return
    setXHandle(clean)
    localStorage.setItem(LS_X_KEY, clean)
    if (!MOCK && user) {
      await setDoc(doc(db, 'userPrefs', user.uid), { xHandle: clean }, { merge: true })
    }
  }, [user])

  return { articles, topics, status, error, retry: () => load(topics), updateTopics, MAX_TOPICS, lastRefreshed, xHandle, updateXHandle }
}
