---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
home: true

hero:
  name: "zoro"
  text: "个人博客"
  tagline: 技术沉淀 · 生活随笔 · 持续成长
  image:
    # 首页右边的图片
     src: /images/avatar.png
     # 图片的描述
     alt: avatar
  # 按钮相关
  actions:
    - theme: brand
      text: 博客介绍
      link: /column/blog
    - theme: alt
      text: 关于我
      link: /column/my

features:
  - icon: 💻 
    title: 技术沉淀
    details: 专注开发与实战，记录项目踩坑、技术复盘，分享可复用的开发经验与技巧
  - icon: 🧩
    title: 生活杂记
    details: 跳出代码世界，记录日常感悟、阅读随笔与成长碎片，藏着不慌不忙的生活态度
  - icon: 📈
    title: 成长存档
    details: 追踪学习进度，记录目标达成与自我突破，每一步前行都有迹可循
---

[//]: # (<!-- 自定义组件 -->)

<script setup>
import { ref, computed } from 'vue';
import { withBase } from 'vitepress'; /* 导入处理 base 路径的工具 */
import categoriesData from './.vitepress/relaConf/categories.json';

const searchQuery = ref('');
const currentPath = ref([]);

/* --- 新增：动态统计逻辑 --- */
const stats = computed(() => {
  let docCount = 0;
  let folderSet = new Set();

  const traverse = (items) => {
    items.forEach(item => {
      /* 统计分类目录（第一层和第二层文件夹） */
      if (item.name) folderSet.add(item.name);
      
      /* 统计文章总数 */
      if (item.links) {
        docCount += item.links.length;
      }
      
      /* 递归子目录 */
      if (item.children) traverse(item.children);
    });
  };

  traverse(categoriesData.categories);
  return {
    docs: docCount,
    folders: folderSet.size
  };
});

/* --- 导航逻辑 --- */
const currentDisplay = computed(() => {
  let temp = categoriesData.categories;
  for (const segment of currentPath.value) {
    /* 这里的 segment 通常是 item.name */
    const found = temp.find(c => c.name === segment);
    if (found) {
      /* 核心修改：优先找 children (二级分组)，找不到再找 links (三级文章) */
      /* 如果都没有，说明到底了，返回空数组 */
      temp = found.children || found.links || [];
    } else {
      return [];
    }
  }
  return temp;
});

/* --- 核心搜索逻辑：支持文件夹 + 文档标题的 DFS 检索 --- */
const searchResults = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return [];
  
  const results = [];
  const traverse = (items) => {
    items.forEach(item => {
      /* 匹配文件夹名称 */
      if (item.name && item.name.toLowerCase().includes(query)) {
        results.push({ ...item, isFolder: true });
      }
      
      /* 匹配文档标题 */
      if (item.links) {
        item.links.forEach(link => {
          if (link.title.toLowerCase().includes(query)) {
            results.push({ ...link, isDoc: true });
          }
        });
      }
      
      if (item.children) traverse(item.children);
    });
  };
  
  traverse(categoriesData.categories);
  return results;
});

/* --- 操作函数 --- */
const enterFolder = (name) => {
  currentPath.value.push(name);
  searchQuery.value = ''; /* 进入时清空搜索 */
};

const handleSearchClick = (item) => {
  if (item.isFolder) {
    enterFolder(item.name);
  }
};

/* 封装跳转函数，自动处理 base 路径 */
const getUrl = (url) => {
  if (!url) return '#';
  return withBase(url);
};

const goBack = () => currentPath.value.pop();
const resetNav = () => currentPath.value = [];
const sponsorType = ref('wechat');
</script>

<div class="custom-home-layout">
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
    <div class="left-content">
      <div class="nav-header">
        <div class="breadcrumb">
          <span class="crumb-item" @click="resetNav">🏠 全部分类</span>
          <span v-for="p in currentPath" :key="p" class="crumb-separator"> 
            / <span class="crumb-text">{{ p }}</span>
          </span>
        </div>
        <button v-if="currentPath.length > 0" class="back-link" @click="goBack">
          🔙 返回上一级
        </button>
      </div>
      <div v-if="searchQuery" class="list-container">
        <div v-if="searchResults.length > 0" class="card-grid">
          <div 
            v-for="item in searchResults" 
            :key="item.url || item.name" 
            class="card"
            :class="item.isDoc ? 'doc-card' : 'folder-card'"
            @click="handleSearchClick(item)"
          >
            <a v-if="item.isDoc" :href="getUrl(item.url)" class="card-link">📄 {{ item.title }}</a>
            <span v-else class="folder-label">{{ item.icon || '📂' }} {{ item.name }}</span>
          </div>
        </div>
        <div v-else class="empty-state">没有找到匹配的结果 😅</div>
      </div>
      <div v-else class="list-container">
        <div class="card-grid">
          <div 
            v-for="item in currentDisplay" 
            :key="item.name || item.title"
            class="card"
            :class="item.url ? 'doc-card' : 'folder-card'"
            @click="item.url ? null : enterFolder(item.name)"
          >
            <a v-if="item.url" :href="getUrl(item.url)" class="card-link">📄 {{ item.title }}</a>
            <span v-else class="folder-label">{{ item.icon || '📂' }} {{ item.name }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="right-sidebar">
      <div class="info-widget">
        <h3 class="widget-title">📊 站点统计</h3>
        <div class="stat-row">
          <span>文章总数</span>
          <strong class="stat-val">{{ stats.docs }}</strong>
        </div>
        <div class="stat-row">
          <span>分类目录</span>
          <strong class="stat-val">{{ stats.folders }}</strong>
        </div>
        <hr class="divider" />
        <h3 class="widget-title">☕ 赞助我</h3>
        <div class="sponsor-tabs">
          <span 
            :class="['tab-item', sponsorType === 'wechat' ? 'active' : '']" 
            @click="sponsorType = 'wechat'"
          >微信</span>
          <span 
            :class="['tab-item', sponsorType === 'alipay' ? 'active' : '']" 
            @click="sponsorType = 'alipay'"
          >支付宝</span>
        </div>
        <div class="sponsor-content">
          <img 
            :src="sponsorType === 'wechat' ? getUrl('/images/wechat.jpg') : getUrl('/images/alipay.jpg')" 
            class="sponsor-img" 
          />
        </div>
      </div>
    </div>
  </div>
</div>


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

/* 网格布局：80/20 */
.main-grid {
  display: grid;
  grid-template-columns: 8fr 2fr;
  gap: 32px;
}

 /*左侧面板 */
.left-content {
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  padding: 24px;
  min-height: 500px;
  border: 1px solid var(--vp-c-divider);
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

/* 卡片展示 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.card {
  padding: 24px;
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
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
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
}
.widget-title {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--vp-c-text-1);
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
.quick-links {
  list-style: none;
  padding: 0;
}
.quick-links li {
  margin-bottom: 10px;
}
.quick-links a {
  color: var(--vp-c-brand);
  font-size: 14px;
  text-decoration: none;
}
.quick-links a:hover {
  text-decoration: underline;
}

/* 响应式适配 */
@media (max-width: 960px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  .right-sidebar {
    order: -1; /* 移动端统计放在上面 */
  }
}

.sponsor-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  justify-content: center;
}
.tab-item {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}
.tab-item.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}
.sponsor-img {
  width: 130px;
  height: 130px;
  display: block;
  margin: 0 auto;
  border-radius: 4px;
}
</style>
