import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'

const output = new URL('../content/.vitepress/dist/', import.meta.url)
const posts = new URL('../content/posts/', import.meta.url)

async function findHtmlFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory)
    if (entry.isDirectory()) files.push(...await findHtmlFiles(url))
    else if (entry.name.endsWith('.html')) files.push(url)
  }
  return files
}

test('RSS links resolve to the generated feed under the deployment base', async () => {
  const feed = await readFile(new URL('feed.xml', output), 'utf8')
  assert.match(feed, /<rss version="2\.0" xmlns:content="http:\/\/purl\.org\/rss\/1\.0\/modules\/content\/">/)
  assert.match(feed, /<item>/)
  const channelUrl = feed.match(/<channel>.*?<link>(.*?)<\/link>/s)?.[1]
  assert.ok(channelUrl, 'RSS channel must contain the website URL')
  const expected = new URL('feed.xml', channelUrl).href

  const pages = await findHtmlFiles(output)
  assert.ok(pages.length > 0, 'Build output must contain HTML pages')
  let pagesWithFeed = 0
  for (const page of pages) {
    const html = await readFile(page, 'utf8')
    if (!html.includes('rel="alternate" type="application/rss+xml"')) continue
    pagesWithFeed++
    const links = [...html.matchAll(/href="([^"]*feed\.xml[^"]*)"/g)]
    assert.ok(links.length >= 1, `${page.pathname} must contain an RSS link`)
    const publicPageUrl = new URL(page.href.slice(output.href.length), channelUrl)
    for (const [, href] of links) {
      assert.equal(new URL(href, publicPageUrl).href, expected)
    }
  }
  assert.ok(pagesWithFeed > 0, 'Build output must contain pages with RSS discovery metadata')
})

test('RSS items include full rendered article content', async () => {
  const feed = await readFile(new URL('feed.xml', output), 'utf8')
  const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => match[1])
  const articleFiles = (await readdir(posts)).filter(name => name.endsWith('.md'))

  assert.equal(items.length, articleFiles.length, 'RSS must contain every published article')
  for (const item of items) {
    assert.match(item, /<title>.+?<\/title>/s, 'RSS item must retain its title')
    assert.match(item, /<description>.+?<\/description>/s, 'RSS item must retain its summary')
    const content = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1]
    assert.ok(content, 'RSS item must contain full rendered HTML')
    assert.doesNotMatch(content, /^\s*<h1\b/i, 'RSS content must not repeat the item title')
    assert.ok(content.trim().length > 0, 'RSS content must not be empty')

    for (const [, attribute, value] of content.matchAll(/\b(href|src)="([^"]+)"/g)) {
      assert.match(value, /^(?:https?:|mailto:|tel:|data:|#)/, `${attribute} must be absolute or self-contained: ${value}`)
    }
  }
})
