// Cloudflare Pages Function — fetches Google News RSS and returns parsed JSON
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

  // Try Google News RSS first, then Bing News RSS as fallback
  const items = await fetchGoogleNews(topic) || await fetchBingNews(topic)

  if (items && items.length > 0) {
    return new Response(JSON.stringify({ items }), { headers: corsHeaders() })
  }

  return new Response(JSON.stringify({ error: 'All RSS sources failed', items: [] }), {
    status: 502,
    headers: corsHeaders(),
  })
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
      cf: { cacheTtl: 300 },
    })
    if (!res.ok) return null
    const xml = await res.text()
    if (!xml.includes('<item>')) return null
    return parseRssItems(xml)
  } catch {
    return null
  }
}

async function fetchBingNews(topic) {
  const rssUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(topic)}&format=rss&count=15`
  try {
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      cf: { cacheTtl: 300 },
    })
    if (!res.ok) return null
    const xml = await res.text()
    if (!xml.includes('<item>')) return null
    return parseRssItems(xml)
  } catch {
    return null
  }
}

function parseRssItems(xml) {
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

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
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
