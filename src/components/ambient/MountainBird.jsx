import { useEffect, useState } from 'react'

function BirdSVG() {
  return (
    <svg viewBox="0 0 12 8" width="72" height="48" style={{ imageRendering: 'pixelated' }}>
      {/* tail */}
      <rect x="0"   y="3.5" width="2" height="1.5" rx="0.3" fill="#3d9988" />
      <rect x="0.5" y="5"   width="1" height="1"   rx="0.2" fill="#2d7a68" />

      {/* body */}
      <rect x="2" y="2.5" width="6" height="3.5" rx="0.8" fill="#5ab9a8" />
      {/* belly */}
      <rect x="3" y="3.5" width="4" height="2"   rx="0.5" fill="#a8e4dc" />

      {/* head */}
      <rect x="7" y="1" width="4" height="3.5" rx="0.8" fill="#5ab9a8" />
      {/* crest (top of head) */}
      <rect x="8"   y="0"   width="1" height="1.5" rx="0.3" fill="#3d9988" />
      <rect x="9"   y="0.5" width="1" height="1"   rx="0.3" fill="#3d9988" />

      {/* beak */}
      <rect x="11" y="2.5" width="1.5" height="0.8" rx="0.2" fill="#e8c46a" />
      <rect x="11" y="3.1" width="1.2" height="0.6" rx="0.2" fill="#c9a040" />

      {/* eye */}
      <rect x="9"   y="1.5" width="1.5" height="1.5" rx="0.4" fill="white" />
      <rect x="9.4" y="1.8" width="0.8" height="0.8" rx="0.2" fill="#0d1f2d" />
      <rect x="9.4" y="1.8" width="0.3" height="0.3" fill="white" opacity="0.9" />

      {/* wing upper — flaps */}
      <g style={{ transformOrigin: '5px 3px', animation: 'wing-up 0.5s ease-in-out infinite' }}>
        <rect x="2.5" y="1" width="5"  height="2.5" rx="0.5" fill="#4aa898" />
        <rect x="3"   y="0.5" width="3.5" height="1" rx="0.3" fill="#3d9080" />
      </g>

      {/* wing lower (trailing edge) */}
      <g style={{ transformOrigin: '5px 4px', animation: 'wing-down 0.5s ease-in-out infinite' }}>
        <rect x="2" y="4.5" width="4" height="1.5" rx="0.4" fill="#3d9988" />
      </g>
    </svg>
  )
}

// Also add a mountain silhouette that appears behind the grid
function MountainSilhouette() {
  return (
    <svg
      viewBox="0 0 1440 200"
      preserveAspectRatio="xMidYMax meet"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        pointerEvents: 'none',
        zIndex: 2,
        opacity: 0.35,
        animation: 'silhouette-in 1.5s ease-out forwards',
      }}
    >
      <path
        d="M0,200 L0,140 L120,60 L240,120 L360,20 L480,100 L600,40 L720,130 L840,30 L960,110 L1080,50 L1200,130 L1320,70 L1440,120 L1440,200 Z"
        fill="#122b22"
      />
      <path
        d="M0,200 L0,160 L180,100 L300,150 L450,80 L580,145 L720,90 L860,150 L980,85 L1100,145 L1260,95 L1440,150 L1440,200 Z"
        fill="#0a1a14"
      />
      {/* snow caps */}
      <path d="M360,20 L340,50 L380,50 Z" fill="rgba(200,230,240,0.6)" />
      <path d="M840,30 L820,58 L860,58 Z" fill="rgba(200,230,240,0.6)" />
      <path d="M600,40 L585,65 L615,65 Z" fill="rgba(200,230,240,0.5)" />
      <path d="M1080,50 L1065,75 L1095,75 Z" fill="rgba(200,230,240,0.5)" />
    </svg>
  )
}

export default function MountainBird() {
  const [pass, setPass] = useState(0)

  // Re-trigger the fly-across animation every 18s
  useEffect(() => {
    const id = setInterval(() => setPass(p => p + 1), 18000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <MountainSilhouette />
      <div
        key={pass}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 5,
          animation: 'bird-fly 10s ease-in-out forwards',
          filter: 'drop-shadow(0 3px 8px rgba(90,185,168,0.5))',
        }}
      >
        <BirdSVG />
      </div>
    </>
  )
}
