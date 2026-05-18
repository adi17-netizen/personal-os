import { useState } from 'react'
import { Sparkles } from 'lucide-react'

export default function AskAI({ inputRef }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) {
      window.open('https://gemini.google.com/app', '_blank')
      return
    }
    window.open(`https://gemini.google.com/app?q=${encodeURIComponent(q)}`, '_blank')
    setQuery('')
  }

  return (
    <form onSubmit={handleSubmit} className="h-full flex items-center px-3 gap-2">
      <Sparkles size={14} className="text-accent shrink-0" />
      <input
        ref={inputRef}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Ask Gemini… ( a )"
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: 'var(--theme-text-1)' }}
      />
    </form>
  )
}
