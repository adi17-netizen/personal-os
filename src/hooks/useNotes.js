import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { fetchGoogle, TokenExpiredError } from '../lib/googleApi'
import { debounce } from '../lib/widgetHelpers'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'
const MOCK_NOTES_KEY = 'personal-os-notes'

function parseDocContent(docData) {
  if (!docData?.body?.content) return ''
  return docData.body.content
    .filter(el => el.paragraph)
    .flatMap(el => el.paragraph.elements ?? [])
    .map(el => el.textRun?.content ?? '')
    .join('')
    .replace(/\n$/, '')
}

export function useNotes() {
  const { user } = useAuth()
  const [content, setContent] = useState(
    MOCK ? (localStorage.getItem(MOCK_NOTES_KEY) ?? '') : ''
  )
  const [docId, setDocId] = useState(null)
  const [status, setStatus] = useState(MOCK ? 'success' : 'loading')
  const [error, setError] = useState(null)
  const [saveState, setSaveState] = useState('saved')

  const saveRef = useRef(null)
  if (!saveRef.current) {
    if (MOCK) {
      saveRef.current = debounce((_, text) => {
        localStorage.setItem(MOCK_NOTES_KEY, text)
        setSaveState('saved')
      }, 800)
    } else {
      saveRef.current = debounce(async (currentDocId, text) => {
        setSaveState('saving')
        try {
          const docData = await fetchGoogle(`https://docs.googleapis.com/v1/documents/${currentDocId}`)
          const endIndex = docData.body.content.at(-1)?.endIndex ?? 1
          const requests = []
          if (endIndex > 1) {
            requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } } })
          }
          if (text) {
            requests.push({ insertText: { location: { index: 1 }, text } })
          }
          if (requests.length > 0) {
            await fetchGoogle(`https://docs.googleapis.com/v1/documents/${currentDocId}:batchUpdate`, {
              method: 'POST',
              body: JSON.stringify({ requests }),
            })
          }
          setSaveState('saved')
        } catch {
          setSaveState('error')
        }
      }, 1500)
    }
  }

  useEffect(() => {
    if (MOCK || !user) return
    let cancelled = false

    async function init() {
      setStatus('loading')
      try {
        const prefRef = doc(db, 'userPrefs', user.uid)
        const prefSnap = await getDoc(prefRef)
        let id = prefSnap.data()?.notesDocId

        if (!id) {
          const file = await fetchGoogle('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            body: JSON.stringify({
              name: 'Personal OS Notes',
              mimeType: 'application/vnd.google-apps.document',
            }),
          })
          id = file.id
          await setDoc(prefRef, { notesDocId: id }, { merge: true })
        }

        const docData = await fetchGoogle(`https://docs.googleapis.com/v1/documents/${id}`)
        if (!cancelled) {
          setDocId(id)
          setContent(parseDocContent(docData))
          setStatus('success')
        }
      } catch (e) {
        if (!cancelled) {
          setError({ type: e instanceof TokenExpiredError ? 'token' : 'api', message: e.message })
          setStatus('error')
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [user])

  const handleChange = useCallback((text) => {
    setContent(text)
    setSaveState('saving')
    saveRef.current(MOCK ? 'mock' : docId, text)
  }, [docId])

  return { content, handleChange, status, error, saveState }
}
