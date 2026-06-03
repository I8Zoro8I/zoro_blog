<script setup lang="ts">
import {computed} from 'vue';
import {useData, useRoute, withBase} from 'vitepress';

type NavItem = {
  text?: string;
  link?: string;
  items?: NavItem[];
};

const props = defineProps<{
  items: NavItem[];
  root?: boolean;
}>();

const route = useRoute();
const {site} = useData();

const normalizePath = (value?: string) => {
  if (!value) {
    return '';
  }

  let normalized = value.split('?')[0].split('#')[0];
  const base = site.value.base || '/';

  if (base !== '/' && normalized.startsWith(base)) {
    normalized = normalized.slice(base.length - 1);
  }

  normalized = normalized.replace(/\/index\.html$/, '/');
  normalized = normalized.replace(/\.html$/, '');

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
};

const currentPath = computed(() => normalizePath(route.path));

const hasChildren = (item: NavItem) => Array.isArray(item.items) && item.items.length > 0;

const isItemActive = (item: NavItem): boolean => {
  if (item.link) {
    const itemPath = normalizePath(withBase(item.link));
    if (itemPath && currentPath.value === itemPath) {
      return true;
    }
  }

  if (hasChildren(item)) {
    return item.items!.some((child) => isItemActive(child));
  }

  return false;
};
</script>

<template>
  <div class="cascade-panel" :class="{'is-root': root}">
    <template v-for="item in items" :key="item.link || item.text">
      <div
        class="cascade-row"
        :class="{
          'is-group': hasChildren(item),
          'is-active': isItemActive(item)
        }"
      >
        <a
          v-if="item.link"
          class="cascade-link"
          :href="withBase(item.link)"
        >
          <span class="cascade-label">{{ item.text }}</span>
          <span v-if="hasChildren(item)" class="cascade-arrow">›</span>
        </a>

        <div v-else class="cascade-link cascade-link-button">
          <span class="cascade-label">{{ item.text }}</span>
          <span v-if="hasChildren(item)" class="cascade-arrow">›</span>
        </div>

        <div v-if="hasChildren(item)" class="cascade-submenu">
          <NavCascadeNode :items="item.items!" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cascade-panel {
  /* ─── 宽度自适应（保持之前的流式包裹） ─── */
  width: max-content !important;
  //min-width: 120px;

  padding: 8px;
  border-radius: 16px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  /* ─── 🌓 核心修改：使用全局变量自动适配亮暗色 ─── */
  /* 背景采用 VitePress 官方的高亮层级背景变量 (elv = elevated) */
  background: var(--vp-c-bg-elv) !important;
  /* 边框采用官方分割线变量 */
  border: 1px solid var(--vp-c-divider) !important;

  /* 融入更细腻的双色投影 */
  box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.06) !important;

  transition: background-color 0.3s, border-color 0.3s;
}

/* 🌙 暗黑模式下微调面板：让卡片带有一点点半透明的悬浮极客质感 */
.dark .cascade-panel {
  background: rgba(22, 24, 28, 0.9) !important;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.36) !important;
}

.cascade-row {
  position: relative;
}

.cascade-link {
  display: flex;
  align-items: center;
  padding: 9px 12px;
  border-radius: 10px;
  /* 文字默认采用官方一级文本颜色（亮色时变黑，暗色时变白） */
  color: var(--vp-c-text-1) !important;
  text-decoration: none;
  transition: background-color 0.18s ease, color 0.18s ease;
  gap: 16px;
}

.cascade-link-button {
  cursor: default;
}

/* ─── 🌓 Hover 与激活状态的双色动态适配 ─── */
.cascade-row:hover > .cascade-link,
.cascade-row.is-active > .cascade-link {
  /* 悬浮背景采用官方提供的柔和灰色/浅白高亮背景 */
  background: var(--vp-c-default-soft) !important;
  /* 悬浮时文字变为你的专属紫色/品牌主题色 */
  color: var(--vp-c-brand) !important;
}

.cascade-label {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 1.35;
  white-space: nowrap !important;   /* 确保不换行 */
  overflow: visible !important;     /* 配合不换行撑开列宽 */
  text-overflow: clip !important;
}

.cascade-arrow {
  flex-shrink: 0;
  /* 箭头颜色使用三级淡色文本，自动跟随主题变动 */
  color: var(--vp-c-text-3) !important;
  font-size: 15px;
  margin-left: auto;
}

/* 悬浮时让小箭头跟着变亮 */
.cascade-row:hover .cascade-arrow {
  color: var(--vp-c-brand) !important;
}

.cascade-submenu {
  position: absolute;
  top: -8px;
  left: calc(100% + 8px);
  opacity: 0;
  visibility: hidden;
  transform: translateX(6px);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
  z-index: 20;
}

.cascade-row:hover > .cascade-submenu,
.cascade-row:focus-within > .cascade-submenu {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}
</style>
