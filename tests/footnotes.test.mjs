import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'

const output = new URL('../content/.vitepress/dist/', import.meta.url)
const posts = new URL('../content/posts/', import.meta.url)

test('Markdown footnotes render as linked references and definitions', async () => {
  const articleFiles = (await readdir(posts)).filter(name => name.endsWith('.md'))
  let articlesWithFootnotes = 0

  for (const name of articleFiles) {
    const markdown = await readFile(new URL(name, posts), 'utf8')
    const references = [...markdown.matchAll(/\[\^([^\]\s]+)\](?!:)/g)].map(match => match[1])
    if (references.length === 0) continue
    articlesWithFootnotes++

    const definitions = new Set(
      [...markdown.matchAll(/^\[\^([^\]]+)\]:/gm)].map(match => match[1]),
    )
    for (const reference of references) {
      assert.ok(definitions.has(reference), `${name} must define footnote [^${reference}]`)
    }

    const htmlName = name.replace(/\.md$/, '.html')
    const html = await readFile(new URL(`posts/${htmlName}`, output), 'utf8')
    assert.match(html, /class="footnote-ref"/, `${name} must render footnote references`)
    assert.match(html, /class="footnotes"/, `${name} must render footnote definitions`)
  }

  assert.ok(articlesWithFootnotes > 0, 'At least one article must exercise footnote rendering')
})
