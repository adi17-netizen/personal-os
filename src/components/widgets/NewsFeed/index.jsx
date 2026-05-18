import { useState } from 'react'
import { Newspaper, Settings, X, Plus } from 'lucide-react'
import { useNewsFeed } from '../../../hooks/useNewsFeed'
import SkeletonList from '../../layout/SkeletonList'
import ErrorState from '../../layout/ErrorState'
import EmptyState from '../../layout/EmptyState'
import NewsItem from './NewsItem'

export default function NewsFeed() {
  const { articles, topics, status, error, retry, updateTopics } = useNewsFeed()
  const [editingTopics, setEditingTopics] = useState(false)
  const [newTopic, setNewTopic] = useState('')

  const addTopic = () => {
    const t = newTopic.trim()
    if (!t || topics.includes(t)) return
    updateTopics([...topics, t])
    setNewTopic('')
  }

  const removeTopic = (topic) => {
    updateTopics(topics.filter(t => t !== topic))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 shrink-0">
        <div className="flex gap-1 flex-wrap">
          {topics.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'var(--theme-text-1)', background: 'rgba(var(--color-border) / 0.4)' }}>{t}</span>
          ))}
        </div>
        <button
          onClick={() => setEditingTopics(p => !p)}
          className="hover:opacity-60 transition-opacity ml-2 shrink-0"
          style={{ color: 'var(--theme-text-2)' }}
        >
          <Settings size={13} />
        </button>
      </div>

      {editingTopics && (
        <div className="px-4 py-2 border-b border-border/40 bg-background/40 shrink-0">
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
              placeholder="Add topic…"
              className="flex-1 rounded px-2 py-1 text-xs outline-none"
              style={{ background: 'rgba(var(--color-border) / 0.3)', color: 'var(--theme-text-1)', '--tw-placeholder-color': 'var(--theme-text-3)' }}
            />
            <button onClick={addTopic} className="text-accent hover:text-white transition-colors">
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto min-h-0 px-4">
        {status === 'loading' && <SkeletonList rows={5} />}
        {status === 'error' && <ErrorState message={error} onRetry={retry} />}
        {status === 'empty' && <EmptyState icon={Newspaper} message="No news found for these topics." />}
        {status === 'success' && articles.map((article, i) => (
          <NewsItem key={`${article.link}-${i}`} article={article} />
        ))}
      </div>
    </div>
  )
}
