import BeachCrab from './BeachCrab'

// Animated wave at bottom of beach scene
function BeachWaves() {
  return (
    <svg
      viewBox="0 0 1440 100"
      preserveAspectRatio="xMidYMax meet"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        pointerEvents: 'none',
        zIndex: 2,
        opacity: 0.7,
      }}
    >
      <defs>
        <style>{`
          @keyframes wave1 {
            0%   { d: path("M0,60 C240,30 480,80 720,55 C960,30 1200,70 1440,50 L1440,100 L0,100 Z"); }
            50%  { d: path("M0,55 C240,75 480,35 720,60 C960,80 1200,40 1440,65 L1440,100 L0,100 Z"); }
            100% { d: path("M0,60 C240,30 480,80 720,55 C960,30 1200,70 1440,50 L1440,100 L0,100 Z"); }
          }
          @keyframes wave2 {
            0%   { d: path("M0,70 C300,50 600,85 900,65 C1100,50 1300,78 1440,60 L1440,100 L0,100 Z"); }
            50%  { d: path("M0,65 C300,82 600,55 900,75 C1100,88 1300,58 1440,72 L1440,100 L0,100 Z"); }
            100% { d: path("M0,70 C300,50 600,85 900,65 C1100,50 1300,78 1440,60 L1440,100 L0,100 Z"); }
          }
          .wave1 { animation: wave1 5s ease-in-out infinite; }
          .wave2 { animation: wave2 7s ease-in-out infinite; }
        `}</style>
      </defs>
      <path
        className="wave1"
        d="M0,60 C240,30 480,80 720,55 C960,30 1200,70 1440,50 L1440,100 L0,100 Z"
        fill="rgba(100,180,220,0.35)"
      />
      <path
        className="wave2"
        d="M0,70 C300,50 600,85 900,65 C1100,50 1300,78 1440,60 L1440,100 L0,100 Z"
        fill="rgba(80,160,210,0.25)"
      />
      {/* sand strip */}
      <rect x="0" y="88" width="1440" height="12" fill="rgba(210,180,120,0.5)" />
    </svg>
  )
}

export default function BeachScene() {
  return (
    <>
      <BeachWaves />
      <BeachCrab />
    </>
  )
}
