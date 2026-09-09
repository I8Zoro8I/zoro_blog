---
date: 2026年09月03日
---

# LangGraph API：图与状态

------

**本章课程目标：**

- 理解 **Graph API 里的 Graph（图）** 到底是什么，知道 `StateGraph`、`START`、`END`、`compile()`、`invoke()` 分别负责什么。
- 理解 **State（状态）** 和 **Reducer（规约函数）** 的分工，知道为什么 LangGraph 不是靠“函数之间手动传一堆参数”，而是靠“共享状态 + 按规则合并更新”来驱动工作流。
- 掌握 **TypedDict / Pydantic / dataclass** 这些 State Schema 写法、**state_schema / input_schema / output_schema** 的边界，以及 **默认覆盖、`add_messages`、`operator.add`、`operator.mul`、自定义 Reducer** 这些常见状态合并方式。
- 能运行并理解本章全部案例，为后续 第 16 章 LangGraph API：节点、边与进阶 打基础。

**学习建议：** 这章的重点不是“怎么画图”，而是状态怎么被安全地改。看每个例子时都问三句话：节点读了 State 里的什么，返回了哪些局部更新，Reducer 最后怎么合并。只要这条线顺了，`add_messages`、`operator.add`、自定义 Reducer 就不再是一堆孤立写法。

