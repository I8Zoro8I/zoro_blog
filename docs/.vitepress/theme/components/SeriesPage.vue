<script setup lang="ts">
import {withBase} from 'vitepress';
import {seriesSections} from '../contentIndex';
</script>

<template>
  <div class="taxonomy-page">
    <div class="taxonomy-hero">
      <p class="taxonomy-kicker">Browse by Series</p>
      <h1>系列导航</h1>
      <p class="taxonomy-lead">
        把零散文章串成学习路径，适合按主题连续阅读。
      </p>
    </div>

    <div class="series-grid">
      <a
        v-for="section in seriesSections"
        :key="section.name"
        class="series-card"
        :href="`#series-${section.anchor}`"
      >
        <strong>{{ section.name }}</strong>
        <span>{{ section.count }} 篇文章</span>
      </a>
    </div>

    <section
      v-for="section in seriesSections"
      :id="`series-${section.anchor}`"
      :key="section.name"
      class="taxonomy-section"
    >
      <div class="taxonomy-section-head">
        <h2>{{ section.name }}</h2>
        <span>{{ section.count }} 篇</span>
      </div>

      <div class="taxonomy-list">
        <a
          v-for="(article, index) in section.articles"
          :key="article.link"
          class="taxonomy-item"
          :href="withBase(article.link)"
        >
          <div>
            <strong>{{ index + 1 }}. {{ article.title }}</strong>
            <p>{{ article.group || article.category || '系列文章' }}</p>
          </div>
          <span class="taxonomy-item-date">{{ article.date || '未填写日期' }}</span>
        </a>
      </div>
    </section>
  </div>
</template>
