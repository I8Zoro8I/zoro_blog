---
date: 2026年10月10日
---

# [2 - 深度研搜：DeepAgents 快速入门与流式解析](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_2-深度研搜：deepagents-快速入门与流式解析)

------

**本章课程目标：**

- 跑通第一个 DeepAgent：给智能体配置联网搜索工具，并用 `invoke()` 获取最终结果。
- 理解 `result["messages"]` 的结果结构，知道一次 Agent 执行过程中模型和工具分别做了什么。
- 掌握 `stream()` 的基本使用方式，能解析 DeepAgents 的流式输出。
- 能区分“模型决策”“工具执行”和“最终回复”几类关键事件，并知道子智能体调度也可以作为后续扩展事件识别。
- 为下一章学习 `subagents` 配置和主智能体调度做准备。

**学习建议：** 这一章先跑，再拆。先把最小示例执行成功，确认普通返回和 `stream()` 都能看到结果；再回头看 `messages`、`chunk`、`tool_calls`、`content` 这些字段分别从哪里来。DeepAgents 内部节点第一遍不用追到底，先能读懂流式输出里每一段代表什么。

**对应代码分支：** `02-quickstart-streaming`

------

上一章我们已经理解了 DeepAgents 的定位：它适合处理长链路、复杂、多步骤、需要自主规划和分工的智能体任务。

从这一章开始，我们进入代码。先不急着做完整的「深度研搜」项目，而是先用一个最小示例理解 DeepAgent 的创建、执行和流式输出。

本章要完成的案例很简单：

```text
用户提问：请查询人工智能和机器人领域的热门新闻信息，并整理为一份简要报告。
智能体动作：判断需要搜索 -> 调用 internet_search -> 整理搜索结果 -> 返回报告
```

通过这个案例，你会看到一次 Agent 执行过程并不是“模型直接返回答案”，而是下面这条链路：

```text
用户问题
  -> 模型判断是否需要工具
  -> Agent 执行搜索工具
  -> 工具返回搜索结果
  -> 模型整理搜索结果
  -> 返回最终报告
```

这段流程图可以按“谁在做事”来读：用户只负责提出问题，模型负责判断下一步，工具负责拿外部资料，最后还是由模型把工具结果整理成人能读懂的报告。这条链路理解清楚后，后面加入子智能体、知识库、数据库、文件生成和 WebSocket 实时推送时，本质上都是在扩展它。

------

## [1、快速入门：创建第一个 DeepAgent](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_1、快速入门：创建第一个-deepagent)

### [1.1 安装依赖](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_11-安装依赖)

在运行代码之前，先准备 Python 环境和依赖。当前教学代码仓库 `deepsearch-agents`，已经使用 `uv` 管理 Python 环境和依赖。

