<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import {withBase} from 'vitepress';
import {homeCategoriesData as categoriesData} from '../relaConf/categories';
import {siteLaunchDate} from '../relaConf/siteStats';
import {data as siteStatsData} from '../siteStats.data';
import {articles, getRandomArticle} from '../theme/contentIndex';

/* --- 基础状态 --- */
const searchQuery = ref('');
const currentPath = ref([]);
const sponsorType = ref('wechat');
const randomArticle = ref(null);
const currentPage = ref(1);
const listViewportRef = ref(null);
const viewMode = ref('card');
const sponsorExpanded = ref(false);
const activeFolder = ref('');

const DEFAULT_PAGE_SIZE = 12;
const CARD_MIN_WIDTH = 220;
const CARD_HEIGHT = 90;
const LIST_ITEM_HEIGHT = 52;
const GRID_GAP = 16;
const LIST_GAP = 8;
const SECTION_GAP = 24;
const ROW_FIT_TOLERANCE = 36;
const VIEW_MODE_STORAGE_KEY = 'home-category-view-mode';

const gridColumns = ref(0);
const viewportHeight = ref(0);

let resizeObserver = null;
let folderNavigationTimer = null;

const getRunningDays = (startDate) => {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    return 0;
  }

  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
};

const formatWords = (value) => {
  return new Intl.NumberFormat('zh-CN').format(value);
};

const pickRandomArticle = () => {
  randomArticle.value = getRandomArticle();
};

const getItemName = (item) => {
  return item?.name || item?.title || item?.displayName || '';
};

const getItemChildren = (item) => {
  return item?.children || item?.links || item?.items || [];
};

/* --- 1. 动态统计逻辑（兼容多级） --- */
const stats = computed(() => {
  let docCount = 0;
  let folderSet = new Set();

  const traverse = (items) => {
    items.forEach(item => {
      if (item.name) folderSet.add(item.name);
      if (item.title && item.items) folderSet.add(item.title);

      if (item.links) {
        item.links.forEach(l => {
          if (l.url) docCount++;
          if (l.items) docCount += l.items.length;
        });
      }
      if (item.items) {
        item.items.forEach(sub => { if (sub.url) docCount++; });
      }
      if (item.children) traverse(item.children);
    });
  };

  traverse(categoriesData.categories);
  return {
    docs: docCount,
    folders: folderSet.size,
    totalWords: siteStatsData.totalWords,
    latestUpdatedDate: siteStatsData.latestUpdatedDate,
    runningDays: getRunningDays(siteLaunchDate)
  };
});

// /* --- 2. 目录导航逻辑（无限级打通） --- */
// const currentDisplay = computed(() => {
//   let temp = categoriesData.categories;
//   for (const segment of currentPath.value) {
//     let found = null;
//     if (Array.isArray(temp)) {
//       found = temp.find(c => c.name === segment || c.title === segment);
//     }
//     if (found) {
//       temp = found.children || found.links || found.items || [];
//     } else {
//       return [];
//     }
//   }
//   return temp;
// });
/* --- 2. 目录导航逻辑（无限级打通 + 单子项智能跨越） --- */
const navigationState = computed(() => {
  let temp = categoriesData.categories;
  const breadcrumbItems = [];

  // 1. 先根据当前显式路径，正常逐级向下查找
  for (const segment of currentPath.value) {
    let found = null;
    if (Array.isArray(temp)) {
      found = temp.find(c => c.name === segment || c.title === segment);
    }
    if (found) {
      breadcrumbItems.push({
        label: segment,
        explicitIndex: breadcrumbItems.length
      });
      temp = getItemChildren(found);
    } else {
      return {
        breadcrumbItems: [],
        display: []
      };
    }
  }

  // 2. 🌟 自动化下钻拦截：如果当前层级【只有一个子项】，且该子项是个“空壳目录”而非单篇文章
  // 只做展示层穿透，不修改 currentPath，避免“返回上一级”失效
  while (
      Array.isArray(temp) &&
      temp.length === 1 &&
      !temp[0].url &&               // 确保它不是一篇文章
      getItemChildren(temp[0]).length // 确保它有下级数据
      ) {
    const nextNode = temp[0];
    const nextName = getItemName(nextNode);

    if (nextName) {
      breadcrumbItems.push({
        label: nextName,
        explicitIndex: null
      });
      temp = getItemChildren(nextNode);
    } else {
      break;
    }
  }

  return {
    breadcrumbItems,
    display: temp
  };
});

