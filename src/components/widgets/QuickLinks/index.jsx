import { useState, useEffect } from 'react'
import { Plus, Link } from 'lucide-react'
import {
  collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc
} from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../contexts/AuthContext'
import LinkCard from './LinkCard'
import EmptyState from '../../layout/EmptyState'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const LS_KEY = 'personal-os-links'

const DEFAULT_LINKS = [
  { id: 'l1', url: 'https://github.com', title: 'GitHub', order: 0 },
  { id: 'l2', url: 'https://linear.app', title: 'Linear', order: 1 },
  { id: 'l3', url: 'https://notion.so', title: 'Notion', order: 2 },
  { id: 'l4', url: 'https://figma.com', title: 'Figma', order: 3 },
]

function loadMockLinks() {
  try {
    const s = localStorage.getItem(LS_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  return DEFAULT_LINKS
}

function saveMockLinks(links) {
  localStorage.setItem(LS_KEY, JSON.stringify(links))
}

export default function QuickLinks() {
  const { user } = useAuth()
  const [links, setLinks] = useState(MOCK ? loadMockLinks() : [])
  const [showAdd, setShowAdd] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (MOCK || !user) return
    const q = query(collection(db, 'bookmarks', user.uid, 'links'), orderBy('order'))
    return onSnapshot(q, snap => {
      setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [user])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setAdding(true)
    try {
      let resolvedTitle = title.trim()
      if (!resolvedTitle) {
        try { resolvedTitle = new URL(url.trim()).hostname.replace('www.', '') }
        catch { resolvedTitle = url.trim() }
      }
      if (MOCK) {
        const newLink = { id: `l-${Date.now()}`, url: url.trim(), title: resolvedTitle, order: links.length }
        const updated = [...links, newLink]
        setLinks(updated)
        saveMockLinks(updated)
      } else {
        await addDoc(collection(db, 'bookmarks', user.uid, 'links'), {
          url: url.trim(), title: resolvedTitle, order: links.length,
        })
      }
      setUrl(''); setTitle(''); setShowAdd(false)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id) => {
    if (MOCK) {
      const updated = links.filter(l => l.id !== id)
      setLinks(updated)
      saveMockLinks(updated)
    } else {
      await deleteDoc(doc(db, 'bookmarks', user.uid, 'links', id))
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto min-h-0 p-3">
        {links.length === 0 && !showAdd && (
          <EmptyState icon={Link} message="Add your go-to links below." />
        )}
        <div className="flex flex-wrap gap-1">
          {links.map(link => (
            <LinkCard key={link.id} link={link} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/40">
        {showAdd ? (
          <form onSubmit={handleAdd} className="flex flex-col gap-2 p-3">
            <input
              autoFocus
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://…"
              className="rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ background: 'rgba(var(--color-border) / 0.3)', color: 'var(--theme-text-1)' }}
            />
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Label (optional)"
              className="rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ background: 'rgba(var(--color-border) / 0.3)', color: 'var(--theme-text-1)' }}
            />
            <div className="flex gap-2">
              <button type="submit" disabled={adding}
                className="flex-1 bg-accent/20 hover:bg-accent/30 text-accent text-xs py-1.5 rounded-lg transition-colors">
                {adding ? 'Adding…' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="flex-1 text-xs py-1.5 rounded-lg"
                style={{ background: 'rgba(var(--color-border) / 0.3)', color: 'var(--theme-text-2)' }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAdd(true)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs hover:opacity-60 transition-opacity"
            style={{ color: 'var(--theme-text-2)' }}>
            <Plus size={13} />
            Add link
          </button>
        )}
      </div>
    </div>
  )
}
