import { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = [
  { id: 'beach',    label: 'Beach',    emoji: '🏖️', colors: ['#E8F0FE','#F5F0E8','#F0E4D0'] },
  { id: 'mountain', label: 'Mountain', emoji: '⛰️', colors: ['#050508','#0A0A0E','#0A84FF'] },
  { id: 'apple',    label: 'Apple',    emoji: '🍎', colors: ['#F5F5F7','#E8E8ED','#007AFF'] },
]

export const TEXT_SIZES = [
  { id: 'md', label: 'Default',     scale: 1    },
  { id: 'lg', label: 'Large',       scale: 1.15 },
  { id: 'xl', label: 'Extra Large', scale: 1.35 },
]

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('personal-os-theme')
    return ['beach', 'mountain', 'apple'].includes(saved) ? saved : 'beach'
  })

  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem('personal-os-textsize')
    return TEXT_SIZES.find(t => t.id === saved) ? saved : 'md'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('personal-os-theme', theme)
  }, [theme])

  useEffect(() => {
    const scale = TEXT_SIZES.find(t => t.id === textSize)?.scale ?? 1
    document.documentElement.style.setProperty('--font-scale', scale)
    localStorage.setItem('personal-os-textsize', textSize)
  }, [textSize])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, textSize, setTextSize }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
