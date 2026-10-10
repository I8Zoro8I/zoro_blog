import {siteBase} from '../relaConf/site'

export function normalizeRoutePath(value: string, base = siteBase): string {
    let normalized = value.split(/[?#]/, 1)[0].replace(/\\/g, '/')
    try {
        normalized = decodeURIComponent(normalized)
    } catch {
        // 不完整的百分号转义仍可作为普通路径使用。
    }
    const prefix = base === '/' ? '' : base.replace(/\/$/, '')
    if (prefix && normalized === prefix) normalized = '/'
    else if (prefix && normalized.startsWith(`${prefix}/`)) normalized = normalized.slice(prefix.length)
    normalized = normalized.replace(/\/index\.(?:html|md)$/, '/').replace(/\.(?:html|md)$/, '')
    return normalized.length > 1 ? normalized.replace(/\/$/, '') : normalized || '/'
}
