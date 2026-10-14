/**
 * Post-build pre-renderer.
 *
 *  1. Server-renders every route (home, catalogue, contact, each product)
 *     into dist/<route>/index.html — full page content in the HTML, so
 *     crawlers and no-JS visitors see products and copy; the client hydrates.
 *  2. Writes per-route <title>, description, canonical / robots and Open
 *     Graph tags (same source as the runtime hook: src/seo/meta.js).
 *  3. Writes dist/404.html (noindex), sitemap.xml and robots.txt.
 *
 * Adapted from the Water-Treatment project's prerender step.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')

const { render, metaFor, fullTitle, STATIC_ROUTES, STORE } = await import(
  pathToFileURL(join(ssrDir, 'entry-server.js')).href
)

const escape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const template = readFileSync(join(dist, 'index.html'), 'utf8')
for (const marker of ['<!--meta-->', '<!--app-->', '<div id="root">']) {
  if (!template.includes(marker)) throw new Error(`dist/index.html is missing ${marker}`)
}

function headFor(path, m) {
  const title = fullTitle(m)
  const url = `${STORE.siteUrl}${path}`
  return [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(m.description)}" />`,
    m.noindex
      ? '<meta name="robots" content="noindex, follow" />'
      : `<meta name="robots" content="index, follow" />\n    <link rel="canonical" href="${escape(url)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${escape(STORE.name)}" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(m.description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    '<meta property="og:locale" content="en_IN" />',
    '<meta name="twitter:card" content="summary" />',
  ].join('\n    ')
}

function page(path, { renderPath = path, hydrate = true } = {}) {
  const m = metaFor(renderPath)
  const html = render(renderPath)
  return template
    .replace(/<!--meta-->[\s\S]*?<!--\/meta-->/, headFor(path, m))
    .replace('<div id="root">', hydrate ? `<div id="root" data-prerendered="${escape(path)}">` : '<div id="root">')
    .replace('<!--app-->', html)
}

const written = []
for (const path of STATIC_ROUTES) {
  const file = path === '/' ? 'index.html' : join(path.slice(1), 'index.html')
  const out = join(dist, file)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, page(path))
  written.push(file)
}

// Unknown URLs: static hosts serve this with a 404 status; it renders the
// app's not-found page and the client re-renders for the actual URL.
writeFileSync(join(dist, '404.html'), page('/404', { renderPath: '/__not_found__', hydrate: false }))
written.push('404.html')

const today = new Date().toISOString().slice(0, 10)
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_ROUTES.map((p) => `  <url><loc>${STORE.siteUrl}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`,
)
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${STORE.siteUrl}/sitemap.xml\n`)

rmSync(ssrDir, { recursive: true, force: true })

console.log(`\nprerender: wrote ${written.length} HTML files, sitemap.xml (${STATIC_ROUTES.length} URLs), robots.txt`)
if (STORE.siteUrl.includes('example.com')) {
  console.warn('prerender: STORE.siteUrl is still the placeholder https://www.example.com — set it in src/data/store.js')
}
if (STORE.isPlaceholder) {
  console.warn('prerender: STORE.isPlaceholder is true — structured data (JSON-LD) is disabled until real details are set')
}
