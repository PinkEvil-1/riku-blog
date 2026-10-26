import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const output = new URL('../content/.vitepress/dist/', import.meta.url)

test('public pages consistently use the Riku_Xin brand', async () => {
  for (const page of ['index.html', 'about.html', 'feed.xml']) {
    const content = await readFile(new URL(page, output), 'utf8')
    assert.match(content, /Riku_Xin/, `${page} must display the Riku_Xin brand`)
    assert.doesNotMatch(content, /Riku \/ Brian/, `${page} must not display the old combined name`)
    assert.doesNotMatch(content, /歡迎來到 Riku 的個人筆記/, `${page} must not display the old welcome name`)
  }
})
