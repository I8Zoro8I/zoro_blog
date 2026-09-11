<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useData, useRoute} from 'vitepress';

type SavedProgress = {
  percent: number;
  updatedAt: string;
};

const route = useRoute();
const {site} = useData();
const savedProgress = ref<SavedProgress | null>(null);
const noticeVisible = ref(false);
const currentPercent = ref(0);

const STORAGE_PREFIX = 'zblog:reading-progress:';
let saveTimer: number | null = null;
let lastPersistedPercent: number | null = null;

const siteBase = computed(() => {
  const base = site.value.base || '/';
  return base === '/' ? '' : base.replace(/\/$/, '');
});

const normalizedPath = computed(() => {
  if (siteBase.value && route.path.startsWith(`${siteBase.value}/`)) {
    return route.path.slice(siteBase.value.length);
  }

  return route.path;
});

const isTrackablePage = computed(() => {
  return normalizedPath.value.startsWith('/column/') && !normalizedPath.value.endsWith('/');
});

const storageKey = computed(() => `${STORAGE_PREFIX}${normalizedPath.value}`);

const getScrollPercent = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

  if (documentHeight <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((scrollTop / documentHeight) * 100)));
};

const persistProgress = () => {
  if (!isTrackablePage.value) {
    return;
  }

  const percent = getScrollPercent();
  currentPercent.value = percent;

  if (percent === lastPersistedPercent) {
    return;
  }

  const payload: SavedProgress = {
    percent,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(storageKey.value, JSON.stringify(payload));
  lastPersistedPercent = percent;
};

const schedulePersist = () => {
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }

  saveTimer = window.setTimeout(() => {
    persistProgress();
  }, 700);
};

const loadSavedProgress = () => {
  noticeVisible.value = false;
  savedProgress.value = null;
  currentPercent.value = 0;
  lastPersistedPercent = null;

  if (!isTrackablePage.value) {
    return;
  }

  const raw = localStorage.getItem(storageKey.value);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as SavedProgress;
    if (parsed.percent >= 8 && parsed.percent < 98) {
      savedProgress.value = parsed;
      lastPersistedPercent = parsed.percent;
      noticeVisible.value = true;
    }
  } catch {
    localStorage.removeItem(storageKey.value);
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

watch(
  () => route.path,
  () => {
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        loadSavedProgress();
        currentPercent.value = getScrollPercent();
      });
    }
  }
);

onMounted(() => {
  loadSavedProgress();
  currentPercent.value = getScrollPercent();
  window.addEventListener('scroll', schedulePersist, {passive: true});
  window.addEventListener('beforeunload', persistProgress);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', schedulePersist);
  window.removeEventListener('beforeunload', persistProgress);
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }
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
