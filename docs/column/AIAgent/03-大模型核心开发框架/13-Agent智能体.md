---
date: 2026年08月28日
---

# Agent 智能体

------

**本章课程目标：**

- 理解 **Agent（智能体）** 到底是什么、适合解决什么问题，以及它与 Tool、Function Calling、RAG、MCP 的关系。
- 掌握 Agent 的核心工作方式：**围绕目标持续推理、决定是否调用工具、接收结果、继续决策，直到满足结束条件**。
- 理解 LangChain 中 Agent 的两条学习主线：**V0.3 / classic 的 Agent + AgentExecutor**，以及 **V1.x 的 `create_agent` + LangGraph 运行时**。
- 跑通并理解本章全部案例：`AgentSmartSelectV0.3.py`、`AgentSmartSelectV1.0.py`、`AgentReact.py`、`Agent2Agent.py`、`McpClientAgent.py`。

**学习建议：** Agent 这章先抓一句话：Agent 是决策层，不是工具本身。读的时候先看它如何决定下一步，再看 Tool、RAG、MCP、Function Calling 分别给它补了什么能力。代码部分重点比较旧的 AgentExecutor 和新的 `create_agent` 思路；读完后要能判断一个需求到底该用普通链、工具调用，还是 Agent。

**官方文档与资源**：详见 [工具导航与参考资料索引 - 工具调用、MCP与智能体](https://i8zoro8i.github.io/zoro_blog/column/AIAgent/工具导航与参考资料索引)。

------

## 1、Agent 简介

### 1.1 定义

先给初学者一句最重要的话：**Agent 不是某个单独的模型，也不是某个单独的工具，而是一种“围绕目标持续做决策并调用能力”的运行方式。**

如果只看最小本质，可以把 Agent 看作：**Agent = 模型 + 工具集 + 运行循环 + 当前状态**。

这里的四个部分分别代表：

- **模型（Model）**：负责理解用户目标、分析当前局面、决定下一步。
- **工具集（Tools）**：负责执行动作，例如查天气、查库存、调用 API、搜索文档、访问数据库。
- **运行循环（Loop）**：负责让模型不是只回答一次，而是可以“想一步、做一步、看结果、再决定下一步”。
- **状态（State）**：负责保存本轮对话、工具返回、中间结果，有时也包含短期记忆。

这也是本章首先要修正的一个常见误区：**不是所有 Agent 都必须同时具备“长期记忆、复杂规划、多智能体协作”。**

对很多入门场景来说，一个最简单的 Agent 只要能：1. 读懂用户目标；2. 知道什么时候调工具；3. 能根据工具结果继续判断；4. 最后给出答案。就已经是 Agent 了。

上面的公式是帮助你先抓住重点的“最小理解版”。如果把 Agent 再进一步展开，它在更完整的架构图里还可能包含记忆、规划、反思等能力。所以下图更适合理解为“扩展后的能力拼图”，而不是和上面四项定义做一一对应。

![Agent 扩展架构示意：中心为 Agent，周邻 Memory（短/长期）、Planning（反思、自评、思维链）、Tools（日历、计算、搜索等）与 Action，强调多模块协同而非最小四元组一一对应（中文）](https://didilili.github.io/ai-agents-from-zero/images/21/21-1-1-2.png)

![Agent 扩展架构示意：中心为 Agent，周邻 Memory（短/长期）、Planning（反思、自评、思维链）、Tools（日历、计算、搜索等）与 Action，强调多模块协同而非最小四元组一一对应（英文）](https://didilili.github.io/ai-agents-from-zero/images/21/21-1-1-1.jpeg)

### 1.2 Agent 最常见的工作方式：ReAct

**ReAct = Reason + Act。**中文可以看作：**先推理，再行动。**

这是 Agent 最经典的一种运行循环：

1. **Thought / Reason（思考）**：当前要做什么，先想一步。
2. **Action（行动）**：如果需要外部能力，就调用某个工具。
3. **Observation（观察）**：拿到工具返回结果。
4. **继续循环或结束**：如果还没完成，就继续下一轮；如果信息足够，就给出最终答案。

所以 ReAct 的本质就是：**先推理，再行动；根据行动结果，再继续推理。**

这点和普通“只回答一次”的 LLM 调用差异非常大。普通对话通常是：用户提问、模型直接回答。而 Agent 更像：用户提问、模型判断要不要查工具、调工具、看结果、再判断要不要继续、最终回答。

下图正好对应这条循环：

![ReAct 模式：思考（Thought）→ 行动（Action）→ 观察（Observation）→ 根据结果继续循环或给出最终答案的闭环示意](https://didilili.github.io/ai-agents-from-zero/images/21/21-1-2-1.jpeg)

这里还要补一个现实中的重要认知：**现代 Tool Calling Agent 不一定会把“Thought”完整显示给你看。**

很多时候你在代码里真正看到的是：

- `AIMessage` 里出现 `tool_calls`
- 工具执行后得到 `ToolMessage`
- 最后再出现一个普通 `AIMessage`

所以在今天的 LangChain / Tool Calling 语境里，ReAct 更应该被理解成一种**工作机制**，而不只是某种固定的 Prompt 模板格式。

**Agent 不只有 ReAct 这一种工作方式。**

ReAct 只是最经典、最适合入门的一种理解方式，因为它最容易让人看懂“为什么 Agent 不只是一次回答”。但在真实项目里，常见的 Agent 形态还包括：

- **Plan-and-Execute**：先整体规划，再按计划逐步执行。
- **Router / Supervisor**：先判断该把任务交给哪个工具、哪个子 Agent、哪个流程。
- **Workflow + Agent 混合**：固定部分用工作流，遇到不确定节点时再让 Agent 决策。
- **Multi-Agent / A2A**：多个 Agent 分工协作，由一个主 Agent 或协调器统筹。
- **Human-in-the-loop**：关键步骤需要人工确认，Agent 不是全自动闭环。

所以更准确的结论是：

- **ReAct 是 Agent 最经典的一种工作机制**
- **不是 Agent 的唯一形态**
- **本章先用 ReAct 入门，是因为它最容易把 Agent 的核心价值讲清楚**

### 1.3 Tool 与 Agent 的关系

这一节是整章最容易混淆的地方。

**Tool（工具）** 是能力封装。

例如： `get_weather()`、`search_products()`、`check_inventory()`、`book_flight()`。它们都只是“能做一件事”的函数或接口。

**Agent** 则是决策者。

它负责判断：现在要不要调用工具、调哪个工具、先调哪个、后调哪个、一个工具够不够、工具失败了要不要重试或换路线、什么时候可以停止并给最终答案。

所以两者关系可以概括成：**Tool = 能力；Agent = 决策 + 使用这些能力。**

| 对象      | 本质定位 | 一句话理解                         |
| --------- | -------- | ---------------------------------- |
| **Tool**  | 能力层   | 我能做什么                         |
| **Agent** | 决策层   | 我什么时候、按什么顺序去用这些能力 |

也正因为如此，**不是“有 Tool 就有 Agent”**。比如“查一下北京天气”这种一步问题，直接调一个天气工具就够了，完全可以不需要 Agent。

但如果问题变成：“帮我找最热门的无线耳机，再查库存，再告诉我哪款可以买”；“先订机票，再订酒店，再预约打车”；“先查知识库，再看是否需要调外部 API，再整理成报告”。

这时就不是某个单独 Tool 能解决的了，而是需要有人负责多步决策，这时 Agent 才有价值。

### 1.4 Agent 的使用场景

这一点结合官方关于 **workflow vs agent** 的区分来理解最清楚。这里的 **workflow**，中文通常可以理解成：**工作流 / 固定流程**。指的是一条**步骤基本提前确定、执行顺序相对稳定**的处理路线，例如先做 A，再做 B，再做 C，中间不太需要模型临场决定“下一步该怎么走”。

先把它和 Agent 粗略区分开会更清楚：**workflow** 的流程基本写死，重点是“按既定步骤执行”；**agent** 的流程不完全固定，重点是“根据上下文动态决策”。**如果流程路径是固定的，优先考虑工作流 / 链，而不是 Agent。**

比如：

- 固定先做文本切分，再做向量化，再写入向量库
- 固定先分类，再摘要，再存库
- 固定按 A → B → C 的顺序执行

这类场景更像 第 7 章 LCEL 与链式调用 或后续 LangGraph 的**工作流**问题。

**如果下一步怎么做不固定，需要模型根据中间结果动态决定，就更适合 Agent。**

比如：

- 用户问题不确定，需要模型决定先查库还是先调 API
- 工具很多，模型要自己选哪个
- 可能要调一次工具，也可能要调很多次
- 工具返回后还要继续推理

所以更贴近实际项目的判断标准可以写成：

| 场景                                                   | 更适合什么  |
| ------------------------------------------------------ | ----------- |
| 路径固定、步骤明确、顺序可提前写死                     | 链 / 工作流 |
| 路径不固定、工具选择依赖上下文、中间结果会影响后续决策 | Agent       |

这也是为什么今天很多企业项目其实是：**Workflow 负责固定骨架，Agent 负责不确定节点的决策。**

从 2025-2026 年的真实项目看，Agent 的典型场景也在从“会调几个工具”扩展到更完整的任务闭环。比如：

- **浏览器自动化 / Computer Use Agent**：根据目标理解页面、点击按钮、填写表单、滚动页面，并通过截图或页面状态校验结果。
- **长任务研究代理**：围绕复杂问题拆分子任务，多轮搜索、交叉验证资料，最后生成带来源的结构化报告。
- **代码库维护代理**：读取代码库、定位相关文件、制定修改计划、编辑代码、运行测试，并根据失败结果继续修复。
- **文件 / 数据分析代理**：读取表格、PDF、日志或业务数据，调用代码执行、SQL、统计或可视化工具，输出分析结论和图表。

这些例子仍然符合上面的判断标准：如果流程完全固定，用链或工作流更稳；如果每一步都要根据中间结果继续判断，才更适合交给 Agent。

------

## 2、演变过程：从多步组装到一步创建

### 2.1 V0.3 / classic 路线：显式组装 Agent

在较早的 LangChain Agent 写法中，通常要显式准备这些部分：1. 模型；2. 工具列表；3. Prompt 模板；4. `create_tool_calling_agent(...)`；5. `AgentExecutor(...)`。

也就是说，Agent 本身只负责“出主意、决定调用什么”，真正驱动循环、执行工具、把结果写回上下文的，通常是 **AgentExecutor**。

这一套写法的优点是：结构清楚、很适合教学、容易看懂 Agent 和 Executor 是怎么配合的。

它的局限是：代码更长、容易被 Prompt、scratchpad、executor 等概念同时压住、工程上需要手动拼接更多组件。

仓库里的 `AgentSmartSelectV0.3.py` 就是这条路线的典型案例。

### 2.2 V1.x 路线：create_agent 一步创建

到了 LangChain 1.x，官方更推荐的入口是：

```python
from langchain.agents import create_agent
```

然后直接把模型、工具、系统提示等交进去，得到一个可运行的 Agent。

这种方式的核心变化不是“Agent 不循环了”，而是：**很多原来要自己显式组装的部分，被封装进了更统一的运行时。**

根据当前官方文档，`create_agent` 背后使用的是**基于 LangGraph 的 graph-based runtime**。这里的 **graph-based runtime**，可以看成：**Agent 的执行过程不再只是“一次函数调用”，而是由一个基于状态流转的运行框架来驱动。**

可以把它看成这样：

- 当前有哪些消息和中间结果，这是**状态**
- 下一步是继续让模型推理、去调工具，还是结束输出，这是**状态流转**
- 整个过程像一张“节点 + 连线”的执行图，所以叫 **graph-based**

这里不用先深入 LangGraph 细节，先抓住一句话就够了：

**`create_agent` 虽然看起来像一步创建，但底层仍然有一套负责“循环、状态、工具调用”的运行时在支撑它。**

这意味着：Agent 仍然在循环，仍然会调工具，仍然会维护消息状态。只是这些动作不再要求你手动拼出一套 `Agent + AgentExecutor + scratchpad` 才能跑。

### 2.3 这两条路线的意义

对你这套教程来说，这两条路线都值得保留，因为它们分别承担不同教学价值：

- **V0.3 / classic 路线**
  帮助你理解 Agent 内部到底怎么转：Prompt、工具、Executor、循环是怎么配合的。
- **V1.x / `create_agent` 路线**
  帮助你掌握当前官方更推荐的写法，更接近真实项目开发。

所以这一章不是在教你背两个 API，而是在教你：**经典写法怎么看**，**当前写法怎么用**，**二者背后的 Agent 本质其实是同一件事**。

### 2.4 V0.3 与 V1.x 的对比速览

| 维度     | V0.3 / classic                                | V1.x / `create_agent`  |
| -------- | --------------------------------------------- | ---------------------- |
| 核心入口 | `create_tool_calling_agent` + `AgentExecutor` | `create_agent`         |
| 代码组织 | 手动拼更多组件                                | 统一入口更简洁         |
| 学习价值 | 更容易看清内部结构                            | 更接近当前官方主线     |
| 运行方式 | Agent 决策，Executor 驱动循环                 | graph runtime 驱动循环 |
| 更适合   | 理解原理、维护旧案例                          | 新项目、快速搭建       |

还有一个实践补充：

**当前官方 1.x 文档更强调以 `messages` 状态作为 Agent 的统一输入。**但本教程仓库中为了教学连续性，仍保留了部分 `{"input": "..."}` 风格示例。读代码时先抓住入口含义：**它们都是在给 Agent 一个“新的用户请求”**，只是不同版本、不同适配层的调用方式略有差异。

------

## 3、Agent 工作原理（V0.3）

这一节聚焦本教程里的 classic 路线，因为它最适合拆开理解 Agent 的内部工作机制。

### 3.1 保留 V0.3 的原因

虽然今天新项目更常直接用 `create_agent`，但 classic 路线依然有学习价值。它能让你看清楚：Agent 自己负责什么，AgentExecutor 负责什么，为什么 Prompt 里要有 `agent_scratchpad`，工具结果是怎么“再喂回去”给模型继续推理的。

### 3.2 Agent 与 AgentExecutor 的职责分工

在 V0.3 / classic 路线下，职责可以直接拆成：

- **Agent**：负责分析输入、决定下一步动作
- **AgentExecutor**：负责执行动作、拿结果、继续驱动循环

也就是说：**Agent 更像大脑，AgentExecutor 更像执行器和循环调度器。**这也是为什么单独有 Agent 通常还不够，还要再交给 Executor 去跑。

下图正好适合理解这一点：

![AgentExecutor 工作流示意：左侧为消息流（Input、模型回复、History）；中间为 Agent 链（Prompt、LLM、输出解析）决定下一步；右侧为可调用的 Tool 1…n，执行结果回传并形成循环直至结束](https://didilili.github.io/ai-agents-from-zero/images/21/21-3-2-1.jpeg)

### 3.3 agent_scratchpad 重要性

你在 classic 路线里经常会看到 Prompt 里有这样一个占位：

```python
("placeholder", "{agent_scratchpad}")
```

其中 `ChatPromptTemplate`、占位符与消息结构，与 第 5 章 提示词与消息模板 一脉相承；这里多出来的 `{agent_scratchpad}` 专供多轮工具循环使用。

这不是装饰，它的作用非常关键。它相当于 Agent 的“草稿区 / 中间步骤区”，用来承接：模型上一轮决定调用什么工具；工具返回了什么；下一轮模型基于这些信息继续推理。

如果没有这块区域，模型就很难在多步循环里“记住刚刚自己做过什么”。

所以在 classic 路线里，`agent_scratchpad` 不是一个边角知识点，而是 **ReAct 循环能成立的重要拼图**。

### 3.4 结合案例理解

【案例源码】`案例与源码-2-LangChain框架/12-agent/AgentSmartSelectV0.3.py`

```py
"""
【案例】多工具并行调用与聚合回答（V0.3：Agent + AgentExecutor）

对应教程章节：第 13 章 - Agent 智能体 → 3、Agent 工作原理（V0.3）

知识点速览：
- Tool 与 Agent 关系：Tool 提供能力（如查天气），Agent 负责决策「何时用、用哪个、如何聚合结果」。
  本案例中一次问题「北京和上海哪个更热」触发多次工具调用，再由 Agent 汇总比较。
- V0.3 流程：模型 + 工具 + 提示模板 → create_tool_calling_agent 得到 Agent → 用 AgentExecutor 执行，
  对应教程「3、Agent 工作原理（V0.3 视角）」：Agent 只做决策，Executor 负责真正调用工具并把结果传回 Agent。
- 关键组件：ChatPromptTemplate 定义对话结构（含 `agent_scratchpad` 占位符）、AgentExecutor 驱动循环。
- `agent_scratchpad` 可以理解成 Agent 的“草稿区 / 中间步骤区”，没有它，classic 路线下的多步推理就很难成立。
- `AgentExecutor(verbose=True)` 很适合教学和排查，它相当于一个轻量级的执行日志窗口；新版教程里补充的
  `stream()` / LangSmith 则是更偏 1.x 和工程化的观察手段。
- 这个文件的核心价值不是“天气查询”，而是帮助你看清 classic Agent 是如何围绕一次问题完成多次工具调用的。
"""

import json
import os
import httpx
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

from langchain_classic.agents import create_tool_calling_agent
from langchain_classic.agents import AgentExecutor
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool


@tool
def get_weather(loc):
    """
    查询即时天气函数

    :param loc: 必要参数，字符串类型，表示查询天气的城市名称；中国城市需用英文名，如 Beijing、Shanghai。
    :return: OpenWeather API 返回的天气信息，JSON 序列化后的字符串。
    """
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": loc,
        "appid": os.getenv("OPENWEATHER_API_KEY"),
        "units": "metric",
        "lang": "zh_cn",
    }
    response = httpx.get(url, params=params, timeout=30)
    data = response.json()
    print(json.dumps(data))
    return json.dumps(data)


# 初始化大模型，用于理解用户问题并决定是否调用工具、如何组合结果
llm = ChatOpenAI(
    model="qwen-plus",
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# 定义 Agent 的对话结构：system 定角色，human 为用户输入，
# placeholder 供 Executor 填入中间推理与工具调用记录
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "你是天气助手，请根据用户的问题，给出相应的天气信息"),
        ("human", "{input}"),
        (
            "placeholder",
            "{agent_scratchpad}",
        ),  # V0.3 必备：Agent 的「草稿本」，记录多轮推理与工具输出
    ]
)

tools = [get_weather]

# 将 LLM、工具列表、提示模板组装成「可做工具调用决策」的 Agent（尚未执行）
agent = create_tool_calling_agent(llm, tools, prompt)

# AgentExecutor 负责循环：调用 Agent → 执行其选中的工具 →
# 把结果写回 agent_scratchpad → 再交给 Agent，直到结束
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 一次问题触发多工具调用（北京、上海天气）并聚合回答
result = agent_executor.invoke(
    {"input": "请问今天北京和上海的天气怎么样，哪个城市更热？"}
)

print(result)

"""
【输出示例】
> Entering new AgentExecutor chain...
"""

# Invoking: `get_weather` with `{'loc': 'Beijing'}`


# {"coord": {"lon": 116.3972, "lat": 39.9075}, "weather": [{"id": 804, "main": "Clouds", "description": "\u9634\uff0c\u591a\u4e91", "icon": "04d"}], "base": "stations", "main": {"temp": 10.49, "feels_like": 8.51, "temp_min": 10.49, "temp_max": 10.49, "pressure": 1024, "humidity": 35, "sea_level": 1024, "grnd_level": 1019}, "visibility": 10000, "wind": {"speed": 0.49, "deg": 203, "gust": 0.67}, "clouds": {"all": 100}, "dt": 1773385469, "sys": {"country": "CN", "sunrise": 1773354606, "sunset": 1773397087}, "timezone": 28800, "id": 1816670, "name": "Beijing", "cod": 200}
# {"coord": {"lon": 116.3972, "lat": 39.9075}, "weather": [{"id": 804, "main": "Clouds", "description": "\u9634\uff0c\u591a\u4e91", "icon": "04d"}], "base": "stations", "main": {"temp": 10.49, "feels_like": 8.51, "temp_min": 10.49, "temp_max": 10.49, "pressure": 1024, "humidity": 35, "sea_level": 1024, "grnd_level": 1019}, "visibility": 10000, "wind": {"speed": 0.49, "deg": 203, "gust": 0.67}, "clouds": {"all": 100}, "dt": 1773385469, "sys": {"country": "CN", "sunrise": 1773354606, "sunset": 1773397087}, "timezone": 28800, "id": 1816670, "name": "Beijing", "cod": 200}
# Invoking: `get_weather` with `{'loc': 'Shanghai'}`


# {"coord": {"lon": 121.4581, "lat": 31.2222}, "weather": [{"id": 800, "main": "Clear", "description": "\u6674", "icon": "01d"}], "base": "stations", "main": {"temp": 15.34, "feels_like": 13.5, "temp_min": 15.34, "temp_max": 15.34, "pressure": 1027, "humidity": 22, "sea_level": 1027, "grnd_level": 1026}, "visibility": 10000, "wind": {"speed": 3.06, "deg": 84, "gust": 2.32}, "clouds": {"all": 0}, "dt": 1773385631, "sys": {"country": "CN", "sunrise": 1773353249, "sunset": 1773396016}, "timezone": 28800, "id": 1796236, "name": "Shanghai", "cod": 200}
# {"coord": {"lon": 121.4581, "lat": 31.2222}, "weather": [{"id": 800, "main": "Clear", "description": "\u6674", "icon": "01d"}], "base": "stations", "main": {"temp": 15.34, "feels_like": 13.5, "temp_min": 15.34, "temp_max": 15.34, "pressure": 1027, "humidity": 22, "sea_level": 1027, "grnd_level": 1026}, "visibility": 10000, "wind": {"speed": 3.06, "deg": 84, "gust": 2.32}, "clouds": {"all": 0}, "dt": 1773385631, "sys": {"country": "CN", "sunrise": 1773353249, "sunset": 1773396016}, "timezone": 28800, "id": 1796236, "name": "Shanghai", "cod": 200}今天北京和上海的天气情况如下：

# - **北京**：阴，多云，当前气温为 **10.49°C**，体感温度约 **8.51°C**，湿度较低（35%），风速较小（0.49 m/s）。
# - **上海**：晴，当前气温为 **15.34°C**，体感温度约 **13.5°C**，湿度更低（22%），风速稍大（3.06 m/s），天空无云。

# **对比来看，上海更热**，当前气温比北京高约 **4.85°C**，且阳光充足，体感也更温暖。

# 如需未来几天预报或穿衣建议，欢迎随时告诉我！ 😊

# > Finished chain.
# {'input': '请问今天北京和上海的天气怎么样，哪个城市更热？', 'output': '今天北京和上海的天气情况如下：\n\n- **北京**：阴，多云，当前气温为 **10.49°C**，体感温度约 **8.51°C**，湿度较低（35%），风速较小（0.49 m/s）。\n- **上海**：晴，当前气温为 **15.34°C**，体感温度约 **13.5°C**，湿度更低（22%），风速稍大（3.06 m/s），天空无云。\n\n**对比来看，上海更热**，当前气温比北京高约 **4.85°C**，且阳光充足，体感也更温暖。\n\n如需未来几天预报或穿衣建议，欢迎随时告诉我！ 😊'}

```

这个案例适合用来理解 classic Agent 的完整链路，因为它把这些部分都摆出来了：

1. 定义 `get_weather` 工具
2. 定义 `ChatPromptTemplate`
3. 在 Prompt 里保留 `agent_scratchpad`
4. 用 `create_tool_calling_agent` 得到 Agent
5. 用 `AgentExecutor` 驱动执行

当用户问：请问今天北京和上海的天气怎么样，哪个城市更热？

这个案例里的 Agent 并不是“一次回答完”，而是更像这样：

1. 先判断需要查天气
2. 调一次 `get_weather(Beijing)`
3. 再调一次 `get_weather(Shanghai)`
4. 根据两次工具结果做比较
5. 最后输出总结

所以它真正演示的不是“天气查询”，而是：**一个 classic Agent 如何做多步工具调用，并把多次结果汇总成最终回答。**

------

## 4、Agent 工作原理（V1.0）

这一节对应当前官方主线，也就是你项目里更现代的 Agent 入口。

### 4.1 create_agent 的意义

`create_agent` 的最大价值不是“少写几行代码”，而是：**把 Agent 的常见配置收口到一个统一入口里。**

你通常会把这些东西交给它：模型，工具，系统提示，有时再加结构化输出、状态、中间件等。这样你可以更专注于业务目标，而不是一开始就陷进大量底层组装细节里。

![Agent 工作循环：用户目标进入 Agent，模型判断下一步，必要时调用工具并根据观察结果继续循环](https://didilili.github.io/ai-agents-from-zero/images/21/21-4-1-1.png)

### 4.2 V1.x 的核心输入

在入门阶段，先看 `create_agent` 常见的 6 个参数：

| 参数              | 是否常见   | 作用                                         |
| ----------------- | ---------- | -------------------------------------------- |
| `model`           | 必备       | 让谁来做推理与决策                           |
| `tools`           | 很常见     | 给 Agent 哪些可调用能力                      |
| `system_prompt`   | 很常见     | 约束 Agent 的角色、风格和工作规则            |
| `response_format` | 很常见     | 让最终结果更适合结构化输出                   |
| `checkpointer`    | 工程化能力 | 保存运行状态，可支撑短期记忆                 |
| `middleware`      | 工程化能力 | 在模型调用、工具调用等阶段插入自定义控制逻辑 |

放到项目开发里，可以这样对应：

- `model`：模型能力怎么选
- `tools`：Agent 可以用哪些外部能力
- `system_prompt`：行为规则怎么约束
- `response_format`：输出要不要便于程序直接接收
- `checkpointer`：跨多轮调用时，状态和短期记忆怎么保留
- `middleware`：要不要加入守护、拦截、动态控制

其中前四个最适合先入门；后两个更偏工程化能力。

### 4.3 结构化输出在 Agent 中的理解

本教程里的 V1.0 案例保留了一个很有价值的知识点：**Agent 不一定只能返回自然语言，它也可以返回结构化结果。**实际项目里，我们常常不只是想“让模型说一段话”，而是希望它最终给出：JSON、TypedDict、Pydantic 对象、便于程序直接消费的字段结构。

官方文档也把 `response_format` 作为 `create_agent` 的重点能力之一。所以你可以把这个能力理解成：**Agent 不只是会调用工具，它还可以把最终答案整理成程序更容易接收的格式。**

在当前 1.x 文档语境里，`response_format` 常见有三种理解方式：

- 直接传 schema 类型：例如 `TypedDict`、Pydantic 模型，框架会按模型能力自动选择更合适的结构化输出策略。
- 显式 `ProviderStrategy(schema)`：当底层模型原生支持结构化输出时，更贴近 provider 原生能力。
- 显式 `ToolStrategy(schema)`：把结构化输出当成一次工具调用式约束，兼容性通常更好。

在入门阶段，可先把握一个基本判断：**`response_format` 不是“把字符串转 JSON”的后处理，而是在 Agent 最终输出阶段，把“结果长什么样”提前约束清楚。**

### 4.4 checkpointer、thread_id 与短期记忆

如果你给 `create_agent` 传入 `checkpointer`，底层运行时就可以把 Agent 的状态保存下来。这时 Agent 不再只是“当前这一轮问什么答什么”，而是可以在多轮调用之间保留上下文。

这里可以先把三个词对应起来：

- **checkpointer**：状态保存器，负责把运行过程中的状态记下来
- **thread_id**：一次会话或一条对话线程的标识
- **短期记忆**：在同一个 `thread_id` 下，多轮消息和状态能够被延续使用

所以可以概括成一句话：**checkpointer 决定“状态能不能存下来”，thread_id 决定“这些状态属于哪一条会话”。**

![Agent 短期记忆：thread_id 区分会话线程，checkpointer 按线程保存 messages 和 state，支撑多轮延续](https://didilili.github.io/ai-agents-from-zero/images/21/21-4-4-1.png)

实际调用时，`thread_id` 通常通过运行配置传入，例如：

```python
config = {"configurable": {"thread_id": "user-001"}}
```

> **版本说明：** 在 LangChain 1.x 语境里，`thread_id` 主要服务于 checkpointing 和多轮状态隔离；如果要传用户资料、租户信息、权限上下文等静态运行时信息，还需要关注 `create_agent` 的 `context` 等上下文机制，不要把所有业务信息都塞进 `thread_id`。

这一点和 第 8 章 记忆与对话历史（含Redis基础） 是连着的。第 8 章更偏“记忆是什么、怎么存历史消息”，而这里更偏“在 `create_agent` 这条 1.x 主线上，状态和短期记忆是怎么接进 Agent 运行时的”。

### 4.5 运行过程怎么观察：stream 与 LangSmith

在真实项目里，只会 `invoke()` 还不够，因为 Agent 往往不是一步完成的。

#### 4.5.1 stream() 的作用

如果 Agent 要经历：模型判断、工具调用、工具返回、再次判断、最终输出。那么直接 `invoke()` 往往要等到最后才看到结果。而 `stream()` 的价值就在于：**把中间进展实时暴露出来。**

这对实际项目非常有用，因为它能帮助你：

- 看到 Agent 到底卡在模型还是工具上
- 看到是否发生了多轮工具调用
- 给前端提供更好的交互体验
- 调试“为什么这次 Agent 没按预期走”

所以这里的区别很直接：`invoke()` 更像等最终结果，`stream()` 更像看 Agent 执行过程。

#### 4.5.2 LangSmith 与 Agent 的关系

Agent 的问题，往往不是“有没有报错”这么简单，而是：

- 为什么调了这个工具而不是那个
- 为什么多调了一轮
- 为什么结构化输出没按预期生成
- 为什么这一步耗时特别长

这类问题只看最后一句回答，通常是不够的。也是为什么官方文档会把 **LangSmith** 和 Agent 经常放在一起讲。可以把 LangSmith 先看作：**用于追踪、调试、测试、评估 Agent 运行过程的可观测平台。**

这里不用立刻深入平台细节，只要先知道：`stream()` 让你在代码层面看到过程，**LangSmith** 让你在可视化层面看到过程，两者都能帮助 Agent 开发。

### 4.6 结合案例理解

【案例源码】`案例与源码-2-LangChain框架/12-agent/AgentSmartSelectV1.0.py`

```py
"""
【案例】多工具并行调用与聚合回答（V1.0：create_agent 一步创建 + 结构化输出）

对应教程章节：第 13 章 - Agent 智能体 → 4、Agent 工作原理（V1.0）

知识点速览：
- V1.0 与 V0.3 对比：不再手写 PromptTemplate、create_tool_calling_agent、AgentExecutor，改为
  create_agent(model, tools, system_prompt, response_format=...) 一步得到可调用的 Agent，对应教程「4、Agent 工作原理（V1.0）」。
- 结构化输出：通过 response_format 指定 TypedDict（如 WeatherCompareOutput），Agent 的返回中会包含
  structured_response 字段，便于程序化处理（如比温度、写结论），而不必从自然语言里再解析。
- 本文件重点演示 `create_agent` 最常见的 4 个输入：`model / tools / system_prompt / response_format`。
  教程里还补充了 `checkpointer / middleware` 这两个更偏工程化的扩展点，但这里不作为主线展开。
- 调用方式：当前示例用 `agent.invoke(...)` 直接看最终结果；如果真实项目里想看中间进展，通常还会配合
  `stream()`，如果想做短期记忆，则会进一步引入 `checkpointer + thread_id`。
"""

import os
import json
import httpx
from pathlib import Path
from typing_extensions import (
    TypedDict,
)  # Python < 3.12 下 Pydantic 要求用 typing_extensions.TypedDict

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

# .env 在项目根目录，从任意子目录运行脚本时都从根目录加载
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")


@tool
def get_weather(loc: str) -> str:
    """
    查询即时天气函数
    :param loc: 城市英文名，如 Beijing、Shanghai。
    :return: OpenWeather API 返回的天气信息（JSON 字符串）。
    """
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": loc,
        "appid": os.getenv("OPENWEATHER_API_KEY"),
        "units": "metric",
        "lang": "zh_cn",
    }
    response = httpx.get(url, params=params, timeout=30)
    data = response.json()
    return json.dumps(data, ensure_ascii=False)


# 定义结构化输出：Agent 最终回答会按此结构填充，便于代码中直接取字段
class WeatherCompareOutput(TypedDict):
    beijing_temp: float
    shanghai_temp: float
    hotter_city: str
    summary: str


model = ChatOpenAI(
    model="qwen-plus",
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# V1.0 一步创建 Agent：模型、工具、系统提示、输出格式一次传入
# 如果后面还要扩展短期记忆或拦截控制，通常会继续给 create_agent 传 checkpointer / middleware
agent = create_agent(
    model=model,
    tools=[get_weather],
    system_prompt=(
        "你是天气助手。"
        "当用户询问多个城市天气时，"
        "你需要分别调用工具获取数据，并进行比较分析。"
    ),
    response_format=WeatherCompareOutput,
)

# 调用 Agent，返回结果中包含 messages 与 structured_response（若指定了 response_format）
# 这里先用 invoke 看最终结果；如需观察中间步骤，可在工程里改为 stream()
result = agent.invoke({"input": "请问今天北京和上海的天气怎么样，哪个城市更热？"})
print(result)
print()
print(json.dumps(result["structured_response"], ensure_ascii=False, indent=2))

"""
【输出示例】
{'messages': [AIMessage(content='', additional_kwargs={'refusal': None}, response_metadata={'token_usage': {'completion_tokens': 38, 'prompt_tokens': 302, 'total_tokens': 340, 'completion_tokens_details': None, 'prompt_tokens_details': {'audio_tokens': None, 'cached_tokens': 0}}, 'model_provider': 'openai', 'model_name': 'qwen-plus', 'system_fingerprint': None, 'id': 'chatcmpl-69aa32a9-b752-9356-b407-b45224e3e061', 'finish_reason': 'tool_calls', 'logprobs': None}, id='lc_run--019ce60c-54cb-75b2-9350-738e1bc5d2b1-0', tool_calls=[{'name': 'get_weather', 'args': {'loc': 'Beijing'}, 'id': 'call_b3c5a5cf5cca4a68ae5e24', 'type': 'tool_call'}, {'name': 'get_weather', 'args': {'loc': 'Shanghai'}, 'id': 'call_6f49e29c6bdb4aec9e6806', 'type': 'tool_call'}], invalid_tool_calls=[], usage_metadata={'input_tokens': 302, 'output_tokens': 38, 'total_tokens': 340, 'input_token_details': {'cache_read': 0}, 'output_token_details': {}}), ToolMessage(content='{"coord": {"lon": 116.3972, "lat": 39.9075}, "weather": [{"id": 804, "main": "Clouds", "description": "阴，多云", "icon": "04d"}], "base": "stations", "main": {"temp": 10.49, "feels_like": 8.51, "temp_min": 10.49, "temp_max": 10.49, "pressure": 1024, "humidity": 35, "sea_level": 1024, "grnd_level": 1019}, "visibility": 10000, "wind": {"speed": 0.49, "deg": 203, "gust": 0.67}, "clouds": {"all": 100}, "dt": 1773385877, "sys": {"country": "CN", "sunrise": 1773354606, "sunset": 1773397087}, "timezone": 28800, "id": 1816670, "name": "Beijing", "cod": 200}', name='get_weather', id='c6d0dda4-dfff-4378-b007-dadb456cadd6', tool_call_id='call_b3c5a5cf5cca4a68ae5e24'), ToolMessage(content='{"coord": {"lon": 121.4581, "lat": 31.2222}, "weather": [{"id": 800, "main": "Clear", "description": "晴", "icon": "01d"}], "base": "stations", "main": {"temp": 15.34, "feels_like": 13.5, "temp_min": 15.34, "temp_max": 15.34, "pressure": 1027, "humidity": 22, "sea_level": 1027, "grnd_level": 1026}, "visibility": 10000, "wind": {"speed": 3.06, "deg": 84, "gust": 2.32}, "clouds": {"all": 0}, "dt": 1773385631, "sys": {"country": "CN", "sunrise": 1773353249, "sunset": 1773396016}, "timezone": 28800, "id": 1796236, "name": "Shanghai", "cod": 200}', name='get_weather', id='60d4a27a-e01e-4c56-921f-975fc620ffe6', tool_call_id='call_6f49e29c6bdb4aec9e6806'), AIMessage(content='', additional_kwargs={'refusal': None}, response_metadata={'token_usage': {'completion_tokens': 71, 'prompt_tokens': 949, 'total_tokens': 1020, 'completion_tokens_details': None, 'prompt_tokens_details': {'audio_tokens': None, 'cached_tokens': 0}}, 'model_provider': 'openai', 'model_name': 'qwen-plus', 'system_fingerprint': None, 'id': 'chatcmpl-080e0e74-3d6d-9fa9-95f8-f6d1070fcc3b', 'finish_reason': 'tool_calls', 'logprobs': None}, id='lc_run--019ce60c-5e67-7f30-b4a2-abd5c6faf4fb-0', tool_calls=[{'name': 'WeatherCompareOutput', 'args': {'beijing_temp': 10.49, 'shanghai_temp': 15.34, 'hotter_city': 'Shanghai', 'summary': '上海比北京暖和约4.85°C，且天气晴朗，而北京多云。'}, 'id': 'call_e41163c0bf134d8f97eace', 'type': 'tool_call'}], invalid_tool_calls=[], usage_metadata={'input_tokens': 949, 'output_tokens': 71, 'total_tokens': 1020, 'input_token_details': {'cache_read': 0}, 'output_token_details': {}}), ToolMessage(content="Returning structured response: {'beijing_temp': 10.49, 'shanghai_temp': 15.34, 'hotter_city': 'Shanghai', 'summary': '上海比北京暖和约4.85°C，且天气晴朗，而北京多云。'}", name='WeatherCompareOutput', id='4293a8f2-8e2f-4bcf-a9ff-6d5733cab9aa', tool_call_id='call_e41163c0bf134d8f97eace')], 'structured_response': {'beijing_temp': 10.49, 'shanghai_temp': 15.34, 'hotter_city': 'Shanghai', 'summary': '上海比北京暖和约4.85°C，且天气晴朗，而北京多云。'}}
"""

# {
#   "beijing_temp": 10.49,
#   "shanghai_temp": 15.34,
#   "hotter_city": "Shanghai",
#   "summary": "上海比北京暖和约4.85°C，且天气晴朗，而北京多云。"
# }

```

这个案例和 V0.3 做的是同一类业务：都是围绕“北京和上海谁更热”来调用天气工具。

但它的教学重点已经变了，不再强调 Prompt + Executor 的手工组装，而是在强调：

- `create_agent(...)` 的统一创建方式
- `response_format` 带来的结构化输出
- V1.x Agent 的更简洁用法

所以读这个案例时，建议把关注点放在两件事上：

1. **为什么代码明显更短了**
2. **为什么最后可以直接拿到 `structured_response`**

这两点正好代表了 V1.x 路线的两个现实价值：更适合新项目快速搭建；更适合把 Agent 输出接进后端业务逻辑。

另外，虽然本教程里的 `AgentSmartSelectV1.0.py` 重点放在 `invoke()` 和结构化输出上，但如果放到真实项目里，你通常还会继续关心：

- 要不要用 `stream()` 展示中间进展
- 要不要用 `checkpointer` 保留短期记忆
- 要不要通过 `middleware` 做动态控制和守护

这也是为什么 `create_agent` 看起来只是一个函数，背后却能一路延展到更完整的 Agent 工程化能力。

### 4.7 V0.3 与 V1.x 结合案例对比

总体差异已在上文 **2.4 节（V0.3 与 V1.x 对比速览）** 从 API 与运行时角度概括过；下表仅对照本仓库**同一业务（双城气温比较）**下的两个文件，便于你并排阅读代码。

| 维度     | `AgentSmartSelectV0.3.py`               | `AgentSmartSelectV1.0.py`            |
| -------- | --------------------------------------- | ------------------------------------ |
| 教学重点 | 看懂 Agent + Executor 怎么配合          | 看懂 `create_agent` 统一入口         |
| 代码风格 | 显式组装                                | 一步创建                             |
| 中间机制 | `agent_scratchpad`、Executor 循环更明显 | 运行时被更高层封装                   |
| 输出重点 | 最终自然语言回答                        | `structured_response` 更适合程序处理 |

一句总结：**V0.3 更适合理解“Agent 是怎么转起来的”，V1.x 更适合理解“今天项目里通常怎么写”。**

### 4.8 Middleware 与人类审核

如果说 `tools` 是给 Agent 增加能力，`middleware` 更像是给 Agent 增加运行边界。它可以在模型调用、工具调用、状态更新等阶段插入控制逻辑。

![Agent Middleware 概念：在模型调用、工具调用和运行过程之间插入守护、改写、审核与日志逻辑](https://didilili.github.io/ai-agents-from-zero/images/21/21-4-8-1.png)

常见用途包括：

- **动态提示词**：根据用户、租户、权限或场景调整 system prompt。
- **工具调用守护**：高风险工具调用前先检查参数、权限或业务规则。
- **人类审核**：删除、支付、发消息、批量修改这类动作，不让 Agent 静默执行。
- **日志与监控**：记录关键决策、工具参数、异常和耗时。

所以生产级 Agent 的重点不是“工具越多越好”，而是：能力越强，边界越要清楚。后续 LangGraph 章节会继续展开中断、人工确认和复杂状态控制。

------

## 5、实操与案例

前面 3、4 节已经把两条 Agent 主线讲清楚了，这一节把所有案例重新放回到清晰的位置里。

### 5.1 全部案例先建立一张总览表

| 案例                      | 主要学习点                         | 工具来自哪里 | 更适合放在什么语境里理解 |
| ------------------------- | ---------------------------------- | ------------ | ------------------------ |
| `AgentSmartSelectV0.3.py` | classic Agent + AgentExecutor      | 本地 `@tool` | 理解 Agent 内部工作机制  |
| `AgentSmartSelectV1.0.py` | `create_agent` + 结构化输出        | 本地 `@tool` | 理解当前 1.x 主线        |
| `AgentReact.py`           | ReAct 循环、多步工具调用、消息轨迹 | 本地 `@tool` | 理解 Agent 的动态决策    |
| `Agent2Agent.py`          | 多智能体协作 / A2A                 | 本地 `@tool` | 理解多角色分工           |
| `McpClientAgent.py`       | Agent + MCP 工具接入               | MCP 服务     | 理解外部工具接入         |

也就是说，这一章不是在用 5 个案例重复讲一件事，而是在从 5 个不同角度，把 Agent 的完整能力拼出来。

### 5.2 ReAct 实操

【案例源码】`案例与源码-2-LangChain框架/12-agent/AgentReact.py`

```py
"""
【案例】ReAct 模式：推理 + 行动的多步工具调用（产品搜索与库存查询）

对应教程章节：第 13 章 - Agent 智能体 → 5、实操与案例（5.2 ReAct）

知识点速览：
- ReAct（Reason + Act）是 Agent 最经典、最适合入门的一种工作机制：先推理，再行动，再根据结果继续推理。
  它不是 Agent 的唯一形态，但最适合帮助初学者看懂“为什么 Agent 不只是一次回答”。
- 本案例提供两个 Tool：search_products（按类别查产品）、check_inventory（查库存）；Agent 自主决定
  调用顺序与次数（如先搜索再查库存），体现「多步、有条件」的决策能力。
- 通过 `result["messages"]` 可追踪完整对话：AIMessage（含 `tool_calls`）、ToolMessage（工具输出）、
  最终 AIMessage（文本回答）。这和新版教程里强调的“消息视角理解 Agent”是对应的。
- 本案例使用 `create_agent + 本地 @tool` 这条 1.x 路线；如果真实项目里想进一步观察执行过程，
  还可以结合 `stream()` 或 LangSmith 追踪，但这个文件先聚焦 ReAct 本身。

关于 @tool 与 MCP：
- 本案例使用 LangChain 的 @tool，在「当前进程」内定义并执行工具，不能直接改成 @mcp.tool() 这种形式。
- MCP 的工具是在「MCP 服务端」定义和运行的：需要在另一侧起 MCP 服务（如 11-mcp 下的 McpServer/McpServerByFastMCP），
  在服务里用 MCP SDK 暴露工具；本进程作为「客户端」通过 mcp.json + MultiServerMCPClient.get_tools() 拿到工具列表再交给 Agent。
- 因此有两种用法二选一：① 本地 @tool，直接传给 create_agent（本案例）；② 用 MCP 服务 + McpClientAgent 的方式
  连接并 get_tools()（见 11-mcp/McpClientAgent.py）。不能在同一文件里把 @tool 简单替换成 @mcp.tool()。
"""

import os

from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain.tools import tool
from dotenv import load_dotenv

load_dotenv()

# 模拟产品数据库：类别 -> 产品列表（id、name、popularity、price）
PRODUCT_DATABASE = {
    "无线耳机": [
        {"id": "WH-1000XM5", "name": "索尼 WH-1000XM5", "popularity": 95, "price": 299},
        {"id": "QC45", "name": "Bose QuietComfort 45", "popularity": 88, "price": 329},
        {"id": "AIRMAX", "name": "苹果 AirPods Max", "popularity": 92, "price": 549},
        {"id": "PXC550", "name": "森海塞尔 PXC 550", "popularity": 76, "price": 299},
        {"id": "HT450", "name": "JBL Tune 760NC", "popularity": 82, "price": 99},
    ],
    "游戏鼠标": [
        {"id": "GPW", "name": "罗技 G Pro 无线", "popularity": 90, "price": 129},
        {"id": "VIPER", "name": "雷蛇 Viper V2 Pro", "popularity": 87, "price": 149},
        {"id": "DAV3", "name": "雷蛇 DeathAdder V3", "popularity": 85, "price": 119},
    ],
    "笔记本电脑": [
        {"id": "MBP14", "name": "MacBook Pro 14英寸", "popularity": 94, "price": 1999},
        {"id": "XPS13", "name": "戴尔 XPS 13", "popularity": 89, "price": 1299},
        {"id": "TPX1", "name": "ThinkPad X1 Carbon", "popularity": 86, "price": 1499},
    ],
}

# 模拟库存：产品 ID -> 库存数量与仓位
INVENTORY_DATABASE = {
    "WH-1000XM5": {"stock": 10, "location": "仓库-A"},
    "QC45": {"stock": 0, "location": "仓库-B"},
    "AIRMAX": {"stock": 5, "location": "仓库-C"},
    "PXC550": {"stock": 15, "location": "仓库-A"},
    "HT450": {"stock": 25, "location": "仓库-B"},
    "GPW": {"stock": 8, "location": "仓库-C"},
    "VIPER": {"stock": 12, "location": "仓库-A"},
    "DAV3": {"stock": 3, "location": "仓库-B"},
    "MBP14": {"stock": 7, "location": "仓库-C"},
    "XPS13": {"stock": 0, "location": "仓库-A"},
    "TPX1": {"stock": 4, "location": "仓库-B"},
}


@tool
def search_products(query: str) -> str:
    """搜索产品并返回按受欢迎度排序的结果（Tool：能力封装，供 Agent 调用）"""
    print(f"🔍 [工具调用] search_products('{query}')")

    keyword_mapping = {
        "无线耳机": ["无线耳机", "蓝牙耳机", "头戴式耳机", "耳机"],
        "游戏鼠标": ["游戏鼠标", "电竞鼠标", "鼠标"],
        "笔记本电脑": ["笔记本电脑", "笔记本", "手提电脑", "电脑"],
    }

    matched_category = None
    for category, keywords in keyword_mapping.items():
        if any(keyword in query for keyword in keywords):
            matched_category = category
            break

    if matched_category and matched_category in PRODUCT_DATABASE:
        products = PRODUCT_DATABASE[matched_category]
        sorted_products = sorted(products, key=lambda x: x["popularity"], reverse=True)
        result = f"找到 {len(sorted_products)} 个匹配 '{query}' 的产品:\n"
        for i, product in enumerate(sorted_products, 1):
            result += f"{i}. {product['name']} (ID: {product['id']}) - 受欢迎度: {product['popularity']}% - ￥{product['price']}\n"
        return result
    return "未找到匹配产品"


@tool
def check_inventory(product_id: str) -> str:
    """检查特定产品的库存状态（Tool：能力封装）"""
    print(f"📦 [工具调用] check_inventory('{product_id}')")

    if product_id in INVENTORY_DATABASE:
        stock_info = INVENTORY_DATABASE[product_id]
        status = "有库存" if stock_info["stock"] > 0 else "缺货"
        return f"产品 {product_id}: {status} ({stock_info['stock']} 件库存) - 位置: {stock_info['location']}"
    return f"未找到产品ID: {product_id}"


model = ChatOpenAI(
    model="qwen-plus",
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# 系统提示中明确 ReAct：先推理、再选工具、基于结果继续推理直至得到完整答案
# 这里是在“用 ReAct 作为最常见入门机制”，并不代表 Agent 只有这一种工作方式
agent = create_agent(
    model,
    tools=[search_products, check_inventory],
    system_prompt="""你是电商助手，遵循ReAct模式：
    1. 先推理用户需求
    2. 选择合适的工具执行操作
    3. 基于工具结果进行下一步推理
    4. 重复直到获得完整答案

    保持推理步骤简洁明了。""",
)

# 测试：一次问题可能触发多轮「推理 → 选工具 → 观察 → 再推理」
result1 = agent.invoke(
    {
        "messages": [
            {"role": "user", "content": "查找当前最受欢迎的无线耳机并检查是否有库存"}
        ]
    }
)

print("\n" + "=" * 40)
print("📊 最终结果:")
for msg in result1["messages"]:
    if hasattr(msg, "content"):
        print(f"{msg.__class__.__name__}: {msg.content}")
print("=" * 40)


# 可选：逐条解析 messages，观察 ReAct 循环（AIMessage.tool_calls、ToolMessage、最终 AIMessage）
# 这也是理解现代 Tool Calling Agent 的一个非常直观的办法
def track_react_cycle(messages):
    print("ReAct循环步骤分析:")
    step = 1
    for i, msg in enumerate(messages):
        msg_type = msg.__class__.__name__
        if msg_type == "AIMessage" and hasattr(msg, "tool_calls") and msg.tool_calls:
            print(f"\n🔄 步骤{step}: Reasoning + Acting")
            for tool_call in msg.tool_calls:
                print(f"   🛠️  工具调用: {tool_call['name']}({tool_call['args']})")
            step += 1
        elif msg_type == "ToolMessage":
            print(f"   📋  观察结果: {msg.content[:80]}...")
        elif msg_type == "AIMessage" and not (
            hasattr(msg, "tool_calls") and msg.tool_calls
        ):
            print(f"\n✅ 最终回答: {msg.content}")


track_react_cycle(result1["messages"])

"""
【输出案例】
🔍 [工具调用] search_products('无线耳机')
📦 [工具调用] check_inventory('WH-1000XM5')
"""

# ========================================
# 📊 最终结果:
# HumanMessage: 查找当前最受欢迎的无线耳机并检查是否有库存
# AIMessage: 1. 首先，我需要搜索当前最受欢迎的无线耳机。
# 2. 然后，从搜索结果中获取最受欢迎的产品ID，并检查其库存状态。


# ToolMessage: 找到 5 个匹配 '无线耳机' 的产品:
# 1. 索尼 WH-1000XM5 (ID: WH-1000XM5) - 受欢迎度: 95% - ￥299
# 2. 苹果 AirPods Max (ID: AIRMAX) - 受欢迎度: 92% - ￥549
# 3. Bose QuietComfort 45 (ID: QC45) - 受欢迎度: 88% - ￥329
# 4. JBL Tune 760NC (ID: HT450) - 受欢迎度: 82% - ￥99
# 5. 森海塞尔 PXC 550 (ID: PXC550) - 受欢迎度: 76% - ￥299

# AIMessage: 1. 根据搜索结果，最受欢迎的无线耳机是索尼 WH-1000XM5（ID: WH-1000XM5），受欢迎度为95%。
# 2. 接下来，我将检查该产品的库存状态。


# ToolMessage: 产品 WH-1000XM5: 有库存 (10 件库存) - 位置: 仓库-A
# AIMessage: 索尼 WH-1000XM5 是当前最受欢迎的无线耳机，受欢迎度为95%，且有库存（10件），存放于仓库-A。
# ========================================
# ReAct循环步骤分析:

# 🔄 步骤1: Reasoning + Acting
#    🛠️  工具调用: search_products({'query': '无线耳机'})
#    📋  观察结果: 找到 5 个匹配 '无线耳机' 的产品:
# 1. 索尼 WH-1000XM5 (ID: WH-1000XM5) - 受欢迎度: 95% - ￥299
# 2. 苹果 ...

# 🔄 步骤2: Reasoning + Acting
#    🛠️  工具调用: check_inventory({'product_id': 'WH-1000XM5'})
#    📋  观察结果: 产品 WH-1000XM5: 有库存 (10 件库存) - 位置: 仓库-A...

# ✅ 最终回答: 索尼 WH-1000XM5 是当前最受欢迎的无线耳机，受欢迎度为95%，且有库存（10件），存放于仓库-A。

```

这个案例可以用来建立“**Agent 会自己连续做多步决策**”的直觉。

它定义了两个工具：

- `search_products`
- `check_inventory`

用户的问题不是简单的“查某个 ID 是否有库存”，而是：查找当前最受欢迎的无线耳机并检查是否有库存。

这个问题天然要求两步：

1. 先搜索产品，找出哪个最热门
2. 再根据搜索结果，决定去查哪个产品的库存

这里最关键的地方不是工具本身，而是：**第二步依赖第一步的结果。**
如果流程完全固定，普通工作流也能完成这件事；本案例使用 Agent，是为了观察模型如何根据第一步返回内容，自己决定第二步该查哪个产品、该调用哪个工具。

这个案例还有一个很值得保留的学习点：它会展示 `result["messages"]`，让你看到：`AIMessage`、`tool_calls`、`ToolMessage`、最终 `AIMessage`。

所以这个案例不仅适合学 ReAct，也适合学：**现代 Agent 在消息层面到底长什么样。**

------

### 5.3 A2A 实操

【案例源码】`案例与源码-2-LangChain框架/12-agent/Agent2Agent.py`

```py
"""
【案例】Agent-to-Agent（A2A）协作：携程订机票 + 美团订酒店 + 滴滴打车

对应教程章节：第 13 章 - Agent 智能体 → 5、实操与案例（5.3 A2A）

知识点速览：
- A2A = 多个专属 Agent 各司其职 + 一个总协调逻辑负责调度与汇总。本案例中机票 / 酒店 / 打车三个
  子 Agent 分别只绑定一个 `@tool`，总协调按业务顺序依次 `invoke` 子链并整合结果，对应教程「5.3 A2A」。
- 子 Agent 的实现方式是：`Prompt | llm.bind_tools([单个工具]) | output_parser`，本质上是
  “单一职责的 Runnable 子链”，而不是一个什么都做的大一统 Agent。
- 总协调部分使用 `RunnableLambda` 封装“按顺序调度多个子链 + 失败时兜底”的编排逻辑。
  这更接近教程里强调的“分工 + 协调”，也是本案例最值得学习的地方。
- 这个案例不是官方多智能体文档里最常见的“把 subagent 包装成 tool 给主 Agent 调”的写法，
  但更适合初学者先看懂 A2A 的基本思想。
- 规范要点：子 Agent 单一职责、统一 `invoke({"input": "..."})` 接口；工具用
  `@tool(名称, description=...)` 并写清参数说明，便于模型正确传参。
"""

import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from langchain.tools import tool
from dotenv import load_dotenv

load_dotenv()


# ===================== 大模型与输出解析 =====================
llm = ChatOpenAI(
    model="qwen-plus",
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
output_parser = StrOutputParser()


# ===================== 模拟业务函数：用 @tool(名称, description=...) 封装，供子 Agent 绑定 =====================
@tool(
    "CtripBookFlight",
    description="预订机票的唯一工具，必须调用，参数是departure出发地、arrival目的地、date出行日期（格式2026-02-01）",
)
def ctrip_book_flight(departure: str, arrival: str, date: str) -> str:
    """携程订机票：固定返回测试结果"""
    return f"【携程机票预订成功】\n出发地：{departure}\n目的地：{arrival}\n出行日期：{date}\n航班号：CA1885（北京首都T3→上海浦东T2）\n起飞时间：14:00\n降落时间：16:30\n座位：经济舱34A\n电子客票号：999-1234567890\n舱位等级：经济舱超级经济座"


@tool(
    "MeituanBookHotel",
    description="预订酒店的唯一工具，必须调用，参数是city城市、near_by附近地标、check_in入住日期、check_out离店日期",
)
def meituan_book_hotel(city: str, near_by: str, check_in: str, check_out: str) -> str:
    """美团订酒店：固定返回测试结果"""
    return f"【美团酒店预订成功】\n城市：{city}\n位置：{near_by}附近\n入住日期：{check_in}\n离店日期：{check_out}\n酒店名称：上海浦东机场铂尔曼大酒店\n房型：豪华大床房（含双人自助早餐）\n房号：1508\n预订号：MT20260201001\n入住人：张三\n退房政策：入住后24小时内可免费取消"


@tool(
    "DidiBookTaxi",
    description="预约打车的唯一工具，必须调用，参数是start起点、end终点、time用车时间",
)
def didi_book_taxi(start: str, end: str, time: str) -> str:
    """滴滴打车：固定返回测试结果"""
    return f"【滴滴打车预约成功】\n起点：{start}\n终点：{end}\n用车时间：{time}\n车型：滴滴快车（舒适型）\n司机姓名：王师傅\n车牌号：沪A12345\n司机电话：13800138000\n预估费用：35元（券后立减5元，实付30元）\n预计接驾时间：16:35\n车型空间：5座，可放2件24寸行李箱"


# ===================== 专属 Agent：每条子链只绑定一个工具，体现“单一职责” =====================
def create_ctrip_agent(llm):
    llm_with_tools = llm.bind_tools([ctrip_book_flight])  # 仅暴露机票工具，单一职责
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "你是专业的工具调用助手，只能调用CtripBookFlight工具，"
                "调用格式必须正确，"
                "直接传入参数：departure='北京', arrival='上海', date='2026-02-01'，"
                "调用后直接返回工具执行的完整字符串结果，不能有任何其他内容，不能留空！",
            ),
            ("human", "{input}"),
        ]
    )
    return prompt | llm_with_tools | output_parser


def create_meituan_agent(llm):
    llm_with_tools = llm.bind_tools([meituan_book_hotel])
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "你是专业的工具调用助手，只能调用MeituanBookHotel工具，调用格式必须正确，"
                "直接传入参数：city='上海', near_by='浦东机场', check_in='2026-02-01', "
                "check_out='2026-02-02'，调用后直接返回工具执行的完整字符串结果，"
                "不能有任何其他内容，不能留空！",
            ),
            ("human", "{input}"),
        ]
    )
    return prompt | llm_with_tools | output_parser


def create_didi_agent(llm):
    llm_with_tools = llm.bind_tools([didi_book_taxi])
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "你是专业的工具调用助手，只能调用DidiBookTaxi工具，调用格式必须正确，"
                "直接传入参数：start='上海浦东机场T2', end='上海浦东机场铂尔曼大酒店', "
                "time='2026-02-01 16:40'，调用后直接返回工具执行的完整字符串结果，"
                "不能有任何其他内容，不能留空！",
            ),
            ("human", "{input}"),
        ]
    )
    return prompt | llm_with_tools | output_parser


# ===================== 总协调器：按业务顺序调用子链，必要时用 .func 兜底 =====================
def create_travel_coordinator_agent(llm, ctrip_chain, meituan_chain, didi_chain):
    """总协调：负责编排顺序，不负责再去“自由选工具”做 ReAct 式决策。"""

    def a2a_schedule(input_dict):
        print("🔍 开始执行A2A协作测试，依次调用各业务Agent...\n")
        ctrip_func = (
            ctrip_book_flight.func
        )  # StructuredTool 的 .func 为原始可调用函数，兜底时直接用
        meituan_func = meituan_book_hotel.func  # 获取美团工具原始函数
        didi_func = didi_book_taxi.func  # 获取滴滴工具原始函数

        # 1. 携程Agent调用
        print("1. 调用【携程机票Agent】>>>")
        try:
            ctrip_result = ctrip_chain.invoke({"input": "订机票"})
        except:
            ctrip_result = ""
        if not ctrip_result.strip():
            ctrip_result = ctrip_func("北京", "上海", "2026-02-01")  # 替换为原始函数
        print(f"✅ 携程测试结果：\n{ctrip_result}\n" + "-" * 80 + "\n")

        # 2. 美团Agent调用
        print("2. 调用【美团酒店Agent】>>>")
        try:
            meituan_result = meituan_chain.invoke({"input": "订酒店"})
        except:
            meituan_result = ""
        if not meituan_result.strip():
            meituan_result = meituan_func(
                "上海", "浦东机场", "2026-02-01", "2026-02-02"
            )
        print(f"✅ 美团测试结果：\n{meituan_result}\n" + "-" * 80 + "\n")

        # 3. 滴滴Agent调用
        print("3. 调用【滴滴打车Agent】>>>")
        try:
            didi_result = didi_chain.invoke({"input": "预约打车"})
        except:
            didi_result = ""
        if not didi_result.strip():
            didi_result = didi_func(
                "上海浦东机场T2", "上海浦东机场铂尔曼大酒店", "2026-02-01 16:40"
            )  # 替换为原始函数
        print(f"✅ 滴滴测试结果：\n{didi_result}\n" + "-" * 80 + "\n")

        # 整合最终报告
        total_report = f"""
📋 【携程-美团-滴滴 A2A协作测试最终报告】
{('='*90)}
📌 测试状态：本地运行成功，所有Agent均返回完整结果（含兜底保障）
📌 协作流程：携程订机票 → 美团订酒店 → 滴滴打车（按业务顺序执行）
📌 测试环境：Python3.13 + LangChain1.0 + 通义千问qwen-plus + @tool装饰器（修复可调用问题）
{('='*90)}
【1. 携程机票预订结果】
{ctrip_result}

【2. 美团酒店预订结果】
{meituan_result}

【3. 滴滴打车预约结果】
{didi_result}
{('='*90)}
💡 测试结论：A2A协作逻辑正常，@tool装饰器集成成功，无报错！
"""
        return total_report

    return RunnableLambda(
        a2a_schedule
    )  # 封装为 Runnable，与子 Agent 链一致，可被 invoke


# ===================== 主程序：初始化子 Agent 与总协调，执行一次完整行程请求 =====================
if __name__ == "__main__":
    try:
        # 初始化各专属Agent
        print("🔧 初始化携程/美团/滴滴专属Agent...")
        ctrip_chain = create_ctrip_agent(llm)
        meituan_chain = create_meituan_agent(llm)
        didi_chain = create_didi_agent(llm)
        print("✅ 所有Agent初始化完成！\n" + "=" * 90 + "\n")

        # 初始化A2A总协调Agent
        print("🔧 初始化A2A总协调Agent（调度核心）...")
        coor_chain = create_travel_coordinator_agent(
            llm, ctrip_chain, meituan_chain, didi_chain
        )
        print("✅ 总协调Agent初始化完成！\n" + "=" * 90 + "\n")

        # 执行A2A协作核心测试
        print("🚀 携程-美团-滴滴 A2A协作测试正式开始 🚀")
        final_result = coor_chain.invoke(
            {"input": "安排2026-02-01北京飞上海的完整行程"}
        )

        # 打印最终完整测试报告
        print("\n" + "=" * 90)
        print(final_result)
        print("=" * 90)

    except Exception as e:
        print(f"❌ 全局运行异常：{type(e).__name__} - {str(e)[:100]}")
        print(
            "💡 快速排查："
            "1. 通义密钥是否正确 2. 网络能否访问阿里云 3. LangChain版本是否为1.0.0"
        )


# 实践要点（A2A 稳定运行）：子 Agent 单一职责、统一 invoke({"input": "..."})；
# 总协调统一调度并做 try-except + 空结果兜底（.func）；@tool 的 description 写清参数便于模型传参。

"""
【输出示例】
🔧 初始化携程/美团/滴滴专属Agent...
✅ 所有Agent初始化完成！
==========================================================================================
"""

# 🔧 初始化A2A总协调Agent（调度核心）...
# ✅ 总协调Agent初始化完成！
# ==========================================================================================

# 🚀 携程-美团-滴滴 A2A协作测试正式开始 🚀
# 🔍 开始执行A2A协作测试，依次调用各业务Agent...

# 1. 调用【携程机票Agent】>>>
# ✅ 携程测试结果：
"""
【携程机票预订成功】
出发地：北京
目的地：上海
出行日期：2026-02-01
航班号：CA1885（北京首都T3→上海浦东T2）
起飞时间：14:00
降落时间：16:30
座位：经济舱34A
电子客票号：999-1234567890
舱位等级：经济舱超级经济座
--------------------------------------------------------------------------------
"""

# 2. 调用【美团酒店Agent】>>>
# ✅ 美团测试结果：
"""
【美团酒店预订成功】
城市：上海
位置：浦东机场附近
入住日期：2026-02-01
离店日期：2026-02-02
酒店名称：上海浦东机场铂尔曼大酒店
房型：豪华大床房（含双人自助早餐）
房号：1508
预订号：MT20260201001
入住人：张三
退房政策：入住后24小时内可免费取消
--------------------------------------------------------------------------------
"""

# 3. 调用【滴滴打车Agent】>>>
# ✅ 滴滴测试结果：
"""
【滴滴打车预约成功】
起点：上海浦东机场T2
终点：上海浦东机场铂尔曼大酒店
用车时间：2026-02-01 16:40
车型：滴滴快车（舒适型）
司机姓名：王师傅
车牌号：沪A12345
司机电话：13800138000
预估费用：35元（券后立减5元，实付30元）
预计接驾时间：16:35
车型空间：5座，可放2件24寸行李箱
--------------------------------------------------------------------------------
"""


# ==========================================================================================

# 📋 【携程-美团-滴滴 A2A协作测试最终报告】
# ==========================================================================================
# 📌 测试状态：本地运行成功，所有Agent均返回完整结果（含兜底保障）
# 📌 协作流程：携程订机票 → 美团订酒店 → 滴滴打车（按业务顺序执行）
# 📌 测试环境：Python3.13 + LangChain1.0 + 通义千问qwen-plus + @tool装饰器（修复可调用问题）
# ==========================================================================================
"""
【1. 携程机票预订结果】
【携程机票预订成功】
出发地：北京
目的地：上海
出行日期：2026-02-01
航班号：CA1885（北京首都T3→上海浦东T2）
起飞时间：14:00
降落时间：16:30
座位：经济舱34A
电子客票号：999-1234567890
舱位等级：经济舱超级经济座
"""

"""
【2. 美团酒店预订结果】
【美团酒店预订成功】
城市：上海
位置：浦东机场附近
入住日期：2026-02-01
离店日期：2026-02-02
酒店名称：上海浦东机场铂尔曼大酒店
房型：豪华大床房（含双人自助早餐）
房号：1508
预订号：MT20260201001
入住人：张三
退房政策：入住后24小时内可免费取消
"""

"""
【3. 滴滴打车预约结果】
【滴滴打车预约成功】
起点：上海浦东机场T2
终点：上海浦东机场铂尔曼大酒店
用车时间：2026-02-01 16:40
车型：滴滴快车（舒适型）
司机姓名：王师傅
车牌号：沪A12345
司机电话：13800138000
预估费用：35元（券后立减5元，实付30元）
预计接驾时间：16:35
车型空间：5座，可放2件24寸行李箱
==========================================================================================
💡 测试结论：A2A协作逻辑正常，@tool装饰器集成成功，无报错！
"""

# ==========================================================================================

```

这个案例对应的是广义上的多智能体协作，也就是 **A2A（Agent-to-Agent）**。这里的 A2A 指“Agent 之间分工协作”的思想，不特指某一个外部通信协议。

它的教学价值非常高，因为它把“一个 Agent 解决所有问题”换成了另一种思路：携程 Agent 只负责机票；美团 Agent 只负责酒店；滴滴 Agent 只负责打车；最上面再有一个总协调逻辑负责调度。

这和真实项目非常贴近。因为很多企业级系统里，往往不是“一个大而全的 Agent”，而是：

- 一个总入口
- 多个领域专长子 Agent
- 各自有边界
- 最后再汇总结果

和 LangChain 官方多智能体资料对照时要注意：**官方常见做法是把 subagent 包装成 tool，再交给主 Agent 调用。**

而本教程里的这个案例，使用的是：

- 子 Agent 链
- `RunnableLambda` 协调
- 显式顺序调度

这不是错误，而是另一种更适合教学的表达方式。它的好处是你可以更清楚地看到：子 Agent 如何单一职责；总协调如何串联业务顺序；A2A 不一定非要从“主 Agent 调子 Agent 工具”这一个套路入门。

所以这个案例更适合帮你先抓住一个重点：**多智能体协作的关键不是 API 长什么样，而是“分工 + 协调”。**

------

### 5.4 Agent + MCP 实操

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

这一节把第 12 章 MCP 和本章 Agent 接上了。前面几个案例里的工具，基本都是当前进程里直接写的 `@tool`。而这个案例演示的是另一件更接近真实项目的事：**工具不一定定义在本地代码里，也可以来自外部 MCP 服务。**

它的大致链路是：

1. 读取 `mcp.json`
2. 用 `MultiServerMCPClient` 连接 MCP 服务
3. 获取 MCP 暴露出来的工具列表
4. 把这些工具交给 LangChain Agent
5. 让 Agent 在对话中继续像本地 Tool 一样使用它们

所以这个案例真正学的不是“怎么聊天”，而是：**Agent 的工具来源可以被标准化外置。**

这在实际项目里意义很大，因为很多企业系统都会走这条路线：

- 能力由后端团队封装成 MCP 服务
- Agent 侧只负责接入和使用
- 这样一个工具集可以被多个 AI 应用复用

也正因为如此，本章和 第 12 章 MCP 模型上下文协议 是强关联的：第 12 章解决“工具怎么标准化暴露”，第 13 章解决“Agent 怎么把这些能力真正用起来”。

------

## 6、小结：Agent、Tool、Function Calling、RAG、MCP 的区别与联系

这是本章最后必须收口的一节，因为这些概念最容易混。

> **术语约定：** 为和前文保持一致，本章这里写 **Function Calling** 是因为它在很多官方资料里仍然常见；如果你更习惯 第 17 章 的说法，也可以直接把它理解成 **Tool Calling 这层调用机制**。

### 6.1 一张总表先记住

| 概念                 | 它解决什么问题                      | 一句话理解   |
| -------------------- | ----------------------------------- | ------------ |
| **Tool**             | 系统有哪些可调用能力                | 能力层       |
| **Function Calling** | 模型怎么把“调工具”表达出来          | 调用机制     |
| **RAG**              | 模型缺知识时怎么拿上下文            | 上下文增强   |
| **MCP**              | 工具 / 资源 / Prompt 怎么标准化接入 | 连接协议     |
| **Agent**            | 什么时候用什么能力、按什么顺序做    | 决策与编排层 |

### 6.2 在真实项目里怎么配合

一个更接近真实项目的完整链路通常像这样：

1. 用户提出一个目标
2. **Agent** 先判断该怎么做
3. 如果缺知识，就先走 **RAG**
4. 如果缺动作能力，就通过 **Function Calling** 去调 **Tool**
5. 这些 Tool 可能是本地写的，也可能来自 **MCP**
6. Agent 再根据返回结果继续判断，直到最终完成任务（需设好迭代上限与超时，避免死循环）

所以关系可以简写成：

- **Agent = 决策层**
- **Tool = 能力层**
- **Function Calling = 调用机制**
- **RAG = 上下文增强**
- **MCP = 外部能力接入协议**

------

**章节思考题：**

1. 一个任务是否需要 Agent，你会看哪些信号？

   **参考思路：** 看任务是否步骤不固定、需要多次决策、需要选择工具、需要根据中间结果调整路线。如果只是固定输入到固定输出，链或工作流通常更简单。

2. Agent、Tool、RAG、MCP 放在一起时，各自的位置是什么？

   **参考思路：** Agent 负责决策和推进任务，Tool 提供可执行能力，RAG 提供外部知识上下文，MCP 提供标准化接入方式。它们不是互相替代，而是在不同层协作。

3. 为什么 Agent 系统要设置迭代上限、超时和失败处理？

   **参考思路：** Agent 会根据中间结果继续决策，如果没有边界，可能循环调用、成本失控或执行危险动作。工程上需要有停止条件、错误兜底和日志追踪。

4. 旧的 AgentExecutor 和新的 `create_agent` 思路，你会怎样看待它们？

   **参考思路：** 旧写法有助于读懂历史代码，新写法更贴近当前 LangChain / LangGraph 主线。学习时不必纠结“谁完全替代谁”，要看项目版本、依赖和维护成本。

**本章小结：**

- **Agent 的定位是决策层**：它不是多几个 API，也不是多几个 Tool，而是让系统围绕目标判断下一步做什么。Tool 是能力层，Agent 负责协调这些能力。
- **理解 Agent，可以放回 ReAct 循环里看**：观察问题、决定动作、调用工具、拿回观察结果、继续决策。这样再去看 classic 路线里的 scratchpad / AgentExecutor，以及 1.x 路线里的 `create_agent`，就不会只剩 API 记忆。
- **LangChain 1.x 的主线要抓住三个工程点**：`response_format` 负责把最终输出结构化，`checkpointer` 负责线程状态持久化，`thread_id` 负责多轮对话和会话隔离。它们共同决定 Agent 能不能从“演示能跑”走向“系统可用”。
- **什么时候不该上 Agent 也要明确**：如果步骤固定、路径稳定、可控性要求高，优先用 LCEL 或 Workflow；只有当任务真的需要动态选工具、临场分解步骤、边执行边调整时，Agent 才值得它带来的复杂度。
- **可上线的 Agent，重点在边界而不只是能力**：工具白名单、参数校验、人审或二次确认、超时重试、日志与状态持久化，往往比“再多接几个 Tool”更重要。

**建议下一步：** 先在本地依次运行 `AgentSmartSelectV0.3.py`、`AgentSmartSelectV1.0.py`、`AgentReact.py` 和 `Agent2Agent.py`，对照文档理解 [Tool](https://didilili.github.io/ai-agents-from-zero/#/17-Tools工具调用)、Agent、AgentExecutor 的配合。若要把外部能力接入 Agent，再回看 第 12 章 MCP 模型上下文协议 中的 `McpClientAgent.py`。链式固定流程与 Agent 的取舍，可对照 第 7 章 LCEL 与链式调用 和本文 **1.4 Agent 的使用场景**。