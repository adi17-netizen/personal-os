import { useState, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../contexts/AuthContext'
import { tokenStore } from '../../../lib/tokenStore'
import { Link, File, FolderOpen, Check, AlertCircle, Upload } from 'lucide-react'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const LS_KEY_FOLDER  = 'personal-os-drive-folder'
const LS_KEY_HISTORY = 'personal-os-saved-items'

// ── Drive helpers ──────────────────────────────────────────────────────────

async function getOrCreateFolder(uid) {
  if (MOCK) return localStorage.getItem(LS_KEY_FOLDER) || 'mock-folder-id'

  const prefRef = doc(db, 'userPrefs', uid)
  const snap    = await getDoc(prefRef)
  let folderId  = snap.data()?.savedFolderId

  if (!folderId) {
    const token = tokenStore.get()
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Personal OS — Saved',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    })
    if (!res.ok) throw new Error(`Drive ${res.status}`)
    const folder = await res.json()
    folderId = folder.id
    await setDoc(prefRef, { savedFolderId: folderId }, { merge: true })
  }
  return folderId
}

async function saveUrlToDrive(folderId, url, title) {
  if (MOCK) {
    return { id: `mock-${Date.now()}`, name: `${title || new URL(url).hostname}.url`, webViewLink: url }
  }
  const token    = tokenStore.get()
  const name     = (title || (() => { try { return new URL(url).hostname } catch { return url } })()) + '.url'
  const content  = `[InternetShortcut]\nURL=${url}`
  const boundary = 'drive_b_' + Date.now()
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({ name, parents: [folderId], mimeType: 'application/internet-shortcut' }),
    `--${boundary}`,
    'Content-Type: text/plain',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n')

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })
  if (!res.ok) throw new Error(`Drive ${res.status}`)
  return res.json()
}

async function uploadFileToDrive(folderId, file) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return { id: `mock-${Date.now()}`, name: file.name, webViewLink: '#' }
  }
  const token = tokenStore.get()
  const metadata = { name: file.name, parents: [folderId] }

  const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': file.type || 'application/octet-stream',
      'X-Upload-Content-Length': String(file.size),
    },
    body: JSON.stringify(metadata),
  })
  if (!initRes.ok) throw new Error(`Drive init ${initRes.status}`)
  const uploadUrl = initRes.headers.get('Location')

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  if (!uploadRes.ok) throw new Error(`Upload ${uploadRes.status}`)
  return uploadRes.json()
}

async function fetchTitle(url) {
  try {
    const res  = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(4000) })
    const { contents } = await res.json()
    const match = contents?.match(/<title[^>]*>([^<]*)<\/title>/i)
    return match?.[1]?.trim() ?? ''
  } catch { return '' }
}

// ── History persistence ────────────────────────────────────────────────────

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_KEY_HISTORY)) || [] } catch { return [] }
}
function addHistory(item) {
  const h = [item, ...loadHistory()].slice(0, 5)
  localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(h))
  return h
}

// ── Widget ─────────────────────────────────────────────────────────────────

