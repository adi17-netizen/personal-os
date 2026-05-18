function CrabSVG() {
  return (
    <svg viewBox="0 0 36 24" width="36" height="24" style={{ imageRendering: 'pixelated', overflow: 'visible' }}>
      {/* Left claw */}
      <g style={{ transformOrigin: '5px 10px', animation: 'claw-snap 3.2s ease-in-out infinite' }}>
        <rect x="0" y="8"  width="6" height="3" rx="1.5" fill="#e07050" />
        <rect x="0" y="5"  width="2" height="4" rx="1"   fill="#e07050" />
      </g>
      {/* Right claw */}
      <g style={{ transformOrigin: '31px 10px', animation: 'claw-snap 3.2s ease-in-out infinite 0.6s' }}>
        <rect x="30" y="8"  width="6" height="3" rx="1.5" fill="#e07050" />
        <rect x="34" y="5"  width="2" height="4" rx="1"   fill="#e07050" />
      </g>
      {/* Body */}
      <rect x="7"  y="7"  width="22" height="12" rx="4" fill="#f08060" />
      {/* Shell highlight */}
      <rect x="10" y="9"  width="16" height="4"  rx="2" fill="rgba(255,200,170,0.5)" />
      {/* Eyes */}
      <rect x="9"  y="5"  width="4"  height="5"  rx="1" fill="#f08060" />
      <rect x="23" y="5"  width="4"  height="5"  rx="1" fill="#f08060" />
      <rect x="10" y="6"  width="2"  height="2"  rx="0.5" fill="#111" />
      <rect x="24" y="6"  width="2"  height="2"  rx="0.5" fill="#111" />
      {/* Legs */}
      <rect x="8"  y="18" width="2"  height="5"  rx="1" fill="#e07050" style={{ animation: 'crab-bob 0.5s ease-in-out infinite' }} />
      <rect x="12" y="18" width="2"  height="5"  rx="1" fill="#e07050" style={{ animation: 'crab-bob 0.5s ease-in-out infinite 0.1s' }} />
      <rect x="16" y="18" width="2"  height="5"  rx="1" fill="#e07050" style={{ animation: 'crab-bob 0.5s ease-in-out infinite 0.2s' }} />
      <rect x="20" y="18" width="2"  height="5"  rx="1" fill="#e07050" style={{ animation: 'crab-bob 0.5s ease-in-out infinite 0.15s' }} />
      <rect x="24" y="18" width="2"  height="5"  rx="1" fill="#e07050" style={{ animation: 'crab-bob 0.5s ease-in-out infinite 0.05s' }} />
    </svg>
  )
}

export default function HeaderCrab() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 4,
        left: 0,
        pointerEvents: 'none',
        animation: 'header-walk-ltr 28s linear infinite',
        zIndex: 1,
      }}
    >
      <CrabSVG />
    </div>
  )
}
