import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const LS_KEY = 'personal-os-topics'
const DEFAULT_TOPICS = ['Technology', 'AI', 'Science']
const MAX_TOPICS = 7
const REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes

async function fetchTopicViaProxy(rssUrl) {
  const proxyUrl = `https://allorigins.win/get?disableCache=true&url=${encodeURIComponent(rssUrl)}`
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`proxy ${res.status}`)
  const json = await res.json()
  if (!json.contents) throw new Error('empty proxy response')
  const xml = new DOMParser().parseFromString(json.contents, 'text/xml')
  const items = [...xml.querySelectorAll('item')]
  if (!items.length) throw new Error('no items in feed')
  return items.slice(0, 10).map(item => ({
    title: item.querySelector('title')?.textContent ?? '',
    link: item.querySelector('link')?.textContent ?? '',
    pubDate: item.querySelector('pubDate')?.textContent ?? '',
    source: item.querySelector('source')?.textContent ?? '',
  }))
}

async function fetchTopicViaRss2json(rssUrl) {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=10`
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`rss2json ${res.status}`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error(data.message || 'rss2json error')
  return data.items.map(item => ({
    title: item.title ?? '',
    link: item.link ?? '',
    pubDate: item.pubDate ?? '',
    source: item.author ?? '',
  }))
}

async function fetchTopic(topic) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-IN&gl=IN&ceid=IN:en`
  // Try allorigins first (fresh data), fall back to rss2json if it's down
  try {
    const items = await fetchTopicViaProxy(rssUrl)
    return items.map(i => ({ ...i, topic }))
  } catch {
    const items = await fetchTopicViaRss2json(rssUrl)
    return items.map(i => ({ ...i, topic }))
  }
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

  return { articles, topics, status, error, retry: () => load(topics), updateTopics, MAX_TOPICS, lastRefreshed }
}