const breadcrumbItems = computed(() => {
  return navigationState.value.breadcrumbItems;
});

const currentDisplay = computed(() => {
  return navigationState.value.display;
});

/* --- 3. 统一文章检索：目录浏览仍保持原有交互，搜索时按文章元数据聚合。 --- */
const searchResults = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return [];

  return articles.filter((article) => {
    const haystack = [
      article.title,
      article.category,
      article.group,
      article.series,
      ...article.tags
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return haystack.includes(query);
  }).map((article) => ({...article, isDoc: true}));
});

/* --- 4. 分页数据源 --- */
const totalData = computed(() => {
  return searchQuery.value ? searchResults.value : currentDisplay.value;
});

const hasDynamicLayout = computed(() => {
  return gridColumns.value > 0 && viewportHeight.value > 0;
});

const getSectionHeight = (count, columns) => {
  if (!count) return 0;

  const isListView = viewMode.value === 'list';
  const effectiveColumns = isListView ? 1 : columns;
  const itemHeight = isListView ? LIST_ITEM_HEIGHT : CARD_HEIGHT;
  const gap = isListView ? LIST_GAP : GRID_GAP;
  const rows = Math.ceil(count / effectiveColumns);

  return rows * itemHeight + Math.max(0, rows - 1) * gap;
};

const canFitItems = (items) => {
  if (!hasDynamicLayout.value) {
    return items.length <= DEFAULT_PAGE_SIZE;
  }

  const folderCount = items.filter(item => !item.isDoc && !item.url).length;
  const docCount = items.length - folderCount;
  const contentHeight =
      getSectionHeight(folderCount, gridColumns.value) +
      getSectionHeight(docCount, gridColumns.value) +
      (folderCount > 0 && docCount > 0 ? SECTION_GAP : 0);

  return contentHeight <= viewportHeight.value + ROW_FIT_TOLERANCE;
};

const pageRanges = computed(() => {
  const items = totalData.value;

  if (!items.length) {
    return [{ start: 0, end: 0 }];
  }

  if (!hasDynamicLayout.value) {
    const ranges = [];
    for (let start = 0; start < items.length; start += DEFAULT_PAGE_SIZE) {
      ranges.push({
        start,
        end: Math.min(start + DEFAULT_PAGE_SIZE, items.length)
      });
    }
    return ranges;
  }

  const ranges = [];
  let start = 0;

  while (start < items.length) {
    let end = start;

    while (end < items.length && canFitItems(items.slice(start, end + 1))) {
      end++;
    }

    if (end === start) {
      end = start + 1;
    }

    ranges.push({ start, end });
    start = end;
  }

  return ranges;
});

const totalPages = computed(() => {
  return pageRanges.value.length || 1;
});

const pagedDisplay = computed(() => {
  const range = pageRanges.value[currentPage.value - 1] || pageRanges.value[0];
  return totalData.value.slice(range.start, range.end);
});

/* --- 5. 分离当前页面的文件夹与文章（用于换行排列） --- */
const pagedFolders = computed(() => {
  return pagedDisplay.value.filter(item => !item.isDoc && !item.url);
});

const pagedDocs = computed(() => {
  return pagedDisplay.value.filter(item => item.isDoc || item.url);
});

const contentTransitionKey = computed(() => [
  currentPath.value.join('/'),
  searchQuery.value,
  currentPage.value,
  viewMode.value
].join('|'));

/* --- 6. 操作函数 --- */
const enterFolder = (name) => {
  if (folderNavigationTimer) {
    window.clearTimeout(folderNavigationTimer);
  }

  activeFolder.value = name;
  folderNavigationTimer = window.setTimeout(() => {
    currentPath.value.push(name);
    searchQuery.value = '';
    currentPage.value = 1;
    activeFolder.value = '';
    folderNavigationTimer = null;
  }, 120);
};

const goBack = () => {
  currentPath.value.pop();
  currentPage.value = 1;
};

const resetNav = () => {
  currentPath.value = [];
  currentPage.value = 1;
};

const setViewMode = (mode) => {
  if (mode !== 'card' && mode !== 'list') return;

  viewMode.value = mode;
  currentPage.value = 1;
  localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
};

const getFolderName = (item) => {
  return getItemName(item);
};

const getUrl = (url) => {
  if (!url) return '#';
  return withBase(url);
};

const jumpToPath = (breadcrumbItem) => {
  if (breadcrumbItem.explicitIndex === null) {
    return;
  }

  currentPath.value = currentPath.value.slice(0, breadcrumbItem.explicitIndex + 1);
  searchQuery.value = '';
  currentPage.value = 1;
};

