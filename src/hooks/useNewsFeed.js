import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const LS_KEY = 'personal-os-topics'
const DEFAULT_TOPICS = ['Technology', 'AI', 'Science']

export function useNewsFeed() {
  const { user } = useAuth()
  const [topics, setTopics] = useState(() => {
    if (MOCK) {
      try { return JSON.parse(localStorage.getItem(LS_KEY)) || DEFAULT_TOPICS } catch { return DEFAULT_TOPICS }
    }
    return DEFAULT_TOPICS
  })
  const [loaded, setLoaded] = useState(MOCK)

  // Load saved topics from Firestore
  useEffect(() => {
    if (MOCK) return
    if (!user) return
    const prefRef = doc(db, 'userPrefs', user.uid)
    getDoc(prefRef).then(snap => {
      const saved = snap.data()?.newsTopics
      if (saved?.length) setTopics(saved)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [user])

  const updateTopics = useCallback(async (newTopics) => {
    setTopics(newTopics)
    if (MOCK) {
      localStorage.setItem(LS_KEY, JSON.stringify(newTopics))
    } else if (user) {
      await setDoc(doc(db, 'userPrefs', user.uid), { newsTopics: newTopics }, { merge: true })
    }
  }, [user])

  return { topics, loaded, updateTopics }
}
