---
title: 🔐 Cloudflare Worker：Serverless 边缘鉴权的实现
slug: cloudflare-worker-auth
date: 2026-05-03
---

# Cloudflare Worker：OAuth 鉴权的“中间人”

🔗链接:https://www.cloudflare.com/zh-cn/

在无服务器架构中，Cloudflare Worker 充当了安全的后端代理，处理 GitHub OAuth 流程中的敏感信息。

## 1. 为什么选择 Cloudflare Worker？

* **安全性**：在服务端交换 Token，避免 `client_secret` 在浏览器端暴露。
* **低延迟**：运行在 V8 隔离环境中，冷启动几乎为零。
* **免费额度**：每天 10 万次请求，足以支撑个人博客的登录需求。

## 2. 部署流程

### 2.1 创建 GitHub OAuth App

1. 在 GitHub 设置中创建 OAuth App。
2. **Authorization callback URL**: `https://你的项目.workers.dev/callback`。

### 2.2 核心代码逻辑

Worker 需要监听两个主要路由：

* `/auth`：重定向用户至 GitHub 登录授权页面。
* `/callback`：接收 GitHub 返回的 code，换取访问令牌并安全返回给 CMS 前端。

## 3. 环境变量设置

在 Cloudflare 后台配置：

* `GITHUB_CLIENT_ID`: OAuth App ID。
* `GITHUB_CLIENT_SECRET`: OAuth App 密钥。

## 4. 总结

作为架构中唯一的动态逻辑层，它以 Serverless 形式实现了完整的身份验证闭环。