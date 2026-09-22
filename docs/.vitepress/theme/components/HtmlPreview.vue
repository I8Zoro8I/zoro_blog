<template>
  <div class="html-preview">
    <div class="html-preview__header">
      <span class="html-preview__title">{{ isCodeVisible ? 'HTML 源码' : '实时预览' }}</span>
      <div class="html-preview__actions">
        <button
          v-if="isCodeVisible"
          class="html-preview__copy"
          type="button"
          :aria-label="copyStatus === 'copied' ? 'HTML 源码已复制' : '复制 HTML 源码'"
          @click="copySource"
        >
          {{ copyStatus === 'copied' ? '已复制' : copyStatus === 'failed' ? '复制失败' : '复制代码' }}
        </button>
        <button class="html-preview__toggle" type="button" @click="toggleView">
          {{ isCodeVisible ? '返回预览' : '查看代码' }}
        </button>
      </div>
    </div>
    <div class="html-preview__body">
      <p class="html-preview__status" aria-live="polite">{{ copyStatusMessage }}</p>
      <pre v-if="isCodeVisible" class="html-preview__source"><code>{{ html }}</code></pre>
      <div
        v-else-if="hasRenderableHtml"
        ref="viewportRef"
        class="html-preview__viewport"
        :style="{ '--html-preview-padding': `${PREVIEW_PADDING}px` }"
      >
        <div ref="canvasRef" class="html-preview__canvas">
          <iframe
            ref="iframeRef"
            class="html-preview__frame"
            :srcdoc="srcdoc"
            loading="lazy"
            scrolling="no"
            sandbox="allow-same-origin"
            title="HTML preview"
            @load="handleFrameLoad"
          />
        </div>
      </div>
      <div v-else class="html-preview__empty"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'

