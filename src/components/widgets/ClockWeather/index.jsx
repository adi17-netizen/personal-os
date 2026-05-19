import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'

/* ─── Time-of-day icons ──────────────────────────────────────────────────── */

function SunIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="10" fill="#FFB800" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const r = Math.PI * deg / 180
        return <line key={i} x1={26+14*Math.cos(r)} y1={26+14*Math.sin(r)} x2={26+20*Math.cos(r)} y2={26+20*Math.sin(r)} stroke="#FFB800" strokeWidth="2.5" strokeLinecap="round" />
      })}
    </svg>
  )
}

function MoonIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <path d="M35 30.5A13 13 0 0 1 21.5 17a13.1 13.1 0 0 1 .9-4.8A14 14 0 1 0 39.8 29.6a13.1 13.1 0 0 1-4.8.9z" fill="#C9B458" opacity="0.85" />
    </svg>
  )
}

function TimeIcon({ size }) {
  const h = new Date().getHours()
  return (h >= 6 && h < 18) ? <SunIcon size={size} /> : <MoonIcon size={size} />
}

/* ─── Responsive size tiers ──────────────────────────────────────────────── */

const TIERS = {
  lg: { clock: 30, sec: 18, date: 12, city: 13, icon: 36, gap: 16, pad: 16, igap: 8 },
  md: { clock: 24, sec: 14, date: 11, city: 12, icon: 28, gap: 12, pad: 12, igap: 6 },
  sm: { clock: 20, sec: 12, date: 10, city: 11, icon: 22, gap: 8,  pad: 8,  igap: 5 },
}

function useSizeTier(ref) {
  const [tier, setTier] = useState('lg')
  const timerRef = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const w = entry.contentRect.width
        const next = w >= 380 ? 'lg' : w >= 280 ? 'md' : 'sm'
        setTier(t => t === next ? t : next)
      }, 80)
    })
    ro.observe(el)
    return () => { ro.disconnect(); clearTimeout(timerRef.current) }
  }, [ref])
  return tier
}

/* ─── Widget ──────────────────────────────────────────────────────────────── */

export default function ClockWeather() {
  const [now, setNow] = useState(new Date())
  const containerRef = useRef(null)
  const tier = useSizeTier(containerRef)
  const s = TIERS[tier]

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-full flex items-center justify-center py-2 overflow-hidden"
      style={{ gap: s.gap, paddingLeft: s.pad, paddingRight: s.pad }}
    >
      {/* Left — Clock */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="font-mono leading-none" style={{ color: 'var(--theme-text-1)' }}>
          <span className="font-semibold tracking-tight" style={{ fontSize: s.clock }}>{format(now, 'HH:mm')}</span>
          <span className="font-normal ml-0.5" style={{ fontSize: s.sec, color: 'var(--theme-text-3)' }}>
            :{format(now, 'ss')}
          </span>
        </div>
        <div className="mt-1 truncate" style={{ fontSize: s.date, color: 'var(--theme-text-2)' }}>
          {format(now, 'EEEE, MMM d')}
        </div>
      </div>

      {/* Divider */}
      <div className="self-stretch w-px shrink-0 my-3" style={{ background: 'var(--theme-card-border)' }} />

      {/* Right — Weather launcher */}
      <a
        href="https://www.google.com/search?q=weather+mumbai"
        target="_blank"
        rel="noreferrer"
        className="flex items-center min-w-0 hover:opacity-70 transition-opacity"
        style={{ gap: s.igap }}
      >
        <div className="shrink-0" style={{ color: 'var(--theme-text-2)' }}>
          <TimeIcon size={s.icon} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium" style={{ fontSize: s.city, color: 'var(--theme-text-1)' }}>
            Mumbai
          </span>
          <span className="flex items-center gap-1" style={{ fontSize: s.date, color: `rgb(var(--color-accent))` }}>
            Weather <ExternalLink size={s.date - 1} />
          </span>
        </div>
      </a>
    </div>
  )
}
