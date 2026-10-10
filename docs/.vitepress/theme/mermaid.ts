type MermaidRenderResult = {
    svg: string
}

export type MermaidAPI = {
    initialize: (config: Record<string, unknown>) => void
    render: (id: string, code: string) => Promise<MermaidRenderResult>
}

const MERMAID_SRC = 'https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.min.js'
let loadPromise: Promise<MermaidAPI | null> | null = null

function getMermaid(): MermaidAPI | null {
    return (window as Window & {mermaid?: MermaidAPI}).mermaid ?? null
}

export function loadMermaid(): Promise<MermaidAPI | null> {
    const existing = getMermaid()
    if (existing) return Promise.resolve(existing)
    if (loadPromise) return loadPromise

    // 跨路由和组件实例共享加载任务，失败后允许下次重新尝试。
    loadPromise = new Promise<MermaidAPI | null>((resolve) => {
        const script = document.createElement('script')
        const finish = () => {
            window.clearTimeout(timer)
            script.onload = null
            script.onerror = null
            const mermaid = getMermaid()
            if (!mermaid) script.remove()
            resolve(mermaid)
        }
        const timer = window.setTimeout(finish, 15000)
        script.src = MERMAID_SRC
        script.async = true
        script.onload = finish
        script.onerror = finish
        document.head.appendChild(script)
    }).then((mermaid) => {
        if (!mermaid) loadPromise = null
        return mermaid
    })

    return loadPromise
}
