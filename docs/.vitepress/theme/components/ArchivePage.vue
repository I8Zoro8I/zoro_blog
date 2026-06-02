<script setup lang="ts">
import {withBase} from 'vitepress';
import {archiveSections} from '../contentIndex';
</script>

<template>
  <div class="taxonomy-page archive-page">
    <div class="taxonomy-hero archive-hero">
      <p class="taxonomy-kicker">Archive</p>
      <h1>时间归档</h1>
      <p class="taxonomy-lead">
        按年份和月份回看所有文章，适合从时间线了解博客更新节奏。
      </p>
    </div>

    <div class="archive-year-grid">
      <a
        v-for="section in archiveSections"
        :key="section.year"
        class="series-card archive-year-card"
        :href="`#archive-${section.year}`"
      >
        <strong>{{ section.year }}</strong>
        <span>{{ section.count }} 篇文章</span>
      </a>
    </div>

    <section
      v-for="section in archiveSections"
      :id="`archive-${section.year}`"
      :key="section.year"
      class="archive-year-section"
    >
      <div class="taxonomy-section-head archive-year-head">
        <h2>{{ section.year }}</h2>
        <span>{{ section.count }} 篇</span>
      </div>

      <div class="archive-months">
        <details
          v-for="(month, monthIndex) in section.months"
          :key="month.key"
          class="archive-month-card"
          :open="monthIndex === 0"
        >
          <summary class="archive-month-head">
            <h3>{{ month.month }}</h3>
            <span>{{ month.count }} 篇</span>
          </summary>

          <div class="taxonomy-list archive-list">
            <a
              v-for="article in month.articles"
              :key="article.link"
              class="taxonomy-item archive-item"
              :href="withBase(article.link)"
            >
              <div>
                <strong>{{ article.title }}</strong>
                <p>
                  <span v-if="article.series">{{ article.series }}</span>
                  <span v-else-if="article.group">{{ article.group }}</span>
                  <span v-else>独立文章</span>
                </p>
              </div>
              <span class="taxonomy-item-date">{{ article.date || '未填写日期' }}</span>
            </a>
          </div>
        </details>
      </div>
    </section>
  </div>
</template>
