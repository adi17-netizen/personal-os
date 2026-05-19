import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import { useWeather, weatherApiCodeToIcon } from '../../../hooks/useWeather'

/* ─── Compact SVG Weather Icons ─────────────────────────────────────────── */

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

function CloudIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <path d="M38 34H16a8 8 0 1 1 2.4-15.6A10 10 0 0 1 36 24a6 6 0 0 1 2 10z" fill="currentColor" opacity="0.3" />
      <path d="M36 33H14a7 7 0 1 1 2.1-13.7A9 9 0 0 1 33 24a5.5 5.5 0 0 1 3 9z" fill="currentColor" opacity="0.55" />
    </svg>
  )
}

function PartlyCloudyIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <circle cx="20" cy="20" r="8" fill="#FFB800" opacity="0.9" />
      {[0,60,120,180,240,300].map((deg, i) => {
        const r = Math.PI * deg / 180
        return <line key={i} x1={20+11*Math.cos(r)} y1={20+11*Math.sin(r)} x2={20+15*Math.cos(r)} y2={20+15*Math.sin(r)} stroke="#FFB800" strokeWidth="2" strokeLinecap="round" />
      })}
      <path d="M40 38H22a7 7 0 1 1 2.1-13.7A9 9 0 0 1 37 30a5.5 5.5 0 0 1 3 8z" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

function RainIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <path d="M38 28H16a8 8 0 1 1 2.4-15.6A10 10 0 0 1 36 18a6 6 0 0 1 2 10z" fill="currentColor" opacity="0.45" />
      {[[20,34],[28,36],[36,34]].map(([x,y], i) => (
        <line key={i} x1={x} y1={y} x2={x-2} y2={y+5} stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      ))}
    </svg>
  )
}

function StormIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <path d="M38 28H16a8 8 0 1 1 2.4-15.6A10 10 0 0 1 36 18a6 6 0 0 1 2 10z" fill="currentColor" opacity="0.45" />
      <path d="M28 32l-5 8h4l-3 8 8-11h-5l4-5h-3z" fill="#FCD34D" />
    </svg>
  )
}

function SnowIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <path d="M38 28H16a8 8 0 1 1 2.4-15.6A10 10 0 0 1 36 18a6 6 0 0 1 2 10z" fill="currentColor" opacity="0.45" />
      {[[20,36],[28,38],[36,36]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="#BAE6FD" />
      ))}
    </svg>
  )
}

function MistIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      {[18, 24, 30, 36].map((y, i) => (
        <line key={i} x1={10} y1={y} x2={42} y2={y} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity={0.2 + i * 0.08} />
      ))}
    </svg>
  )
}

function WeatherIcon({ code, size = 36 }) {
  const c = code ?? '01d'
  if (c.startsWith('01')) return <SunIcon size={size} />
  if (c.startsWith('02') || c.startsWith('03')) return <PartlyCloudyIcon size={size} />
  if (c.startsWith('04')) return <CloudIcon size={size} />
  if (c.startsWith('09') || c.startsWith('10')) return <RainIcon size={size} />
  if (c.startsWith('11')) return <StormIcon size={size} />
  if (c.startsWith('13')) return <SnowIcon size={size} />
  return <MistIcon size={size} />
}

/* ─── Widget ──────────────────────────────────────────────────────────────── */

// Size tiers — everything scales together
const TIERS = {
  lg: { clock: 30, sec: 18, date: 12, temp: 24, label: 12, sub: 11, icon: 40, gap: 16, pad: 16, igap: 10 },
  md: { clock: 24, sec: 14, date: 11, temp: 20, label: 11, sub: 10, icon: 32, gap: 12, pad: 12, igap: 8 },
  sm: { clock: 20, sec: 12, date: 10, temp: 16, label: 10, sub: 9,  icon: 24, gap: 8,  pad: 8,  igap: 6 },
}

function useSizeTier(ref) {
  const [tier, setTier] = useState('lg')
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      setTier(w >= 380 ? 'lg' : w >= 280 ? 'md' : 'sm')
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return tier
}

export default function ClockWeather() {
  const [now, setNow] = useState(new Date())
  const { data, status, error, retry } = useWeather()
  const containerRef = useRef(null)
  const tier = useSizeTier(containerRef)
  const s = TIERS[tier]

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const current  = data?.current
  const forecast = data?.forecast
  const iconCode = current ? weatherApiCodeToIcon(current.iconCode) : null

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
      {status === 'success' && (
        <div className="self-stretch w-px shrink-0 my-3" style={{ background: 'var(--theme-card-border)' }} />
      )}

      {/* Right — Weather: icon + text */}
      <div className="min-w-0">
        {status === 'loading' && (
          <div className="flex flex-col gap-1.5">
            <div className="shimmer rounded h-3 w-16" />
            <div className="shimmer rounded h-5 w-10" />
            <div className="shimmer rounded h-3 w-24" />
          </div>
        )}
        {status === 'error' && (
          <button onClick={retry} className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
            style={{ color: 'var(--theme-text-3)' }}>
            <RefreshCw size={11} />
            Retry weather
          </button>
        )}
        {status === 'success' && (
          <div className="flex items-center min-w-0" style={{ gap: s.igap }}>
            {/* Weather icon */}
            <div className="shrink-0" style={{ color: 'var(--theme-text-2)' }}>
              <WeatherIcon code={iconCode} size={s.icon} />
            </div>

            {/* Text stack */}
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate" style={{ fontSize: s.label, color: 'var(--theme-text-2)' }}>
                {current?.name}
              </span>
              <span className="font-semibold leading-tight" style={{ fontSize: s.temp, color: 'var(--theme-text-1)' }}>
                {current?.temp}°
              </span>
              {forecast?.today?.description && (
                <span className="leading-snug truncate" style={{ fontSize: s.sub, color: 'var(--theme-text-3)' }}>
                  {forecast.today.description}
                </span>
              )}
              {forecast?.tomorrow && (
                <span className="leading-snug" style={{ fontSize: s.sub, color: 'var(--theme-text-3)' }}>
                  Tomorrow: {forecast.tomorrow.high}°
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
