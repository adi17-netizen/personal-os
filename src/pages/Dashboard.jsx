import { useRef, useEffect, useState } from 'react'
import { ResponsiveGridLayout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import { useGrid }    from '../contexts/GridContext'
import { useAuth }    from '../contexts/AuthContext'
import { useTheme }   from '../contexts/ThemeContext'
import { useFocus }   from '../contexts/FocusContext'
import { MD_LAYOUT }  from '../constants/defaultLayout'

import ReconnectBanner    from '../components/layout/ReconnectBanner'
import WidgetShell        from '../components/layout/WidgetShell'
import Toolbar            from '../components/toolbar/Toolbar'
import ToolbarMascot      from '../components/ambient/ToolbarMascot'

import SearchOverlay       from '../components/overlays/SearchOverlay'
import AskAIOverlay        from '../components/overlays/AskAIOverlay'
import DailyBriefPanel     from '../components/overlays/DailyBriefPanel'
import InstantMeetPopover  from '../components/overlays/InstantMeetPopover'
import MeetingRecorderCard from '../components/overlays/MeetingRecorderCard'
import FocusOverlay        from '../components/overlays/FocusOverlay'

import ClockWeather from '../components/widgets/ClockWeather'
import Greeting     from '../components/widgets/Greeting'
import Calendar     from '../components/widgets/Calendar'
import Tasks        from '../components/widgets/Tasks'
import Notes        from '../components/widgets/Notes'
import QuickLinks   from '../components/widgets/QuickLinks'
import SaveLink     from '../components/widgets/SaveLink'
import NewsFeed     from '../components/widgets/NewsFeed'
import Gmail        from '../components/widgets/Gmail'

import {
  Clock, Sun, CalendarDays, CheckSquare,
  StickyNote, Link2, Bookmark, Newspaper, Mail,
} from 'lucide-react'

const WIDGET_CONFIG = {
  'clock-weather': { title: 'Clock & Weather', icon: Clock,        Component: ClockWeather },
  'greeting':      { title: 'Greeting',         icon: Sun,          Component: Greeting },
  'calendar':      { title: 'Calendar',         icon: CalendarDays, Component: Calendar },
  'tasks':         { title: 'Tasks',            icon: CheckSquare,  Component: Tasks },
  'notes':         { title: 'Notes',            icon: StickyNote,   Component: Notes },
  'quick-links':   { title: 'Quick Links',      icon: Link2,        Component: QuickLinks },
  'save-link':     { title: 'Save Link',        icon: Bookmark,     Component: SaveLink },
  'news-feed':     { title: 'News Feed',        icon: Newspaper,    Component: NewsFeed },
  'gmail':         { title: 'Gmail',            icon: Mail,         Component: Gmail },
}

// ── Grid sizing ────────────────────────────────────────────────────────────

function useContainerWidth(ref) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.offsetWidth)
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return width
}

const GRID_ROWS = 10
const HEADER_H  = 44
const MAIN_PAD  = 24
const ROW_GAP   = 12

