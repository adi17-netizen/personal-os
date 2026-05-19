import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const LS_KEY = 'personal-os-topics'
const DEFAULT_TOPICS = ['Technology', 'AI', 'Science']


async function fetchTopic(topic) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=15`
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error(data.message || 'RSS error')
  return data.items.map(item => ({
    title: item.title ?? '',
    link: item.link ?? '',
    pubDate: item.pubDate ?? '',
    source: item.author ?? '',
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
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const load = useCallback(async (currentTopics) => {
    setStatus('loading')
    setError(null)
    try {
      const results = await Promise.allSettled(currentTopics.map(fetchTopic))
      const all = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 25)

      if (all.length === 0) { setStatus('empty') }
      else { setArticles(all); setStatus('success') }
    } catch (e) {
      setError(e.message); setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (MOCK) { load(topics); return }
    if (!user) return
    const prefRef = doc(db, 'userPrefs', user.uid)
    getDoc(prefRef).then(snap => {
      const saved = snap.data()?.newsTopics
      const t = saved?.length ? saved : DEFAULT_TOPICS
      setTopics(t); load(t)
    }).catch(() => load(DEFAULT_TOPICS))
  }, [user, load])

  const updateTopics = useCallback(async (newTopics) => {
    setTopics(newTopics)
    if (MOCK) {
      localStorage.setItem(LS_KEY, JSON.stringify(newTopics))
    } else if (user) {
      await setDoc(doc(db, 'userPrefs', user.uid), { newsTopics: newTopics }, { merge: true })
    }
    load(newTopics)
  }, [user, load])

  return { articles, topics, status, error, retry: () => load(topics), updateTopics }
}
