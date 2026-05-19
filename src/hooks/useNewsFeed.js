import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const LS_KEY = 'personal-os-topics'
const LS_ARTICLES_KEY = 'personal-os-articles'
const DEFAULT_TOPICS = ['Technology', 'AI', 'Science']
const MAX_TOPICS = 7
const MAX_ARTICLES = 40
const REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutes

function getCachedArticles() {
  try {
    return JSON.parse(localStorage.getItem(LS_ARTICLES_KEY)) || []
  } catch { return [] }
}

function setCachedArticles(articles) {
  try { localStorage.setItem(LS_ARTICLES_KEY, JSON.stringify(articles)) } catch {}
}

async function fetchViaOwnApi(topic) {
  const res = await fetch(`/api/rss?topic=${encodeURIComponent(topic)}`, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`api ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return (data.items || []).map(item => ({
    title: item.title ?? '', link: item.link ?? '',
    pubDate: item.pubDate ?? '', source: item.source ?? '', topic,
  }))
}

async function fetchViaRss2json(topic) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-IN&gl=IN&ceid=IN:en`
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=10`
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`rss2json ${res.status}`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error(data.message || 'rss2json error')
  return data.items.map(item => ({
    title: item.title ?? '', link: item.link ?? '',
    pubDate: item.pubDate ?? '', source: item.author ?? '', topic,
  }))
}

async function fetchTopic(topic) {
  // Try our Cloudflare Function first (fresh data), fall back to rss2json (cached but reliable)
  try { return await fetchViaOwnApi(topic) }
  catch { return await fetchViaRss2json(topic) }
}

// Merge new articles into existing, deduplicate by link, sort newest first, cap at MAX
function mergeArticles(existing, fresh) {
  const seen = new Set()
  const merged = []
  // Fresh first so they take priority in dedup
  for (const a of [...fresh, ...existing]) {
    const key = a.link || a.title
    if (!key || seen.has(key)) continue
    seen.add(key)
    merged.push(a)
  }
  merged.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
  return merged.slice(0, MAX_ARTICLES)
}

export function useNewsFeed() {
  const { user } = useAuth()
  const [articles, setArticles] = useState(() => getCachedArticles())
  const [topics, setTopics] = useState(() => {
    if (MOCK) {
      try { return JSON.parse(localStorage.getItem(LS_KEY)) || DEFAULT_TOPICS } catch { return DEFAULT_TOPICS }
    }
    return DEFAULT_TOPICS
  })
  const [status, setStatus] = useState(() => getCachedArticles().length ? 'success' : 'loading')
  const [error, setError] = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const intervalRef = useRef(null)

  const load = useCallback(async (currentTopics) => {
    setStatus(prev => prev === 'success' ? 'success' : 'loading')
    setError(null)
    try {
      const results = await Promise.allSettled(currentTopics.map(fetchTopic))
      const fresh = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)

      if (fresh.length === 0) {
        // Fetch failed but we have cached articles — keep showing them
        setArticles(prev => {
          if (prev.length > 0) { setStatus('success'); return prev }
          setStatus('empty')
          return prev
        })
        return
      }

      setArticles(prev => {
        const merged = mergeArticles(prev, fresh)
        setCachedArticles(merged)
        return merged
      })
      setStatus('success')
      setLastRefreshed(new Date())
    } catch (e) {
      // On error, keep existing articles visible
      setArticles(prev => {
        if (prev.length > 0) { setStatus('success'); return prev }
        setError(e.message); setStatus('error')
        return prev
      })
    }
  }, [])

  // Load topics from Firestore then fetch articles
  useEffect(() => {
    if (MOCK) { load(topics); return }
    if (!user) return
    const prefRef = doc(db, 'userPrefs', user.uid)
    getDoc(prefRef).then(snap => {
      const data = snap.data() || {}
      const t = data.newsTopics?.length ? data.newsTopics : DEFAULT_TOPICS
      setTopics(t)
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
    // Clear cache when topics change — old articles may be irrelevant
    setCachedArticles([])
    if (MOCK) {
      localStorage.setItem(LS_KEY, JSON.stringify(capped))
    } else if (user) {
      await setDoc(doc(db, 'userPrefs', user.uid), { newsTopics: capped }, { merge: true })
    }
    load(capped)
  }, [user, load])

  return { articles, topics, status, error, retry: () => load(topics), updateTopics, MAX_TOPICS, lastRefreshed }
}