const props = defineProps<{
  code: string
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const viewportRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLDivElement | null>(null)
const isCodeVisible = ref(false)
const copyStatus = ref<'idle' | 'copied' | 'failed'>('idle')
const copyStatusMessage = computed(() => {
  if (copyStatus.value === 'copied') return 'HTML 源码已复制'
  if (copyStatus.value === 'failed') return '复制失败，请手动选择源码复制'
  return ''
})
let frameResizeObserver: ResizeObserver | null = null
let viewportResizeObserver: ResizeObserver | null = null
let syncRafId: number | null = null
let copyStatusTimer: number | null = null

const MIN_LAYOUT_WIDTH = 1200
const PREVIEW_PADDING = 20
const PREVIEW_HEIGHT_BUFFER = 12

function decodeBase64Utf8(value: string): string {
  const binary = atob(value)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const html = computed(() => decodeBase64Utf8(props.code))
const hasRenderableHtml = computed(() => html.value.trim().length > 0)

const srcdoc = computed(() => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: transparent;
    }
  </style>
</head>
<body>
<div id="html-preview-root">${html.value}</div>
</body>
</html>`)

function getPreviewRoot(doc: Document) {
  return doc.getElementById('html-preview-root') as HTMLElement | null
}

function resolvePreviewBackground(doc: Document) {
  const previewRoot = getPreviewRoot(doc)
  const candidates = [
    previewRoot,
    ...Array.from(doc.body.children)
  ].filter((element): element is HTMLElement => element instanceof HTMLElement)

  for (const element of candidates) {
    const color = window.getComputedStyle(element).backgroundColor

    if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
      return color
    }
  }

  return '#222'
}

function measurePreviewBounds(doc: Document) {
  const previewRoot = getPreviewRoot(doc)
  const measurementRoot = previewRoot ?? doc.body

  if (!measurementRoot) {
    return {
      minLeft: 0,
      minTop: 0,
      maxRight: 1,
      maxBottom: 1,
      width: 1,
      height: 1
    }
  }

  const rootRect = measurementRoot.getBoundingClientRect()
  const allCandidates = [
    measurementRoot,
    ...Array.from(measurementRoot.querySelectorAll('*'))
  ]

  const contentCandidates = allCandidates.filter((element) => {
    return element !== measurementRoot && element !== doc.body && element !== doc.documentElement
  })

  const candidates = contentCandidates.length ? contentCandidates : allCandidates

  let minLeft = Number.POSITIVE_INFINITY
  let minTop = Number.POSITIVE_INFINITY
  let maxRight = Number.NEGATIVE_INFINITY
  let maxBottom = Number.NEGATIVE_INFINITY

  for (const element of candidates) {
    const rect = element.getBoundingClientRect()

    if (!rect.width && !rect.height) {
      continue
    }

    minLeft = Math.min(minLeft, rect.left - rootRect.left)
    minTop = Math.min(minTop, rect.top - rootRect.top)
    maxRight = Math.max(maxRight, rect.right - rootRect.left)
    maxBottom = Math.max(maxBottom, rect.bottom - rootRect.top)
  }

  if (!Number.isFinite(minLeft) || !Number.isFinite(minTop) || !Number.isFinite(maxRight) || !Number.isFinite(maxBottom)) {
    const fallbackWidth = Math.max(measurementRoot.scrollWidth, measurementRoot.clientWidth, 1)
    const fallbackHeight = Math.max(measurementRoot.scrollHeight, measurementRoot.clientHeight, 1)

    return {
      minLeft: 0,
      minTop: 0,
      maxRight: fallbackWidth,
      maxBottom: fallbackHeight,
      width: fallbackWidth,
      height: fallbackHeight
    }
  }

  return {
    minLeft,
    minTop,
    maxRight,
    maxBottom,
    width: Math.max(maxRight - minLeft, 1),
    height: Math.max(maxBottom - minTop, 1)
  }
}

function syncFrameViewport() {
  if (syncRafId !== null) {
    cancelAnimationFrame(syncRafId)
  }

  nextTick(() => {
    const iframe = iframeRef.value
    const viewport = viewportRef.value
    const canvas = canvasRef.value
    const doc = iframe?.contentDocument

    if (!iframe || !viewport || !canvas || !doc) {
      return
    }

    const viewportWidth = Math.max(viewport.clientWidth, 1)
    const layoutWidth = Math.max(viewportWidth, MIN_LAYOUT_WIDTH)

    iframe.style.transform = 'none'
    iframe.style.width = `${layoutWidth}px`
    iframe.style.height = '720px'

    syncRafId = requestAnimationFrame(() => {
      const liveIframe = iframeRef.value
      const liveViewport = viewportRef.value
      const liveCanvas = canvasRef.value
      const liveDoc = liveIframe?.contentDocument

      if (!liveIframe || !liveViewport || !liveCanvas || !liveDoc) {
        return
      }

      const previewBackground = resolvePreviewBackground(liveDoc)
      const bounds = measurePreviewBounds(liveDoc)
      const liveViewportWidth = Math.max(liveViewport.clientWidth, 1)
      const availableWidth = Math.max(liveViewportWidth - PREVIEW_PADDING * 2, 1)
      const scale = Math.min(1, availableWidth / bounds.width)
      const scaledWidth = Math.ceil(bounds.width * scale)
      const scaledHeight = Math.ceil(bounds.height * scale) + PREVIEW_HEIGHT_BUFFER
      const frameCanvasWidth = Math.max(layoutWidth, Math.ceil(bounds.maxRight))
      const frameCanvasHeight = Math.max(1, Math.ceil(bounds.maxBottom))

      liveDoc.documentElement.style.backgroundColor = previewBackground
      liveDoc.body.style.backgroundColor = previewBackground
      liveDoc.documentElement.style.overflow = 'hidden'
      liveDoc.body.style.overflow = 'hidden'
      liveCanvas.style.width = `${scaledWidth}px`
      liveCanvas.style.height = `${scaledHeight}px`
      liveIframe.style.width = `${frameCanvasWidth}px`
      liveIframe.style.height = `${frameCanvasHeight}px`
      liveIframe.style.transform = `translate(${Math.ceil(-bounds.minLeft)}px, ${Math.ceil(-bounds.minTop)}px) scale(${scale})`
      liveViewport.style.height = `${scaledHeight + PREVIEW_PADDING * 2}px`
      liveViewport.style.backgroundColor = previewBackground
      syncRafId = null
    })
  })
}

function cleanupFrameObserver() {
  frameResizeObserver?.disconnect()
  frameResizeObserver = null
}

function cleanupViewportObserver() {
  viewportResizeObserver?.disconnect()
  viewportResizeObserver = null
}

function observeFrameContent() {
  cleanupFrameObserver()

  const doc = iframeRef.value?.contentDocument
  const previewRoot = doc ? getPreviewRoot(doc) : null
  const body = doc?.body
  const root = doc?.documentElement

  if (!body || !root) {
    return
  }

  frameResizeObserver = new ResizeObserver(() => {
    syncFrameViewport()
  })

  if (previewRoot) {
    frameResizeObserver.observe(previewRoot)
  }
  frameResizeObserver.observe(body)
  frameResizeObserver.observe(root)
}

function observeViewport() {
  cleanupViewportObserver()

  const viewport = viewportRef.value

  if (!viewport) {
    return
  }

  viewportResizeObserver = new ResizeObserver(() => {
    syncFrameViewport()
  })

  viewportResizeObserver.observe(viewport)
}

function handleFrameLoad() {
  observeFrameContent()
  observeViewport()
  syncFrameViewport()
}

function setCopyStatus(status: 'copied' | 'failed') {
  copyStatus.value = status

  if (copyStatusTimer !== null) {
    window.clearTimeout(copyStatusTimer)
  }

  copyStatusTimer = window.setTimeout(() => {
    copyStatus.value = 'idle'
    copyStatusTimer = null
  }, 2000)
}

function fallbackCopy(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()

  if (!copied) {
    throw new Error('浏览器未允许复制')
  }
}

async function copySource() {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(html.value)
    } else {
      fallbackCopy(html.value)
    }
    setCopyStatus('copied')
  } catch {
    try {
      fallbackCopy(html.value)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }
}

function toggleView() {
  isCodeVisible.value = !isCodeVisible.value
  copyStatus.value = 'idle'
}

watch(srcdoc, syncFrameViewport)
watch(isCodeVisible, (visible) => {
  if (!visible) {
    if (!hasRenderableHtml.value) {
      cleanupFrameObserver()
      cleanupViewportObserver()
      return
    }

    nextTick(() => {
      observeFrameContent()
      observeViewport()
      syncFrameViewport()
    })
    return
  }

  cleanupFrameObserver()
  cleanupViewportObserver()
})
onMounted(() => {
  if (!hasRenderableHtml.value) {
    return
  }

  observeViewport()
  syncFrameViewport()
})
onBeforeUnmount(() => {
  if (syncRafId !== null) {
    cancelAnimationFrame(syncRafId)
  }
  if (copyStatusTimer !== null) {
    window.clearTimeout(copyStatusTimer)
  }
  cleanupFrameObserver()
  cleanupViewportObserver()
})
</script>

<style scoped>
.html-preview {
  margin: 20px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.html-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 10px 14px;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 82%, var(--vp-c-default-soft) 18%);
}

.html-preview__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.html-preview__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.html-preview__toggle,
.html-preview__copy {
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
}

.html-preview__copy {
  min-width: 70px;
}

.html-preview__toggle:hover,
.html-preview__copy:hover {
  border-color: var(--vp-c-brand-1, var(--vp-c-brand));
  color: var(--vp-c-brand-1, var(--vp-c-brand));
}

.html-preview__toggle:focus-visible,
.html-preview__copy:focus-visible {
  outline: 2px solid var(--vp-c-brand-1, var(--vp-c-brand));
  outline-offset: 2px;
}

.html-preview__body {
  position: relative;
  min-height: 0;
}

.html-preview__status {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.html-preview__viewport {
  position: relative;
  box-sizing: border-box;
  padding: var(--html-preview-padding);
  overflow: hidden;
  border-radius: 0 0 16px 16px;
  background: var(--vp-c-bg-soft);
}

.html-preview__canvas {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
}

.html-preview__empty {
  min-height: 200px;
  background: var(--vp-c-bg-soft);
}

.html-preview__source {
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: #111827;
  color: #e5e7eb;
  font-size: 13px;
  line-height: 1.7;
}

.html-preview__source code {
  display: block;
  min-width: max-content;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.html-preview__frame {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  transform-origin: top left;
  border: 0;
  background: transparent;
  color-scheme: dark;
}
</style>
