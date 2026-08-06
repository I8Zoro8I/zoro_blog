---
title: Immich本地图床
date: 2026年08月06日
---

【超详细】Windows WSL2 + Docker Desktop 本地部署 Immich 私人相册服务器全过程

**简介**：Immich 是开源、高颜值、功能极强的私人相册备份/管理工具，支持手机自动备份、AI 人脸识别、场景分类、时光轴、原图无损存储。本文提供 **Windows10/11 + WSL2 + Docker Desktop** 从零搭建完整教程，含全部 WSL 命令、配置详解、避坑指南、日常运维，可直接落地部署。

**部署环境要求**

- 系统：Windows 10 21H2+ / Windows 11
- 运行内存：≥6GB（低于6GB极易报错重启）
- 存储：优先 SSD（数据库严禁机械盘/网络NAS盘）
- 核心依赖：WSL2、Docker Desktop

**默认访问端口**：2283

**默认访问地址**：`http://localhost:2283`

## 一、前置准备：安装并配置 WSL2

全程使用 **管理员 PowerShell** 执行命令

### 1.1 检查 WSL 状态

```Plain
# 查看已安装WSL发行版及版本
wsl --list --verbose
wsl -l -v

# 查看WSL整体运行状态
wsl --status
```

### 1.2 一键安装 WSL2（无环境时执行）

```Plain
# 自动安装WSL2 + 默认Ubuntu发行版
wsl --install
```

安装完成后 **必须重启电脑** 生效。

### 1.3 统一切换为 WSL2 内核

```Plain
# 设置默认WSL版本为2
wsl --set-default-version 2

# 将已有的Ubuntu发行版切换为WSL2（按需执行）
wsl --set-version Ubuntu 2
```

### 1.4 必备 Windows 功能开启

打开：控制面板 → 程序 → 启用或关闭 Windows 功能，勾选：

- 适用于 Linux 的 Windows 子系统
- 虚拟机平台

确认后重启电脑。

### 1.5 WSL 常用运维命令（全程必备）

```Plain
# 进入WSL Ubuntu终端
wsl

# 关闭所有WSL虚拟机（Docker同步停止）
wsl --shutdown

# 单独终止指定发行版
wsl --terminate Ubuntu

# 设置默认启动发行版
wsl --set-default Ubuntu

# WSL发行版备份/迁移
wsl --export Ubuntu D:\backup\ubuntu.tar
wsl --import Ubuntu D:\wsl\ubuntu D:\backup\ubuntu.tar
```

### 1.6 优化 WSL2 内存占用（解决卡顿/内存溢出）

在 `C:\Users\你的用户名\` 新建文件 `.wslconfig`（无后缀），写入以下配置：

```Plain
[wsl2]
memory=6GB
processors=4
swap=2GB
localhostForwarding=true
```

保存后执行命令生效：

```Plain
wsl --shutdown
```

## 二、安装并配置 Docker Desktop

### 2.1 下载安装

官方下载地址：[Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

安装关键选项：**务必勾选 Use WSL 2 instead of Hyper-V**

### 2.2 基础验证

安装完成重启电脑，打开 Docker Desktop，等待图标变绿即为运行正常。PowerShell 执行验证：

```Plain
docker --version
docker compose version
```

### 2.3 WSL 核心配置（必做，否则挂载报错）

打开 Docker Desktop → Settings

1. **Resources → WSL Integration**：开启默认发行版集成，打开 Ubuntu 开关，Apply & Restart
2. **Resources → File sharing**：将存放 Immich 的磁盘（如 D 盘）加入共享列表

## 三、准备 Immich 部署文件

### 3.1 创建部署目录

推荐纯英文无空格路径，示例：`D:\immich-app`

⚠️ 禁止中文路径、桌面路径、用户文档路径！

### 3.2 下载官方核心文件

进入 `D:\immich-app`，下载两个官方文件并放入目录：

- [docker-compose.yml](https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml)
- [example.env](https://github.com/immich-app/immich/releases/latest/download/example.env)

将 `example.env`**重命名为 `.env`**（关闭系统文件后缀隐藏，杜绝 `.env.txt`）

## 四、核心配置 .env 文件

用记事本/VS Code 打开 `.env`，仅修改以下核心参数，其余默认保留。

**关键规则：启动终端不同，路径写法完全不同！**

### 4.1 PowerShell 启动专用配置（新手推荐）

```Plain
# 照片视频存储目录
UPLOAD_LOCATION=D:/immich-app/library
# 数据库存储目录（必须本地SSD）
DB_DATA_LOCATION=D:/immich-app/postgres
# 时区
TZ=Asia/Shanghai
# 版本跟随最新
IMMICH_VERSION=release
# 自定义数据库密码（务必修改）
DB_PASSWORD=Immich123456
```

### 4.2 WSL Ubuntu 终端启动专用配置

```Plain
UPLOAD_LOCATION=/mnt/d/immich-app/library
DB_DATA_LOCATION=/mnt/d/immich-app/postgres
TZ=Asia/Shanghai
IMMICH_VERSION=release
DB_PASSWORD=Immich123456
```

## 五、启动 Immich 服务

### 5.1 PowerShell 启动方式（推荐）

```Plain
# 进入部署目录
cd D:\immich-app

