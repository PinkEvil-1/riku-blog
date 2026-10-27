import { defineConfig, createContentLoader } from 'vitepress'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import footnote from 'markdown-it-footnote'
import { site } from './site'

const xml = (value: unknown) => String(value ?? '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!))
const cdata = (value: unknown) => String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>')
const removeLeadingTitle = (html: string) => html.replace(/^\s*<h1\b[\s\S]*?<\/h1>\s*/i, '')
const absoluteHtmlUrls = (html: string, pageUrl: string) => html.replace(/\b(href|src)="([^"]+)"/g, (match, attribute, value) => {
  if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(value)) return match
  const baseUrl = value.startsWith('/') ? site.url : pageUrl
  const path = value.startsWith('/') ? value.slice(1) : value
  return `${attribute}="${new URL(path, baseUrl).href}"`
})
export default defineConfig({
  title: site.title,
  description: site.description,
  lang: 'zh-Hant',
  base: site.base,
  cleanUrls: false,
  appearance: true,
  markdown: {
    config(md) {
      md.use(footnote)
    }
  },
  sitemap: { hostname: site.url },
  head: [
    ['link', { rel: 'icon', href: `${site.base}favicon.svg` }],
    ['link', { rel: 'alternate', type: 'application/rss+xml', title: site.title, href: `${site.base}feed.xml` }],
    ...(site.analytics.scriptUrl && site.analytics.websiteId ? [['script', { defer: '', src: site.analytics.scriptUrl, 'data-website-id': site.analytics.websiteId }] as [string, Record<string,string>]] : [])
  ],
  transformPageData(page) {
    const url = new URL(page.relativePath.replace(/index\.md$/, '').replace(/\.md$/, '.html'), site.url).href
    const title = page.frontmatter.title || page.title || site.title
    const description = page.frontmatter.description || site.description
    page.frontmatter.head = [...(page.frontmatter.head || []),
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:type', content: page.relativePath.startsWith('posts/') ? 'article' : 'website' }],
      ...(page.frontmatter.cover ? [['meta', { property: 'og:image', content: new URL(page.frontmatter.cover, url).href }]] : [])]
  },
  themeConfig: {
    nav: [{ text: '文章', link: '/' }, { text: '關於我', link: '/about' }, { text: 'RSS ↗', link: `${site.base}feed.xml` }],
    socialLinks: [{ icon: 'github', link: site.github }],
    search: { provider: 'local', options: { locales: { root: { translations: { button: { buttonText: '搜尋文章', buttonAriaLabel: '搜尋文章' }, modal: { noResultsText: '找不到相關文章', resetButtonTitle: '清除搜尋', footer: { selectText: '選擇', navigateText: '切換', closeText: '關閉' } } } } } } },
    outline: { level: [2, 3], label: '文章目錄' },
    sidebar: [],
    docFooter: { prev: '上一篇', next: '下一篇' },
    footer: { message: site.description, copyright: `© ${site.author}` }
  },
  async buildEnd(config) {
    const posts = await createContentLoader('posts/*.md', { render: true }).load()
    const items = posts.sort((a,b) => String(b.frontmatter.date).localeCompare(String(a.frontmatter.date))).map(p => {
      const url = new URL(p.url.replace(/^\//, ''), site.url).href
      const content = absoluteHtmlUrls(removeLeadingTitle(p.html || ''), url)
      return `<item><title>${xml(p.frontmatter.title)}</title><link>${xml(url)}</link><guid>${xml(url)}</guid><pubDate>${new Date(p.frontmatter.date).toUTCString()}</pubDate><description>${xml(p.frontmatter.description)}</description><content:encoded><![CDATA[${cdata(content)}]]></content:encoded></item>`
    }).join('')
    await writeFile(join(config.outDir, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>${xml(site.title)}</title><link>${xml(site.url)}</link><description>${xml(site.description)}</description><language>zh-TW</language>${items}</channel></rss>`)
  }
})