watch(searchQuery, () => {
  currentPage.value = 1;
});

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value;
  }
});

watch(totalData, async () => {
  await nextTick();
  recalculateLayout();
});

const recalculateLayout = () => {
  const viewportEl = listViewportRef.value;

  if (!viewportEl) {
    gridColumns.value = 0;
    viewportHeight.value = 0;
    return;
  }

  const width = viewportEl.clientWidth;
  const height = viewportEl.clientHeight;

  if (!width || !height) {
    gridColumns.value = 0;
    viewportHeight.value = 0;
    return;
  }

  gridColumns.value = Math.max(1, Math.floor((width + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)));
  viewportHeight.value = height;
};

onMounted(() => {
  const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (savedViewMode === 'card' || savedViewMode === 'list') {
    viewMode.value = savedViewMode;
  }

  pickRandomArticle();
  nextTick(() => {
    recalculateLayout();

    resizeObserver = new ResizeObserver(() => {
      recalculateLayout();
    });

    if (listViewportRef.value) {
      resizeObserver.observe(listViewportRef.value);
    }
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  if (folderNavigationTimer) {
    window.clearTimeout(folderNavigationTimer);
  }
});
</script>

<template>
  <HomeDiscovery />
  <div class="custom-home-layout">
    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <span class="search-mark" aria-hidden="true">⌕</span>
        <input
            v-model="searchQuery"
            class="search-input"
            placeholder="搜索文章、标签、系列或分类..."
        />
        <button
            v-if="searchQuery"
            class="clear-icon"
            type="button"
            title="清空搜索"
            aria-label="清空搜索"
            @click="searchQuery = ''"
        >×</button>
      </div>
    </div>

    <div class="main-grid">
      <!-- 左侧内容区 -->
      <div class="left-content">
        <div class="nav-header">
          <div class="breadcrumb">
            <button type="button" class="crumb-item" @click="resetNav">🏠 全部分类</button>
            <span v-for="(item, index) in breadcrumbItems" :key="`${item.label}-${index}`">
              <span class="crumb-separator">/</span>
              <span v-if="index === breadcrumbItems.length - 1 || item.explicitIndex === null" class="crumb-text-current" aria-current="page">
                {{ item.label }}
              </span>
              <button v-else type="button" class="crumb-item" @click="jumpToPath(item)">
                {{ item.label }}
              </button>
            </span>
          </div>
          <div class="nav-actions">
            <div class="view-toggle" role="group" aria-label="展示方式">
              <button
                  type="button"
                  :class="['view-toggle-button', { active: viewMode === 'card' }]"
                  :aria-pressed="viewMode === 'card'"
                  title="卡片展示"
                  @click="setViewMode('card')"
              >
                <span aria-hidden="true">▦</span>
                <span>卡片</span>
              </button>
              <button
                  type="button"
                  :class="['view-toggle-button', { active: viewMode === 'list' }]"
                  :aria-pressed="viewMode === 'list'"
                  title="列表展示"
                  @click="setViewMode('list')"
              >
                <span aria-hidden="true">☰</span>
                <span>列表</span>
              </button>
            </div>
            <button v-if="currentPath.length > 0" class="back-link" @click="goBack">
              🔙 返回上一级
            </button>
          </div>
        </div>

        <div class="list-container">
          <div ref="listViewportRef" class="list-viewport">
            <Transition name="content-swap" mode="out-in">
              <!-- 干净的内容包裹区：去掉了层级缩进相关的 class -->
              <div
                  v-if="pagedDisplay.length > 0"
                  :key="contentTransitionKey"
                  :class="['list-wrapper', `view-${viewMode}`]"
              >
                <!-- 文件夹行排在上方，占满整行宽度。 -->
                <div v-if="pagedFolders.length > 0" class="card-grid">
                  <button
                      v-for="item in pagedFolders"
                      :key="getFolderName(item)"
                      :class="['card', 'folder-card', { 'is-entering': activeFolder === getFolderName(item) }]"
                      type="button"
                      @click="enterFolder(getFolderName(item))"
                  >
                    <span class="folder-label">
                      {{ item.icon || '📂' }} {{ getFolderName(item) }}
                    </span>
                  </button>
                </div>

                <!-- 文章行自成一派，保留原有目录与文章分区。 -->
                <div v-if="pagedDocs.length > 0" class="card-grid">
                  <div
                      v-for="item in pagedDocs"
                      :key="item.url || item.title"
                      class="card doc-card"
                  >
                    <a :href="getUrl(item.link || item.url)" class="card-link">
                      <strong>📄 {{ item.title }}</strong>
                      <span v-if="item.series || item.group || item.category" class="card-meta">
                        {{ item.series || item.group || item.category }}
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-else :key="contentTransitionKey" class="empty-state">
                <p>没有找到匹配的结果</p>
                <button v-if="searchQuery" type="button" class="empty-reset" @click="searchQuery = ''">清空搜索</button>
              </div>
            </Transition>
          </div>

          <!-- 分页组件 -->
          <div class="pagination">
            <button :disabled="currentPage === 1" @click="currentPage--" class="page-btn">上一页</button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button :disabled="currentPage === totalPages" @click="currentPage++" class="page-btn">下一页</button>
          </div>
        </div>
      </div>

      <!-- 右侧侧边栏 -->
      <div class="right-sidebar">
        <div class="info-widget">
          <h3 class="widget-title">📊 站点统计</h3>
          <div class="stat-row">
            <span>文章总数</span>
            <strong class="stat-val">{{ stats.docs }}</strong>
          </div>
          <div class="stat-row">
            <span>总字数</span>
            <strong class="stat-val">{{ formatWords(stats.totalWords) }}</strong>
          </div>
          <div class="stat-row">
            <span>分类目录</span>
            <strong class="stat-val">{{ stats.folders }}</strong>
          </div>
          <div class="stat-row">
            <span>运营时间</span>
            <strong class="stat-val">{{ stats.runningDays }} 天</strong>
          </div>
          <div class="stat-row">
            <span>最近更新</span>
            <strong class="stat-val">{{ stats.latestUpdatedDate }}</strong>
          </div>
          <div class="random-widget">
            <div class="random-widget-head">
              <h3 class="widget-title random-widget-title">🎲 随机一篇</h3>
            </div>
            <p v-if="randomArticle" class="random-article-title">{{ randomArticle.title }}</p>
            <div class="random-widget-actions">
              <a
                  v-if="randomArticle"
                  :href="getUrl(randomArticle.link)"
                  class="random-article-link random-action-primary"
              >
                去看看
              </a>
              <button class="random-action-secondary" type="button" @click="pickRandomArticle">换一篇</button>
            </div>
          </div>
          <hr class="divider"/>
          <button
              class="sponsor-trigger"
              type="button"
              :aria-expanded="sponsorExpanded"
              aria-controls="sponsor-panel"
              @click="sponsorExpanded = !sponsorExpanded"
          >
            <span>☕ 赞助我</span>
            <span class="sponsor-trigger-icon" aria-hidden="true">{{ sponsorExpanded ? '−' : '+' }}</span>
          </button>
          <Transition name="sponsor-reveal">
            <div v-if="sponsorExpanded" id="sponsor-panel" class="sponsor-panel">
              <div class="sponsor-tabs" role="group" aria-label="赞助方式">
                <button :class="['tab-item', { active: sponsorType === 'wechat' }]" type="button" @click="sponsorType = 'wechat'">微信</button>
                <button :class="['tab-item', { active: sponsorType === 'alipay' }]" type="button" @click="sponsorType = 'alipay'">支付宝</button>
              </div>
              <div class="sponsor-content">
                <img :src="sponsorType === 'wechat' ? getUrl('/images/wechat.jpg') : getUrl('/images/alipay.jpg')" class="sponsor-img" alt="赞助二维码" />
              </div>
              <p class="sponsor-tip">如果觉得文章对你有帮助，可以请我喝杯 coffee ~</p>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 整体容器 */
.custom-home-layout {
  max-width: 1152px;
  margin: 40px auto;
  padding: 0 24px;
}

/* 搜索部分 */
.search-section {
  margin-bottom: 30px;
}
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.search-mark {
  position: absolute;
  left: 17px;
  z-index: 1;
  color: var(--vp-c-text-3);
  font-size: 22px;
  line-height: 1;
  pointer-events: none;
  transition: color 0.2s ease, transform 0.2s ease;
}
.search-input {
  width: 100%;
  padding: 14px 46px 14px 44px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.search-input:focus {
  border-color: var(--vp-c-brand);
  outline: none;
  background: var(--vp-c-bg);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft), 0 8px 20px rgba(24, 24, 27, 0.05);
}
.search-input:focus + .clear-icon,
.search-input:focus ~ .search-mark {
  color: var(--vp-c-brand);
}
.search-input-wrapper:focus-within .search-mark {
  color: var(--vp-c-brand);
  transform: scale(1.08);
}
.clear-icon {
  position: absolute;
  right: 12px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  font-size: 19px;
  line-height: 1;
  color: var(--vp-c-text-2);
  transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}
.clear-icon:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-default-soft);
}
.clear-icon:active {
  transform: scale(0.9);
}

