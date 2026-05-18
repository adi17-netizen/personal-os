import { X } from 'lucide-react'

export default function LinkCard({ link, onDelete }) {
  const domain = (() => {
    try { return new URL(link.url).hostname } catch { return '' }
  })()

  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    : null

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="group relative flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors text-center"
    >
      <div className="w-8 h-8 rounded-lg bg-border/60 flex items-center justify-center overflow-hidden">
        {faviconUrl ? (
          <img src={faviconUrl} alt="" className="w-5 h-5" onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <span className="text-xs font-medium" style={{ color: 'var(--theme-text-2)' }}>{link.title?.[0] ?? '?'}</span>
        )}
      </div>
      <span className="text-[11px] leading-tight max-w-[60px] truncate" style={{ color: 'var(--theme-text-1)' }}>{link.title}</span>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(link.id) }}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
        style={{ color: 'var(--theme-text-3)' }}
      >
        <X size={10} />
      </button>
    </a>
  )
}
