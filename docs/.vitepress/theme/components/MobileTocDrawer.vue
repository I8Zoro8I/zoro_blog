<script setup lang="ts">
import {nextTick, onBeforeUnmount, ref, watch} from 'vue'
import {useReadingAssist} from '../composables/useReadingAssist'

const {headings, isArticlePage, refresh} = useReadingAssist()
const isOpen = ref(false)
const activeId = ref('')
const triggerRef = ref<HTMLButtonElement | null>(null)
const drawerRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let previousOverflow = ''

function closeDrawer() {
  isOpen.value = false
}

function lockScroll() {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockScroll() {
  document.body.style.overflow = previousOverflow
}

function updateActiveHeading(entries: IntersectionObserverEntry[]) {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)

  if (visible[0]) activeId.value = visible[0].target.id
}

function observeHeadings() {
  if (typeof window === 'undefined') return

  observer?.disconnect()
  observer = null

  if (!isArticlePage.value || !window.matchMedia('(max-width: 767px)').matches) return

  observer = new IntersectionObserver(updateActiveHeading, {
    rootMargin: '-18% 0px -70% 0px',
    threshold: [0, 1]
  })

  headings.value.forEach(({id}) => {
    const element = document.getElementById(id)
    if (element) observer?.observe(element)
  })
}

function openDrawer() {
  isOpen.value = true
  lockScroll()
  void nextTick(() => drawerRef.value?.querySelector<HTMLElement>('.mobile-toc-drawer__close')?.focus())
}

function goToHeading(event: MouseEvent, id: string) {
  event.preventDefault()
  const target = document.getElementById(id)
  target?.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'})
  history.replaceState(null, '', `#${id}`)
  closeDrawer()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeDrawer()
}

watch(isOpen, (open) => {
  if (typeof document === 'undefined') return
  if (open) return
  unlockScroll()
  void nextTick(() => triggerRef.value?.focus())
})

watch(headings, observeHeadings, {deep: true})
watch(isArticlePage, (visible) => {
  if (!visible) closeDrawer()
  refresh()
  void nextTick(observeHeadings)
}, {immediate: true})

onBeforeUnmount(() => {
  observer?.disconnect()
  unlockScroll()
})
</script>

<template>
  <div v-if="isArticlePage && headings.length" class="mobile-toc">
    <button ref="triggerRef" class="mobile-toc__trigger" type="button" aria-label="打开本文目录" @click="openDrawer">
      <span aria-hidden="true">☰</span>
      目录
    </button>

    <div v-if="isOpen" class="mobile-toc-drawer" role="presentation" @keydown="handleKeydown">
      <button class="mobile-toc-drawer__backdrop" type="button" aria-label="关闭目录" @click="closeDrawer" />
      <section ref="drawerRef" class="mobile-toc-drawer__panel" role="dialog" aria-modal="true" aria-label="本文目录">
        <header class="mobile-toc-drawer__header">
          <strong>本文目录</strong>
          <button class="mobile-toc-drawer__close" type="button" aria-label="关闭目录" @click="closeDrawer">×</button>
        </header>
        <nav class="mobile-toc-drawer__list" aria-label="本文目录">
          <a
            v-for="heading in headings"
            :key="heading.id"
            :class="{ 'is-active': activeId === heading.id }"
            :aria-current="activeId === heading.id ? 'location' : undefined"
            :href="`#${heading.id}`"
            :style="{ '--toc-level': heading.level }"
            @click="goToHeading($event, heading.id)"
          >
            {{ heading.text }}
          </a>
        </nav>
      </section>
    </div>
  </div>
</template>
