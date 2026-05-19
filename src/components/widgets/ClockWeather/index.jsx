import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'

/* ─── SVG Weather Icons ──────────────────────────────────────────────────── */

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

function CloudIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <path d="M38 34H16a8 8 0 1 1 2.4-15.6A10 10 0 0 1 36 24a6 6 0 0 1 2 10z" fill="currentColor" opacity="0.3" />
      <path d="M36 33H14a7 7 0 1 1 2.1-13.7A9 9 0 0 1 33 24a5.5 5.5 0 0 1 3 9z" fill="currentColor" opacity="0.55" />
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

function MoonIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <path d="M35 30.5A13 13 0 0 1 21.5 17a13.1 13.1 0 0 1 .9-4.8A14 14 0 1 0 39.8 29.6a13.1 13.1 0 0 1-4.8.9z" fill="#C9B458" opacity="0.85" />
    </svg>
  )
}

/* ─── WMO weather code → icon + description ──────────────────────────────── */

function wmoToWeather(code, isDay) {
  if (code === 0)                          return { icon: isDay ? 'sun' : 'moon', desc: 'Clear' }
  if (code === 1)                          return { icon: isDay ? 'sun' : 'moon', desc: 'Mostly Clear' }
  if (code === 2)                          return { icon: 'partly-cloudy', desc: 'Partly Cloudy' }
  if (code === 3)                          return { icon: 'cloud', desc: 'Overcast' }
  if (code === 45 || code === 48)          return { icon: 'mist', desc: 'Foggy' }
  if (code >= 51 && code <= 57)            return { icon: 'rain', desc: 'Drizzle' }
  if (code >= 61 && code <= 67)            return { icon: 'rain', desc: 'Rainy' }
  if (code >= 71 && code <= 77)            return { icon: 'snow', desc: 'Snowy' }
  if (code >= 80 && code <= 82)            return { icon: 'rain', desc: 'Showers' }
  if (code >= 85 && code <= 86)            return { icon: 'snow', desc: 'Snow Showers' }
  if (code >= 95)                          return { icon: 'storm', desc: 'Thunderstorm' }
  return { icon: isDay ? 'sun' : 'moon', desc: 'Clear' }
}

function WeatherIcon({ type, size }) {
  const props = { size }
  switch (type) {
    case 'sun':           return <SunIcon {...props} />
    case 'moon':          return <MoonIcon {...props} />
    case 'partly-cloudy': return <PartlyCloudyIcon {...props} />
    case 'cloud':         return <CloudIcon {...props} />
    case 'rain':          return <RainIcon {...props} />
    case 'storm':         return <StormIcon {...props} />
    case 'snow':          return <SnowIcon {...props} />
    case 'mist':          return <MistIcon {...props} />
    default:              return <SunIcon {...props} />
  }
}

/* ─── Open-Meteo fetch (no API key needed) ───────────────────────────────── */

const MUMBAI_LAT = 19.076
const MUMBAI_LON = 72.8777