# 后台启动所有容器
docker compose up -d

# 查看容器运行状态
docker compose ps

# 查看实时日志（排错专用）
docker compose logs -f
```

### 5.2 WSL Ubuntu 启动方式

```Plain
# 进入WSL
wsl

# 切换到部署目录
cd /mnt/d/immich-app

# 启动服务
docker compose up -d

# 查看AI模块日志（模型加载慢专用）
docker compose logs -f immich-machine-learning
```

✅ 所有服务状态为 **Up** 即为启动成功，机器学习模块首次启动会自动下载AI模型，需等待2-5分钟。

## 六、网页初始化配置

1. 浏览器访问：`http://localhost:2283`
2. 点击 `Get Started` 开始初始化
3. 自定义创建 **管理员账号（邮箱+密码）**
4. 登录后即可上传照片、开启手机备份、使用AI分类功能

**局域网访问**：`http://电脑局域网IP:2283`（手机、平板同网段可访问）

## 七、Immich 日常运维命令大全

```Plain
# 停止服务（保留所有数据）
docker compose down

# 重启服务
docker compose restart

# 升级到最新版本
docker compose pull
docker compose up -d

# 查看全部实时日志
docker compose logs -f

# 仅查看AI人脸识别模块日志
docker compose logs -f immich-machine-learning

# 危险操作！删除所有容器和数据（仅测试使用）
docker compose down -v
```

## 八、高频报错避坑指南

### 8.1 容器反复重启、报错 137

原因：内存不足。解决：修改 `.wslconfig`调高内存至 4GB+，执行 `wsl --shutdown` 重启生效。

### 8.2 无权限、无法写入文件

原因：磁盘未加入 Docker 共享、路径中文/空格、后缀为 `.env.txt`。解决：检查 File sharing 配置、修正路径、修改文件后缀。

### 8.3 端口 2283 被占用

修改 `docker-compose.yml` 中 `2283:2283` 为 `2284:2283`，访问端口同步变更。

### 8.4 电脑休眠后无法访问

原因：休眠导致 WSL 停止。解决：执行 `wsl --shutdown`，重启 Docker Desktop。

### 8.5 数据库损坏

严禁将 `DB_DATA_LOCATION` 挂载 NAS/网络磁盘，数据库必须本地 SSD 存储，照片库可存放NAS。

## 九、手机端使用方法

1. 手机与电脑连接同一局域网
2. Immich APP 填写服务器地址：`http://电脑局域网IP:2283`
3. 输入管理员账号密码登录，开启自动备份、原图上传功能

## 十、总结

本文完成了 Windows WSL2 环境下 Immich 从环境部署、文件配置、启动运行、初始化设置到日常运维的全流程，全程无冗余操作，规避了90%以上新手报错。搭建完成后即可拥有完全私有化、无广告、不限速的私人相册系统，完美替代公共云相册。