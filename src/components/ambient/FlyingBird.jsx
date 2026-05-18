import { useEffect, useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

// Minecraft-style pixel bird — small, charming, clearly readable
function SeagullPixel() {
  return (
    <svg viewBox="0 0 20 12" width="40" height="24" style={{ imageRendering: 'pixelated' }}>
      {/* Wings flapping — left wing */}
      <rect x="0" y="4" width="7" height="2" rx="0.5" fill="#e8e8e8"
        style={{ transformOrigin: '7px 5px', animation: 'wing-flap 0.4s ease-in-out infinite' }} />
      {/* Body */}
      <rect x="7" y="3" width="6" height="3" rx="1" fill="#f0f0f0" />
      {/* Right wing */}
      <rect x="13" y="4" width="7" height="2" rx="0.5" fill="#e8e8e8"
        style={{ transformOrigin: '13px 5px', animation: 'wing-flap 0.4s ease-in-out infinite 0.2s' }} />
      {/* Head */}
      <rect x="12" y="2" width="4" height="3" rx="1" fill="#f5f5f5" />
      {/* Beak */}
      <rect x="16" y="3" width="3" height="1" rx="0.3" fill="#f0c060" />
      {/* Eye */}
      <rect x="13" y="2" width="1" height="1" rx="0.2" fill="#222" />
    </svg>
  )
}

function MountainPixelBird() {
  return (
    <svg viewBox="0 0 22 14" width="44" height="28" style={{ imageRendering: 'pixelated' }}>
      {/* Tail */}
      <rect x="0" y="6" width="5" height="2" rx="0.5" fill="#2a7a6a" />
      {/* Body */}
      <rect x="4" y="4" width="10" height="5" rx="1.5" fill="#3ab8a8" />
      {/* Belly highlight */}
      <rect x="6" y="6" width="5" height="2" rx="1" fill="#80dcd4" />
      {/* Wing */}
      <rect x="5" y="2" width="8" height="4" rx="1" fill="#2aa898"
        style={{ transformOrigin: '9px 5px', animation: 'wing-flap 0.4s ease-in-out infinite' }} />
      {/* Head */}
      <rect x="13" y="3" width="6" height="5" rx="1.5" fill="#3ab8a8" />
      {/* Crest */}
      <rect x="15" y="1" width="2" height="3" rx="1" fill="#2a7a6a" />
      {/* Eye */}
      <rect x="16" y="4" width="2" height="2" rx="0.5" fill="white" />
      <rect x="16" y="4" width="1" height="1" rx="0.2" fill="#111" />
      {/* Beak */}
      <rect x="19" y="5" width="3" height="1.5" rx="0.5" fill="#e8b84a" />
    </svg>
  )
}

export default function FlyingBird() {
  const { theme } = useTheme()
  const [pass, setPass] = useState(0)
  // Each pass picks a slightly different vertical position
  const yPercent = 8 + (pass % 5) * 4  // cycles between 8vh–24vh

  useEffect(() => {
    const id = setInterval(() => setPass(p => p + 1), 16000)
    return () => clearInterval(id)
  }, [])

  // Apple theme = pure negative space, no bird
  if (theme === 'apple') return null

  return (
    <div
      key={pass}
      style={{
        position: 'fixed',
        top: `${yPercent}vh`,
        left: 0,
        pointerEvents: 'none',
        zIndex: 5,
        animation: 'bird-fly-screen 13s cubic-bezier(0.4,0,0.6,1) forwards',
        filter: theme === 'beach'
          ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))'
          : 'drop-shadow(0 3px 8px rgba(90,185,168,0.4))',
      }}
    >
      {theme === 'beach' ? <SeagullPixel /> : <MountainPixelBird />}
    </div>
  )
}
