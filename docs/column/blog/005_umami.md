---
title: 📊 Umami：轻量级且尊重隐私的开源统计方案
slug: umami-analytics-guide
date: 2026-05-06
---

# Umami：开发者首选的网站统计工具

在完成了博客的交互（Giscus）与内容管理（Decap CMS）后，我们需要一套数据监控系统来了解访问流量。Umami 是一款开源、隐私友好、且完全不依赖 Cookie 的统计工具，是 Google Analytics 的完美替代品。

## 1. 为什么选择 Umami？

对于后端开发者而言，Umami 的吸引力在于：
* **数据自主**：你可以自建后端，统计数据完全存储在自己的 PostgreSQL 数据库中。
* **极度轻量**：追踪脚本仅约 2KB，对页面首屏加载时间（LCP）几乎无影响。
* **合规性**：不收集个人身份信息，不使用 Cookie，无需在博客展示“隐私政策确认弹窗”。
* **监控视角**：提供实时访客视图，能直观看到流量来源、设备类型及热门文章。

## 2. 系统架构

Umami 的运行链路非常清晰：
1. **采集层**：注入博客的 `script.js` 监听并采集页面访问行为。
2. **传输层**：采集到的数据通过 HTTP POST 请求发送到 Umami 后端服务。
3. **持久层**：后端服务将数据写入 PostgreSQL 数据库。
4. **展示层**：通过 Umami Dashboard 进行数据可视化分析。



## 3. 部署方案：自建“白嫖”全家桶

虽然 Umami 提供官方云服务，但作为开发者，推荐使用 **Vercel + Supabase** 的自建方案，实现 100% 数据掌控且永久免费。

### 3.1 准备数据库 (Supabase)
1. 注册并登录 [Supabase](https://supabase.com/)。
2. 创建一个新项目，在 `Settings -> Database` 中找到你的 **Connection string (URI)**。
3. 记录下类似于 `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres` 的字符串。

### 3.2 部署应用 (Vercel)
1. 在 GitHub 搜索并 Fork [umami-software/umami](https://github.com/umami-software/umami) 项目。
2. 在 [Vercel](https://vercel.com/) 中导入你 Fork 的仓库。
3. 配置环境变量：
    * `DATABASE_URL`: 填入刚才记录的 Supabase 连接串。
    * `APP_SECRET`: 填入一个随机长字符串（用于加密）。
4. 点击部署，等待完成后，你将获得一个统计面板地址，例如 `https://my-umami.vercel.app`。

## 4. 在 VitePress 中集成

### 4.1 获取配置信息
1. 登录你的 Umami 面板，进入 `Settings -> Websites`。
2. 添加你的博客域名：`i8zoro8i.github.io`。
3. 复制生成的 **Website ID**。

### 4.2 注入代码 (`config.mts`)
在 VitePress 配置文件中，利用 `head` 钩子全局注入脚本：

```typescript
// .vitepress/config.mts
import { defineConfig } from 'vitepress'

export default defineConfig({
  head: [
    [
      'script',
      {
        async: '',
        defer: '',
        // 如果是自建，请使用你的 Vercel 域名
        src: '[https://your-umami.vercel.app/script.js](https://your-umami.vercel.app/script.js)', 
        'data-website-id': '你的-WEBSITE-ID'
      }
    ]
  ]
})
```

## 5. 常见问题排查 (Troubleshooting)
- Invalid domain 报错：在 Umami 后台添加网站时，Domain 仅填写主机名（如 i8zoro8i.github.io），不要包含 http:// 或路径后缀。
- 统计数据不更新:
  - 检查浏览器 Console 是否有跨域 (CORS) 报错。
  - 检查 Network 面板中 collect 请求的状态码是否为 200。
  - 确认是否在本地开发环境（Localhost）测试，Umami 默认会忽略本地流量。

