import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const output = new URL('../content/.vitepress/dist/', import.meta.url)

test('RSS links resolve to the generated feed under the deployment base', async () => {
  const feed = await readFile(new URL('feed.xml', output), 'utf8')
  assert.match(feed, /<rss version="2\.0">/)
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
