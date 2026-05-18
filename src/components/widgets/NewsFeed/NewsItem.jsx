import { formatDistanceToNow, isValid } from 'date-fns'

export default function NewsItem({ article }) {
  const pubDate = (() => {
    try {
      const d = new Date(article.pubDate)
      return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : ''
    } catch {
      return ''
    }
  })()

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col gap-0.5 py-2.5 border-b border-border/40 last:border-0 hover:bg-white/3 px-1 rounded transition-colors"
    >
      <p className="text-sm leading-snug line-clamp-2" style={{ color: 'var(--theme-text-1)' }}>{article.title}</p>
      <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--theme-text-2)' }}>
        {article.source && <span>{article.source}</span>}
        {pubDate && <span>{pubDate}</span>}
      </div>
    </a>
  )
}
