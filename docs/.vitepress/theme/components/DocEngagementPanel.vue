<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute} from 'vitepress';

type RatingValue = 'helpful' | 'normal' | 'hardcore';

const route = useRoute();
const rating = ref<RatingValue | null>(null);

const RATING_STORAGE_PREFIX = 'zblog:article-rating:';

const ratingOptions: Array<{value: RatingValue; label: string}> = [
  {value: 'helpful', label: '有帮助'},
  {value: 'normal', label: '一般'},
  {value: 'hardcore', label: '太硬核'}
];

const ratingStorageKey = computed(() => `${RATING_STORAGE_PREFIX}${route.path}`);

const loadRating = () => {
  const raw = localStorage.getItem(ratingStorageKey.value);
  if (raw === 'helpful' || raw === 'normal' || raw === 'hardcore') {
    rating.value = raw;
    return;
  }

  rating.value = null;
};

const setRating = (value: RatingValue) => {
  rating.value = value;
  localStorage.setItem(ratingStorageKey.value, value);
};

watch(
  () => route.path,
  () => {
    if (typeof window !== 'undefined') {
      loadRating();
    }
  }
);

onMounted(() => {
  loadRating();
});
</script>

<template>
  <section class="doc-engagement-panel">
    <div class="doc-engagement-card">
      <span class="doc-engagement-label">一句话评价</span>
      <strong class="doc-engagement-title">这篇内容看起来怎么样？</strong>
      <p class="doc-engagement-desc">只保存在你的本地浏览器里，不会上传。</p>
      <div class="doc-rating-list">
        <button
          v-for="option in ratingOptions"
          :key="option.value"
          class="doc-rating-btn"
          :class="{'is-active': rating === option.value}"
          type="button"
          @click="setRating(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </section>
</template>
