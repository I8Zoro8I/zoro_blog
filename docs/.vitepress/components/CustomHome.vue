<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import {withBase} from 'vitepress';
/* 请确保路径正确 */
import categoriesData from '../relaConf/categories.json';
import {siteLaunchDate} from '../relaConf/siteStats';
import {data as siteStatsData} from '../siteStats.data';
import {getRandomArticle} from '../theme/contentIndex';

/* --- 基础状态 --- */
const searchQuery = ref('');
const currentPath = ref([]);
const sponsorType = ref('wechat');
const randomArticle = ref(null);
const currentPage = ref(1);
const listViewportRef = ref(null);

const DEFAULT_PAGE_SIZE = 12;
const CARD_MIN_WIDTH = 220;
const CARD_HEIGHT = 90;
const GRID_GAP = 16;
const SECTION_GAP = 24;
const ROW_FIT_TOLERANCE = 36;

const gridColumns = ref(0);
const viewportHeight = ref(0);

let resizeObserver = null;

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

/* --- 3. 搜索逻辑 --- */
const searchResults = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return [];

  const results = [];
  const traverse = (items) => {
    items.forEach(item => {
      if (item.name && item.name.toLowerCase().includes(query)) {
        results.push({ ...item, isFolder: true, displayName: item.name });
      }
      if (item.title && item.items && item.title.toLowerCase().includes(query)) {
        results.push({ ...item, isFolder: true, displayName: item.title });
      }
      if (item.links) {
        item.links.forEach(link => {
          if (link.title && link.title.toLowerCase().includes(query)) {
            if (link.url) results.push({ ...link, isDoc: true });
            if (link.items) results.push({ ...link, isFolder: true, displayName: link.title });
          }
          if (link.items) {
            link.items.forEach(sub => {
              if (sub.title.toLowerCase().includes(query)) results.push({ ...sub, isDoc: true });
            });
          }
        });
      }
      if (item.items) {
        item.items.forEach(sub => {
          if (sub.title && sub.title.toLowerCase().includes(query) && sub.url) {
            results.push({ ...sub, isDoc: true });
          }
        });
      }
      if (item.children) traverse(item.children);
    });
  };
  traverse(categoriesData.categories);
  return results;
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

  const rows = Math.ceil(count / columns);
  return rows * CARD_HEIGHT + Math.max(0, rows - 1) * GRID_GAP;
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

/* --- 6. 操作函数 --- */
const enterFolder = (name) => {
  currentPath.value.push(name);
  searchQuery.value = '';
  currentPage.value = 1;
};

const goBack = () => {
  currentPath.value.pop();
  currentPage.value = 1;
};

const resetNav = () => {
  currentPath.value = [];
  currentPage.value = 1;
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
});
</script>