**官方文档与资源**：详见 [工具导航与参考资料索引 - LangGraph](https://i8zoro8i.github.io/zoro_blog/column/AIAgent/工具导航与参考资料索引)。

------

## 1、Graph API 之 Graph（图）

### 1.1 定义

在 LangGraph 的 **Graph API** 里，**Graph（图）** 可以看作：**由节点和有向边组成的一张可执行工作流结构图**。节点负责“这一站做什么”，边负责“这一站执行完后下一步往哪走”，`START` 和 `END` 分别表示图的入口和出口。

这里的“图”不是只画给人看的流程图，而是**真的会被编译、运行、调度的程序结构**。当你把状态、节点和边定义好，再调用 `compile()`，LangGraph 会把这个图构建器编译成一个真正可运行的应用对象；之后就可以用 `invoke(...)`、`stream(...)` 等方式执行这张图。

![有向图在工作流中的含义示意](https://didilili.github.io/ai-agents-from-zero/images/23/23-1-1-1.jpeg)

这张图可以这样看：

- **Start** 是入口，**End** 是出口。
- `node 1 ~ node 5` 是不同业务步骤，箭头表示执行方向。
- 多条箭头从 Start 发出，说明流程可以分支或并行。
- 多条路径最终汇聚到 End，说明不同路线可以收束到统一出口。

后面写 `add_edge(START, "node_a")`、`add_edge("node_a", "node_b")` 时，本质就是把这种“有向工作流结构”落到代码里。

### 1.2 为什么单独讲 Graph

上一章 已经讲过 LangGraph 四要素。这里继续讲 Graph，是为了把“图构建器、状态接口、状态合并规则”讲清楚。上一章解决“能跑起来”，本章解决“为什么这样设计更稳”。

真实项目里，Graph 这一层最容易踩坑的往往不是“节点函数怎么写”，而是下面这些问题：

- 图的入口和出口到底怎么约定？哪些节点只是内部步骤，哪些字段应该暴露给外部调用方？
- 节点之间到底共享哪一份状态？某个节点只返回了一小段更新后，框架是覆盖旧值、追加列表，还是做自定义合并？
- 当流程越来越复杂时，怎么让“控制结构本身”仍然清楚，而不是把跳转逻辑散落在一堆 Python 函数和 `if/while` 里？

本章主线可以记成一句话：**Graph 负责控制结构，State 负责数据流转，Schema 和 Reducer 负责把 State 设计清楚。**

### 1.3 构建 Graph 的 5 步

如果先不看条件边、`Send`、`Command`、`Runtime` 等进阶能力（这些在 [第 16 章](https://didilili.github.io/ai-agents-from-zero/#/24-LangGraphAPI：节点、边与进阶) 系统讲），构建一张最基础的 `StateGraph`，最核心的流程还是下面 5 步：

1. **定义 State Schema**：先说明这张图内部要维护哪些状态字段。
2. **创建 `StateGraph` 构建器**：`builder = StateGraph(MyState)`。
3. **注册节点并连接边**：`add_node(...)`、`add_edge(...)`，并用 `START` / `END` 明确入口和出口。
4. **编译图**：`graph = builder.compile()`，把构建器变成可运行对象。
5. **执行图**：`graph.invoke(initial_state)`，传入初始状态，拿到最终状态。

这里要特别注意：**节点函数通常不需要返回完整 State，只返回本节点要更新的字段即可。** 这些局部更新会按 Reducer 规则合并回全局状态。换成一句话就是：**Graph 管执行顺序，State 管共享数据，Schema 和 Reducer 管状态结构与合并规则。**

`compile()` 之后，图就不再只是“节点和边的声明”。运行时会按一轮一轮的步骤推进：这一轮哪些节点该执行，哪些更新要等到下一轮才能生效，都会由运行时根据边和状态通道来调度。

因此，多条边从同一个节点发散时，后续节点不一定是简单排队；多个节点写回同一份 State 时，也不是互相改全局变量，而是把各自的更新交给 Reducer 合并。这一点会贯穿本章后面的 State 和 Reducer。

### 1.4 案例：构建一个完整的固定流程图

这个案例用 `input → process → output` 三个节点连成一条固定路径，重点不是业务逻辑本身，而是让你看清楚：**同一份 `process_data` 是怎么沿着节点一步步传下去，又是怎么被后续节点更新的。**

**这个案例重点看什么：**

- `StateGraph(GraphState)` 是怎么把“这张图内部的状态结构”绑定到图构建器上的。
- `add_node("input", input_node)`、`add_edge(START, "input")` 这类写法是怎么把函数注册成节点、再把节点串起来的。
- 为什么 `input_node`、`process_node`、`output_node` 都是“接收当前 state，返回局部更新 dict”。
- 为什么最终 `process_data` 只保留了 `{"process": "process_value9527"}`，而不是把初始输入和前面节点写入内容全都自动合并起来。答案就在后面的 **默认 Reducer = 覆盖更新**。

【案例源码】`案例与源码-3-LangGraph框架/02-graph/BuildWholeGraphSummary.py`

```py
"""
【案例】多节点、固定边的完整图：input → process → output 三个节点，状态字段 process_data 在节点间传递，并在默认覆盖规则下被后续节点更新。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 1、Graph API 之 Graph（图）

知识点速览：
- StateGraph(GraphState) 指定状态类型后，各节点接收完整 state，返回对 state 的「部分更新」字典。
- 本例的重点是“图怎么搭起来”，不是“状态怎么累积起来”；未为字段指定 Reducer 时，默认覆盖：后一节点返回的 process_data 会覆盖前一节点的值。
- 固定边：add_edge 依次串联 START → input → process → output → END，执行顺序确定。
- 编译后 invoke(initial_state) 传入初始 process_data，结果中最终保留的是最后一次写入该字段的内容。
"""

from typing import TypedDict
from langgraph.constants import START, END
from langgraph.graph import StateGraph

"""图的构建流程：
1、初始化一个StateGraph实例。
2、添加节点。
3、定义边，将所有的节点连接起来。
4、设置特殊节点，入口和出口（可选）。
5、编译图。
6、执行工作流。"""


# 定义状态：process_data 用于在节点间传递；本例未指定 Reducer，因此后续节点会按默认覆盖规则更新它
class GraphState(TypedDict):
    process_data: dict


def input_node(state: GraphState) -> dict:
    """入口节点：写入初始 process_data。"""
    print(f"input_node 节点执行 state.get('process_data'): {state.get('process_data')}")
    return {"process_data": {"input": "input_value"}}


def process_node(state: dict) -> dict:
    """处理节点：更新 process_data。"""
    print(
        f"process_node 节点执行 state.get('process_data'): {state.get('process_data')}"
    )
    return {"process_data": {"process": "process_value9527"}}


def output_node(state: GraphState) -> dict:
    """出口节点：读取并返回当前 process_data。"""
    print(
        f"output_node 节点执行 state.get('process_data'): {state.get('process_data')}"
    )
    return {"process_data": state.get("process_data")}


# 创建状态图并指定状态类型
graph = StateGraph(GraphState)
graph.add_node("input", input_node)
graph.add_node("process", process_node)
graph.add_node("output", output_node)

# 固定边：start → input → process → output → end
graph.add_edge(START, "input")
graph.add_edge("input", "process")
graph.add_edge("process", "output")
graph.add_edge("output", END)

# 编译后执行；传入的初始 state 会与各节点返回值按 Reducer 规则合并
app = graph.compile()
result = app.invoke({"process_data": {"name": "测试数据", "value": 123456}})
print(f"最后的结果是:{result}")

# 可视化
print(app.get_graph().print_ascii())
print("=================================")
print(app.get_graph().draw_mermaid())


"""
【输出示例】
input_node 节点执行 state.get('process_data'): {'name': '测试数据', 'value': 123456}
process_node 节点执行 state.get('process_data'): {'input': 'input_value'}
output_node 节点执行 state.get('process_data'): {'process': 'process_value9527'}
最后的结果是:{'process_data': {'process': 'process_value9527'}}
+-----------+
| __start__ |
+-----------+
      *
      *
      *
  +-------+
  | input |
  +-------+
      *
      *
      *
 +---------+
 | process |
 +---------+
      *
      *
      *
  +--------+
  | output |
  +--------+
      *
      *
      *
 +---------+
 | __end__ |
 +---------+
None
=================================
---
config:
  flowchart:
    curve: linear
---
graph TD;
        __start__([<p>__start__</p>]):::first
        input(input)
        process(process)
        output(output)
        __end__([<p>__end__</p>]):::last
        __start__ --> input;
        input --> process;
        process --> output;
        output --> __end__;
        classDef default fill:#f2f0ff,line-height:1.2
        classDef first fill-opacity:0
        classDef last fill:#bfb6fc
"""

```

### 1.5 设计 Graph 的几个问题

本章案例里的图都很小。真实项目一旦变复杂，就不能“想到哪就加哪”。动手写图之前，先想清楚几个问题：

- **哪些步骤应该拆成独立节点？** 如果某段逻辑需要单独调试、单独复用、单独观察耗时，通常适合拆成节点；如果只是一个很小的局部计算，不一定非要硬拆。
- **哪些流程是固定边，哪些流程应该交给条件边？** 例如“先检索再总结”通常可以是固定边，“如果检索结果不够就重新查询，否则进入回答生成”就更适合条件边。
- **哪些数据应该放进 State，哪些只是节点内部临时变量？** 需要跨节点传递、需要持久化恢复、需要给后续节点继续用的数据，应该进 State；只在当前函数里用一下的临时计算结果，不必都塞进 State。
- **对外暴露的输入输出接口要不要和内部完整状态分开？** 如果这张图将来要被别的服务调用，通常不希望外部直接看到所有内部字段，这就要考虑 `input_schema` 和 `output_schema`。

这些问题会自然引出第二部分：**State 到底怎么定义，更新又怎么合并。**

------

## 2、Graph API 之 State（状态）

### 2.1 定义

在 LangGraph 中，**State（状态）** 是贯穿整张图执行过程的一份**共享数据快照**。每个节点都会接收当前 State，执行自己的逻辑，然后返回一份“状态更新”；LangGraph 再根据每个字段对应的 **Reducer（规约函数）**，把这份更新合并回全局 State。

入门阶段先抓住这句话：

**State = Schema（模式） + Reducer（规约函数）**

- **Schema** 负责定义“状态里有哪些字段、每个字段是什么类型”；放到本章语境里，主要指的就是 **State Schema**。
- **Reducer** 负责定义“某个节点返回了这个字段的新值时，应该怎么和旧状态合并”。

如果没有统一 State，节点之间就很容易退回到“你手动从 A 函数拿一堆返回值，再自己拼给 B 函数”的写法，流程一复杂就会乱。LangGraph 把 State 放在中心位置，相当于帮你建立一个**单一事实来源（Single Source of Truth）**：所有节点都围着同一份状态读写，而不是各自维护一套容易打架的私有数据。

接下来这部分可以按两层去学：

- 先看 **State Schema**：状态里到底有哪些字段、字段类型是什么；
- 再看 **Reducer**：节点返回了字段更新后，这些更新最终怎么合并回 State。

### 2.2 案例：最小 State

这个案例故意不写任何业务节点，只连了一条 `START → END` 的边，用来验证一件事：`invoke(initial_state)` 传进去的就是 State 的初始值，如果中间没有节点更新它，最终就会原样返回。

这个案例很适合先建立两个基础直觉：

- `TypedDict` 不是业务逻辑，而是在声明“这张图的状态长什么样”。
- `invoke()` 的核心输入是一整个状态字典，不是给每个字段单独传一堆位置参数。

【案例源码】`案例与源码-3-LangGraph框架/03-state/DefState.py`

```py
"""
【案例】最简 State 定义与「无中间节点」图：用 TypedDict 定义状态，构建一条直接从 START 到 END 的边，验证 invoke(initial_state) 的用法。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 2、Graph API 之 State（状态）

知识点速览：
- State 由 Schema（模式）和 Reducer（规约函数）两部分组成。
- 本例用 TypedDict（下方 `BasicState`）定义 State Schema（字段名与类型）；图中所有节点读写同一份状态结构。
- 字段未用 `Annotated[..., reducer]` 指定 Reducer 时，使用 LangGraph 默认 Reducer（常见为节点返回的新值覆盖该字段旧值）。
- add_edge(START, END) 表示没有业务节点，图从入口直接到出口；本例重点是理解“State 原样透传”和 `invoke(initial_state)` 的基本调用方式。
- invoke() 只接收一个核心位置参数：状态字典；不要传入多个独立参数。可选第二参数为 config。
- 嵌套类型（如 process_data: dict）在 initial_state 中需传入合法字典。
"""

from typing import TypedDict
from langgraph.graph import StateGraph, START, END


class BasicState(TypedDict):
    """本图的 State Schema：字段名 + 类型共同定义这张图允许流转的状态结构。"""

    user_input: str
    response: str
    count: int
    process_data: dict


# 创建状态图：BasicState 是本图的 state_schema；本例不写 Annotated，因此各字段都走默认覆盖规则
basicState = StateGraph(BasicState)
# 无中间节点：直接从 START 到 END，状态会原样透传
basicState.add_edge(START, END)
app = basicState.compile()

# invoke 只接收一个核心参数（状态字典）；process_data 为 dict，需传入嵌套字典
initial_state = {
    "user_input": "a",
    "response": "resp",
    "count": 25,
    "process_data": {"k1": "v1"},
}

result = app.invoke(initial_state)
print("执行结果：", result)

"""
【输出示例】
执行结果： {'user_input': 'a', 'response': 'resp', 'count': 25, 'process_data': {'k1': 'v1'}}
"""

```

### 2.3 State Schema 怎么选

根据 LangGraph 官方 Graph API 文档，State Schema 常见可以用 **TypedDict**、**Pydantic BaseModel**，也可以用 **dataclass**。本仓库主线案例主要用 `TypedDict`，因为它轻量、直接，和“状态就是一份 dict 快照”这件事最贴近。

| State Schema 写法      | 入门理解                         | 优点                                             | 更适合的场景                                     |
| ---------------------- | -------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| **TypedDict**          | 带类型标注的字典结构             | 轻量、写法简单、性能开销低、很适合教学和流程状态 | 大多数 LangGraph 状态建模起步场景                |
| **Pydantic BaseModel** | 带运行时校验和字段约束的数据模型 | 能做更强的数据校验、默认值、嵌套模型、字段说明   | 对外接口更严格、数据结构更复杂、希望失败尽早暴露 |
| **dataclass**          | Python 数据类                    | 适合需要默认值、字段写起来更像对象属性的场景     | 需要默认值，但不想引入 Pydantic 校验成本         |

**怎么选更贴近真实项目？**

- 如果你还在设计工作流主线，优先用 **TypedDict**，因为它最轻，改起来也快。
- 如果这张图已经要作为稳定服务对外暴露，且输入输出字段必须强校验，可以考虑把边界层做成 **Pydantic**。
- 如果只是想给 State 字段加默认值，**dataclass** 也可以考虑。
- 不要为了“显得更工程化”一上来把所有内部状态都做成复杂嵌套模型。LangGraph 状态最怕的不是“不够高级”，而是“字段太多、边界不清、谁在改什么看不出来”。

### 2.4 三种 Schema

很多人第一次看 `StateGraph(OverallState, input_schema=InputState, output_schema=OutputState)` 会有点懵：既然已经有 `OverallState` 了，为什么还要额外写 `input_schema` 和 `output_schema`？

原因是：**图内部真正维护的完整状态，和这张图对外暴露的输入输出接口，不一定是一回事。**

| 名称              | 作用                                          | 直观理解方式                                         |
| ----------------- | --------------------------------------------- | ---------------------------------------------------- |
| **state_schema**  | 定义图内部完整状态空间，节点通常围绕它读写    | “图内部完整工作台上有哪些数据”                       |
| **input_schema**  | 限制调用方 `invoke(...)` 进图时允许传哪些字段 | “外部用户进门时只能带什么材料”                       |
| **output_schema** | 限制图执行结束后最终对外返回哪些字段          | “最终只把哪些结果交给调用方，不把内部草稿全暴露出去” |

![StateGraph 输入输出隔离：外部调用先经过 input_schema 过滤，内部普通节点围绕 state_schema 运行，出图时再由 output_schema 过滤返回](https://didilili.github.io/ai-agents-from-zero/images/23/23-2-4-1.svg)

这三层可以按执行链路来理解：

- 外部调用 `graph.invoke(input_data)` 时，先经过 `input_schema` 约束，调用方不能随意把内部字段塞进来。
- 图内部从 `START` 到普通节点再到 `END`，节点真正围绕完整的 `state_schema` 工作。
- 图执行结束后，再经过 `output_schema` 过滤，只把对外契约里允许返回的字段交给调用方。

`input_schema` 和 `output_schema` 不是为了“多写几份类型”，而是为了把**服务边界**和**内部工作台**分开。这样一来，图内部后续即使增加 `retrieved_docs`、`route_reason`、`retry_count` 之类字段，也不一定影响外部 API。

术语关系可以记成一条线：

- **Schema** 是总称，表示“数据结构的定义方式”
- **State Schema** 是本章最核心的 Schema，专门描述图内部状态
- `state_schema`、`input_schema`、`output_schema` 是代码层面的具体参数名

如果不显式指定 `input_schema` 和 `output_schema`，默认通常就和 `state_schema` 一致；但一旦这张图要变成一个对外服务接口，**把“内部状态”和“外部契约”拆开，会比直接把整个 State 暴露出去更稳。**

`state_schema` 规定的是图的完整状态空间，但这不等于每个节点都要读写所有字段。真实项目里，检索节点可能只关心 `query`，汇总节点主要读 `rag_result` / `web_search_result`，审核节点只处理 `draft` 和 `review_result`。运行时会把当前完整 state 交给节点，但节点实现上应当只依赖自己真正需要的字段；必要时也可以用更小的 `TypedDict` 做类型标注，让依赖关系更清楚。

### 2.5 案例：输入输出隔离

这个案例对应 2.4 里的输入输出隔离：**调用方只需要传 `question`，最终只拿到 `answer`；至于图内部是不是还保留了别的字段，那是内部实现细节，不一定要暴露出去。**

**这个案例重点看什么：**

- `InputState`、`OutputState`、`OverallState` 三个 schema 是怎么分层的。
- `StateGraph(OverallState, input_schema=InputState, output_schema=OutputState)` 这行代码到底在声明什么。
- 为什么 `answer_node(state)` 虽然只依赖 `question`，但返回时可以同时返回 `{"answer": ..., "question": ...}`；最后对外结果仍然只剩 `{"answer": ...}`，因为出图前会按 `output_schema` 过滤。
- 这种写法很适合真实项目里的“**内部状态很多，但服务 API 只想暴露少数字段**”场景。

【案例源码】`案例与源码-3-LangGraph框架/03-state/schema/StateSchema.py`

```py
"""
【案例】图的输入/输出 Schema：用 input_schema 和 output_schema 限制「调用时只能传 question、返回时只拿 answer」，实现对外接口的契约化，适合需要明确 I/O 边界的场景。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 2、Graph API 之 State（状态）

知识点速览：
- 本例最适合拿来理解“State 不只有一种 Schema”：`OverallState` 是内部完整 State Schema，`InputState` / `OutputState` 是图对外暴露的输入输出契约。
- 构建时 `StateGraph(OverallState, input_schema=InputState, output_schema=OutputState)`，第一个位置参数描述内部完整状态，后两个参数负责限制边界输入输出。
- 节点内部仍围绕完整状态空间工作；只有「图的边界」受 input/output 约束，这种分层更贴近真实项目接口封装。
"""

from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict


# 仅包含「输入」字段的 Schema：限制调用方进图时能传什么
class InputState(TypedDict):
    question: str


# 仅包含「输出」字段的 Schema：限制图最终对外返回什么
class OutputState(TypedDict):
    answer: str


# 图内部使用的完整 State Schema（输入 + 输出）
class OverallState(InputState, OutputState):
    pass


def answer_node(state: InputState):
    """处理节点：根据 question 生成 answer。"""
    print(f"执行 answer_node 节点:")
    print(f"  输入: {state}")
    answer = "再见" if "bye" in state["question"].lower() else "你好"
    result = {"answer": answer, "question": state["question"]}
    print(f"  输出: {result}")
    return result


def demo_input_output_schema():
    """演示：调用时只传 question，返回时只得到 answer。"""
    print("=== 演示输入输出模式 ===")

    # 指定 input_schema / output_schema，约束图的对外接口
    builder = StateGraph(
        OverallState, input_schema=InputState, output_schema=OutputState
    )
    builder.add_edge(START, "answer_node")
    builder.add_node("answer_node", answer_node)
    builder.add_edge("answer_node", END)
    graph = builder.compile()

    # invoke 只传 InputState 的字段；返回结果仅包含 OutputState 的字段
    result = graph.invoke({"question": "你好"})
    print(f"图调用结果: {result}")
    print(graph.get_graph().print_ascii())
    print()


def main():
    print("=== LangGraph 图输入输出模式===\n")
    demo_input_output_schema()
    print("=== 演示完成 ===")


if __name__ == "__main__":
    main()

"""
【输出示例】
=== LangGraph 图输入输出模式===

=== 演示输入输出模式 ===
执行 answer_node 节点:
  输入: {'question': '你好'}
  输出: {'answer': '你好', 'question': '你好'}
图调用结果: {'answer': '你好'}
 +-----------+   
 | __start__ |   
 +-----------+   
        *        
        *        
        *        
+-------------+  
| answer_node |  
+-------------+  
        *        
        *        
        *        
  +---------+    
  | __end__ |    
  +---------+    
None

=== 演示完成 ===
"""

```

学完 `State Schema` 和 `input_schema / output_schema` 之后，State 的“字段长什么样”这一半就比较清楚了。接下来要补上的，就是另一半：**字段更新时到底怎么合并。** 这正是 Reducer 负责的事。

------

## 3、Reducer（状态合并）

Reducer 仍然属于 State 设计，只是它很关键，值得单独展开。前后关系可以这样看：

- `Graph` 负责描述流程结构
- `State` 负责描述共享数据
- `Schema` 负责描述 State 里有哪些字段
- `Reducer` 负责描述这些字段更新时怎么合并

也可以把它记成一句更顺的话：**Schema 决定字段长什么样，Reducer 决定字段更新时怎么合并。**

### 3.1 定义

前面已经说过，节点一般只返回“局部状态更新”，那这些更新到底怎么和旧状态合并？答案就是 **Reducer（规约函数）**。

对某个 State 字段来说，Reducer 可以看成一个“**旧值 + 新增更新 → 合并后新值**”的函数。不同字段可以有不同 Reducer；如果某个字段没有显式指定 Reducer，LangGraph 默认就按**覆盖更新**处理，也就是节点返回的新值直接替换这个字段原来的旧值。

在 `TypedDict` 里，指定 Reducer 的常见写法是 `Annotated[字段类型, reducer函数]`，例如：

```python
import operator
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class MyState(TypedDict):
    messages: Annotated[list, add_messages]
    tags: Annotated[list[str], operator.add]
    count: Annotated[int, operator.add]
    latest_answer: str
```

<svg id="mermaid-svg-0" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 735.844px; transform: translate(0px, 0px) scale(1); transform-origin: 0px 0px;" viewBox="-8 -8 735.84375 370.5" role="graphics-document document" aria-roledescription="flowchart-v2"><g><marker id="mermaid-svg-0_flowchart-pointEnd" class="marker flowchart" viewBox="0 0 10 10" refX="6" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-0_flowchart-pointStart" class="marker flowchart" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-0_flowchart-circleEnd" class="marker flowchart" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="mermaid-svg-0_flowchart-circleStart" class="marker flowchart" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="mermaid-svg-0_flowchart-crossEnd" class="marker cross flowchart" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-0_flowchart-crossStart" class="marker cross flowchart" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M131.918,80L145.314,80C158.711,80,185.504,80,213.224,90.842C240.944,101.684,269.591,123.368,283.914,134.209L298.238,145.051" id="L-old-reducer-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-old LE-reducer" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-0_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M187.047,166.5L191.255,166.5C195.464,166.5,203.88,166.5,211.372,166.5C218.864,166.5,225.43,166.5,228.714,166.5L231.997,166.5" id="L-update1-reducer-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-update1 LE-reducer" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-0_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M187.297,253L191.464,253C195.63,253,203.964,253,222.454,242.158C240.944,231.316,269.591,209.632,283.914,198.791L298.238,187.949" id="L-update2-reducer-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-update2 LE-reducer" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-0_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M346.79,148.25L370.791,126.583C394.791,104.917,442.792,61.583,484.864,39.917C526.935,18.25,563.077,18.25,581.148,18.25L599.22,18.25" id="L-reducer-new-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-reducer LE-new" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-0_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M383.66,148.25L401.515,142.542C419.371,136.833,455.082,125.417,484.544,119.708C514.007,114,537.221,114,548.827,114L560.434,114" id="L-reducer-msg-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-reducer LE-msg" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-0_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M383.66,184.75L401.515,190.458C419.371,196.167,455.082,207.583,488.137,213.292C521.192,219,551.59,219,566.79,219L581.989,219" id="L-reducer-add-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-reducer LE-add" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-0_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M345.423,184.75L369.652,208.208C393.88,231.667,442.336,278.583,481.764,302.042C521.192,325.5,551.59,325.5,566.79,325.5L581.989,325.5" id="L-reducer-cover-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-reducer LE-cover" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-0_flowchart-pointEnd)" data-darkreader-inline-fill=""></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(490.79296875, 114)"><g class="label" transform="translate(-33.30078125, -9.25)"><foreignObject width="66.6015625" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;">messages</span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(490.79296875, 219)"><g class="label" transform="translate(-49.21875, -10.75)"><foreignObject width="98.4375" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;">tags 和 count</span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(490.79296875, 325.5)"><g class="label" transform="translate(-49.94140625, -9.25)"><foreignObject width="99.8828125" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;">latest_answer</span></div></foreignObject></g></g></g><g class="nodes"><g class="node default default flowchart-label" id="flowchart-old-0" data-node="true" data-id="old" transform="translate(93.6484375, 80)"><rect class="basic label-container" style="" rx="0" ry="0" x="-38.26953125" y="-18.25" width="76.5390625" height="36.5"></rect><g class="label" style="" transform="translate(-30.76953125, -10.75)"><rect></rect><foreignObject width="61.5390625" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">旧 State</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-update1-1" data-node="true" data-id="update1" transform="translate(93.6484375, 166.5)"><rect class="basic label-container" style="" rx="0" ry="0" x="-93.3984375" y="-18.25" width="186.796875" height="36.5"></rect><g class="label" style="" transform="translate(-85.8984375, -10.75)"><rect></rect><foreignObject width="171.796875" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">节点 A 返回局部更新</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-update2-2" data-node="true" data-id="update2" transform="translate(93.6484375, 253)"><rect class="basic label-container" style="" rx="0" ry="0" x="-93.6484375" y="-18.25" width="187.296875" height="36.5"></rect><g class="label" style="" transform="translate(-86.1484375, -10.75)"><rect></rect><foreignObject width="172.296875" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">节点 B 返回局部更新</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-reducer-3" data-node="true" data-id="reducer" transform="translate(326.57421875, 166.5)"><rect class="basic label-container" style="" rx="0" ry="0" x="-89.27734375" y="-18.25" width="178.5546875" height="36.5"></rect><g class="label" style="" transform="translate(-81.77734375, -10.75)"><rect></rect><foreignObject width="163.5546875" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">按字段 Reducer 合并</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-new-4" data-node="true" data-id="new" transform="translate(642.7890625, 18.25)"><rect class="basic label-container" style="" rx="0" ry="0" x="-38.26953125" y="-18.25" width="76.5390625" height="36.5"></rect><g class="label" style="" transform="translate(-30.76953125, -10.75)"><rect></rect><foreignObject width="61.5390625" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">新 State</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-msg-14" data-node="true" data-id="msg" transform="translate(642.7890625, 114)"><rect class="basic label-container" style="" rx="0" ry="0" x="-77.0546875" y="-27.5" width="154.109375" height="55"></rect><g class="label" style="" transform="translate(-69.5546875, -20)"><rect></rect><foreignObject width="139.109375" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">add_messages<br style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box;">追加或按 ID 更新</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-add-16" data-node="true" data-id="add" transform="translate(642.7890625, 219)"><rect class="basic label-container" style="" rx="0" ry="0" x="-55.5" y="-27.5" width="111" height="55"></rect><g class="label" style="" transform="translate(-48, -20)"><rect></rect><foreignObject width="96" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">operator.add<br style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box;">拼接或累加</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-cover-18" data-node="true" data-id="cover" transform="translate(642.7890625, 325.5)"><rect class="basic label-container" style="" rx="0" ry="0" x="-55.5" y="-29" width="111" height="58"></rect><g class="label" style="" transform="translate(-48, -21.5)"><rect></rect><foreignObject width="96" height="43"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">默认覆盖<br style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box;">保留最新值</span></div></foreignObject></g></g></g></g></g></svg>



按字段来看：

- `messages` 用 `add_messages` 合并，适合聊天历史这种“新增消息追加到列表里”的场景。
- `tags` 和 `count` 用 `operator.add`，分别表示列表拼接和数值累加。
- `latest_answer` 没写 Reducer，所以默认覆盖，后写入的新答案会替换旧答案。

### 3.2 案例一：默认覆盖更新

如果一个字段没有写 `Annotated[..., reducer]`，默认就是**覆盖更新**。这个行为本身没问题，适合“这个字段永远只关心最新值”的场景，比如 `current_step`、`latest_answer`、`final_summary`。

这个案例里，`node1` 先把 `foo` 改成 `22`，`node2` 再把 `bar` 改成新列表。因为 `foo`、`bar` 都没声明特殊 Reducer，所以它们都是按默认覆盖规则更新。

【案例源码】`案例与源码-3-LangGraph框架/03-state/reducers/StateReducer_Default.py`

```py
"""
【案例】默认 Reducer（覆盖更新）：未为状态字段指定 Reducer 时，节点返回的值会直接覆盖该字段，后执行节点的结果覆盖先执行节点的结果。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 3、State 的更新机制：Reducer（规约函数）

知识点速览：
- Reducer 决定「节点返回的更新如何合并到当前状态」；不指定时采用默认行为：覆盖。
- 多节点依次更新同一字段时，最终状态中该字段只保留最后一个节点返回的值。
- 适合「单写」场景；若需追加、累加等，需使用 add_messages、operator.add 等 Reducer。
"""

from typing import List
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END


# 未为 foo、bar 指定 Reducer，默认覆盖更新
class DefaultReducerState(TypedDict):
    foo: int
    bar: List[str]


def node_default_1(state: DefaultReducerState) -> dict:
    """节点1 只更新 foo，bar 保持原样（本示例中会被节点2 覆盖 bar）。"""
    print(state["foo"])
    print(state["bar"])
    return {"foo": 22}


def node_default_2(state: DefaultReducerState) -> dict:
    """节点2 只更新 bar；foo 保持为节点1 写入的 22。"""
    print(state["foo"])
    print(state["bar"])
    return {"bar": ["bye1", "bye2", "bye3"]}


def main():
    print("1. 默认 Reducer（覆盖更新）演示:\n")
    builder = StateGraph(DefaultReducerState)
    builder.add_node("node1", node_default_1)
    builder.add_node("node2", node_default_2)
    builder.add_edge(START, "node1")
    builder.add_edge("node1", "node2")
    builder.add_edge("node2", END)
    graph = builder.compile()

    result = graph.invoke(input={"foo": 1, "bar": ["hi"]})
    print(f"执行结果: {result}\n")


if __name__ == "__main__":
    main()

"""
【输出示例】
1. 默认 Reducer（覆盖更新）演示:

1
['hi']
22
['hi']
执行结果: {'foo': 22, 'bar': ['bye1', 'bye2', 'bye3']}
"""

```

### 3.3 案例二：add_messages 追加消息列表

如果你把对话历史存在 `messages` 字段里，通常不希望每个节点一返回新消息就把整段历史覆盖掉，而是希望**把新消息追加到旧消息后面**。这时就适合用 `add_messages`。

和普通 `operator.add` 相比，`add_messages` 更适合聊天消息场景，因为它不仅会追加新消息，还能根据 **message id** 更新已有消息，并且会把输入里的消息数据反序列化成 LangChain 的 `Message` 对象。官方 `add_messages` 文档也明确说明：它会合并两组 messages，如果消息 ID 相同就更新旧消息；如果是新消息，就追加到列表后面。

【案例源码】`案例与源码-3-LangGraph框架/03-state/reducers/StateReducer_AddMessages.py`

```py
"""
【案例】add_messages Reducer：消息列表专用，节点只返回「增量消息」，由 add_messages 自动追加到 state["messages"]，适合多轮对话与多节点共同写消息的场景。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 3、State 的更新机制：Reducer（规约函数）

知识点速览：
- Annotated[List, add_messages] 表示该字段使用 add_messages 规约：新消息追加到列表末尾，而非覆盖。
- 节点返回格式可为 [("role", content)] 或 [AIMessage/HumanMessage] 等，由 add_messages 统一合并。
- 多节点共同写 messages 时，本例重点是“消息按 add_messages 规则合并”，不要把并行分支下的最终顺序直接当成业务契约。
"""

from typing import Annotated, List
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages


# messages 使用 add_messages：节点只返回增量，自动追加
class AddMessagesState(TypedDict):
    messages: Annotated[List, add_messages]


def chat_node_1(state: AddMessagesState) -> dict:
    return {"messages": [("assistant", "Hello from node 1")]}


def chat_node_2(state: AddMessagesState) -> dict:
    return {"messages": [("assistant", "Hello from node 2")]}


def run_demo():
    print("2. add_messages Reducer（消息列表专用）演示:")
    builder = StateGraph(AddMessagesState)
    builder.add_node("chat1", chat_node_1)
    builder.add_node("chat2", chat_node_2)
    builder.add_edge(START, "chat1")
    builder.add_edge(START, "chat2")  # 两节点并行，各自追加消息
    builder.add_edge("chat1", END)
    builder.add_edge("chat2", END)
    graph = builder.compile()

    result = graph.invoke({"messages": [("user", "Hi there!")]})
    print(f"初始状态: {{'messages': [('user', 'Hi there!')]}}")
    print(f"执行结果: {result}\n")
    print("*" * 60)
    print(graph.get_graph().print_ascii())


if __name__ == "__main__":
    run_demo()

"""
【输出示例】
2. add_messages Reducer（消息列表专用）演示:
初始状态: {'messages': [('user', 'Hi there!')]}
执行结果: {'messages': [HumanMessage(content='Hi there!', additional_kwargs={}, response_metadata={}, id='1ef23c0c-ec9a-4e41-a3fb-2a80e5f84666'), AIMessage(content='Hello from node 1', additional_kwargs={}, response_metadata={}, id='09bed348-3770-400b-93fd-f550a647445f', tool_calls=[], invalid_tool_calls=[]), AIMessage(content='Hello from node 2', additional_kwargs={}, response_metadata={}, id='06bbf85f-9661-450d-a54e-5025abe7a34b', tool_calls=[], invalid_tool_calls=[])]}

************************************************************
       +-----------+         
       | __start__ |         
       +-----------+         
         *        *          
       **          **        
      *              *       
+-------+         +-------+  
| chat1 |         | chat2 |  
+-------+         +-------+  
         *        *          
          **    **           
            *  *             
        +---------+          
        | __end__ |          
        +---------+          
None
"""

```

这个案例还有一个细节需要注意：调用 `graph.invoke(...)` 时，`messages` 里既可以传 `HumanMessage(...)` 这种对象，也可以传 `{"role": "...", "content": "..."}` 这类字典格式；如果 State 上用了 `add_messages`，运行时会尽量把它们转换成 LangChain Message 对象。因此，在节点里读正文时，通常应该用 `state["messages"][-1].content`，而不是把最后一条消息当普通字符串。

### 3.4 案例三：operator.add 用在列表、字符串、数值上

`operator.add` 是一个很常见的内置合并策略，但它对不同数据类型的语义不一样：

- 对 **列表** 来说，是列表拼接，效果类似 `current + update`。
- 对 **字符串** 来说，是字符串连接。
- 对 **数值** 来说，是数值相加。

这意味着 `operator.add` 很适合下面这些业务场景：

- 多个节点各自产生一批标签、文档片段、候选结果，最后合并成一个列表。
- 多个节点依次生成文案片段，最后拼成完整文本。
- 多个节点分别贡献分数、计数、成本增量，最后累加出总值。

**列表追加案例：**

【案例源码】`案例与源码-3-LangGraph框架/03-state/reducers/StateReducer_OperatorAdd.py`

```py
"""
【案例】operator.add 作为 Reducer（列表）：对列表字段做「 extend 」式追加，多节点返回的列表会按顺序合并成一个列表。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 3、State 的更新机制：Reducer（规约函数）

知识点速览：
- Annotated[List[int], operator.add] 表示该字段用 operator.add 规约：语义为列表的 extend，即 current + update 拼成新列表。
- 适合多节点各自产生一段数据、最后合并成一条列表的场景（如多路采集再汇总）；前提是业务确实允许简单拼接。
"""

import operator
from typing import Annotated, List
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END


class ListAddState(TypedDict):
    data: Annotated[List[int], operator.add]


def producer_1(state: ListAddState) -> dict:
    return {"data": [1, 2]}


def producer_2(state: ListAddState) -> dict:
    return {"data": [3, 4]}


def run_demo():
    print("3.1 列表追加 Reducer 演示:")
    builder = StateGraph(ListAddState)
    builder.add_node("producer1", producer_1)
    builder.add_node("producer2", producer_2)
    builder.add_edge(START, "producer1")
    builder.add_edge("producer1", "producer2")
    builder.add_edge("producer2", END)
    graph = builder.compile()
    result = graph.invoke({"data": [0]})
    print(f"初始状态: {{'data': [0]}}")
    print(f"执行结果: {result}\n")


if __name__ == "__main__":
    run_demo()

"""
【输出示例】
3.1 列表追加 Reducer 演示:
初始状态: {'data': [0]}
执行结果: {'data': [0, 1, 2, 3, 4]}
"""

```

**字符串连接案例：**

【案例源码】`案例与源码-3-LangGraph框架/03-state/reducers/StateReducer_OperatorAdd2.py`

```py
"""
【案例】operator.add 作为 Reducer（字符串）：对字符串字段做「连接」，多节点返回的字符串会按顺序拼成一条。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 3、State 的更新机制：Reducer（规约函数）

知识点速览：
- Annotated[str, operator.add] 表示该字段用 operator.add 规约：语义为字符串拼接，即 current + update。
- 适合多节点产出文本片段、最后拼成完整文案的场景；如果业务强依赖固定先后顺序，真实项目里更建议配合串行边使用。
"""

import operator
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END


class StringConcatState(TypedDict):
    text: Annotated[str, operator.add]


def add_text_1(state: StringConcatState) -> dict:
    return {"text": "Hello "}


def add_text_2(state: StringConcatState) -> dict:
    return {"text": "World!"}


def run_demo():
    print("3.2 字符串连接 Reducer 演示:")
    builder = StateGraph(StringConcatState)
    builder.add_node("add_text_1", add_text_1)
    builder.add_node("add_text_2", add_text_2)
    builder.add_edge(START, "add_text_1")
    builder.add_edge(START, "add_text_2")
    builder.add_edge("add_text_1", END)
    builder.add_edge("add_text_2", END)
    graph = builder.compile()
    result = graph.invoke({"text": "Say: "})
    print(f"初始状态: {{'text': 'Say: '}}")
    print(f"执行结果: {result}\n")


if __name__ == "__main__":
    run_demo()

"""
【输出示例】
3.2 字符串连接 Reducer 演示:
初始状态: {'text': 'Say: '}
执行结果: {'text': 'Say: Hello World!'}
"""

```

**数值累加案例：**

【案例源码】`案例与源码-3-LangGraph框架/03-state/reducers/StateReducer_OperatorAdd3.py`

```py
"""
【案例】operator.add 作为 Reducer（数值）：对数值字段做「累加」，多节点返回的数会与当前值相加，适合计数、积分等场景。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 3、State 的更新机制：Reducer（规约函数）

知识点速览：
- Annotated[int, operator.add] 表示该字段用 operator.add 规约：语义为数值加法，即 current + update。
- 初始状态提供起点（如 count: 10），各节点返回 {"count": 增量}，最终 state["count"] 为累加结果。
"""

import operator
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END


class NumberAddState(TypedDict):
    count: Annotated[int, operator.add]


def increment_1(state: NumberAddState) -> dict:
    return {"count": 5}


def increment_2(state: NumberAddState) -> dict:
    return {"count": 3}


def run_demo():
    print("3.3 数值累加 Reducer 演示:")
    builder = StateGraph(NumberAddState)
    builder.add_node("increment_1", increment_1)
    builder.add_node("increment_2", increment_2)
    builder.add_edge(START, "increment_1")
    builder.add_edge("increment_1", "increment_2")
    builder.add_edge("increment_2", END)
    graph = builder.compile()
    result = graph.invoke({"count": 10})
    print(f"初始状态: {{'count': 10}}")
    print(f"执行结果: {result}\n")


if __name__ == "__main__":
    run_demo()

"""
【输出示例】
3.3 数值累加 Reducer 演示:
初始状态: {'count': 10}
执行结果: {'count': 18}
"""

```

### 3.5 案例四：operator.mul 边界

这个案例不要只看“代码能不能跑”，要重点理解**为什么结果会变成 0.0**。对带 Reducer 的字段来说，LangGraph 合并更新时会经过“旧值 + 新值”的规约过程；当字段类型是 `float` 且用 `operator.mul` 做乘法规约时，如果初始旧值是 `0.0`，第一次就会变成 `0.0 * update = 0.0`，后面再乘什么都还是 0.0。

所以这个案例真正想说明的不是“`operator.mul` 永远不能用”，而是：**乘法这类对单位元敏感的规约逻辑，不能只看 reducer 函数本身，还要处理好初始值和首次合并边界。** 在真实项目里，如果这类边界不好直接靠内置函数表达，就应该写自定义 Reducer。

【案例源码】`案例与源码-3-LangGraph框架/03-state/reducers/StateReducer_OperatorMul.py`

```py
"""
【案例】operator.mul 作为 Reducer（数值相乘）的「陷阱」演示：LangGraph 会用类型默认值（float 的 0.0）先做一次规约，导致 0.0 * 初始值 = 0，后续乘法始终为 0；理解后可用自定义 Reducer 解决。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 3、State 的更新机制：Reducer（规约函数）

知识点速览：
- 这个案例的重点不是“operator.mul 不能跑”，而是理解“乘法这类对初始值很敏感的规约逻辑，不能只看 reducer 函数名，还要看首次合并边界”。
- 当字段默认值是 `0.0` 时，乘法规约很容易在第一次合并就变成 `0.0`，后面再乘什么都还是 `0.0`。
- 解决方式通常是改成自定义 Reducer，在函数里显式处理首次合并逻辑。参见 `StateReducer_Custom.py`。
"""

import operator
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END


class MultiplyState(TypedDict):
    factor: Annotated[float, operator.mul]


def multiplier(state: MultiplyState) -> dict:
    return {"factor": 2.0}


# 这里故意保留 operator.mul 的“踩坑版”写法，目的是先让你观察问题，再对照 StateReducer_Custom.py 理解为什么真实项目更适合写自定义 Reducer


def run_demo():
    print("4. operator.mul Reducer（数值相乘）演示:")
    builder = StateGraph(MultiplyState)
    builder.add_node("multiplier", multiplier)
    builder.add_edge(START, "multiplier")
    builder.add_edge("multiplier", END)
    graph = builder.compile()

    result = graph.invoke({"factor": 5.0})
    print(f"初始状态: {{'factor': 5.0}}")
    print(f"执行结果: {result}")
    print(
        "说明: 因 float 默认 0.0 先参与规约，0.0 * 5.0 = 0.0，后续乘 2.0 仍为 0.0；乘法场景请用自定义 Reducer。\n"
    )


if __name__ == "__main__":
    run_demo()

"""
【输出示例】
4. operator.mul Reducer（数值相乘）演示:
初始状态: {'factor': 5.0}
执行结果: {'factor': 0.0}
说明: 因 float 默认 0.0 先参与规约，0.0 * 5.0 = 0.0，后续乘 2.0 仍为 0.0；乘法场景请用自定义 Reducer。
"""

```

### 3.6 案例五：自定义 Reducer

当默认覆盖、`add_messages`、`operator.add` 这些现成策略都不够用时，就可以自定义 Reducer。自定义 Reducer 的核心不是“写法有多复杂”，而是把这个签名记住：

```python
def my_reducer(current_value, update_value):
    return merged_value
```

换句话说，**Reducer 拿到的是当前旧值和本次节点更新值，返回的是合并后的新值。**

这个案例用 `MyOperatorMul(current, update)` 专门处理乘法第一次规约时 `current == 0.0` 的问题：如果判断这是第一次合并，就把它当作从乘法单位元 `1.0` 开始；否则正常做 `current * update`。

【案例源码】`案例与源码-3-LangGraph框架/03-state/reducers/StateReducer_Custom.py`

```py
"""
【案例】自定义 Reducer：用函数签名 (current, update) -> 合并结果，解决 operator.mul 在首次规约边界上不适合直接用于乘法累计的问题。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 3、State 的更新机制：Reducer（规约函数）

知识点速览：
- Reducer 可以写成普通函数：接收当前字段值 `current` 与本次更新值 `update`，返回新的合并结果。
- 自定义 Reducer 的价值不在“语法复杂”，而在于你可以按业务语义处理首次合并、空值、重复值、顺序稳定性等边界。
- 节点仍只返回增量（如 `{\"factor\": 2.0}`），真正决定怎么合并的是 Reducer，而不是节点本身。
"""

from typing import Annotated

from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict


def MyOperatorMul(current: float, update: float) -> float:
    """自定义乘法 Reducer：首次合并时把 current 的边界情况单独处理，再继续乘法累计。"""
    # 第一次调用时 current 往往是类型默认值 0.0，若直接 current * update 会得到 0，后续无法恢复
    if current == 0.0:
        print(f"current:{current}")
        print(f"update:{update}")
        # 等价于从 1.0 开始乘：1.0 * update
        return 1.0 * update
    return current * update


class MultiplyState(TypedDict):
    factor: Annotated[float, MyOperatorMul]


def multiplier(state: MultiplyState) -> dict:
    # 节点返回的 update 会与 state["factor"] 经 MyOperatorMul 合并
    return {"factor": 2.0}


def run_demo():
    print("使用自定义reducer解决乘法问题:")
    builder = StateGraph(MultiplyState)
    builder.add_node("multiplier", multiplier)
    builder.add_edge(START, "multiplier")
    builder.add_edge("multiplier", END)
    graph = builder.compile()

    # 初始 factor=5.0 与节点返回 2.0 经 Reducer 合并为 5.0 * 2.0 = 10.0
    result = graph.invoke({"factor": 5.0})
    print(f"初始状态: {{'factor': 5.0}}")
    print(f"执行结果: {result}")
    print(f"解释: 5.0 * 2.0 = 10.0\n")


if __name__ == "__main__":
    run_demo()

"""
【输出示例】
使用自定义reducer解决乘法问题:
current:0.0
update:5.0
初始状态: {'factor': 5.0}
执行结果: {'factor': 10.0}
解释: 5.0 * 2.0 = 10.0
"""

```

### 3.7 案例六：字段级合并策略

真实业务里的状态通常不会只有一个字段。更常见的情况是：**聊天消息要追加，标签列表要拼接，评分要累加，最新结论要覆盖。** 这就意味着同一个 State 里，不同字段本来就应该有不同 Reducer。

这个案例把三种策略放在了一起：

- `messages: Annotated[List, add_messages]`：对话消息追加合并。
- `tags: Annotated[List[str], operator.add]`：标签列表拼接。
- `score: Annotated[float, operator.add]`：数值分数累加。

同时它还演示了一种常见结构：**从 `START` 同时连到多个节点，让多个分支分别产出不同状态更新，最后由各字段自己的 Reducer 负责合并。** 这是后面学习并行分支和复杂 Agent 图的基础。

【案例源码】`案例与源码-3-LangGraph框架/03-state/reducers/StateReducersMyChatBot.py`

```py
"""
【案例】多种 Reducer 并存：同一 State 里 `messages` 用 add_messages 追加、`tags` 用 operator.add 拼接列表、`score` 用 operator.add 做数值累加；演示同一份 State 里不同字段可以有不同合并规则。

对应教程章节：第 15 章 - LangGraph API：图与状态 → 3、State 的更新机制：Reducer（规约函数）

知识点速览：
- 这是第 15 章里最适合建立“State = Schema + Reducer”整体直觉的案例：字段定义是一层，字段怎么合并是另一层。
- add_messages：节点只返回「增量」消息，自动与历史合并为一条对话链；invoke 里也可传 OpenAI 风格的 `{\"role\", \"content\"}` 字典，运行时会转为 Message 对象。
- operator.add 作用于列表时相当于拼接，作用于 float 时为普通加法累加；同一个 State 里完全可以给不同字段配置不同 Reducer。
- 从同一 START 连到多个节点时，本例重点是观察“不同字段如何被各自的 Reducer 合并”，而不是把并行分支的执行先后当成业务契约。
"""

from typing import Annotated, List

import operator
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class ChatState(TypedDict):
    # 消息历史：add_messages 规约，新消息追加而非整表覆盖（与 StateReducer_AddMessages 一致可用 List）
    messages: Annotated[List, add_messages]
    # 标签列表：operator.add 将各节点返回的列表拼到已有列表后
    tags: Annotated[List[str], operator.add]
    # 累计分数：operator.add 做浮点数相加
    score: Annotated[float, operator.add]


def process_user_message(state: ChatState) -> dict:
    # 获取最新消息；修复/注意：须用 .content 读正文（dict 入参在运行时已转为 HumanMessage 等对象，勿当普通 str 用）
    user_message = state["messages"][-1]
    return {
        # add_messages 会把本条 assistant 回复与历史合并
        "messages": [("assistant", f"Echo: {user_message.content}")],
        "tags": ["processed"],
        "score": 1.0,
    }


def add_sentiment_tag(state: ChatState) -> dict:
    # 本节点不写 messages，则 messages 仅由其他节点更新；tags/score 仍参与 operator.add 合并
    return {"tags": ["positive"], "score": 0.5}


def run_demo():
    builder = StateGraph(ChatState)
    builder.add_node("process", process_user_message)
    builder.add_node("sentiment", add_sentiment_tag)

    # 两节点都从 START 接入：并行分支，各自跑到 END
    builder.add_edge(START, "process")
    builder.add_edge(START, "sentiment")
    builder.add_edge("process", END)
    builder.add_edge("sentiment", END)

    graph = builder.compile()

    # invoke 只接收一个状态字典；messages 可用 dict 列表，与 Chat API 习惯一致
    result = graph.invoke(
        {
            "messages": [{"role": "user", "content": "Hello, how are you?"}],
            "tags": ["greeting"],
            "score": 0.0,
        }
    )
    print(result)


if __name__ == "__main__":
    run_demo()

"""
【输出示例】
{'messages': [HumanMessage(content='Hello, how are you?', additional_kwargs={}, response_metadata={}, id='4350252b-ace7-429a-8cc8-67d232d91f42'), AIMessage(content='Echo: Hello, how are you?', additional_kwargs={}, response_metadata={}, id='ab394788-89d0-45f2-a6b0-5252a448ebb1', tool_calls=[], invalid_tool_calls=[])], 'tags': ['greeting', 'processed', 'positive'], 'score': 1.5}
"""

```

### 3.8 Reducer 选型

学完这些案例后，不要只背 Reducer 名字。真实项目里更重要的是：先看字段语义，再选合并方式。

![Reducer 选型示意：默认覆盖适合最新值，add_messages 适合消息历史，operator.add 适合列表或数值累加，自定义 Reducer 适合去重和按 ID 合并](https://didilili.github.io/ai-agents-from-zero/images/23/23-3-8-1.png)

| 业务字段类型                                         | 更适合的 Reducer                      | 典型例子                                             |
| ---------------------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| 只关心最新结果                                       | 默认覆盖                              | `latest_answer`、`current_route`、`final_summary`    |
| 聊天消息历史                                         | `add_messages`                        | `messages`、Agent 轨迹、人工修正后的消息状态         |
| 候选列表 / 标签列表 / 文档片段列表                   | `operator.add` 或自定义去重版 Reducer | `retrieved_docs`、`tags`、`candidate_items`          |
| 计数 / 分数 / token 成本累计                         | `operator.add`                        | `retry_count`、`total_score`、`token_cost`           |
| 乘积、最大值、去重合并、按时间戳保留最新值等特殊逻辑 | 自定义 Reducer                        | 风险分数聚合、按 ID 合并对象列表、保留优先级最高结果 |

实践时重点看这几条：

- **不要把所有字段都默认覆盖，也不要把所有列表都直接套 `operator.add`。** 先问清楚这个字段的业务语义：是“最新值”，还是“历史累积”，还是“需要按 ID 合并”。
- **消息历史优先考虑 `add_messages`，而不是普通列表相加。** 因为聊天消息往往涉及消息对象格式转换、按 ID 更新旧消息、人机介入修正等问题。
- **自定义 Reducer 里要处理好首次合并、空值、重复值、顺序稳定性这些边界。** 很多状态 bug 不是节点逻辑错了，而是 Reducer 合并规则没设计清楚。
- **并行分支写同一个字符串字段时，要谨慎使用 `operator.add`。** 字符串拼接依赖写入顺序，多个并行节点同时写入时可读性和稳定性都不如“先收集列表，再由汇总节点统一排序和拼接”。对候选文档、标签、片段这类结果，优先用列表字段承接。
- **State 字段不要无限膨胀。** 如果一个字段只是临时中间变量，而且后续节点根本不再用，不一定非要长期留在全局 State 里；否则图运行久了，状态会越来越难读。

State 也不只是“一次 `invoke()` 里的临时变量”。后面学习 `checkpointer`、`thread_id`、状态历史、故障恢复时，你会看到 State 还承担着“可持久化工作流上下文”的角色：

- 同一个 `thread_id` 下，多次调用可以继续沿用同一份状态上下文；
- 图执行中途报错时，只要状态已经被持久化，就有机会从上一次检查点恢复；
- `get_state()` / `get_state_history()` 这类能力，也都是围绕 State 快照展开的。

这一层在本章先建立概念即可。现在只要把 State 看成两件事的交汇点：它既是图运行时的共享数据结构，也是后续持久化、短期记忆和故障恢复的基础。

------

## 4、图在运行时如何推进

前面已经把 Graph、State、Reducer 讲完了。现在回到一个更工程化的问题：你写下来的逻辑图，运行时到底怎么跑？

LangGraph 底层采用的是 Pregel 风格的图计算思路。这里只要建立三个直觉：多个节点可以在同一轮被调度；节点返回的是更新，不是直接修改全局变量；有了检查点之后，状态历史可以被恢复和回放。

### 4.1 为什么要理解运行时

如果只看 `add_node()` 和 `add_edge()`，很容易以为 LangGraph 只是按箭头顺序挨个调函数。实际执行更接近下面这套模型：

- 每个节点会被转换成运行时里的 **Actor**。
- State 字段和边的触发关系会被组织成不同 **Channel**。
- 图按一个个 **Superstep** 往前推进。
- 每个 Superstep 里，运行时先决定哪些 Actor 该执行，再并行执行这些 Actor，最后统一合并它们写出的更新。

这解释了一个关键问题：**LangGraph 的状态更新不是节点函数原地改全局变量，而是节点返回更新，运行时按通道和 Reducer 统一合并。** 所以并行分支、动态分发和多智能体场景里，Reducer 设计很重要。

### 4.2 从逻辑图到 Pregel 运行时

你在代码里定义节点和边，调用 `builder.compile()` 后，运行时会把它转换成 Pregel 图。节点变成 Actors，状态字段、入口、分支触发关系等变成 Channels。

![逻辑图编译为 Pregel 图：节点和边转换成 Actors 与 Channels，状态字段 aggregate 也成为运行时通道之一](https://didilili.github.io/ai-agents-from-zero/images/23/23-4-2-1.png)

可以把它理解成：

- **逻辑图** 是你写给开发者看的：`a -> b -> b_2 -> d`、`a -> c -> d`。
- **Pregel 图** 是运行时真正调度用的：哪些 Actor 订阅哪些 Channel，执行后又写入哪些 Channel。

换句话说，`compile()` 不是形式主义。它会把你声明式写出的图结构，变成一套可执行、可检查、可流式观察、可持久化的运行时结构。

### 4.3 Actor 和 Channel 怎么配合

在 Pregel 视角下，一个节点不是孤立函数，而是一个订阅某些 Channel、执行后写入某些 Channel 的 Actor。

![Actor 内部订阅与写入示意：节点 a 订阅 branch:to:a，写入 branch:to:b 与 branch:to:c；节点 d 订阅 branch:to:d，执行后不再写入分支通道](https://didilili.github.io/ai-agents-from-zero/images/23/23-4-3-1.png)

这张图可以这样读：

- 节点 `a` 订阅 `branch:to:a`，被触发后写入 `branch:to:b` 和 `branch:to:c`。
- 节点 `b` 订阅 `branch:to:b`，执行后写入 `branch:to:b_2`。
- 节点 `d` 订阅 `branch:to:d`，执行后不再写入新的分支通道，流程就自然走向结束。

所以边的本质可以进一步理解成：**它不是简单画一条线，而是在告诉运行时“哪个节点执行完后，要向哪个节点对应的触发通道写入信号”。**

### 4.4 Superstep：图是按步骤推进的

Pregel 模型里还有一个很关键的词：**Superstep**。你可以先把它理解成“一轮图调度”。每一轮通常可以拆成三步：

1. **Plan**：根据上一轮 Channel 的更新，决定这一轮哪些 Actor 要执行。
2. **Execute**：并行执行这些 Actor。只要在同一轮被选中，它们就不是简单串行排队。
3. **Update**：把这些 Actor 写出的更新统一合并回 Channels 和 State。

![Superstep 执行过程：Step0 执行 a，Step1 执行 b/c，Step2 执行 b_2/d，Step3 再执行 d 后结束](https://didilili.github.io/ai-agents-from-zero/images/23/23-4-4-1.png)

用上图里的结构来理解：

- `Step0`：节点 `a` 被触发，写入去往 `b` 和 `c` 的通道。
- `Step1`：节点 `b` 和 `c` 都被触发，可以在同一个 superstep 里执行。
- `Step2`：`b_2` 和 `d` 被触发，其中 `c` 的结果已经可以进入 `d`。
- `Step3`：`d` 再次接收到来自 `b_2` 分支的更新，执行后没有新的下游任务，图结束。

这也解释了为什么你在设计并行分支时要特别关心 Reducer：**多个 Actor 在同一步或相邻步骤里写同一个字段时，最终状态能不能稳定、正确地合并，取决于这个字段的 Reducer。**

### 4.5 StateSnapshot

配置 Checkpointer 后，LangGraph 不只是保存最后结果，还会保存执行过程中的状态快照。官方 API 里常见的两个方法是：

- `graph.get_state(config)`：获取某个 `thread_id` 下最近一次状态快照。
- `graph.get_state_history(config)`：获取某个 `thread_id` 下的历史状态快照序列。

这些快照通常可以理解成 **StateSnapshot**，里面最值得关注的不是只有 `values`，还包括：

| 字段            | 入门理解                                                     |
| --------------- | ------------------------------------------------------------ |
| `values`        | 当前状态值，也就是这一刻 State 里保存了什么                  |
| `next`          | 下一步准备执行哪些节点                                       |
| `config`        | 这份快照对应的运行配置，通常包含 `thread_id` 和 checkpoint 信息 |
| `metadata`      | 与快照相关的来源、步骤等元数据                               |
| `parent_config` | 父快照配置，用来串起历史链路                                 |
| `interrupts`    | 当前未解决的中断信息，常见于人机协作场景                     |

`next` 这个字段尤其关键：它告诉你“如果从这份快照继续跑，下一步会去哪里”。这就是状态历史对断点恢复、时间回溯和人工介入有价值的原因。它不是普通日志，而是一份可以被运行时继续使用的执行现场。

------

**章节思考题：**

1. 为什么 State 不是随手放变量的字典？

   **参考思路：** State 是整张图的数据契约，决定节点能读写什么、并行结果怎么合并、后续如何恢复和调试。字段随便加会让图越来越难维护。

2. 设计 State 字段时，你会如何区分输入、过程状态和输出？

   **参考思路：** 输入字段承接外部请求，过程字段保存中间分类、检索结果、工具返回，输出字段对外暴露最终结果。三者混在一起会让接口和内部实现互相绑死。

3. Reducer 选错会产生什么隐蔽 bug？

   **参考思路：** 该追加的被覆盖，会丢历史；该覆盖的被追加，会状态膨胀；并行结果如果没有按业务语义合并，最终状态可能顺序不稳、重复或冲突。Reducer 是业务规则，不只是语法。

4. 什么时候字段应该留在内部 State，而不是放进 input_schema 或 output_schema？

   **参考思路：** 只服务内部节点流转、调试或中间计算的字段留在内部 State；外部调用必须提供的才进 input，外部确实需要消费的才进 output。接口越克制，图越容易演进。

5. 为什么理解 Superstep 有助于设计 Reducer？

   **参考思路：** 因为多个节点可能在同一轮或相邻轮写入同一个字段，最终状态不是靠某个节点手动拼出来的，而是由运行时统一合并。Reducer 设计错了，并行分支越多，状态越容易出现覆盖、重复或顺序不稳定。

**本章小结：**

- **Graph** 是可执行的有向工作流结构，`StateGraph` 负责构建图，`START` / `END` 定义入口出口，`compile()` 把构建器变成可运行图，`invoke()` 负责执行。
- **State 是 LangGraph 的中心数据结构**，不是普通“函数参数传来传去”的替代品，而是整张图的共享状态快照和单一事实来源。
- **State = Schema + Reducer**：Schema 定义字段结构，Reducer 定义字段更新怎么和旧状态合并；把两者放在一起看，才是完整的 State 设计。
- **`state_schema`、`input_schema`、`output_schema` 要分清楚**：内部完整状态是一回事，对外输入输出契约是另一回事。
- **Reducer 选择要跟业务语义对齐**：默认覆盖适合最新值，`add_messages` 适合消息历史，`operator.add` 适合拼接/累加，自定义 Reducer 适合更复杂的合并规则。
- 学完本章后，你至少应该能说清 **Graph、State、Schema、Reducer** 四层关系，知道它们不是同一层东西；知道 `state_schema`、`input_schema`、`output_schema` 各自负责什么边界；能根据字段语义选择默认覆盖、`add_messages`、`operator.add` 或自定义 Reducer。

**建议下一步：** 先按顺序跑一遍 `BuildWholeGraphSummary.py`、`DefState.py`、`StateSchema.py` 和 `03-state/reducers` 目录下所有 Reducer 案例，然后自己做两个小练习：把 `BuildWholeGraphSummary.py` 的 `process_data` 改成用 `operator.add` 追加历史记录；把 `StateReducersMyChatBot.py` 再加一个 `latest_summary` 字段，用默认覆盖保存最新摘要。做完后进入 [第 16 章 - LangGraph API：节点、边与进阶](https://didilili.github.io/ai-agents-from-zero/#/24-LangGraphAPI：节点、边与进阶)，继续学习节点、普通边、条件边和 `Command` / `Send` / `Runtime`。
