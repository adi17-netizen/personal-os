function BirdSVG() {
  return (
    <svg viewBox="0 0 38 28" width="38" height="28" style={{ imageRendering: 'pixelated', overflow: 'visible' }}>
      {/* Tail */}
      <rect x="0" y="13" width="6"  height="5" rx="1" fill="#2d8a7a" />
      <rect x="1" y="17" width="4"  height="3" rx="1" fill="#1d6a5a" />
      {/* Body */}
      <rect x="5" y="10" width="18" height="11" rx="3" fill="#3ab8a8" />
      {/* Belly */}
      <rect x="8" y="13" width="10" height="6"  rx="2" fill="#80dcd4" />
      {/* Wing flap */}
      <g style={{ transformOrigin: '12px 12px', animation: 'wing-flap 0.45s ease-in-out infinite' }}>
        <rect x="6"  y="6"  width="14" height="8" rx="2" fill="#2aa898" />
        <rect x="8"  y="4"  width="9"  height="4" rx="1.5" fill="#208878" />
      </g>
      {/* Head */}
      <rect x="21" y="7"  width="12" height="11" rx="3" fill="#3ab8a8" />
      {/* Crest */}
      <rect x="24" y="3"  width="3"  height="5" rx="1.5" fill="#2d8a7a" />
      <rect x="27" y="5"  width="2"  height="3" rx="1"   fill="#2d8a7a" />
      {/* Eye */}
      <rect x="27" y="9"  width="4"  height="4" rx="1"   fill="white" />
      <rect x="28" y="10" width="2"  height="2" rx="0.5" fill="#0d1f2d" />
      <rect x="28" y="10" width="0.8" height="0.8" fill="white" opacity="0.9" />
      {/* Beak */}
      <rect x="33" y="11" width="5"  height="2.5" rx="1" fill="#e8b84a" />
      <rect x="33" y="13" width="4"  height="2"   rx="1" fill="#c09030" />
      {/* Feet */}
      <rect x="10" y="20" width="2"  height="6" rx="1" fill="#2d8a7a" />
      <rect x="16" y="20" width="2"  height="6" rx="1" fill="#2d8a7a" />
    </svg>
  )
}

export default function HeaderBird() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 2,
        left: 0,
        pointerEvents: 'none',
        animation: 'header-walk-ltr 22s linear infinite 4s',
        zIndex: 1,
      }}
    >
      <BirdSVG />
    </div>
  )
}
