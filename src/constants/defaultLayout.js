// LG layout: 12-column grid, rowHeight dynamic, margin=[12,12]
// Phase 3: 3-column — Left(w:3) | Center(w:5) | Right(w:4) = 10 rows
// Focus Timer removed from grid (now a toolbar overlay)
export const DEFAULT_LAYOUT = [
  // Left column — x:0, w:3
  { i: 'clock-weather', x: 0, y: 0, w: 3, h: 2, minW: 1, minH: 1 },
  { i: 'quick-links',   x: 0, y: 2, w: 3, h: 4, minW: 1, minH: 1 },
  { i: 'save-link',     x: 0, y: 6, w: 3, h: 4, minW: 1, minH: 1 },

  // Center column — x:3, w:5
  { i: 'calendar',      x: 3, y: 0, w: 5, h: 5, minW: 1, minH: 1 },
  { i: 'tasks',         x: 3, y: 5, w: 5, h: 5, minW: 1, minH: 1 },

  // Right column — x:8, w:4
  { i: 'greeting',      x: 8, y: 0, w: 4, h: 2, minW: 1, minH: 1 },
  { i: 'news-feed',     x: 8, y: 2, w: 4, h: 4, minW: 1, minH: 1 },
  { i: 'notes',         x: 8, y: 6, w: 4, h: 4, minW: 1, minH: 1 },
]

// MD layout: 6-column — never persisted
export const MD_LAYOUT = [
  { i: 'clock-weather', x: 0, y: 0,  w: 3, h: 2 },
  { i: 'greeting',      x: 3, y: 0,  w: 3, h: 2 },
  { i: 'calendar',      x: 0, y: 2,  w: 3, h: 5 },
  { i: 'tasks',         x: 3, y: 2,  w: 3, h: 5 },
  { i: 'quick-links',   x: 0, y: 7,  w: 3, h: 3 },
  { i: 'save-link',     x: 3, y: 7,  w: 3, h: 3 },
  { i: 'notes',         x: 0, y: 10, w: 6, h: 4 },
  { i: 'news-feed',     x: 0, y: 14, w: 6, h: 3 },
]
