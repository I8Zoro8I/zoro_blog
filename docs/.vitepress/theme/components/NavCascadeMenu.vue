<script setup lang="ts">
import {computed} from 'vue';
import {useData, useRoute, withBase} from 'vitepress';
import NavCascadeNode from './NavCascadeNode.vue';

type NavItem = {
  text?: string;
  link?: string;
  items?: NavItem[];
};

const route = useRoute();
const {theme, site} = useData();

const items = computed(() => (theme.value.nav || []) as NavItem[]);

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
  <nav v-if="items.length" class="cascade-navbar" aria-label="Desktop cascade menu">
    <template v-for="item in items" :key="item.link || item.text">
      <a
        v-if="item.link"
        class="cascade-navbar-link"
        :class="{'is-active': isItemActive(item)}"
        :href="withBase(item.link)"
      >
        {{ item.text }}
      </a>

      <div
        v-else
        class="cascade-navbar-group"
        :class="{'is-active': isItemActive(item)}"
      >
        <button type="button" class="cascade-navbar-trigger">
          <span>{{ item.text }}</span>
          <span class="cascade-navbar-chevron">▾</span>
        </button>

        <div class="cascade-navbar-dropdown">
          <NavCascadeNode :items="item.items || []" root />
        </div>
      </div>
    </template>
  </nav>
</template>

<style scoped>
.cascade-navbar {
  display: none;
}

@media (min-width: 768px) {
  .cascade-navbar {
    display: flex;
    align-items: center;
    gap: 4px;
    height: var(--vp-nav-height);
  }
}

.cascade-navbar-link,
.cascade-navbar-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--vp-nav-height);
  padding: 0 12px;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.cascade-navbar-group {
  position: relative;
}

.cascade-navbar-chevron {
  font-size: 12px;
  opacity: 0.72;
}

.cascade-navbar-link:hover,
.cascade-navbar-trigger:hover,
.cascade-navbar-group.is-active .cascade-navbar-trigger,
.cascade-navbar-link.is-active {
  color: var(--vp-c-brand);
}

.cascade-navbar-dropdown {
  position: absolute;
  top: calc(100% - 12px);
  left: 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
  z-index: 40;

  /* ─── ✨ 核心修改 1：取消固定宽度，改为由内容撑开 ─── */
  width: max-content !important;    /* 核心：宽度等于当前列里最长的那行字 */
  min-width: 140px;                 /* 给个保底的最小宽度，防止字太少时太窄 */
}

.cascade-navbar-group:hover > .cascade-navbar-dropdown,
.cascade-navbar-group:focus-within > .cascade-navbar-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
</style>
