---
date: 2026年09月11日
---

# LangGraph 多智能体与 A2A

------

**本章课程目标：**

- 理解 **多智能体（Multi-Agent）** 到底在解决什么问题，知道它和“一个强一点的单智能体”之间的边界。
- 理解 **A2A（Agent-to-Agent）** 与 **MCP（Model Context Protocol）** 的本质区别，知道为什么一个偏“代理协作”，一个偏“工具 / 资源接入”。
- 掌握多智能体常见模式：**Subagents / Handoffs / Router / Skills / Custom Workflow**，并能结合 LangGraph 的图能力做基本选型。

**学习建议：** 这章先分层，再写代码：多智能体讲应用内分工，MCP 讲外部能力接入，A2A 讲不同 Agent 系统之间的协作。第一遍不必背 A2A 规范细节，先把“谁和谁通信、传什么、边界在哪里”想清楚，再看 Supervisor、Handoff 和 Skills。

**官方文档与资源**：详见 [工具导航与参考资料索引](https://i8zoro8i.github.io/zoro_blog/column/AIAgent/工具导航与参考资料索引)。

------

## 1、多智能体与 A2A

### 1.1 概述

这一章表面上同时出现了 **LangGraph 多智能体**、**A2A**、**MCP**、**Supervisor**、**Handoff**、**Skills**，所以很容易让人在一开始就感觉概念混在一起。

先把它拆成三层：

| 层级          | 入门理解                                        |
| ------------- | ----------------------------------------------- |
| **多智能体**  | 一种系统设计思路：多个 Agent 分工协作完成任务   |
| **LangGraph** | 一种实现方式：在本地 / 应用内用图编排多个 Agent |
| **A2A**       | 一种通信协议：让不同 Agent 系统按统一方式对话   |

如果先把这三层分清楚，后面就不会觉得这章像在同时讲三门不同的课。

```mermaid
flowchart TB
    A["多智能体<br/>多个 Agent 分工协作"]

    A --> B["LangGraph 多智能体<br/>应用内图式编排"]
    A --> C["A2A<br/>跨系统 Agent 协作协议"]

    B -. "节点可调用工具" .-> D["MCP<br/>工具 / 资源接入协议"]
    C -. "远程 Agent 也能暴露工具" .-> D
```



### 1.2 多智能体定义

多智能体不是“多开几个模型调用”这么简单。它指的是：**把复杂任务拆给多个专精的 Agent，让它们分工、路由、协作，再共同完成整体任务。**

和单智能体相比，多智能体的核心变化不是“数量变多”，而是：角色开始分工、上下文开始隔离、控制流开始显式编排。

举个最直白的例子：

- **单智能体**：一个 Agent 同时负责查航班、订酒店、回答用户、决定流程
- **多智能体**：一个主管 Agent 负责调度，航班 Agent 只管航班，酒店 Agent 只管酒店

所以多智能体更适合的，不是“任务听起来高级”，而是这些场景：

- 工具太多，一个 Agent 已经选不过来
- 领域太多，单个 Agent 上下文太臃肿
- 任务天然可以拆成多个角色
- 希望不同团队各自维护不同能力模块

### 1.3 不必默认上多智能体

LangChain 官方多智能体文档也强调：**不是每个复杂任务都必须上多智能体。**

很多时候，开发者说自己要“multi-agent”，实际想要的是下面几类能力：

- 更好的上下文管理
- 更清晰的模块边界
- 更高效的并行化
- 更稳定的任务分工

但如果任务本身很简单，一个单智能体加上合适的工具、提示词和工作流，往往就已经够了。

本章的判断标准很简单：**多智能体不是默认更高级，而是在单智能体已经开始吃力时，才值得引入。**

### 1.4 A2A 协议定义

A2A 的全称是 **Agent-to-Agent**。它是一种面向 Agent 系统互操作的开放协议，目标是让不同 Agent 能以更标准化的方式发现彼此、发送任务、交换消息、返回结果。

换句话说：**A2A 关心的是“Agent 和 Agent 怎么协作”。**

A2A 里面几个很核心的概念包括：

- **Agent Card**：相当于 Agent 的“名片 / 能力说明”
- **Task**：一项被发给远程 Agent 的任务
- **Message**：围绕任务交换的消息
- **Artifact**：任务过程或结果产出的内容

1. **先发现 Agent**：调用方先读取 `Agent Card`，确认对方会什么、支持什么输入输出。
2. **再提交 Task**：把任务目标、上下文消息、必要参数发给远程 Agent。
3. **过程中跟状态**：长任务通常不是一次就结束，调用方会通过轮询、流式更新或通知拿到任务进度。
4. **最后取结果**：读取最终 `Message` / `Artifact`，把它当成另一套 Agent 的产出继续接到自己的系统里。

A2A 主要回答这几个问题：

- 我怎么知道远程有个什么 Agent
- 它会什么
- 我怎么把任务交给它
- 它怎么把中间消息和结果回给我

远程 Agent调用方 Agent远程 Agent调用方 Agent读取 Agent Card返回能力说明与输入输出约定提交 Task 与初始 Message返回任务状态 / 中间 Message返回 Artifact / 最终结果



也正因为 A2A 是一种**跨 Agent 系统的互操作协议**，所以它天然更偏：

- 远程发现与能力说明
- 跨服务任务提交与跟踪
- 长任务状态更新
- 结果产物回传

这和本章后面要看的 `Supervisor` / `Handoff` 很不一样。后者主要发生在**同一个应用内部的 LangGraph 图里**，重点是“怎么编排多个角色”，而不是“怎么让两个独立 Agent 平台按统一协议互通”。

### 1.5 A2A 和 MCP 的区别

![MCP 与 A2A 的区别：MCP 负责 Agent 接入工具和资源，A2A 负责 Agent 与 Agent 之间的跨系统任务协作](https://didilili.github.io/ai-agents-from-zero/images/26/26-1-5-1.png)

更工程化一点看：

| 对比项   | MCP                               | A2A                                 |
| -------- | --------------------------------- | ----------------------------------- |
| 连接对象 | Agent / 模型 与工具、资源、上下文 | Agent 系统 与另一个 Agent 系统      |
| 关注重点 | 工具怎么暴露、资源怎么读取        | 任务怎么提交、状态怎么跟踪          |
| 典型问题 | 模型如何调用数据库、搜索、文件    | 一个 Agent 如何把任务交给远程 Agent |

更准确的结论是：

- **MCP 不负责代理之间的协作分工**
- **A2A 不负责具体工具怎么暴露给模型**

它们不是互斥关系，完全可能同时存在于一个系统里。

> **术语约定：** 本章里说的“**LangGraph 多智能体**”默认指**应用内编排**，说的“**A2A**”默认指**跨系统 Agent 协作协议**。把这两个语境先分开，你后面看 Supervisor、Handoff 和远程 Agent 协作时会轻松很多。

### 1.6 LangGraph 与 A2A

这里要说清楚：**LangGraph 多智能体不等于 A2A。** 你完全可以在一个应用内部，用 LangGraph 把多个 Agent 编排成一张图，让它们协作完成任务。这是多智能体，但未必用了 A2A 协议。

反过来，A2A 更适合描述：不同系统中的 Agent，跨进程、跨服务、跨平台，彼此通过协议标准化发现与协作。所以你可以把关系理解成：**LangGraph 多智能体** 更偏“应用内编排”，**A2A** 更偏“系统间互操作”。

如果换成真实项目的说法：

- 同一个团队在一个后端服务里，用 LangGraph 编排 `supervisor`、`research_agent`、`writer_agent`，这通常是**应用内多智能体**
- 你的系统要去调用另一个团队部署的远程法律顾问 Agent、报表 Agent、采购 Agent，这时更可能需要 **A2A**

这里先建立一个稳定判断：**LangGraph 解决本地编排问题，A2A 解决跨系统协作问题。**

### 1.7 多智能体常见模式

LangChain 官方多智能体文档把模式归纳得比较清楚。最值得你这章吸收的，不是性能表格，而是这 5 类模式本身：

- **Subagents（子代理）**：主 Agent 把子 Agent 当工具来调
- **Handoffs（交接）**：不同 Agent 之间可以交接控制权
- **Skills（技能）**：单 Agent 按需加载专业上下文 / 技能包
- **Route（路由）**：先做路由，再把任务交给更合适的 Agent
- **Custom workflow（自定义工作流）**：直接用 LangGraph 自定义工作流，把上述模式混合起来

从教学角度看，可以把它们分成两大类：

- **一个主控中心在调别人**：Subagents、Router
- **控制权本身会转移**：Handoffs

而 `Skills` 比较特殊，它更像：不一定非要上多智能体，而是让单 Agent 也能按需加载专业能力。

结合官方文档的典型取舍，也可以得到一个非常实用的判断：

- **Subagents / Router** 更强调上下文隔离，也更适合并行
- **Handoffs / Skills** 更偏状态连续，重复请求时往往更省调用
- **Custom workflow** 适合你已经知道标准模式不够，需要自己把路由、并行、循环、人工介入混起来

### 1.8 多智能体的常见结构形态

结合官方模式和 LangGraph 语境，可以把多智能体常见形态收敛成下面几类：

- **单智能体（Single Agent）**：一个 Agent 负责整条任务链路，适合简单任务和教程起步。
- **Supervisor（主管型）**：一个中心主管负责决定调用哪个子 Agent，适合统一入口和集中调度。
- **Handoff（交接型）**：当前 Agent 可以把控制权交给别的 Agent，更适合角色切换和会话延续。
- **Router（路由型）**：先判断任务属于哪类，再把任务交给某个专门 Agent。
- **Network / Peer-to-peer（网络型）**：多个 Agent 更平等地交换信息，没有单一主管，适合研究、协作式问题求解。
- **Hierarchical（层级型）**：多层主管和子主管分层拆任务，适合复杂组织结构。

```mermaid
flowchart TD
    A["Single Agent<br/>一个 Agent 负责全流程"]
    B["Supervisor<br/>主管统一调度"]
    B --> B1["航班 Agent"]
    B --> B2["酒店 Agent"]
    C["Router<br/>先分类再分发"]
    C --> C1["技术支持 Agent"]
    C --> C2["售后 Agent"]
    D["Handoff<br/>控制权正式交接"]
    D --> D1["下一位接手 Agent"]
    E["Network<br/>多个 Agent 平等协作"]
    E --> E1["研究 Agent"]
    E --> E2["核查 Agent"]
    F["Hierarchical<br/>多层主管分级协作"]
    F --> F1["子主管"]
    F1 --> F2["执行 Agent"]
```



### 1.9 使用场景

落回真实项目，判断标准不是“哪种架构听起来更酷”，而是下面这些问题：

- 上下文是不是已经太重？
- 工具是不是多到一个 Agent 容易选错？
- 任务是否天然能拆成专业角色？
- 是否需要并行？
- 是否需要直接用户交互的角色切换？

先用下面这张表帮助记忆：

| 场景                         | 更适合的模式                 |
| ---------------------------- | ---------------------------- |
| 单领域、小任务、统一控制     | 单智能体 / Skills            |
| 多工具、多专业角色、统一入口 | Supervisor / Subagents       |
| 用户与不同角色来回切换       | Handoffs                     |
| 先分类再交给不同专家         | Router                       |
| 复杂系统、强流程编排         | Custom workflow（LangGraph） |

在现代 Agent 项目里，多智能体 / A2A 更常见的落点，是把一个大任务拆给多个专业角色协作，而不是单纯为了“多几个 Agent”。例如：

- **软件工程团队式协作**：规划 Agent 负责拆需求，代码 Agent 负责实现，测试 / Review Agent 负责运行验证和指出风险，最后由协调者汇总结果。
- **研究代理团队**：检索 Agent 收集资料，阅读 / 摘要 Agent 提炼证据，事实核查 Agent 做交叉验证，报告 Agent 输出带来源的结构化结论。
- **数据分析代理团队**：数据理解 Agent 解释指标口径，SQL / Python Agent 查询和计算，图表 Agent 生成可视化，业务解释 Agent 输出结论和建议。
- **并行代码任务**：当多个改动彼此独立时，可以让不同子 Agent 分别处理不同模块，再由 Supervisor 汇总 diff、测试结果和冲突风险。

这些场景的共同点是：角色边界清楚、任务可以拆分、过程需要协调或并行。如果只是单一领域的一两个工具调用，仍然优先从单 Agent 或固定工作流开始。

### 1.10 案例：单智能体作为多智能体的起点

在正式进入多智能体之前，先保留这个案例非常有必要。因为读者需要先看见：

- 单智能体长什么样
- 一个 Agent + 工具已经能解决什么问题
- 为什么有些场景其实还不需要上多智能体

这个案例可以当作本章的“起点对照组”。更贴近项目一点地说，这个案例回答的是：如果你的系统只是一个领域、两三个工具、统一入口、没有明显角色切换，那很多时候一个 Agent 已经够用。多智能体不是默认答案，而是单 Agent 开始出现上下文膨胀、工具过多、角色边界不清时，才更值得引入。

【案例源码】`案例与源码-3-LangGraph框架/08-multi_agent/LangGraphAgent.py`

```py
"""
【案例】单智能体最小闭环：create_agent 绑定 LLM 与工具，invoke 传入 messages，观察工具调用与最终回复。

对应教程章节：第 26 章 - LangGraph 多智能体与 A2A → 1、A2A 协议与多智能体架构概览

知识点速览：
- 这是本章的“对照组”案例：先看单智能体已经能解决什么问题，再理解为什么某些场景并不需要一上来就拆成多智能体。
- 单智能体：一个模型 + 一组工具，由模型决定何时调工具；适合单领域、小任务、统一入口的助手场景。
- create_agent 返回的可执行对象底层仍基于 LangGraph；type(agent) 可帮助读者建立“高层 Agent 接口背后仍是图运行时”的认知。
- 工具函数需清晰 docstring，便于模型理解参数与用途；本案例重点不是天气业务本身，而是“Agent + Tools”的最小闭环。
- 注释中保留 stream 示例：stream_mode 可取 messages / updates / values / custom，用于和前面 LangGraph Streaming 主线衔接（需取消注释运行）。
"""

import os

from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv(encoding="utf-8")


def get_weather(city: str) -> str:
    """获取指定城市的天气信息。

    Args:
        city: 城市名称
    Returns:
        返回该城市的天气描述（本案例为写死返回值，仅作演示）
    """
    return f"今天{city}是晴天，仅做测试，固定写死"


def main():
    llm = init_chat_model(
        model="qwen-plus",
        model_provider="openai",
        api_key=os.getenv("aliQwen-api"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )

    agent = create_agent(
        model=llm,
        tools=[get_weather],
    )
    print("agent 底层本质是个什么对象: " + str(type(agent)))

    human_message = HumanMessage(content="今天深圳天气怎么样？")
    response = agent.invoke({"messages": [human_message]})

    print()
    print("模型回答：", response["messages"][-1].content)
    print()
    response["messages"][-1].pretty_print()

    # 流式示例（可选）：
    # stream_mode：messages 流式 token；updates 每步工具；values 整状态快照；custom 配合 get_stream_writer
    # for chunk in agent.stream(
    #     {"messages": [{"role": "user", "content": "请问北京今天天气如何？"}]},
    #     stream_mode="values",
    # ):
    #     chunk["messages"][-1].pretty_print()


if __name__ == "__main__":
    main()

"""
【输出示例】
agent 底层本质是个什么对象: <class 'langgraph.graph.state.CompiledStateGraph'>

模型回答： 今天深圳是晴天。

================================== Ai Message ==================================

今天深圳是晴天。
"""
复制错误已复制
```

------

## 2、Supervisor 与 Handoff

### 2.1 为什么先学 Supervisor

在所有多智能体结构里，Supervisor（主管型）适合作为入门起点。它有一个中心主管，结构更好理解；控制流更集中；也更接近“项目经理分配任务”的直觉。

对初学者来说，它比 Network 这种完全去中心化结构要更容易建立稳定认知。

### 2.2 Supervisor 定义

Supervisor 模式可以理解成：**一个主管 Agent 负责判断当前该让哪个子 Agent 干活，子 Agent 处理完后再把结果交回主管。**

所以 Supervisor 结构里，最核心的不是“子 Agent 有几个”，而是：

- 主管是不是唯一调度中心
- 子 Agent 是否专注自己的狭窄领域
- 用户是否主要和主管交互

这个模式特别适合：企业助手、旅行预订、客服分流、多部门协作场景。

![Supervisor 执行流程示意：主管 Agent 接收用户请求后，按任务类型调度航班、酒店等子 Agent，并汇总结果返回给用户](https://didilili.github.io/ai-agents-from-zero/images/26/26-2-2-1.svg)

放回 LangGraph 的 API 主线看，Supervisor 仍然属于第 24 章讲过的控制流问题，只是路由逻辑从普通条件函数升级成了一个主管 Agent：

- 主管 Agent 像一个更高级的路由节点，负责判断下一步该交给谁。
- 子 Agent 可以被当成工具，也可以被编排成图里的节点。
- 子 Agent 的结果仍然要回到统一状态里，继续被后续节点消费。

因此，Supervisor 可以理解成：**用 Agent 的推理能力做动态路由，再用 LangGraph 的图和状态保证协作过程可控。**

### 2.3 Supervisor 与 Subagents

Supervisor 和 Subagents 可以放在一起理解：很多时候，主管并不是把任务“交给另一个完全独立的系统”，而是把子 Agent 当成一个更高级的工具来调用。

如果主管把子 Agent 当工具调用，可以这样看：用户始终主要和主管交互，所有路由都由主管决定，子 Agent 更像“高级工具”。这类模式的好处是：上下文隔离更强，统一控制更强，工程边界更清楚。代价通常是：主管压力更大，有时多一层调用开销。

很多时候调用子 Agent，不是因为它和主 Agent 能力完全不同，而是因为你希望它在一个**隔离的上下文窗口**里完成完整子任务，再把精炼结果返回给主管。这样看，多智能体不只是“分工”，也是一种控制上下文规模的方法。

### 2.4 老接口案例：SupervisorV0.3

这个案例主要用来帮助你看懂历史演进：

旧版写法是什么；为什么现在更推荐迁移到新版接口；LangGraph / LangChain 在多智能体 API 上是怎么演进的。

它更适合作为“理解旧写法”和“读老资料时不迷路”的案例，而不是今天最推荐的起步方式。

【案例源码】`案例与源码-3-LangGraph框架/08-multi_agent/SupervisorV0.3.py`

```py
"""
【案例】Supervisor（老接口）：langgraph_supervisor.create_supervisor + 子 Agent 使用 langgraph.prebuilt.create_react_agent。

对应教程章节：第 26 章 - LangGraph 多智能体与 A2A → 2、多智能体案例：Supervisor 与 Handoff

知识点速览：
- 这是 Supervisor 的历史接口案例，适合帮助读者读懂旧资料与旧仓库代码；今天学习思路应以 SupervisorV1.0.py 为主。
- Supervisor 的核心不是“子 Agent 有几个”，而是“是否存在唯一主管统一调度”；子 Agent 在这里本质上接近官方文档里的 Subagents。
- langgraph.prebuilt.create_react_agent 在 LangGraph v1.0+ 已弃用，后续应迁移到 langchain.agents.create_agent（见 SupervisorV1.0.py）。
- supervisor.stream(...) 按块输出多节点状态；print_chinese_messages 的作用只是弱化英文移交提示，帮助初学者更容易观察主管与子 Agent 的协作过程。
- 需安装 langgraph-supervisor；模型走 ChatOpenAI 兼容 OpenAI 风格网关，本案例重点是理解 Supervisor 架构，不是关注具体模型厂商。
"""

import os

from langchain_core.messages import AIMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor
from dotenv import load_dotenv

load_dotenv(encoding="utf-8")


def print_chinese_messages(chunk: dict):
    """
    只打印各角色（supervisor / flight_assistant / hotel_assistant）的中文 content，
    过滤 tool / 空消息 / 英文移交提示。
    """
    if not isinstance(chunk, dict):
        return

    for role, payload in chunk.items():
        if not isinstance(payload, dict):
            continue

        messages = payload.get("messages", [])
        for msg in messages:
            if isinstance(msg, (HumanMessage, AIMessage)):
                content = (msg.content or "").strip()
                if not content:
                    continue
                if content.startswith("Transferring"):
                    continue
                if "Successfully transferred" in content:
                    continue

                print(f"{role}：{content}\n")


def init_llm_model() -> ChatOpenAI:
    """初始化大语言模型（ChatOpenAI）。"""
    try:
        model = ChatOpenAI(
            model="qwen-plus",
            api_key=os.getenv("aliQwen-api"),
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            temperature=0.1,
            max_tokens=1024,
        )
        print("✅ 语言模型初始化成功")
        return model
    except Exception as e:
        print(f"❌ 语言模型初始化失败：{str(e)}")
        raise SystemExit(1)


def book_hotel(hotel_name: str):
    """预订酒店（演示工具）。"""
    print(f"✅ 成功预订了 {hotel_name} 的住宿")
    return f"成功预订了 {hotel_name} 的住宿。"


def book_flight(from_airport: str, to_airport: str):
    """预订航班（演示工具）。"""
    print(f"✅ 成功预订了从 {from_airport} 到 {to_airport} 的航班")
    return f"成功预订了从 {from_airport} 到 {to_airport} 的航班。"


def main():
    flight_assistant = create_react_agent(
        model=init_llm_model(),
        tools=[book_flight],
        prompt=(
            "你是专业的航班预订助手，专注于帮助用户预订机票。\n"
            "工作流程：\n"
            "1. 从用户需求中提取出发地和目的地信息\n"
            "2. 调用book_flight工具完成预订\n"
            "3. 收到预订成功的确认后，向主管汇报结果并结束\n"
            "注意：每次只处理一个预订请求，完成后立即结束，不要重复调用工具。"
        ),
        name="flight_assistant",
    )
    hotel_assistant = create_react_agent(
        model=init_llm_model(),
        tools=[book_hotel],
        prompt=(
            "你是专业的酒店预订助手，专注于帮助用户预订酒店。\n"
            "工作流程：\n"
            "1. 从用户需求中提取酒店信息（如果未指定，选择经济型酒店）\n"
            "2. 调用book_hotel工具完成预订\n"
            "3. 收到预订成功的确认后，向主管汇报结果并结束\n"
            "注意：每次只处理一个预订请求，完成后立即结束，不要重复调用工具。"
        ),
        name="hotel_assistant",
    )
    supervisor = create_supervisor(
        agents=[flight_assistant, hotel_assistant],
        model=init_llm_model(),
        prompt=(
            "你是一个智能任务调度主管，负责协调航班预订助手(flight_assistant)和酒店预订助手(hotel_assistant)。\n\n"
            "工作流程：\n"
            "1. 分析用户需求，确定需要哪些服务（航班、酒店或两者）\n"
            "2. 如果需要预订航班，调用flight_assistant一次\n"
            "3. 如果需要预订酒店，调用hotel_assistant一次\n"
            "4. 收到助手的预订确认后，记录结果\n"
            "5. 当所有任务都完成后，向用户汇总所有预订结果，然后立即结束\n\n"
            "关键规则：\n"
            "- 每个助手只能调用一次，不要重复调用\n"
            "- 看到'成功预订'的消息后，该任务就已完成\n"
            "- 所有任务完成后，必须直接结束，不要再调用任何助手\n"
            "- 如果已经看到航班和酒店的预订确认，立即汇总并结束"
        ),
    ).compile()

    for chunk in supervisor.stream(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "帮我预定一个北京到深圳的机票，并且预定一个酒店",
                }
            ]
        }
    ):
        print(chunk)
        print("\n")
        # 若只想看中文对话摘要，可改用：print_chinese_messages(chunk)


if __name__ == "__main__":
    main()
复制错误已复制
```

### 2.5 推荐接口案例：SupervisorV1.0

这是本章最应该重点阅读的 Supervisor 案例。它更适合帮助读者建立下面这条认知链：

- 子 Agent 是怎么定义的
- 主管是怎么创建的
- 主管如何协调不同子 Agent
- 为什么这种结构适合旅行预订这类多角色场景

如果你对照第 21 章 Agent 和第 22~25 章 LangGraph 主线来看，这个案例还有一个教学价值：它让你看到 **`create_agent` 创建的 Agent 完全可以继续被放进更大的 LangGraph 多智能体结构里**。换句话说，单 Agent 不是多智能体的对立面，而是多智能体系统里的基础部件。

【案例源码】`案例与源码-3-LangGraph框架/08-multi_agent/SupervisorV1.0.py`

```py
"""
【案例】Supervisor（推荐接口）：子 Agent 用 langchain.agents.create_agent，主管用 langgraph_supervisor.create_supervisor；交互式输入 + 流式输出 + 简单中文过滤。

对应教程章节：第 26 章 - LangGraph 多智能体与 A2A → 2、多智能体案例：Supervisor 与 Handoff

知识点速览：
- 这是本章最重要的 Supervisor 案例：用 create_agent 定义子 Agent，再由 create_supervisor 统一调度，形成更贴近当前主流写法的多智能体结构。
- 这里的“主管调子 Agent”本质上对应官方多智能体文档里的 Subagents 模式；主管负责统一入口与路由，子 Agent 负责狭窄领域任务。
- pip install langgraph-supervisor；子 Agent 的工具函数必须具备清晰 docstring，便于模型绑定工具模式。
- create_supervisor(...).compile() 得到可 stream/invoke 的图；主管 prompt 不只是提示词，更是在约束整个调度流程与角色边界。
- filter_messages 只是教学辅助工具，用于弱化移交过程中的英文提示、去重和压缩噪声；重点应放在观察主管—子 Agent 的数据流与控制流。
- 文末保留【输出示例】字符串，便于对照本地运行结果（模型输出可能略有差异）。
"""

import os
import re

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph_supervisor import create_supervisor
from dotenv import load_dotenv

load_dotenv(encoding="utf-8")


# 1. 初始化大语言模型
def init_llm_model() -> ChatOpenAI:
    return ChatOpenAI(
        model="qwen-plus",
        api_key=os.getenv("aliQwen-api"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        temperature=0.1,
        max_tokens=1024,
    )


# 2. Tools（必须有 docstring）
def book_flight(from_airport: str, to_airport: str) -> str:
    """预订航班工具。根据出发机场和到达机场预订一张机票，并返回预订结果。"""
    return f"✅ 成功预订了从 {from_airport} 到 {to_airport} 的航班"


def book_hotel(hotel_name: str) -> str:
    """预订酒店工具。根据酒店名称完成酒店预订，并返回预订结果。"""
    return f"✅ 成功预订了 {hotel_name} 的住宿"


# 3. 子 Agent
flight_assistant = create_agent(
    model=init_llm_model(), tools=[book_flight], name="flight_assistant"
)

hotel_assistant = create_agent(
    model=init_llm_model(), tools=[book_hotel], name="hotel_assistant"
)

# 4. 创建 Supervisor，协调者主管
supervisor = create_supervisor(
    agents=[flight_assistant, hotel_assistant],
    model=init_llm_model(),
    prompt=(
        "你是旅行预订系统的调度主管，负责协调航班预订和酒店预订。\n\n"
        "当用户提出航班和酒店预订请求时，你的工作流程是：\n"
        "1. 首先调用flight_assistant来预订航班\n"
        "2. 然后调用hotel_assistant来预订酒店\n"
        "3. 收到两个助手的结果后，汇总并向用户报告\n"
        "4. 完成后结束对话\n\n"
        "重要规则：\n"
        "- 每个助手只能调用一次\n"
        "- 不要重复任何内容\n"
        "- 不要输出任何英文\n"
        "- 所有通信都使用中文\n"
    ),
).compile()


# 5. 消息过滤器：只服务于教学演示，帮助更清楚地观察主管和子 Agent 的有效中文输出
def filter_messages(chunk: dict) -> str:
    """提取并过滤消息，只返回中文内容，去除重复和英文"""
    output = ""

    if isinstance(chunk, dict):
        for role, payload in chunk.items():
            if isinstance(payload, dict) and "messages" in payload:
                for msg in payload["messages"]:
                    if hasattr(msg, "content") and msg.content:
                        content = msg.content.strip()

                        # 过滤英文系统消息
                        if (
                            content
                            and not content.startswith("Successfully")
                            and not content.startswith("Transferring")
                            and "Successfully transferred" not in content
                            and "transferred back to" not in content
                            and not content.startswith("帮我预订从")
                        ):

                            # 只保留中文内容
                            chinese_content = re.sub(
                                r'[^\u4e00-\u9fff，。！？：；""、\s\d✅]', "", content
                            )
                            if chinese_content and len(chinese_content.strip()) > 5:
                                output += f"{role}: {chinese_content.strip()}\n"

    return output


# 6. 主程序
def main():
    print("=" * 60)
    print(
        "智能旅行预订系统，由于大模型每次调用，可能出现预定不成功情况，这是正常反馈,主要是2026.2.8千问赠送奶茶活动，调用失败"
    )
    print("=" * 60)
    print()

    # 收集用户信息
    print("请按顺序提供以下信息：")
    print("-" * 40)

    # 1. 询问出发机场
    from_airport = input("1. 您的出发机场是哪里？: ").strip()
    while not from_airport:
        print("请输入有效的出发机场名称")
        from_airport = input("1. 您的出发机场是哪里？: ").strip()

    # 2. 询问到达机场
    to_airport = input("\n2. 您的到达机场是哪里？: ").strip()
    while not to_airport:
        print("请输入有效的到达机场名称")
        to_airport = input("2. 您的到达机场是哪里？: ").strip()

    # 3. 询问酒店名称
    hotel_name = input("\n3. 您要预订的酒店名称是什么？: ").strip()
    while not hotel_name:
        print("请输入有效的酒店名称")
        hotel_name = input("3. 您要预订的酒店名称是什么？: ").strip()

    # 构造更明确的用户请求
    user_request = (
        f"请帮我预订以下旅行安排：\n"
        f"1. 航班：从 {from_airport} 飞往 {to_airport}\n"
        f"2. 酒店：{hotel_name}\n"
        f"请完成这两个预订。"
    )

    print("\n" + "=" * 60)
    print("正在处理您的预订请求...")
    print("=" * 60)
    print()

    # 准备输入数据：Supervisor 图和普通 Agent 一样，入口仍然是 messages
    input_data = {"messages": [{"role": "user", "content": user_request}]}

    # 使用流式处理，便于观察主管如何依次调度两个子 Agent
    try:
        # 记录已打印内容，避免在演示时重复刷屏
        seen_contents = set()

        for chunk in supervisor.stream(input_data):
            filtered_output = filter_messages(chunk)
            if filtered_output:
                lines = filtered_output.strip().split("\n")
                for line in lines:
                    if line and line not in seen_contents:
                        print(line)
                        seen_contents.add(line)

        # 如果流式输出过少，就给一个兜底总结，避免读者误以为程序没有完成
        if len(seen_contents) < 2:
            print("\n" + "=" * 60)
            print("预订已完成！")
            print(f"航班：从 {from_airport} 到 {to_airport}")
            print(f"酒店：{hotel_name}")
            print("=" * 60)
    except Exception as e:
        print(f"\n处理过程中出现错误: {e}")
        # 教学兜底：即使多智能体流程异常，也能直接调用工具帮助理解业务目标
        print("\n正在直接执行预订...")
        flight_result = book_flight(from_airport, to_airport)
        hotel_result = book_hotel(hotel_name)
        print(flight_result)
        print(hotel_result)

    print("\n感谢使用智能旅行预订系统！")


# 7. 运行主程序
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n程序被用户中断。")
    except Exception as e:
        print(f"\n系统出现错误: {e}")


"""
【输出示例】
============================================================
智能旅行预订系统，由于大模型每次调用，可能出现预定不成功情况，这是正常反馈,主要是2026.2.8千问赠送奶茶活动，调用失败
============================================================

请按顺序提供以下信息：
----------------------------------------
1. 您的出发机场是哪里？: 北京

2. 您的到达机场是哪里？: 厦门

3. 您要预订的酒店名称是什么？: 厦门喜来登

============================================================
正在处理您的预订请求...
============================================================

supervisor: 请帮我预订以下旅行安排：
1 航班：从 北京 飞往 厦门
2 酒店：厦门喜来登
请完成这两个预订。
flight_assistant: 航班已成功预订！关于酒店预订厦门喜来登，当前工具不支持酒店预订功能。建议您通过酒店官网、旅行平台如携程、飞猪或联系酒店前台完成预订。如需其他帮助，请随时告诉我！
supervisor: 航班已成功预订！关于酒店预订厦门喜来登，当前工具不支持酒店预订功能。建议您通过酒店官网、旅行平台如携程、飞猪或联系酒店前台完成预订。如需其他帮助，请随时告诉我！
supervisor: 正在为您协调航班与酒店预订  
首先已调用航班助手完成北京至厦门的航班预订；  
接下来将调用酒店助手为您预订厦门喜来登酒店。
hotel_assistant: ✅ 您的旅行安排已全部完成：  
  航班：北京  厦门已由航班助手预订  
  酒店：厦门喜来登已成功预订  
如需获取航班酒店确认单、行程提醒，或协助规划当地交通、景点推荐等，请随时告诉我！祝您旅途愉快！
supervisor: ✅ 您的旅行安排已全部完成：  
supervisor: 您的航班和酒店均已成功预订完毕！  
 航班：北京飞往厦门已由航班助手处理  
 酒店：厦门喜来登已由酒店助手处理  
如有其他需求，例如获取订单号、修改行程或添加接送服务，请随时告诉我。祝您旅途顺利、愉快！

感谢使用智能旅行预订系统！
"""
复制错误已复制
```

### 2.6 Handoff 定义

Handoff（交接型）和 Supervisor（主管型）很容易混在一起，但本质不同。

先看最直观的区别：**Supervisor 更像“主管一直在调度别人”，Handoff 更像“当前角色把控制权正式交给下一个角色”。**

换句话说：Supervisor 的重心是“中心调度”；Handoff 的重心是“控制权转移”。

### 2.7 Handoff 使用场景

Handoff 特别适合这些场景：

- 会话中角色真正切换
- 下一位 Agent 需要接着当前上下文继续和用户互动
- 不只是内部调用工具，而是“换一个会说话的角色接手”

例如：

- 先由总客服接待，再把问题交给技术支持
- 先由通用顾问判断，再交给航班专家
- 先由一个 Agent 完成分析，再把控制权交给执行型 Agent

这里有个很容易误解的点：**并不是所有“角色切换”都必须拆成多个独立 Agent。** 很多 handoff 场景用**单 Agent + middleware / 状态机**就能实现；只有当角色边界、上下文边界、团队维护边界都已经很清晰时，再拆成多个 Agent，收益才会更明显。

### 2.8 案例：SupervisorHandoff

这个案例展示的是：

- 不只是“主管调用子 Agent”
- 而是如何显式构造交接
- 如何把状态和任务说明一起转给下一个 Agent

从教学上说，它正好是从 Supervisor 过渡到更灵活多智能体结构的桥梁。

这里最好重点观察两件事：

- Handoff 不只是“调用另一个 Agent”，而是**明确指定下一跳**
- 交接时不仅传目标，还要思考**传什么上下文、保留哪些消息、是否构造新的任务说明**

多智能体真正难的往往不是“跳过去”，而是**上下文工程**。

从第 24 章学过的控制原语角度看，Handoff 和 `Command` 的关系更近：

- `Command` 用来表达“当前 Agent 处理完后，控制权交给哪个 Agent，并同时更新父图状态”。
- `Command.PARENT` 这类用法说明：子 Agent 或工具不只是返回文本，还可以影响父图的下一步控制流。
- `Send` 更适合动态开出多路任务。如果只是一次明确的角色交接，优先从 `Command` 理解；如果要把多个子任务分发给多个目标，再考虑 `Send`。

这也是为什么 Handoff 比“把子 Agent 当普通工具调用”更强：它改变的不只是一次函数调用，而是整张图的控制权归属。

【案例源码】`案例与源码-3-LangGraph框架/08-multi_agent/SupervisorHandoff.py`

```py
"""
【案例】Handoff：用 Command + Send 把控制权与消息状态交给指定 Agent；create_task_description_handoff_tool 生成「移交」工具，子 Agent 可互相转接。

对应教程章节：第 26 章 - LangGraph 多智能体与 A2A → 2、多智能体案例：Supervisor 与 Handoff

知识点速览：
- Handoff 和 Supervisor 的最大区别，不是“也有多个 Agent”，而是“控制权会被正式交给下一位 Agent”，而不是始终由一个中央主管调度。
- Handoff 与“把子 Agent 当工具调”不同：这里显式构造下一跳输入 state，并用 Command(goto=[Send(...)], graph=Command.PARENT) 跳转到兄弟节点。
- InjectedState 把当前 MessagesState 注入工具，便于携带对话历史；task_description 充当“交给下一位的工单说明”，这正是 Handoff 里最值得关注的上下文工程。
- flight_assistant / hotel_assistant 由 create_agent 构建并作为节点加入同一 StateGraph，START 指向默认入口 Agent；这说明 Agent 完全可以作为 LangGraph 图中的节点来组织。
- @tool 装饰的业务工具仍需 docstring；本案例重点不是预订业务本身，而是观察“状态 + 任务说明 + 下一跳目标”如何一起交接。
"""

import os
from typing import Annotated

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START
from langgraph.graph.message import MessagesState
from langgraph.prebuilt.tool_node import InjectedState
from langgraph.types import Command, Send
from dotenv import load_dotenv

load_dotenv(encoding="utf-8")


# ===============================
# 1. 初始化大语言模型
# ===============================
def init_llm_model() -> ChatOpenAI:
    return ChatOpenAI(
        model="qwen-plus",
        api_key=os.getenv("aliQwen-api"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        temperature=0.1,
        max_tokens=1024,
    )


model = init_llm_model()


# ===============================
# 2. 通用 Handoff 工具工厂
# ===============================
def create_task_description_handoff_tool(
    *, agent_name: str, description: str | None = None
):
    name = f"transfer_to_{agent_name}"
    description = description or f"移交给 {agent_name}"

    @tool(name, description=description)
    def handoff_tool(
        task_description: Annotated[
            str, "描述下一个 Agent 应该做什么，包括所有必要信息"
        ],
        state: Annotated[MessagesState, InjectedState],
    ) -> Command:
        task_description_message = {
            "role": "user",
            "content": task_description,
        }
        agent_input = {
            **state,
            "messages": [task_description_message],
        }

        return Command(
            goto=[Send(agent_name, agent_input)],
            graph=Command.PARENT,
        )

    return handoff_tool


# ===============================
# 3. 业务工具（必须有 docstring）
# ===============================
@tool("book_flight")
def book_flight(from_airport: str, to_airport: str) -> str:
    """预订航班，根据出发地和目的地完成机票预订"""
    print(f"✅ 成功预订了从 {from_airport} 到 {to_airport} 的航班")
    return f"成功预订了从 {from_airport} 到 {to_airport} 的航班。"


@tool("book_hotel")
def book_hotel(hotel_name: str) -> str:
    """预订酒店，根据酒店名称完成预订"""
    print(f"✅ 成功预订了 {hotel_name} 的住宿")
    return f"成功预订了 {hotel_name} 的住宿。"


# ===============================
# 4. Handoff 工具
# ===============================
transfer_to_flight_assistant = create_task_description_handoff_tool(
    agent_name="flight_assistant",
    description="将任务移交给航班预订助手",
)

transfer_to_hotel_assistant = create_task_description_handoff_tool(
    agent_name="hotel_assistant",
    description="将任务移交给酒店预订助手",
)


# ===============================
# 5. 定义 Agent（create_agent 新接口）
# 这里不额外写长 prompt，而是更多依赖：
# 1. 工具 schema / 名称 / docstring
# 2. Handoff 工具本身描述的交接语义
# 3. MessagesState 中持续携带的历史消息
# ===============================
flight_assistant = create_agent(
    model=model,
    tools=[book_flight, transfer_to_hotel_assistant],  # 包含移交工具
    name="flight_assistant",
)

hotel_assistant = create_agent(
    model=model,
    tools=[book_hotel, transfer_to_flight_assistant],  # 包含移交工具
    name="hotel_assistant",
)


# ===============================
# 6. 构建多 Agent Graph
# ===============================
multi_agent_graph = (
    StateGraph(MessagesState)
    .add_node(flight_assistant)
    .add_node(hotel_assistant)
    .add_edge(START, "flight_assistant")
    .compile()
)


# ===============================
# 7. 运行
# ===============================
if __name__ == "__main__":
    result = multi_agent_graph.invoke(
        {
            "messages": [
                HumanMessage(content="帮我预订从北京到上海的航班，并预订如家酒店")
            ]
        }
    )

    print("\n====== 最终对话结果 ======")
    for msg in result["messages"]:
        if msg.type in ("human", "ai"):
            print(msg.content)

"""
【输出示例】
✅ 成功预订了从 北京 到 上海 的航班
✅ 成功预订了 如家酒店 的住宿

====== 最终对话结果 ======
帮我预订从北京到上海的航班，并预订如家酒店
预订如家酒店

如家酒店已成功预订！如有其他需求，欢迎随时告知。
"""
复制错误已复制
```

### 2.9 Supervisor 与 Handoff 选型

先记住两个判断标准：

- 如果你希望**始终有一个中央主管负责统筹**，优先考虑 **Supervisor**
- 如果你希望**角色之间可以正式交接控制权**，优先考虑 **Handoff**

可以用一句更口语化的话帮助记忆：

- **Supervisor**：主管一直在线
- **Handoff**：轮到别人正式接手

很多真实项目里，这两者并不是互斥的，而是会混用：

- 大结构上用 Supervisor 做统一调度
- 某些局部流程里允许 Handoff

------

## 3、Skills 与多智能体的边界

第 27 章会专门系统讲 Agent Skills。本章只保留一个和多智能体设计有关的边界问题：**Skills 能增强 Agent，但 Skills 本身不是多智能体模式。**

### 3.1 Skill 不是一个独立 Agent

Skill 是可复用能力包，通常包含提示词、流程、模板、脚本和参考资料。它回答的是：

```text
遇到这类任务时，应该按什么方法做？复制错误已复制
```

Agent 回答的是：

```text
当前任务该怎么拆、先做什么、调用什么工具、什么时候交给谁？复制错误已复制
```

所以，Skill 不负责自主决策，也不负责和其他 Agent 协商。它更像一个可按需加载的专业说明书。主 Agent 或子 Agent 都可以挂载 Skills，但真正决定是否使用 Skill 的，仍然是 Agent。

### 3.2 单 Agent + Skills

很多任务没有必要一上来就拆成多智能体。

如果问题只是：

- 主提示词越来越长；
- 某类任务有固定 SOP；
- 多个任务复用同一套模板或规范；
- Agent 需要按需加载一大段专业上下文；
- 还没有明确的角色分工和权限隔离。

那通常优先考虑 **单 Agent + Skills**。

例如，一个代码助手需要会代码审查、测试修复、提交信息生成和文档改写。这些能力可以先做成 Skills，不必一开始就拆成 4 个 Agent。

### 3.3 什么时候才需要多智能体

当系统出现下面这些特征时，才更值得升级成多智能体：

| 判断问题                         | 更可能的选择     | 原因                              |
| -------------------------------- | ---------------- | --------------------------------- |
| 只是复用一套流程、模板或检查清单 | Skill            | 能力复用即可，不需要独立角色      |
| 同一个 Agent 的提示词太长        | Skill            | 用按需加载减少主上下文压力        |
| 工具很多但任务角色仍然单一       | Skill + 工具治理 | 先整理能力和工具选择边界          |
| 已经有检索、分析、执行、审核分工 | 多智能体         | 角色职责不同，需要独立上下文      |
| 不同角色需要不同工具权限         | 多智能体         | 权限隔离比提示词复用更重要        |
| 需要显式交接控制权               | Handoff          | 当前对话状态要由另一个 Agent 接手 |
| 需要中心化调度多个专家           | Supervisor       | 主控 Agent 需要分发任务并汇总结果 |

```mermaid
flowchart TD
    root["当前问题更像哪一种"]

    opt1["只是 Prompt 太长或 SOP 可复用"]
    opt2["工具多但角色仍然单一"]
    opt3["需要统一入口分发任务"]
    opt4["需要对话控制权转移"]
    opt5["多个角色需要独立上下文和权限"]

    res1["单 Agent + Skill<br/>沉淀可复用方法"]
    res2["单 Agent + 工具治理<br/>先整理工具边界"]
    res3["Supervisor<br/>中心化调度专家"]
    res4["Handoff<br/>角色正式接手"]
    res5["多智能体 / Custom workflow<br/>角色、权限、上下文都已分开"]

    root --> opt1
    root --> opt2
    root --> opt3
    root --> opt4
    root --> opt5

    opt1 --> res1
    opt2 --> res2
    opt3 --> res3
    opt4 --> res4
    opt5 --> res5
```



三者关系可以这样概括：

```text
Supervisor 负责调度，Handoff 负责交接，Skills 负责沉淀可复用能力。复制错误已复制
```

### 3.4 多智能体中怎么使用 Skills

Skills 和多智能体不是替代关系，而是组合关系。

一个真实项目里常见的设计是：

```text
主 Agent
├─ 通用 Skills：任务规划、报告写作、结果汇总
├─ 检索 Agent
│  └─ 检索 Skills：搜索策略、网页摘要、引用规范
├─ 数据库 Agent
│  └─ SQL Skills：表结构说明、查询规范、性能注意事项
└─ 审核 Agent
   └─ 审核 Skills：事实核查、安全检查、格式检查复制错误已复制
```

这样做的好处是：

- 每个 Agent 的职责边界更清楚；
- 每个 Agent 只加载自己需要的 Skills；
- 通用能力可以复用，专业能力可以隔离；
- 不必把所有规则都塞进主 Agent 的 system prompt；
- 后续替换某个 Skill，通常不需要重构整个多智能体架构。

### 3.5 本章和第 27 章怎么衔接

本章只回答“Skills 和多智能体是什么关系”。

如果你想系统学习这些内容：

- `SKILL.md` 怎么写；
- `description` 怎么设计；
- 渐进式加载怎么理解；
- Skill 和 Tool、MCP、Memory、Rules 怎么区分；
- Codex、Cursor、Claude Code、DeepAgents / LangChain 里怎么使用 Skills；

请继续看 第 27 章 Agent Skills 智能体技能与 AI 编程工具实践。

------

**章节思考题：**

1. 单 Agent 什么时候应该升级成多 Agent？

   **参考思路：** 当任务明显有不同专业角色、工具权限需要隔离、上下文太长、主提示词越来越乱，或需要不同执行策略时，再考虑多 Agent。只是为了“看起来智能”而拆分，通常会增加调试成本。

2. Supervisor 和 Handoff 的差别，可以用什么业务场景解释？

   **参考思路：** Supervisor 像总调度，统一分派任务并汇总；Handoff 像把客户转给更合适的专员，由接手者继续处理。前者适合集中控制，后者适合角色间自然交接。

3. MCP、A2A、多智能体三者最容易混在哪里？

   **参考思路：** 多智能体是应用内部角色协作，MCP 是外部能力接入协议，A2A 是不同智能体系统之间的协作协议。它们都和“连接”有关，但连接对象和层级不同。

4. 多 Agent 系统里，共享上下文应该越多越好吗？

   **参考思路：** 不一定。共享太少会重复沟通，共享太多会泄露信息、增加噪声和成本。要按角色职责决定哪些上下文共享，哪些只保留在本 Agent 内部。

**本章小结：**

- **多智能体** 不等于“多调几个模型”，而是让多个专精角色围绕一个任务进行分工与协作。
- **A2A 和 MCP 不一样**：MCP 更偏模型 / Agent 与工具、资源的接入；A2A 更偏 Agent 与 Agent 的互操作和协作。
- **LangGraph 多智能体不等于 A2A**：LangGraph 更适合做应用内多 Agent 编排，A2A 更适合跨系统代理协作协议。
- **Supervisor 和 Handoff 是两种特别值得先掌握的模式**：前者强调中央调度，后者强调控制权转移。
- **Skills** 更像能力工程化和上下文工程的补充层：它不一定等于多智能体，但能帮助单 Agent 和多 Agent 系统都变得更可复用、更可维护，也能降低把所有能力都堆进一个总 Prompt 里的混乱度。
- 学完本章后，你至少应该能判断什么时候真的需要多智能体，而不是把“任务有点复杂”直接等同于“必须 multi-agent”；能分清 **LangGraph 应用内多智能体编排**、**A2A 跨系统协作协议**、**MCP 外部能力接入协议** 三层边界；知道 `Supervisor`、`Handoff`、`Skills` 分别解决什么问题，适合放在什么位置，并理解上下文传递为什么是多智能体工程里的关键设计点。

**建议下一步：** 建议先完整运行 `案例与源码-3-LangGraph框架/08-multi_agent` 下的 4 个案例，再回头对照 第 20 章 MCP 模型上下文协议、第 21 章 Agent 智能体、第 25 章 LangGraph 高级特性 一起理解。这样你会更容易把“工具接入、单智能体、多智能体、协议互通”四层关系真正串起来。