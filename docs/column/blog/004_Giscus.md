---
title: 💬 Giscus：基于 GitHub Discussions 的零成本评论方案
slug: giscus-interaction-layer
date: 2026-05-04
---

# Giscus：利用 GitHub 原生能力构建交互层

🔗链接:https://giscus.app/zh-CN

Giscus 是一款由 GitHub Discussions 驱动的评论系统，实现了博客交互的“去中心化”与“持久化”。

## 1. 原理剖析

Giscus 不自建数据库，而是利用 GitHub 仓库的 **Discussions** 功能：

* **数据映射**：通过 GraphQL API 将博文路径（Pathname）映射到特定的讨论帖。
* **账号体系**：直接使用 GitHub 账号登录，天然防骚扰且支持 Markdown。
* **完全免费**：由于数据存储在 GitHub 讨论区，没有任何存储费用。

## 2. 集成指南

### 2.1 仓库配置

1. 确保仓库为公开（Public）。
2. 在仓库设置中开启 **Discussions**。
3. 在 [giscus.app](https://giscus.app) 授权并获取 `repo-id` 和 `category-id`。

### 2.2 封装为 Vue 组件 (`Giscus.vue`)

```vue

<template>
  <div class="giscus-wrapper">
    <component :is="'script'"
               src="[https://giscus.app/client.js](https://giscus.app/client.js)"
               data-repo="你的仓库名"
               data-repo-id="你的ID"
               data-category="Announcements"
               data-category-id="你的分类ID"
               data-mapping="pathname"
               data-reactions-enabled="1"
               data-theme="preferred_color_scheme"
               data-lang="zh-CN"
               crossorigin="anonymous"
               async>
    </component>
  </div>
</template>
```

### 2.3 自动注入

利用 VitePress 的插槽功能，在 .vitepress/theme/index.mts 中全局注入：

```typescript
export default {
    extends: DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'doc-after': () => h(Giscus) // 将评论区挂载到文档下方
        })
    }
}
```

## 3.进阶建议

1. **分类管理**:推荐使用 Announcements 分类，仅限管理员发起讨论，防止仓库 Discussion 列表混乱。
2. **懒加载**:开启懒加载功能，提升页面的初始加载速度。
