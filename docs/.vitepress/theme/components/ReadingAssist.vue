<script setup lang="ts">
import {watch} from 'vue'
import {useReadingAssist} from '../composables/useReadingAssist'

const {isArticlePage, lastUpdated, outlineCollapsed, stats, toggleOutline} = useReadingAssist()

watch(outlineCollapsed, (collapsed) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('reading-assist-outline-collapsed', collapsed)
}, {immediate: true})
</script>

<template>
  <section v-if="isArticlePage" class="reading-assist-aside" aria-label="文章阅读信息">
    <dl class="reading-assist-stats">
      <div>
        <dt>阅读</dt>
        <dd>{{ stats.readingMinutes }} 分钟</dd>
      </div>
      <div>
        <dt>字数</dt>
        <dd>{{ stats.characterCount.toLocaleString() }}</dd>
      </div>
      <div v-if="lastUpdated">
        <dt>更新</dt>
        <dd>{{ lastUpdated }}</dd>
      </div>
    </dl>

    <button
      class="reading-assist-outline-toggle"
      type="button"
      :aria-expanded="!outlineCollapsed"
      :aria-label="outlineCollapsed ? '展开本文目录' : '折叠本文目录'"
      @click="toggleOutline"
    >
      <span aria-hidden="true">{{ outlineCollapsed ? '+' : '−' }}</span>
      {{ outlineCollapsed ? '展开目录' : '折叠目录' }}
    </button>
  </section>
</template>
