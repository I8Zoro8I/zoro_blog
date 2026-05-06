---
title: 🛠️ VitePress 深度指南：从零构建高性能静态站点
slug: vitepress-guide
date: 2026-05-01
---

# VitePress：由 Vite 驱动的极简渲染引擎

🔗链接:https://vitepress.dev/

VitePress 是 Vue 官方推出的静态站点生成器（SSG），专为追求性能和简洁的开发者设计。

## 1. 核心原理

VitePress 的架构设计遵循 **"Markdown + Vue + Vite"** 的模式：

* **开发阶段**：利用 Vite 的原生 ESM 模式，实现毫秒级的热更新（HMR），在处理复杂文档时依然保持极致流畅。
* **构建阶段**：通过 Rollup 将 Markdown 转换为高度优化的静态 HTML。
* **运行时**：页面加载后，通过 Vue 的“注水”（Hydration）机制转化为单页应用（SPA），后续跳转无需刷新页面。

## 2. 安装与基础配置

### 2.1 初始化项目

在你的项目根目录下执行：

```bash
# 使用 pnpm 安装核心依赖
pnpm add -D vitepress vue
```

# 运行初始化向导

pnpm vitepress init

### 2.2 核心目录结构

```text
.
├── docs
│   ├── .vitepress          # 核心配置目录
│   │   ├── config.mts      # 全局配置文件
│   │   └── theme           # 自定义主题与插槽
│   ├── public              # 静态资源（Logo、Favicon等）
│   └── index.md            # 首页内容
└── package.json
```

### 2.3 关键工程配置 (config.mts)

```typescript
import {defineConfig} from 'vitepress'

export default defineConfig({
    title: "Zoro Blog",
    description: "技术沉淀与成长记录",
    base: '/zoro_blog/', // 必须与 GitHub Pages 的仓库名一致
    lastUpdated: true,   // 自动获取 Git 提交时间
    cleanUrls: true,     // 移除 URL 末尾的 .html
    themeConfig: {
        search: {
            provider: 'local' // 开启本地搜索索引
        }
    }
})
```

## 3 性能优化

--静态资源引用：使用 withBase 工具函数处理静态路径，避免部署在子路径时图片 404。

--按需渲染：对于复杂的交互，可以使用 ClientOnly 组件包裹，避免服务端渲染（SSR）冲突。