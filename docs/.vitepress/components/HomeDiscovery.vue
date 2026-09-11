<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {withBase} from 'vitepress';
import {type ArticleSummary, getArticleByPath, learningRoutes, recentArticles} from '../theme/contentIndex';

type ContinueReading = ArticleSummary & {
  percent: number;
  updatedAt: string;
};

type SavedProgress = {
  percent: number;
  updatedAt: string;
};

const STORAGE_PREFIX = 'zblog:reading-progress:';
const continueReading = ref<ContinueReading[]>([]);

const hasDiscoveryContent = computed(() => {
  return continueReading.value.length > 0 || recentArticles.length > 0 || learningRoutes.length > 0;
});

const loadContinueReading = () => {
  const records: ContinueReading[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (!key?.startsWith(STORAGE_PREFIX)) {
      continue;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(key) || '') as SavedProgress;
      const article = getArticleByPath(key.slice(STORAGE_PREFIX.length));

      if (!article || saved.percent < 8 || saved.percent >= 98 || !saved.updatedAt) {
        continue;
      }

      records.push({...article, percent: saved.percent, updatedAt: saved.updatedAt});
    } catch {
      // 保留无效记录以外的数据，避免首页加载因单条历史记录失败。
    }
  }

  continueReading.value = records
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 3);
};

onMounted(loadContinueReading);
</script>

<template>
  <section v-if="hasDiscoveryContent" class="home-discovery" aria-label="内容推荐">
    <div v-if="continueReading.length" class="discovery-section continue-section">
      <div class="discovery-heading">
        <div>
          <span class="discovery-kicker">CONTINUE</span>
          <h2>继续阅读</h2>
        </div>
        <span class="discovery-caption">为你保留的进度</span>
      </div>

      <div class="continue-list">
        <a
          v-for="article in continueReading"
          :key="article.link"
          class="continue-item"
          :href="withBase(article.link)"
        >
          <div class="continue-item-copy">
            <span>{{ article.series || article.group || article.category || '技术文章' }}</span>
            <strong>{{ article.title }}</strong>
          </div>
          <div class="continue-progress">
            <span>{{ article.percent }}%</span>
            <i aria-hidden="true"><b :style="{width: `${article.percent}%`}"></b></i>
          </div>
        </a>
      </div>
    </div>

    <div class="discovery-section">
      <div class="discovery-heading">
        <div>
          <span class="discovery-kicker">LATEST</span>
          <h2>最近更新</h2>
        </div>
        <a class="discovery-more" :href="withBase('/archive/')">查看归档</a>
      </div>

      <div class="recent-grid">
        <a
          v-for="article in recentArticles"
          :key="article.link"
          class="recent-item"
          :href="withBase(article.link)"
        >
          <span class="recent-item-date">{{ article.date || '近期整理' }}</span>
          <strong>{{ article.title }}</strong>
          <span class="recent-item-meta">{{ article.series || article.group || article.category || '独立文章' }}</span>
        </a>
      </div>
    </div>

    <div v-if="learningRoutes.length" class="discovery-section routes-section">
      <div class="discovery-heading">
        <div>
          <span class="discovery-kicker">PATHS</span>
          <h2>学习路线</h2>
        </div>
        <a class="discovery-more" :href="withBase('/tags/')">浏览标签</a>
      </div>

      <div class="routes-grid">
        <a
          v-for="route in learningRoutes"
          :key="route.name"
          class="route-item"
          :href="withBase(route.startArticle.link)"
        >
          <span>共 {{ route.count }} 篇</span>
          <strong>{{ route.name }}</strong>
          <p>从 {{ route.startArticle.title }} 开始</p>
          <span class="route-action">开始学习</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-discovery {
  max-width: 1152px;
  margin: 0 auto 2.5rem;
  padding: 0 24px;
}

.discovery-section + .discovery-section {
  margin-top: 2.6rem;
}

.discovery-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.discovery-kicker {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--vp-c-brand);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.discovery-heading h2 {
  margin: 0;
  font-size: 1.2rem;
}

.discovery-caption,
.discovery-more {
  color: var(--vp-c-text-2);
  font-size: 0.88rem;
}

.discovery-more {
  text-decoration: none;
}

.discovery-more:hover,
.route-action {
  color: var(--vp-c-brand);
}

.continue-list,
.recent-grid,
.routes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.continue-item,
.recent-item,
.route-item {
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
}

.continue-item:hover,
.recent-item:hover,
.route-item:hover {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-bg-alt);
  transform: translateY(-2px);
}

.continue-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 122px;
  padding: 1rem;
}

.continue-item-copy span,
.recent-item-date,
.recent-item-meta,
.route-item > span:first-child,
.route-item p {
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
}

.continue-item-copy strong,
.recent-item strong,
.route-item strong {
  display: -webkit-box;
  margin-top: 0.4rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.continue-progress {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 1rem;
}

.continue-progress > span {
  color: var(--vp-c-brand);
  font-size: 0.78rem;
  font-weight: 700;
}

.continue-progress i {
  display: block;
  flex: 1;
  height: 4px;
  overflow: hidden;
  border-radius: 99px;
  background: var(--vp-c-divider);
}

.continue-progress b,
.doc-series-progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--vp-c-brand);
}

.recent-item,
.route-item {
  display: flex;
  flex-direction: column;
  min-height: 136px;
  padding: 1rem;
}

.recent-item-date {
  color: var(--vp-c-brand);
}

.recent-item strong {
  flex: 1;
  font-size: 0.96rem;
  line-height: 1.5;
}

.recent-item-meta {
  margin-top: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-item {
  background: linear-gradient(135deg, var(--vp-c-bg-soft), var(--vp-c-bg-alt));
}

.route-item strong {
  margin-top: 0.7rem;
  font-size: 1rem;
}

.route-item p {
  flex: 1;
  margin: 0.6rem 0 1rem;
  line-height: 1.5;
}

.route-action {
  font-size: 0.86rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .home-discovery {
    margin-bottom: 2rem;
    padding: 0 20px;
  }

  .continue-list,
  .recent-grid,
  .routes-grid {
    grid-template-columns: 1fr;
  }

  .recent-item,
  .route-item {
    min-height: 118px;
  }
}
</style>
