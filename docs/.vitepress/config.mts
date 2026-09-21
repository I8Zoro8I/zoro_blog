import {defineConfig} from 'vitepress'
import {nav, sidebar} from './relaConf';
// @ts-ignore
import katex from 'markdown-it-katex'
// @ts-ignore
export default defineConfig({
    lang: 'zh-CN', // 设置页面的 lang 属性
    base: '/zoro_blog/',
    // base: '/',
    //github page  '/zoro_blog/'
    cleanUrls: true, // 加上这一行
    /* 核心配置：在 HTML 的 <head> 中添加图标链接 */
    head: [
        /* 注意：因为你的项目 base 是 /zoro_blog/，路径需包含前缀 */
        [
            'link',
            {
                rel: 'stylesheet',
                href: 'https://cdn.jsdelivr.net/npm/katex@0.6.0/dist/katex.min.css'
            }
        ],
        ['link', {rel: 'icon', href: '/zoro_blog/images/logo.png'}],
        [
            'script',
            {
                src: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js'
            }
        ],
        [
            'script',
            {
                async: '',
                defer: '',
                src: 'https://cloud.umami.is/script.js', // 如果是自建，换成你的域名
                'data-website-id': '6e4a1d59-7078-490f-9521-7b833f23befe'    // 替换为实际 ID
            }
        ]
    ],
    appearance: 'dark',
    title: "zoro's Blog",// 这里将会影响之后生成的根路径
    description: "记录成长，分享技术与生活 | zoro 个人博客",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/images/avatar.png', // 表示docs/public/avatar.png
        nav: nav,
        //
        sidebar: sidebar,
        search: {

            provider: 'local'
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/vuejs/vitepress'}
        ],
        // 右侧大纲的标题映射
        outline: {
            level: [1, 4],
            label: '页面大纲',
            // @ts-ignore
            deep: true     // 开启深度按需加载/折叠
        },
        // 显示最后更新时间
        lastUpdated: {
            text: '最后更新于',
            formatOptions: {
                dateStyle: 'full',
                timeStyle: 'medium'
            } as any
        },
        // 自定义页脚
        footer: {
            message: '基于 VitePress 驱动',
            copyright: `版权所有 © 2024-${new Date().getFullYear()} Zoro`
        },
        // 文档页面的翻页按钮文字
        docFooter: {
            prev: '上一篇',
            next: '下一篇'
        },
        // 编辑链接：允许读者直接在 GitHub 上纠错
        editLink: {
            pattern: 'https://github.com/I8zoro8I/zoro_blog/edit/main/docs/:path',
            text: '在 GitHub 上编辑此页'
        },
    },
    markdown: {
        //数学公式
        math: true,
        // 代码块显示行号
        lineNumbers: true,
        // 图片配置
        image: {
            lazyLoading: true
        },
        // 将 Markdown 中容易被 Vue 当成模板语法的内容转为普通文本，优先保证文档可构建。
        config(md) {
            md.core.ruler.after('inline', 'escape-vue-template-syntax', (state) => {
                // @ts-ignore
                const voidHtmlTags = new Set([
                    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
                    'meta', 'param', 'source', 'track', 'wbr'
                ])
                // @ts-ignore
                const nativeHtmlTags = new Set([
                    'a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'blockquote',
                    'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col',
                    'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dialog', 'div',
                    'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer',
                    'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'html', 'i',
                    'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link',
                    'main', 'mark', 'menu', 'meta', 'nav', 'ol', 'option', 'p', 'picture',
                    'pre', 'q', 's', 'section', 'select', 'small', 'source', 'span', 'strong',
                    'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'textarea', 'tfoot',
                    'th', 'thead', 'time', 'tr', 'track', 'u', 'ul', 'video', 'wbr'
                ])

                const getHtmlInlineTag = (content: string) => {
                    const match = content.match(/^<\s*(\/?)\s*([a-zA-Z][\w-]*)(?:\s[^<>]*)?\/?\s*>$/)

                    if (!match) {
                        return null
                    }

                    return {
                        closing: match[1] === '/',
                        name: match[2].toLowerCase(),
                        selfClosing: /\/\s*>$/.test(content)
                    }
                }

                const hasMatchingInlineTag = (tokens: any[], index: number) => {
                    const current = getHtmlInlineTag(tokens[index].content)

                    if (!current || current.selfClosing || voidHtmlTags.has(current.name)) {
                        return true
                    }

                    const direction = current.closing ? -1 : 1
                    let depth = 0

                    for (let cursor = index + direction; cursor >= 0 && cursor < tokens.length; cursor += direction) {
                        const candidateToken = tokens[cursor]

                        if (candidateToken.type !== 'html_inline') {
                            continue
                        }

                        const candidate = getHtmlInlineTag(candidateToken.content)

                        if (!candidate || candidate.name !== current.name || candidate.selfClosing || voidHtmlTags.has(candidate.name)) {
                            continue
                        }

                        if (candidate.closing === current.closing) {
                            depth += 1
                            continue
                        }

                        if (depth === 0) {
                            return true
                        }

                        depth -= 1
                    }

                    return false
                }

                const escapeTemplateSyntax = (tokens: any[]) => {
                    for (let index = 0; index < tokens.length; index += 1) {
                        const token = tokens[index]

                        if (token.children) {
                            escapeTemplateSyntax(token.children)
                        }

                        if (token.type === 'text' || token.type === 'code_inline') {
                            token.content = token.content.replace(/\{\{/g, '&#123;&#123;')
                        }

                        // Markdown-It 识别到 HTML 并不代表 Vue 能编译它。
                        // 仅将没有闭合配对的内联标签转义，成对的真实 HTML 保持不变。
                        if (token.type === 'html_inline' && !hasMatchingInlineTag(tokens, index)) {
                            token.content = `&lt;${token.content.slice(1)}`
                        }

                        // 单独成行的非标准标签通常来自模型模板或代码示例，例如 <think>。
                        // 完整 HTML 块不进入这个分支，避免影响现有 details、表格和 SVG。
                        if (token.type === 'html_block') {
                            const standaloneTag = getHtmlInlineTag(token.content.trim())

                            if (standaloneTag && !nativeHtmlTags.has(standaloneTag.name)) {
                                token.content = token.content.replace('<', '&lt;')
                            }
                        }
                    }
                }

                escapeTemplateSyntax(state.tokens)
            })

            const defaultFence = md.renderer.rules.fence?.bind(md.renderer.rules)

            md.renderer.rules.fence = (tokens, idx, options, env, self) => {
                const token = tokens[idx]
                const language = token.info.trim().toLowerCase()

                if (language === 'html') {
                    // @ts-ignore
                    const encoded = Buffer.from(token.content, 'utf8').toString('base64')
                    return `<HtmlPreview code="${encoded}"></HtmlPreview>`
                }

                if (defaultFence) {
                    return defaultFence(tokens, idx, options, env, self)
                }

                return self.renderToken(tokens, idx, options)
            }
        }
    }
})
