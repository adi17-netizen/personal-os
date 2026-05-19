import { useState, useEffect, useRef, useCallback } from 'react'

/*
  Pixel robot mascot that walks along the toolbar.
  - Blocky retro bot inspired by space-invader style
  - Walks left/right, pauses to idle/blink/jump/look-up
  - Flees from the cursor when hovered
*/

// ── Pixel Bot SVG — blocky square robot with stubby legs ──────────────────

function PixelBot({ facing, action, fleeing }) {
  const flip = facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
  const bobClass = action === 'walk' || fleeing ? 'mascot-walk' : ''
  const jumpClass = action === 'jump' ? 'mascot-jump' : ''

  // Accent color for the body — uses the theme accent
  const bodyFill = `rgb(var(--color-accent))`
  const bodyDark = `rgb(var(--color-accent) / 0.8)`

  return (
    <div
      className={`${bobClass} ${jumpClass}`}
      style={{ transform: flip, transformOrigin: 'center bottom' }}
    >
      <svg viewBox="0 0 24 28" width="20" height="23" style={{ imageRendering: 'crisp-edges' }}>
        {/* Ears / antenna nubs */}
        <rect x="3" y="1" width="4" height="3" rx="0.5" fill={bodyFill} />
        <rect x="17" y="1" width="4" height="3" rx="0.5" fill={bodyFill} />

        {/* Head / body — one big block */}
        <rect x="2" y="3" width="20" height="16" rx="1" fill={bodyFill} />

        {/* Face area — slightly darker inset */}
        <rect x="4" y="5" width="16" height="10" rx="0.5" fill={bodyDark} opacity="0.3" />

        {/* Eyes */}
        <g className={action === 'blink' ? 'mascot-blink' : ''}>
          {action === 'look-up' ? (
            <>
              {/* > < squint eyes when looking up */}
              <path d="M7 8 L9.5 9.5 L7 11" stroke="var(--theme-text-1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M17 8 L14.5 9.5 L17 11" stroke="var(--theme-text-1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </>
          ) : fleeing ? (
            <>
              {/* Panic eyes — X X */}
              <path d="M7 8 L10 11 M10 8 L7 11" stroke="var(--theme-text-1)" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M14 8 L17 11 M17 8 L14 11" stroke="var(--theme-text-1)" strokeWidth="1.3" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Normal eyes — > < chevrons like the reference */}
              <path d="M7 8 L9.5 9.5 L7 11" stroke="var(--theme-text-1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M17 8 L14.5 9.5 L17 11" stroke="var(--theme-text-1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </>
          )}
        </g>

        {/* Legs */}
        <g className={action === 'walk' || fleeing ? 'mascot-legs' : ''}>
          {/* Left leg */}
          <rect x="5" y="19" width="5" height="8" rx="0.5" fill="var(--theme-text-1)" opacity="0.18" />
          {/* Right leg */}
          <rect x="14" y="19" width="5" height="8" rx="0.5" fill="var(--theme-text-1)" opacity="0.18" />
        </g>

        {/* Gap between legs (shows through) */}
        <rect x="10" y="19" width="4" height="5" fill="var(--theme-header-bg, transparent)" opacity="0.9" />
      </svg>
    </div>
  )
}

// ── Behaviour ─────────────────────────────────────────────────────────────

const ACTIONS = ['walk', 'walk', 'walk', 'idle', 'look-up', 'blink', 'jump']
const WALK_SPEED = 0.5 // px per frame (~30px/sec at 60fps)
const FLEE_SPEED = 2.5 // much faster when scared
const PAUSE_MIN = 1500
const PAUSE_MAX = 4000
const FLEE_DISTANCE = 60 // px — how close cursor must be to trigger flee
const FLEE_JUMP = 80 // px — how far to run when fleeing

function randomPause() {
  return PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN)
}

