# Personal OS - Progress

A personal dashboard that replaces the 7 browser tabs a knowledge worker keeps open. Sign in with Google, see your entire Google life on one draggable grid.

---

## What's Been Built

### Phase 1 - Scaffold + Auth + Grid (complete)

- Vite + React project with Tailwind CSS v3
- Firebase Auth (Google sign-in with OAuth token management)
- Token lifecycle: `signInWithPopup` -> `sessionStorage` -> `ReconnectBanner` on expiry
- `react-grid-layout` v2 with `ResizeObserver`-based width + viewport-filling row height
- Layout persistence to Firestore (authenticated) or localStorage (mock mode)
- Three themes: Beach (warm sandy), Mountain (dark navy), Apple (clean white)
- Theme switcher in Settings panel
- `--font-scale` CSS variable for text size scaling

### Phase 2 - Core Widgets (complete)

- **Clock & Weather** - Live clock + WeatherAPI forecast for Mumbai. SVG weather icons (sun, cloud, rain, storm, snow, mist). 4-line weather: city, temp, condition, tomorrow forecast.
- **Calendar** - Google Calendar v3 integration. Today's events with time, title, Join Meet button.
- **Tasks** - Google Tasks v1. List, add, check off, inline edit via PATCH. Optimistic updates.
- **Notes** - Google Docs sync. JetBrains Mono textarea, 1500ms debounced auto-save, speech-to-text dictation mic.
- **Greeting** - Time-of-day salutation, uses calendar data for next event preview.
- **Quick Links** - Firestore-backed bookmarks with favicon fetching from Google S2.
- **Save Link** - Google Drive integration. URL -> `.url` shortcut file via resumable upload. Drag-and-drop + file upload.
- **News Feed** - Google News RSS via allorigins proxy. Topic picker, article links.

### Phase 3 - Toolbar + Overlays (complete)

- **Toolbar** (44px) replacing the old header. Left: brand, Center: 6 tool buttons, Right: avatar + settings.
- **Daily Brief** - Auto-shows once per day. Greeting, weather, top 5 events, top 3 tasks, top 3 news headlines.
- **Search Overlay** - Full-screen, Google search with last 3 history. Keyboard shortcut: `/`
- **Ask AI Overlay** - Opens Gemini web app with query. Keyboard shortcut: `A`
- **Instant Meet** - Creates Google Meet via Calendar API, copies link, stores last 3.
- **Meeting Recorder** - MediaRecorder -> Groq Whisper transcription -> Groq Llama summarization -> Google Docs export.
- **Focus Timer** - Toolbar overlay (not a grid widget). Setup card with presets (25/45/90m), full-screen blur + floating timer during session, tab title countdown.

---

## Current Widget/Feature Status

| Widget/Feature | Status | API | Notes |
|----------------|--------|-----|-------|
| Clock & Weather | Live | WeatherAPI | Hardcoded to Mumbai |
| Calendar | Live | Google Calendar v3 | Requires Google sign-in |
| Tasks | Live | Google Tasks v1 | Requires Google sign-in |
| Notes | Live | Google Docs v1 | Auto-creates doc on first use |
| Greeting | Live | (uses Calendar) | Time-of-day salutation |
| Quick Links | Live | Firestore | Real-time onSnapshot |
| Save Link | Live | Google Drive v3 | Resumable upload |
| News Feed | Live | Google News RSS | Via allorigins proxy |
| Daily Brief | Live | (aggregates hooks) | Auto-shows once/day |
| Search | Live | N/A | Opens Google in new tab |
| Ask AI | Live | N/A | Opens Gemini web app |
| Instant Meet | Live | Google Calendar v3 | Creates Meet + copies link |
| Meeting Recorder | Live | Groq Whisper + Llama | Transcribe + summarize |
| Focus Timer | Live | N/A | Overlay with blur effect |

---

## Architecture Decisions

### Auth & Token Management
- Firebase Auth restores sessions, but Google OAuth tokens are NOT persisted by Firebase
- Tokens stored in `sessionStorage` with 60s expiry buffer
- On reload: Firebase session restores, but token is gone -> `ReconnectBanner` prompts re-auth
- All widgets call `useGoogleToken()` hook (never import `tokenStore` directly)

### Google API Pattern
- Single `fetchGoogle()` chokepoint in `lib/googleApi.js`
- Attaches `Authorization: Bearer {token}` header automatically
- 401 -> clears token, throws `TokenExpiredError`
- Every widget uses `useWidgetData(fetchFn)` -> `{ data, status, error, retry }`

### Grid Layout
- `react-grid-layout` with `WidthProvider(Responsive)`, 12 columns
- `rowHeight` dynamically fills viewport: `(viewportHeight - toolbar - padding) / 10 rows`
- `draggableHandle=".drag-handle"` prevents input interference
- Only LG layout persisted (MD layout is fixed, never saved)
- `LAYOUT_VERSION` (currently 7) auto-resets stale layouts

### Theming
- CSS custom properties with RGB triplets: `rgb(var(--color-accent) / alpha)`
- `data-theme` attribute on `<html>`: `beach` | `mountain` | `apple`
- Each theme defines: bg, card, border, accent, text-1/2/3, header-bg/border

