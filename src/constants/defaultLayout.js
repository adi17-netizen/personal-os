// LG layout: 12-column grid, rowHeight dynamic, margin=[12,12]
// Principle: everything fits in 10 rows — NO scrolling.
// minH values protect widget functionality — widgets can grow but never
// shrink below the point where features (drop zones, inputs, lists) vanish.
export const DEFAULT_LAYOUT = [
  // Left column — x:0, w:3
  { i: 'clock-weather', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'quick-links',   x: 0, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
  { i: 'save-link',     x: 0, y: 4, w: 3, h: 3, minW: 2, minH: 3 },
  { i: 'notes',         x: 0, y: 7, w: 3, h: 3, minW: 2, minH: 2 },

  // Center column — x:3, w:5
  { i: 'calendar',      x: 3, y: 0, w: 5, h: 5, minW: 3, minH: 3 },
  { i: 'tasks',         x: 3, y: 5, w: 5, h: 5, minW: 3, minH: 3 },

  // Right column — x:8, w:4
  { i: 'greeting',      x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  { i: 'gmail',         x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
  { i: 'news-feed',     x: 8, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
]

// MD layout: 6-column — never persisted
export const MD_LAYOUT = [
  { i: 'clock-weather', x: 0, y: 0,  w: 3, h: 2 },
  { i: 'greeting',      x: 3, y: 0,  w: 3, h: 2 },
  { i: 'calendar',      x: 0, y: 2,  w: 3, h: 5 },
  { i: 'tasks',         x: 3, y: 2,  w: 3, h: 5 },
  { i: 'quick-links',   x: 0, y: 7,  w: 3, h: 3 },
  { i: 'save-link',     x: 3, y: 7,  w: 3, h: 3 },
  { i: 'gmail',         x: 0, y: 10, w: 3, h: 4 },
  { i: 'news-feed',     x: 3, y: 10, w: 3, h: 4 },
  { i: 'notes',         x: 0, y: 14, w: 6, h: 3 },
]
