import {execFileSync} from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createContentLoader, createMarkdownRenderer} from 'vitepress'

export type PageIndexData = {
    title?: string
    frontmatter?: Record<string, unknown>
    relativePath: string
    lastUpdated?: number
}

// VitePress 在加载数据模块时生成此导出，声明仅供 TypeScript 使用。
export declare const data: PageIndexData[]

const docsDir = path.dirname(fileURLToPath(import.meta.url))

export default createContentLoader<PageIndexData[]>('column/**/*.md', {
    includeSrc: true,
    async transform(files) {
        const md = await createMarkdownRenderer(docsDir)

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
            const tokens = md.parse(file.src || '', env)
            const headingIndex = tokens.findIndex((token) => token.tag === 'h1')
            md.renderer.render(
                headingIndex < 0 ? [] : tokens.slice(headingIndex, headingIndex + 3),
                md.options,
                env
            )

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
                    series: frontmatter.series
                },
                relativePath: normalizedPath,
                lastUpdated
            }
        })
    }
})
