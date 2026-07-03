---
date: 2026年07月03日
---

# Codex 自动化与 CI/CD

Codex 提供多种自动化方式，可以在脚本、流水线和服务端中使用。

------

## 非交互模式（exec）

exec 命令用于脚本和自动化场景，不需要打开 TUI。

### 基本用法

```bash
# 执行单次任务
codex exec "审查代码并输出报告"

# 输出到文件
codex exec -o review.md "审查 src/auth.py"

# 使用特定模型
codex exec -m gpt-5.4-mini "分析项目结构"

# 全自动执行
codex exec --full-auto "运行测试并修复失败"
```

### 常用参数

| 参数              | 说明                    |
| :---------------- | :---------------------- |
| `-m`              | 指定模型                |
| `-o`              | 输出结果到文件          |
| `--full-auto`     | 全自动执行              |
| `--ephemeral`     | 不保存会话文件          |
| `--json`          | JSON Lines 输出格式     |
| `--output-schema` | 按 JSON Schema 格式输出 |
| `--sandbox`       | 设置沙箱模式            |

### 从标准输入读取

```bash
# 从管道读取
echo "解释这个错误" | codex exec -

# 从文件读取
codex exec - < task.txt

# 多行任务
cat <<EOF | codex exec -
分析 src/ 目录
找出潜在的 Bug
输出修复建议
EOF
```

### 恢复会话

```bash
# 恢复最近会话
codex exec resume --last "继续修复 Bug"

# 恢复指定会话
codex exec resume --session abc123 "下一步任务"
```

> 默认情况下，exec 运行在只读沙箱中，不会修改文件。

------

## Codex SDK

Codex SDK 提供编程接口，可以在代码中调用 Agent 能力。

### 安装 SDK

```bash
npm install @openai/codex-sdk
```

### 使用示例

```js
import { Codex } from '@openai/codex-sdk';

// 创建 Codex 客户端
const codex = new Codex({
  apiKey: process.env.OPENAI_API_KEY
});

// 执行任务
const thread = await codex.run({
  prompt: '审查 src/auth.py 文件',
  model: 'gpt-5.4'
});

// 获取结果
console.log(thread.messages);

// 继续任务
const followUp = await codex.run({
  threadId: thread.id,
  prompt: '修复发现的 Bug'
});
```

### SDK 适用场景

- 集成到 CI/CD 管道
- 创建自定义 Agent 应用
- 自动化内部工具
- 批量处理任务

------

## GitHub Action

官方提供 Codex GitHub Action，可在 CI 流水线中触发任务。

### 基本工作流

```yaml
span style="color: green;">
name: Codex Review

on: [pull_request]

jobs:
  codex-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Codex Review
        uses: openai/codex-action@v1
        with:
          prompt-file: '.github/codex-review.md'
          model: 'gpt-5.4'
          sandbox: 'workspace-write'
          output-file: 'review.md'

      - name: Post Review
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.md', 'utf8');
            github.rest.pulls.createReview({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              body: review,
              event: 'COMMENT'
            });
```

### Action 参数

| 参数          | 说明             |
| :------------ | :--------------- |
| `prompt`      | 直接指定任务描述 |
| `prompt-file` | 指定任务文件路径 |
| `model`       | 使用的模型       |
| `sandbox`     | 沙箱模式         |
| `output-file` | 输出文件路径     |
| `codex-args`  | 额外 CLI 参数    |

### 安全配置

```yaml
span style="color: green;">
- name: Run Codex
  uses: openai/codex-action@v1
  with:
    prompt: '审查变更'
    safety-strategy: 'drop-sudo'
    unprivileged-user: 'codex-runner'
    allow-users: ['maintainers']
```

*使用 GitHub Action 时，确保 API Key 作为 Secrets 存储，不要硬编码。*

## App Server

App Server 将 Codex 能力作为服务端 API 暴露。

### 启动 App Server

```bash
# 启动 App Server
codex app-server

# 指定端口
codex app-server --port 3000

# 远程访问
codex --remote ws://server:3000
```

### 适用场景

- 团队共享 Codex 能力
- 远程 CI/CD 调用
- 集成到内部平台

------

## MCP Server

将 Codex 作为 MCP 工具提供给其他 Agent 调用。

### 配置 Codex MCP

```bash
# 其他 Agent 的配置中
[mcp_servers.codex]
command = "codex"
args = ["mcp-server"]
```

## 最佳实践

### 安全性

- 使用只读沙箱模式
- API Key 作为 Secrets 存储
- 限制触发条件（仅特定事件）
- 审查输出后再应用更改

### 可靠性

- 设置合理的超时时间
- 使用 --ephemeral 避免状态残留
- 验证任务成功后再继续
- 处理失败情况的回滚

------

## 常见问题

### Q: exec 和交互模式的区别？

exec 单次执行后退出，适合自动化；交互模式持续对话。

### Q: CI/CD 中如何认证？

使用 CODEX_API_KEY 环境变量，作为 Secrets 存储。

### Q: GitHub Action 可以修改文件吗？

可以，设置 sandbox: workspace-write。

### Q: 如何在 Docker 中使用？

将 Codex 安装到镜像，配置好认证后调用。
