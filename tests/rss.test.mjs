import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const output = new URL('../content/.vitepress/dist/', import.meta.url)

test('RSS links resolve to the generated feed under the deployment base', async () => {
  const feed = await readFile(new URL('feed.xml', output), 'utf8')
  assert.match(feed, /<rss version="2\.0" xmlns:content="http:\/\/purl\.org\/rss\/1\.0\/modules\/content\/">/)
  assert.match(feed, /<item>/)
  const channelUrl = feed.match(/<channel>.*?<link>(.*?)<\/link>/s)?.[1]
  assert.ok(channelUrl, 'RSS channel must contain the website URL')
  const expected = new URL('feed.xml', channelUrl).href

  for (const page of ['index.html', 'about.html']) {
    const html = await readFile(new URL(page, output), 'utf8')
    const links = [...html.matchAll(/href="([^"]*feed\.xml[^"]*)"/g)]
    assert.ok(links.length >= 2, `${page} must contain discovery and navigation RSS links`)
    for (const [, href] of links) {
      assert.equal(new URL(href, new URL(page, channelUrl)).href, expected)
    }
  }
})

test('RSS items include full rendered article content', async () => {
  const feed = await readFile(new URL('feed.xml', output), 'utf8')
  const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => match[1])

  assert.ok(items.length > 0, 'RSS must contain at least one article')
  for (const item of items) {
    assert.match(item, /<description>.+?<\/description>/s, 'RSS item must retain its summary')
    const content = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1]
    assert.ok(content, 'RSS item must contain full rendered HTML')
    assert.match(content, /<(?:h1|h2|h3|p)(?:\s|>)/, 'RSS content must contain rendered article markup')

    for (const [, attribute, value] of content.matchAll(/\b(href|src)="([^"]+)"/g)) {
      assert.match(value, /^(?:https?:|mailto:|tel:|data:|#)/, `${attribute} must be absolute or self-contained: ${value}`)
    }
  }

  assert.match(feed, /第一次發現身體的訊號/, 'RSS must include the body of the latest article')
})
