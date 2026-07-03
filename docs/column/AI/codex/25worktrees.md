---
date: 2026年07月03日
---

# Codex Worktrees 使用

Worktrees 允许你在 Git 仓库中创建多个工作目录，使你能够并行处理不同的任务而不会相互干扰。

------

## 什么是 Worktree？

Git Worktree 是 Git 的一个功能，允许你在同一个仓库中创建多个工作目录。Codex 对 Worktree 提供了原生支持。

### 使用场景

- 并行开发多个功能
- 保持主分支干净
- 同时进行开发和代码审查

![img](https://www.runoob.com/wp-content/uploads/2026/04/app-worktree.webp)

> Worktree 让你可以像有多台电脑一样同时工作。

------

## 在 Codex 中使用 Worktree

### 创建 Worktree

```
# 在 Codex 应用中创建 Worktree
# 1. 选择项目
# 2. 点击 "New" -> "Worktree"
# 3. 输入分支名称
# 4. 点击创建
```

### 在 Worktree 中运行任务

在创建线程时选择 Worktree 模式：

| 模式         | 说明                         |
| :----------- | :--------------------------- |
| **Local**    | 在当前项目目录工作           |
| **Worktree** | 在独立的 Git worktree 中工作 |

> Worktree 模式创建新的 Git worktree，保持变更隔离。

------

### Worktree 管理

```
# 查看 worktree 列表
git worktree list

# 创建新的 worktree
git worktree add ../feature-branch -b feature-branch

# 删除 worktree
git worktree remove ../feature-branch
```

## 最佳实践

- 为每个功能或修复创建独立的 Worktree
- 使用描述性的分支名称
- 完成后及时清理不需要的 Worktree

> Worktree 是并行开发的利器，特别适合大型项目。
