<script setup lang="ts">
import {computed} from 'vue';
import {useRoute, withBase} from 'vitepress';
import {getArticleByPath, getTagAnchor} from '../contentIndex';

const route = useRoute();

const article = computed(() => getArticleByPath(route.path));
</script>

<template>
  <section v-if="article && article.tags.length" class="doc-meta-panel">
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
