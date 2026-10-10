import {computed, type Ref} from 'vue'

type Item = {isDoc?: boolean; url?: string}
type Range = {start: number; end: number}

export function buildPageRanges(
    items: Item[], columns: number, height: number, mode: string
): Range[] {
    if (!items.length) return [{start: 0, end: 0}]
    const ranges: Range[] = []
    const dynamic = columns > 0 && height > 0
    const sectionHeight = (count: number) => {
        if (!count) return 0
        const rows = Math.ceil(count / (mode === 'list' ? 1 : columns))
        const gap = mode === 'list' ? 8 : 16
        return rows * (mode === 'list' ? 52 : 90) + (rows - 1) * gap
    }
    let start = 0
    let folders = 0
    let docs = 0
    for (let end = 0; end < items.length; end++) {
        const isDoc = Boolean(items[end].isDoc || items[end].url)
        const nextFolders = folders + (isDoc ? 0 : 1)
        const nextDocs = docs + (isDoc ? 1 : 0)
        const fits = dynamic
            ? sectionHeight(nextFolders) + sectionHeight(nextDocs) +
                (nextFolders && nextDocs ? 24 : 0) <= height + 36
            : end - start < 12
        // 容器过小时也保证每页至少显示一项。
        if (!fits && end > start) {
            ranges.push({start, end})
            start = end
            folders = 0
            docs = 0
        }
        if (isDoc) docs++
        else folders++
    }
    ranges.push({start, end: items.length})
    return ranges
}

export function useHomePagination(
    items: Ref<Item[]>, page: Ref<number>, columns: Ref<number>, height: Ref<number>, mode: Ref<string>
) {
    const ranges = computed(() => buildPageRanges(items.value, columns.value, height.value, mode.value))
    const totalPages = computed(() => ranges.value.length)
    const pagedDisplay = computed(() => {
        const range = ranges.value[page.value - 1] || ranges.value[0]
        return items.value.slice(range.start, range.end)
    })
    return {
        totalPages,
        pagedDisplay,
        pagedFolders: computed(() => pagedDisplay.value.filter(item => !item.isDoc && !item.url)),
        pagedDocs: computed(() => pagedDisplay.value.filter(item => item.isDoc || item.url))
    }
}
