<script setup lang="ts">
import {withBase} from 'vitepress';
import {tagSections} from '../contentIndex';
</script>

<template>
  <div class="taxonomy-page">
    <div class="taxonomy-hero">
      <p class="taxonomy-kicker">Explore by Tag</p>
      <h1>标签导航</h1>
      <p class="taxonomy-lead">
        从主题标签切入，快速找到相关的教程、踩坑记录和工具文章。
      </p>
    </div>

    <div class="taxonomy-cloud">
      <a
        v-for="section in tagSections"
        :key="section.name"
        class="taxonomy-chip"
        :href="`#tag-${section.anchor}`"
      >
        <span>{{ section.name }}</span>
        <span class="taxonomy-chip-count">{{ section.count }}</span>
      </a>
    </div>

    <section
      v-for="section in tagSections"
      :id="`tag-${section.anchor}`"
      :key="section.name"
      class="taxonomy-section"
    >
      <div class="taxonomy-section-head">
        <h2>{{ section.name }}</h2>
        <span>{{ section.count }} 篇</span>
      </div>

      <div class="taxonomy-list">
        <a
          v-for="article in section.articles"
          :key="article.link"
          class="taxonomy-item"
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
    </section>
  </div>
</template>
