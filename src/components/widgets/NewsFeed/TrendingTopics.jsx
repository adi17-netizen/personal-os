import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, ExternalLink, RefreshCw, Hash } from 'lucide-react'

const TRENDS_CACHE_KEY = 'personal-os-trends'
const TRENDS_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

function getCachedTrends() {
  try {
    const raw = localStorage.getItem(TRENDS_CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > TRENDS_CACHE_TTL) return null
    return data
  } catch { return null }
}

function setCachedTrends(data) {
  try {
    localStorage.setItem(TRENDS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

async function fetchTrends() {
  // Google Trends RSS — real-time, fetched fresh via allorigins (no caching)
  const rssUrl = 'https://trends.google.com/trending/rss?geo=IN'
  const proxyUrl = `https://allorigins.win/get?disableCache=true&url=${encodeURIComponent(rssUrl)}`
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`Trends fetch failed: ${res.status}`)
  const json = await res.json()
  const xml = new DOMParser().parseFromString(json.contents, 'text/xml')
  const items = [...xml.querySelectorAll('item')]
  return items.slice(0, 20).map(item => {
    const trafficEl = xml.createElementNS ? item.getElementsByTagNameNS('*', 'approx_traffic')[0] : null
    const traffic = trafficEl?.textContent || item.querySelector('ht\\:approx_traffic')?.textContent || ''
    return {
      title: item.querySelector('title')?.textContent || '',
      traffic: traffic ? `${traffic} searches` : '',
      link: item.querySelector('link')?.nextSibling?.textContent || item.querySelector('link')?.textContent || '',
      pubDate: item.querySelector('pubDate')?.textContent || '',
    }
  })
}

export default function TrendingTopics() {
  const [trends, setTrends] = useState(() => getCachedTrends() || [])
  const [status, setStatus] = useState(trends.length ? 'success' : 'loading')
  const [spinning, setSpinning] = useState(false)

  const load = useCallback(async () => {
    try {
      setStatus(prev => prev === 'success' ? 'success' : 'loading')
      const data = await fetchTrends()
      if (data.length) {
        setTrends(data)
        setCachedTrends(data)
        setStatus('success')
      } else {
        setStatus('empty')
      }
    } catch {
      if (!trends.length) setStatus('error')
    }
  }, [trends.length])

  useEffect(() => { load() }, [load])

  const handleRefresh = () => {
    setSpinning(true)
    load()
    setTimeout(() => setSpinning(false), 800)
  }

  if (status === 'loading') {
    return (
      <div className="px-3 py-2 space-y-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-5 h-5 rounded" style={{ background: 'rgba(var(--color-border) / 0.4)' }} />
            <div className="flex-1 h-3 rounded" style={{ background: 'rgba(var(--color-border) / 0.3)' }} />
          </div>
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <TrendingUp size={20} style={{ color: 'var(--theme-text-3)' }} />
        <p className="text-xs" style={{ color: 'var(--theme-text-3)' }}>Couldn't load trends</p>
        <button
          onClick={load}
          className="text-[11px] px-3 py-1 rounded-md"
          style={{ color: `rgb(var(--color-accent))`, background: `rgb(var(--color-accent) / 0.1)` }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={11} style={{ color: `rgb(var(--color-accent))` }} />
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-3)' }}>
            Trending Now
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="hover:opacity-60 transition-opacity"
          style={{ color: 'var(--theme-text-2)' }}
          title="Refresh trends"
        >
          <RefreshCw
            size={11}
            style={{
              transition: 'transform 0.8s ease',
              transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)',
            }}
          />
        </button>
      </div>

      {/* Trends list */}
      <div className="flex-1 overflow-auto min-h-0 px-3">
        {trends.map((trend, i) => (
          <a
            key={`${trend.title}-${i}`}
            href={trend.link || `https://trends.google.com/trending?q=${encodeURIComponent(trend.title)}&geo=IN`}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-2 py-1.5 border-b last:border-0 hover:opacity-70 transition-opacity group"
            style={{ borderColor: 'rgba(var(--color-border) / 0.25)' }}
          >
            <span className="shrink-0 mt-0.5">
              <Hash size={12} style={{ color: `rgb(var(--color-accent) / 0.5)` }} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] leading-snug line-clamp-1 font-medium" style={{ color: 'var(--theme-text-1)' }}>
                {trend.title}
              </p>
              {trend.traffic && (
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-3)' }}>
                  {trend.traffic}
                </p>
              )}
            </div>
            <ExternalLink
              size={10}
              className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--theme-text-3)' }}
            />
          </a>
        ))}
      </div>
    </div>
  )
}
