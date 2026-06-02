<script setup lang="ts">
import {computed} from 'vue';
import {useRoute, withBase} from 'vitepress';
import {getArticleByPath, getTagAnchor} from '../contentIndex';

const route = useRoute();

const article = computed(() => getArticleByPath(route.path));
</script>

<template>
  <section v-if="article && (article.tags.length || article.series)" class="doc-meta-panel">
    <div v-if="article.series" class="doc-meta-row">
      <span class="doc-meta-label">系列</span>
      <span class="doc-meta-pill doc-meta-pill-primary">
        {{ article.series }}
      </span>
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
  </section>
</template>
