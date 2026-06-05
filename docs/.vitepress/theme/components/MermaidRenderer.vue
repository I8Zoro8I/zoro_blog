<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, watch} from 'vue'
import {useData, useRoute} from 'vitepress'

type MermaidRenderResult = {
    svg: string
}

type MermaidAPI = {
    initialize: (config: Record<string, unknown>) => void
    render: (id: string, code: string) => Promise<MermaidRenderResult>
}

const route = useRoute()
const {isDark} = useData()

let renderVersion = 0
let pendingTimer: number | null = null

function getMermaid(): MermaidAPI | null {
    return (window as Window & {mermaid?: MermaidAPI}).mermaid ?? null
}

async function waitForMermaid(maxRetries = 40): Promise<MermaidAPI | null> {
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
        const mermaid = getMermaid()
        if (mermaid) {
            return mermaid
        }

        await new Promise((resolve) => window.setTimeout(resolve, 250))
    }

    return null
}

async function renderMermaidDiagrams() {
    const mermaid = await waitForMermaid()
    if (!mermaid) {
        return
    }

    const blocks = Array.from(document.querySelectorAll<HTMLElement>('.vp-doc div[class*="language-mermaid"]'))
    if (!blocks.length) {
        return
    }

    const currentVersion = ++renderVersion

    mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: isDark.value ? 'dark' : 'default'
    })

    await Promise.all(blocks.map(async (block, index) => {
        const source = block.dataset.mermaidSource ?? block.querySelector('code')?.textContent ?? ''
        if (!source.trim()) {
            return
        }

        block.dataset.mermaidSource = source
        block.classList.add('mermaid-host')

        let surface = block.querySelector<HTMLElement>('.mermaid-diagram')
        if (!surface) {
            block.innerHTML = '<div class="mermaid-diagram" aria-label="Mermaid diagram"></div>'
            surface = block.querySelector<HTMLElement>('.mermaid-diagram')
        }

        if (!surface) {
            return
        }

        try {
            const {svg} = await mermaid.render(`vp-mermaid-${currentVersion}-${index}`, source)
            if (currentVersion !== renderVersion) {
                return
            }

            surface.classList.remove('mermaid-error')
            surface.innerHTML = svg
        } catch (error) {
            surface.innerHTML = ''
            surface.classList.add('mermaid-error')

            const errorBlock = document.createElement('pre')
            errorBlock.textContent = [
                'Mermaid 渲染失败：',
                error instanceof Error ? error.message : String(error)
            ].join('\n')

            surface.append(errorBlock)
        }
    }))
}

function scheduleRender() {
    if (pendingTimer !== null) {
        window.clearTimeout(pendingTimer)
    }

    pendingTimer = window.setTimeout(() => {
        pendingTimer = null
        void nextTick(() => renderMermaidDiagrams())
    }, 0)
}

onMounted(() => {
    scheduleRender()
})

watch(() => route.path, () => {
    scheduleRender()
})

watch(isDark, () => {
    scheduleRender()
})

onBeforeUnmount(() => {
    if (pendingTimer !== null) {
        window.clearTimeout(pendingTimer)
    }
})
</script>

<template>
    <div aria-hidden="true" class="mermaid-render-anchor"></div>
</template>