/* 网格布局 */
.main-grid {
  display: grid;
  grid-template-columns: 8fr 2fr;
  gap: 32px;
  align-items: stretch;
}

/* 左侧面板 */
.left-content {
  background: var(--vp-c-bg);
  border-radius: 12px;
  padding: 24px;
  min-height: 550px;
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 14px 34px rgba(24, 24, 27, 0.035);
  display: flex;
  flex-direction: column;
}
.list-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.list-viewport {
  flex: 1;
  min-height: 0;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.breadcrumb {
  font-size: 15px;
  font-weight: 500;
  min-width: 0;
}
.crumb-item {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--vp-c-brand);
  font: inherit;
  text-underline-offset: 3px;
}
.crumb-item:hover {
  text-decoration: underline;
}
.crumb-item:focus-visible {
  outline: 2px solid var(--vp-c-brand);
  outline-offset: 3px;
}
.crumb-text-current {
  display: inline-block;
  color: var(--vp-c-text-1);
  font-weight: 700;
  box-shadow: inset 0 -2px 0 var(--vp-c-brand);
}
.crumb-separator {
  margin: 0 8px;
  color: var(--vp-c-text-3);
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.view-toggle {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-alt);
}
.view-toggle-button {
  min-width: 68px;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}
.view-toggle-button:hover {
  color: var(--vp-c-brand);
}
.view-toggle-button.active {
  background: var(--vp-c-bg);
  color: var(--vp-c-brand);
  box-shadow: 0 1px 4px rgba(24, 24, 27, 0.12);
}
.view-toggle-button:active,
.back-link:active,
.page-btn:active,
.random-action-primary:active,
.random-action-secondary:active,
.tab-item:active,
.sponsor-trigger:active,
.empty-reset:active {
  transform: scale(0.97);
}
.view-toggle-button:focus-visible {
  outline: 2px solid var(--vp-c-brand);
  outline-offset: 1px;
}
.back-link {
  font-size: 14px;
  color: var(--vp-c-brand);
  font-weight: 600;
  background: transparent;
  border: 1px solid var(--vp-c-brand);
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}
.back-link:hover {
  background: var(--vp-c-brand);
  color: white;
  box-shadow: 0 5px 12px rgba(177, 133, 219, 0.24);
}

