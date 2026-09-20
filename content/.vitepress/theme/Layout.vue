<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData, withBase } from 'vitepress'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { data as posts } from './posts.data'
import { site } from '../site'
const URL = globalThis.URL
const { frontmatter, page, isDark } = useData()
const query = ref(''), category = ref('全部'), tag = ref('全部'), current = ref(1)
const color = ref('#087eaf'), mode = ref('system'), progress = ref(0)
const categories = computed(() => ['全部', ...new Set(posts.map(p => p.category))])
const tags = computed(() => ['全部', ...new Set(posts.flatMap(p => p.tags))])
const filtered = computed(() => posts.filter(p => (category.value === '全部' || p.category === category.value) && (tag.value === '全部' || p.tags.includes(tag.value)) && `${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase().includes(query.value.toLowerCase())))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 6)))
const visible = computed(() => filtered.value.slice((current.value - 1) * 6, current.value * 6))
const featured = computed(() => posts.find(p => p.featured))
watch([query, category, tag], () => current.value = 1)
let media: MediaQueryList | undefined
function applyMode() { isDark.value = mode.value === 'dark' || (mode.value === 'system' && !!media?.matches) }
function save() { try { localStorage.setItem('riku-theme', JSON.stringify({ color: color.value, mode: mode.value })) } catch {} }
function paint() {
  if (!/^#[\da-f]{6}$/i.test(color.value)) return
  // Mix with black/white to keep custom accents readable in both modes.
  const root = document.documentElement.style
  root.setProperty('--riku-color', color.value)
  save()
}
function setMode() { applyMode(); save() }
function scrollProgress() {
  const article = document.querySelector('.vp-doc')
  if (!article) { progress.value = 0; return }
  const top = article.getBoundingClientRect().top + window.scrollY
  const length = article.scrollHeight - window.innerHeight
  progress.value = length <= 0 ? 100 : Math.min(100, Math.max(0, (window.scrollY - top) / length * 100))
}
watch(() => page.value.relativePath, async () => { await nextTick(); scrollProgress() })
onMounted(() => {
  media = matchMedia('(prefers-color-scheme: dark)')
  try { const saved = JSON.parse(localStorage.getItem('riku-theme') || '{}'); if (/^#[\da-f]{6}$/i.test(saved.color)) color.value = saved.color; if (['light','dark','system'].includes(saved.mode)) mode.value = saved.mode } catch {}
  applyMode(); paint(); scrollProgress()
  media.addEventListener('change', applyMode)
  window.addEventListener('scroll', scrollProgress, { passive: true })
  window.addEventListener('resize', scrollProgress)
})
onUnmounted(() => { media?.removeEventListener('change', applyMode); window.removeEventListener('scroll', scrollProgress); window.removeEventListener('resize', scrollProgress) })
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-top><div v-if="page.relativePath.startsWith('posts/')" class="reading-progress" :style="{ width: progress + '%' }" aria-hidden="true" /></template>
    <template #nav-bar-content-after>
      <details class="theme-picker"><summary>配色</summary><div class="theme-panel">
        <strong>閱讀，照你的喜好。</strong>
        <label>顯示模式<select v-model="mode" @change="setMode"><option value="system">跟隨系統</option><option value="light">淺色</option><option value="dark">深色</option></select></label>
        <div class="swatches"><button v-for="(c, i) in ['#087eaf','#268354','#bd601e','#8256ce','#627181']" :key="c" :aria-label="['海洋藍','森林綠','暖橘','紫羅蘭','黑白灰'][i]" :style="{ background: c }" :aria-pressed="color === c" @click="color = c; paint()" /></div>
        <label>自訂主色<input v-model="color" type="color" @input="paint" /></label>
      </div></details>
    </template>
    <template #home-hero-before>
      <main class="blog-home">
        <section class="intro">
          <div><p class="eyebrow">PERSONAL LOG / {{ site.author }}</p><h1>把探索的過程，<br>寫成下一步的<span>線索。</span></h1><p class="intro-copy">{{ site.description }}<br>歡迎來到 Riku 的個人筆記。</p><div class="intro-links"><a class="primary-link" href="#articles">閱讀文章 ↓</a><a :href="withBase('/about.html')">關於我 ↗</a></div></div>
          <div class="identity"><span class="mono">~/riku-blog</span><div class="monogram">R<span>.</span></div><div class="identity-bottom"><span>Riku / Brian</span><span class="mono">NOTES & IDEAS</span></div></div>
        </section>
        <a v-if="featured" class="featured" :href="withBase(featured.url)"><span class="eyebrow">PINNED / 精選文章</span><h2>{{ featured.title }}</h2><p>{{ featured.description }}</p><span class="mono">READ NOTE ↗</span></a>
        <section id="articles" class="articles"><div class="section-heading"><h2>文章<span class="count">{{ posts.length.toString().padStart(2,'0') }}</span></h2><span class="mono">THE LEARNING CONTINUES</span></div>
          <div class="filters"><label class="search-label">搜尋文章<input v-model="query" type="search" placeholder="搜尋標題、摘要、標籤…" /></label><label>分類<select v-model="category"><option v-for="c in categories" :key="c">{{ c }}</option></select></label><label>標籤<select v-model="tag"><option v-for="t in tags" :key="t">{{ t }}</option></select></label></div>
          <p class="result-count" aria-live="polite">{{ filtered.length }} 篇文章</p>
          <div class="post-grid"><article v-for="p in visible" :key="p.url" class="post-card"><a :href="withBase(p.url)"><img v-if="p.cover" :src="new URL(p.cover, new URL(p.url.replace(/^\//, ''), site.url)).href" alt="" loading="lazy" /><div class="post-meta"><span>{{ p.category }}</span><time :datetime="p.date">{{ p.date }}</time></div><h3>{{ p.title }}</h3><p>{{ p.description }}</p><div class="post-bottom"><span>{{ p.tags.map(t => '#' + t).join(' ') }}</span><span aria-hidden="true">↗</span></div></a></article></div>
          <div v-if="!filtered.length" class="empty"><h3>還沒有符合的文章</h3><button @click="query = ''; category = '全部'; tag = '全部'">清除篩選</button></div>
          <nav v-if="pages > 1" class="pagination" aria-label="文章分頁"><button :disabled="current === 1" @click="current--">上一頁</button><span>{{ current }} / {{ pages }}</span><button :disabled="current === pages" @click="current++">下一頁</button></nav>
        </section>
      </main>
    </template>
    <template #doc-before><div v-if="frontmatter.date" class="article-meta"><a :href="withBase('/')">← 所有文章</a><p>{{ String(frontmatter.date).slice(0,10) }} · {{ frontmatter.category }}</p></div></template>
  </DefaultTheme.Layout>
</template>
