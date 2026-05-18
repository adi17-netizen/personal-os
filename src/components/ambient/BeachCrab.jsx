// Cute pixel-art crab that scuttles sideways along the bottom of the viewport

function CrabSVG() {
  return (
    <svg viewBox="0 0 14 10" width="84" height="60" style={{ imageRendering: 'pixelated' }}>
      {/* body */}
      <rect x="3"  y="3" width="8"  height="5" rx="1" fill="#e07b39" />
      <rect x="4"  y="4" width="6"  height="3" rx="0.5" fill="#c85e22" />
      {/* shell dots */}
      <rect x="5"  y="4.5" width="1" height="1" rx="0.2" fill="#e07b39" opacity="0.6" />
      <rect x="7"  y="4.5" width="1" height="1" rx="0.2" fill="#e07b39" opacity="0.6" />
      <rect x="6"  y="5.5" width="1" height="1" rx="0.2" fill="#e07b39" opacity="0.6" />

      {/* eye stalks */}
      <rect x="4"  y="1.5" width="1"   height="2" rx="0.3" fill="#e07b39" />
      <rect x="9"  y="1.5" width="1"   height="2" rx="0.3" fill="#e07b39" />
      {/* eyes */}
      <rect x="3.2" y="0.5" width="2" height="2" rx="0.5" fill="white" />
      <rect x="8.8" y="0.5" width="2" height="2" rx="0.5" fill="white" />
      <rect x="3.8" y="0.9" width="1" height="1" rx="0.2" fill="#1a0a00" />
      <rect x="9.4" y="0.9" width="1" height="1" rx="0.2" fill="#1a0a00" />
      {/* eye shine */}
      <rect x="4.0" y="0.9" width="0.4" height="0.4" fill="white" opacity="0.9" />
      <rect x="9.6" y="0.9" width="0.4" height="0.4" fill="white" opacity="0.9" />

      {/* left claw — snaps via CSS animation */}
      <g style={{ transformOrigin: '3px 4px', animation: 'claw-snap 5s ease-in-out infinite' }}>
        <rect x="0.5" y="2.5" width="3" height="2"   rx="0.5" fill="#e07b39" />
        <rect x="0"   y="1.5" width="2" height="1.5" rx="0.4" fill="#c85e22" />
      </g>
      {/* right claw */}
      <g style={{ transformOrigin: '11px 4px', animation: 'claw-snap 5s ease-in-out infinite 0.6s', transform: 'scaleX(-1)' }}>
        <rect x="0.5" y="2.5" width="3" height="2"   rx="0.5" fill="#e07b39" />
        <rect x="0"   y="1.5" width="2" height="1.5" rx="0.4" fill="#c85e22" />
      </g>

      {/* legs left (3 pairs) */}
      <rect x="3.5" y="7"   width="0.7" height="2.5" rx="0.3" fill="#c85e22" transform="rotate(-15 3.5 7)" />
      <rect x="4.5" y="7.5" width="0.7" height="2"   rx="0.3" fill="#c85e22" transform="rotate(-8 4.5 7.5)" />
      <rect x="5.5" y="7.5" width="0.7" height="2"   rx="0.3" fill="#c85e22" transform="rotate(0 5.5 7.5)" />
      {/* legs right */}
      <rect x="9.8"  y="7"   width="0.7" height="2.5" rx="0.3" fill="#c85e22" transform="rotate(15 9.8 7)" />
      <rect x="8.8"  y="7.5" width="0.7" height="2"   rx="0.3" fill="#c85e22" transform="rotate(8 8.8 7.5)" />
      <rect x="7.8"  y="7.5" width="0.7" height="2"   rx="0.3" fill="#c85e22" transform="rotate(0 7.8 7.5)" />
    </svg>
  )
}

export default function BeachCrab() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 4,
        animation: 'crab-walk 28s linear infinite, crab-bob 1.2s ease-in-out infinite',
        filter: 'drop-shadow(0 4px 8px rgba(160, 80, 20, 0.4))',
      }}
    >
      <CrabSVG />
    </div>
  )
}
