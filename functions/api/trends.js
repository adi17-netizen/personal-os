// Cloudflare Pages Function — fetches Google Trends RSS and returns parsed JSON
// Deployed automatically at /api/trends

export async function onRequestGet() {
  const rssUrl = 'https://trends.google.com/trending/rss?geo=IN'

  try {
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PersonalOS/1.0)' },
      cf: { cacheTtl: 300 },
    })

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Google Trends returned ${res.status}` }), {
        status: 502,
        headers: corsHeaders(),
      })
    }

    const xml = await res.text()

    const items = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
      const block = match[1]
      const traffic = extractTag(block, 'ht:approx_traffic') || extractTag(block, 'approx_traffic')
      items.push({
        title: extractTag(block, 'title'),
        link: extractTag(block, 'link'),
        traffic: traffic ? `${traffic} searches` : '',
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
    'Cache-Control': 'public, max-age=300',
  }
}

function extractTag(block, tag) {
  const cdataMatch = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  if (plainMatch) return plainMatch[1].trim()
  return ''
}
