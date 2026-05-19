import { useState, useEffect, useRef, useCallback } from 'react'

/*
  A tiny cloud bot that lives on the toolbar navbar.
  - Walks left/right between the "Personal OS" brand and the settings icon
  - Pauses every few seconds, looks around, blinks, sometimes jumps
  - Pure CSS animations, no layout impact (position: absolute inside header)
*/

// ── Cloud Bot SVG ──────────────────────────────────────────────────────────

function CloudBot({ facing, action }) {
  const flip = facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
  const bobClass = action === 'walk' ? 'cloud-bot-walk' : ''
  const jumpClass = action === 'jump' ? 'cloud-bot-jump' : ''

  return (
    <div
      className={`${bobClass} ${jumpClass}`}
      style={{ transform: flip, transformOrigin: 'center bottom' }}
    >
      <svg viewBox="0 0 28 24" width="22" height="18" fill="none">
        {/* Cloud body */}
        <ellipse cx="14" cy="12" rx="11" ry="7" fill="var(--theme-text-2)" opacity="0.25" />
        <ellipse cx="14" cy="11.5" rx="10" ry="6.5" fill="var(--theme-text-1)" opacity="0.12" />

        {/* Inner highlight */}
        <ellipse cx="14" cy="10.5" rx="8" ry="5" fill="var(--theme-text-1)" opacity="0.06" />

        {/* Eyes */}
        <g className={action === 'blink' ? 'cloud-bot-blink' : ''}>
          {action === 'look-up' ? (
            <>
              <circle cx="10.5" cy="9.5" r="1.3" fill="var(--theme-text-1)" opacity="0.7" />
              <circle cx="17.5" cy="9.5" r="1.3" fill="var(--theme-text-1)" opacity="0.7" />
              {/* Pupils looking up */}
              <circle cx="10.5" cy="8.8" r="0.6" fill="var(--theme-text-1)" />
              <circle cx="17.5" cy="8.8" r="0.6" fill="var(--theme-text-1)" />
            </>
          ) : (
            <>
              <circle cx="10.5" cy="10" r="1.3" fill="var(--theme-text-1)" opacity="0.7" />
              <circle cx="17.5" cy="10" r="1.3" fill="var(--theme-text-1)" opacity="0.7" />
              {/* Pupils */}
              <circle cx="10.5" cy="10.2" r="0.6" fill="var(--theme-text-1)" />
              <circle cx="17.5" cy="10.2" r="0.6" fill="var(--theme-text-1)" />
            </>
          )}
        </g>

        {/* Smile */}
        <path d="M12 13.5 Q14 15 16 13.5" stroke="var(--theme-text-1)" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.4" />

        {/* Legs */}
        <g className={action === 'walk' ? 'cloud-bot-legs' : ''}>
          <line x1="11" y1="17.5" x2="11" y2="20.5" stroke="var(--theme-text-1)" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
          <line x1="17" y1="17.5" x2="17" y2="20.5" stroke="var(--theme-text-1)" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
        </g>

        {/* Tiny feet */}
        <ellipse cx="11" cy="21" rx="1.5" ry="0.7" fill="var(--theme-text-1)" opacity="0.2" />
        <ellipse cx="17" cy="21" rx="1.5" ry="0.7" fill="var(--theme-text-1)" opacity="0.2" />
      </svg>
    </div>
  )
}

// ── Behaviour state machine ───────────────────────────────────────────────

const ACTIONS = ['walk', 'idle', 'look-up', 'blink', 'jump']
const WALK_SPEED = 0.3 // px per frame (~18px/sec at 60fps)
const PAUSE_MIN = 2000
const PAUSE_MAX = 5000

function randomPause() {
  return PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN)
}

export default function ToolbarMascot() {
  const [x, setX] = useState(60)
  const [facing, setFacing] = useState('right')
  const [action, setAction] = useState('idle')
  const stateRef = useRef({ x: 60, facing: 'right', targetX: 200, walking: false, paused: false })
  const animRef = useRef(null)
  const boundsRef = useRef({ left: 50, right: 300 })

  // Measure toolbar bounds on mount
  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('header')
      if (!header) return
      // Walk zone: after brand text, before settings icon
      // Leave ~120px on left for brand, ~80px on right for avatar/settings
      const rect = header.getBoundingClientRect()
      boundsRef.current = {
        left: 120,
        right: rect.width - 80,
      }
      // Start near the brand
      stateRef.current.x = 130
      setX(130)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const pickNewTarget = useCallback(() => {
    const { left, right } = boundsRef.current
    const range = right - left
    const st = stateRef.current
    // Pick a target at least 30% of range away from current position
    let target
    do {
      target = left + Math.random() * range
    } while (Math.abs(target - st.x) < range * 0.3)
    st.targetX = target
    st.facing = target > st.x ? 'right' : 'left'
    setFacing(st.facing)
  }, [])

  // Main animation loop
  useEffect(() => {
    const st = stateRef.current
    let pauseTimeout = null
    let actionTimeout = null

    const doAction = () => {
      // Random idle action
      const pick = ACTIONS[Math.floor(Math.random() * ACTIONS.length)]
      if (pick === 'walk') {
        // Start walking to new target
        pickNewTarget()
        st.walking = true
        setAction('walk')
      } else {
        st.walking = false
        setAction(pick)
        // Hold action for 1-2s, then go back to deciding
        actionTimeout = setTimeout(() => {
          setAction('idle')
          pauseTimeout = setTimeout(doAction, randomPause())
        }, 1000 + Math.random() * 1500)
      }
    }

    // Start first action after a short delay
    pauseTimeout = setTimeout(doAction, 1500)

    const frame = () => {
      if (st.walking) {
        const dir = st.targetX > st.x ? 1 : -1
        st.x += dir * WALK_SPEED
        setX(st.x)

        // Reached target?
        if (Math.abs(st.x - st.targetX) < 2) {
          st.walking = false
          setAction('idle')
          // Pause then pick next action
          pauseTimeout = setTimeout(doAction, randomPause())
        }
      }
      animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(animRef.current)
      clearTimeout(pauseTimeout)
      clearTimeout(actionTimeout)
    }
  }, [pickNewTarget])

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        bottom: 2,
        pointerEvents: 'none',
        zIndex: 25,
        transition: action !== 'walk' ? 'none' : undefined,
      }}
    >
      <CloudBot facing={facing} action={action} />
    </div>
  )
}