如果你还不了解 `uv`，可以先参考「[3 - 电商问数：开发环境与基础服务准备](https://didilili.github.io/ai-agents-from-zero/#/../实战项目-电商问数/3-开发环境与基础服务准备)」中关于 `uv` 的入门说明。本章不再展开讲 `uv` 的基础概念，只需要知道：在这个项目里，依赖已经写在 `pyproject.toml` 中，第一次运行时直接同步即可。

当前 `deepsearch-agents/pyproject.toml` 中指定的 Python 版本是：

```toml
requires-python = ">=3.12,<3.13"
```

也就是说，本项目建议使用 `Python 3.12`。如果你已经安装好 `uv`，进入 `deepsearch-agents` 项目根目录后，执行：

```bash
uv sync
```

`uv sync` 会根据项目中的 `pyproject.toml` 和 `uv.lock` 自动创建 `.venv`，并安装锁定好的依赖版本。当前项目核心依赖如下：

| 依赖               | 当前版本 | 作用                                   |
| ------------------ | -------- | -------------------------------------- |
| `deepagents`       | `0.5.7`  | 创建 DeepAgent 的核心框架              |
| `langchain`        | `1.2.17` | 提供工具封装、消息结构和模型初始化入口 |
| `langchain-openai` | `1.2.1`  | 通过 OpenAI 兼容协议连接模型服务       |
| `langgraph`        | `1.1.10` | DeepAgents 底层图执行与状态流转能力    |
| `python-dotenv`    | `1.2.2`  | 从 `.env` 文件读取环境变量             |
| `tavily-python`    | `0.7.24` | 调用 Tavily 联网搜索                   |

如果你后面需要新增依赖，再使用 `uv add 包名`；如果只是运行当前仓库中的教学示例，通常执行 `uv sync` 就可以了。

### [1.2 代码位置与执行步骤](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_12-代码位置与执行步骤)

项目对应文件路径：`deepsearch-agents/examples/1-deep-agent-quickstart-search.py`、`deepsearch-agents/examples/2-deep-agent-streaming-chunks.py`

其中，`1-deep-agent-quickstart-search.py` 用来演示非流式调用，`2-deep-agent-streaming-chunks.py` 用来演示流式解析。

代码执行顺序如下：

1. 安装本章依赖。
2. 配置 `.env`。
3. 创建 Tavily 搜索客户端。
4. 使用 `@tool` 把普通 Python 函数封装成 Agent 可调用工具。
5. 初始化大模型。
6. 使用 `create_deep_agent()` 创建 DeepAgent。
7. 使用 `invoke()` 非流式执行。
8. 从 `result["messages"][-1].content` 中取最终结果。

运行非流式示例：

```bash
uv run examples/1-deep-agent-quickstart-search.py
```

运行流式解析示例：

```bash
uv run examples/2-deep-agent-streaming-chunks.py
```

### [1.3 配置环境变量](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_13-配置环境变量)

代码会从 `.env` 中读取模型和 Tavily 搜索配置。实际开发时不要把真实 Key 写进文档，也不要提交到仓库中，建议使用下面这种占位方式：

```bash
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_API_KEY=你的大模型_API_KEY
LLM_QWEN_MAX=qwen-max

# 在 https://app.tavily.com/ 注册账号，然后创建API KEY
TAVILY_API_KEY=你的_TAVILY_API_KEY
```

### [1.4 封装联网搜索工具](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_14-封装联网搜索工具)

DeepAgents 需要通过工具与外部世界交互。本章使用 `TavilyClient` 封装一个简单的互联网搜索工具。

```python
import os
from typing import Literal

from dotenv import load_dotenv, find_dotenv
from langchain.tools import tool
from tavily import TavilyClient

load_dotenv(find_dotenv())

tavily_key = os.getenv("TAVILY_API_KEY")

# Tavily 客户端负责真正的联网搜索，工具函数中会复用这个客户端
tavily_client = TavilyClient(api_key=tavily_key)


@tool
def internet_search(
    query: str,
    max_results: int = 5,
    topic: Literal["news", "finance", "general"] = "general",
    include_raw_content: bool = False,
):
    """
    互联网搜索工具

    DeepAgent 会根据工具描述和参数签名，自动决定是否调用该工具
    :param query: 搜索关键词
    :param max_results: 返回结果数量
    :param topic: 查询主题，可选 news、finance、general
    :param include_raw_content: 是否返回更详细的原文内容，include_raw_content=False 时返回摘要内容；True 时会尝试返回更完整的网页原文
    :return: Tavily 搜索结果
    """
    print(
        f"开始调用网络搜索工具，核心参数为：{query},{max_results},{topic},{include_raw_content}"
    )
    return tavily_client.search(
        query=query,
        max_results=max_results,
        topic=topic,
        include_raw_content=include_raw_content,
    )
```

这里最关键的是 `@tool` 装饰器。它会把一个普通 Python 函数包装成 LangChain 工具，让 Agent 能够在推理过程中调用它。

工具的函数签名和注释也很重要。模型会根据工具名称、参数类型和描述判断什么时候该调用这个工具、应该传什么参数。如果工具描述太含糊，模型就更容易误用。

### [1.5 初始化模型](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_15-初始化模型)

接下来初始化大模型对象：

```python
from langchain.chat_models import init_chat_model

llm_name = os.getenv("LLM_QWEN_MAX")

llm = init_chat_model(
    model=llm_name,
    model_provider="openai",
)
```

这里的 `llm` 是 DeepAgent 做判断和生成回复时使用的模型对象。无论是普通 Agent 还是 DeepAgent，都必须有模型参与决策。

### [1.6 创建 DeepAgent](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_16-创建-deepagent)

创建 DeepAgent 的核心函数是 `create_deep_agent()`。

```python
from deepagents import create_deep_agent

# 当前示例不配置子智能体，重点观察“主智能体 + 搜索工具”的基本流程
deep_agent = create_deep_agent(
    model=llm,
    tools=[internet_search],
    subagents=[],
    system_prompt="""
    你是一名严谨的研究员，可以使用 internet_search 工具检索网络信息。
    请根据检索结果进行归纳、分析和交叉验证，生成一份结构清晰、信息可靠的中文报告。
    """,
)
```

先看四个核心参数：

| 参数            | 含义                                                   |
| --------------- | ------------------------------------------------------ |
| `model`         | 智能体使用的大模型                                     |
| `tools`         | 主智能体可以直接调用的工具列表                         |
| `subagents`     | 子智能体列表，本节先留空                               |
| `system_prompt` | 主智能体的系统提示词，用来定义角色、目标和工具使用边界 |

这一版代码中虽然 `subagents=[]`，但它依然是 DeepAgent。只是当前示例先用一个搜索工具帮助我们理解 Agent 的执行过程，子智能体会在后面单独讲。

### [1.7 先用 invoke 跑通结果](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_17-先用-invoke-跑通结果)

最小示例先使用 `invoke()` 执行：

```python
# 非流式执行，invoke 会等整条 agent 链路完成后，一次性返回最终状态
result = deep_agent.invoke(
    {
        "messages": [
            {
                "role": "user",
                "content": "请查询人工智能和机器人领域的热门新闻信息，并整理为一份简要报告。",
            }
        ]
    }
)

# result 中会保留完整消息轨迹，便于观察模型决策、工具返回和最终回答
print(result)

# messages 的最后一条通常就是 DeepAgent 整理后的最终回答
print(result["messages"][-1].content)
```

注意入参不是简单字符串，而是一个包含 `messages` 的字典：

```python
{
    "messages": [
        {"role": "user", "content": "用户问题"}
    ]
}
```

这是因为 DeepAgents 底层沿用了 LangGraph / LangChain 的消息模型，整个执行过程都会围绕 `messages` 传递状态。

执行文件验证，成功：

```text
uv run examples/1-deep-agent-quickstart-search.py

LangChainPendingDeprecationWarning: The default value of `allowed_objects` will change in a future version.
开始调用网络搜索工具，核心参数为：人工智能 机器人 热门新闻,5,news,False

{
  "messages": [
    HumanMessage(
      content="请查询人工智能和机器人领域的热门新闻信息，并整理为一份简要报告。"
    ),
    AIMessage(
      content="",
      tool_calls=[
        {
          "name": "internet_search",
          "args": {
            "query": "人工智能 机器人 热门新闻",
            "topic": "news",
            "max_results": 5,
            "include_raw_content": False
          }
        }
      ]
    ),
    ToolMessage(
      name="internet_search",
      content="Tavily 返回了 5 条新闻结果，包含 url、title、score、published_date、content 等字段"
    ),
    AIMessage(
      content="## 人工智能与机器人领域热门新闻简报\n\n1. Genesis AI 推出新型机器人大脑...\n2. Meta 收购 ARI...\n3. 无人驾驶出租车将重塑出行市场..."
    )
  ]
}

## 人工智能与机器人领域热门新闻简报

1. Genesis AI 推出新型机器人“大脑”
2. Meta 收购 Assured Robot Intelligence（ARI）
3. 无人驾驶出租车将重塑出行市场
4. 四月机器人行业十大新闻回顾
5. 值得关注的欧洲初创企业
```

其中，`LangChainPendingDeprecationWarning` 是 LangGraph / LangChain 依赖内部的版本提示，不影响本章示例运行。真正要观察的是后面的工具调用日志、`messages` 轨迹和最终报告。

这段输出可以按三层来看：

| 输出位置                  | 说明                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `开始调用网络搜索工具...` | 工具函数内部的 `print()`，说明 `internet_search` 被真正执行  |
| `result["messages"]`      | 完整执行轨迹，包含用户消息、模型工具调用、工具返回和最终回答 |
| 最后的 Markdown 报告      | `result["messages"][-1].content`，也就是最终展示给用户的内容 |

这里先建立一个直觉：`invoke()` 虽然最后拿到的是一份报告，但它内部并不是“一次模型回答”，而是经历了“模型决定调工具 -> 工具返回结果 -> 模型整理答案”的完整链路。

------

## [2、非流式调用：invoke 与 messages](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_2、非流式调用：invoke-与-messages)

### [2.1 实际调用解析](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_21-实际调用解析)

`invoke()` 返回的不是一段纯文本，而是一个包含完整消息过程的字典。简化后可以理解成这样：

```text
result = {
    "messages": [
        # 用户问题
        HumanMessage(
            content="请查询人工智能和机器人领域的热门新闻信息，并整理为一份简要报告。"
        ),
        # 模型决定调用 internet_search 工具
        AIMessage(
            content="",
            tool_calls=[
                {
                    "name": "internet_search",
                    "args": {
                        "query": "人工智能 机器人 热门新闻",
                        "topic": "news",
                        "max_results": 5,
                        "include_raw_content": False
                    }
                }
            ]
        ),
        # internet_search 工具返回搜索结果
        ToolMessage(
            name="internet_search",
            content='{"query": "人工智能 机器人 热门新闻", "results": [...]}'
        ),
        # 模型基于工具结果生成最终回答
        AIMessage(
            content="## 人工智能与机器人领域热门新闻简报..."
        ),
    ]
}
```

也就是说，一次 Agent 执行大致经历下面几步：

1. 用户把问题发给 Agent。
2. Agent 把用户问题、系统提示词、工具描述一起交给模型。
3. 模型判断需要调用 `internet_search`。
4. Agent 真正执行搜索工具。
5. 工具返回搜索结果。
6. Agent 再把工具结果交给模型。
7. 模型整理搜索结果，生成最终报告。

这 7 步背后，其实有四个角色在配合：

```text
用户 -> Agent -> 大模型 -> 工具 -> Agent -> 大模型 -> 用户
```

第一步，用户并不是直接调用大模型，而是把问题交给 `deep_agent`：

```python
result = deep_agent.invoke(
    {
        "messages": [
            {
                "role": "user",
                "content": "请查询人工智能和机器人领域的热门新闻信息，并整理为一份简要报告。",
            }
        ]
    }
)
```

这一步传入的是 `messages`，DeepAgents 会先把这条用户消息包装成 `HumanMessage`，放进本次执行状态中。

第二步，Agent 会把下面几类信息一起交给大模型：

- 用户问题：`请查询人工智能和机器人领域的热门新闻信息，并整理为一份简要报告。`
- 系统提示词：你是一名严谨的研究员，可以使用搜索工具生成结构清晰、信息可靠的中文报告
- 工具说明：当前可用工具是 `internet_search`
- 工具参数结构：`query`、`max_results`、`topic`、`include_raw_content`

也就是说，大模型并不是“天然知道”Agent 有哪些工具，而是 Agent 在调用模型时，把工具名称、参数和描述一起放进上下文里。模型读完这些信息后，才会判断：这个问题需要联网搜索，于是生成一次工具调用。

这一步对应 `result["messages"]` 里的第二条消息：

```text
AIMessage(
    content="",
    tool_calls=[
        {
            "name": "internet_search",
            "args": {
                "query": "人工智能 机器人 热门新闻",
                "topic": "news",
                "max_results": 5,
                "include_raw_content": False
            }
        }
    ]
)
```

这里要注意：这条 `AIMessage` 还不是最终回答。它的 `content` 为空，但 `tool_calls` 有值，意思是模型在告诉 Agent：“下一步请调用 `internet_search` 工具，并传入这些参数。”

第三步，Agent 根据 `tool_calls` 真正去执行工具，也就是调用我们前面定义的 Python 函数：

```python
@tool
def internet_search(query: str, max_results: int = 5, ...):
    return tavily_client.search(...)
```

工具执行完成后，会生成一条 `ToolMessage`。这条消息里保存的是 Tavily 返回的原始搜索结果，通常是结构化数据，里面可能包含标题、链接、摘要、发布时间等信息。

结合实际输出，`ToolMessage(content=...)` 里的 JSON 主要包含这些字段：

| 字段             | 含义                         |
| ---------------- | ---------------------------- |
| `query`          | 本次传给 Tavily 的搜索关键词 |
| `results`        | 搜索结果列表                 |
| `url`            | 单条搜索结果的网页链接       |
| `title`          | 单条搜索结果的标题           |
| `content`        | 单条搜索结果的摘要内容       |
| `published_date` | 新闻发布时间                 |
| `response_time`  | Tavily 本次请求耗时          |
| `request_id`     | Tavily 本次请求 ID           |

第四步，工具结果不会直接返回给用户。Agent 会把 `ToolMessage` 再交给大模型，让模型根据搜索结果进行整理、翻译、筛选和润色。比如 Tavily 返回的结果可能包含英文网页摘要，但用户提问是中文，所以最终结果通常会被模型整理成中文报告。

这一步对应最后一条 `AIMessage`：

```text
AIMessage(
    content="## 人工智能与机器人领域热门新闻简报..."
)
```

到了这里，`tool_calls` 已经没有值，`content` 有了完整内容，说明模型不再继续调用工具，而是已经生成最终回复。

所以我们取最终回复时，通常直接取最后一条消息：

```python
final_answer = result["messages"][-1].content
```

如果只关心最终报告，读取最后一条消息即可；如果要调试 Agent 的执行链路，再查看完整的 `result`。

### [2.2 为什么模型知道该调用哪个工具](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_22-为什么模型知道该调用哪个工具)

它是 Agent 工具调用的核心。

模型本身并不会主动扫描你的 Python 代码，也不会自己知道项目里有哪些函数。真正发生的是：当我们通过 `create_deep_agent()` 创建智能体时，已经把工具列表传给了 Agent。

```python
deep_agent = create_deep_agent(
    model=llm,
    tools=[internet_search],
    subagents=[],
    system_prompt="..."
)
```

执行 `invoke()` 时，Agent 会把 `internet_search` 的名称、描述和参数结构整理给模型。模型读完以后，才会决定是否生成 `tool_calls`。

因此，工具调用的判断链路可以这样记：

```text
工具注册到 Agent
  -> Agent 把工具描述交给模型
  -> 模型判断是否需要调用工具
  -> 模型生成 tool_calls
  -> Agent 根据 tool_calls 执行真实工具
```

这也解释了为什么前面一直强调工具函数的名称、参数类型和注释要写清楚。它们不是只给开发者看的，也会影响模型能不能正确调用工具。

### [2.3 读懂四类消息](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_23-读懂四类消息)

为了读懂 `result["messages"]`，可以先记住下面这张表：

| 消息类型       | 在执行链路中的作用                           | 常见特征                         |
| -------------- | -------------------------------------------- | -------------------------------- |
| `HumanMessage` | 用户输入的问题                               | `content` 是用户原始问题         |
| `AIMessage`    | 模型的思考结果，可能是调用工具，也可能是回复 | 有 `tool_calls` 时表示准备调工具 |
| `ToolMessage`  | 工具真实执行后的返回结果                     | `name` 通常是工具名              |
| `AIMessage`    | 模型基于工具结果整理出的最终回答             | `content` 有最终自然语言结果     |

其中最容易混淆的是 `AIMessage`。它有两种情况：

- `AIMessage(content="", tool_calls=[...])`：模型还没有回答，它只是决定下一步调用什么工具。
- `AIMessage(content="...")`：模型已经生成最终回答。

所以判断 Agent 到底在干什么，不能只看消息类型，还要继续看 `tool_calls` 和 `content`。

------

## [3、流式调用：stream 与 chunk](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_3、流式调用：stream-与-chunk)

### [3.1 为什么要改用 stream](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_31-为什么要改用-stream)

`invoke()` 属于非流式执行。它的特点是调用后一直等待，直到整个智能体任务执行完，再一次性返回完整结果。

```text
用户点击发送 -> 后端执行 5 秒或 10 秒 -> 一次性返回最终结果
```

这种方式写起来简单，但用户体验不够好。尤其是 DeepAgents 这类长链路任务，智能体可能会搜索、阅读、调用多个工具、分派子任务。如果前端一直没有反馈，用户很难判断系统是在处理，还是已经卡住。

流式执行的目标就是让用户看到过程：

```text
开始处理
模型决定调用搜索工具
搜索工具返回结果
模型整理搜索结果
最终回复
```

后面做 Web 项目时，这些过程通常会通过 `SSE` 或 `WebSocket` 推送给前端。本项目完整版本采用的是 WebSocket，因为它更适合持续推送 Agent 的执行状态和工具日志。

### [3.2 用 stream 获取执行过程](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_32-用-stream-获取执行过程)

项目对应文件路径：`deepsearch-agents/examples/2-deep-agent-streaming-chunks.py`

把 `invoke()` 换成 `stream()` 后，返回值就不再是完整结果，而是一个可以不断迭代的流：

```python
# 流式执行，stream 会在每个图节点完成后产出一个 chunk
# 常见节点包括 model（模型决策或最终回答）和 tools（工具执行结果）
stream = deep_agent.stream(
    {
        "messages": [
            {
                "role": "user",
                "content": "请查询人工智能和机器人领域的热门新闻信息，并整理为一份简要报告。",
            }
        ]
    }
)

# 每个 chunk 是一个按节点名组织的字典
for chunk in stream:
    print(chunk)
```

每个 `chunk` 都表示某个节点刚刚产生了一次状态更新。由于 DeepAgents 底层基于 LangGraph，流式输出会带有节点信息。

简化来看，常见的 `chunk` 可能长这样：

```python
{
    "model": {
        "messages": [AIMessage(content="", tool_calls=[...])]
    }
}
```

或者：

```python
{
    "tools": {
        "messages": [ToolMessage(content="工具返回结果...")]
    }
}
```

解析流式输出时，重点看两层信息：

1. 外层节点名：当前是 `model` 节点，还是 `tools` 节点。
2. 内层最后一条消息：模型是决定调用工具，还是已经给出最终回答。

### [3.3 chunk 的四种关键状态](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_33-chunk-的四种关键状态)

| 状态                 | 如何识别                                                     | 含义                                     |
| -------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| 模型决定调用工具     | `node_name == "model"` 且 `last_msg.tool_calls` 中工具名不是 `task` | 模型判断下一步要调用某个普通工具         |
| 模型决定调用子智能体 | `node_name == "model"` 且 `tool_call["name"] == "task"`      | 模型判断下一步要把任务分派给某个子智能体 |
| 工具执行完成         | `node_name == "tools"`                                       | Agent 真正调用工具，并拿到了工具返回结果 |
| 模型返回最终结果     | `node_name == "model"` 且没有 `tool_calls`，但 `last_msg.content` 有内容 | 模型基于前面结果生成最终回复             |

本章的示例只配置了 `internet_search`，所以运行时主要会看到“普通工具调用”。表格中的子智能体状态是先给后面留一个入口：等第 3 章真正配置 `subagents` 后，流式输出里就可能出现这类调度事件。

### [3.4 chunk 四种状态的对象视图示例](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_34-chunk-四种状态的对象视图示例)

只看上面的表格还比较抽象。下面参考项目文档中的写法，把 `stream()` 迭代过程中可能出现的几类 `chunk` 展开成 Python 对象视图。

注意，这里不是要求你手写这些对象，而是帮助你在 `print(chunk)` 时能快速识别当前 Agent 运行到哪一步。

**场景 A：模型决定调用普通工具。**

本章代码里最常见的就是这一类。模型读完用户问题后，发现需要联网搜索，于是生成一个 `tool_calls`，工具名是 `internet_search`。

```python
{
    "model": {
        "messages": [
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "internet_search",
                        "args": {
                            "query": "人工智能和机器人 热门新闻",
                            "topic": "news",
                            "max_results": 5,
                        },
                        "id": "call_xxx",
                    }
                ],
            )
        ]
    }
}
```

这个状态的重点是：`content` 为空，`tool_calls` 有值。说明模型还没有回答用户，而是在告诉 Agent：“下一步请调用这个工具。”

**场景 B：工具执行完成并返回结果。**

当 Agent 真正执行完 `internet_search` 后，会从 `tools` 节点产出 `ToolMessage`：

```python
{
    "tools": {
        "messages": [
            ToolMessage(
                content='{"query": "人工智能和机器人 热门新闻", "results": [...]}',
                name="internet_search",
                tool_call_id="call_xxx",
            )
        ]
    }
}
```

这个状态的重点是：外层节点名变成了 `tools`。此时不是模型在思考，而是工具已经执行完，并把原始结果交回给 Agent。

**场景 C：模型决定调用子智能体。**

本章还没有真正配置子智能体，所以这类状态通常不会在当前示例里出现。但后面第 3 章加入 `subagents` 后，如果模型决定把任务委派给子智能体，就会看到特殊工具 `task`：

```python
{
    "model": {
        "messages": [
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "task",
                        "args": {
                            "subagent_type": "network_search_agent",
                            "description": "查询人工智能和机器人领域的热门新闻，并返回来源、摘要和关键信息。",
                        },
                        "id": "call_yyy",
                    }
                ],
            )
        ]
    }
}
```

`task` 本质上也是一次工具调用，只是它调用的不是普通 Python 工具，而是 DeepAgents 的子智能体调度入口。解析时只要看到 `tool_call["name"] == "task"`，就可以把它识别成“正在分派给子智能体”。

**场景 D：模型生成最终回复。**

当工具结果已经返回，模型完成整理后，会再次从 `model` 节点产出消息。这一次没有 `tool_calls`，而是有真正的 `content`：

```python
{
    "model": {
        "messages": [
            AIMessage(
                content="以下是关于人工智能和机器人领域的热门新闻概要：...",
                tool_calls=[],
            )
        ]
    }
}
```

这个状态说明 Agent 链路已经收束，模型不再继续调用工具或子智能体，而是把最终结果返回给用户。

除了上面四类业务事件，实际输出中还可能看到一些中间件节点，例如 `PatchToolCallsMiddleware.before_agent`、`TodoListMiddleware.after_model`。这些节点可能不包含 `messages`，或者不是我们要展示给用户的业务进度，所以后面的解析代码会用下面这句过滤掉：

```python
if not state or "messages" not in state:
    continue
```

### [3.5 解析 chunk 的完整代码](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_35-解析-chunk-的完整代码)

项目对应文件路径：`deepsearch-agents/examples/2-deep-agent-streaming-chunks.py`

```python
# 流式执行，stream 会在每个图节点完成后产出一个 chunk
stream = deep_agent.stream(
    {
        "messages": [
            {
                "role": "user",
                "content": "请查询人工智能和机器人领域的热门新闻信息，并整理为一份简要报告。",
            }
        ]
    }
)

for chunk in stream:
    # chunk 是一个按节点名组织的字典，例如
    # {"model": {"messages": [...]}} 或 {"tools": {"messages": [...]}}
    for node_name, state in chunk.items():
        # DeepAgents 内部中间件也可能产出空状态或非消息状态，这里只解析消息类状态
        if not state or "messages" not in state:
            continue

        messages = state["messages"]

        if not messages or not isinstance(messages, list):
            continue

        # 每个 chunk 的最后一条消息，通常就是这个节点本次产出的核心信息
        last_msg = messages[-1]

        if node_name == "model":
            # model 节点有两类重点事件：
            # 1. tool_calls 非空，模型决定下一步调用工具或子智能体
            # 2. content 非空，模型已经生成最终回答
            if last_msg.tool_calls:
                for tool_call in last_msg.tool_calls:
                    if tool_call["name"] == "task":
                        print(
                            f"【大模型】决定调用子智能体：{tool_call['args']['subagent_type']}"
                        )
                    else:
                        print(
                            f"【大模型】决定调用工具：{tool_call['name']} 传入的参数：{tool_call['args']}"
                        )

            elif last_msg.content:
                print(f"【大模型】最终执行的结果：{last_msg.content}")

        elif node_name == "tools":
            # tools 节点返回的是具体工具的执行结果，通常可以推送给前端展示执行进度
            tool_return_result = last_msg.content[:100] + "..."
            tool_name = last_msg.name
            print(f"【agent】调用了{tool_name}工具，返回的结果为：{tool_return_result}")
```

这段代码里有几个细节要特别注意。

**第一，**外层循环取的是 `node_name` 和 `state`：

```python
for node_name, state in chunk.items():
```

`node_name` 用来判断当前是哪类节点产生了输出，例如 `model` 或 `tools`。`state` 里才是真正的状态数据。

**第二，**有些中间件节点不包含 `messages`，要先跳过：

```python
if not state or "messages" not in state:
    continue
```

DeepAgents 内部可能会出现一些中间件节点，例如 `TodoListMiddleware.after_model`。它们对框架执行有意义，但不一定是我们要展示给用户的业务事件。

**第三，**只取 `messages[-1]`：

```python
last_msg = messages[-1]
```

因为每个状态更新里可能包含多条消息，但当前这次更新最关键的一条通常在最后。

**第四，**`model` 节点要继续区分两类情况：

- `last_msg.tool_calls` 有值：模型不是最终回答，而是在决定下一步调用什么。
- `last_msg.content` 有值：模型已经生成最终回复。

**第五，**`tools` 节点代表工具已经真的执行完了。这里可以把工具名和返回结果截断后推送给前端，避免一大段搜索结果把界面刷满。

执行文件验证，成功：

```text
uv run examples/2-deep-agent-streaming-chunks.py

LangChainPendingDeprecationWarning: The default value of `allowed_objects` will change in a future version.
【大模型】决定调用工具：internet_search 传入的参数：{'query': '人工智能和机器人 热门新闻', 'topic': 'news', 'max_results': 5}
开始调用网络搜索工具，核心参数为：人工智能和机器人 热门新闻,5,news,False
【agent】调用了internet_search工具，返回的结果为：{"query": "人工智能和机器人 热门新闻", "follow_up_questions": null, "answer": null, "images": [], "results": [{"....
【大模型】最终执行的结果：以下是关于人工智能和机器人的几条热门新闻概要：

1. **新AI大脑让机器人像人类一样移动 - Fox News**
   - Genesis AI推出了一款名为GENE-26.5的机器人“大脑”，它能够帮助通用型机器人执行复杂的物理任务，就像人类一样操作。该系统通过大量数据训练，可以让机器人手部模仿人类手部的动作，完成诸如制作煎蛋等多步骤过程的任务。

2. **如何重塑乘车市场 - Financial Times 视频报道**
   - 本视频探讨了人工智能如何推动下一代自动驾驶出租车的发展，并分析了这一技术对当前乘车市场的潜在影响。

3. **为什么实体AI才是真正的制造业革命 - The Robot Report**
   - 文章讨论了实体AI在制造业中的应用以及其对于硬件创新的重要性。指出实体AI正在使机器人学习与适应环境的能力变得更快更强，并且强调了区分人形机器人炒作与实际硬件扩展之间的差异。

4. **不仅仅是汽车：关注2026年中国汽车展上的机器人转变 - CleanTechnica**
   - 在北京国际汽车展览会上，中国汽车产业开始从电动汽车和软件定义车辆转向所谓的“实体AI”——即超越车辆本身、进入现实世界的机器智能。多家参展商展示了基于共享智能平台的各种机器人和服务机器人。

如果您需要更多详细信息或想深入了解某个特定主题，请告诉我！
```

这段输出比 `invoke()` 更适合观察执行过程，可以按顺序读：

| 输出片段                                | 对应的执行阶段                                         |
| --------------------------------------- | ------------------------------------------------------ |
| `【大模型】决定调用工具...`             | `model` 节点输出，模型决定下一步调用 `internet_search` |
| `开始调用网络搜索工具...`               | Python 工具函数真正开始执行                            |
| `【agent】调用了internet_search工具...` | `tools` 节点输出，工具结果已经返回                     |
| `【大模型】最终执行的结果...`           | `model` 节点再次输出，模型基于工具结果生成最终回答     |

这就是流式解析最核心的价值：不用等到最终报告生成，开发者和前端都能看到 Agent 当前走到了哪一步。

### [3.6 对接前端时怎么展示](https://didilili.github.io/ai-agents-from-zero/#/实战项目-深度研搜/2-DeepAgents快速入门与流式解析?id=_36-对接前端时怎么展示)

虽然本章还没有写 FastAPI 接口，但可以提前建立后端事件和前端展示之间的对应关系。

| 后端解析出的事件                   | 前端可以展示成什么       |
| ---------------------------------- | ------------------------ |
| 模型决定调用工具 `internet_search` | 正在搜索网络资料         |
| 工具返回搜索结果                   | 已获取搜索结果，正在整理 |
| 模型决定调用子智能体               | 正在分派给某个专业助手   |
| 模型返回最终结果                   | 展示最终答案或报告       |

这也是为什么流式解析很重要。企业级智能体项目不只看最终答案，还要让用户能感知执行过程，开发者也能定位每一步做了什么。

**一句话总结：** `invoke()` 看最终结果，`stream()` 看执行过程；做真实产品时，流式处理几乎是必须掌握的能力。

------

**本章小结：**

这一章我们完成了 DeepAgents 的快速入门。先定义了 `internet_search` 搜索工具，再初始化模型，最后通过 `create_deep_agent()` 组装主智能体，并用 `invoke()` 获取最终结果。

接着我们重点学习了 `stream()` 的流式解析方式。只要抓住 `model` 和 `tools` 两类节点，再结合 `tool_calls` 和 `content`，就能判断当前到底是模型在做决策、工具在执行，还是模型已经生成最终结果；后面加入子智能体后，也是在这套解析逻辑上继续扩展。

完整的子智能体配置、调度信号和异步执行，会在下一章展开。你现在只需要先掌握这一层：`invoke()` 适合看最终结果，`stream()` 适合看清 Agent 每一步正在做什么。

