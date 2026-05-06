---
title: 📝 Decap CMS：实现 Git 工作流的无服务器内容管理
slug: decap-cms
date: 2026-05-02
---

# Decap CMS：基于 Git 的内容管理方案

🔗链接:https://decapcms.org/

Decap CMS 允许开发者通过 Web 界面直接编辑 GitHub 仓库中的 Markdown 文件，完全省去了传统数据库的维护成本。

## 1. 技术工作流

1. **认证**：通过 OAuth 流程（配合 Cloudflare Worker）获取 GitHub 访问令牌。
2. **交互**：CMS 调用 GitHub API 读取文件树与内容。
3. **提交**：用户点击“发布”，CMS 会代表用户发起一次 `commit` 直接修改源码，触发自动化构建。

## 2. 安装步骤

### 2.1 创建管理入口

在 `docs/public/admin/index.html` 中引入脚本：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Content Manager</title>
    <script src="[https://unpkg.com/decap-cms](https://unpkg.com/decap-cms)@^3.0.0/dist/decap-cms.js"></script>
</head>
<body></body>
</html>
```

### 2.2 定义字段结构 (config.yml)

```yaml
backend:
  name: github
  repo: 你的用户名/仓库名
  branch: main
  base_url: [ https://your-worker.workers.dev ](https://your-worker.workers.dev) # 你的鉴权地址
  auth_endpoint: auth

media_folder: "docs/public/images"
public_folder: "/images"

collections:
  - name: "blog"
    label: "技术文章"
    folder: "docs/column/blog"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "标题", name: "title", widget: "string" }
      - { label: "发布日期", name: "date", widget: "datetime" }
      - { label: "正文内容", name: "body", widget: "markdown" }
```

## 3. 核心优势

1. 天然版本控制：每一篇文章的修改都有完整的 Git 历史记录。

2. 零成本维护：无需 Nginx 或 MySQL，完全运行在客户端与边缘计算节点。


