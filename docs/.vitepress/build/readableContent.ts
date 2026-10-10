import {Parser} from 'htmlparser2'
import type {MarkdownRenderer} from 'vitepress'

type Token = ReturnType<MarkdownRenderer['parse']>[number]
const excludedTags = new Set(['pre', 'script', 'style', 'svg', 'math', 'button', 'iframe'])
const isExcluded = (name: string, attributes: Record<string, string>) =>
    excludedTags.has(name) || attributes['aria-hidden'] === 'true' || 'hidden' in attributes ||
    /(?:^|\s)(?:header-anchor|docsify-copy-code-button)(?:\s|$)/.test(attributes.class || '')

export function htmlToReadableText(html: string): string {
    const parts: string[] = []
    const stack: boolean[] = []
    let excluded = 0
    const parser = new Parser({
        onopentag(name, attributes) {
            const skip = isExcluded(name, attributes)
            stack.push(skip)
            if (skip) excluded += 1
            if (!excluded) parts.push(' ')
        },
        ontext(text) {
            if (!excluded) parts.push(text)
        },
        onclosetag() {
            if (stack.pop()) excluded -= 1
            if (!excluded) parts.push(' ')
        }
    }, {decodeEntities: true})
    parser.write(html)
    parser.end()
    return parts.join('').replace(/\s+/g, ' ').trim()
}

export function htmlToSearchContent(html: string, escape: (value: string) => string): string {
    const parts: string[] = []
    const stack: {excluded: boolean; tag: string | null; anchor?: string}[] = []
    let excluded = 0
    const parser = new Parser({
        onopentag(name, attributes) {
            const skip = isExcluded(name, attributes)
            if (skip) excluded++
            const tag = !excluded && /^(?:h[1-6]|p|div|li|ul|ol|blockquote|table|tr|td|th|br)$/.test(name)
                ? name : null
            const anchor = tag && /^h[1-6]$/.test(tag) ? attributes.id : undefined
            stack.push({excluded: skip, tag, anchor})
            if (tag) {
                const id = /^h[1-6]$/.test(tag) && attributes.id ? ` id="${escape(attributes.id)}"` : ''
                parts.push(`<${tag}${id}>`)
            }
        },
        ontext(text) {
            if (!excluded) parts.push(escape(text))
        },
        onclosetag() {
            const node = stack.pop()
            // VitePress 默认分节器使用标题内的锚点链接识别章节。
            if (node?.anchor) parts.push(`<a href="#${escape(node.anchor)}"></a>`)
            if (node?.tag && node.tag !== 'br') parts.push(`</${node.tag}>`)
            if (node?.excluded) excluded--
        }
    }, {decodeEntities: true})
    parser.write(html)
    parser.end()
    return parts.join('')
}

function inlineText(token: Token): string {
    if (token.children) return token.children.map(inlineText).join('')
    if (token.type === 'html_inline') return token.content
    if (token.type === 'text' || token.type === 'code_inline') return token.content
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    if (token.type === 'softbreak' || token.type === 'hardbreak') return ' '
    return ''
}

export function readableTextFromTokens(tokens: Token[]): string {
    return tokens.map(token => token.type === 'inline' ? htmlToReadableText(inlineText(token))
        : token.type === 'html_block' ? htmlToReadableText(token.content) : '')
        .join(' ').replace(/\s+/g, ' ').trim()
}

export function countReadingWords(text: string) {
    const characterCount = text.match(/[\u3400-\u9fff]/g)?.length || 0
    const wordCount = text.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length || 0
    return {characterCount, wordCount, readingMinutes: Math.max(1, Math.ceil(characterCount / 400 + wordCount / 200))}
}

export function renderReadableContent(src: string, env: Record<string, any>, md: MarkdownRenderer): string {
    const rules = md.renderer.rules
    const excluded = ['fence', 'code_block', ...Object.keys(rules).filter(name => name.startsWith('math'))]
    const originals = excluded.map(name => rules[name])
    try {
        // 使用完整 render 保留 VitePress 的 frontmatter、标题和 SFC 处理。
        // 同步调用结束后恢复规则，不改变正常文章渲染。
        for (const name of excluded) rules[name] = () => ''
        return htmlToSearchContent(md.render(src, env), md.utils.escapeHtml)
    } finally {
        excluded.forEach((name, index) => {
            if (originals[index]) rules[name] = originals[index]
            else delete rules[name]
        })
    }
}

export function renderSearchContent(src: string, env: Record<string, any>, md: MarkdownRenderer): string {
    const html = renderReadableContent(src, env, md)
    return env.frontmatter?.search === false ? '' : html
}
