import { useState } from 'react'
import { Newspaper, Settings, X, Plus, ExternalLink, RefreshCw } from 'lucide-react'
import { formatDistanceToNow, isValid } from 'date-fns'
import { useNewsFeed } from '../../../hooks/useNewsFeed'
import SkeletonList from '../../layout/SkeletonList'
import ErrorState from '../../layout/ErrorState'
import EmptyState from '../../layout/EmptyState'

function timeAgo(dateStr) {
  try {
    const d = new Date(dateStr)
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : ''
  } catch { return '' }
}

// Google News RSS embeds source in title: "Headline - Source Name"
function parseArticle(article) {
  const title = article.title || ''
  const lastDash = title.lastIndexOf(' - ')
  if (lastDash > 0) {
    return {
      headline: title.slice(0, lastDash),
      source: title.slice(lastDash + 3),
      time: timeAgo(article.pubDate),
      link: article.link,
    }
  }
  return { headline: title, source: article.source || '', time: timeAgo(article.pubDate), link: article.link }
}

export default function NewsFeed() {
  const { articles, topics, status, error, retry, updateTopics, MAX_TOPICS } = useNewsFeed()
  const [spinning, setSpinning] = useState(false)
  const [editingTopics, setEditingTopics] = useState(false)
  const [newTopic, setNewTopic] = useState('')

  const handleRefresh = () => {
    setSpinning(true)
    retry()
    setTimeout(() => setSpinning(false), 800)
  }

  const addTopic = () => {
    const t = newTopic.trim()
    if (!t || topics.includes(t) || topics.length >= MAX_TOPICS) return
    updateTopics([...topics, t])
    setNewTopic('')
  }

  const removeTopic = (topic) => {
    updateTopics(topics.filter(t => t !== topic))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Topic chips + actions */}
      <div className="flex items-center px-3 py-1.5 border-b border-border/40 shrink-0">
        <div className="flex gap-1 flex-wrap flex-1 min-w-0">
          {topics.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full truncate" style={{ color: 'var(--theme-text-1)', background: 'rgba(var(--color-border) / 0.4)' }}>{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <button
            onClick={handleRefresh}
            className="hover:opacity-60 transition-opacity"
            style={{ color: 'var(--theme-text-2)' }}
            title="Refresh news"
          >
            <RefreshCw
              size={12}
              style={{
                transition: 'transform 0.8s ease',
                transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)',
              }}
            />
          </button>
          <button
            onClick={() => setEditingTopics(p => !p)}
            className="hover:opacity-60 transition-opacity"
            style={{ color: 'var(--theme-text-2)' }}
          >
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* Topic editor */}
      {editingTopics && (
        <div className="px-3 py-2 border-b border-border/40 shrink-0" style={{ background: 'rgba(var(--color-border) / 0.1)' }}>
          <div className="flex flex-wrap gap-1 mb-2">
            {topics.map(t => (
              <span key={t} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full" style={{ color: 'var(--theme-text-1)', background: 'rgba(var(--color-border) / 0.4)' }}>
                {t}
                <button onClick={() => removeTopic(t)} className="hover:text-red-400" style={{ color: 'var(--theme-text-3)' }}><X size={9} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTopic()}
              placeholder={topics.length >= MAX_TOPICS ? `Max ${MAX_TOPICS} topics` : 'Add topic…'}
              disabled={topics.length >= MAX_TOPICS}
              className="flex-1 rounded px-2 py-1 text-xs outline-none disabled:opacity-40"
              style={{ background: 'rgba(var(--color-border) / 0.3)', color: 'var(--theme-text-1)' }}
            />
            <button
              onClick={addTopic}
              disabled={topics.length >= MAX_TOPICS}
              className="hover:opacity-60 transition-opacity disabled:opacity-30"
              style={{ color: `rgb(var(--color-accent))` }}
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'var(--theme-text-3)' }}>
            {topics.length}/{MAX_TOPICS} topics · Refreshes every 30 min
          </p>
        </div>
      )}

      {/* Article list */}
      <div className="flex-1 overflow-auto min-h-0 px-3">
        {status === 'loading' && <div className="py-2"><SkeletonList rows={5} /></div>}
        {status === 'error' && <ErrorState message={error} onRetry={retry} />}
        {status === 'empty' && <EmptyState icon={Newspaper} message="No news found for these topics." />}
        {status === 'success' && articles.map((article, i) => {
          const { headline, source, time, link } = parseArticle(article)
          return (
            <a
              key={`${link}-${i}`}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col gap-0.5 py-2 border-b last:border-0 hover:opacity-70 transition-opacity"
              style={{ borderColor: 'rgba(var(--color-border) / 0.25)' }}
            >
              <div className="flex items-center gap-1.5">
                {source && (
                  <span className="text-[10px] font-semibold truncate" style={{ color: 'var(--theme-text-2)' }}>
                    {source}
                  </span>
                )}
                {time && (
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--theme-text-3)' }}>
                    · {time}
                  </span>
                )}
              </div>
              <p className="text-[13px] leading-snug line-clamp-2" style={{ color: 'var(--theme-text-1)' }}>
                {headline}
              </p>
            </a>
          )
        })}
      </div>

      {/* Footer */}
      {status === 'success' && (
        <div className="shrink-0 px-3 py-1.5" style={{ borderTop: '0.5px solid var(--theme-card-border)' }}>
          <a
            href={`https://news.google.com/search?q=${encodeURIComponent(topics.join(' OR '))}&hl=en-IN&gl=IN&ceid=IN:en`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1 text-[11px] font-medium py-1 rounded-md hover:opacity-70 transition-opacity"
            style={{ color: `rgb(var(--color-accent))` }}
          >
            Open in Google News <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  )
}
