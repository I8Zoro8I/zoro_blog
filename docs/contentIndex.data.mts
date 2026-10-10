import {execFileSync} from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createContentLoader, createMarkdownRenderer} from 'vitepress'
import {rawCategoriesData} from './.vitepress/relaConf/categories'
import {collectCategoryArticles} from './.vitepress/relaConf/categories/walk'
import {normalizeRoutePath} from './.vitepress/shared/routes'
import {countReadingWords, htmlToReadableText, renderReadableContent} from './.vitepress/build/readableContent'

export type PageIndexData = {
    title?: string
    frontmatter?: Record<string, unknown>
    relativePath: string
    lastUpdated?: number
    readingStats?: ReturnType<typeof countReadingWords>
}

// VitePress 在加载数据模块时生成此导出，声明仅供 TypeScript 使用。
export declare const data: PageIndexData[]

const docsDir = path.dirname(fileURLToPath(import.meta.url))

export default createContentLoader<PageIndexData[]>('column/**/*.md', {
    includeSrc: true,
    async transform(files) {
        const md = await createMarkdownRenderer(docsDir)
        const pagePaths = new Set(files.map(file => normalizeRoutePath(file.url)))
        const configuredLinks = collectCategoryArticles(rawCategoriesData).map(item => normalizeRoutePath(item.url))
        const seenLinks = new Set<string>()
        const duplicateLinks = [...new Set(configuredLinks.filter(link => {
            const duplicate = seenLinks.has(link)
            seenLinks.add(link)
            return duplicate
        }))]
        const missingLinks = [...new Set(configuredLinks.filter(link =>
            !pagePaths.has(normalizeRoutePath(link))))]
        if (duplicateLinks.length || missingLinks.length) {
            console.warn([
                '分类配置存在需要整理的路径。',
                duplicateLinks.length ? `重复链接：${duplicateLinks.join(', ')}` : '',
                missingLinks.length ? `不存在的文章路径：${missingLinks.join(', ')}` : ''
            ].filter(Boolean).join('\n'))
        }
        const configuredPaths = new Set(configuredLinks)
        const uncategorized = files.filter(file => !file.url.endsWith('/') &&
            !configuredPaths.has(normalizeRoutePath(file.url)))
        if (uncategorized.length) {
            console.warn(`未配置到分类的文章（仍可搜索）：\n${uncategorized.map(file => file.url).join('\n')}`)
        }

        return files.map((file) => {
            const frontmatter = file.frontmatter || {}
            const relativePath = file.url.endsWith('/')
                ? `${file.url}index.md`
                : `${file.url}.md`
            const normalizedPath = relativePath.replace(/^\//, '')
            const env: {title?: string; path: string; relativePath: string} = {
                path: path.resolve(docsDir, normalizedPath),
                relativePath: normalizedPath
            }
            // 只在构建时解析标题，不导入文章的 Vue 模块或输出正文。
            const readableHtml = renderReadableContent(file.src || '', env, md)

            let lastUpdated: number | undefined
            if (frontmatter.lastUpdated !== false) {
                if (frontmatter.lastUpdated instanceof Date) {
                    lastUpdated = +frontmatter.lastUpdated
                } else {
                    try {
                        const timestamp = execFileSync('git', [
                            'log', '-1', '--format=%ai', '--', normalizedPath
                        ], {cwd: docsDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim()
                        lastUpdated = Date.parse(timestamp) || undefined
                    } catch {
                        // 无 Git 环境时仍允许构建，保持无更新时间的回退行为。
                    }
                }
            }

            return {
                title: env.title,
                frontmatter: {
                    title: frontmatter.title,
                    date: frontmatter.date,
                    tags: frontmatter.tags,
                    series: frontmatter.series,
                    category: frontmatter.category,
                    group: frontmatter.group
                },
                relativePath: normalizedPath,
                lastUpdated,
                readingStats: countReadingWords(htmlToReadableText(readableHtml))
            }
        })
    }
})