### Overlays vs Widgets
- Widgets live in the grid (draggable, resizable)
- Overlays are full-screen modals triggered from the toolbar
- Focus Timer was moved from widget to overlay (Phase 3) for better UX

---

## Environment Variables

```bash
# Firebase (required for auth + data persistence)
VITE_FIREBASE_API_KEY=          # Firebase project API key
VITE_FIREBASE_AUTH_DOMAIN=      # {project}.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=       # Firebase project ID
VITE_FIREBASE_APP_ID=           # Firebase app ID

# Google OAuth (required for Calendar, Tasks, Drive, Docs)
VITE_GOOGLE_CLIENT_ID=          # OAuth 2.0 client ID from Google Cloud Console

# Weather
VITE_OPENWEATHER_API_KEY=       # OpenWeatherMap key (legacy, not currently used)
VITE_WEATHERAPI_KEY=            # WeatherAPI.com key (active - used for forecasts)

# AI / Transcription
VITE_GROQ_API_KEY=              # Groq API key (Whisper transcription + Llama summarization)
VITE_GEMINI_API_KEY=            # Google Gemini API key (Daily Brief, future AI features)

# Feature flags
VITE_MOCK_MODE=false            # true = localStorage mock data, no API calls
VITE_IS_EXTENSION=false         # true = Chrome extension mode (future)
```

---

## File Structure

```
src/
  config/firebase.js              # Firebase init, auth, db, googleProvider
  contexts/
    AuthContext.jsx                # Token lifecycle, sign-in/out, needsReconnect
    GridContext.jsx                # Layout state + Firestore persistence
    ThemeContext.jsx               # Theme switching (beach/mountain/apple)
    FocusContext.jsx               # Focus timer state (global, mutes dashboard)
  lib/
    googleApi.js                   # fetchGoogle() + TokenExpiredError
    tokenStore.js                  # sessionStorage token get/set/clear
    widgetHelpers.js               # useWidgetData hook, debounce utility
  hooks/
    useCalendar.js                 # Google Calendar v3
    useTasks.js                    # Google Tasks v1
    useNotes.js                    # Google Docs read/write
    useWeather.js                  # WeatherAPI.com (Mumbai hardcoded)
    useNewsFeed.js                 # Google News RSS
    useGoogleToken.js              # Token access (extension swap seam)
  components/
    toolbar/Toolbar.jsx            # 44px toolbar with tool buttons
    layout/
      WidgetShell.jsx              # Drag handle wrapper for grid widgets
      ReconnectBanner.jsx          # Token expiry banner
      SkeletonList.jsx             # Loading shimmer
      ErrorState.jsx               # Error with retry button
      EmptyState.jsx               # Empty data message
    overlays/
      SearchOverlay.jsx            # Google search (keyboard: /)
      AskAIOverlay.jsx             # Gemini redirect (keyboard: A)
      DailyBriefPanel.jsx          # Morning brief aggregate
      InstantMeetPopover.jsx       # Create Meet link
      MeetingRecorderCard.jsx      # Record + transcribe + summarize
      FocusOverlay.jsx             # Focus timer setup + active session
    widgets/
      ClockWeather/index.jsx       # Clock + weather
      Calendar/index.jsx           # Today's events
      Tasks/index.jsx              # Task list with CRUD
      Notes/index.jsx              # Google Docs notepad
      Greeting/index.jsx           # Time-of-day greeting
      QuickLinks/index.jsx         # Bookmarks
      SaveLink/index.jsx           # Drive file saver
      NewsFeed/index.jsx           # News articles
    ambient/FlyingBird.jsx         # Decorative bird animation
    ui/SettingsPanel.jsx           # Theme + font size settings
  constants/
    defaultLayout.js               # Grid positions (LG + MD)
    scopes.js                      # OAuth scope strings
  pages/
    Dashboard.jsx                  # Grid host + overlay management
    Login.jsx                      # Sign-in page
```

---

## Known Issues / Pending

- **Weather location**: API resolves coords to "Cooria" locality, but we override with "Mumbai" in code
- **Orphan widget files**: `src/components/widgets/FocusTimer/`, `AskAI/`, `SearchBar/`, `InstantMeet/`, `MeetingRecorder/` are unused (functionality moved to overlays). Can be deleted.
- **Bundle size**: 640KB minified (single chunk). Could benefit from code-splitting.
- **No offline support**: All widgets fail without network.
- **Gemini not used in-app yet**: Only AskAI overlay opens gemini.google.com. The `VITE_GEMINI_API_KEY` is set but not consumed by any widget currently (was removed from MeetingRecorder in favor of Groq).

---

## Phase 3 Backlog (future)

- [ ] Chrome extension mode (`VITE_IS_EXTENSION=true` + `chrome.identity`)
- [ ] Gemini-powered Daily Brief summary (use API key to generate natural language brief)
- [ ] Widget-level settings (customize news topics, weather city, calendar date range)
- [ ] Keyboard shortcuts panel (show all shortcuts)
- [ ] Mobile responsive layout (< 768px)
- [ ] PWA support (service worker, offline cache)
- [ ] Delete orphan widget files (FocusTimer, AskAI, SearchBar, InstantMeet, MeetingRecorder)
- [ ] Code-split large widgets with `React.lazy()`
- [ ] Drag-to-reorder Quick Links
- [ ] Multi-calendar support (show events from all calendars, not just primary)