export default function ToolbarMascot() {
  const [x, setX] = useState(130)
  const [facing, setFacing] = useState('right')
  const [action, setAction] = useState('idle')
  const [fleeing, setFleeing] = useState(false)
  const stateRef = useRef({
    x: 130, facing: 'right', targetX: 200,
    walking: false, fleeing: false, fleeTimeout: null,
  })
  const animRef = useRef(null)
  const boundsRef = useRef({ left: 120, right: 500 })
  const containerRef = useRef(null)

  // Measure toolbar bounds
  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('header')
      if (!header) return
      const rect = header.getBoundingClientRect()
      boundsRef.current = { left: 120, right: rect.width - 80 }
      if (stateRef.current.x < 120) {
        stateRef.current.x = 130
        setX(130)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Cursor flee detection — listen on the header
  useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return

    const onMove = (e) => {
      const st = stateRef.current
      const headerRect = header.getBoundingClientRect()
      const cursorX = e.clientX - headerRect.left
      const cursorY = e.clientY - headerRect.top
      const dist = Math.sqrt((cursorX - st.x) ** 2 + (cursorY - 30) ** 2)

      if (dist < FLEE_DISTANCE && !st.fleeing) {
        // Flee! Run in the opposite direction
        st.fleeing = true
        st.walking = true
        setFleeing(true)
        setAction('walk')

        const { left, right } = boundsRef.current
        const fleeDir = cursorX > st.x ? -1 : 1
        let fleeTarget = st.x + fleeDir * FLEE_JUMP
        fleeTarget = Math.max(left, Math.min(right, fleeTarget))
        st.targetX = fleeTarget
        st.facing = fleeDir > 0 ? 'right' : 'left'
        setFacing(st.facing)

        // Reset flee state after reaching target
        clearTimeout(st.fleeTimeout)
        st.fleeTimeout = setTimeout(() => {
          st.fleeing = false
          setFleeing(false)
        }, 2000)
      }
    }

    header.addEventListener('mousemove', onMove)
    return () => header.removeEventListener('mousemove', onMove)
  }, [])

  const pickNewTarget = useCallback(() => {
    const { left, right } = boundsRef.current
    const range = right - left
    const st = stateRef.current
    let target
    do {
      target = left + Math.random() * range
    } while (Math.abs(target - st.x) < range * 0.25)
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
      if (st.fleeing) return // don't interrupt flee
      const pick = ACTIONS[Math.floor(Math.random() * ACTIONS.length)]
      if (pick === 'walk') {
        pickNewTarget()
        st.walking = true
        setAction('walk')
      } else {
        st.walking = false
        setAction(pick)
        actionTimeout = setTimeout(() => {
          setAction('idle')
          pauseTimeout = setTimeout(doAction, randomPause())
        }, 800 + Math.random() * 1200)
      }
    }

    pauseTimeout = setTimeout(doAction, 800)

    const frame = () => {
      if (st.walking) {
        const speed = st.fleeing ? FLEE_SPEED : WALK_SPEED
        const dir = st.targetX > st.x ? 1 : -1
        st.x += dir * speed

        // Clamp to bounds
        const { left, right } = boundsRef.current
        st.x = Math.max(left, Math.min(right, st.x))
        setX(st.x)

        if (Math.abs(st.x - st.targetX) < 2 || st.x <= left || st.x >= right) {
          st.walking = false
          if (!st.fleeing) {
            setAction('idle')
            pauseTimeout = setTimeout(doAction, randomPause())
          } else {
            // After flee, pause briefly then resume normal behavior
            setAction('idle')
            setTimeout(() => {
              st.fleeing = false
              setFleeing(false)
              pauseTimeout = setTimeout(doAction, randomPause())
            }, 600)
          }
        }
      }
      animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(animRef.current)
      clearTimeout(pauseTimeout)
      clearTimeout(actionTimeout)
      clearTimeout(st.fleeTimeout)
    }
  }, [pickNewTarget])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: x,
        bottom: 1,
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      <PixelBot facing={facing} action={action} fleeing={fleeing} />
    </div>
  )
}
