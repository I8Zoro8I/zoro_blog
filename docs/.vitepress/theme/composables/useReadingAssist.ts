import {computed, inject, type InjectionKey, nextTick, onBeforeUnmount, onMounted, provide, ref, watch} from 'vue'
import {useData, useRoute} from 'vitepress'
import {normalizeRoutePath} from '../../shared/routes'
import {getArticleByPath} from '../contentIndex'
import {getStoredValue, setStoredValue} from '../utils/storage'

export type ReadingStats = {characterCount: number; wordCount: number; readingMinutes: number}
export type OutlineHeading = {id: string; level: number; text: string}
const OUTLINE_STORAGE_KEY = 'zblog:reading-assist:outline-collapsed:v1'
const readingKey: InjectionKey<ReturnType<typeof createReadingAssist>> = Symbol('reading-assist')

function createReadingAssist() {
    const route = useRoute()
    const {page, site} = useData()
    const headings = ref<OutlineHeading[]>([])
    const outlineCollapsed = ref(false)
    let frame: number | null = null
    let generation = 0
    const article = computed(() => getArticleByPath(normalizeRoutePath(route.path, site.value.base)))
    const isArticlePage = computed(() => Boolean(article.value))
    const stats = computed<ReadingStats>(() => article.value?.readingStats ||
        {characterCount: 0, wordCount: 0, readingMinutes: 1})
    const lastUpdated = computed(() => {
        const value = page.value.lastUpdated
        return value ? new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric', month: 'short', day: 'numeric'
        }).format(new Date(value)) : ''
    })

    async function refresh() {
        if (typeof window === 'undefined') return
        const version = ++generation
        headings.value = []
        if (frame !== null) window.cancelAnimationFrame(frame)
        await nextTick()
        if (version !== generation) return
        frame = window.requestAnimationFrame(() => {
            frame = null
            if (!isArticlePage.value || normalizeRoutePath(`/${page.value.relativePath}`, '/') !==
                normalizeRoutePath(route.path, site.value.base)) return
            headings.value = Array.from(document.querySelectorAll<HTMLElement>(
                '.VPDoc .content :is(h1, h2, h3, h4)[id]'
            )).map(heading => ({
                id: heading.id,
                level: Number(heading.tagName.slice(1)),
                text: heading.textContent?.replace(/\s+/g, ' ').trim() || ''
            })).filter(heading => heading.text)
        })
    }
    function toggleOutline() {
        outlineCollapsed.value = !outlineCollapsed.value
        setStoredValue(OUTLINE_STORAGE_KEY, String(outlineCollapsed.value))
    }
    onMounted(() => {
        outlineCollapsed.value = getStoredValue(OUTLINE_STORAGE_KEY) === 'true'
        void refresh()
    })
    watch(() => [route.path, page.value.relativePath], refresh)
    onBeforeUnmount(() => {
        generation++
        if (frame !== null) window.cancelAnimationFrame(frame)
    })
    return {headings, isArticlePage, lastUpdated, outlineCollapsed, refresh, stats, toggleOutline}
}

export function provideReadingAssist() {
    // 每个 Layout 单独持有状态，桌面与移动端共用，SSR 请求之间不会共享。
    provide(readingKey, createReadingAssist())
}

export function useReadingAssist() {
    return inject(readingKey, null) || createReadingAssist()
}
