import { useState } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({ inputRef }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`, '_blank')
    setQuery('')
  }

  return (
    <form onSubmit={handleSubmit} className="h-full flex items-center px-3 gap-2">
      <Search size={15} className="shrink-0" style={{ color: 'var(--theme-text-2)' }} />
      <input
        ref={inputRef}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search Google… ( / )"
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: 'var(--theme-text-1)' }}
      />
    </form>
  )
}
