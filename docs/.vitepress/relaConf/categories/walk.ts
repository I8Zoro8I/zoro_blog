import type {CategoryConfig} from './types'

type Node = {
    name?: string; title?: string; url?: string
    children?: Node[]; links?: Node[]; items?: Node[]
}
export type CategoryArticle = {url: string; category: string; group: string; series: string}

export function collectCategoryArticles(data: {categories: CategoryConfig[]}): CategoryArticle[] {
    const result: CategoryArticle[] = []
    function walk(node: Node, category: string, group: string, series: string) {
        if (node.url) result.push({url: node.url, category, group, series: series || group})
        for (const child of node.children || []) walk(child, category, child.name || group, series)
        for (const child of node.links || []) walk(child, category, group, series)
        for (const child of node.items || []) walk(child, category, group, node.title || series)
    }
    for (const category of data.categories) walk(category, category.name, '', '')
    return result
}
