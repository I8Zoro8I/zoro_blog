<script setup lang="ts">
import {computed} from 'vue';
import {useRoute, withBase} from 'vitepress';
import {getArticleByPath, getRelatedArticles, getSeriesProgress, getTagAnchor} from '../contentIndex';

const route = useRoute();

const article = computed(() => getArticleByPath(route.path));
const relatedArticles = computed(() => getRelatedArticles(route.path));
const seriesProgress = computed(() => getSeriesProgress(route.path));
</script>

<template>
  <section v-if="article" class="doc-meta-panel">
    <div v-if="seriesProgress" class="doc-meta-row doc-series-progress">
      <span class="doc-meta-label">学习路径</span>
      <div class="doc-series-progress-copy">
        <strong>{{ seriesProgress.name }}</strong>
        <span>第 {{ seriesProgress.current }} / {{ seriesProgress.total }} 篇</span>
      </div>
      <div class="doc-series-progress-track" aria-hidden="true">
        <span :style="{width: `${(seriesProgress.current / seriesProgress.total) * 100}%`}"></span>
      </div>
    </div>

    <div v-if="article.tags.length" class="doc-meta-row">
      <span class="doc-meta-label">标签</span>
      <div class="doc-meta-pills">
        <a
          v-for="tag in article.tags"
          :key="tag"
          class="doc-meta-pill"
          :href="withBase(`/tags/#tag-${getTagAnchor(tag)}`)"
        >
          {{ tag }}
        </a>
      </div>
    </div>

    <div v-if="relatedArticles.length" class="doc-meta-row doc-related-row">
      <span class="doc-meta-label">继续探索</span>
      <div class="doc-related-list">
        <a
          v-for="item in relatedArticles"
          :key="item.link"
          class="doc-related-link"
          :href="withBase(item.link)"
        >
          <strong>{{ item.title }}</strong>
          <span>{{ item.series || item.group || item.category || '相关内容' }}</span>
        </a>
      </div>
    </div>
  </section>
</template>
