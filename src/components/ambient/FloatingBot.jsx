import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

// Accent colors per theme (matches CSS vars)
const THEME_COLORS = {
  dark:     { body: '#6c8aff', shadow: '#4a68e0', eye: '#fff', pupil: '#1a1a2e' },
  beach:    { body: '#e07b39', shadow: '#b85e22', eye: '#fff', pupil: '#2d1b05' },
  mountain: { body: '#5ab9a8', shadow: '#3d9988', eye: '#e0f0f8', pupil: '#0d1f2d' },
}

function BotSVG({ colors }) {
  return (
    // Pixel-art style Claude bot, 8×10 grid scaled to 56×70
    <svg viewBox="0 0 8 10" width="56" height="70" style={{ imageRendering: 'pixelated' }}>
      {/* antenna */}
      <rect x="3.5" y="0" width="1" height="1" fill={colors.shadow} />
      <rect x="3" y="1" width="2" height="0.5" fill={colors.shadow} />

      {/* head */}
      <rect x="1" y="1.5" width="6" height="4" rx="0.3" fill={colors.body} />

      {/* eyes (blink handled by scaleY in CSS on this group) */}
      <g style={{ animation: 'blink 4s ease-in-out infinite', transformOrigin: '50% 3.2px' }}>
        <rect x="2" y="2.8" width="1.5" height="1.5" rx="0.2" fill={colors.eye} />
        <rect x="4.5" y="2.8" width="1.5" height="1.5" rx="0.2" fill={colors.eye} />
        <rect x="2.4" y="3.1" width="0.8" height="0.8" rx="0.1" fill={colors.pupil} />
        <rect x="4.9" y="3.1" width="0.8" height="0.8" rx="0.1" fill={colors.pupil} />
        {/* eye shine */}
        <rect x="2.6" y="3.0" width="0.3" height="0.3" fill="white" opacity="0.8" />
        <rect x="5.1" y="3.0" width="0.3" height="0.3" fill="white" opacity="0.8" />
      </g>

      {/* mouth */}
      <rect x="2.5" y="4.8" width="3" height="0.4" rx="0.2" fill={colors.shadow} />
      <rect x="3"   y="5.0" width="2" height="0.3" rx="0.1" fill={colors.eye} opacity="0.4" />

      {/* body */}
      <rect x="2" y="5.5" width="4" height="3" rx="0.3" fill={colors.shadow} />
      {/* chest light */}
      <rect x="3.2" y="6.3" width="1.6" height="1" rx="0.3" fill={colors.body} opacity="0.7" />

      {/* arms */}
      <rect x="0.5" y="5.5" width="1.5" height="2" rx="0.3" fill={colors.body} />
      <rect x="6"   y="5.5" width="1.5" height="2" rx="0.3" fill={colors.body} />

      {/* legs */}
      <rect x="2"   y="8.5" width="1.5" height="1.5" rx="0.2" fill={colors.body} />
      <rect x="4.5" y="8.5" width="1.5" height="1.5" rx="0.2" fill={colors.shadow} />
    </svg>
  )
}

export default function FloatingBot() {
  const { theme } = useTheme()
  const colors = THEME_COLORS[theme] ?? THEME_COLORS.dark
  const posRef = useRef({ x: 80, y: 80 })
  const targetRef = useRef({ x: 120, y: 120 })
  const [pos, setPos] = useState({ x: 80, y: 80 })
  const rafRef = useRef(null)

  // Pick new random target every 3-5s
  useEffect(() => {
    const pick = () => {
      targetRef.current = {
        x: 60 + Math.random() * (window.innerWidth  - 160),
        y: 60 + Math.random() * (window.innerHeight - 160),
      }
    }
    pick()
    const id = setInterval(pick, 3500 + Math.random() * 1500)
    return () => clearInterval(id)
  }, [])

  // Smooth lerp toward target at ~60fps
  useEffect(() => {
    const animate = () => {
      posRef.current = {
        x: posRef.current.x + (targetRef.current.x - posRef.current.x) * 0.015,
        y: posRef.current.y + (targetRef.current.y - posRef.current.y) * 0.015,
      }
      setPos({ ...posRef.current })
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const dx = targetRef.current.x - pos.x
  const flip = dx < -5 ? 'scaleX(-1)' : dx > 5 ? 'scaleX(1)' : undefined

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        pointerEvents: 'none',
        zIndex: 4,
        transition: 'filter 0.4s',
        animation: 'bot-float 6s ease-in-out infinite',
        filter: `drop-shadow(0 4px 12px rgba(${
          theme === 'beach'    ? '224,123,57' :
          theme === 'mountain' ? '90,185,168' :
                                 '108,138,255'
        }, 0.5))`,
        transform: flip,
        willChange: 'transform',
      }}
      title="👋 Hi! I'm your Personal OS bot"
    >
      <BotSVG colors={colors} />
    </div>
  )
}