export default function SaveLink() {
  const { user } = useAuth()
  const [input, setInput]     = useState('')
  const [state, setState]     = useState('idle')   // idle | saving | saved | error
  const [dragging, setDragging] = useState(false)
  const [history, setHistory] = useState(loadHistory)
  const [folderId, setFolderId] = useState(MOCK ? localStorage.getItem(LS_KEY_FOLDER) : null)
  const fileInputRef = useRef(null)

  const ensureFolder = useCallback(async () => {
    if (folderId) return folderId
    const id = await getOrCreateFolder(user?.uid)
    if (MOCK) localStorage.setItem(LS_KEY_FOLDER, id)
    setFolderId(id)
    return id
  }, [folderId, user])

  const saveUrl = useCallback(async (rawUrl) => {
    const url = rawUrl.trim()
    if (!url) return
    setState('saving')
    try {
      const fid   = await ensureFolder()
      const title = await fetchTitle(url)
      const file  = await saveUrlToDrive(fid, url, title)
      const h = addHistory({ id: file.id, name: file.name || title || url, type: 'url', url: file.webViewLink || url, savedAt: new Date().toISOString() })
      setHistory(h)
      setInput('')
      setState('saved')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }, [ensureFolder])

  const saveFile = useCallback(async (file) => {
    setState('saving')
    try {
      const fid  = await ensureFolder()
      const driveFile = await uploadFileToDrive(fid, file)
      const h = addHistory({ id: driveFile.id, name: driveFile.name, type: 'file', url: driveFile.webViewLink || '#', savedAt: new Date().toISOString() })
      setHistory(h)
      setState('saved')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }, [ensureFolder])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) { saveFile(files[0]); return }
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (url) saveUrl(url)
  }

  const handleSubmit = (e) => { e.preventDefault(); saveUrl(input) }

  const openFolder = () => {
    if (MOCK || !folderId) return alert('Open "Personal OS — Saved" in Google Drive.')
    window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank')
  }

  return (
    <div
      className="h-full flex flex-col"
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* URL input — always at top, compact */}
      <form onSubmit={handleSubmit} className="shrink-0 flex gap-1.5 px-2.5 pt-2 pb-1">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste a URL…"
          className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none min-w-0"
          style={{ background: 'rgba(var(--color-border) / 0.2)', color: 'var(--theme-text-1)', border: '0.5px solid var(--theme-card-border)' }}
          disabled={state === 'saving'}
        />
        <button
          type="submit"
          disabled={!input.trim() || state === 'saving'}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: `rgba(var(--color-accent) / 0.15)`, color: `rgb(var(--color-accent))` }}
        >
          Save
        </button>
      </form>

      {/* Drop zone — fills remaining space, always visible */}
      <div
        className="flex-1 mx-2.5 mb-1.5 rounded-xl flex flex-col items-center justify-center gap-1.5 px-3 transition-all min-h-0 relative overflow-hidden"
        style={{
          border: `1.5px dashed ${dragging ? `rgb(var(--color-accent))` : 'var(--theme-card-border)'}`,
          background: dragging ? `rgba(var(--color-accent) / 0.06)` : 'rgba(var(--color-border) / 0.04)',
        }}
      >
        {state === 'saving' ? (
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: `rgb(var(--color-accent))`, borderTopColor: 'transparent' }} />
            <span className="text-xs" style={{ color: 'var(--theme-text-2)' }}>Saving to Drive…</span>
          </div>
        ) : state === 'saved' ? (
          <div className="flex items-center gap-2">
            <Check size={14} className="text-green-400" />
            <span className="text-xs" style={{ color: 'var(--theme-text-2)' }}>Saved to Drive</span>
          </div>
        ) : state === 'error' ? (
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" />
            <span className="text-xs text-red-400">Save failed</span>
          </div>
        ) : (
          <>
            <Upload size={16} style={{ color: 'var(--theme-text-3)', opacity: 0.5 }} />
            <p className="text-[11px] text-center" style={{ color: 'var(--theme-text-3)' }}>
              Drop files or URLs here
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-lg hover:opacity-70 transition-opacity"
              style={{ background: 'rgba(var(--color-border) / 0.25)', color: 'var(--theme-text-2)', border: '0.5px solid var(--theme-card-border)' }}
            >
              Browse
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && saveFile(e.target.files[0])} />
          </>
        )}
      </div>

      {/* Footer — history + Drive link, compact row */}
      <div className="shrink-0 px-2.5 pb-2 flex items-center gap-2 min-h-0">
        {history.length > 0 ? (
          <a
            href={history[0].url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-70 transition-opacity"
          >
            <span style={{ color: 'var(--theme-text-3)', flexShrink: 0 }}>
              {history[0].type === 'url' ? <Link size={10} /> : <File size={10} />}
            </span>
            <span className="text-[11px] truncate" style={{ color: 'var(--theme-text-2)' }}>{history[0].name}</span>
          </a>
        ) : (
          <span className="text-[10px] flex-1" style={{ color: 'var(--theme-text-3)' }}>
            Saves to Google Drive
          </span>
        )}
        <button
          onClick={openFolder}
          className="flex items-center gap-1 text-[10px] hover:opacity-60 transition-opacity shrink-0"
          style={{ color: 'var(--theme-text-3)' }}
        >
          <FolderOpen size={10} />
          <span className="hidden sm:inline">Drive</span>
        </button>
      </div>
    </div>
  )
}
