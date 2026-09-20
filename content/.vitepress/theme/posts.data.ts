import { createContentLoader } from 'vitepress'
export interface Post { url: string; title: string; description: string; date: string; category: string; tags: string[]; featured: boolean; cover?: string }
declare const data: Post[]
export { data }
export default createContentLoader('posts/*.md', {
  transform(raw): Post[] {
    return raw.map(({ url, frontmatter: f }) => ({ url, title: f.title, description: f.description, date: String(f.date).slice(0,10), category: f.category || '未分類', tags: f.tags || [], featured: Boolean(f.featured), cover: f.cover })).sort((a,b) => b.date.localeCompare(a.date))
  }
})
