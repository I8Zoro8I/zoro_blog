<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useData, useRoute} from 'vitepress';
import {normalizeRoutePath} from '../../shared/routes';
import {getArticleByPath} from '../contentIndex';
import {createProgressWriter, getReadingRecords, type SavedProgress} from '../utils/readingProgress';

const route = useRoute();
const {site, page} = useData();
const savedProgress = ref<SavedProgress | null>(null);
const noticeVisible = ref(false);
const currentPercent = ref(0);

let saveTimer: number | null = null;
let lastPersistedPercent: number | null = null;
let activePath = '';
let refreshFrame: number | null = null;
let generation = 0;
const writer = createProgressWriter();

const siteBase = computed(() => {
  const base = site.value.base || '/';
  return base === '/' ? '' : base.replace(/\/$/, '');
});

const normalizedPath = computed(() => normalizeRoutePath(route.path, siteBase.value || '/'));

const isTrackablePage = computed(() => {
  return Boolean(getArticleByPath(normalizedPath.value));
});
const isPageReady = computed(() => normalizeRoutePath(
  `/${page.value.relativePath}`, '/'
) === normalizedPath.value);

const getScrollPercent = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

  if (documentHeight <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((scrollTop / documentHeight) * 100)));
};

const flushProgress = () => {
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = null;
  writer.flush();
};

const schedulePersist = () => {
  // 捕获发生滚动时的路径，延迟写入时不再读取新路由或新页面 DOM。
  if (!activePath || activePath !== normalizedPath.value || !isPageReady.value) return;
  const percent = getScrollPercent();
  currentPercent.value = percent;
  if (percent === lastPersistedPercent) return;
  writer.capture(activePath, percent);
  lastPersistedPercent = percent;
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(flushProgress, 700);
};

const loadSavedProgress = () => {
  noticeVisible.value = false;
  savedProgress.value = null;
  currentPercent.value = 0;
  lastPersistedPercent = null;

  if (!isTrackablePage.value) {
    return;
  }

  const parsed = getReadingRecords(siteBase.value || '/').get(normalizedPath.value);
  if (parsed) {
    lastPersistedPercent = parsed.percent;
    if (parsed.percent >= 8 && parsed.percent < 98) {
      savedProgress.value = parsed;
      noticeVisible.value = true;
    }
  }
};

const resumeReading = () => {
  if (!savedProgress.value) {
    return;
  }

  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
  const target = Math.max(0, Math.round((savedProgress.value.percent / 100) * documentHeight));

  window.scrollTo({
    top: target,
    behavior: 'smooth'
  });

  noticeVisible.value = false;
};

const dismissNotice = () => {
  noticeVisible.value = false;
};

const activatePage = async () => {
  const currentGeneration = ++generation;
  activePath = '';
  flushProgress();
  if (refreshFrame !== null) window.cancelAnimationFrame(refreshFrame);
  await nextTick();
  if (currentGeneration !== generation) return;
  refreshFrame = window.requestAnimationFrame(() => {
    refreshFrame = null;
    loadSavedProgress();
    activePath = isTrackablePage.value && isPageReady.value ? normalizedPath.value : '';
    currentPercent.value = getScrollPercent();
  });
};

watch(() => [route.path, page.value.relativePath], () => {
  if (typeof window !== 'undefined') void activatePage();
});

onMounted(() => {
  void activatePage();
  window.addEventListener('scroll', schedulePersist, {passive: true});
  window.addEventListener('pagehide', flushProgress);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', schedulePersist);
  window.removeEventListener('pagehide', flushProgress);
  generation++;
  activePath = '';
  if (refreshFrame !== null) window.cancelAnimationFrame(refreshFrame);
  flushProgress();
});
</script>

<template>
  <div v-if="isTrackablePage">
    <section v-if="savedProgress && noticeVisible" class="reading-progress-notice">
      <div class="reading-progress-copy">
        <strong>已为你记住阅读进度</strong>
        <p>上次读到 {{ savedProgress.percent }}%，可以继续接着看。</p>
      </div>
      <div class="reading-progress-actions">
        <button class="reading-progress-btn reading-progress-btn-primary" type="button" @click="resumeReading">
          继续阅读
        </button>
        <button class="reading-progress-btn" type="button" @click="dismissNotice">
          稍后再说
        </button>
      </div>
    </section>

    <div class="reading-progress-badge">
      已读 {{ currentPercent }}%
    </div>
  </div>
</template>