function useOpenMeteoWeather() {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${MUMBAI_LAT}&longitude=${MUMBAI_LON}&current=temperature_2m,weather_code,is_day&timezone=Asia/Kolkata`
    fetch(url, { signal: AbortSignal.timeout(6000) })
      .then(r => r.json())
      .then(data => {
        const c = data.current
        if (!c) return
        const isDay = c.is_day === 1
        const { icon, desc } = wmoToWeather(c.weather_code, isDay)
        setWeather({ temp: Math.round(c.temperature_2m), desc, icon })
      })
      .catch(() => {}) // silent fail — widget still shows city + link
  }, [])

  return weather
}

/* ─── Responsive size tiers ──────────────────────────────────────────────── */

const TIERS = {
  lg: { clock: 30, sec: 18, date: 12, temp: 22, city: 11, desc: 11, icon: 36, gap: 16, pad: 16, igap: 8 },
  md: { clock: 24, sec: 14, date: 11, temp: 18, city: 10, desc: 10, icon: 28, gap: 12, pad: 12, igap: 6 },
  sm: { clock: 20, sec: 12, date: 10, temp: 15, city: 9,  desc: 9,  icon: 22, gap: 8,  pad: 8,  igap: 5 },
}

function useSizeTier(ref) {
  const [tier, setTier] = useState('lg')
  const prevWidth = useRef(0)
  useEffect(() => {
    const el = ref.current
    // Observe the grid cell parent — its size is stable (set by react-grid-layout),
    // unlike the container whose content shifts when tier changes.
    const target = el?.parentElement ?? el
    if (!target) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      // Skip if width hasn't changed by at least 10px (prevents oscillation)
      if (Math.abs(w - prevWidth.current) < 10) return
      prevWidth.current = w
      const next = w >= 380 ? 'lg' : w >= 280 ? 'md' : 'sm'
      setTier(t => t === next ? t : next)
    })
    ro.observe(target)
    return () => ro.disconnect()
  }, [ref])
  return tier
}

/* ─── Widget ──────────────────────────────────────────────────────────────── */

/* Seconds-only ticker — isolated so the parent doesn't re-render every second */
function Seconds({ fontSize }) {
  const [ss, setSs] = useState(() => format(new Date(), 'ss'))
  useEffect(() => {
    const id = setInterval(() => setSs(format(new Date(), 'ss')), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono font-normal ml-0.5" style={{ fontSize, color: 'var(--theme-text-3)' }}>
      :{ss}
    </span>
  )
}

export default function ClockWeather() {
  const [now, setNow] = useState(new Date())
  const containerRef = useRef(null)
  const tier = useSizeTier(containerRef)
  const s = TIERS[tier]
  const weather = useOpenMeteoWeather()

  // Update HH:mm + date once per minute, synced to the minute boundary
  useEffect(() => {
    let intervalId = null
    const msToNextMin = (60 - new Date().getSeconds()) * 1000
    const timeout = setTimeout(() => {
      setNow(new Date())
      intervalId = setInterval(() => setNow(new Date()), 60_000)
    }, msToNextMin)
    return () => { clearTimeout(timeout); if (intervalId) clearInterval(intervalId) }
  }, [])

  const isDay = now.getHours() >= 6 && now.getHours() < 18
  const iconType = weather?.icon ?? (isDay ? 'sun' : 'moon')

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
          <Seconds fontSize={s.sec} />
        </div>
        <div className="mt-1 truncate" style={{ fontSize: s.date, color: 'var(--theme-text-2)' }}>
          {format(now, 'EEEE, MMM d')}
        </div>
      </div>

      {/* Divider */}
      <div className="self-stretch w-px shrink-0 my-3" style={{ background: 'var(--theme-card-border)' }} />

      {/* Right — Weather */}
      <a
        href="https://www.google.com/search?q=weather+mumbai"
        target="_blank"
        rel="noreferrer"
        className="flex items-center min-w-0 hover:opacity-70 transition-opacity"
        style={{ gap: s.igap }}
      >
        <div className="shrink-0" style={{ color: 'var(--theme-text-2)' }}>
          <WeatherIcon type={iconType} size={s.icon} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold leading-tight" style={{ fontSize: s.temp, color: 'var(--theme-text-1)' }}>
              {weather ? `${weather.temp}°` : '—'}
            </span>
            <span className="truncate" style={{ fontSize: s.city, color: 'var(--theme-text-3)' }}>
              Mumbai
            </span>
          </span>
          <span className="truncate" style={{ fontSize: s.desc, color: 'var(--theme-text-2)' }}>
            {weather?.desc ?? '...'}
          </span>
          <span className="flex items-center gap-0.5" style={{ fontSize: s.desc - 1, color: `rgb(var(--color-accent))` }}>
            Details <ExternalLink size={s.desc - 2} />
          </span>
        </div>
      </a>
    </div>
  )
}