function useRowHeight() {
  const [rowHeight, setRowHeight] = useState(80)
  useEffect(() => {
    const recalc = () => {
      const available = window.innerHeight - HEADER_H - MAIN_PAD
      const rh = Math.floor((available - (GRID_ROWS + 1) * ROW_GAP) / GRID_ROWS)
      setRowHeight(Math.max(52, Math.min(130, rh)))
    }
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [])
  return rowHeight
}

// ── Grid container ─────────────────────────────────────────────────────────

function GridContainer({ layout, onLayoutChange }) {
  const containerRef = useRef(null)
  const width     = useContainerWidth(containerRef)
  const rowHeight = useRowHeight()

  return (
    <div ref={containerRef} className="w-full">
      {width > 0 && (
        <ResponsiveGridLayout
          width={width}
          layouts={{ lg: layout, md: MD_LAYOUT }}
          breakpoints={{ lg: 900, md: 0 }}
          cols={{ lg: 12, md: 6 }}
          rowHeight={rowHeight}
          margin={[12, 12]}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
        >
          {layout.map((item) => {
            const config = WIDGET_CONFIG[item.i]
            if (!config) return null
            const { title, icon, Component } = config

            return (
              <div key={item.i}>
                <WidgetShell title={title} icon={icon}>
                  <Component />
                </WidgetShell>
              </div>
            )
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { layout, onLayoutChange, loaded } = useGrid()
  const { needsReconnect }                 = useAuth()
  const { theme }                          = useTheme()
  const { isFocusing, status: focusStatus } = useFocus()

  const [activeOverlay, setActiveOverlay] = useState(null)
  const [settingsOpen, setSettingsOpen]   = useState(false)

  const meetButtonRef = useRef(null)

  // Auto-show Daily Brief once per day
  useEffect(() => {
    const today = new Date().toDateString()
    if (localStorage.getItem('personal-os-last-brief') !== today) {
      const t = setTimeout(() => {
        setActiveOverlay('brief')
        localStorage.setItem('personal-os-last-brief', today)
      }, 900)
      return () => clearTimeout(t)
    }
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag      = e.target.tagName.toLowerCase()
      const editable = tag === 'input' || tag === 'textarea' || e.target.isContentEditable
      if (editable) return

      if (e.key === '/')              { e.preventDefault(); setActiveOverlay(o => o === 'search' ? null : 'search') }
      if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setActiveOverlay(o => o === 'ai' ? null : 'ai') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `rgb(var(--color-bg))` }}>
        <div className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: `rgb(var(--color-accent))`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">

      {theme === 'beach'    && <BeachWaves />}
      {theme === 'mountain' && <MountainSilhouette />}
      {theme === 'apple'    && <AppleGlow />}

      <Toolbar
        activeOverlay={activeOverlay}
        setActiveOverlay={setActiveOverlay}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        meetButtonRef={meetButtonRef}
      />

      {needsReconnect && <ReconnectBanner />}

      <main className="flex-1 p-3" style={{ position: 'relative', zIndex: 10 }}>
        <GridContainer
          layout={layout}
          onLayoutChange={onLayoutChange}
        />
      </main>

      {/* Overlays */}
      {activeOverlay === 'search'   && <SearchOverlay      onClose={() => setActiveOverlay(null)} />}
      {activeOverlay === 'ai'       && <AskAIOverlay        onClose={() => setActiveOverlay(null)} />}
      {activeOverlay === 'brief'    && <DailyBriefPanel     onClose={() => setActiveOverlay(null)} />}
      {activeOverlay === 'meet'     && <InstantMeetPopover  anchorRef={meetButtonRef} onClose={() => setActiveOverlay(null)} />}
      {activeOverlay === 'recorder' && <MeetingRecorderCard onClose={() => setActiveOverlay(null)} />}
      {(activeOverlay === 'focus' || isFocusing || focusStatus === 'done') && (
        <FocusOverlay onClose={() => setActiveOverlay(null)} />
      )}
    </div>
  )
}

/* ── Ambient scenery ──────────────────────────────────────────────────────── */

function BeachWaves() {
  return (
    <svg
      viewBox="0 0 1440 220"
      preserveAspectRatio="xMidYMax meet"
      style={{ position: 'fixed', bottom: 0, left: 0, width: '100vw', pointerEvents: 'none', zIndex: 2 }}
    >
      <defs>
        <style>{`.wave1{animation:wave1 5s ease-in-out infinite}.wave2{animation:wave2 7s ease-in-out infinite}`}</style>
        <linearGradient id="sky-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,180,80,0)" />
          <stop offset="60%"  stopColor="rgba(255,170,60,0.06)" />
          <stop offset="100%" stopColor="rgba(255,160,50,0.12)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1440" height="220" fill="url(#sky-glow)" />
      <g opacity="0.08">
        <line x1="120" y1="220" x2="115" y2="110" stroke="#5C3A18" strokeWidth="4" />
        <path d="M115,110 C100,100 60,95 40,105" stroke="#5C3A18" strokeWidth="2" fill="none" />
        <path d="M115,110 C105,95 80,80 55,78" stroke="#5C3A18" strokeWidth="2" fill="none" />
        <path d="M115,110 C120,95 135,82 155,78" stroke="#5C3A18" strokeWidth="2" fill="none" />
        <path d="M115,110 C125,100 155,95 175,102" stroke="#5C3A18" strokeWidth="2" fill="none" />
        <path d="M115,110 C110,98 95,85 75,82" stroke="#5C3A18" strokeWidth="2" fill="none" />
      </g>
      <g opacity="0.06">
        <line x1="1320" y1="220" x2="1325" y2="125" stroke="#5C3A18" strokeWidth="3.5" />
        <path d="M1325,125 C1310,115 1280,110 1260,118" stroke="#5C3A18" strokeWidth="1.8" fill="none" />
        <path d="M1325,125 C1335,112 1355,105 1375,108" stroke="#5C3A18" strokeWidth="1.8" fill="none" />
        <path d="M1325,125 C1320,110 1300,98 1278,96" stroke="#5C3A18" strokeWidth="1.8" fill="none" />
        <path d="M1325,125 C1338,115 1360,112 1380,118" stroke="#5C3A18" strokeWidth="1.8" fill="none" />
      </g>
      <path d="M0,185 C200,178 400,182 600,176 C800,170 1000,180 1200,175 C1350,172 1440,178 1440,178 L1440,220 L0,220 Z" fill="rgba(210,180,120,0.18)" />
      <path d="M0,195 C300,190 600,194 900,188 C1100,185 1300,192 1440,190 L1440,220 L0,220 Z" fill="rgba(210,180,120,0.12)" />
      <path className="wave1" d="M0,178 C240,168 480,185 720,172 C960,162 1200,182 1440,170 L1440,195 L0,195 Z" fill="rgba(80,160,220,0.14)" />
      <path className="wave2" d="M0,182 C300,172 600,190 900,176 C1100,168 1300,185 1440,175 L1440,198 L0,198 Z" fill="rgba(60,140,210,0.10)" />
      <path className="wave1" d="M0,179 C240,169 480,186 720,173 C960,163 1200,183 1440,171" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    </svg>
  )
}

function MountainSilhouette() {
  return (
    <svg
      viewBox="0 0 1440 260"
      preserveAspectRatio="xMidYMax meet"
      style={{ position: 'fixed', bottom: 0, left: 0, width: '100vw', pointerEvents: 'none', zIndex: 2, animation: 'silhouette-in 2s ease-out forwards' }}
    >
      <circle cx="200"  cy="30" r="1"   fill="rgba(255,255,255,0.25)" />
      <circle cx="520"  cy="18" r="0.8" fill="rgba(255,255,255,0.2)"  />
      <circle cx="780"  cy="40" r="1.2" fill="rgba(255,255,255,0.18)" />
      <circle cx="1050" cy="12" r="0.8" fill="rgba(255,255,255,0.22)" />
      <circle cx="1300" cy="35" r="1"   fill="rgba(255,255,255,0.15)" />
      <circle cx="380"  cy="55" r="0.6" fill="rgba(255,255,255,0.12)" />
      <circle cx="950"  cy="50" r="0.7" fill="rgba(255,255,255,0.14)" />
      <path d="M0,260 L0,180 L100,110 L200,155 L320,65 L440,130 L560,55 L680,140 L800,45 L920,125 L1040,60 L1160,140 L1300,80 L1440,135 L1440,260 Z" fill="rgba(255,255,255,0.04)" />
      <path d="M0,260 L0,195 L150,135 L280,180 L420,100 L550,170 L700,110 L830,175 L960,105 L1080,170 L1220,115 L1380,175 L1440,160 L1440,260 Z" fill="rgba(255,255,255,0.06)" />
      <path d="M0,260 L0,220 L200,190 L400,210 L600,185 L800,215 L1000,190 L1200,210 L1440,195 L1440,260 Z" fill="rgba(255,255,255,0.03)" />
      <path d="M320,65 L300,95 L340,95 Z"   fill="rgba(255,255,255,0.08)" />
      <path d="M800,45 L782,72 L818,72 Z"   fill="rgba(255,255,255,0.08)" />
      <path d="M560,55 L545,80 L575,80 Z"   fill="rgba(255,255,255,0.06)" />
      <path d="M1040,60 L1025,85 L1055,85 Z" fill="rgba(255,255,255,0.06)" />
    </svg>
  )
}

function AppleGlow() {
  return (
    <div style={{
      position: 'fixed', bottom: '-20%', left: '50%', transform: 'translateX(-50%)',
      width: '140%', height: '50%',
      background: 'radial-gradient(ellipse at center, rgba(0,122,255,0.04) 0%, transparent 70%)',
      pointerEvents: 'none', zIndex: 2,
    }} />
  )
}