/* 内容区域上下换行布局 */
.list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px; /* 文件夹网络和文章网格之间的空隙 */
}

/* 🌟 标准平铺网格（和第一版完全相同的尺寸参数） */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  align-content: flex-start;
}

/* 一视同仁的原版大卡片样式 */
.card {
  position: relative;
  overflow: hidden;
  height: 90px;
  padding: 10px 20px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-align: center;
  color: inherit;
  font: inherit;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(24, 24, 27, 0.025);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.folder-card {
  color: var(--vp-c-text-1);
  font-weight: 600;
  background: var(--vp-c-bg-soft);
}
.doc-card {
  border-color: var(--vp-c-brand-soft);
  background: var(--vp-c-bg-soft);
  box-shadow: inset 3px 0 0 var(--vp-c-brand-soft), 0 1px 2px rgba(24, 24, 27, 0.025);
}
.doc-card .card-link {
  align-items: flex-start;
  justify-content: center;
  text-align: left;
}
.doc-card::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  background: var(--vp-c-brand);
  content: '';
  opacity: 0.8;
  transition: opacity 0.2s ease, width 0.2s ease;
}
.doc-card .card-link::after {
  position: absolute;
  right: 15px;
  bottom: 12px;
  color: var(--vp-c-brand);
  content: '→';
  font-size: 16px;
  line-height: 1;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.card-link {
  text-decoration: none;
  color: var(--vp-c-text-1);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
}
.card-link strong {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-meta {
  max-width: 100%;
  overflow: hidden;
  color: var(--vp-c-text-2);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.folder-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.card.is-entering,
.card:active {
  transform: scale(0.975);
  box-shadow: inset 0 0 0 1px var(--vp-c-brand);
}

@media (hover: hover) {
  .card:hover {
    transform: translateY(-3px);
    border-color: var(--vp-c-brand);
    box-shadow: 0 10px 22px rgba(24, 24, 27, 0.09);
  }
  .doc-card:hover::before {
    width: 4px;
    opacity: 1;
  }
  .doc-card:hover .card-link::after {
    opacity: 1;
    transform: translateX(0);
  }
  .folder-card:hover {
    background: var(--vp-c-bg);
  }
}

/* 列表模式：保留文件夹和文章分区，改为紧凑单列展示。 */
.view-list {
  gap: 12px;
}
.view-list .card-grid {
  grid-template-columns: 1fr;
  gap: 8px;
}
.view-list .card {
  height: 52px;
  padding: 0 14px;
  border-radius: 8px;
  justify-content: flex-start;
  text-align: left;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}
.view-list .card-link,
.view-list .folder-label {
  justify-content: flex-start;
}
.view-list .card-link {
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
}
.view-list .doc-card .card-link {
  height: 100%;
  justify-content: center;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px dashed var(--vp-c-divider);
}
.page-btn {
  padding: 6px 16px;
  border-radius: 8px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;
}
.page-btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-info {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--vp-c-text-3);
  font-size: 18px;
}
.empty-state p {
  margin: 0;
}
.empty-reset {
  margin-top: 14px;
  padding: 7px 10px;
  border: 0;
  background: transparent;
  color: var(--vp-c-brand);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.15s ease;
}
.empty-reset:hover {
  color: var(--vp-c-brand-dark);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 右侧侧边栏 */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.info-widget {
  background: var(--vp-c-bg-soft);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 10px 26px rgba(24, 24, 27, 0.025);
  height: 100%;
  display: flex;
  flex-direction: column;
}
.widget-title {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--vp-c-text-1);
  font-weight: bold;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0;
  padding: 10px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 14px;
}
.stat-val {
  color: var(--vp-c-brand);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.divider {
  border: 0;
  border-top: 1px solid var(--vp-c-divider);
  margin: 20px 0;
}

.random-widget {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  box-shadow: inset 3px 0 0 var(--vp-c-brand-soft);
}

.random-widget-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.random-widget-title {
  margin-bottom: 0;
}

.random-article-title {
  margin: 0;
  min-height: 48px;
  color: var(--vp-c-text-1);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.random-widget-actions {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.random-action-primary,
.random-action-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.random-action-primary {
  background: var(--vp-c-brand);
  color: #fff;
  border: 1px solid var(--vp-c-brand);
}

.random-action-primary:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.random-action-secondary {
  background: transparent;
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.random-action-secondary:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
  transform: translateY(-1px);
}

/* 赞助板块 */
.sponsor-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  justify-content: center;
}
.tab-item {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}
.tab-item.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}
.sponsor-img {
  width: 140px;
  height: 140px;
  display: block;
  margin: 0 auto;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}
.sponsor-tip {
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin-top: 12px;
  text-align: center;
}
.sponsor-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 3px 0;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.15s ease;
}
.sponsor-trigger:hover {
  color: var(--vp-c-brand);
}
.sponsor-trigger-icon {
  display: inline-grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  background: var(--vp-c-bg);
  color: var(--vp-c-brand);
  font-size: 18px;
  font-weight: 400;
}
.sponsor-panel {
  padding-top: 16px;
}

.content-swap-enter-active,
.content-swap-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.content-swap-enter-from,
.content-swap-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
.sponsor-reveal-enter-active,
.sponsor-reveal-leave-active {
  overflow: hidden;
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.sponsor-reveal-enter-from,
.sponsor-reveal-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.clear-icon:focus-visible,
.card:focus-visible,
.back-link:focus-visible,
.page-btn:focus-visible,
.random-action-primary:focus-visible,
.random-action-secondary:focus-visible,
.tab-item:focus-visible,
.sponsor-trigger:focus-visible,
.empty-reset:focus-visible {
  outline: 2px solid var(--vp-c-brand);
  outline-offset: 2px;
}

@media (max-width: 960px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  .info-widget {
    height: auto;
  }
  .random-widget-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .custom-home-layout {
    margin: 28px auto;
    padding: 0 20px;
  }
  .left-content,
  .info-widget {
    padding: 18px;
  }
  .nav-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .nav-actions {
    width: 100%;
    justify-content: space-between;
  }
  .view-toggle {
    flex: 1;
  }
  .view-toggle-button {
    flex: 1;
    min-width: 0;
  }
  .card-grid {
    grid-template-columns: 1fr;
  }
  .card {
    min-height: 64px;
  }
  .pagination {
    gap: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
