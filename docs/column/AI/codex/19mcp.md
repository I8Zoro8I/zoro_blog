---
date: 2026年07月03日
---

# Codex MCP 服务器配置

MCP（Model Context Protocol，模型上下文协议）允许 Codex 与外部工具和服务集成。

本节详细介绍如何配置和使用 MCP 服务器。

------

## 什么是 MCP？

MCP 是一个开放协议，允许 AI 模型与外部工具和服务进行标准化交互。通过 MCP 服务器，你可以扩展 Codex 的能力：

```mermaid
flowchart TD
    %% 顶层核心
    Core["Codex Core"]:::core
    Layer["MCP Server Layer (mcp_servers)"]:::layer
    %% 三类MCP服务
    FS["文件系统<br/>Filesystem"]:::server
    GH["GitHub<br/>仓库访问"]:::server
    DB["数据库<br/>PostgreSQL"]:::server
    %% 底层工具集
    Tool["Codex 工具集（统一接口）"]:::tool

    %% 连线关系
    Core --> Layer
    Layer --> FS
    Layer --> GH
    Layer --> DB
    FS -- read_file, write_file --> Tool
    GH -- create_issue, create_pr --> Tool
    DB -- query, execute --> Tool

    %% 底部注释
    Note["配置位置: ~/.codex/config.toml 中的 [mcp_servers] 部分"]

```

- 连接文件系统
- 访问数据库
- 集成项目管理工具
- 调用外部 API

> MCP 基于开放的 [Model Context Protocol](https://modelcontextprotocol.io/) 构建，支持跨不同工具的标准化集成。

------

## MCP 基础配置

### Codex 配置菜单

通过设置菜单可以管理或添加 MCP 服务：

![img](https://www.runoob.com/wp-content/uploads/2026/04/runoob_1780219546013.png)

连接至自定义 MCP:

![img](https://www.runoob.com/wp-content/uploads/2026/04/runoob_1780219563386.png)

### 配置文件位置

MCP 服务器在 `~/.codex/config.toml` 的 `mcp_servers` 部分配置。

### stdio 类型服务器

```bash
[mcp_servers.filesystem]
# 服务器启动命令
command = "npx"

# 传递给命令的参数
args = ["-y", "@modelcontextprotocol/server-filesystem", "./docs"]

# 服务器工作目录
cwd = "/path/to/workdir"

# 传递环境变量
env = {
    NODE_ENV = "production"
}
```

### HTTP 类型服务器

```bash
[mcp_servers.docs]
# MCP HTTP 服务器端点
url = "https://docs.example.com/mcp"

# 包含的 HTTP 头
http_headers = {
    Authorization = "Bearer token"
}
```

## MCP 工具配置

### 限制可用工具

你可以限制 MCP 服务器暴露的工具：

```bash
[mcp_servers.filesystem]
# 允许的工具列表
enabled_tools = ["read_file", "write_file", "list_directory"]

# 拒绝的工具列表（在 enabled_tools 之后应用）
disabled_tools = ["delete_file"]
```

> 使用工具限制可以提高安全性，只暴露你需要的工具。

### 超时配置

```bash
[mcp_servers.slow_server]
command = "python"
args = ["-m", "slow_server"]

# 启动超时（秒，默认 10）
startup_timeout_sec = 30

# 每个工具调用超时（秒，默认 60）
tool_timeout_sec = 120
```

## MCP 认证配置

### OAuth 配置

```
[mcp_servers.protected]
url = "https://api.example.com/mcp"

# 请求的 OAuth 范围
scopes = ["read", "write"]

# OAuth 资源参数
oauth_resource = "codex-integration"

# Bearer token 环境变量
bearer_token_env_var = "EXAMPLE_API_TOKEN"
```

### HTTP 头配置

```
[mcp_servers.api]
url = "https://api.example.com/mcp"

# 从环境变量填充 HTTP 头
env_http_headers = {
    X_API_KEY = "MY_API_KEY"
}

# 静态 HTTP 头
http_headers = {
    X_Custom_Header = "value"
}
```

### OAuth 回调配置

```
# 固定回调端口
mcp_oauth_callback_port = 8080

# 自定义回调 URL
mcp_oauth_callback_url = "https://my-devbox.example.com/callback"

# 凭证存储位置
mcp_oauth_credentials_store = "keyring"  # file | keyring | auto
```

## MCP 工具权限

你可以为每个 MCP 服务器的工具单独设置权限：

```
[mcp_servers.docs.tools.search]
# 权限模式：ask | approve | deny
approval_mode = "approve"
```

| 权限模式  | 说明                   |
| :-------- | :--------------------- |
| `ask`     | 每次执行前询问（默认） |
| `approve` | 自动批准               |
| `deny`    | 自动拒绝               |

> 配置工具权限时要小心，确保只授予你信任的工具自动批准权限。

------

## 常用 MCP 服务器

### 文件系统服务器

```
[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "./docs"]
```

### GitHub 服务器

```
[mcp_servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = {
    GITHUB_PERSONAL_ACCESS_TOKEN = "your-token-here"
}
```

### PostgreSQL 服务器

```
[mcp_servers.postgres]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:pass@localhost/db"]
```

## 常用 MCP 服务器

你可以通过 npm 安装更多 MCP 服务器：

```
# 搜索 MCP 服务器
npm search @modelcontextprotocol/server

# 安装 MCP 服务器
npm install -g @modelcontextprotocol/server-filesystem
```

> OpenAI 官方提供了多种 MCP 服务器，查看 [GitHub 仓库](https://github.com/modelcontextprotocol/servers) 获取完整列表。

------

## 故障排除

### 服务器启动失败

检查以下内容：

- 命令和参数是否正确
- 是否已安装必要的依赖
- 环境变量是否设置正确

### 工具调用超时

增加超时时间：

```
tool_timeout_sec = 120
```

### 认证问题

确保 OAuth 回调端口未被占用，凭证存储配置正确。

> 使用 `codex --verbose` 可以查看详细的 MCP 调试信息。

------

## 常见问题

### Q: MCP 服务器无法启动？

检查命令是否正确安装，尝试手动运行命令确认没有错误。

### Q: 工具权限在哪里配置？

在配置文件的 `mcp_servers.<id>.tools.<tool>` 部分配置。

### Q: 如何禁用某个 MCP 服务器？

在配置中添加 `enabled = false` 或直接删除配置。

### Q: 支持多少个 MCP 服务器？

没有严格限制，但建议只配置你实际需要的服务器。
