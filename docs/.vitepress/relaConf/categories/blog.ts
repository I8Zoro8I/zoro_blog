import type {CategoryConfig} from './types';

export const blogCategory = {
  "name": "博客架构",
  "id": "blog",
  "icon": "🚀",
  "children": [
    {
      "name": "站点技术栈",
      "links": [
        {
          "title": "VitePress 搭建与深度定制指南",
          "url": "/column/blog/001_vitepress",
          "visible": true
        },
        {
          "title": "Decap CMS 去中心化内容管理",
          "url": "/column/blog/002_decapCMS",
          "visible": true
        },
        {
          "title": "Cloudflare Worker 边缘路由鉴权",
          "url": "/column/blog/003_cloundFlareWorkerAuth",
          "visible": true
        },
        {
          "title": "Giscus 基于 GitHub 讨论区的评论系统",
          "url": "/column/blog/004_Giscus",
          "visible": true
        },
        {
          "title": "Umami 隐私安全的自建统计分析",
          "url": "/column/blog/005_umami",
          "visible": true
        }
      ],
      "visible": true
    }
  ],
  "visible": true
} satisfies CategoryConfig;