<template>
  <div class="custom-home-layout">
    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <input
            v-model="searchQuery"
            class="search-input"
            placeholder="🔍 搜索文件夹或文章标题..."
        />
        <span v-if="searchQuery" class="clear-icon" @click="searchQuery = ''">×</span>
      </div>
    </div>

    <div class="main-grid">
      <!-- 左侧内容区 -->
      <div class="left-content">
        <div class="nav-header">
          <div class="breadcrumb">
            <span class="crumb-item" @click="resetNav">🏠 全部分类</span>
            <span v-for="(item, index) in breadcrumbItems" :key="`${item.label}-${index}`">
              <span class="crumb-separator">/</span>
              <span v-if="index === breadcrumbItems.length - 1 || item.explicitIndex === null" class="crumb-text-current">
                {{ item.label }}
              </span>
              <span v-else class="crumb-item" @click="jumpToPath(item)">
                {{ item.label }}
              </span>
            </span>
          </div>
          <button v-if="currentPath.length > 0" class="back-link" @click="goBack">
            🔙 返回上一级
          </button>
        </div>

        <div class="list-container">
          <div ref="listViewportRef" class="list-viewport">
            <!-- 干净的内容包裹区：去掉了层级缩进相关的 class -->
            <div v-if="pagedDisplay.length > 0" class="list-wrapper">

              <!-- 🌟 文件夹行（排在上方，占满整行宽度，从而实现与文章卡片的自动折行） -->
              <div v-if="pagedFolders.length > 0" class="card-grid">
                <div
                    v-for="item in pagedFolders"
                    :key="getFolderName(item)"
                    class="card folder-card"
                    @click="enterFolder(getFolderName(item))"
                >
                  <span class="folder-label">
                    {{ item.icon || '📂' }} {{ getFolderName(item) }}
                  </span>
                </div>
              </div>

              <!-- 🌟 文章行（自成一派排在下方，样式规格与第一版完全保持一致） -->
              <div v-if="pagedDocs.length > 0" class="card-grid">
                <div
                    v-for="item in pagedDocs"
                    :key="item.url || item.title"
                    class="card doc-card"
                >
                  <a :href="getUrl(item.url)" class="card-link">
                    📄 {{ item.title }}
                  </a>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">没有找到匹配的结果 😅</div>
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
          <h3 class="widget-title">☕ 赞助我</h3>
          <div class="sponsor-tabs">
            <span :class="['tab-item', sponsorType === 'wechat' ? 'active' : '']" @click="sponsorType = 'wechat'">微信</span>
            <span :class="['tab-item', sponsorType === 'alipay' ? 'active' : '']" @click="sponsorType = 'alipay'">支付宝</span>
          </div>
          <div class="sponsor-content">
            <img :src="sponsorType === 'wechat' ? getUrl('/images/wechat.jpg') : getUrl('/images/alipay.jpg')" class="sponsor-img" />
          </div>
          <p class="sponsor-tip">如果觉得文章对你有帮助，可以请我喝杯 coffee ~</p>
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
.search-input {
  width: 100%;
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 16px;
  transition: all 0.3s;
}
.search-input:focus {
  border-color: var(--vp-c-brand);
  outline: none;
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}
.clear-icon {
  position: absolute;
  right: 15px;
  cursor: pointer;
  font-size: 20px;
  color: var(--vp-c-text-2);
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
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  padding: 24px;
  min-height: 550px;
  border: 1px solid var(--vp-c-divider);
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
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.breadcrumb {
  font-size: 15px;
  font-weight: 500;
}
.crumb-item {
  cursor: pointer;
  color: var(--vp-c-brand);
}
.crumb-item:hover {
  text-decoration: underline;
}
.crumb-separator {
  margin: 0 8px;
  color: var(--vp-c-text-3);
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
  transition: all 0.2s;
}
.back-link:hover {
  background: var(--vp-c-brand);
  color: white;
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
  height: 90px;
  padding: 10px 20px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.card:hover {
  transform: translateY(-5px);
  border-color: var(--vp-c-brand);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}
.folder-card {
  color: var(--vp-c-text-1);
  font-weight: 600;
}
.doc-card {
  background: var(--vp-c-brand-soft);
}
.card-link {
  text-decoration: none;
  color: var(--vp-c-text-1);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.folder-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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
  transition: all 0.2s;
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

/* 右侧侧边栏 */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.info-widget {
  background: var(--vp-c-bg-alt);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--vp-c-divider);
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
  margin-bottom: 12px;
  font-size: 14px;
}
.stat-val {
  color: var(--vp-c-brand);
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
  border-radius: 16px;
  background:
      linear-gradient(145deg, rgba(177, 133, 219, 0.14), rgba(255, 255, 255, 0)),
      var(--vp-c-bg);
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
  border-radius: 10px;
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
  color: var(--vp-c-text-2);
  transition: all 0.2s;
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

@media (max-width: 960px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  .right-sidebar {
    order: -1;
  }
  .info-widget {
    height: auto;
  }
  .random-widget-actions {
    flex-wrap: wrap;
  }
}
</style>
