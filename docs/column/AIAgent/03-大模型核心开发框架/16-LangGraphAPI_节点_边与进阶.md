---
date: 2026年09月07日
---

# 24 - LangGraph API：节点、边与进阶

------

**本章课程目标：**

- 理解 **Node（节点）** 的定义、职责与常见写法，知道节点为什么是 LangGraph 的最小执行单元。
- 掌握 **Edge（边）** 的核心类型：普通边、条件边、入口点、条件入口点，建立“图为什么能按规则流转”的直觉。
- 理解 **Send、Command、Runtime 上下文** 这三类进阶控制能力分别解决什么问题，知道它们和前面学过的 `Graph`、`State`、`Reducer` 是怎么接起来的。
- 能运行并理解本章全部案例，为后续更复杂的 LangGraph 工作流、多智能体和高级特性打基础。

**学习建议：** 这章可以当成 LangGraph 的“控制流”来读：Node 负责做事，Edge 负责决定去哪，Send / Command / Runtime 处理普通边不够用的场景。先跑明白普通边和条件边，再看动态分发、更新并跳转、运行时上下文。读完后能说清“这一步为什么不是固定下一跳”，就抓住了进阶 API 的用处。

**官方文档与资源**：详见 [工具导航与参考资料索引 - LangGraph](https://i8zoro8i.github.io/zoro_blog/column/AIAgent/工具导航与参考资料索引)。

------

## 1、Graph API 之 Node（节点）

### 1.1 定义

在 LangGraph 里，**Node（节点）** 可以看作：**图中的一个可执行步骤**。它通常就是一个 Python 函数，可以是同步函数，也可以是异步函数。图运行时，框架会按边的连接关系，依次或并行地调度这些节点执行。

如果说 上一章 重点在讲“图里有哪些共享状态”，那本章开始讲的 Node，重点就在讲：**状态到了某一站之后，要做什么处理。**

Node 不是图上的装饰点，而是三件事的组合：

- 一段明确的处理逻辑
- 一次对当前 State 的读取
- 一次对 State 的局部更新

LangGraph 官方对 `StateGraph` 的定义里有一句非常核心的话：节点的签名可以写成 `State -> Partial<State>`。它的意思是：节点通常读取当前状态，然后只返回它想更新的那部分字段，而不是每次都把整份完整状态重新手写一遍。

### 1.2 节点的作用

Node 是图真正“干活”的地方。前面学过的 Graph、State、Reducer 更偏结构和机制，而节点负责承载具体业务逻辑。真实项目里，下面这些事情通常都写在节点里：

- 调用大模型
- 调用工具或外部 API
- 做检索、重排、格式化
- 做路由判断前的中间计算
- 记录某一步的结果、状态标记或错误信息

这三层关系可以这样看：

- **Graph** 负责整体流程结构
- **State** 负责共享数据
- **Node** 负责每一步具体做什么

### 1.3 节点函数一般长什么样

根据官方 Graph API 文档，LangGraph 节点常见可以接收三类参数：

- `state`：图当前这一步看到的共享状态
- `config`：本次运行的配置与元数据，类型通常是 `RunnableConfig`
- `runtime`：运行时对象，可访问 `context`、`store`、`stream_writer` 等

最常见的节点先从这一种开始记：

```python
def node(state: MyState) -> dict:
    return {"some_key": "new_value"}
```

这也是初学者最该先掌握的形态：**读 state，返回局部更新 dict。**

当你后面开始做更复杂的工作流时，再慢慢加入：

- `config`：适合放 `thread_id`、`tags`、`metadata`
- `runtime`：适合放模型名、数据库连接、API 密钥、环境配置这类不属于 State 的依赖

![官方文档摘录：LangGraph 节点可接收 state、config、runtime 三类参数](https://didilili.github.io/ai-agents-from-zero/images/24/24-1-3-1.jpeg)

图里这三个词的层次建议这样记：

- `state` 是“业务数据”
- `config` 是“本次运行的配置和追踪信息”
- `runtime` 是“节点执行时可访问的运行环境能力”

`config` 和 `runtime` 这两个参数，通常由 LangGraph 运行时通过关键字方式自动注入。大多数场景里，你不需要手动组装它们；节点函数里是否声明这些参数，表达的是“这个节点需要哪些运行时信息”。

节点输出还有一条基本规则：**返回增量更新，不要把接收到的整个 State 原样或修改后整份返回出去。**

原因在于：

- LangGraph 会把节点返回值当成“本节点对状态的局部更新”
- 然后再按字段对应的 Reducer 规则，把这些更新合并回全局 State

所以更推荐的写法是：

```python
def node(state: MyState) -> dict:
    return {"result": "new_value"}
```

而不推荐把整份 `state` 直接修改后再整体 return。因为那样很容易带来两个问题：

- 没配置特殊 Reducer 的字段，会出现本不该被当前节点改动却被一起覆盖的情况
- 配置了 Reducer 的字段，如果节点把“不属于本节点职责的状态”也一并返回，后续合并结果会更难预测

节点只返回自己负责更新的字段。

从代码习惯上看，下面这种写法要尽量避免：

```python
def query_web(state: MyState) -> dict:
    state["web_result"] = "网络搜索结果"
    return state
```

它看起来省事，但问题是：调用者很难判断这个节点到底负责改哪些字段；如果 State 里有 `messages`、`retrieved_docs` 这类带 Reducer 的字段，整份返回还可能导致重复合并或覆盖误伤。

更推荐的写法是：

```python
def query_web(state: MyState) -> dict:
    return {"web_result": "网络搜索结果"}
```

**节点函数内部可以读完整 State，但离开节点时只交出自己的增量更新。** 这条规则和上一章的 Reducer 是一体的：节点负责产出更新，Reducer 负责合并更新。

### 1.4 START、END 与入口出口

在学节点时，经常会一起看到 `START` 和 `END`。它们不是你自己写的业务节点，而是 LangGraph 内置的两个**特殊虚拟节点**：

- `START` 表示图的入口
- `END` 表示图的结束

最常见的写法是：

```python
graph.add_edge(START, "node_a")
graph.add_edge("node_a", END)
```

这表示：图从 `node_a` 开始执行，`node_a` 执行完后流程结束。

如果图的入口出口很明确，也可以用：

- `set_entry_point(node_id)`
- `set_finish_point(node_id)`

它们是更简洁的语法糖，底层还是在帮你建立 `START -> node`、`node -> END` 这样的边。

### 1.5 节点设计建议

入门阶段，节点最容易被写成“什么都往里面塞”。但从真实项目角度看，节点更适合遵守下面几条原则：

- **单一职责**：一个节点尽量只做一件事
- **输入输出清楚**：看函数签名和返回值，就知道它依赖什么、更新什么
- **少依赖外部可变状态**：优先通过 State 或 Runtime 传值，而不是偷偷读全局变量
- **便于重试和缓存**：如果节点副作用太重，后面配置缓存或重试时会很难控

你可以先把节点理解成“图里的一个小服务”，而不是“图里的一大坨代码”。

### 1.6 案例：节点定义方式与 add_node

这个案例是本章最基础、也最值得先跑通的 Node 例子。它主要演示三件事：

- 节点就是 Python 函数
- 节点除了最基本的 `state` 参数，还可以借助 `partial` 绑定额外参数
- `add_node(...)` 时除了传节点函数，还可以顺手挂上 `retry_policy`

【案例源码】`案例与源码-3-LangGraph框架/04-node/DefNode.py`

```py
"""
【案例】节点定义方式与可选参数：普通节点、带额外参数的节点（用 partial 绑定）、以及 add_node 时传入 RetryPolicy 配置重试策略。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 1、Graph API 之 Node（节点）

知识点速览：
- Node 本质上是被图调度的 Python 函数；本例重点不是业务逻辑，而是理解“节点如何被 add_node 注册进图”。
- 节点常见返回值是对 State 的局部更新 dict，而不是整份完整状态；若节点需要额外参数，可用 functools.partial 预先绑定，再传给 add_node。
- add_node(name, node_func, retry_policy=RetryPolicy(...)) 说明节点除了函数本身，还能挂执行策略；本例顺手演示了 retry_policy 的挂法。
"""

from functools import partial
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.types import RetryPolicy
from requests import RequestException, Timeout


class GraphState(TypedDict):
    process_data: dict


def input_node(state: GraphState) -> dict:
    print(f"input_node 收到的初始值:{state}")
    return {"process_data": {"input": "input_value"}}


# 节点可带额外参数，用 partial 绑定后传给 add_node
def process_node(state: dict, param1: int, param2: str) -> dict:
    print(state, param1, param2)
    return {"process_data": {"process": "process_value"}}


# 重试策略：仅对 RequestException、Timeout 重试，最多 3 次
retry_policy = RetryPolicy(
    max_attempts=3,
    initial_interval=1,
    jitter=True,
    backoff_factor=2,
    retry_on=[RequestException, Timeout],
)

stateGraph = StateGraph(GraphState)
stateGraph.add_node("input", input_node)
process_with_params = partial(process_node, param1=100, param2="test")
stateGraph.add_node("process", process_with_params, retry_policy=retry_policy)
stateGraph.add_edge(START, "input")
stateGraph.add_edge("input", "process")
stateGraph.add_edge("process", END)

graph = stateGraph.compile()

print(stateGraph.edges)
print(stateGraph.nodes)
print(graph.get_graph().print_ascii())
print()

initial_state = {"process_data": 5}
result = graph.invoke(initial_state)
print(f"最后的结果是:{result}")

"""
【输出示例】
{('process', '__end__'), ('__start__', 'input'), ('input', 'process')}
{'input': StateNodeSpec(runnable=input(tags=None, recurse=True, explode_args=False, func_accepts={}), metadata=None, input_schema=<class '__main__.GraphState'>, retry_policy=None, cache_policy=None, ends=(), defer=False), 'process': StateNodeSpec(runnable=process(tags=None, recurse=True, explode_args=False, func_accepts={}), metadata=None, input_schema=<class '__main__.GraphState'>, retry_policy=RetryPolicy(initial_interval=1, backoff_factor=2, max_interval=128.0, max_attempts=3, jitter=True, retry_on=[<class 'requests.exceptions.RequestException'>, <class 'requests.exceptions.Timeout'>]), cache_policy=None, ends=(), defer=False)}
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
 +---------+   
 | __end__ |   
 +---------+   
None

input_node 收到的初始值:{'process_data': 5}
{'process_data': {'input': 'input_value'}} 100 test
最后的结果是:{'process_data': {'process': 'process_value'}}
"""

```

这个案例用来建立一个基础直觉：**Node 的重点不是“函数怎么写花哨”，而是“如何被图注册、调度、配置”。**

### 1.7 节点缓存（Node Caching）

节点缓存解决的问题很实际：**某个节点很贵、很慢，但相同输入经常重复出现，能不能不要每次都重新跑？**

LangGraph 要真正命中缓存，通常要看三层：

- **节点声明缓存策略**：例如 `CachePolicy(key_func=..., ttl=...)`。
- **图编译时选择缓存后端**：例如 `compile(cache=InMemoryCache())`。
- **运行时判断是否命中**：按 `key_func` 生成缓存键，再根据 `ttl` 判断是否过期。

其中 `key_func` 决定“什么样的输入算同一次结果”，`ttl` 决定“这份结果能复用多久”。缓存后端可以是内存、Redis、SQLite 等，具体选型要看项目是否需要跨进程、跨机器或持久保存。

入门阶段先记住：**节点声明支持缓存，图编译时选择具体缓存后端。**

![官方说明摘录：节点缓存需在编译时提供 cache、在节点上配置 CachePolicy（含 key 与 ttl）](https://didilili.github.io/ai-agents-from-zero/images/24/24-1-7-1.jpeg)

在真实项目里，缓存很适合这些节点：

- 纯计算节点
- 解析、格式化、清洗类节点
- 成本高但输入重复率高的外部调用节点

不太适合直接粗暴缓存的，则通常是：

- 强依赖实时数据的节点
- 带强副作用的节点
- 输入看起来一样，但实际上上下文不同的节点

### 1.8 案例：节点缓存

这个案例的学习重点不是记住 `ttl=8` 这个数字，而是看清楚两件事：

- `cache_policy=CachePolicy(...)` 是配置在节点上的
- `compile(cache=InMemoryCache())` 是在图编译时提供缓存后端

换句话说，**节点声明“我支持缓存”，图编译时再决定“实际用什么缓存”。**

【案例源码】`案例与源码-3-LangGraph框架/04-node/Node_Cache.py`

```py
"""
【案例】节点缓存（Node Caching）：为节点配置 CachePolicy(ttl=8)，编译时传入 InMemoryCache()，相同输入在 ttl 秒内直接返回缓存结果，避免重复执行耗时逻辑。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 1、Graph API 之 Node（节点）

知识点速览：
- add_node(..., cache_policy=CachePolicy(...)) 是“节点声明自己支持缓存”；compile(cache=...) 则是“图编译时选择具体缓存后端”。
- `ttl` 决定缓存保留多久；如果还需要更精细地控制“什么样的输入算同一次结果”，可以再配合 `key_func`。
- 本例用 set_entry_point / set_finish_point 构成单节点图，目的是把“缓存行为”本身看清楚，不让流程结构分散注意力。
"""

import time
from typing_extensions import TypedDict
from langgraph.graph import StateGraph
from langgraph.cache.memory import InMemoryCache
from langgraph.types import CachePolicy


class State(TypedDict):
    x: int
    result: int


builder = StateGraph(State)


def expensive_node(state: State) -> dict[str, int]:
    """模拟耗时计算（sleep 3 秒），用于观察缓存命中时不再执行。"""
    time.sleep(3)
    return {"result": state["x"] * 2}


# 为该节点配置缓存，ttl=8 秒
builder.add_node(
    node="expensive_node",
    action=expensive_node,
    cache_policy=CachePolicy(ttl=8),
)
builder.set_entry_point("expensive_node")
builder.set_finish_point("expensive_node")

# 编译时指定使用内存缓存
app = builder.compile(cache=InMemoryCache())

# 第一次执行：无缓存，耗时约 3 秒
print("第一次执行（无缓存，耗时 3 秒）：")
print(app.invoke({"x": 5}))

# 第二次执行：命中缓存，立即返回
print("\n第二次运行利用缓存并快速返回：")
print(app.invoke({"x": 5}))

# 等待 ttl 过期后再次执行，将重新计算
print("\n等待 8 秒，缓存过期...")
time.sleep(8)
print("8 秒后第三次执行（重新计算，耗时 3 秒）：")
print(app.invoke({"x": 5}))

"""
【输出示例】
第一次执行（无缓存，耗时 3 秒）：
{'x': 5, 'result': 10}

第二次运行利用缓存并快速返回：
{'x': 5, 'result': 10}

等待 8 秒，缓存过期...
8 秒后第三次执行（重新计算，耗时 3 秒）：
{'x': 5, 'result': 10}
"""

```

### 1.9 错误处理与重试机制

重试机制解决的是另一个现实问题：**节点失败了，是不是应该立刻整个图报错，还是可以重试一下？**

LangGraph 用 `RetryPolicy` 来描述这件事。官方参考文档里，`RetryPolicy` 主要包含这些常见参数：

- `max_attempts`：最多尝试执行多少次，包含第一次正式执行。
- `initial_interval`：第一次重试前先等多久，通常以秒为单位。
- `backoff_factor`：每次重试后，等待时间按多少倍增长，用来做退避。
- `max_interval`：单次重试等待时间的上限，避免退避时间无限变长。
- `jitter`：是否在等待时间上加入一点随机扰动，降低“同时重试把服务再次打爆”的风险。
- `retry_on`：指定哪些异常值得重试；不符合条件的异常会直接抛出，而不是继续重试。

其中最关键的不是把参数全背下来，而是先分清楚两层语义：

- **时间策略**：多久重试一次，是否退避，是否加抖动
- **异常策略**：哪些异常应该重试，哪些异常不该重试

在真实项目里，建议先分清异常类型：

- **网络抖动、临时超时** 这类问题通常适合重试
- **参数错误、类型错误、业务逻辑错误** 通常不适合盲目重试

所以 `retry_on` 的价值是：**让重试更像工程策略，而不是“失败了就不加区分地再跑一遍”。**

### 1.10 案例：节点重试

这个案例适合重点观察三种情况：

- 默认重试策略是什么效果
- 自定义 `retry_on` 时，如何只对特定异常重试
- 哪些异常会直接失败，不会进入重试流程

【案例源码】`案例与源码-3-LangGraph框架/04-node/Node_ExpErrRetry.py`

```py
"""
【案例】节点重试策略（RetryPolicy）：默认重试、自定义 retry_on 仅对特定异常重试、以及「不可重试异常」直接失败，演示 add_node(..., retry_policy=RetryPolicy(...)) 的用法。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 1、Graph API 之 Node（节点）

知识点速览：
- RetryPolicy 不只是“重试几次”，而是两层策略组合：一层是时间策略（重试次数、间隔、退避），一层是异常策略（哪些错误值得重试）。
- RetryPolicy(max_attempts=5) 适合先观察默认行为；RetryPolicy(..., retry_on=custom_retry_on) 则更贴近真实项目里的精细控制。
- 本例最值得关注的是：不是所有异常都应该重试，像 ValueError 这类逻辑/参数错误通常应直接失败。
"""

from typing import Dict, Any
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.types import RetryPolicy


# 定义状态类型
class DiliState(TypedDict):
    result: str


# 全局计数器：记录API尝试次数
attempt_counter = 0


# 工具函数
def build_retry_graph(node_name: str, node_func, retry_policy: RetryPolicy):
    builder = StateGraph(DiliState)
    # 为节点添加重试策略，需要在add_node中设置retry_policy参数。
    # retry_policy参数接受一个RetryPolicy命名元组对象。
    # 默认情况下，retry_on参数使用default_retry_on函数，该函数会在遇到任何异常时重试
    builder.add_node(node_name, node_func, retry_policy=retry_policy)
    builder.add_edge(START, node_name)
    builder.add_edge(node_name, END)
    return builder.compile()


# 模拟不稳定的API调用，使用全局变量跟踪尝试次数
def unstable_api_call(state: DiliState) -> Dict[str, Any]:
    """模拟不稳定API：前2次失败，第3次成功（全局计数器记录尝试次数）"""
    global attempt_counter
    attempt_counter += 1
    # 纯文本打印尝试次数
    print(f"尝试调用API，这是第 {attempt_counter} 次尝试")

    # 模拟失败/成功逻辑：前2次抛异常，第3次返回结果
    if attempt_counter < 3:
        raise Exception(f"模拟API调用失败abcd (尝试 {attempt_counter})")
    return {"result": f"API调用成功，经过 {attempt_counter} 次尝试"}


# 自定义重试条件判断函数
def custom_retry_on(exception: Exception) -> bool:
    """自定义重试规则：只对包含「模拟API调用失败」的异常重试"""
    print("########################:  " + str(exception))
    err_msg = str(exception)
    if "模拟API调用失败" in err_msg:
        print(f"捕获到可重试异常: {err_msg}")
        return True
    print(f"捕获到不可重试异常: {err_msg}")
    return False


# 模拟抛出 ValueError 的节点
def value_error_call(state: DiliState) -> Dict[str, Any]:
    """模拟抛出ValueError：默认重试策略对这类异常不重试"""
    print("调用会抛出 ValueError 的节点")
    raise ValueError("模拟 ValueError 异常")


# 测试方法1：默认重试策略
def test_default_retry():
    global attempt_counter
    print("1. 使用默认重试策略:")
    print("   默认策略会对除特定异常外的所有异常进行重试")
    print("   不会重试的异常包括: ValueError, TypeError, ArithmeticError, ImportError,")
    print("                     LookupError, NameError, SyntaxError, RuntimeError,")
    print(
        "                     ReferenceError, StopIteration, StopAsyncIteration, OSError\n"
    )

    print("测试默认重试策略:")
    attempt_counter = 0  # 重置计数器
    default_graph = build_retry_graph(
        node_name="unstable_api",
        node_func=unstable_api_call,
        retry_policy=RetryPolicy(max_attempts=5),  # 最多5次尝试，足够重试成功
    )
    try:
        result = default_graph.invoke({"result": ""})
        print(f"最终结果: {result}\n")
    except Exception as e:
        print(f"最终失败: {type(e).__name__}: {e}\n")


# 测试方法2：自定义重试策略（输出完全匹配要求）
def test_custom_retry():
    global attempt_counter
    print("2. 使用自定义重试策略:")
    print("   自定义策略只对特定错误进行重试\n")
    print("测试自定义重试策略:")
    attempt_counter = 0  # 重置计数器
    custom_graph = build_retry_graph(
        node_name="custom_retry_api",
        node_func=unstable_api_call,
        retry_policy=RetryPolicy(max_attempts=5, retry_on=custom_retry_on),
    )
    try:
        result = custom_graph.invoke({"result": ""})
        print(f"最终结果: {result}\n")
    except Exception as e:
        print(f"最终失败: {type(e).__name__}: {e}\n")


# 测试方法3：不可重试异常演示,测试 ValueError（默认策略不会重试）
def test_no_retry_exception():
    print("3. 测试不会重试的异常类型:")
    print("测试 ValueError（默认策略不会重试）:")
    no_retry_graph = build_retry_graph(
        node_name="value_error_node",
        node_func=value_error_call,
        retry_policy=RetryPolicy(max_attempts=3),
    )
    try:
        result = no_retry_graph.invoke({"result": ""})
        print(f"最终结果: {result}\n")
    except Exception as e:
        print(f"最终失败: {type(e).__name__}: {e}\n")


# 主演示函数
def run_demo():
    print("=== LangGraph 节点重试策略完整演示===")
    print("-" * 80 + "\n")
    # test_default_retry()
    # test_custom_retry()
    test_no_retry_exception()
    print("-" * 80)
    print("=== 演示结束 ===")


# 程序入口
if __name__ == "__main__":
    run_demo()


"""
【输出示例】
=== LangGraph 节点重试策略完整演示===
--------------------------------------------------------------------------------

3. 测试不会重试的异常类型:
测试 ValueError（默认策略不会重试）:
调用会抛出 ValueError 的节点
最终失败: ValueError: 模拟 ValueError 异常

--------------------------------------------------------------------------------
=== 演示结束 ===
"""

```

学完 Node 这一节后，你至少应该建立这个认识：**节点不只是“一个函数”，它还是图里的一个可配置执行单元，可以挂缓存、挂重试策略，也可以明确入口和出口。**

------

## 2、Graph API 之 Edge（边）

### 2.1 定义

如果说 Node 决定“这一站做什么”，那 **Edge（边）** 决定的就是：**这一站做完之后，下一步去哪里。** 边不是装饰性的连线，而是图的**流程控制规则**。

LangGraph 里最基础的两类边是：

- **普通边（Normal Edge）**：固定从 A 到 B
- **条件边（Conditional Edge）**：根据当前状态决定下一步去哪

围绕这两类边，又会延伸出：

- **入口点（Entry Point）**
- **条件入口点（Conditional Entry Point）**

它们共同回答的都是一个问题：**这张图到底怎么流转。**

```mermaid
flowchart TD
    START([START])

    START -->|初始输入| 条件入口点{条件入口点<br/>进图前先分类}
    START --> 入口点[入口点<br/>固定起点]

    条件入口点 -.问候.-> 节点A[节点 A]
    条件入口点 -.问答.-> 节点C[节点 C]

    入口点 --> 节点A

    节点A --> 普通边[普通边<br/>固定下一步]
    节点A --> 条件边{条件边<br/>按 State 路由}

    普通边 --> 节点B[节点 B]

    条件边 -- 条件 1 --> 节点B
    条件边 -- 条件 2 --> 节点C
```

**图注：** 普通边固定走向；条件边用函数选下一跳；入口点决定首次进入哪个节点；条件入口点在首跳前就做路由（适合“一进图先分类”）。

### 2.2 边的作用

很多人最开始会把注意力都放在节点函数本身，觉得“反正每个节点写好就行”。但从工作流角度看，真正决定图长什么样的，往往是边。

下面这些差别，主要由边来决定：

- 是固定顺序执行，还是动态路由
- 是单入口，还是入口就分流
- 是一条线走到底，还是中间多分支汇聚
- 是普通顺序链，还是更接近小型决策系统

所以可以说：**Node 让图有处理能力**、**Edge 让图有流程结构**。

### 2.3 普通边（Normal Edges）

普通边是最容易理解的一种：**执行完当前节点后，无条件进入下一个节点。**

最典型的写法就是：

```python
builder.add_edge("node_a", "node_b")
```

这行代码的意思很简单：`node_a` 跑完，就去 `node_b`，没有判断、没有分支。

![固定边示例：`add_edge` 串联 START → input → process → output → END 与对应有向图](https://didilili.github.io/ai-agents-from-zero/images/24/24-2-3-1.jpeg)

**图注：** 左侧为课件示例代码，右侧为线性拓扑；编译时若边指向未注册的节点会报错。

普通边的学习重点不只是会写 `add_edge`，而是建立一个直觉：图最基础的形态就是一条固定路径。很多复杂图，都是先从普通边搭出来，再逐步加入条件边、Send、Command。

### 2.4 案例：普通边

这个案例演示的是最基础的线性图：`START -> node_a -> node_b -> node_c -> END`

重点不是业务逻辑，而是看清楚：**当边是固定的，图就像一条声明式的工作流链。**

【案例源码】`案例与源码-3-LangGraph框架/05-edge/Edge_Normal.py`

```py
"""
【案例】普通边（Normal Edges）：用 add_edge 串联节点，形成固定执行顺序 START → node_a → node_b → node_c → END，无条件跳转。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 2、Graph API 之 Edge（边）

知识点速览：
- 普通边：add_edge(源节点, 目标节点)，表示执行完源节点后必定进入目标节点，无分支。
- START、END 为 LangGraph 内置虚拟节点，分别表示图入口与出口。
- 线性链是最简单的图结构，适合理解“节点负责处理、边负责流转”这条主线。
"""

from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END


# 定义状态
class DiliState(TypedDict):
    value: int
    step: str


# 定义节点函数
def node_a(state: DiliState) -> dict:
    """节点A"""
    print("执行节点A")
    return {"value": state["value"] + 1, "step": "A执行完毕"}


def node_b(state: DiliState) -> dict:
    """节点B"""
    print("执行节点B")
    return {"value": state["value"] * 2, "step": "B执行完毕"}


def node_c(state: DiliState) -> dict:
    """节点C"""
    print("执行节点C")
    return {"value": state["value"] - 1, "step": "C执行完毕"}


def main():
    """演示普通边"""
    print("=== 普通边演示 ===")

    # 创建图
    builder = StateGraph(DiliState)

    # 添加节点
    builder.add_node("node_a", node_a)
    builder.add_node("node_b", node_b)
    builder.add_node("node_c", node_c)

    # 添加普通边
    builder.add_edge(START, "node_a")  # 从开始到A
    builder.add_edge("node_a", "node_b")  # 从A到B
    builder.add_edge("node_b", "node_c")  # 从B到C
    builder.add_edge("node_c", END)  # 从C到结束

    # 编译图
    app = builder.compile()

    # 执行图
    result = app.invoke({"value": 1})
    print(f"执行结果: {result}\n")
    # 打印图的边和节点信息
    print(builder.edges)
    # print(builder.nodes)
    # 打印图的ascii可视化结构
    print(app.get_graph().print_ascii())
    print("=================================")
    print()
    # 打印图的可视化结构，生成更加美观的Mermaid 代码，通过processon 编辑器查看
    print(app.get_graph().draw_mermaid())


if __name__ == "__main__":
    main()

"""
【输出示例】
=== 普通边演示 ===
执行节点A
执行节点B
执行节点C
执行结果: {'value': 3, 'step': 'C执行完毕'}

{('node_b', 'node_c'), ('__start__', 'node_a'), ('node_a', 'node_b'), ('node_c', '__end__')}
+-----------+  
| __start__ |  
+-----------+  
      *        
      *        
      *        
  +--------+   
  | node_a |   
  +--------+   
      *        
      *        
      *        
  +--------+   
  | node_b |   
  +--------+   
      *        
      *        
      *        
  +--------+   
  | node_c |   
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
        node_a(node_a)
        node_b(node_b)
        node_c(node_c)
        __end__([<p>__end__</p>]):::last
        __start__ --> node_a;
        node_a --> node_b;
        node_b --> node_c;
        node_c --> __end__;
        classDef default fill:#f2f0ff,line-height:1.2
        classDef first fill-opacity:0
        classDef last fill:#bfb6fc

"""

```

### 2.5 条件边（Conditional Edges）

当流程不是“固定从 A 到 B”，而是“做完 A 后，要根据当前状态决定下一步去哪”，就需要条件边。

LangGraph 常见写法是：

```python
graph.add_conditional_edges("node_a", route_fn, mapping)
```

这里可以拆成三部分理解：

- `"node_a"`：从哪个节点出发做路由
- `route_fn`：根据当前状态返回路由结果
- `mapping`：把路由结果映射到具体目标节点

比起 API 形式，更应该先抓住这句：

**条件边 = 节点执行完后，再根据当前状态决定下一步去哪。**

<svg id="mermaid-svg-1" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 734.664px; transform: translate(0px, 0px) scale(1); transform-origin: 0px 0px;" viewBox="-8 -8 734.6640625 216.5" role="graphics-document document" aria-roledescription="flowchart-v2"><g><marker id="mermaid-svg-1_flowchart-pointEnd" class="marker flowchart" viewBox="0 0 10 10" refX="6" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-1_flowchart-pointStart" class="marker flowchart" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-1_flowchart-circleEnd" class="marker flowchart" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="mermaid-svg-1_flowchart-circleStart" class="marker flowchart" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="mermaid-svg-1_flowchart-crossEnd" class="marker cross flowchart" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-1_flowchart-crossStart" class="marker cross flowchart" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M66.188,100.25L70.354,100.25C74.521,100.25,82.854,100.25,90.304,100.25C97.754,100.25,104.321,100.25,107.604,100.25L110.888,100.25" id="L-start-router-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-start LE-router" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-1_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M207.992,100.25L212.159,100.25C216.326,100.25,224.659,100.25,232.192,100.316C239.726,100.382,246.46,100.514,249.826,100.58L253.193,100.646" id="L-router-route-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-router LE-route" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-1_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M387.919,71.966L403.778,62.763C419.637,53.561,451.356,35.155,477.477,25.953C503.598,16.75,524.122,16.75,534.383,16.75L544.645,16.75" id="L-route-n1-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-route LE-n1" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-1_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M416.703,100.75L427.765,100.667C438.827,100.583,460.951,100.417,482.274,100.333C503.598,100.25,524.122,100.25,534.383,100.25L544.645,100.25" id="L-route-n2-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-route LE-n2" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-1_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M387.919,129.534L403.778,138.57C419.637,147.606,451.356,165.678,477.477,174.714C503.598,183.75,524.122,183.75,534.383,183.75L544.645,183.75" id="L-route-n3-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-route LE-n3" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-1_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M616.695,16.75L620.862,16.75C625.029,16.75,633.362,16.75,643.861,27.121C654.36,37.492,667.025,58.234,673.358,68.605L679.69,78.977" id="L-n1-finish-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-n1 LE-finish" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-1_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M616.695,100.25L620.862,100.25C625.029,100.25,633.362,100.25,640.812,100.25C648.262,100.25,654.829,100.25,658.112,100.25L661.395,100.25" id="L-n2-finish-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-n2 LE-finish" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-1_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M616.695,183.75L620.862,183.75C625.029,183.75,633.362,183.75,643.861,173.379C654.36,163.008,667.025,142.266,673.358,131.895L679.69,121.523" id="L-n3-finish-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-n3 LE-finish" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-1_flowchart-pointEnd)" data-darkreader-inline-fill=""></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(483.07421875, 16.75)"><g class="label" transform="translate(-41.87109375, -9.25)"><foreignObject width="83.7421875" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;">condition_1</span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(483.07421875, 100.25)"><g class="label" transform="translate(-41.87109375, -9.25)"><foreignObject width="83.7421875" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;">condition_2</span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(483.07421875, 183.75)"><g class="label" transform="translate(-41.87109375, -9.25)"><foreignObject width="83.7421875" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;">condition_3</span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default default flowchart-label" id="flowchart-start-25" data-node="true" data-id="start" transform="translate(33.09375, 100.25)"><rect style="" rx="16.75" ry="16.75" x="-33.09375" y="-16.75" width="66.1875" height="33.5"></rect><g class="label" style="" transform="translate(-21.40625, -9.25)"><rect></rect><foreignObject width="42.8125" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">START</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-router-26" data-node="true" data-id="router" transform="translate(162.08984375, 100.25)"><rect class="basic label-container" style="" rx="0" ry="0" x="-45.90234375" y="-27.5" width="91.8046875" height="55"></rect><g class="label" style="" transform="translate(-38.40234375, -20)"><rect></rect><foreignObject width="76.8046875" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">路由节点<br style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box;">node_a</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-route-28" data-node="true" data-id="route" transform="translate(337.09765625, 100.25)"><polygon points="79.10546875,0 158.2109375,-79.10546875 79.10546875,-158.2109375 0,-79.10546875" class="label-container" transform="translate(-79.10546875,79.10546875)" style=""></polygon><g class="label" style="" transform="translate(-54.85546875, -9.25)"><rect></rect><foreignObject width="109.7109375" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">route_fn(state)</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-n1-30" data-node="true" data-id="n1" transform="translate(583.3203125, 16.75)"><rect class="basic label-container" style="" rx="0" ry="0" x="-33.375" y="-16.75" width="66.75" height="33.5"></rect><g class="label" style="" transform="translate(-25.875, -9.25)"><rect></rect><foreignObject width="51.75" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">node_1</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-n2-32" data-node="true" data-id="n2" transform="translate(583.3203125, 100.25)"><rect class="basic label-container" style="" rx="0" ry="0" x="-33.375" y="-16.75" width="66.75" height="33.5"></rect><g class="label" style="" transform="translate(-25.875, -9.25)"><rect></rect><foreignObject width="51.75" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">node_2</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-n3-34" data-node="true" data-id="n3" transform="translate(583.3203125, 183.75)"><rect class="basic label-container" style="" rx="0" ry="0" x="-33.375" y="-16.75" width="66.75" height="33.5"></rect><g class="label" style="" transform="translate(-25.875, -9.25)"><rect></rect><foreignObject width="51.75" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">node_3</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-finish-36" data-node="true" data-id="finish" transform="translate(692.6796875, 100.25)"><rect style="" rx="16.75" ry="16.75" x="-25.984375" y="-16.75" width="51.96875" height="33.5"></rect><g class="label" style="" transform="translate(-14.296875, -9.25)"><rect></rect><foreignObject width="28.59375" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">END</span></div></foreignObject></g></g></g></g></g></svg>



### 2.6 案例：条件边

这两个案例共同说明一件事：**条件边是在图层做路由，而不是把所有判断都塞回节点函数内部。**

你可以重点观察：

- 一个案例用布尔值或简单条件做分支
- 另一个案例用字符串 key + mapping 做多分支映射

【案例源码】`案例与源码-3-LangGraph框架/05-edge/Edge_Conditional.py`、`Edge_ConditionalV2.py`

```py
"""
【案例】条件边（Conditional Edges）：根据状态（如 x 的奇偶）在多个后继节点中选一个执行，使用 add_conditional_edges(节点名, 路由函数, 映射)。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 2、Graph API 之 Edge（边）

知识点速览：
- add_conditional_edges(source, route_fn, mapping)：route_fn(state) 的返回值作为 key，在 mapping 中查到下一节点名；若为 bool，常用 {True: "node_a", False: "node_b"}。
- 条件边的重点是“让边负责分流，而不是把所有 if/else 都塞回节点里”；路由函数在 source 节点执行后被调用，根据当前 state 决定下一跳。
- 本例顺手演示了 State 也可以用 Pydantic BaseModel 定义，这更适合需要默认值和校验的场景。
"""

from typing import Optional
from langgraph.constants import START, END
from langgraph.graph import StateGraph
from loguru import logger
from pydantic import BaseModel


class MyState(BaseModel):
    """
    定义状态模型，用于在图节点之间传递数据
    Attributes:
        x (int): 输入的整数
        result (Optional[str]): 处理结果，可为"even"或"odd"
    """

    x: int
    result: Optional[str] = None


# 检查输入状态的节点函数
def check_x(state: MyState) -> MyState:
    """
    检查输入状态的节点函数
    Args:
        state (MyState): 包含输入数据的状态对象
    Returns:
        MyState: 返回原始状态对象，未做修改
    """
    logger.info(f"[check_x] Received state: {state}")
    return state


# 判断状态中x值是否为偶数的条件函数
def is_even(state: MyState) -> bool:
    """
    判断状态中x值是否为偶数的条件函数
    Args:
        state (MyState): 包含待判断数值的状态对象
    Returns:
        bool: 如果x是偶数返回True，否则返回False
    """
    return state.x % 2 == 0


# 处理偶数情况的节点函数
def handle_even(state: MyState) -> MyState:
    """
    处理偶数情况的节点函数
    Args:
        state (MyState): 包含偶数输入的状态对象
    Returns:
        MyState: 返回更新后的状态对象，result设置为"even"
    """
    logger.info("[handle_even] x 是偶数")
    return MyState(x=state.x, result="even")


# 处理奇数情况的节点函数
def handle_odd(state: MyState) -> MyState:
    """
    处理奇数情况的节点函数
    Args:
        state (MyState): 包含奇数输入的状态对象
    Returns:
        MyState: 返回更新后的状态对象，result设置为"odd"
    """
    logger.info("[handle_odd] x 是奇数")
    return MyState(x=state.x, result="odd")


builder = StateGraph(MyState)
# 添加节点
builder.add_node("check_x", check_x)
builder.add_node("handle_even", handle_even)
builder.add_node("handle_odd", handle_odd)


# 添加条件边，根据is_even函数的返回值决定流向哪个节点
builder.add_conditional_edges(
    "check_x", is_even, {True: "handle_even", False: "handle_odd"}
)

# 添加起始边，从START节点流向check_x节点
builder.add_edge(START, "check_x")

# 添加结束边，从处理节点流向END节点
builder.add_edge("handle_even", END)
builder.add_edge("handle_odd", END)

# 编译图结构
graph = builder.compile()

# 打印图的可视化结构
print(graph.get_graph().print_ascii())

# 测试用例：输入偶数4
logger.info("输入 x=4（偶数）")
graph.invoke(MyState(x=4))

# # 测试用例：输入奇数3
# logger.info("输入 x=3（奇数）")
# graph.invoke(MyState(x=3))

"""
【输出示例】
              +-----------+               
              | __start__ |               
              +-----------+               
                    *                     
                    *                     
                    *                     
               +---------+                
               | check_x |                
               +---------+                
             ...          ..              
            .               ..            
          ..                  ..          
+-------------+           +------------+  
| handle_even |           | handle_odd |  
+-------------+           +------------+  
             ***          **              
                *       **                
                 **   **                  
               +---------+                
               | __end__ |                
               +---------+                
None
2026-03-23 16:38:23.954 | INFO     | __main__:<module>:108 - 输入 x=4（偶数）
2026-03-23 16:38:23.955 | INFO     | __main__:check_x:40 - [check_x] Received state: x=4 result=None
2026-03-23 16:38:23.955 | INFO     | __main__:handle_even:65 - [handle_even] x 是偶数
"""

"""
【案例】条件边另一种写法：路由函数返回字符串 key（如 "condition_1"），在 add_conditional_edges 的 mapping 中映射到不同节点；可从 START 直接根据 state 分支到多个节点之一。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 2、Graph API 之 Edge（边）

知识点速览：
- add_conditional_edges(START, route_fn, {"condition_1": "node1", "condition_2": "node2", ...})：路由函数返回的字符串与 mapping 的 key 匹配，决定从 START 进入哪个节点。
- 适合「多分支入口」：根据初始 state 的某个字段（如 x）决定第一跳，再各自到 END。
- 它和上一份条件边案例的区别不在 API 本身，而在于这里强调的是“字符串路由键 + mapping”的多分支入口写法。
"""

from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Annotated


# 定义状态
class DiliState(TypedDict):
    x: int


def addition1(state):
    """
    执行加法运算的节点函数
    参数:
        state (dict): 包含输入数据的状态字典，必须包含键"x"
    返回:
        dict: 返回更新后的状态字典，其中"x"的值增加1
    """
    print(f"加法节点addition1收到的初始值:{state}")
    return {"x": state["x"] + 1}


def addition2(state):
    print(f"加法节点addition2收到的初始值:{state}")
    return {"x": state["x"] + 2}


def addition3(state):
    print(f"加法节点addition3收到的初始值:{state}")
    return {"x": state["x"] + 3}


def route_by_sentiment(state: DiliState) -> str:
    # 路由逻辑...返回最终的条件
    flag = state["x"]
    if flag == 1:
        return "condition_1"
    elif flag == 2:
        return "condition_2"
    else:
        return "condition_3"


graph = StateGraph(DiliState)
graph.add_node("node1", addition1)
graph.add_node("node2", addition2)
graph.add_node("node3", addition3)
# 添加路由函数，参数：当前节点，路由函数，路由函数返回的条件与node的映射
graph.add_conditional_edges(
    START,
    route_by_sentiment,
    {"condition_1": "node1", "condition_2": "node2", "condition_3": "node3"},
)

# 所有处理节点都连接到END
graph.add_edge("node1", END)
graph.add_edge("node2", END)
graph.add_edge("node3", END)
app = graph.compile()
# 定义一个初始状态字典，包含键值对"x": 具体数字
initial_state = {"x": 3}
# 调用graph对象的invoke方法，传入初始状态，执行图计算流程
result = app.invoke(initial_state)
print(f"最后的结果是:{result}")


# 打印图的边和节点信息
# print(graph.edges)
# print(graph.nodes)
# 打印图的ascii可视化结构
print(app.get_graph().print_ascii())
print("=================================")
print()
# 打印图的可视化结构，生成更加美观的Mermaid 代码，通过processon 编辑器查看
print(app.get_graph().draw_mermaid())

"""
【输出示例】
加法节点addition3收到的初始值:{'x': 3}
最后的结果是:{'x': 6}
                +-----------+                  
                | __start__ |                  
                +-----------+..                
             ...      .        ...             
          ...         .           ...          
        ..            .              ..        
+-------+         +-------+         +-------+  
| node1 |*        | node2 |         | node3 |  
+-------+ ***     +-------+       **+-------+  
             ***      *        ***             
                ***   *     ***                
                   ** *   **                   
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
        node1(node1)
        node2(node2)
        node3(node3)
        __end__([<p>__end__</p>]):::last
        __start__ -. &nbsp;condition_1&nbsp; .-> node1;
        __start__ -. &nbsp;condition_2&nbsp; .-> node2;
        __start__ -. &nbsp;condition_3&nbsp; .-> node3;
        node1 --> __end__;
        node2 --> __end__;
        node3 --> __end__;
        classDef default fill:#f2f0ff,line-height:1.2
        classDef first fill-opacity:0
        classDef last fill:#bfb6fc
"""

```

### 2.7 入口点与条件入口点

前面的条件边是在“某个节点执行完之后再分支”，而入口点相关能力解决的是另一个问题：**图一开始从哪里进入。**

最常见的两种情况是：

- **入口点（Entry Point）**：图总是从同一个节点开始
- **条件入口点（Conditional Entry Point）**：图启动时，就要先判断输入，再决定从哪个节点开始

可以这样区分：

- **普通入口点**：固定起点
- **条件入口点**：动态起点

这一点在真实项目里特别有用，因为很多系统刚接到请求时，就需要先做一级路由。比如：

- 问候语走问候处理
- 告别语走结束处理
- 普通问题走问答流程

### 2.8 案例：入口点与条件入口点

这两个案例分别对应：

- 用 `set_entry_point` / `set_finish_point` 指定固定入口出口
- 从 `START` 上直接挂条件边，按初始输入决定进入哪条处理链

【案例源码】`案例与源码-3-LangGraph框架/05-edge/Edge_EntryPoint.py`、`Edge_ConditionalEntryPoint.py`

```py
"""
【案例】入口点与出口点：用 set_entry_point / set_finish_point 指定图的第一个和最后一个节点，等价于 add_edge(START, node) 与 add_edge(node, END)，写法更简洁。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 2、Graph API 之 Edge（边）

知识点速览：
- set_entry_point(node_id)：图从该节点开始执行，底层等价于 add_edge(START, node_id)。
- set_finish_point(node_id)：执行到该节点后图结束，底层等价于 add_edge(node_id, END)。
- 适合线性链或单入口单出口的图，减少重复写 START/END 边。
- 本例重点是理解“入口/出口的声明方式”，不是引入新类型的边；它本质上仍然是在配置普通边。
"""

from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END


# 定义状态
class DiliState(TypedDict):
    value: int
    step: str


# 定义节点函数
def node_a(state: DiliState) -> dict:
    """节点A"""
    print("执行节点A")
    print("state[value]:" + str(state["value"]))
    print("state[step]:" + str(state["step"]))
    return {"value": state["value"] + 1, "step": "A执行完毕"}


def node_b(state: DiliState) -> dict:
    """节点B"""
    print("执行节点B")
    return {"value": state["value"] * 2, "step": "B执行完毕"}


def main():
    """演示入口点"""
    print("=== 入口点演示 ===")

    # 创建图
    builder = StateGraph(DiliState)

    # 添加节点
    builder.add_node("node_a", node_a)
    builder.add_node("node_b", node_b)

    # set_entry_point / set_finish_point 是更简洁的入口出口配置方式，本质上仍然是在帮你建立 START/END 的边
    builder.set_entry_point("node_a")
    builder.add_edge("node_a", "node_b")
    builder.set_finish_point("node_b")

    # 编译图
    graph = builder.compile()
    # 执行图
    result = graph.invoke({"value": 0, "step": "hello"})
    print(f"执行结果: {result}\n")

    print()
    # 打印图的ascii可视化结构
    print(graph.get_graph().print_ascii())
    print("=================================")
    print()
    # 打印图的可视化结构，生成更加美观的Mermaid 代码，通过processon 编辑器查看
    print(graph.get_graph().draw_mermaid())


if __name__ == "__main__":
    main()

"""
【输出示例】
=== 入口点演示 ===
执行节点A
state[value]:0
state[step]:hello
执行节点B
执行结果: {'value': 2, 'step': 'B执行完毕'}


+-----------+  
| __start__ |  
+-----------+  
      *        
      *        
      *        
  +--------+   
  | node_a |   
  +--------+   
      *        
      *        
      *        
  +--------+   
  | node_b |   
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
        node_a(node_a)
        node_b(node_b)
        __end__([<p>__end__</p>]):::last
        __start__ --> node_a;
        node_a --> node_b;
        node_b --> __end__;
        classDef default fill:#f2f0ff,line-height:1.2
        classDef first fill-opacity:0
        classDef last fill:#bfb6fc
"""

"""
【案例】条件入口点：从 START 开始就根据状态分支，使用 add_conditional_edges(START, route_fn, mapping)，根据初始输入（如 user_input）决定进入哪个处理节点。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 2、Graph API 之 Edge（边）

知识点速览：
- add_conditional_edges(START, route_input, {"greeting": "greeting_node", ...})：invoke 传入的 state 先交给 route_input，返回值作为 key 在 mapping 中查下一节点，实现「不同输入走不同入口」。
- 与「条件边」区别：条件边是“某节点执行完后”再分支；条件入口点是“图一启动”就分支，常用于做一级路由。
- 本例重点是理解“图从哪里开始”可以由输入动态决定；至于问候、告别、问题这三类文案本身，只是为了帮助观察路由效果。
"""

from typing import TypedDict
from langgraph.graph import StateGraph, START, END


# 1. 定义简单的状态
class SimpleState(TypedDict):
    user_input: str
    response: str
    node_visited: str


# 2. 路由函数 - 决定从START去哪
def route_input(state: SimpleState) -> str:
    """根据用户输入决定去哪个节点"""
    text = state["user_input"].lower()

    if "hello" in text or "hi" in text:
        return "greeting"  # 返回路由键
    elif "bye" in text or "exit" in text:
        return "farewell"  # 返回路由键
    else:
        return "question"  # 返回路由键


# 3. 各个处理节点
def handle_greeting(state: SimpleState) -> SimpleState:
    """处理问候"""
    state["response"] = "你好！很高兴见到你！"
    state["node_visited"] = "greeting_node"
    return state


def handle_farewell(state: SimpleState) -> SimpleState:
    """处理告别"""
    state["response"] = "再见！祝你有个美好的一天！"
    state["node_visited"] = "farewell_node"
    return state


def handle_question(state: SimpleState) -> SimpleState:
    """处理问题"""
    state["response"] = "我听到了你的问题，需要更多帮助吗？"
    state["node_visited"] = "question_node"
    return state


# 4. 创建图
def create_simple_graph():
    """创建一个简单的图"""
    stateGraph = StateGraph(SimpleState)

    # 添加节点
    stateGraph.add_node("greeting_node", handle_greeting)
    stateGraph.add_node("farewell_node", handle_farewell)
    stateGraph.add_node("question_node", handle_question)

    # 条件入口点：图从 START 进入后，先调用 route_input，再根据 mapping 决定第一跳去哪个业务节点
    stateGraph.add_conditional_edges(
        START,  # 起点
        route_input,  # 路由函数
        # 路由映射（可选）：路由函数的返回值 -> 节点名
        {
            "greeting": "greeting_node",  # route_input返回"greeting"时，去greeting_node
            "farewell": "farewell_node",  # route_input返回"farewell"时，去farewell_node
            "question": "question_node",  # route_input返回"question"时，去question_node
        },
    )

    # 所有节点都到END
    stateGraph.add_edge("greeting_node", END)
    stateGraph.add_edge("farewell_node", END)
    stateGraph.add_edge("question_node", END)

    return stateGraph.compile()


# 5. 使用示例
def run_example():
    # 创建图
    graph = create_simple_graph()
    # 测试不同的输入
    test_inputs = ["Hello everyone!", "Goodbye now", "What time is it?"]

    for user_input in test_inputs:
        print(f"\n输入: {user_input}")
        print("-" * 30)

        # 创建初始状态
        initial_state = SimpleState(user_input=user_input, response="", node_visited="")

        # 执行图
        result = graph.invoke(initial_state)

        print(f"路由决策: {route_input(initial_state)}")
        print(f"访问的节点: {result['node_visited']}")
        print(f"响应: {result['response']}")

    print()
    # 打印图的ascii可视化结构
    print(graph.get_graph().print_ascii())
    print("=================================")
    print()
    # 打印图的可视化结构，生成更加美观的Mermaid 代码，通过processon 编辑器查看
    print(graph.get_graph().draw_mermaid())


# 运行示例
if __name__ == "__main__":
    print("简单条件入口点示例")
    print("=" * 40)
    run_example()


"""
【输出示例】
简单条件入口点示例
========================================

输入: Hello everyone!
------------------------------
路由决策: greeting
访问的节点: greeting_node
响应: 你好！很高兴见到你！

输入: Goodbye now
------------------------------
路由决策: farewell
访问的节点: farewell_node
响应: 再见！祝你有个美好的一天！

输入: What time is it?
------------------------------
路由决策: question
访问的节点: question_node
响应: 我听到了你的问题，需要更多帮助吗？

                              +-----------+                                
                              | __start__ |.                               
                         .....+-----------+ .....                          
                     ....           .            ....                      
                .....               .                .....                 
             ...                    .                     ...              
+---------------+           +---------------+           +---------------+  
| farewell_node |           | greeting_node |           | question_node |  
+---------------+****       +---------------+        ***+---------------+  
                     ****           *            ****                      
                         *****      *       *****                          
                              ***   *    ***                               
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
        greeting_node(greeting_node)
        farewell_node(farewell_node)
        question_node(question_node)
        __end__([<p>__end__</p>]):::last
        __start__ -. &nbsp;farewell&nbsp; .-> farewell_node;
        __start__ -. &nbsp;greeting&nbsp; .-> greeting_node;
        __start__ -. &nbsp;question&nbsp; .-> question_node;
        farewell_node --> __end__;
        greeting_node --> __end__;
        question_node --> __end__;
        classDef default fill:#f2f0ff,line-height:1.2
        classDef first fill-opacity:0
        classDef last fill:#bfb6fc
"""

```

### 2.9 条件边还能构成循环结构

条件边不只能做分支，也能做循环。

例如：

- 某个节点先做一次判断
- 如果条件满足，就继续走下一个处理节点
- 处理完后再回到前一个判断节点
- 直到某个终止条件满足，再走向 `END`

这类结构在 LangGraph 里很常见，尤其是：

- Agent 的 ReAct 循环
- “检索不够就继续补检索”的循环
- 多步规划执行里的“继续 / 停止”判断

ReAct 就是最典型的例子：输入进入模型节点，模型可能直接输出，也可能先调用工具；工具结果再回到模型节点，由模型继续判断是否已经可以回答。

![ReAct 循环示意：input 进入 model，model 可调用 tools，tools 结果再回到 model，最终输出 output](https://didilili.github.io/ai-agents-from-zero/images/24/24-2-9-1.png)

这类循环之所以适合 LangGraph，是因为它有几个天然难点：

- 下一步不是固定的，模型可能选择工具，也可能直接回答。
- 工具结果需要回写 State，下一轮模型判断要能读到。
- 循环必须有退出条件，否则会一直“模型想一想、工具查一查、再想一想”。
- 线上项目还要能观察当前跑了几轮、卡在哪一步、是否需要人工介入。

但循环结构有一个隐藏风险：**如果终止条件设计得不对，图可能一直循环下去。**

LangGraph 为此提供了 `recursion_limit` 这类保护机制。它的作用就是：**给图执行设置一个上限，防止工作流无休止地反复调度。**

这里的重点不在于死记默认值，而是把循环当成一种需要设计边界的流程结构：

- 条件边可以形成循环
- 循环结构必须认真设计终止条件，例如“没有工具调用了”“评分达标了”“重试次数达到上限了”
- 真实项目里最好配合 `recursion_limit` 这类步数保护，避免图跑飞
- 一旦触发递归限制，应当把它当成流程设计信号，而不是简单把数字调大了事

### 2.10 边的选型

学完这一节后，重点不在于背“有几种边”，而在于知道什么时候该选哪一种：

| 场景                           | 更适合的做法 | 理解方式         |
| ------------------------------ | ------------ | ---------------- |
| 步骤固定，先后顺序明确         | 普通边       | 一条声明式流水线 |
| 某一步之后要按状态分流         | 条件边       | 节点后置路由     |
| 图总是从同一个地方开始         | 入口点       | 固定起点         |
| 图一开始就要先分类再进不同流程 | 条件入口点   | 动态起点         |

常见误区是：一看到判断，就把大量 `if/else` 全写进节点里。更稳的做法是：**节点负责处理，边负责流转。** 这样图结构更清楚，也更容易可视化和调试。

------

## 3、Send、Command 与 Runtime 上下文

### 3.1 三类问题

学完 Node 和 Edge 之后，你已经能搭出很多正常的图了。但真实项目里很快会遇到三类更复杂的问题：

- 下一步不是固定一个节点，而是一批动态生成的子任务。
- 某个节点不仅要更新状态，还要决定下一跳。
- 某些配置不属于 State，但节点运行时必须拿得到。

Send、Command、Runtime 分别就是在回答这三类问题。

从这一节开始，我们看的就是普通节点、普通边、条件边之外更灵活的控制原语。

### 3.2 Send：动态分发

`Send` 主要解决的问题是：**上游节点产出了一批任务，任务数量运行时才知道，而你想把这批任务分发给同一个下游节点分别处理。**

这正是典型的 Map-Reduce 思路：

- **Map**：先把大任务拆成很多小任务
- **Reduce**：小任务各自完成后，再把结果汇总

LangGraph 里，条件边函数可以返回 `Sequence[Send]`。每个 `Send` 都包含两部分：

- 目标节点名
- 要传给该节点的那份状态

`Send` 允许图在运行时动态决定开出多少条分支，而且每条分支可以拿到不同版本的状态。并行分支写回同一状态字段时，通常要在 State 上配置合适的 Reducer（例如列表追加），否则结果难以汇总。

<svg id="mermaid-svg-2" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 896.242px; transform: translate(0px, 0px) scale(1); transform-origin: 0px 0px;" viewBox="-8 -8 896.2421875 216.5" role="graphics-document document" aria-roledescription="flowchart-v2"><g><marker id="mermaid-svg-2_flowchart-pointEnd" class="marker flowchart" viewBox="0 0 10 10" refX="6" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-2_flowchart-pointStart" class="marker flowchart" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-2_flowchart-circleEnd" class="marker flowchart" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="mermaid-svg-2_flowchart-circleStart" class="marker flowchart" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="mermaid-svg-2_flowchart-crossEnd" class="marker cross flowchart" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-2_flowchart-crossStart" class="marker cross flowchart" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M66.188,100.25L70.354,100.25C74.521,100.25,82.854,100.25,90.304,100.25C97.754,100.25,104.321,100.25,107.604,100.25L110.888,100.25" id="L-start-split-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-start LE-split" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-2_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M246.391,100.25L250.557,100.25C254.724,100.25,263.057,100.25,270.507,100.25C277.957,100.25,284.524,100.25,287.807,100.25L291.091,100.25" id="L-split-send_node-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-split LE-send_node" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-2_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M388.812,71.25L400.377,62.167C411.941,53.083,435.07,34.917,454.219,25.833C473.369,16.75,488.538,16.75,496.123,16.75L503.708,16.75" id="L-send_node-worker1-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-send_node LE-worker1" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-2_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M407.391,100.25L415.859,100.25C424.327,100.25,441.263,100.25,457.316,100.25C473.369,100.25,488.538,100.25,496.123,100.25L503.708,100.25" id="L-send_node-worker2-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-send_node LE-worker2" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-2_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M388.812,129.25L400.377,138.333C411.941,147.417,435.07,165.583,454.219,174.667C473.369,183.75,488.538,183.75,496.123,183.75L503.708,183.75" id="L-send_node-worker3-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-send_node LE-worker3" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-2_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M573.734,16.75L577.901,16.75C582.068,16.75,590.401,16.75,607.203,27.066C624.005,37.383,649.276,58.015,661.911,68.332L674.546,78.648" id="L-worker1-merge_node-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-worker1 LE-merge_node" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-2_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M573.734,100.25L577.901,100.25C582.068,100.25,590.401,100.25,597.851,100.25C605.301,100.25,611.868,100.25,615.151,100.25L618.434,100.25" id="L-worker2-merge_node-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-worker2 LE-merge_node" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-2_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M573.734,183.75L577.901,183.75C582.068,183.75,590.401,183.75,607.203,173.434C624.005,163.117,649.276,142.485,661.911,132.168L674.546,121.852" id="L-worker3-merge_node-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-worker3 LE-merge_node" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-2_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M778.273,100.25L782.44,100.25C786.607,100.25,794.94,100.25,802.39,100.25C809.84,100.25,816.407,100.25,819.69,100.25L822.973,100.25" id="L-merge_node-finish-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-merge_node LE-finish" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-2_flowchart-pointEnd)" data-darkreader-inline-fill=""></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(458.19921875, 16.75)"><g class="label" transform="translate(-25.80859375, -10.75)"><foreignObject width="51.6171875" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;">参数 1</span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(458.19921875, 100.25)"><g class="label" transform="translate(-25.80859375, -10.75)"><foreignObject width="51.6171875" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;">参数 2</span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(458.19921875, 183.75)"><g class="label" transform="translate(-25.80859375, -10.75)"><foreignObject width="51.6171875" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;">参数 3</span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default default flowchart-label" id="flowchart-start-41" data-node="true" data-id="start" transform="translate(33.09375, 100.25)"><rect style="" rx="16.75" ry="16.75" x="-33.09375" y="-16.75" width="66.1875" height="33.5"></rect><g class="label" style="" transform="translate(-21.40625, -9.25)"><rect></rect><foreignObject width="42.8125" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">START</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-split-42" data-node="true" data-id="split" transform="translate(181.2890625, 100.25)"><rect class="basic label-container" style="" rx="0" ry="0" x="-65.1015625" y="-18.25" width="130.203125" height="36.5"></rect><g class="label" style="" transform="translate(-57.6015625, -10.75)"><rect></rect><foreignObject width="115.203125" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">生成任务列表</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-send_node-44" data-node="true" data-id="send_node" transform="translate(351.890625, 100.25)"><rect class="basic label-container" style="" rx="0" ry="0" x="-55.5" y="-29" width="111" height="58"></rect><g class="label" style="" transform="translate(-48, -21.5)"><rect></rect><foreignObject width="96" height="43"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">条件边返回<br style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box;">Send 列表</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-worker1-46" data-node="true" data-id="worker1" transform="translate(541.37109375, 16.75)"><rect class="basic label-container" style="" rx="0" ry="0" x="-32.36328125" y="-16.75" width="64.7265625" height="33.5"></rect><g class="label" style="" transform="translate(-24.86328125, -9.25)"><rect></rect><foreignObject width="49.7265625" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">worker</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-worker2-48" data-node="true" data-id="worker2" transform="translate(541.37109375, 100.25)"><rect class="basic label-container" style="" rx="0" ry="0" x="-32.36328125" y="-16.75" width="64.7265625" height="33.5"></rect><g class="label" style="" transform="translate(-24.86328125, -9.25)"><rect></rect><foreignObject width="49.7265625" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">worker</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-worker3-50" data-node="true" data-id="worker3" transform="translate(541.37109375, 183.75)"><rect class="basic label-container" style="" rx="0" ry="0" x="-32.36328125" y="-16.75" width="64.7265625" height="33.5"></rect><g class="label" style="" transform="translate(-24.86328125, -9.25)"><rect></rect><foreignObject width="49.7265625" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">worker</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-merge_node-52" data-node="true" data-id="merge_node" transform="translate(701.00390625, 100.25)"><rect class="basic label-container" style="" rx="0" ry="0" x="-77.26953125" y="-18.25" width="154.5390625" height="36.5"></rect><g class="label" style="" transform="translate(-69.76953125, -10.75)"><rect></rect><foreignObject width="139.5390625" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">Reducer 汇总结果</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-finish-58" data-node="true" data-id="finish" transform="translate(854.2578125, 100.25)"><rect style="" rx="16.75" ry="16.75" x="-25.984375" y="-16.75" width="51.96875" height="33.5"></rect><g class="label" style="" transform="translate(-14.296875, -9.25)"><rect></rect><foreignObject width="28.59375" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">END</span></div></foreignObject></g></g></g></g></g></svg>



这和普通条件边的区别要分清楚：

- **普通条件边**：通常决定“下一步走哪一个节点”
- **Send**：决定“下一步要开出多少个任务，每个任务分别带什么状态去哪个节点”

### 3.3 案例：Send

这个案例可以用来理解 LangGraph 的并行思维：

- 上游节点先生成一批主题
- 条件边函数把这些主题映射成一组 `Send`
- 下游节点针对每个主题分别生成笑话
- 最后通过 Reducer 把多路结果合并回 State

【案例源码】`案例与源码-3-LangGraph框架/06-specialApi/SendDemo.py`

```py
"""
【案例】Send 与 Map-Reduce 模式：条件边函数返回 Sequence[Send]，每个 Send(节点名, 状态) 触发一次该节点的执行，LangGraph 并行执行后按 Reducer 汇总（如列表合并），适合「动态数量子任务」并行再汇总。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 3、Send、Command 与 Runtime 上下文

知识点速览：
- 条件边若返回 List[Send]（或 Sequence[Send]），每个 Send 指定「下一节点 + 传入该节点的 state」，框架会并行执行这些分支并合并结果。
- Map 阶段：生成主题列表 → 为每个主题构造 Send("make_joke", {"subject": 主题})；Reduce 阶段：jokes 字段用列表合并 Reducer，多路结果合并成一条列表。
- 适合「一批输入拆成多份、并行处理、再汇总」的流程。
- 本例最值得观察的是：每个 Send 分支拿到的是“自己的那份状态”，而最终能不能顺利汇总，取决于下游字段有没有设计好对应的 Reducer。
"""

from typing import Annotated, List, Sequence
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send


# 定义状态
class DiliState(TypedDict):
    subjects: List[str]
    jokes: Annotated[List[str], lambda x, y: x + y]  # 使用列表合并的方式


# 第一个节点：生成需要处理的主题列表
def generate_subjects(state: DiliState) -> dict:
    """生成需要处理的主题列表"""
    print("执行节点(第一个节点：生成需要处理的主题列表): generate_subjects")
    subjects = ["猫", "狗", "程序员"]
    print(f"生成主题列表: {subjects}")
    return {"subjects": subjects}


# Map节点：为每个主题生成笑话
def make_joke(state: DiliState) -> dict:
    """为单个主题生成笑话"""
    subject = state.get("subject", "未知")
    print(f"执行节点: make_joke，处理主题: {subject}")

    # 根据主题生成相应笑话
    jokes_map = {
        "猫": "为什么猫不喜欢在线购物？因为它们更喜欢实体店！",
        "狗": "为什么狗不喜欢计算机？因为它们害怕被鼠标咬！",
        "程序员": "为什么程序员喜欢洗衣服？因为他们在寻找bugs！",
        "未知": "这是一个关于未知主题的神秘笑话。",
    }

    joke = jokes_map.get(subject, f"这是一个关于{subject}的即兴笑话。")
    print(f"生成笑话: {joke}")
    return {"jokes": [joke]}


# 条件边函数：根据主题列表生成Send对象列表
def map_subjects_to_jokes(state: DiliState) -> List[Send]:
    """将主题列表映射到joke生成任务"""
    print("执行条件边函数: map_subjects_to_jokes")
    subjects = state["subjects"]
    print(f"映射主题到joke任务: {subjects}")

    # 为每个主题创建一个Send对象，指向make_joke节点
    # 每个Send对象包含节点名称和传递给该节点的状态
    send_list = [Send("make_joke", {"subject": subject}) for subject in subjects]
    print(f"生成Send对象列表: {send_list}")
    return send_list


def main():
    """演示Map-Reduce模式"""
    print("=== Map-Reduce 模式演示 ===\n")

    # 创建图
    builder = StateGraph(DiliState)

    # 添加节点
    builder.add_node("generate_subjects", generate_subjects)
    builder.add_node("make_joke", make_joke)

    # 添加边
    builder.add_edge(START, "generate_subjects")

    # 添加条件边，使用Send对象实现map-reduce
    builder.add_conditional_edges(
        "generate_subjects",  # 源节点
        map_subjects_to_jokes,  # 路由函数，返回Send对象列表
    )

    # 从make_joke到结束
    builder.add_edge("make_joke", END)

    # 编译图
    graph = builder.compile()
    print(graph.get_graph().print_ascii())

    # 执行图
    initial_state = {"subjects": [], "jokes": []}
    print("初始状态:", initial_state)
    print("\n开始执行图...")

    result = graph.invoke(initial_state)
    print(f"\n最终结果: {result}")

    print("\n=== 演示完成 ===")


if __name__ == "__main__":
    main()

"""
【输出示例】
=== Map-Reduce 模式演示 ===

    +-----------+      
    | __start__ |      
    +-----------+      
          *            
          *            
          *            
+-------------------+  
| generate_subjects |  
+-------------------+  
          *            
          *            
          *            
     +---------+       
     | __end__ |       
     +---------+       
None
初始状态: {'subjects': [], 'jokes': []}

开始执行图...
执行节点(第一个节点：生成需要处理的主题列表): generate_subjects
生成主题列表: ['猫', '狗', '程序员']
执行条件边函数: map_subjects_to_jokes
映射主题到joke任务: ['猫', '狗', '程序员']
生成Send对象列表: [Send(node='make_joke', arg={'subject': '猫'}), Send(node='make_joke', arg={'subject': '狗'}), Send(node='make_joke', arg={'subject': '程序员'})]
执行节点: make_joke，处理主题: 猫
生成笑话: 为什么猫不喜欢在线购物？因为它们更喜欢实体店！
执行节点: make_joke，处理主题: 狗
生成笑话: 为什么狗不喜欢计算机？因为它们害怕被鼠标咬！
执行节点: make_joke，处理主题: 程序员
生成笑话: 为什么程序员喜欢洗衣服？因为他们在寻找bugs！

最终结果: {'subjects': ['猫', '狗', '程序员'], 'jokes': ['为什么猫不喜欢在线购物？因为它们更喜欢实体店！', '为什么狗不喜欢计算机？因为它们害怕被鼠标咬！', '为什么程序员喜欢洗衣服？因为他们在寻找bugs！']}

=== 演示完成 ===
"""

```

从项目角度看，Send 很适合这些场景：

- 文档分片后并行处理
- 多查询并行检索
- 一批候选任务并行评分
- 多个主题、多条记录、多段文本的批量处理

### 3.4 Command：更新并跳转

如果说条件边只负责“去哪”，那 `Command` 解决的是另一个很常见的需求：**某个节点在做完判断后，既想更新状态，又想直接决定下一步去哪。**

`Command` 可以把状态更新和控制流放到同一次返回里。

最常见的两个参数是：

- `update`：当前节点希望写回 State 的局部更新内容，仍然会按字段对应的 Reducer 规则合并。
- `goto`：当前节点执行完后，希望图下一步跳转到哪个节点；也可以直接跳到 `END` 结束流程。

一个节点可以：

- 一边返回新的状态更新
- 一边直接告诉图“下一步去哪个节点”

这和条件边的边界要分清楚：

- **条件边**：通常更适合“节点做完了，再单独根据状态决定去哪”
- **Command**：更适合“这个节点本身就是决策点，离开时把状态和去向一起交代清楚”

<svg id="mermaid-svg-3" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 1060.44px; transform: translate(0px, 0px) scale(1); transform-origin: 0px 0px;" viewBox="-8 -8 1060.4375 166.75" role="graphics-document document" aria-roledescription="flowchart-v2"><g><marker id="mermaid-svg-3_flowchart-pointEnd" class="marker flowchart" viewBox="0 0 10 10" refX="6" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-3_flowchart-pointStart" class="marker flowchart" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-3_flowchart-circleEnd" class="marker flowchart" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="mermaid-svg-3_flowchart-circleStart" class="marker flowchart" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="mermaid-svg-3_flowchart-crossEnd" class="marker cross flowchart" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-3_flowchart-crossStart" class="marker cross flowchart" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M66.188,75.375L70.354,75.375C74.521,75.375,82.854,75.375,90.304,75.375C97.754,75.375,104.321,75.375,107.604,75.375L110.888,75.375" id="L-start-decision-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-start LE-decision" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-3_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M207.992,75.375L212.159,75.375C216.326,75.375,224.659,75.375,232.192,75.441C239.726,75.507,246.46,75.639,249.826,75.705L253.193,75.771" id="L-decision-command-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-decision LE-command" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-3_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M336.441,92.625L344.621,97.729C352.802,102.833,369.163,113.042,380.626,118.146C392.09,123.25,398.657,123.25,401.94,123.25L405.223,123.25" id="L-command-update-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-command LE-update" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-3_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M336.441,59.125L344.621,53.854C352.802,48.583,369.163,38.042,392.688,32.771C416.214,27.5,446.904,27.5,477.594,27.5C508.284,27.5,538.974,27.5,560.032,27.5C581.09,27.5,592.516,27.5,598.229,27.5L603.942,27.5" id="L-command-goto-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-command LE-goto" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-3_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M544.664,123.25L548.831,123.25C552.997,123.25,561.331,123.25,568.781,123.25C576.231,123.25,582.797,123.25,586.081,123.25L589.364,123.25" id="L-update-merge-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-update LE-merge" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-3_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M720.242,27.5L736.439,27.5C752.635,27.5,785.029,27.5,816.347,32.177C847.666,36.853,877.91,46.206,893.032,50.883L908.154,55.559" id="L-goto-next-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-goto LE-next" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-3_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M734.82,123.25L748.587,123.25C762.354,123.25,789.888,123.25,818.777,118.573C847.666,113.897,877.91,104.544,893.032,99.867L908.154,95.191" id="L-merge-next-0" class="edge-thickness-normal edge-pattern-dotted flowchart-link LS-merge LE-next" style="fill: none; stroke-width: 2px; stroke-dasharray: 3; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-3_flowchart-pointEnd)" data-darkreader-inline-fill=""></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(817.421875, 123.25)"><g class="label" transform="translate(-57.6015625, -10.75)"><foreignObject width="115.203125" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;">合并后的状态</span></div></foreignObject></g></g></g><g class="nodes"><g class="node default default flowchart-label" id="flowchart-start-59" data-node="true" data-id="start" transform="translate(33.09375, 75.375)"><rect style="" rx="16.75" ry="16.75" x="-33.09375" y="-16.75" width="66.1875" height="33.5"></rect><g class="label" style="" transform="translate(-21.40625, -9.25)"><rect></rect><foreignObject width="42.8125" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">START</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-decision-60" data-node="true" data-id="decision" transform="translate(162.08984375, 75.375)"><rect class="basic label-container" style="" rx="0" ry="0" x="-45.90234375" y="-18.25" width="91.8046875" height="36.5"></rect><g class="label" style="" transform="translate(-38.40234375, -10.75)"><rect></rect><foreignObject width="76.8046875" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">决策节点</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-command-62" data-node="true" data-id="command" transform="translate(309.2578125, 75.375)"><polygon points="8.375,0 94.15625,0 102.53125,-16.75 94.15625,-33.5 8.375,-33.5 0,-16.75" class="label-container" transform="translate(-51.265625,16.75)" style=""></polygon><g class="label" style="" transform="translate(-35.390625, -9.25)"><rect></rect><foreignObject width="70.78125" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">Command</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-update-64" data-node="true" data-id="update" transform="translate(477.59375, 123.25)"><rect class="basic label-container" style="" rx="0" ry="0" x="-67.0703125" y="-27.5" width="134.140625" height="55"></rect><g class="label" style="" transform="translate(-59.5703125, -20)"><rect></rect><foreignObject width="119.140625" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">update<br style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box;">写回局部 State</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-goto-66" data-node="true" data-id="goto" transform="translate(664.7421875, 27.5)"><rect class="basic label-container" style="" rx="0" ry="0" x="-55.5" y="-27.5" width="111" height="55"></rect><g class="label" style="" transform="translate(-48, -20)"><rect></rect><foreignObject width="96" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">goto<br style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box;">指定下一跳</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-merge-68" data-node="true" data-id="merge" transform="translate(664.7421875, 123.25)"><rect class="basic label-container" style="" rx="0" ry="0" x="-70.078125" y="-18.25" width="140.15625" height="36.5"></rect><g class="label" style="" transform="translate(-62.578125, -10.75)"><rect></rect><foreignObject width="125.15625" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">按 Reducer 合并</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-next-70" data-node="true" data-id="next" transform="translate(972.23046875, 75.375)"><rect class="basic label-container" style="" rx="0" ry="0" x="-72.20703125" y="-18.25" width="144.4140625" height="36.5"></rect><g class="label" style="" transform="translate(-64.70703125, -10.75)"><rect></rect><foreignObject width="129.4140625" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">目标节点或 END</span></div></foreignObject></g></g></g></g></g></svg>



### 3.5 案例：Command

这个案例特别适合放在“决策节点”语境下理解。你可以重点观察：

- 为什么 `decision_agent` 返回的不是普通字典，而是 `Command(...)`
- 为什么它既能写入 `messages`、`current_agent`、`task_completed`
- 又能同时用 `goto` 把流程交给下一个节点，或者直接去 `END`

【案例源码】`案例与源码-3-LangGraph框架/06-specialApi/CommandDemo.py`

```py
"""
【案例】Command 对象：节点可返回 Command(update=..., goto=节点或END)，在「更新状态」的同时「指定下一跳」，实现状态更新与路由一步完成，适合人机闭环与多智能体交接。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 3、Send、Command 与 Runtime 上下文

知识点速览：
- `Command(update=..., goto=...)` 可以先按 Reducer 规则把 update 合并回 State，再决定下一跳；这正是它和普通节点返回 dict 的关键区别。
- 与条件边的区别：条件边更像“节点执行完后再单独路由”，而 Command 更像“这个节点自己就是决策点，离场时把状态和去向一起交代清楚”。
- 本例还顺手演示了一个工程上很重要的点：带循环或回跳的图，最好配合明确的终止条件与递归上限，避免流程跑飞。
"""

from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command

# 全局常量：统一递归限制，便于维护
RECURSION_LIMIT = 50


# 定义状态
class AgentState(TypedDict):
    messages: Annotated[list, lambda x, y: x + y]  # 自动合并消息
    current_agent: str
    task_completed: bool


# 决策代理（核心路由节点）
def decision_agent(state: AgentState) -> Command[AgentState]:
    """根据消息内容路由代理，任务完成则直接终止"""
    print("执行节点: decision_agent")
    # 优先终止流程（核心防循环逻辑）
    if state["task_completed"]:
        print("✅ 检测到任务已完成，直接终止流程")
        return Command(
            update={"messages": [("system", "所有任务处理完成，流程正常结束")]},
            goto=END,
        )
    # 提取消息文本（兼容空消息）
    last_message = state["messages"][-1] if state["messages"] else ("", "")
    last_msg_content = last_message[1]
    print(f"最新消息文本: {last_msg_content}")

    # 动态路由
    if "数学" in last_msg_content:
        print("✅ 检测到数学任务，路由到数学代理")
        return Command(
            update={
                "messages": [("system", "路由到数学代理")],
                "current_agent": "math_agent",
            },
            goto="math_agent",
        )
    elif "翻译" in last_msg_content:
        print("✅ 检测到翻译任务，路由到翻译代理")
        return Command(
            update={
                "messages": [("system", "路由到翻译代理")],
                "current_agent": "translation_agent",
            },
            goto="translation_agent",
        )
    else:
        print("❌ 未识别任务类型，标记任务完成并终止")
        return Command(
            update={"messages": [("system", "任务完成")], "task_completed": True},
            goto=END,
        )


# 数学代理（业务节点）
def math_agent(state: AgentState) -> Command[AgentState]:
    """处理数学计算任务，完成后返回决策代理"""
    print("执行节点: math_agent")
    result = "2 + 2 = 4"
    print(f"计算结果: {result}")
    return Command(
        update={
            "messages": [("assistant", f"数学计算结果: {result}")],
            "current_agent": "decision_agent",
            "task_completed": True,
        },
        goto="decision_agent",
    )


# 翻译代理（业务节点）
def translation_agent(state: AgentState) -> Command[AgentState]:
    """处理中英翻译任务，完成后返回决策代理"""
    print("执行节点: translation_agent")
    translation = "Hello -> 你好"
    print(f"翻译结果: {translation}")
    return Command(
        update={
            "messages": [("assistant", f"翻译结果: {translation}")],
            "current_agent": "decision_agent",
            "task_completed": True,
        },
        goto="decision_agent",
    )


def main():
    """演示Command基础用法：状态更新+动态路由+流程终止"""
    print("=== Command 基础演示（LangGraph 1.0.6）===\n")

    # 1. 构建状态图
    builder = StateGraph(AgentState)
    builder.add_node("decision_agent", decision_agent)
    builder.add_node("math_agent", math_agent)
    builder.add_node("translation_agent", translation_agent)

    # 2. 定义边（完整节点关系）
    builder.add_edge(START, "decision_agent")
    builder.add_edge("math_agent", "decision_agent")
    builder.add_edge("translation_agent", "decision_agent")
    builder.add_edge("decision_agent", END)

    # 3. 编译图
    graph = builder.compile()

    # 测试1：数学任务
    print("【测试1: 数学任务】")
    initial_state = {
        "messages": [("user", "我需要计算数学题")],
        "current_agent": "user",
        "task_completed": False,
    }
    print("初始状态:", initial_state)
    result = graph.invoke(initial_state, recursion_limit=RECURSION_LIMIT)
    print(
        "最终状态(简化):", {k: v for k, v in result.items() if k != "messages"}
    )  # 简化输出
    print("\n" + "-" * 50 + "\n")

    # 测试2：翻译任务
    print("【测试2: 翻译任务】")
    initial_state = {
        "messages": [("user", "我需要翻译文本")],
        "current_agent": "user",
        "task_completed": False,
    }
    print("初始状态:", initial_state)
    result = graph.invoke(initial_state, recursion_limit=RECURSION_LIMIT)
    print("最终状态(简化):", {k: v for k, v in result.items() if k != "messages"})
    print("\n" + "-" * 50 + "\n")

    # 测试3：未识别任务
    print("【测试3: 未识别任务类型】")
    initial_state = {
        "messages": [("user", "你好")],
        "current_agent": "user",
        "task_completed": False,
    }
    print("初始状态:", initial_state)
    result = graph.invoke(initial_state, recursion_limit=RECURSION_LIMIT)
    print("最终状态(简化):", {k: v for k, v in result.items() if k != "messages"})

    # 新增：可视化图结构（教学演示必备）
    print("\n=== 图结构可视化 ===")
    print(graph.get_graph().draw_mermaid())


if __name__ == "__main__":
    main()

"""
【输出示例】
=== Command 基础演示（LangGraph 1.0.6）===

【测试1: 数学任务】
初始状态: {'messages': [('user', '我需要计算数学题')], 'current_agent': 'user', 'task_completed': False}
执行节点: decision_agent
最新消息文本: 我需要计算数学题
✅ 检测到数学任务，路由到数学代理
执行节点: math_agent
计算结果: 2 + 2 = 4
执行节点: decision_agent
✅ 检测到任务已完成，直接终止流程
最终状态(简化): {'current_agent': 'decision_agent', 'task_completed': True}

--------------------------------------------------

【测试2: 翻译任务】
初始状态: {'messages': [('user', '我需要翻译文本')], 'current_agent': 'user', 'task_completed': False}
执行节点: decision_agent
最新消息文本: 我需要翻译文本
✅ 检测到翻译任务，路由到翻译代理
执行节点: translation_agent
翻译结果: Hello -> 你好
执行节点: decision_agent
✅ 检测到任务已完成，直接终止流程
最终状态(简化): {'current_agent': 'decision_agent', 'task_completed': True}

--------------------------------------------------

【测试3: 未识别任务类型】
初始状态: {'messages': [('user', '你好')], 'current_agent': 'user', 'task_completed': False}
执行节点: decision_agent
最新消息文本: 你好
❌ 未识别任务类型，标记任务完成并终止
最终状态(简化): {'current_agent': 'user', 'task_completed': True}

=== 图结构可视化 ===
---
config:
  flowchart:
    curve: linear
---
graph TD;
        __start__(<p>__start__</p>)
        decision_agent(decision_agent)
        math_agent(math_agent)
        translation_agent(translation_agent)
        __end__(<p>__end__</p>)
        __start__ --> decision_agent;
        decision_agent --> __end__;
        classDef default fill:#f2f0ff,line-height:1.2
        classDef first fill-opacity:0
        classDef last fill:#bfb6fc
"""

```

在真实项目里，Command 很适合：

- 决策节点
- Agent 交接节点
- 人机闭环中的“继续 / 暂停 / 转人工”节点
- 需要边写日志边转发流程的节点

这里先埋一个后续伏笔：第 25 章会讲 `interrupt`。图运行到某个节点时暂停，把待审核数据交给图外用户；用户处理完后，再用 `Command(resume=...)` 把结果送回图内继续执行。`Command` 不只表达“下一跳去哪”，也会出现在“暂停后恢复”的人机闭环里。

### 3.6 Runtime：配置与状态分开

前面我们一直在强调 State，但真实项目里并不是所有数据都该放进 State。比如下面这些东西：模型名、API Key、数据库连接、用户环境配置、当前运行的外部依赖对象。

它们通常都不属于“图在节点间流转的业务状态”，而更像是**这次运行的静态上下文**。这时就更适合放进 Runtime 上下文，而不是硬塞进 State。

官方 Graph API 和 `Use the graph API` 指南都强调了这一点：**运行时配置可以通过 `context_schema` 声明，并在调用图时通过 `context=...` 传入。**

所以可以把两者的区别记成：

- **State**：会随着图运行不断变化的共享业务数据
- **Runtime Context**：本次运行里节点可读、但不应混入业务状态的静态依赖或配置

<svg id="mermaid-svg-4" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 711.477px; transform: translate(0px, 0px) scale(1); transform-origin: 0px 0px;" viewBox="-8 -8 711.4765625 176" role="graphics-document document" aria-roledescription="flowchart-v2"><g><marker id="mermaid-svg-4_flowchart-pointEnd" class="marker flowchart" viewBox="0 0 10 10" refX="6" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-4_flowchart-pointStart" class="marker flowchart" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-4_flowchart-circleEnd" class="marker flowchart" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="mermaid-svg-4_flowchart-circleStart" class="marker flowchart" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="mermaid-svg-4_flowchart-crossEnd" class="marker cross flowchart" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="mermaid-svg-4_flowchart-crossStart" class="marker cross flowchart" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M79.014,63.25L87.964,57.292C96.913,51.333,114.812,39.417,128.644,33.458C142.477,27.5,152.243,27.5,157.126,27.5L162.009,27.5" id="L-invoke-state-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-invoke LE-state" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-4_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M79.014,96.75L87.964,102.708C96.913,108.667,114.812,120.583,127.045,126.542C139.278,132.5,145.844,132.5,149.128,132.5L152.411,132.5" id="L-invoke-context-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-invoke LE-context" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-4_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M316.715,27.5L322.481,27.5C328.247,27.5,339.78,27.5,352.546,32.683C365.311,37.865,379.31,48.231,386.309,53.413L393.308,58.596" id="L-state-node-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-state LE-node" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-4_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M326.313,132.5L330.479,132.5C334.646,132.5,342.979,132.5,354.145,127.317C365.311,122.135,379.31,111.769,386.309,106.587L393.308,101.404" id="L-context-node-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-context LE-node" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-4_flowchart-pointEnd)" data-darkreader-inline-fill=""></path><path d="M468.117,80L472.284,80C476.451,80,484.784,80,492.234,80C499.684,80,506.251,80,509.534,80L512.817,80" id="L-node-update-0" class="edge-thickness-normal edge-pattern-solid flowchart-link LS-node LE-update" style="fill: none; --darkreader-inline-fill: none;" marker-end="url(#mermaid-svg-4_flowchart-pointEnd)" data-darkreader-inline-fill=""></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="edgeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182); background-color: rgb(46, 49, 50); text-align: center;"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default default flowchart-label" id="flowchart-invoke-73" data-node="true" data-id="invoke" transform="translate(53.85546875, 80)"><rect class="basic label-container" style="" rx="0" ry="0" x="-53.85546875" y="-16.75" width="107.7109375" height="33.5"></rect><g class="label" style="" transform="translate(-46.35546875, -9.25)"><rect></rect><foreignObject width="92.7109375" height="18.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">graph.invoke</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-state-74" data-node="true" data-id="state" transform="translate(242.01171875, 27.5)"><rect class="basic label-container" style="" rx="0" ry="0" x="-74.703125" y="-27.5" width="149.40625" height="55"></rect><g class="label" style="" transform="translate(-67.203125, -20)"><rect></rect><foreignObject width="134.40625" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">State<br style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box;">业务状态会变化</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-context-75" data-node="true" data-id="context" transform="translate(242.01171875, 132.5)"><rect class="basic label-container" style="" rx="0" ry="0" x="-84.30078125" y="-27.5" width="168.6015625" height="55"></rect><g class="label" style="" transform="translate(-76.80078125, -20)"><rect></rect><foreignObject width="153.6015625" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">Runtime Context<br style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box;">运行配置相对稳定</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-node-76" data-node="true" data-id="node" transform="translate(422.21484375, 80)"><rect class="basic label-container" style="" rx="0" ry="0" x="-45.90234375" y="-18.25" width="91.8046875" height="36.5"></rect><g class="label" style="" transform="translate(-38.40234375, -10.75)"><rect></rect><foreignObject width="76.8046875" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">节点函数</span></div></foreignObject></g></g><g class="node default default flowchart-label" id="flowchart-update-77" data-node="true" data-id="update" transform="translate(606.796875, 80)"><rect class="basic label-container" style="" rx="0" ry="0" x="-88.6796875" y="-18.25" width="177.359375" height="36.5"></rect><g class="label" style="" transform="translate(-81.1796875, -10.75)"><rect></rect><foreignObject width="162.359375" height="21.5"><div xmlns="http://www.w3.org/1999/xhtml" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; display: inline-block; white-space: nowrap;"><span class="nodeLabel" style="-webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: rgba(221, 220, 217, 0); text-size-adjust: none; box-sizing: border-box; fill: rgb(193, 188, 182); color: rgb(193, 188, 182);">返回 State 局部更新</span></div></foreignObject></g></g></g></g></g></svg>



### 3.7 Runtime 的基本用法

Runtime 上下文通常分三步：

1. 定义 `context_schema`
2. 创建图时挂到 `StateGraph(..., context_schema=...)`
3. 执行图时通过 `invoke(..., context=...)` 传入，节点里用 `runtime.context` 读取

这里的 `context_schema` 就是一份**运行时配置的结构声明**。

Runtime 的价值就是把“配置”和“状态”拆开。拆开之后，State 更干净，节点测试更轻松，不同环境、不同模型、不同依赖的切换成本也更低。

### 3.8 案例：Runtime Context

这个案例重点看三件事：

- `ContextSchema` 是怎么定义的
- `StateGraph(..., context_schema=ContextSchema)` 是怎么把运行时上下文挂到图上的
- 节点里怎么通过 `runtime.context.xxx` 读取配置

【案例源码】`案例与源码-3-LangGraph框架/06-specialApi/RuntimeContextDemo.py`

```py
"""
【案例】Runtime 与 context_schema：创建图时传入 context_schema，invoke 时传入 context，节点函数可接收 (state, runtime)，通过 runtime.context 访问配置（如模型名、数据库连接、API 密钥），实现「配置与状态分离」。

对应教程章节：第 16 章 - LangGraph API：节点、边与进阶 → 3、Send、Command 与 Runtime 上下文

知识点速览：
- StateGraph(State, context_schema=ContextSchema)：图的「运行时配置」由 context_schema 描述，不进入 state，适合放模型名、连接串、密钥等。
- 节点签名 (state, runtime: Runtime[ContextSchema])：runtime.context 即 invoke(..., context=...) 传入的对象，类型安全。
- invoke(initial_state, context=ContextSchema(...))：将配置注入图，节点内用 runtime.context.xxx 读取，便于测试与多环境部署。
- 这个案例的核心不是“把更多字段塞进 context”，而是建立“配置和状态分离”的意识：业务数据走 State，环境配置走 Runtime Context。
"""

from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.runtime import Runtime
from langchain_core.messages import AIMessage, HumanMessage
from dataclasses import dataclass


# 定义状态结构
class AgentState(TypedDict):
    messages: Annotated[list, lambda x, y: x + y]
    response: str


# 定义上下文结构
@dataclass
class ContextSchema:
    model_name: str
    db_connection: str
    api_key: str


# 节点函数：处理用户消息
def process_message(state: AgentState, runtime: Runtime[ContextSchema]) -> dict:
    """处理用户消息的节点，使用context中的信息"""
    print("执行节点: process_message")

    # 获取最新的用户消息
    last_message = state["messages"][-1].content if state["messages"] else ""
    print(f"用户消息: {last_message}")
    print("=========以下是从RuntimeContext中获得信息=========")
    # 使用runtime.context中的信息
    model_name = runtime.context.model_name
    db_connection = runtime.context.db_connection
    api_key = runtime.context.api_key

    print(f"使用的模型: {model_name}")
    print(f"数据库连接: {db_connection}")
    print(f"API密钥前缀: {api_key[:5]}***")  # 只显示前5位，隐藏其余部分

    # 模拟使用这些信息处理请求
    response = f"使用 {model_name} 处理了您的请求，已连接到 {db_connection}"

    return {"messages": [AIMessage(content=response)], "response": response}


# 节点函数：生成最终响应
def generate_response(state: AgentState, runtime: Runtime[ContextSchema]) -> dict:
    """生成最终响应的节点"""
    print("执行节点: generate_response")

    # 使用runtime.context中的信息
    model_name = runtime.context.model_name
    print(f"使用模型 {model_name} 生成最终响应")

    # 获取之前的结果
    previous_response = state["response"]

    # 生成更详细的响应
    final_response = f"{previous_response}\n\n这是使用 {model_name} 生成的完整响应。"

    return {"messages": [AIMessage(content=final_response)], "response": final_response}


def main():
    """演示 context_schema 的使用"""
    print("=== Context Schema 演示 ===\n")

    # 定义上下文
    context = ContextSchema(
        model_name="gpt-4-turbo",
        db_connection="postgresql://user:pass@localhost:5432/orders_db",
        api_key="sk-abcdefghijklmnopqrstuvwxyz123456",
    )

    # 创建图，指定state_schema和context_schema
    builder = StateGraph(AgentState, context_schema=ContextSchema)

    # 添加节点
    builder.add_node("process_message", process_message)
    builder.add_node("generate_response", generate_response)

    # 添加边
    builder.add_edge(START, "process_message")
    builder.add_edge("process_message", "generate_response")
    builder.add_edge("generate_response", END)

    # 编译图
    graph = builder.compile()

    # 定义初始状态
    initial_state = {
        "messages": [HumanMessage(content="请帮我查询最新的订单信息")],
        "response": "",
    }

    print("初始状态:", initial_state)
    print()
    print(
        "上下文信息:\n",
        {
            "model_name": context.model_name,
            "db_connection": context.db_connection,
            "api_key": f"{context.api_key[:5]}***",
        },
    )
    print("\n" + "-" * 50 + "\n")

    # 执行图，通过context参数传递上下文
    result = graph.invoke(initial_state, context=context)

    print("\n" + "=" * 50)
    print("最终状态:", result)
    print("\n最终响应:")
    print(result["response"])


if __name__ == "__main__":
    main()

"""
【输出示例】
=== Context Schema 演示 ===

初始状态: {'messages': [HumanMessage(content='请帮我查询最新的订单信息', additional_kwargs={}, response_metadata={})], 'response': ''}

上下文信息:
 {'model_name': 'gpt-4-turbo', 'db_connection': 'postgresql://user:pass@localhost:5432/orders_db', 'api_key': 'sk-ab***'}

--------------------------------------------------

执行节点: process_message
用户消息: 请帮我查询最新的订单信息
=========以下是从RuntimeContext中获得信息=========
使用的模型: gpt-4-turbo
数据库连接: postgresql://user:pass@localhost:5432/orders_db
API密钥前缀: sk-ab***
执行节点: generate_response
使用模型 gpt-4-turbo 生成最终响应

==================================================
最终状态: {'messages': [HumanMessage(content='请帮我查询最新的订单信息', additional_kwargs={}, response_metadata={}), AIMessage(content='使用 gpt-4-turbo 处理了您的请求，已连接到 postgresql://user:pass@localhost:5432/orders_db', additional_kwargs={}, response_metadata={}, tool_calls=[], invalid_tool_calls=[]), AIMessage(content='使用 gpt-4-turbo 处理了您的请求，已连接到 postgresql://user:pass@localhost:5432/orders_db\n\n这是使用 gpt-4-turbo 生成的完整响应。', additional_kwargs={}, response_metadata={}, tool_calls=[], invalid_tool_calls=[])], 'response': '使用 gpt-4-turbo 处理了您的请求，已连接到 postgresql://user:pass@localhost:5432/orders_db\n\n这是使用 gpt-4-turbo 生成的完整响应。'}

最终响应:
使用 gpt-4-turbo 处理了您的请求，已连接到 postgresql://user:pass@localhost:5432/orders_db

这是使用 gpt-4-turbo 生成的完整响应。
"""

```

### 3.9 图执行时，外部能看到什么

前面讲 Runtime 时提到了 `stream_writer`。顺着这条线再往外看：图的最终结果，不一定只能等到 `invoke()` 全部结束后才能拿到。

因为 LangGraph 图本身实现了 Runnable 接口，所以也支持：`stream()`、`astream()`。

这意味着你可以在图执行过程中逐步拿到中间信息。常见模式有下面几类：

- `values`：每一步输出当前完整状态
- `updates`：每一步只输出增量更新
- `custom`：输出节点内部通过 `runtime.stream_writer(...)` 主动写出的自定义数据
- `messages`：在调用 LLM 的节点中，流式拿到消息片段或 token
- `debug`：输出更完整的调试信息

真实项目里经常会遇到这些需求：

- 前端希望边跑边展示当前步骤
- LLM 生成时希望 token 级别流式输出
- 长流程执行时，希望知道现在卡在哪个节点
- 调试复杂图时，希望观察每一步到底更新了什么

因此，`invoke()` 更像“等整张图跑完再拿结果”，`stream()` 更像“边跑边看图内部发生了什么”。

### 3.10 Send、Command、Runtime 怎么区分

Send、Command、Runtime 容易混，可以用下面这张表来记：

| 能力        | 它解决的问题                        | 理解方式               |
| ----------- | ----------------------------------- | ---------------------- |
| **Send**    | 动态开出多路子任务                  | 运行时并行分发         |
| **Command** | 节点离场时同时更新状态并指定下一跳  | 决策节点的“一次性交代” |
| **Runtime** | 给节点注入不属于 State 的配置与依赖 | 配置和状态分离         |

![Send、Command 与 Runtime 对比：Send 负责动态多路分发，Command 负责更新状态并指定下一跳，Runtime 负责注入运行配置](https://didilili.github.io/ai-agents-from-zero/images/24/24-3-10-1.png)

- **Send**：一件事拆成很多小事并行去做
- **Command**：这个节点现在就决定接下来谁来接手
- **Runtime**：这次运行需要的环境配置别塞进 State

------

**章节思考题：**

1. 一个真实工作流里，怎么判断某段逻辑该放 Node 还是 Edge？

   **参考思路：** 做业务处理、调用模型、检索、转换数据，放 Node；决定下一步去哪，放 Edge 或控制对象。把处理和流转混在一起，图会很快失去可读性。

2. 条件边和 `Command` 都能影响下一跳，它们的区别在哪里？

   **参考思路：** 条件边把路由逻辑放在图结构外侧，更适合清晰分支；`Command` 让节点返回状态更新的同时指定下一跳，更适合节点处理结果本身就决定控制流的场景。选择时看路由逻辑属于图，还是属于节点结果。

3. `Send` 适合解决什么问题？什么时候不该用？

   **参考思路：** 它适合运行时动态拆出多路子任务，比如对多个文档、多个查询并行处理。如果任务数量固定、顺序明确，用普通边或并行结构可能更清楚。

4. Runtime Context 为什么不应该塞进 State？

   **参考思路：** Runtime 放配置、依赖和执行环境，比如客户端、用户上下文、模型参数；State 放业务流转数据。混在一起会导致状态不可序列化、难恢复，也让业务数据和运行环境耦合。

5. 为什么循环图需要设计退出条件和步数保护？

   **参考思路：** Agent / ReAct / 自我修正流程天然可能反复执行，如果没有清晰退出条件，图会一直调度下去。`recursion_limit` 是最后一道保护，但真正可靠的设计还要在 State 中记录重试次数、评分结果或工具调用状态，让条件边能稳定走向 `END`。

**本章小结：**

- **Node** 是 LangGraph 的最小执行单元，可以理解为被图调度的 Python 函数；除了最常见的 `state -> dict` 形式，还可以结合缓存、重试策略、`config`、`runtime` 使用。
- **Edge** 决定流程怎么流转。普通边适合固定路径，条件边适合状态驱动分支，入口点和条件入口点则决定图从哪里开始。
- **Send、Command、Runtime** 是三种常用进阶能力：Send 适合动态并行分发，Command 适合决策节点，Runtime 适合把配置和状态拆开。
- 这一章的重点在于建立一个完整认知：**节点负责处理，边负责流转，State 负责共享数据，进阶控制原语负责让图在运行时更灵活。** 学完本章后，你应当能够分清 **Node** 和 **Edge** 的职责，知道普通边、条件边、入口点、条件入口点分别适合什么场景，并理解 `Send`、`Command`、`Runtime` 三个进阶能力各自解决什么问题。

**建议下一步：**

建议先按顺序跑一遍 `04-node`、`05-edge`、`06-specialApi` 目录下全部案例，再进入后续 LangGraph 进阶章节。如果你能自己把一个“分类 → 分流 → 并行处理 → 汇总回答”的小工作流手写出来，这一章就真正学会了。
