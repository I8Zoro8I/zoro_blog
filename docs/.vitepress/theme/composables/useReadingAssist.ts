import {computed, nextTick, onBeforeUnmount, onMounted, ref, type Ref, watch} from 'vue'
import {useData, useRoute} from 'vitepress'

export type ReadingStats = {
  characterCount: number
  wordCount: number
  readingMinutes: number
}

export type OutlineHeading = {
  id: string
  level: number
  text: string
}

const OUTLINE_STORAGE_KEY = 'zblog:reading-assist:outline-collapsed:v1'
const CJK_RE = /[㐀-鿿豈-﫿]/g
const WORD_RE = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g

function canUseDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function readCollapsedState() {
  try {
    return window.localStorage.getItem(OUTLINE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function writeCollapsedState(value: boolean) {
  try {
    window.localStorage.setItem(OUTLINE_STORAGE_KEY, String(value))
  } catch {
    // 隐私模式或存储被禁用时保持当前会话状态。
  }
}

function collectReadableText() {
  const content = document.querySelector<HTMLElement>('.VPDoc .content')
  if (!content) return ''

  const clone = content.cloneNode(true) as HTMLElement
  clone.querySelectorAll('script, style, pre, .header-anchor, .reading-progress-notice').forEach((node) => node.remove())
  return clone.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function calculateStats(): ReadingStats {
  const text = collectReadableText()
  const characterCount = text.match(CJK_RE)?.length ?? 0
  const wordCount = text.replace(CJK_RE, ' ').match(WORD_RE)?.length ?? 0

  return {
    characterCount,
    wordCount,
    readingMinutes: Math.max(1, Math.ceil(characterCount / 400 + wordCount / 200))
  }
}

function collectHeadings(): OutlineHeading[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.VPDoc .content :is(h1, h2, h3, h4)[id]'))
    .map((heading) => ({
      id: heading.id,
      level: Number(heading.tagName.slice(1)),
      text: heading.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    }))
    .filter((heading) => heading.text)
}

export function useReadingAssist() {
  const route = useRoute()
  const {page, site} = useData()
  const stats = ref<ReadingStats>({characterCount: 0, wordCount: 0, readingMinutes: 1})
  const headings = ref<OutlineHeading[]>([])
  const outlineCollapsed = ref(false)
  let refreshFrame: number | null = null

  const normalizedPath = computed(() => {
    const base = site.value.base === '/' ? '' : site.value.base.replace(/\/$/, '')
    return base && route.path.startsWith(`${base}/`) ? route.path.slice(base.length) : route.path
  })

  const isArticlePage = computed(() => normalizedPath.value.startsWith('/column/') && !normalizedPath.value.endsWith('/'))

  const lastUpdated = computed(() => {
    const value = page.value.lastUpdated
    if (!value) return ''

    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(value))
  })

  function refresh() {
    if (!canUseDom() || !isArticlePage.value) {
      headings.value = []
      return
    }

    stats.value = calculateStats()
    headings.value = collectHeadings()
  }

  function scheduleRefresh() {
    if (!canUseDom()) return
    if (refreshFrame !== null) window.cancelAnimationFrame(refreshFrame)
    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = null
      void nextTick(refresh)
    })
  }

  function toggleOutline() {
    outlineCollapsed.value = !outlineCollapsed.value
    writeCollapsedState(outlineCollapsed.value)
  }

  onMounted(() => {
    outlineCollapsed.value = readCollapsedState()
    scheduleRefresh()
  })

  watch(() => route.path, scheduleRefresh)

  onBeforeUnmount(() => {
    if (refreshFrame !== null) window.cancelAnimationFrame(refreshFrame)
  })

  return {
    headings: headings as Ref<OutlineHeading[]>,
    isArticlePage,
    lastUpdated,
    outlineCollapsed,
    refresh: scheduleRefresh,
    stats: stats as Ref<ReadingStats>,
    toggleOutline
  }
}
