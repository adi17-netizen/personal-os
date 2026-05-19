import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'
import { DEFAULT_LAYOUT } from '../constants/defaultLayout'
import { debounce } from '../lib/widgetHelpers'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const LS_KEY = 'personal-os-layout'

// Bump this whenever the default layout changes significantly.
// Any saved layout with a different version is automatically discarded
// and replaced with DEFAULT_LAYOUT — fixes corrupted/stale positions.
const LAYOUT_VERSION = 9

function isValidLayout(layout) {
  // Must be an array of objects with i, x, y, w, h
  return (
    Array.isArray(layout) &&
    layout.length > 0 &&
    layout.every(item => typeof item.i === 'string' && typeof item.x === 'number')
  )
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_LAYOUT

    const parsed = JSON.parse(raw)

    // Support both versioned { version, layout } and legacy plain arrays
    const version = parsed?.version
    const layout = parsed?.layout ?? parsed

    if (version !== LAYOUT_VERSION || !isValidLayout(layout)) {
      // Stale or corrupt — wipe and start fresh
      localStorage.removeItem(LS_KEY)
      return DEFAULT_LAYOUT
    }

    // Merge in any widgets added since the layout was saved
    const savedIds = new Set(layout.map(i => i.i))
    const newWidgets = DEFAULT_LAYOUT.filter(i => !savedIds.has(i.i))
    return [...layout, ...newWidgets]
  } catch {
    return DEFAULT_LAYOUT
  }
}

const GridContext = createContext(null)

export function GridProvider({ children }) {
  const { user } = useAuth()
  const [layout, setLayout] = useState(MOCK ? loadFromLocalStorage() : DEFAULT_LAYOUT)
  const [loaded, setLoaded] = useState(MOCK)

  useEffect(() => {
    if (MOCK || !user) return
    const ref = doc(db, 'layouts', user.uid)
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        const version = data.version
        const saved = data.layout

        if (version !== LAYOUT_VERSION || !isValidLayout(saved)) {
          // Stale Firestore layout — reset to default
          setDoc(ref, { version: LAYOUT_VERSION, layout: DEFAULT_LAYOUT }).catch(console.error)
          setLayout(DEFAULT_LAYOUT)
        } else {
          const savedIds = new Set(saved.map(i => i.i))
          const newWidgets = DEFAULT_LAYOUT.filter(i => !savedIds.has(i.i))
          setLayout([...saved, ...newWidgets])
        }
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [user])

  const saveRef = useRef(null)
  if (!saveRef.current) {
    saveRef.current = debounce((uid, newLayout) => {
      if (MOCK) {
        localStorage.setItem(LS_KEY, JSON.stringify({ version: LAYOUT_VERSION, layout: newLayout }))
      } else {
        setDoc(doc(db, 'layouts', uid), { version: LAYOUT_VERSION, layout: newLayout }).catch(console.error)
      }
    }, 1000)
  }

  // Only persist the LG layout — prevents MD breakpoint positions from
  // corrupting the saved layout when the window is resized
  const onLayoutChange = useCallback((currentLayout, allLayouts) => {
    const lgLayout = allLayouts?.lg ?? currentLayout
    setLayout(lgLayout)
    saveRef.current(user?.uid ?? 'mock', lgLayout)
  }, [user])

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT)
    if (MOCK) {
      localStorage.removeItem(LS_KEY)
    } else if (user) {
      setDoc(doc(db, 'layouts', user.uid), { version: LAYOUT_VERSION, layout: DEFAULT_LAYOUT }).catch(console.error)
    }
  }, [user])

  return (
    <GridContext.Provider value={{ layout, onLayoutChange, loaded, resetLayout }}>
      {children}
    </GridContext.Provider>
  )
}

export function useGrid() {
  const ctx = useContext(GridContext)
  if (!ctx) throw new Error('useGrid must be used inside GridProvider')
  return ctx
}
