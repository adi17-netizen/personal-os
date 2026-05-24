// Cloudflare Pages Function — fetches news RSS and returns parsed JSON
// Bing News is primary (fresher from data center IPs), Google News fallback
// Deployed automatically at /api/rss?topic=Technology

export async function onRequestGet(context) {
  const url = new URL(context.request.url)
  const topic = url.searchParams.get('topic')

  if (!topic) {
    return new Response(JSON.stringify({ error: 'missing topic param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch from both sources in parallel, merge for maximum freshness
  const [bingItems, googleItems] = await Promise.all([
    fetchBingNews(topic).catch(() => null),
    fetchGoogleNews(topic).catch(() => null),
  ])

  const allItems = [...(bingItems || []), ...(googleItems || [])]

  if (allItems.length === 0) {
    return new Response(JSON.stringify({ error: 'All RSS sources failed', items: [] }), {
      status: 502,
      headers: corsHeaders(),
    })
  }

  // Deduplicate by title similarity, sort newest first, cap at 15
  const deduped = deduplicateItems(allItems)
  deduped.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
  const items = deduped.slice(0, 15)

  return new Response(JSON.stringify({ items }), { headers: corsHeaders() })
}

async function fetchBingNews(topic) {
  const rssUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(topic)}&format=rss&count=15&mkt=en-IN`
  try {
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    })
    if (!res.ok) return null
    const xml = await res.text()
    if (!xml.includes('<item>')) return null

    const items = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
      const block = match[1]
      const rawLink = extractTag(block, 'link')
      const realLink = decodeBingRedirect(rawLink)
      const source = extractDomain(realLink)

      items.push({
        title: cleanHtml(extractTag(block, 'title')),
        link: realLink,
        pubDate: extractTag(block, 'pubDate'),
        source,
      })
    }
    return items.length > 0 ? items : null
  } catch {
    return null
  }
}

async function fetchGoogleNews(topic) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-IN&gl=IN&ceid=IN:en`
  try {
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!res.ok) return null
    const xml = await res.text()
    if (!xml.includes('<item>')) return null
    return parseGoogleRssItems(xml)
  } catch {
    return null
  }
}

function parseGoogleRssItems(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
    const block = match[1]
    items.push({
      title: extractTag(block, 'title'),
      link: extractTag(block, 'link'),
      pubDate: extractTag(block, 'pubDate'),
      source: extractAttr(block, 'source', 'url') ? extractTagContent(block, 'source') : '',
    })
  }
  return items.length > 0 ? items : null
}

// Deduplicate articles by normalizing titles (removes source suffixes, lowercases)
function deduplicateItems(items) {
  const seen = new Set()
  return items.filter(item => {
    // Normalize: lowercase, strip " - Source Name" suffix, strip punctuation
    const key = item.title.toLowerCase()
      .replace(/\s*[-–|]\s*[^-–|]+$/, '') // remove " - CNN" etc
      .replace(/[^\w\s]/g, '')
      .trim()
      .slice(0, 50) // compare first 50 chars to catch near-duplicates
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Extract real URL from Bing redirect: bing.com/news/apiclick.aspx?...&url=ENCODED_URL&...
// RSS XML uses &amp; entities which need decoding first
function decodeBingRedirect(bingUrl) {
  try {
    const decoded = bingUrl.replace(/&amp;/g, '&')
    const urlObj = new URL(decoded)
    const realUrl = urlObj.searchParams.get('url')
    if (realUrl) return realUrl
  } catch {}
  return bingUrl
}

// Extract domain name from URL for source display
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return ''
  }
}

// Strip HTML tags from Bing titles
function cleanHtml(text) {
  return text.replace(/<[^>]+>/g, '').trim()
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=180', // 3 min browser cache
  }
}

function extractTag(block, tag) {
  const cdataMatch = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  if (plainMatch) return plainMatch[1].trim()
  const afterMatch = block.match(new RegExp(`<${tag}[^/]*/>\\s*([^<]+)`))
  if (afterMatch) return afterMatch[1].trim()
  return ''
}

function extractTagContent(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return match ? match[1].trim() : ''
}

function extractAttr(block, tag, attr) {
  const match = block.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*>`))
  return match ? match[1] : ''
}
