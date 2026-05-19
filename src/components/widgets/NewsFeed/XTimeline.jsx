import { useEffect, useRef } from 'react'

let scriptLoading = null
function loadTwitterScript() {
  if (window.twttr?.widgets) return Promise.resolve(window.twttr)
  if (scriptLoading) return scriptLoading
  scriptLoading = new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://platform.twitter.com/widgets.js'
    s.async = true
    s.charset = 'utf-8'
    s.onload = () => resolve(window.twttr)
    document.head.appendChild(s)
  })
  return scriptLoading
}

export default function XTimeline({ handle }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!handle) return
    let cancelled = false
    const el = containerRef.current
    if (el) el.innerHTML = ''

    loadTwitterScript().then(twttr => {
      if (cancelled || !el || !twttr) return
      twttr.widgets.createTimeline(
        { sourceType: 'profile', screenName: handle.replace(/^@/, '') },
        el,
        {
          theme: 'dark',
          chrome: 'noheader nofooter noborders transparent',
          dnt: true,
        }
      )
    })

    return () => { cancelled = true }
  }, [handle])

  if (!handle) {
    return (
      <p className="text-sm p-3" style={{ color: 'var(--theme-text-3)' }}>
        Add an X handle in settings (⚙).
      </p>
    )
  }

  return <div ref={containerRef} className="px-2 py-1" />
}
