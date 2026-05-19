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

  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-IN&gl=IN&ceid=IN:en`

  try {
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PersonalOS/1.0)' },
      cf: { cacheTtl: 300 }, // Cloudflare edge cache: 5 min max
    })

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Google News returned ${res.status}` }), {
        status: 502,
        headers: corsHeaders(),
      })
    }

    const xml = await res.text()

    // Parse XML on the edge — lightweight regex parsing (no DOM in Workers)
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

    return new Response(JSON.stringify({ items }), {
      headers: corsHeaders(),
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: corsHeaders(),
    })
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300', // browser caches 5 min
  }
}

function extractTag(block, tag) {
  // Handle CDATA: <title><![CDATA[Some text]]></title>
  const cdataMatch = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdataMatch) return cdataMatch[1].trim()
  // Plain text
  const plainMatch = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  if (plainMatch) return plainMatch[1].trim()
  // Self-closing or text node after tag (RSS <link> quirk)
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
