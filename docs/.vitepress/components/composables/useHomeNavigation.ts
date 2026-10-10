import {computed, onBeforeUnmount, ref, type Ref} from 'vue'

type Node = {
    name?: string; title?: string; displayName?: string; url?: string
    children?: Node[]; links?: Node[]; items?: Node[]
}
export const getItemName = (item: Node) => item?.name || item?.title || item?.displayName || ''
const childrenOf = (item: Node) => item.children || item.links || item.items || []

export function useHomeNavigation(categories: Node[], query: Ref<string>, page: Ref<number>) {
    const currentPath = ref<string[]>([])
    const activeFolder = ref('')
    let timer: ReturnType<typeof setTimeout> | undefined
    const navigation = computed(() => {
        let display = categories
        const breadcrumbItems: {label: string; explicitIndex: number | null}[] = []
        for (const segment of currentPath.value) {
            const node = display.find(item => getItemName(item) === segment)
            if (!node) return {display: [], breadcrumbItems: []}
            breadcrumbItems.push({label: segment, explicitIndex: breadcrumbItems.length})
            display = childrenOf(node)
        }
        while (display.length === 1 && !display[0].url && childrenOf(display[0]).length) {
            const name = getItemName(display[0])
            if (!name) break
            breadcrumbItems.push({label: name, explicitIndex: null})
            display = childrenOf(display[0])
        }
        return {display, breadcrumbItems}
    })
    const cancel = () => {
        if (timer !== undefined) clearTimeout(timer)
        timer = undefined
        activeFolder.value = ''
    }
    const resetPage = () => {
        query.value = ''
        page.value = 1
    }
    const enterFolder = (name: string) => {
        cancel()
        activeFolder.value = name
        timer = setTimeout(() => {
            currentPath.value.push(name)
            resetPage()
            cancel()
        }, 120)
    }
    const goBack = () => {
        cancel()
        currentPath.value.pop()
        page.value = 1
    }
    const resetNav = () => {
        cancel()
        currentPath.value = []
        page.value = 1
    }
    const jumpToPath = (item: {explicitIndex: number | null}) => {
        if (item.explicitIndex === null) return
        cancel()
        currentPath.value = currentPath.value.slice(0, item.explicitIndex + 1)
        resetPage()
    }
    onBeforeUnmount(cancel)
    return {
        currentPath, activeFolder, enterFolder, goBack, resetNav, jumpToPath,
        currentDisplay: computed(() => navigation.value.display),
        breadcrumbItems: computed(() => navigation.value.breadcrumbItems)
    }
}
