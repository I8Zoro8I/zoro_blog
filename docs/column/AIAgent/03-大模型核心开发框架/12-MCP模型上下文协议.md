---
date: 2026年08月26日
---

# MCP 模型上下文协议

------

**本章课程目标：**

- 理解 **MCP（Model Context Protocol，模型上下文协议）** 是什么、解决什么痛点，以及它与 Tool、RAG、Agent 的定位区别。
- 掌握 MCP 的**主机 / 客户端 / 服务器**架构、核心能力、常见传输方式，以及 `mcp.json`、FastMCP、LangChain MCP 适配器在项目中的作用。
- 跑通并理解本章全部案例：**极简教学版服务端、FastMCP 服务端、天气 MCP 服务、同进程客户端、基于 `mcp.json` + LangChain Agent 的 MCP 客户端**，为后续学习 第 13 章 Agent 智能体 打基础。

**学习建议：** MCP 先别当成一堆协议名背，它的核心是把外部能力接入模型应用时变得更标准。第一遍只抓三组关系：Tools / Resources / Prompts 是暴露的能力，Host / Client / Server 是通信角色，stdio / Streamable HTTP 是传输方式。学完 第 13 章 Agent 智能体 后再回来看 `Agent + MCP`，会更容易理解它为什么重要。

**官方文档与资源**：详见 [工具导航与参考资料索引 - 工具调用、MCP与智能体](https://i8zoro8i.github.io/zoro_blog/column/AIAgent/工具导航与参考资料索引)。

------

## 1、为什么需要 MCP

### 1.1 真实项目里的接入痛点

很多同学第一次接触 MCP 时，会把它理解成“让大模型联网”或“让大模型能调用工具”。这只说对了一部分。
更核心的问题其实不是“模型能不能用工具”，而是“不同 AI 应用怎样用统一方式接入外部工具和上下文”。

在没有 MCP 时，真实项目里常见的痛点主要有三类：

- **每个 AI 应用都要重复接一遍外部系统**
  例如同样是接 GitHub、Slack、数据库、文件系统，Cursor 要写一套，Claude Desktop 要写一套，自研 Agent 平台又要写一套。
- **每个框架和宿主各有自己的接法**
  即使大家都支持 Tool / Function Calling，真正落地时仍然要处理：服务如何发现、参数 schema 怎么描述、鉴权怎么传、进程怎么启动、结果怎么返回。
- **工具很难复用成“生态能力”**
  没有统一协议时，一个工具即使写得很好，也往往只能服务于某个特定应用，迁移和复用成本很高。

![无 MCP 时：各 AI 应用需分别对接 GitHub、Slack、数据库等，重复开发与适配成本高](https://didilili.github.io/ai-agents-from-zero/images/20/20-1-1-1.jpeg)

所以，MCP 出现的背景，不是“以前没人会写工具”，而是：

**大家都在写工具，但缺少一套跨应用、跨框架、跨宿主都能复用的统一连接标准。**

### 1.2 MCP 的核心问题

MCP 解决的问题可以概括成一句话：**让“外部工具、资源、提示词模板”等能力，能够按统一协议被不同 AI 应用发现和使用。**

举个更贴近项目的例子。假设你在 IDE 里有一个 AI 编程助手，希望它能：

- 读取本地代码仓库
- 查 GitHub Issue
- 调内部文档系统
- 查询云服务配置
- 调用数据库辅助排查问题

如果没有 MCP，你往往要为这个 AI 助手单独实现很多连接器。如果这些能力都已经按 MCP 标准暴露，那么这个 AI 助手只需要支持 MCP，就可以统一接入这些服务。

这时，MCP 的价值就很明显了：**一次暴露，多处复用**；**统一 schema，降低适配成本**；**更容易形成工具生态**。

### 1.3 直观类比：AI 世界的统一插口

很多同学都记得钢铁侠的助手「贾维斯」：它不是只会聊天，而是能连接战甲、实验室、摄像头、数据库、控制系统等各种外部能力。

现实中的 AI 应用也是一样。一个真正有用的 AI 助手，往往不仅要“说”，还要能：查本地文件、查数据库、搜 GitHub Issue、调天气接口、发消息到 Slack / 微信 / 邮件、调用内部业务系统。

![若缺乏统一协议，每接一类系统都要单独实现连接与鉴权，维护成本陡增](https://didilili.github.io/ai-agents-from-zero/images/20/20-1-3-1.jpeg)

如果每接一个系统都单独写一套连接逻辑，成本会非常高。MCP 的思路，就是给 AI 应用提供一个更像“**统一插口**”的东西。

把它理解成一层统一插口会更直观：它像 **AI 世界的 USB-C**，也像 **大模型版的 OpenFeign / gRPC 协议层**，本质上承担的是 **AI 应用和外部能力之间的通用适配层**。

把这层直觉和上一节连起来理解会更顺：**MCP 统一的不是模型本身，而是 AI 应用发现、理解、调用和复用外部能力的方式。**

------

## 2、MCP 简介

### 2.1 定义

MCP（Model Context Protocol，模型上下文协议）是一套**开放的标准协议**，用于规范 **AI 应用 / Agent / IDE / 聊天客户端** 如何与 **外部工具、资源和上下文提供方** 交互。

官方的核心表述可以概括成：

- MCP 标准化了应用程序向 LLM 提供上下文的方式
- 它让 AI 应用可以用统一方式连接不同的数据源和工具

入门阶段可先把握这一点：

**MCP 的关键词是“标准协议、统一接入、跨宿主复用”。**

### 2.2 和 Tool、RAG、Agent 有什么区别

| 概念                        | 解决什么问题                   | 典型关注点                               |
| --------------------------- | ------------------------------ | ---------------------------------------- |
| **Tool / Function Calling** | 模型如何调用一个具体工具       | 工具 schema、参数、调用结果              |
| **RAG**                     | 模型如何拿到外部知识上下文     | 文档加载、切块、检索、上下文拼接         |
| **MCP**                     | 外部能力如何被标准化暴露与接入 | Host / Client / Server、协议、传输、发现 |
| **Agent**                   | 谁来规划、决策、调用这些能力   | 推理、编排、记忆、执行闭环               |

一句话速记：

> **术语约定：** 本章里表格写作 **Tool / Function Calling**，是为了兼容不同文档语境；和 第 9 章 一样，你可以把它们先看成同一层“模型如何表达工具调用意图”的机制。

- **Tool** 解决“能不能调用”
- **RAG** 解决“能不能拿到知识”
- **MCP** 解决“怎么统一接入”
- **Agent** 解决“谁来决定何时调用”

------

## 3、MCP 能做什么

### 3.1 统一接入与抽象

MCP 最直观的价值，就是把原本分散的外部能力，用统一方式暴露给 AI 应用。

![分散接入：各工具、服务、客户端各自约定协议与 schema，重复适配多](https://didilili.github.io/ai-agents-from-zero/images/20/20-3-1-1.jpeg)

> **说明**：「分」——各应用、各数据源各自对接，重复开发、难以复用。

![MCP 统一层：标准化暴露后，由 Host 侧按同一套方式发现与调用能力](https://didilili.github.io/ai-agents-from-zero/images/20/20-3-1-2.jpeg)

> **说明**：「合」——通过 MCP 等统一协议，一次开发、多端复用。

所以，MCP 不是在替代 Tool，而是在 Tool 之上再向上抽象了一层“协议层”。

### 3.2 MCP 服务器通常能暴露什么

根据官方文档，MCP 服务器最核心的三类能力是：

| 类型          | 作用                                                | 控制方式                    | 对应案例                                       |
| ------------- | --------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| **Tools**     | 可执行动作，例如查天气、查数据库、发请求            | **模型可触发**              | `McpServer.py`、`McpServerWeatherByFastMCP.py` |
| **Resources** | 可读取内容，例如文件、配置、数据库 schema、API 响应 | **应用 / 宿主决定如何使用** | `McpServerByFastMCP.py` 的 `@mcp.resource()`   |
| **Prompts**   | 可复用的提示词模板 / 工作流模板                     | **用户显式选择更常见**      | `McpServerByFastMCP.py` 的 `@mcp.prompt()`     |

官方对三者的控制方式有明确区分：

- **Tools 是 model-controlled**
- **Resources 是 application-driven**
- **Prompts 更偏 user-controlled**

也就是说：

- Tool 更适合让模型自动决定何时调用
- Resource 更适合由宿主决定如何纳入上下文
- Prompt 更适合由用户显式触发某种模板化工作流

这也是为什么不能把 MCP 简单理解成“就是工具协议”。**工具是 MCP 的一部分，但不是全部。**

### 3.3 容易忽略的另外几类能力

除了 Tools / Resources / Prompts，官方协议里还有一些更进阶的客户端 / 会话能力，例如：

- **Sampling**：服务器通过客户端向**宿主侧的 LLM** 请求一次生成（把“算力在哪一侧”也纳入协议协作）
- **Elicitation**：服务器通过客户端向用户请求补充信息
- **Logging**：服务器向客户端发送结构化日志
- **Progress / Notifications**：长任务过程中的进度和通知

这些内容在当前仓库案例里没有作为主线展开，但对理解 MCP 很重要，因为它说明：

**MCP 不只是“列出工具然后调用工具”，它还定义了更完整的人机协作和上下文交换机制。**

不过对本章来说，先重点掌握：

- Tool 如何暴露
- 服务器和客户端怎么连
- LangChain / Agent 如何拿到 MCP 工具

就已经足够了。

### 3.4 在实际项目的常见用途

在真实项目里，MCP 最常见的落地方向通常有三种：

1. **给现成 AI 应用接能力**
   例如让 Cursor、Claude Desktop、VS Code、ChatGPT 类客户端接入文件系统、代码库、浏览器、内部系统。
2. **给自研 Agent 平台做统一工具接入层**
   这样 Agent 平台就不用为 GitHub、数据库、知识库、Slack、云平台各写一套不同协议。
3. **让企业内部能力变成可复用的 AI 接口层**
   例如把“查工单”“查订单”“查配置”“发通知”这些能力封装成 MCP 服务，供多个 AI 应用共享。

**安全与信任边界（落地必知）：** MCP Server 往往能以较高权限访问本机文件、内网 API 或密钥；生产环境应控制**来源可信**（仅安装审计过的服务）、**最小权限**与**网络隔离**，并记录调用审计。这与“能接什么”同样重要。

------

## 4、怎么用 MCP

### 4.1 直接使用现成的 MCP 服务

如果你的目标不是“学习怎么实现协议”，而是“先把能力接进来”，最直接的方式通常是：

- 找到现成的 MCP Server
- 在宿主应用里配置连接方式
- 让客户端自动发现其 Tools / Resources / Prompts

当前官方已经有 Registry 方向的能力和生态，公共 MCP 服务器的发现也越来越规范化。这意味着：

**很多能力无需一开始就自己写服务端，先学会怎么接、怎么配、怎么调试也很有必要。**

![通过 Registry 或目录浏览、发现已发布的 MCP 服务与能力（示意）](https://didilili.github.io/ai-agents-from-zero/images/20/20-4-1-1.jpeg)

### 4.2 本地自建 MCP 服务端

如果你要接的是：本地文件系统、内部数据库、企业私有 API、自己的业务系统。

那通常就要自己写 MCP Server。这也是本章案例的重点：我们会通过本地天气服务、FastMCP 示例和 `mcp.json` 客户端配置，理解一个 MCP 服务是如何被暴露、被发现、再被 Agent 使用的。

#### 4.2.1 什么是 FastMCP

这里很适合顺手把 **FastMCP** 这个词讲清楚，因为后面的案例文件名里会频繁出现它。

**FastMCP 是 MCP 官方 Python 生态里用来快速编写 MCP Server 的高层封装。**它帮你把很多底层样板工作收起来，让你可以更接近“写 Python 函数”的方式去暴露 MCP 能力。

先把它和 MCP 的关系看成下面这组对应：

- **MCP** 是协议标准，解决“AI 应用怎么统一接入外部能力”
- **FastMCP** 是 Python 里的服务端开发工具，解决“我怎么更方便地把能力按 MCP 标准暴露出去”

也就是说：**MCP 是规则**，**FastMCP 是实现这些规则的一种工具**。这就像：HTTP 是协议，FastAPI / Flask 是帮助你实现 HTTP 服务的框架。

放到这一章里也是一样：MCP 决定 Host、Client、Server 之间怎么协作，FastMCP 帮你更轻松地写出一个 MCP Server。

#### 4.2.2 本章为什么讲 FastMCP

在真实项目里，如果你准备自己写一个 MCP 服务端，通常有两条常见路线：

1. **自己直接按 SDK / 协议细节去实现**
2. **借助 FastMCP 这种更高层的封装来实现**

第二条路线通常更友好，因为它能把注意力放回到“我要暴露什么能力”上，而不是一开始就陷进大量底层细节。

这也是为什么本章案例会分成两类：

- `McpServer.py`
  这是教学版极简实现，帮助你理解“服务端注册工具”这个最小概念。
- `McpServerByFastMCP.py`、`McpServerWeatherByFastMCP.py`
  这是更贴近真实 Python MCP 开发体验的写法，帮助你理解 Tool / Resource / Prompt 怎么按官方 SDK 风格暴露出去。

因此这一章里，**FastMCP 不是主角，MCP 协议本身才是主角；但 FastMCP 很适合作为 Python 侧的入门实现工具。**

### 4.3 在 LangChain / Agent 里使用 MCP

这一点也和当前项目主线非常贴近。

LangChain 官方已经提供了对 MCP 的适配支持。常见路线是：

1. 用 `MultiServerMCPClient` 连接一台或多台 MCP 服务器
2. 通过 `get_tools()` 取回 MCP 工具
3. 把这些工具交给 `create_tool_calling_agent` 或 `create_agent`
4. 让 Agent 在对话中实际调用它们（Agent 的创建与执行细节见 第 13 章 Agent 智能体）

这也说明了 MCP 和 LangChain 的关系：

- **MCP** 负责“标准化接入”
- **LangChain / Agent** 负责“把接进来的能力真正用起来”

------

## 5、MCP 架构知识

### 5.1 主机、客户端、服务器定义

MCP 采用典型的 **Host - Client - Server** 架构。

![MCP 架构：Host（用户应用）内的 Client 与远端或子进程中的 Server 通信，Server 再访问本地/远程资源](https://didilili.github.io/ai-agents-from-zero/images/20/20-5-1-1.jpeg)

| 角色                         | 含义                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| **MCP Host（MCP 主机）**     | 用户真正交互的应用，例如 IDE、桌面客户端、聊天应用、自研 AI 平台 |
| **MCP Client（MCP 客户端）** | Host 内部负责和某个 MCP Server 建立协议连接的组件            |
| **MCP Server（MCP 服务器）** | 对外暴露 Tools / Resources / Prompts 等能力的服务            |
| **本地 / 远程资源**          | 服务器可访问的文件、数据库、API、内部系统等                  |

官方文档里需要分清一个点：

- **Host 是你在用的应用**
- **Client 是 Host 内部的协议连接组件**

这也是为什么“一个 Host 可以连多台 Server”，但“一个具体 Client 通常对应一条到某台 Server 的直接连接”。

![多 Server 拓扑：同一 Host 可挂多个 Client，各 Client 分别维护到一台 Server 的会话](https://didilili.github.io/ai-agents-from-zero/images/20/20-5-1-2.jpeg)

### 5.2 MCP 协议层面大致怎么工作

MCP 不只是“发 HTTP 请求”这么简单，它在协议层有自己的一套约定。
学习本章时，先理解下面这条主线即可：

1. **Host / Client 发起连接**
2. **Client 和 Server 做初始化**
3. **双方声明各自支持的 capabilities**
4. **客户端发现服务器提供的 tools / resources / prompts**
5. **按需调用或读取**
6. **结果返回给 Host，再由模型 / UI 使用**

MCP 的底层消息格式基于 **JSON-RPC 2.0**（请求 / 响应 / 通知）。这也是为什么你会在很多资料里看到：

- request / response / notification
- capabilities negotiation
- initialize

MCP 更像是：**“AI 应用与外部能力之间的协议层 + 能力发现层 + 调用层”**而不只是某个单纯的 SDK。

#### 5.2.1 用 5 个动作理解一次完整 MCP 调用

如果把 MCP 放回一轮真实问答里，可以把它拆成下面 5 个动作：

1. **握手与能力发现（Handshake & Discovery）**
   Host 启动后，会根据配置连接 MCP Server，并完成初始化。此时客户端会知道：这台服务器提供了哪些 Tools、Resources、Prompts，以及它支持哪些 capabilities。
2. **用户提问与上下文注入（Context Injection）**
   用户提出问题后，Host 会把“用户问题 + 已发现的工具说明 / 资源信息 / 提示词信息”一并提供给模型或应用逻辑。
3. **模型或应用做决策（Reasoning / Decision）**
   模型决定是否需要调用某个 Tool，或者应用决定是否读取某个 Resource、选用某个 Prompt。
4. **路由与执行（Routing & Execution）**
   Host / Client 按协议把请求发给 MCP Server。Server 在自己的进程或远端服务中执行真正的逻辑，例如查天气、读文件、查数据库。
5. **结果回传与继续生成（Result Feedback）**
   Server 把结果返回给 Client，Client 再把结果交回 Host，由 Host 继续让模型生成最终回答，或者直接展示给用户。

可以把这个过程和第 9 章 Tool 调用对比着理解：

- **Tool 调用** 更像“模型知道怎么调一个函数”
- **MCP** 更像“这个函数来自哪里、怎么发现、怎么连接、怎么按协议调”

这也是为什么在 Agent 场景里，MCP 常常出现在 Tool 之前一层。

### 5.3 两类常见传输：STDIO 与 HTTP 系列

这一节先把新旧叫法分清楚。

根据 **MCP 官方传输规范**（文档以 Transports 等页面为准，版本会迭代），当前主线标准传输是：

1. **stdio**
2. **Streamable HTTP**

官方还明确说明：

- **Streamable HTTP** 取代了 **2024-11-05 版本中的 HTTP+SSE transport**
- 新的 HTTP 传输里，服务器**仍然可以使用 SSE 作为流式返回机制**

也就是说，今天更准确的理解应该是：

- **STDIO**：本地子进程通信
- **Streamable HTTP**：独立服务进程，通过 HTTP 通信，必要时可配合 SSE 流式返回

而你在很多旧资料、旧案例、适配器配置里看到的 `sse`，通常属于：

- 旧的 HTTP+SSE transport 叫法
- 或兼容写法
- 或具体库层面对历史接口的保留

![传输方式对照：stdio（子进程管道）与 Streamable HTTP（独立 HTTP 服务，可含 SSE 流式）及历史 SSE 兼容语境](https://didilili.github.io/ai-agents-from-zero/images/20/20-5-3-1.jpeg)

结合仓库现有案例，可以这样看：

| 传输方式                    | 更适合什么场景                     | 对应案例                                   |
| --------------------------- | ---------------------------------- | ------------------------------------------ |
| **STDIO**                   | 本地、轻量、由客户端拉起服务端进程 | `McpServerByFastMCP.py`                    |
| **SSE / HTTP 兼容教学写法** | 理解历史资料、理解远程服务形态     | `McpServerWeatherByFastMCP.py`、`mcp.json` |
| **当前规范重点**            | 优先理解为 `Streamable HTTP`       | 新项目应以官方规范为准                     |

读仓库案例时记住两点：

- **本章案例保留 `sse` 写法，是为了兼容仓库现有代码**
- **当前规范重点应理解为 `stdio + Streamable HTTP`**

#### 5.3.1 传输之外，还要注意安全边界

MCP 真正落地时，传输方式只是第一层，安全边界同样重要。结合官方安全实践，先记住下面几条：

- **写操作要有人确认**：删除、外呼、支付、批量修改这类 Tool，不要默认让模型静默执行。
- **HTTP 服务要做鉴权和来源校验**：至少要考虑 token、会话身份、Origin / 来源校验，而不是“能连上就算接入成功”。
- **本地服务尽量收口暴露范围**：能只监听本机就不要默认对公网开放，避免把调试用 MCP Server 直接变成外网入口。
- **日志与业务数据要分级处理**：进度、错误、调试日志很有用，但不要把敏感配置、私有数据原样暴露给模型或不可信客户端。

### 5.4 FastMCP 的基本写法与常用 API

仓库里的 MCP 服务端案例，主要围绕 FastMCP / 官方 Python SDK 这条路线展开。看案例前，先把这几个 API 的职责记住：

#### 5.4.1 创建服务实例

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Demo")
```

这一步是在创建一个 MCP Server 实例。

#### 5.4.2 注册 Tool

```python
@mcp.tool()
def add(a: int, b: int) -> int:
    return a + b
```

这表示把一个普通 Python 函数暴露成 MCP Tool。

#### 5.4.3 注册 Resource

```python
@mcp.resource("greeting://default")
def get_greeting() -> str:
    return "Hello from static resource!"
```

这表示服务器对外暴露一个可读资源，客户端可以按 URI 读取。

#### 5.4.4 注册 Prompt

```python
@mcp.prompt()
def greet_user(name: str, style: str = "friendly") -> str:
    return f"为{name}生成问候语"
```

这表示服务器对外暴露一个可复用提示词模板。

#### 5.4.5 启动服务

```python
mcp.run(transport="stdio")
```

或者：

```python
mcp.run(transport="streamable-http")
```

在当前仓库案例里，还保留了：

```python
mcp.run(transport="sse", host="127.0.0.1", port=8000)
```

这类写法用于保留仓库现有案例。阅读时把它放在“**历史兼容 / 教学保留**”的语境里即可。

#### 5.4.6 从底层 SDK 视角看客户端

`McpClientAgent.py` 用的是更高层的 `MultiServerMCPClient`，它把很多底层细节都封装掉了。
但从学习角度，知道底层客户端大概在做什么，会更有助于你理解 MCP。

以官方 SDK 思路来看，一个 MCP 客户端的典型动作通常是：

1. 建立传输连接
2. 创建 `ClientSession`
3. 调用 `initialize()`
4. `list_tools()` / `list_resources()` / `list_prompts()`
5. `call_tool()` / `read_resource()` / `get_prompt()`

如果是 **STDIO**，大致会是这样的顺序：

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    server_params = StdioServerParameters(
        command="python",
        args=["mcp_server_stdio.py"],
    )
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            result = await session.call_tool("add", {"a": 1, "b": 2})
            print(tools)
            print(result)

asyncio.run(main())
```

如果是 **Streamable HTTP**，核心差异主要在“连接方式”变成了远程 URL：

```python
import asyncio
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

async def main():
    async with streamable_http_client("http://127.0.0.1:8000/mcp") as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            print(tools)

asyncio.run(main())
```

你不需要一上来就背这些底层 API，但知道这层动作很有价值，因为它能帮助你理解：为什么要先 `initialize()`；为什么客户端能“列出”工具、资源和提示词；为什么 `MultiServerMCPClient` 本质上是在帮你封装这些底层过程。

### 5.5 完整调用过程理解

把协议层想象成一条完整链路，会更容易理解：

1. 用户在 Host 中发起请求
2. Host 内部某个 MCP Client 与对应 Server 建立会话
3. Client 发现 Server 暴露的能力
4. 模型或应用决定是否调用某个 Tool / 读取某个 Resource / 获取某个 Prompt
5. Server 执行或返回结果
6. Host 把结果展示给用户，或继续交给模型推理

如果这个流程再落到 LangChain Agent 里，就会变成：

1. `MultiServerMCPClient` 连接 MCP 服务
2. `get_tools()` 获取工具
3. Agent 拿到工具列表
4. 用户提问
5. Agent 选择工具
6. 工具返回结果
7. 模型基于结果继续生成最终回答

------

## 6、案例实战：本地 MCP 天气服务与客户端

### 6.1 本章案例在项目中的位置

核心文件如下：

| 文件                           | 作用                   | 你应该怎样理解它                                        |
| ------------------------------ | ---------------------- | ------------------------------------------------------- |
| `McpServer.py`                 | 极简教学版服务端       | **概念演示版**，帮助理解“工具如何注册和暴露”            |
| `McpServerByFastMCP.py`        | FastMCP 正式写法示例   | 展示 `tool / resource / prompt + stdio`                 |
| `McpServerWeatherByFastMCP.py` | 天气服务端             | 展示天气 Tool 和 HTTP/SSE 兼容写法                      |
| `McpClient.py`                 | 简化版客户端           | **同进程教学版**，不是严格意义上的协议网络客户端        |
| `mcp.json`                     | 客户端连接配置         | 声明要连接哪些 MCP 服务、怎么连接                       |
| `McpClientAgent.py`            | LangChain + MCP 客户端 | 更贴近真实项目，读取 `mcp.json` 后把 MCP 工具交给 Agent |

### 6.2 服务端案例区分理解

#### 6.2.1 极简教学版：McpServer.py

【案例源码】`案例与源码-2-LangChain框架/11-mcp/McpServer.py`

```py
"""
【案例】本地 MCP 天气服务端（极简实现，无 FastMCP 依赖）

对应教程章节：第 12 章 - MCP 模型上下文协议 → 6、案例实战：本地 MCP 天气服务与客户端

知识点速览：
- 本案例是「教学版极简 MCP 服务端」：它重点演示 @mcp.tool() 背后的注册思想，让读者先理解
  “服务端负责暴露能力”这件事，再去看 FastMCP 的正式写法。
- 这里的 MCPWeatherServer 只模拟了“工具注册表 + 服务进程存活”两件事，并没有完整实现真实 MCP
  通信中的 JSON-RPC、握手、能力发现、标准传输层，所以它更适合拿来建立概念，不适合当成生产级 MCP 服务。
- 与第 9 章 Tool 的区别：Tool 更像单进程里的能力封装；MCP 则是在 Tool 之上增加一层标准协议，
  让同一套能力更容易被不同宿主、不同 AI 应用复用。
- 仓库里保留了 transport="sse" 这类写法，主要是为了和本章 mcp.json、网络化演示案例保持一致；
  如果从当前官方主线理解，初学者更应该先把 stdio 和 HTTP/Streamable HTTP 当作重点。
"""

import json
import os
import httpx
from loguru import logger
from dotenv import load_dotenv

load_dotenv()


# ---------------------- 极简版 MCP 服务类（无 FastMCP 依赖，纯手写）----------------------
# 若使用 FastMCP，则不需要下面这一整段 class，直接 mcp = FastMCP("名") + @mcp.tool() + mcp.run() 即可，见 McpServerWeatherByFastMCP.py
class MCPWeatherServer:
    """极简版教学服务类：只保留“注册工具”和“维持进程”两层概念。"""

    def __init__(self, name: str, host: str, port: int):
        # 保留原实例化参数，与原代码配置对齐
        self.name = name
        self.host = host
        self.port = port
        # 存储已注册的工具函数；本仓库里的同进程客户端会直接读取这个注册表做教学演示
        self._tools = {}

    def tool(self):
        """实现 @mcp.tool() 装饰器：把普通函数登记到工具注册表中。"""

        def decorator(func):
            self._tools[func.__name__] = func  # 注册工具函数，key 为函数名
            return func

        return decorator

    def run(self, transport: str):
        """模拟 run() 入口；这里只打印监听信息并保持进程存活，不提供完整网络服务。"""
        if transport != "sse":
            logger.warning(f"不支持的传输协议 {transport}，默认使用 SSE")
        logger.info(f"启动 MCP SSE 天气服务器，监听 http://{self.host}:{self.port}/sse")
        self._keep_alive()

    def _keep_alive(self):
        """简单保持进程运行，便于从日志层面观察“服务端已启动”的状态。"""
        try:
            while True:
                pass
        except KeyboardInterrupt:
            logger.info("MCP 天气服务器已停止")


# ---------------------- 创建 MCP 实例并注册工具 ----------------------
# 对应教程：MCP 架构中的「MCP 服务器」角色，为客户端提供可暴露的能力
# 若改用 FastMCP：构造函数只接受服务名，不能写 FastMCP(..., host=..., port=...)；
# host/port 在 run() 时传，如 mcp.run(transport="sse", host="127.0.0.1", port=8000)。参见 McpServerWeatherByFastMCP.py
mcp = MCPWeatherServer("WeatherServerSSE", host="127.0.0.1", port=8000)


@mcp.tool()  # 将 get_weather 注册为 MCP 工具；教学版客户端会直接从注册表里取出它
def get_weather(city: str) -> str:
    """
    查询指定城市的即时天气信息。
    参数 city: 城市英文名，如 Beijing
    返回: OpenWeather API 的 JSON 字符串
    """
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": os.getenv(
            "OPENWEATHER_API_KEY"
        ),  # 从环境变量读取 API Key，避免写死密钥
        "units": "metric",  # 使用摄氏度
        "lang": "zh_cn",  # 输出语言为简体中文
    }
    resp = httpx.get(url, params=params, timeout=10)
    data = resp.json()
    logger.info(f"查询 {city} 天气结果：{data}")
    return json.dumps(data, ensure_ascii=False)


if __name__ == "__main__":
    logger.info("启动 MCP SSE 天气服务器，监听 http://127.0.0.1:8000/sse")
    mcp.run(transport="sse")

"""
【输出示例】
2026-03-13 10:53:49.293 | INFO     | __main__:<module>:86 - 启动 MCP SSE 天气服务器，监听 http://127.0.0.1:8000/sse
2026-03-13 10:53:49.293 | INFO     | __main__:run:46 - 启动 MCP SSE 天气服务器，监听 http://127.0.0.1:8000/sse
"""

```

这个文件最重要的价值，不是“严格协议完整实现”，而是**帮助你先看懂 MCP 服务端到底在干什么**。

它做的核心事情只有两件：

1. 维护一个 `_tools` 容器
2. 用 `@mcp.tool()` 把 `get_weather` 注册进去

所以它更像一个“**MCP 思想演示版**”。

你应该把它理解成：

- 帮你先理解“服务器暴露工具”这件事
- 帮你理解客户端为什么能发现工具
- 帮你理解 MCP 和普通 `@tool` 的关系

但也要明确：**它不是一个严格意义上完整、标准、可独立对外服务的 MCP 服务器实现。**

#### 6.2.2 标准写法入门版：McpServerByFastMCP.py

【案例源码】`案例与源码-2-LangChain框架/11-mcp/McpServerByFastMCP.py`

```py
"""
【案例】使用 FastMCP 官方库搭建 MCP 服务端（工具 / 资源 / 提示词）

对应教程章节：第 12 章 - MCP 模型上下文协议 → 6、案例实战：本地 MCP 天气服务与客户端

知识点速览：
- FastMCP 是 MCP 的 Python 官方实现之一，通过 @mcp.tool()、@mcp.resource()、@mcp.prompt() 暴露
  工具、静态资源和提示词模板，对应教程中「MCP 能做什么」这一节的三类核心能力。
- 从控制方式理解会更清楚：Tool 更偏 model-controlled，Resource 更偏 application-driven，
  Prompt 更偏 user-controlled；本案例的价值就是把这三类能力放在同一个最小服务端里看清楚。
- 本示例使用 transport=\"stdio\"，即通过标准输入/输出与客户端通信，最适合本地开发、命令行宿主、
  IDE 插件这类场景；如果你后面看到仓库里的 `sse` 写法，可以把它理解为网络化演示和兼容语境。
- 注意：直接在终端单独运行 stdio 服务时，没有 MCP 客户端接管 stdin/stdout，输入回车就可能触发
  Invalid JSON 这类报错；这不是 FastMCP 坏了，而是因为 stdio 服务本来就应该由宿主进程来启动。
"""

# pip install mcp
# pip install pywin32  # Windows 下部分功能需要
from mcp.server.fastmcp import FastMCP

# 创建 MCP 实例，对应「MCP 服务器」角色
mcp = FastMCP("Demo")


# 为 MCP 实例添加工具：最典型的“可执行动作”
@mcp.tool()
def add(a: int, b: int) -> int:
    return a + b


# 为 MCP 实例添加资源：资源更像“可读取内容”，常由宿主决定是否拿来做上下文
@mcp.resource("greeting://default")
def get_greeting() -> str:
    return "Hello from static resource!"


# 为 MCP 实例添加提示词模板：更像“可复用的提示词入口”或工作流模板
@mcp.prompt()
def greet_user(name: str, style: str = "friendly") -> str:
    styles = {
        "friendly": "写一句友善的问候",
        "formal": "写一句正式的问候",
        "casual": "写一句轻松的问候",
    }
    return f"为{name}{styles.get(style, styles['friendly'])}"


if __name__ == "__main__":
    # STDIO 模式：与主进程通过标准输入/输出通信，适合本地集成。
    # 注意：直接运行本脚本时，没有 MCP 客户端连接，stdin 收到终端输入（如回车）会被当 JSON 解析，
    # 导致 Invalid JSON / Internal Server Error，属预期现象。正确用法是由 Cursor/Claude 等 MCP 客户端
    # 启动本进程并接管 stdin/stdout；如果想做网络化示例，可看仓库里的 McpServerWeatherByFastMCP.py。
    mcp.run(transport="stdio")


"""
常见问题（保留供排查）：

方案 1：若出现 ModuleNotFoundError: No module named 'pywintypes'
- Windows 下部分依赖需要 pywin32，可尝试：pip install pywin32

方案 2：等待 pywin32 适配 Python 3.13（被动，无需改动环境）
- 若不想降级 Python 版本，可等待 pywin32 官方发布支持 Python 3.13 的版本；
  或使用本仓库中的 McpServer.py 极简实现（无 FastMCP，适配更多 Python 版本）。

方案 3：直接运行脚本报 Invalid JSON / Internal Server Error
- STDIO 模式需由 MCP 客户端（如 Cursor、Claude Desktop）启动本进程并接管 stdin/stdout；
  在终端单独运行时没有客户端发送 JSON-RPC，收到回车等会解析失败，属正常现象。
"""

```

这个文件更接近“官方 Python SDK / FastMCP 的正常使用方式”，它同时演示了：

- `@mcp.tool()`
- `@mcp.resource()`
- `@mcp.prompt()`
- `mcp.run(transport="stdio")`

它很适合用来回答一个关键问题：**MCP 服务器不只是暴露工具，它还可以暴露资源和提示词模板。**

这也是本章里最适合拿来建立“Tools / Resources / Prompts 三分法”直觉的案例。

#### 6.2.3 天气服务端：McpServerWeatherByFastMCP.py

【案例源码】`案例与源码-2-LangChain框架/11-mcp/McpServerWeatherByFastMCP.py`

```py
"""
【案例】用 FastMCP 实现天气查询 MCP 服务（SSE + 指定 host/port）

对应教程章节：第 12 章 - MCP 模型上下文协议 → 6、案例实战：本地 MCP 天气服务与客户端

知识点速览：
- 这是一个“网络化 MCP Tool 服务”案例：它只暴露一个天气查询工具，用来配合同目录的 mcp.json
  和 McpClientAgent.py 演示“服务端独立启动 → 客户端连接 → Agent 调工具”这条完整链路。
- 与 McpServer.py 的关系：McpServer.py 是教学版极简服务端，这个文件才是更贴近真实 SDK 用法的
  FastMCP 写法；两者都在讲“服务端暴露工具”，只是抽象层级不同。
- 与 McpServerByFastMCP.py 的关系：后者重点在 Tools / Resources / Prompts 三类能力，这个文件则聚焦
  “一个真实工具如何通过网络方式暴露出去”。
- 本仓库保留 transport="sse" 的写法，是为了和 mcp.json、课程截图、网络化示例保持一致；如果从
  当前官方主线理解，初学者还要知道 stdio 和 HTTP/Streamable HTTP 才是更需要重点理解的传输方式。
- 正确写法：mcp = FastMCP("服务名")  →  mcp.run(transport="sse", host="127.0.0.1", port=8000)
- 错误写法：mcp = FastMCP("服务名", host="127.0.0.1", port=8000)  # FastMCP 构造函数不支持 host/port
"""

from typing import Any


import json
import os

# pip install mcp httpx python-dotenv
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
import httpx

load_dotenv()

# 构造函数只接受「服务名」；网络绑定信息在 run() 时再指定
mcp = FastMCP(
    "WeatherServerSSE"
)  # "WeatherServerSSE" 就是你自己起的名，可改成 "MyWeather" 等


@mcp.tool()
def get_weather(city: str) -> str:
    """查询指定城市的即时天气信息。city 为城市英文名，如 Beijing、Shanghai。"""
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": os.getenv("OPENWEATHER_API_KEY"),
        "units": "metric",
        "lang": "zh_cn",
    }
    resp = httpx.get(url, params=params, timeout=10)
    data = resp.json()
    return json.dumps(data, ensure_ascii=False)


if __name__ == "__main__":
    # host、port 在 run() 时传入，不是构造函数。
    # 这里启动后，mcp.json 中的 weather 服务就可以按约定地址连到它。
    mcp.run(transport="sse", host="127.0.0.1", port=8000)

```

这个文件主要展示两件事：

1. 如何把天气查询封装成 MCP Tool
2. 如何把服务端作为“独立服务”运行起来

这个文件仍使用仓库中的 `transport="sse"` 写法。阅读时把它当作“独立服务形态”的教学案例即可；新项目的传输方式，仍优先对照前面 5.3 节里的 `stdio / Streamable HTTP`。

### 6.3 mcp.json 简介

【配置文件】`案例与源码-2-LangChain框架/11-mcp/mcp.json`

```json
{
  "mcpServers": {
    "weather": {
      "url": "http://127.0.0.1:8000/sse",
      "transport": "sse"
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "transport": "stdio"
    }
  }
}

```

这一节我特别想帮你纠正一个常见误区：

**`mcp.json` 不是 MCP 协议本身，也不是“唯一契约”。**

它更准确的定位是：**某些 MCP Host / Client / 适配器常用的客户端连接配置文件。**

也就是说，它解决的是：

- 要连接哪几台服务器
- 每台服务器用什么 transport
- URL / command / args 是什么

而不是：

- MCP 协议本体如何定义
- Tool schema 的完整定义如何写

这里的 `mcp.json` 主要读三类信息：

- ```
  weather
  ```

  - 走 `sse`
  - 指向本地天气服务

- ```
  fetch
  ```

  - 走 `stdio`
  - 通过命令启动一个本地 MCP Server

这也很好地体现了 MCP 的一个现实特点：**同一个客户端完全可以同时连接多台 MCP Server，而且每台服务器可以用不同传输方式。**

### 6.4 客户端案例怎么区分理解

#### 6.4.1 同进程教学版客户端：McpClient.py

【案例源码】`案例与源码-2-LangChain框架/11-mcp/McpClient.py`

```py
"""
【案例】本地 MCP 天气客户端（直接调用服务端已注册工具）

对应教程章节：第 12 章 - MCP 模型上下文协议 → 6、案例实战：本地 MCP 天气服务与客户端

知识点速览：
- MCP 客户端的职责是“连接服务端、发现能力、发起调用”；真实项目里一个客户端可以连接一个或多个
  MCP 服务，本案例只是为了教学演示，先从最简单的单服务端开始。
- 本案例为「同机、同进程演示」：客户端通过 Python 的 `from McpServer import mcp` 直接拿到服务端的
  mcp 实例，再用 mcp._tools 调用已注册工具，并没有走真实的 MCP 协议通信。这样做的目的，是先看懂
  「工具暴露 → 能力发现 → 发起调用」这条最小路径，再去理解后面的 FastMCP 与 LangChain 客户端案例。
- 实际生产里，客户端通常会通过 stdio 或 HTTP/Streamable HTTP 连接独立的 MCP 服务；本仓库也保留了
  `sse` 写法作为兼容和教学示例。
- 运行方式：直接运行本文件即可。它会自动导入 McpServer.py 中的 mcp 对象，无需先单独启动服务端进程。
"""

import json
from loguru import logger

# 「连接」方式：通过导入获取服务端的 mcp 对象，直接读取其工具注册表，并非真实网络连接
from McpServer import mcp


class MCPWeatherClient:
    """教学版客户端：直接访问服务端注册表，用来观察最小调用链路。"""

    def __init__(self, mcp_instance):
        self.mcp_instance = mcp_instance
        # 获取服务端已注册的所有工具（字典：工具名 -> 可调用函数）
        # 真实 MCP 客户端不会直接碰 _tools，而是先握手/发现能力，再通过协议发起调用
        self.available_tools = mcp_instance._tools

    def check_tool_availability(self, tool_name: str) -> bool:
        """检查指定工具是否在服务端已注册，避免调用不存在的工具"""
        is_available = tool_name in self.available_tools
        if is_available:
            logger.info(f"工具 '{tool_name}' 可用")
        else:
            logger.warning(f"工具 '{tool_name}' 未在服务端注册")
        return is_available

    def call_get_weather(self, city: str) -> str or None:
        """调用服务端的 get_weather 工具，查询指定城市天气"""
        tool_name = "get_weather"
        if not self.check_tool_availability(tool_name):
            return None

        try:
            # 直接调用服务端已注册的工具函数。
            # 真实项目里，这一步通常由 MCP 客户端经由 stdio 或 HTTP 传输层去完成。
            weather_result = self.available_tools[tool_name](city)
            logger.info(
                f"成功获取 {city} 天气数据，返回结果长度：{len(weather_result)}"
            )
            return weather_result
        except Exception as exc:
            logger.error(f"调用 {tool_name} 工具失败：{str(exc)}")
            return None


def run_client_demo():
    """客户端演示：初始化客户端，依次查询多城市天气并格式化输出"""
    logger.info("初始化 MCP 天气客户端...")
    client = MCPWeatherClient(mcp)

    # 调用天气查询工具（支持 Beijing、Shanghai、Guangzhou 等英文城市名）
    target_cities = ["Beijing", "Shanghai"]
    for city in target_cities:
        logger.info(f"\n========== 查询 {city} 天气 ==========")
        weather_data = client.call_get_weather(city)
        if weather_data:
            # 格式化输出结果（可选，方便阅读）
            formatted_data = json.dumps(
                json.loads(weather_data), indent=4, ensure_ascii=False
            )
            print(f"格式化天气结果：\n{formatted_data}")
        print("-" * 50)


if __name__ == "__main__":
    logger.info("启动 MCP 天气客户端...")
    run_client_demo()

"""
【输出示例】
2026-03-13 11:09:46.119 | INFO     | __main__:<module>:75 - 启动 MCP 天气客户端...
2026-03-13 11:09:46.119 | INFO     | __main__:run_client_demo:57 - 初始化 MCP 天气客户端...
2026-03-13 11:09:46.119 | INFO     | __main__:run_client_demo:63 -
========== 查询 Beijing 天气 ==========
2026-03-13 11:09:46.119 | INFO     | __main__:check_tool_availability:32 - 工具 'get_weather' 可用
2026-03-13 11:09:46.830 | INFO     | McpServer:get_weather:84 - 查询 Beijing 天气结果：{'coord': {'lon': 116.3972, 'lat': 39.9075}, 'weather': [{'id': 804, 'main': 'Clouds', 'description': '阴，多云', 'icon': '04d'}], 'base': 'stations', 'main': {'temp': 4.94, 'feels_like': 4.03, 'temp_min': 4.94, 'temp_max': 4.94, 'pressure': 1027, 'humidity': 41, 'sea_level': 1027, 'grnd_level': 1021}, 'visibility': 10000, 'wind': {'speed': 1.39, 'deg': 6, 'gust': 1.02}, 'clouds': {'all': 100}, 'dt': 1773371280, 'sys': {'type': 1, 'id': 9609, 'country': 'CN', 'sunrise': 1773354606, 'sunset': 1773397087}, 'timezone': 28800, 'id': 1816670, 'name': 'Beijing', 'cod': 200}
2026-03-13 11:09:46.830 | INFO     | __main__:call_get_weather:46 - 成功获取 Beijing 天气数据，返回结果长度：570
格式化天气结果：
{
    "coord": {
        "lon": 116.3972,
        "lat": 39.9075
    },
    "weather": [
        {
            "id": 804,
            "main": "Clouds",
            "description": "阴，多云",
            "icon": "04d"
        }
    ],
    "base": "stations",
    "main": {
        "temp": 4.94,
        "feels_like": 4.03,
        "temp_min": 4.94,
        "temp_max": 4.94,
        "pressure": 1027,
        "humidity": 41,
        "sea_level": 1027,
        "grnd_level": 1021
    },
    "visibility": 10000,
    "wind": {
        "speed": 1.39,
        "deg": 6,
        "gust": 1.02
    },
    "clouds": {
        "all": 100
    },
    "dt": 1773371280,
    "sys": {
        "type": 1,
        "id": 9609,
        "country": "CN",
        "sunrise": 1773354606,
        "sunset": 1773397087
    },
    "timezone": 28800,
    "id": 1816670,
    "name": "Beijing",
    "cod": 200
}
"""

```

这个文件容易让人误会，这里需要讲清楚：它的重点是演示：

- 服务端如何暴露工具
- 客户端如何发现工具
- 工具如何被调用

但它的实现方式是：

- `from McpServer import mcp`
- 直接读 `mcp._tools`
- 同进程内直接调用函数

所以它更像：**MCP 思路演示版客户端**，而不是：**真正按协议通过网络或子进程传输连接到独立服务端的客户端**。也正因为如此，它很适合入门，但不适合被误当成“正式 MCP 网络调用案例”。

#### 6.4.2 更贴近真实项目的客户端：McpClientAgent.py

【案例源码】`案例与源码-2-LangChain框架/11-mcp/McpClientAgent.py`

```py
"""
【案例】基于 mcp.json + LangChain Agent 的 MCP 客户端（LLM + MCP 工具）

对应教程章节：
- 第 12 章 - MCP 模型上下文协议 → 6、案例实战：本地 MCP 天气服务与客户端
- 第 13 章 - Agent 智能体 → 5、实操与案例（5.4 Agent + MCP）

知识点速览：
- 从同目录的 mcp.json 加载 MCP 服务配置，使用 langchain_mcp_adapters 的 MultiServerMCPClient 连接多台
  MCP 服务器并获取工具列表，再交给 LangChain 的 create_tool_calling_agent + AgentExecutor，形成
  「LLM + MCP 工具」的对话 Agent。这也是第 13 章里“外部工具接入 Agent”的代表案例。
- mcp.json 是“客户端侧的连接配置约定”，不是 MCP 协议本身。它描述的是“有哪些服务、分别怎么连”，
  例如本仓库里既有网络方式的 weather 服务，也有 stdio 方式的 fetch 服务。
- 流程：加载 mcp.json → 初始化 MultiServerMCPClient → 异步获取 MCP Tools → 创建 DeepSeek 模型与
  提示模板 → 组装 Agent 与 AgentExecutor → 启动命令行聊天循环（输入 quit 退出）。
- 本案例重点展示“把 MCP Tools 交给 LangChain Agent”；Resources 和 Prompts 虽然也是 MCP 能力，
  但这里没有作为主线展开。
- 这个文件延续了仓库里更容易教学的 classic Agent 路线；如果改走更偏 1.x 的直接路线，也常见
  `await client.get_tools()` 之后把工具交给 `create_agent`，再配合 `ainvoke()` / `astream()` 使用。
- 依赖：pip install langchain-mcp-adapters langchain-openai langchain-classic loguru；部分适配器要求 Python 3.12 及以下。需配置环境变量 deepseek-api（或改用其他兼容 OpenAI 的 api_key/base_url）。
"""

import asyncio
import json
import os
from pathlib import Path

from loguru import logger

# 默认 mcp.json 路径（与本文件同目录）
_MCP_JSON_PATH = Path(__file__).resolve().parent / "mcp.json"


def load_servers(file_path: str | Path | None = None) -> dict:
    """
    加载 MCP 服务器配置。
    :param file_path: 配置文件路径，默认使用同目录下的 mcp.json
    :return: 完整配置字典，如 {"mcpServers": {"weather": {...}, "fetch": {...}}}

    这里读取的是“客户端如何连接服务”的约定配置，而不是协议本体。
    """
    path = Path(file_path) if file_path else _MCP_JSON_PATH
    if not path.exists():
        logger.warning(f"未找到 mcp 配置文件: {path}")
        return {"mcpServers": {}}
    with open(path, "r", encoding="utf-8") as f:
        config = json.load(f)
    logger.info(
        f"已加载 mcp 配置: {path}，共 {len(config.get('mcpServers', {}))} 个服务"
    )
    return config


async def run_chat_loop(config_path: str | Path | None = None) -> None:
    """
    启动并运行一个基于 MCP 工具的聊天 Agent 循环。
    该函数会：1）加载 MCP 服务器配置；2）初始化 MCP 客户端并获取工具；
    3）创建基于 DeepSeek 的语言模型和 Agent；4）启动命令行聊天循环；5）退出时清理资源。
    """
    try:
        from langchain_mcp_adapters.client import MultiServerMCPClient
    except ImportError as e:
        logger.error(
            "请先安装 langchain-mcp-adapters: pip install langchain-mcp-adapters（部分环境需 Python 3.12 及以下）"
        )
        raise e

    from langchain_openai import ChatOpenAI
    from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

    config = load_servers(config_path)
    servers = config.get("mcpServers", {})
    if not servers:
        logger.warning("mcp.json 中未配置任何服务，无法获取 MCP 工具")
        return

    # 初始化 MCP 客户端：connections 就是 mcp.json 中的 mcpServers 字典
    # 每个条目描述一台 MCP 服务该如何连接，例如 stdio 子进程或 HTTP/SSE 地址
    client = MultiServerMCPClient(connections=servers)

    # 按官方默认用法，MultiServerMCPClient 是无状态的；获取工具时使用异步接口即可
    tools = await client.get_tools()
    if not tools:
        logger.warning(
            "未从 MCP 服务获取到任何工具，请确认服务已启动且 mcp.json 配置正确"
        )
        return

    logger.info(f"已获取 {len(tools)} 个 MCP 工具: {[t.name for t in tools]}")

    # 语言模型（DeepSeek，与截图一致；可改为其他 OpenAI 兼容接口）
    llm = ChatOpenAI(
        model="deepseek-v4-flash",
        api_key=os.getenv("deepseek-api"),
        base_url="https://api.deepseek.com",
    )

    # 对话提示：系统提示要求使用工具完成用户请求，agent_scratchpad 供 Executor 填入中间步骤
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一个有用的助手，需要使用提供的工具来完成用户请求。"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors="解析用户请求失败，请重新输入清晰的指令",
    )

    logger.info("\n MCP Agent 已启动，请先输入一个提问给(LLM+MCP)，输入 'quit' 退出")

    while True:
        try:
            user_input = input("\n您: ").strip()
            if not user_input:
                continue
            if user_input.lower() == "quit":
                logger.info("已退出")
                break
            result = agent_executor.invoke({"input": user_input})
            output = result.get("output", result)
            print(f"\nAgent: {output}")
        except KeyboardInterrupt:
            logger.info("已退出")
            break


def main() -> None:
    asyncio.run(run_chat_loop())


if __name__ == "__main__":
    main()

```

这个案例更贴近真实项目，因为它做了下面这条完整链路：

1. 读取 `mcp.json`
2. 用 `MultiServerMCPClient` 连接服务
3. 通过 `get_tools()` 拿到 MCP 工具
4. 把工具交给 LangChain Agent
5. 让 Agent 在对话中实际使用这些工具

这个文件最值得学习的地方有两个：

**第一，它说明 MCP 和 Agent 是怎么接起来的。**
MCP 不负责帮你规划，也不负责帮你推理；它负责把工具接进来。真正决定“什么时候调用天气工具”的，是 Agent。

**第二，它说明 LangChain 对 MCP 的支持已经不只停留在工具发现。**
根据 LangChain 官方文档，除了 `get_tools()`，现在还可以：

- `get_resources()`
- `get_prompt()`
- 使用 stateful session
- 处理 logging / elicitation / structured content

不过本章主线，还是以 **MCP 工具接入 Agent** 为重点，这也是最适合入门先掌握的第一步。

这里再补一个会话相关的细节：

不少适配器会把“获取工具并调用工具”封装成按需连接的路径。多数普通工具这样用就够了；如果 Server 依赖长期会话状态，就要按文档使用 `async with client.session(...)` 等写法维持会话，再在这个会话里读取资源、提示词或调用工具。

### 6.5 测试建议与学习顺序

建议按下面顺序跑这一章案例：

1. **先看 `McpServer.py` + `McpClient.py`**
   先建立“服务端暴露工具、客户端发现并调用”的直觉。
2. **再看 `McpServerByFastMCP.py`**
   建立对 `tool / resource / prompt` 三类能力的整体认识。
3. **再看 `McpServerWeatherByFastMCP.py` + `mcp.json`**
   理解独立服务和客户端配置。
4. **最后跑 `McpClientAgent.py`**
   看 LangChain Agent 怎么把 MCP 工具真正用起来。

如果你想更贴近官方生态调试方式，还可以了解 **MCP Inspector**：

- 官方工具文档：https://modelcontextprotocol.io/docs/tools/inspector

它适合做这些事情：

- 查看服务器有哪些 Tools / Resources / Prompts
- 手工测试工具参数
- 看服务端日志和通知

这对排查“到底是服务端没暴露出来，还是客户端没连上”非常有帮助。

------

**章节思考题：**

1. MCP 解决的问题，和“写一个本地工具函数”有什么不同？

   **参考思路：** 本地工具函数只服务当前代码；MCP 让工具、资源、提示词以统一协议暴露给不同 AI 应用复用。它的重点是标准化接入和跨应用复用，而不是多写一个函数。

2. Host、Client、Server 三个角色如果搞混，会造成什么理解偏差？

   **参考思路：** 会分不清谁运行应用、谁负责协议通信、谁暴露能力。Host 是应用宿主，Client 负责连接 MCP Server，Server 提供 Tools / Resources / Prompts。角色清楚后，配置和排障才有方向。

3. Tool、Resource、Prompt 三类能力应该怎么划分？

   **参考思路：** Tool 适合可执行动作，Resource 适合被读取的上下文资料，Prompt 适合可复用提示模板。不要把所有东西都做成 Tool，否则权限和语义都会变乱。

4. 什么时候用 stdio，什么时候更关注 Streamable HTTP？

   **参考思路：** 本地进程、桌面工具、开发调试常见 stdio；跨进程、服务化、远程访问更需要 HTTP 形态。传输方式服务于部署场景，不是单纯背协议名。

**本章小结：**

- **MCP 的本质**：不是模型、不是工具本身，而是 AI 应用与外部能力之间的标准化连接协议。
- **MCP 的核心价值**：统一发现、统一描述、统一接入，让工具、资源、提示词模板更容易跨应用复用。
- **和其他概念的区别**：Tool 解决“调用能力”，RAG 解决“检索知识”，Agent 解决“规划和决策”，MCP 解决“标准化接入”。
- **当前规范重点**：标准传输优先理解为 `stdio` 与 `Streamable HTTP`；仓库中的 `sse` 写法保留为案例兼容与教学理解用途。
- **本章案例主线**：从极简版教学服务端，到 FastMCP 服务端，再到 `mcp.json` + LangChain Agent 的 MCP 客户端，已经构成了完整的入门路线。
- **安全边界不能省略**：MCP 让接入更统一，不代表接入就天然安全。真实项目里仍要考虑服务器来源可信、认证授权、最小权限、敏感能力隔离，以及不要把本不该暴露的内部资源直接开放给模型侧。
- 学完本章后，你至少应该能分清四件事：MCP 是协议层；Host / Client / Server 是通信角色；Tools / Resources / Prompts 是服务端暴露的能力；统一接入不等于自动解决安全问题。

**建议下一步：** 建议先把本章的本地服务端和客户端都亲手跑通，再回看 第 9 章 Tools 工具调用 和 第 13 章 Agent 智能体，你会更容易看清“本地 Tool、MCP Tool、Agent 决策层”三者在工程上的分工。
