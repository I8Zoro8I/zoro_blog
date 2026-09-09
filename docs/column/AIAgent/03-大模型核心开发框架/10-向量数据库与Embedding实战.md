---
date: 2026年08月21日
---

# 向量数据库与 Embedding 实战

------

**本章课程目标：**

- 理解 **向量（Vector）**、**向量化（Embedding）**、**向量数据库（Vector Store / Vector Database）** 这三件事分别是什么，以及它们之间的关系。
- 建立一条清晰主线：**文本先向量化，再写入向量库，再做相似性检索**；学完本章后，可以自然衔接到 第 11 章 RAG 检索增强生成。

**学习建议：** 这章先画链路，再看代码：文本经过 Embedding 模型变成向量，向量进入数据库，查询时再用相似度找回来。API 名称可以后记，但要弄清“存进去的是什么、查出来的是什么、相似度为什么能代表相关性”。如果有余力，用两三条短文本手算或打印一次相似度，会比空背概念扎实。

**官方文档与资源**：详见 [工具导航与参考资料索引 - RAG与向量检索](https://i8zoro8i.github.io/zoro_blog/column/AIAgent/工具导航与参考资料索引)。

------

## 1、向量与向量化

### 1.1 向量的定义

**向量（Vector）** 本来是数学概念，指的是：**用一组有顺序的数字来表示某个对象在空间中的位置或特征。**

比如：

- 二维向量可以写成 `(x, y)`
- 三维向量可以写成 `(x, y, z)`
- 在 AI 场景里，常见的是几百维、上千维的高维向量，例如 `1024` 维、`1536` 维

入门阶段不必先纠结高维空间的数学细节，先建立这个直觉即可：

**向量就是一串数字，而这串数字可以拿来表示一段文本、一张图片，或者其他对象的“特征”。**

### 1.2 向量化的定义

把文本、图片、音频等原始内容转换成向量的过程，通常叫 **向量化**；在大模型与检索领域里，更常见的名字是 **Embedding（嵌入）**。

平时说 Embedding，有时指“向量化这个过程”，有时也指“向量化之后得到的向量表示”。结合上下文判断即可，不需要把它们拆成两个完全无关的概念。

LangChain 官方文档把文本 Embedding 说得很清楚：**Embedding 模型会把句子、段落等原始文本转换成固定长度的数字向量，并尽量让语义相近的文本在向量空间里靠得更近。**

下图可以帮助你建立整体印象：左边是原始内容，中间是嵌入模型，右边是一串串向量。

![文本、图像等通过嵌入模型转为向量，便于相似性计算与检索](https://didilili.github.io/ai-agents-from-zero/images/18/18-1-2-1.jpeg)

用更直白的话说，Embedding 解决的是：

- 文本本身不能直接做“语义上的数学比较”
- 向量可以做距离和相似度计算
- 所以只要把文本变成向量，就能做“按意思查找相近内容”

这也是为什么 Embedding 常被用在：语义搜索、推荐系统、文本聚类、去重与相似内容识别、RAG 检索增强生成。

### 1.3 语义相近与向量相近

Embedding 的核心价值，不是“把文本编码成数字”这么简单，而是：**它希望把“语义关系”映射成“空间关系”。**

也就是说：语义接近的文本，向量更接近；语义差异大的文本，向量更远。比如：“我喜欢吃苹果”、“苹果是我最喜欢吃的水果”。

这两句话虽然字面不完全一样，但语义接近，所以向量通常也会更接近。
而“我喜欢用苹果手机”虽然也有“苹果”两个字，但语义已经部分转向“手机品牌”，和前两句的关系就没那么近。

这正是向量检索比关键词检索更强的地方：**它找的是“意思接近”，不只是“词面一致”。**

### 1.4 向量维度的定义

Embedding 输出的向量，一般是固定长度的浮点数列表。这个长度就叫 **维度（dimension）**。

例如：

- 某个模型输出 1024 维向量
- 就意味着每段文本最终会变成一个长度为 1024 的数组

这里先记住两个结论：

1. **不同 Embedding 模型输出维度可能不同。**
2. **即便维度相同，不同模型的向量空间通常也不能直接混用。**

所以真实项目里要保证：**建库时用的 Embedding 模型，和查询时用的 Embedding 模型保持一致。**

否则要么维度不匹配直接报错，要么即使能算，相似度结果也没有意义。

### 1.5 进一步建立直觉

下面两张图分别帮助你理解“图像也可以向量化”和“向量空间会影响检索效果”。

![图像向量化与对比示意](https://didilili.github.io/ai-agents-from-zero/images/18/18-1-5-1.jpeg)

> **图意说明：** 同品种毛色不同、同毛色体型不同——类比向量检索中「按特征维度」区分样本；用于建立「**向量 = 特征坐标**」的直觉（本章主线仍以文本 Embedding 为主）。

![向量维度与检索效果](https://didilili.github.io/ai-agents-from-zero/images/18/18-1-5-2.jpeg)

> **图意说明：** 高维 Embedding 可理解为「更多维度的特征轴」；维度与模型设计相关，**检索效果依赖模型与索引质量**，而非单看维数高低。

**这一节先记住一句话：** Embedding 不是为了“把文本变难懂”，而是为了让计算机能在数学空间里比较语义。

------

## 2、向量数据库

当文本已经变成向量后，下一个问题就来了：**这些向量存到哪里？又怎么高效地查“谁和我最像”？**这就是向量数据库存在的原因。

### 2.1 定义

LangChain 官方概括非常直接：**向量存储（Vector Store）就是存储嵌入后的数据，并支持相似性搜索。**Redis 官方文档则强调了另一个重点：**向量检索不是只存向量，而是围绕向量建立索引，并结合元数据做搜索与过滤。**

所以，可以先把“向量数据库”理解成：**一种专门面向“相似度检索”的存储系统。**

### 2.2 与传统数据库的区别

最核心的区别不在“能不能存数据”，而在“怎么查数据”。

| 对比维度     | 传统关系型数据库 / 普通 KV 存储 | 向量数据库                           |
| ------------ | ------------------------------- | ------------------------------------ |
| 核心查询方式 | 精确匹配、范围查询、条件过滤    | 相似性搜索、最近邻检索               |
| 典型问题     | “id=1001 的记录是什么？”        | “和这段文本语义最接近的内容是什么？” |
| 主要依据     | 字段值相等、大小、排序          | 向量距离 / 相似度                    |
| 常见用途     | 订单、用户、交易、配置          | RAG、搜索、推荐、去重、聚类          |

![传统数据库与向量数据库的查询方式对比：字段精确查询侧重值匹配，向量检索侧重语义相似](https://didilili.github.io/ai-agents-from-zero/images/18/18-2-2-1.png)

这并不代表传统数据库没用，而是说：**当你的问题从“查字段”变成“查意思”时，就要引入向量数据库。**

### 2.3 向量数据库里存什么

这是很多人第一次学时最容易混淆的地方。向量数据库里通常不只是“一个向量数组”，而是至少会包含下面几类信息：

- **原始内容**：例如文本正文 `page_content`
- **向量值**：Embedding 模型算出来的高维数组
- **元数据**：例如 `source`、`page`、`segment_id`、业务标签等
- **索引结构**：用于加速相似度检索

也就是说，向量数据库真正做的是：**把“内容 + 向量 + 元数据”组织起来，并支持按相似度查最相关内容。**

这件事对 RAG 非常关键，因为检索阶段不仅要拿到“最像的向量”，还要拿回对应的文本片段和元数据，最后才能交给大模型生成答案。

### 2.4 稠密向量、稀疏向量、标量字段定义

学到这里，很多人会先入为主地以为：向量数据库里只存“一个文本向量字段”。真实项目里当然可以这么做，但更完整的理解是：**一个可检索的数据对象，往往同时包含稠密向量、标量字段，某些系统里还会额外使用稀疏向量。**

- **稠密向量（Dense Vector）**：最常见，就是 Embedding 模型输出的一长串浮点数。它擅长表达整体语义，所以“意思相近”的文本通常会更接近。
- **稀疏向量（Sparse Vector）**：不是每一维都有值，而是只有少数维度非零。它更像“关键词及权重”的表达方式，常和词项匹配、倒排索引、BM25 一类思路联系在一起。
- **标量字段（Scalar Fields）**：例如 `source`、`author`、`category`、`created_at`、`doc_id` 这类普通字段。它们不参与语义向量计算，但常用于过滤、排序、权限控制和结果展示。

可以先把它们看成三类互补能力：

- 稠密向量负责“按语义找相近内容”
- 稀疏向量更偏“按关键词和词权重找相关内容”
- 标量字段负责“按业务条件过滤结果”

![稠密向量与稀疏向量对比：稠密向量表达整体语义，稀疏向量更接近关键词权重](https://didilili.github.io/ai-agents-from-zero/images/18/18-2-4-1.png)

**扩展：BGE-M3 与混合检索**

以 BGE-M3 这类 Embedding 模型为例，它可以同时支持稠密向量、稀疏向量等多种表示方式。放到检索系统里，就可以形成这样的搭配：

| 检索信号 | 更擅长解决的问题                               |
| -------- | ---------------------------------------------- |
| 稠密向量 | 用户换一种说法提问时，仍然能按语义找到相关内容 |
| 稀疏向量 | 产品型号、错误码、专有名词、精确关键词匹配     |
| 标量字段 | 权限、分类、时间、来源、业务标签过滤           |

所以生产 RAG 里经常会看到“稠密检索 + 稀疏检索 + metadata filter + rerank”的组合。它不是为了把系统做复杂，而是因为单一路径很难同时兼顾语义、关键词和业务约束。

本章的 Redis 案例主线，主要聚焦在**文本 Embedding 生成的稠密向量 + 元数据字段**。这样已经足够搭建一条清晰的入门链路。但你后面如果看到“混合检索”“稠密+稀疏召回”“metadata filter”这些词，就不会觉得陌生了。

### 2.5 常见的向量数据库分类

入门阶段不需要全学，但至少要知道生态里有哪些常见方案：

| 名称                           | 简要说明                                 |
| ------------------------------ | ---------------------------------------- |
| **FAISS**                      | 偏本地、偏算法库，适合快速做向量检索实验 |
| **Chroma**                     | 轻量、好上手，适合本地原型验证           |
| **Milvus**                     | 开源专业向量数据库，适合大规模生产环境   |
| **Pgvector**                   | PostgreSQL 扩展，适合已有 PG 体系的项目  |
| **Redis / Redis Stack**        | 既能做缓存，也能做向量检索，适合工程整合 |
| **Elasticsearch / OpenSearch** | 搜索体系成熟，也支持向量搜索             |

### 2.6 RAG 与向量数据库的关系

因为大多数人第一次接触向量数据库，往往就是在做 RAG。

RAG 的底层链路通常是：

1. 把文档切成片段
2. 用 Embedding 模型把片段转成向量
3. 把“片段 + 向量 + 元数据”写入向量数据库
4. 用户提问时，把问题也转成向量
5. 在向量数据库里查最相关片段
6. 把片段和问题一起交给大模型生成答案

也就是说，**向量数据库是 RAG 的底层基础设施之一，但它本身不等于完整 RAG。**

![向量与向量库在知识体系中的位置](https://didilili.github.io/ai-agents-from-zero/images/18/18-2-6-1.jpeg)

> **图意说明：** 上半为**索引/入库**链路，下半为**查询**链路；向量库处于「分段文本向量化之后、检索 top-K 片段之后交给模型」的关键位置。完整加载器、切分器与生成环节见 第 11 章 RAG。

### 2.7 Redis 与 Milvus 怎么选

本教程选择 Redis Stack，是因为它容易和缓存、会话、队列等工程场景放在一起，安装和演示成本也低。入门阶段用它理解“写入向量、建立索引、相似检索”非常合适。

但如果你的项目进入更大规模，例如数据量很大、索引策略复杂、混合检索和高并发检索要求更高，就可以把 **Milvus** 作为生产级扩展方向。先记一个简单判断：

| 场景                                         | 更适合      |
| -------------------------------------------- | ----------- |
| 课程学习、个人项目、和 Redis 生态整合        | Redis Stack |
| 大规模向量检索、专业索引管理、生产级检索平台 | Milvus      |

------

## 3、用 Redis Stack 作为向量存储

本教程选择 **Redis / Redis Stack** 来做向量存储，不是因为它是唯一方案，而是因为它适合教学和工程入门：

- 项目前面已经在 第 16 章 引入了 Redis
- Redis Stack 在 Redis 基础上集成了搜索与向量检索能力
- 对入门学习来说，一套环境就能同时覆盖缓存、消息、历史记录、向量检索，工程连贯性会更强

### 3.1 Redis、Redis Stack、RediSearch 三者关系

- **Redis**：基础内存数据库 / 键值存储
- **Redis Stack**：在 Redis 基础上打包了搜索、JSON、时间序列、布隆过滤器等扩展能力
- **RediSearch**：Redis Stack 中和搜索、全文检索、向量检索强相关的模块

从本章角度看，直接记住一句话就够了：**我们之所以能用 Redis 做向量检索，关键是 Redis Stack / RediSearch 提供了向量字段、索引和 KNN 搜索能力。**

Redis 官方文档里也明确提到，Redis 可以：

- 创建向量索引
- 存储向量和元数据
- 做 KNN（最近邻）向量搜索
- 结合元数据过滤做混合检索

### 3.2 本教程为什么选 Redis

从真实项目角度看，Redis 作为向量存储有几个很实用的优点：

- **上手成本低**：很多团队本来就已经有 Redis
- **工程整合方便**：缓存、会话、历史记录、向量检索可以放在同一套基础设施里
- **适合中小型知识库**：做课程演示、内部工具、轻量 RAG 很顺手

当然，工程里也要知道它的边界：如果向量规模非常大、检索需求非常复杂，团队也可能选择 Milvus、Weaviate、Pinecone 等更专门的方案；这不是“谁绝对更好”的问题，而是“你的场景更适合哪种方案”。

如果你还没有装好 Redis Stack，请先回看 第 16 章 里关于 Docker、Redis Stack、RedisInsight 的部分；本章不重复安装过程，只聚焦“Embedding + 向量检索”这条主线。

> 先区分一个容易误解的点
>
> - 做向量检索时，真正写入 Redis 的不是“裸向量”而已，通常是：文本内容、文本对应的向量、元数据、与索引相关的结构信息。
> - 所以你在 RedisInsight 里看到的记录，往往不是一个简单数字数组，而是多个字段组成的结构化数据。这一点到了本章第 6 节看案例时会更直观。

------

## 4、Embedding 文本向量化

这一节是本章的核心。因为后面不管是算相似度，还是写入 Redis，本质上都依赖同一步：**先把文本变成向量。**

### 4.1 定义

**Embedding（嵌入）** 是将文本字符串表示为**向量（浮点数列表）**的过程。通过计算向量之间的距离或相似度，可以衡量文本之间的相关性：**距离越小（或相似度越高），相关性越高**；距离越大，相关性越低。

**一句话概括：** Embeddings 用来衡量文本之间的相关性。

**常见应用包括：**

- **搜索**：按与查询的相关性对结果排序
- **聚类**：按文本相似性分组
- **推荐**：根据相关文本推荐内容
- **异常检测**：找出与多数内容相关性较低的异常点
- **多样性测量**：分析相似性分布
- **分类**：按与标签的相似性对文本分类

LangChain 官方则进一步强调了两个 API：

- `embed_query(text)`：把单条查询文本转成向量
- `embed_documents(texts)`：把多条文档文本批量转成向量

这一组区分正好对应真实项目里的两个阶段：

- **索引阶段**：把文档片段批量向量化，通常用 `embed_documents`
- **查询阶段**：把用户问题向量化，通常用 `embed_query`

### 4.2 重要实践规则

跑案例前，先看清这几条经验：

1. Embedding 模型输出的是向量，不是自然语言。
2. 不同 Embedding 模型的维度可能不同。
3. 建索引和查询必须使用同一套 Embedding 模型。
4. Embedding 适合做语义相似度计算，但它本身不负责“回答问题”。
5. 本章主线是文本 Embedding；多模态 Embedding 属于进阶扩展。

第 5 条专门解释一下。LangChain 当前官方 Embeddings 总览页主要聚焦 **文本 Embedding**；本章保留的多模态案例是通过 **DashScope 原生 SDK** 来展示扩展能力，目的是帮助你建立“Embedding 不只可用于文本”的认知，但本章的学习主线仍然是 **文本向量化**。

### 4.3 案例：DashScope 原生调用，先看到“向量长什么样”

这是最简单的 Hello 级示例，目标不是马上做检索，而是先看到：

- 文本是怎么传给 Embedding 模型的
- 返回结果结构大概长什么样
- 向量通常是怎样的一串浮点数

【案例源码】`案例与源码-2-LangChain框架/09-embedding/Text2Embedding_DashScopeHello.py`

```py
"""
【案例】DashScope 原生调用：单句文本向量化（Hello 级）

对应教程章节：第 10 章 - 向量数据库与 Embedding 实战 → 4.3 案例：DashScope 原生调用，先看到“向量长什么样”

知识点速览：
- 这是本章最小的 Embedding HelloWorld，重点是先看到“文本怎样被转成向量”，暂时还不涉及相似度计算和向量库检索。
- Embedding（嵌入）是把文本变成一串数字（向量）的过程；后续做语义检索、相似度排序、RAG，底层都会用到这个结果。
- 百炼提供原生文本嵌入接口，可直接用 dashscope.TextEmbedding.call() 传入模型名和文本，返回向量结果。
- 若要单独取出向量数组，可从 output.embeddings[0].embedding 获取；向量长度由当前模型决定。

模型文档链接：https://bailian.console.aliyun.com/cn-beijing/?productCode=p_efm&tab=doc#/doc/?type=model&url=2842587
"""

import os
import dashscope
from http import HTTPStatus
from dotenv import load_dotenv

load_dotenv()
dashscope.api_key = os.getenv("aliQwen-api")

# 待向量化的单句文本
input_text = "衣服的质量杠杠的"

# 调用百炼文本嵌入接口：先看清“请求长什么样、返回结构长什么样”
resp = dashscope.TextEmbedding.call(
    model="text-embedding-v4",
    input=input_text,
)

if resp.status_code == HTTPStatus.OK:
    # 这里直接打印完整响应，是为了先观察响应结构；后续案例再逐步只取 embedding 向量使用
    print(resp)

"""
【输出示例】
{"status_code": 200, "request_id": "0a76a5db-f4af-4e5a-b0c4-1689d81ba154", "code": "", "message": "", "output": {"embeddings": [{"embedding": [0.02258586511015892, -0.08700370043516159, -0.013521800749003887, -0.05904024466872215, 0.027100207284092903, -0.03104848973453045, 0.01432843878865242, -0.0008265386568382382,……], "text_index": 0}]}, "usage": {"total_tokens": 6}}
"""

```

学习这个案例时，建议你重点观察：

- `model` 指定的是哪个 Embedding 模型
- 返回对象里 `embedding` 在哪一层
- 这一条文本最终输出的是多长的向量

### 4.4 案例：OpenAI 兼容写法，理解“同一能力，不同接法”

很多平台虽然不是 OpenAI，但会提供 **OpenAI 兼容接口**。这意味着你可以继续用 OpenAI SDK 的调用方式，只是把：`base_url`、`api_key`、`model`改成对应平台的配置即可。

这个案例的价值在真实项目里非常大，因为它会让你意识到：**很多时候你真正学的不是“某一家厂商的私有 SDK”，而是一种通用接入模式。**

【案例源码】`案例与源码-2-LangChain框架/09-embedding/Text2Embedding_OpenAiHello.py`

```py
"""
【案例】OpenAI 兼容接口调用阿里百炼 Embedding（Hello 级）

对应教程章节：第 10 章 - 向量数据库与 Embedding 实战 → 4.4 案例：OpenAI 兼容写法，理解“同一能力，不同接法”

知识点速览：
- 这个案例演示的是“同一类 Embedding 能力，可以通过 OpenAI 兼容协议来调用”，重点不在 SDK 名字，而在兼容接口思想。
- 对真实项目来说，这种写法很常见，因为保留同一套调用方式后，切换厂商时通常只需要调整 base_url、api_key、model。
- client.embeddings.create() 的 input 可以是单字符串或字符串列表；返回结果中的 data[i].embedding 就是向量。
- 若平台存在不同地域或不同网关，base_url 与对应 API Key 需要保持匹配。
"""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

input_text = "衣服的质量杠杠的"

# 使用 OpenAI 兼容接口连接阿里百炼：调用方式仍是 OpenAI SDK，只是连接地址改成百炼的兼容网关
client = OpenAI(
    api_key=os.getenv("aliQwen-api"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# 与 OpenAI Embedding 调用方式一致：model 为百炼模型名，input 为待向量化的文本
completion = client.embeddings.create(model="text-embedding-v4", input=input_text)

print(completion.model_dump_json())

"""
【输出示例】
注：embedding共1024维度，即len(completion.data[0].embedding) == 1024
{"data":[{"embedding":[0.02258586511015892,-0.08700370043516159,-0.013521800749003887,-0.05904024466872215,0.027100207284092903,-0.03104848973453045,0.01432843878865242,0.01706676371395588,'.....'],"index":0,"object":"embedding"}],"model":"text-embedding-v4","object":"list","usage":{"prompt_tokens":6,"total_tokens":6},"id":"37989997-27b1-9416-98af-091ae0b5c118"}
"""

```

### 4.5 案例：用 LangChain 的统一接口做单条与批量向量化

当你开始做 LangChain 项目时，更推荐理解这一层封装。因为后面不管是检索器、向量库、RAG，很多组件都是围绕 LangChain 的 Embeddings 接口来协作的。

这个案例非常关键，因为它直接演示了：

- `embed_query(text)`：单条查询文本向量化
- `embed_documents(texts)`：多条文档文本批量向量化

这两个方法，基本就是后面做检索的“索引阶段”和“查询阶段”的缩影。

【案例源码】`案例与源码-2-LangChain框架/09-embedding/Text2Embedding_DashScope.py`

```py
"""
【案例】LangChain DashScope 封装：单条与批量文本向量化

对应教程章节：第 10 章 - 向量数据库与 Embedding 实战 → 4.5 案例：用 LangChain 的统一接口做单条与批量向量化

知识点速览：
- 这是最贴近后续 LangChain 检索器、向量库、RAG 用法的 Embedding 案例，因为它使用的是 LangChain 统一接口。
- embed_query(text)：更偏“查询阶段”，常用于把用户问题转成向量。
- embed_documents(texts)：更偏“索引阶段”，常用于把文档片段批量转成向量。
- 返回值分别是“单个向量”和“向量列表”；向量维度由当前模型决定，建索引和查询时应保持模型一致。

模型文档链接：https://bailian.console.aliyun.com/cn-beijing/?tab=api#/api/?type=model&url=2587654
"""

# pip install langchain-community dashscope
import os
from langchain_community.embeddings import DashScopeEmbeddings
from dotenv import load_dotenv

load_dotenv()

# 使用项目统一的 aliQwen-api；DashScopeEmbeddings 默认只读 DASHSCOPE_API_KEY，故显式传入
embeddings = DashScopeEmbeddings(
    model="text-embedding-v4",
    dashscope_api_key=os.getenv("aliQwen-api"),
)

text = "This is a test document."

# 单条文本 → 一个向量（列表）；这类写法更贴近“把用户问题转成查询向量”
query_result = embeddings.embed_query(text)
# sep=""：print 多个参数时用空字符串连接，默认是空格；这里让「文本向量长度：」和数字紧挨着输出，中间不留空
print("文本向量长度：", len(query_result), sep="")

# 多条文本 → 多个向量（列表的列表）；这类写法更贴近“批量建索引”
doc_results = embeddings.embed_documents(
    [
        "Hi there!",
        "Oh, hello!",
        "What's your name?",
        "My friends call me World",
        "Hello World!",
    ]
)
print(doc_results)
# sep=""：多个参数之间不加空格，输出如「文本向量数量：5，文本向量长度：1024」
print(
    "文本向量数量：", len(doc_results), "，文本向量长度：", len(doc_results[0]), sep=""
)

```

运行时你可以特别留意：单条返回的是一个向量；批量返回的是“向量列表”；len(向量)对应维度。

### 4.6 案例：进阶扩展，多模态 Embedding

这一节不作为本章主线要求，主要帮助你知道：Embedding 不只可以处理文本，也可以扩展到图文等多模态输入。不过要注意，本案例使用的是 **DashScope 原生多模态 Embedding 接口**，并不是 LangChain 统一文本 Embeddings 接口本身。

初学者先知道两件事就够了：

1. **Embedding 的思想不只适用于文本。**
2. **本章先把文本 Embedding 学稳，多模态后面按需拓展。**

【案例源码】`案例与源码-2-LangChain框架/09-embedding/Text2Embedding_DashScopePro.py`

```py
"""
【案例】DashScope 多模态 Embedding：文本/图像向量化（进阶）

对应教程章节：第 10 章 - 向量数据库与 Embedding 实战 → 4.6 案例：进阶扩展，多模态 Embedding

知识点速览：
- 这个案例属于本章的“扩展视野”部分，用来说明 Embedding 的思想不只适用于文本，也可以扩展到图文等多模态内容。
- 多模态嵌入模型可同时处理文本和图像，input 为列表，每项可为 {"text": "..."} 或 {"image": "url"}。
- 返回结构与单模态类似，output.embeddings 为列表，每项都包含 embedding 向量。
- 本示例只演示文本输入，目的是先看懂多模态接口的返回结构；图像输入通常需要 URL 或 base64。

模型文档链接：https://bailian.console.aliyun.com/?productCode=p_efm&tab=model#/model-market/all?capabilities=ME
"""

import dashscope
import json
import os
from http import HTTPStatus
from dotenv import load_dotenv

load_dotenv()
# 多模态 call 内部用 get_default_api_key()，必须提前设置 dashscope.api_key，否则报 No api key provided
dashscope.api_key = os.getenv("aliQwen-api")

# 调用多模态 embedding 接口：支持文本或图像输入，本例只保留最小的文本演示
resp = dashscope.MultiModalEmbedding.call(
    model="tongyi-embedding-vision-plus",
    input=[{"text": "尚硅谷AI"}],
)

result = ""

if resp.status_code == HTTPStatus.OK:
    result = {
        "status_code": resp.status_code,
        "request_id": getattr(resp, "request_id", ""),
        "code": getattr(resp, "code", ""),
        "message": getattr(resp, "message", ""),
        "output": resp.output,
        "usage": resp.usage,
    }
    # ensure_ascii=False：中文等非 ASCII 按原样输出，不转成 \uxxxx；indent=4：每层缩进 4 格，便于阅读
    print(json.dumps(result, ensure_ascii=False, indent=4))

print("=================================")
print()

# 从完整结果中取出第一条 embedding 向量；后续若要做相似度比较，可直接使用这组数值
embedding_values = result["output"]["embeddings"][0]["embedding"]
print(json.dumps(embedding_values, ensure_ascii=False))

```

------

## 5、通过向量计算语义相似度

当我们已经能把文本变成向量之后，就可以继续做下一步：**比较两段文本在语义上有多接近。**

### 5.1 为什么常用余弦相似度

在向量相似度计算里，常见指标有：

- **余弦相似度（Cosine Similarity）**
- **欧氏距离（Euclidean Distance）**
- **点积（Dot Product）**

其中最适合入门先建立直觉的，通常是 **余弦相似度**。它关注的重点不是“两个向量长度有多像”，而是“两个向量方向有多接近”。对语义检索来说，这通常很有价值，因为我们更关心“意思是否接近”。

余弦相似度公式：

```text
cos(theta) = (A · B) / (|A| |B|)
```

它的结果通常在 `[-1, 1]` 范围内：

- 越接近 `1`，通常表示越相似
- 越接近 `0`，表示相关性较弱
- 越接近 `-1`，表示方向相反

OpenAI 官方文档里也明确提到：在很多 Embedding 场景里，**余弦相似度是非常常见、非常实用的选择**。

### 5.2 检索里常见的距离度量怎么选

前面我们用余弦相似度建立了直觉，但真实项目里，你在向量库、索引或 SDK 参数中还会经常看到这几个名字：

- **COSINE**：更关注向量方向是否接近，是文本语义检索里最常见、也最容易理解的一类度量。
- **L2**：欧氏距离，关注两个点在空间里的直线距离。距离越小，通常表示越接近。
- **IP（Inner Product）**：内积。某些模型或系统会直接用它做相似度计算；在向量已归一化时，它和余弦相似度往往会非常接近。

这里不要纠结“谁永远最好”，先看这条规则：

**Embedding 模型的特性、索引建立时选择的度量方式、查询时传入的 metric，三者必须保持一致。**

否则常见问题有两个：轻则结果变差，明明是相关内容却排不上来；重则索引配置和查询配置不匹配，直接报错。

所以当你看到某个向量库示例里写的是 `COSINE`、`L2` 或 `IP`，不要把它当成无关紧要的参数；它本质上决定了系统如何理解“相似”。

### 5.3 精确检索、近似检索与索引

另一个很值得尽早建立的工程概念是：**不是所有相似度检索，都会老老实实把查询向量和库里每一个向量逐个比较。**

从思路上看，大致可以分成两类：

- **精确检索（Exact KNN / FLAT）**：把查询向量和库里的所有向量都算一遍，结果最直接，也最容易理解。
- **近似检索（ANN, Approximate Nearest Neighbor）**：通过索引结构加速搜索，只近似地找到“最可能接近”的一批结果。

为什么需要近似检索？因为数据一旦上规模，逐个比较会越来越慢。于是很多向量数据库会建立索引，用空间换时间。你在不同系统里经常会见到：

- **FLAT**：更偏暴力搜索，准确但慢
- **HNSW**：工程里很常见的 ANN 索引，通常能在召回率和延迟之间取得较好平衡

![HNSW 索引示意：通过分层近邻图减少全量比较，在召回率与查询速度之间折中](https://didilili.github.io/ai-agents-from-zero/images/18/18-5-3-1.png)

入门阶段可以先记住一句话：**索引的作用不是改变“语义相似”的定义，而是让“找最相似内容”这件事在大规模数据下也能跑得动。**

这也是为什么本章前面一直强调：检索效果不只取决于 Embedding 模型，还和索引质量、参数配置、数据切分方式一起决定最终结果。

### 5.4 案例：把多句话转成向量，再两两比较

这个案例会：

1. 准备多句文本
2. 调用 Embedding 接口拿到每句文本的向量
3. 用 `numpy` 手动计算余弦相似度
4. 打印两两比较结果

【案例源码】`案例与源码-2-LangChain框架/09-embedding/Text2Embedding_CosSimilarity.py`

```py
"""
【案例】通过向量计算语义相似度：余弦相似度

对应教程章节：第 10 章 - 向量数据库与 Embedding 实战 → 5.2 案例：把多句话转成向量，再两两比较

知识点速览：
- 这个案例的重点不是特定模型，而是“向量一旦拿到手，就可以做数学比较”，这是语义检索的底层基础。
- 文本转成向量后，可用余弦相似度衡量两段文本的语义是否接近：值通常在 [-1, 1]，越接近 1 一般表示越相似。
- 公式：cos(theta) = (A·B) / (|A||B|)；在 Python 里常用 np.dot 和 np.linalg.norm 实现。
- 相似度比较常用于检索排序、文本去重、聚类、推荐等任务。
"""

import dashscope
import os
from http import HTTPStatus
import numpy as np
from dotenv import load_dotenv

load_dotenv()

# 准备多句文本，用于观察“语义越接近，相似度通常越高”
texts = ["我喜欢吃苹果", "苹果是我最喜欢吃的水果", "我喜欢用苹果手机"]

embeddings = []
# 这里选用多模态 embedding 接口来处理文本输入，主要是为了演示“拿到向量后如何做比较”
# 若你在真实项目里只处理文本，也完全可以换成常规文本 embedding 模型
for text in texts:
    input_data = [{"text": text}]
    resp = dashscope.MultiModalEmbedding.call(
        model="multimodal-embedding-v1",
        api_key=os.getenv("aliQwen-api"),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        input=input_data,
    )
    if resp.status_code == HTTPStatus.OK:
        embedding = resp.output["embeddings"][0]["embedding"]
        embeddings.append(embedding)


def cosine_similarity(vec1, vec2):
    """计算两个向量的余弦相似度：点积 / (模长之积)，结果越接近 1 一般越相似"""
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    return dot_product / (norm_vec1 * norm_vec2)


print("文本相似度比较结果:")
print("=" * 60)

for i in range(len(texts)):
    for j in range(i + 1, len(texts)):
        similarity = cosine_similarity(embeddings[i], embeddings[j])
        print(f"文本{i+1} vs 文本{j+1}:")
        print(f"  文本{i+1}: {texts[i]}")
        print(f"  文本{j+1}: {texts[j]}")
        print(f"  余弦相似度: {similarity:.4f}")
        print("-" * 40)

"""
【输出示例】
文本相似度比较结果:
============================================================
文本1 vs 文本2:
  文本1: 我喜欢吃苹果
  文本2: 苹果是我最喜欢吃的水果
  余弦相似度: 0.9064
----------------------------------------
文本1 vs 文本3:
  文本1: 我喜欢吃苹果
  文本3: 我喜欢用苹果手机
  余弦相似度: 0.7656
----------------------------------------
文本2 vs 文本3:
  文本2: 苹果是我最喜欢吃的水果
  文本3: 我喜欢用苹果手机
  余弦相似度: 0.7421
----------------------------------------
"""

```

学习这个案例时，建议重点抓住两件事：

- 重点不是“必须用哪一个模型”，而是**拿到向量后怎么做相似度计算**
- 当两句话主题更接近时，余弦相似度通常会更高

这个案例里使用的是多模态 Embedding 接口来处理文本输入，课程想演示的是“**向量一旦拿到手，就可以做数学比较**”这件事。这并不表示相似度计算必须用多模态模型；真实项目里，你完全可以用常规文本 Embedding 模型完成同样的计算。

### 5.5 相似度结果在项目里怎么用

这类分数在真实项目里最常见的用途有：

- **语义检索排序**：把最相关的文本排在前面
- **文本去重**：判断两段内容是否高度重复
- **推荐**：找相似商品、相似文章、相似问题
- **聚类分析**：把语义相近的内容分成一组

所以，不要把“余弦相似度”只理解成一道数学题。在工程里，它通常直接决定了：**检索结果排前面的内容是不是你真正想要的内容。**

------

## 6、向量库的写入与检索（RAG 的底层能力）

前面我们完成了两件事：1. 把文本转成向量；2. 学会了计算向量之间的相似度。

这一节把这两件事往前再推一步，进入真正的工程链路：**把文本和向量写入 Redis，然后按相似度做检索。**

先强调一个边界：**这一节还不是完整 RAG。**这里演示的是 RAG 的底层能力，也就是：建索引，做相似度检索。但还没有加入：文档加载器，文本切分器，检索结果交给大模型生成最终答案。

这些会在 第 11 章 RAG 检索增强生成 继续展开。

### 6.1 案例：把 Document 列表写入 Redis，再用检索器取回结果

这是本章最适合作为“第一眼向量库实战”的案例。

它做的事情可以概括成：

1. 先准备若干 `Document`（`page_content` + `metadata`，在完整 RAG 中常由加载器与切分器产生，见 第 11 章）
2. 用 `DashScopeEmbeddings` 把 `page_content` 向量化
3. 用 `Redis.from_documents(...)` 一次性写入 Redis
4. 再通过 `as_retriever()` 生成检索器
5. 对查询文本做相似度检索

这个案例最值得初学者理解的地方是：

- 向量库里存的不是孤零零的数字，而是和 `Document` 结构结合起来的内容
- 检索出来的结果不是“向量本身”，而是对应的 `Document`
- 这正是 RAG 后面能把检索结果塞回 Prompt 的基础

【案例源码】`案例与源码-2-LangChain框架/09-embedding/EmbeddingStoreRedis.py`

```py
"""
【案例】将 Document 列表向量化并写入 Redis（langchain_community）

对应教程章节：第 10 章 - 向量数据库与 Embedding 实战 → 6.1 案例：把 Document 列表写入 Redis，再用检索器取回结果

知识点速览：
- 这是本章最贴近“向量库实战入口”的案例，演示的是：先准备 Document，再向量化，再写入 Redis，最后按相似度检索。
- Redis.from_documents() 会自动读取每个 Document 的 page_content，调用 embedding 做向量化，并把原文、向量、metadata 一起写入 Redis。
- as_retriever() 得到的是检索器；invoke(查询文本) 时，LangChain 会先把查询文本转成向量，再去库里找最相关的 Document。
- 这个案例是 RAG 的底层能力演示，不包含文档加载器、文本分割器和“检索后交给大模型生成答案”的完整流程。
- redis_url 和 index_name 要与本地环境一致；如果要复用已有索引，查询端也必须使用同一个 index_name。
"""

# pip install langchain-community dashscope redis redisvl
import os
from langchain_community.embeddings import DashScopeEmbeddings
from langchain_community.vectorstores import Redis
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

# 1. 初始化嵌入模型
embeddings = DashScopeEmbeddings(
    model="text-embedding-v3", dashscope_api_key=os.getenv("aliQwen-api")
)

# 2. 构造 Document 列表：page_content 是正文，metadata 是附加信息
# 在完整 RAG 中，这些 Document 往往来自“加载器 + 分割器”；本案例先用手写数据聚焦理解向量库存取流程
texts = [
    "通义千问是阿里巴巴研发的大语言模型。",
    "Redis 是一个高性能的键值存储系统，支持向量检索。",
    "LangChain 可以轻松集成各种大模型和向量数据库。",
]
documents = [
    Document(page_content=text, metadata={"source": "manual"}) for text in texts
]

# 3. 一次性写入 Redis：内部会对每个 Document 的 page_content 做向量化，并建立可检索索引
vector_store = Redis.from_documents(
    documents=documents,
    embedding=embeddings,
    redis_url="redis://localhost:26379",
    index_name="my_index11",
)

# 4. 得到检索器：当你 invoke 查询文本时，LangChain 会先把问题向量化，再在库中做相似度检索
retriever = vector_store.as_retriever(search_kwargs={"k": 2})
results = retriever.invoke("LangChain 和 Redis 怎么结合？")
for res in results:
    print(res.page_content)

```

运行后，你可以在 RedisInsight 里看到类似下图的结构：

![RedisInsight 中查看写入的文档与向量](https://didilili.github.io/ai-agents-from-zero/images/18/18-6-1-1.jpg)

看到这张图时，建议你重点理解：

- `content` 一类字段是原始文本
- `content_vector` 一类字段是 Embedding 后的向量
- `source` 等字段是元数据

也就是说，Redis 在这里保存的是一份“可检索的语义索引”，而不是只存了一组浮点数。

### 6.2 案例：使用 langchain_redis 的 RedisVectorStore 写入文本

除了 `langchain_community.vectorstores.Redis`，项目里还保留了另一套更贴近专门 Redis 集成包的写法：

- `RedisConfig`
- `RedisVectorStore`
- `add_texts(...)`

这个案例适合帮助你理解另一种常见思路：**先创建一个向量库实例，再持续往里面追加文本。**

【案例源码】`案例与源码-2-LangChain框架/10-rag/RedisVectorStore.py`

```py
"""
【案例】使用 langchain_redis 将文本写入 Redis 向量库（add_texts）

对应教程章节：第 11 章 - RAG 检索增强生成 → 2.1.1 from_documents 与 add_texts；也可与第 10 章向量库写入案例对照阅读

知识点速览：
- 这个案例展示的是纯文本流驱动的入库路线：先创建 `RedisVectorStore`，再通过 `add_texts()` 把字符串列表写入向量库。
- `add_texts(texts, metadata)` 会在内部调用 `embed_documents(texts)` 做批量向量化，然后把文本、向量和 metadata 一起写入 Redis。
- 这条路线和 `from_documents(...)` 并不冲突：前者更适合你手里已经是纯文本列表，后者更适合你已经有 `Document` 列表。
- 本例里额外手动执行了一次 `embed_documents`，目的是先观察“向量长什么样、维度是多少”；真正做存储时，这一步不是必须的。
- 返回的 ids 可用于后续更新、删除或追踪；index_name 需要和后续检索端保持一致。
"""

from langchain_redis import RedisConfig, RedisVectorStore
from langchain_community.embeddings import DashScopeEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

# 1. 初始化嵌入模型
embeddingsModel = DashScopeEmbeddings(
    model="text-embedding-v3", dashscope_api_key=os.getenv("aliQwen-api")
)

# 2. 待写入的文本及（可选）元数据
texts = [
    "我喜欢吃苹果",
    "苹果是我最喜欢吃的水果",
    "我喜欢用苹果手机",
]


# 批量转成向量：这里只是为了先观察向量维度和内容；真正写入时 add_texts 内部会再次完成向量化
embeddings = embeddingsModel.embed_documents(texts)
for i, vec in enumerate(embeddings, 1):
    print(f"文本 {i}: {texts[i-1]}")
    print(f"向量长度: {len(vec)}")
    print(f"前5个向量值: {vec[:10]}\n")

# 定义每条文本对应的元数据信息
# metadata = [{"segment_id": "1"}, {"segment_id": "2"}, {"segment_id": "3"}]

# 定义每条文本对应的元数据信息；真实 RAG 中这些 metadata 往往来自 Document.metadata，也可作为来源展示或过滤条件
metadata = [{"segment_id": str(i)} for i in range(1, len(texts) + 1)]

# 3. Redis 连接与索引名（需与检索案例一致）
config = RedisConfig(
    index_name="newsgroups",
    redis_url="redis://localhost:26379",
)

# 创建 Redis 向量存储实例：此时只是“连上库 + 指定索引配置”，还没真正写入文本；真正写入发生在 add_texts()
vector_store = RedisVectorStore(embeddingsModel, config=config)

# 4. 将文本与元数据写入向量库（add_texts 内部会调 embed_documents，无需先算向量）
ids = vector_store.add_texts(texts, metadata)

# 打印前5个存储记录的ID
print(ids[0:5])

"""
【输出示例】
文本 1: 我喜欢吃苹果
向量长度: 1024
前5个向量值: [-0.04062262922525406, 0.03663524612784386, -0.07420649379491806, 0.003861021716147661, -0.06338627636432648, -0.02864176034927368, -0.027855515480041504, 0.03684116527438164, -0.023493731394410133, -0.027892956510186195]

文本 2: 苹果是我最喜欢吃的水果
向量长度: 1024
前5个向量值: [-0.03398064523935318, 0.04141449183225632, -0.06892527639865875, 0.005737593863159418, -0.06951850652694702, -0.04560413956642151, -0.04171110317111015, 0.04508506879210472, -0.04549290984869003, -0.017945043742656708]

文本 3: 我喜欢用苹果手机
向量长度: 1024
前5个向量值: [-0.052530914545059204, 0.006213586777448654, -0.11318981647491455, -0.023480866104364395, -0.036481890827417374, -0.04383847862482071, 0.005418661516159773, 0.02874900959432125, 0.0019732017535716295, 0.01118539646267891]

['newsgroups:01KKDZ5MRGBDPWJHDZZWH4W2Q6', 'newsgroups:01KKDZ5MRGBDPWJHDZZWH4W2Q7', 'newsgroups:01KKDZ5MRGBDPWJHDZZWH4W2Q8']
"""

```

这个案例有几个学习重点：

- `add_texts()` 适合写字符串列表
- 每条文本可以带自己的 `metadata`
- 返回的 `ids` 可用于后续删除、更新或追踪

这类写法在真实项目里很常见，因为很多时候数据并不是一次性导入，而是：

- 批量导入
- 增量追加
- 定时重建索引

### 6.3 案例：连接已有索引，做相似性检索

这个案例和上一节是一组配套案例。它假设你已经写入过数据，然后再去做查询。

核心动作是：

- 连接已有的 `index_name`
- 把查询文本向量化
- 在 Redis 中找最相近的若干条文本
- 返回 `(Document, score)` 结果

【案例源码】`案例与源码-2-LangChain框架/10-rag/RedisVectorStore_SimilaritySearch.py`

```py
"""
【案例】在 Redis 向量库中做相似性检索（similarity_search_with_score）

对应教程章节：第 11 章 - RAG 检索增强生成 → 2.1.3 再往后一步：检索案例和它们是什么关系；也可与第 10 章相似检索案例对照阅读

知识点速览：
- 这个案例对应的是 RAG 的检索阶段：前提是索引已经建好，现在要做的是“把相关内容查出来”。
- 相似性检索的核心流程是：查询文本先向量化，再到向量库中找到与查询向量最接近的若干条记录。
- `similarity_search_with_score(query, k)` 返回 `(Document, score)` 列表；很多实现里 score 更接近“距离”，通常越小越相似。
- 代码里把 score 换算成 1 - score，主要是为了更符合初学者直觉；真实项目里应以具体向量库和距离度量定义为准。
- 运行前需确保 Redis 中已有数据，例如先执行同目录下的 RedisVectorStore.py；`index_name`、`redis_url` 也必须保持一致。
- 在完整 RAG 里，这一步通常不会直接把结果打印完就结束，而是会把查到的 `Document` 进一步组织进 Prompt，再交给 LLM 生成答案。
"""

from langchain_redis import RedisConfig, RedisVectorStore
from langchain_community.embeddings import DashScopeEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

# 1. 嵌入模型（与写入时一致，保证向量空间一致）；需在 .env 中配置 aliQwen-api
embeddingsModel = DashScopeEmbeddings(
    model="text-embedding-v3", dashscope_api_key=os.getenv("aliQwen-api")
)

# 2. 连接已有索引（与 RedisVectorStore.py 中 index_name、redis_url 一致）
vector_store = RedisVectorStore(
    embeddingsModel,
    config=RedisConfig(index_name="newsgroups", redis_url="redis://localhost:26379"),
)

# 3. 查询文本 → 向量化 → 在库中做相似度检索；这里取前 3 条结果
query = "我喜欢用什么手机"
results = vector_store.similarity_search_with_score(query, k=3)

print("=== 查询结果 ===")
for i, (doc, score) in enumerate(results, 1):
    # 这里把“距离”近似换算成“相似度”只是为了展示更直观；工程里请以具体返回定义为准
    similarity = 1 - score
    print(f"结果 {i}:")
    print(f"内容: {doc.page_content}")
    print(f"元数据: {doc.metadata}")
    print(f"相似度: {similarity:.4f}")

"""
【输出示例】
=== 查询结果 ===
结果 1:
内容: 我喜欢用苹果手机
元数据: {'segment_id': '3'}
相似度: 0.8594
结果 2:
内容: 我喜欢用苹果手机
元数据: {'segment_id': '3'}
相似度: 0.8594
结果 3:
内容: 我喜欢吃苹果
元数据: {'segment_id': '1'}
相似度: 0.6610
"""

```

这里需要先区分 `score` 的含义：

**`similarity_search_with_score()` 返回的 `score`，在不少实现里表示“距离”，不一定是“越大越相似”的分数。**

所以：

- 有些场景下，`score` 越小反而表示越相似
- 代码里把它换算成 `1 - score`，更多是为了课程演示时方便直觉理解
- 实际项目中，要以当前向量库、距离度量方式和返回值定义为准

如果后续要设置召回阈值，第一步不是直接套用某个分数，而是先确认这个 `score` 表示距离还是相似度。

### 6.4 元数据过滤、混合检索与重排序

很多人在跑完第一个向量检索案例后，会误以为“检索 = 把问题转成向量，然后直接搜 top-k”。这条主线当然没错，但真实项目里，通常还会再叠加三类能力：

- **元数据过滤（metadata filter）**：先用 `source`、`category`、时间范围、权限字段等条件缩小候选范围，再做向量检索。
- **混合检索（hybrid retrieval）**：同时结合语义向量检索和关键词检索，或者结合不同类型的召回路径。
- **重排序（rerank）**：先召回一批候选结果，再用更精细的模型或策略重新排序。

三者各自解决的问题很清楚：

- 过滤，解决“只在某个业务范围内找”
- 混合，解决“既想看语义，也不想丢掉关键词命中”
- 重排序，解决“已经找回来了，但顺序还不够好”

其中“重排序”可以单独看一下。它并不是重新去全库里搜索，而是对**已经召回的一小批候选结果**做二次排序优化。很多系统里，向量检索负责第一阶段召回，reranker 负责第二阶段排序，这样往往能兼顾速度和效果。

本章的 Redis 实战主要演示的是**稠密向量检索的第一阶段能力**。你后面在更完整的 RAG 系统里，如果发现“能搜到，但排序不够稳”或者“关键词信息丢了”，就可以优先从这三类增强手段入手。

### 6.5 from_documents 和 add_texts 怎么理解

这两个方法都能“把内容写入向量库”，但适合的场景不完全一样：

| 方法                  | 更适合什么场景                                 | 直观理解                     |
| --------------------- | ---------------------------------------------- | ---------------------------- |
| `from_documents(...)` | 你手里已经有一批 `Document` 对象，想一次性建库 | 更像“一步到位建索引”         |
| `add_texts(...)`      | 你有字符串列表，或想持续追加数据               | 更像“在已有向量库上增量写入” |

初学阶段你不用纠结谁绝对更高级，只要知道：

- 它们都在做“文本向量化 + 写入向量库”
- 区别主要是入参结构和工程组织方式

### 6.6 本章与第19章的关系

这一节结束后，你已经掌握了 RAG 中非常关键的底层能力：

- 文本向量化
- 向量写入 Redis
- 相似性检索

而 第 11 章 会在此基础上补齐剩余三步：

1. 用加载器把 PDF / Word / Markdown 等文档读成 `Document`
2. 用文本分割器把长文档切成片段
3. 把检索结果和用户问题一起交给大模型生成答案

### 6.7 生产级扩展方向

学完 Redis 向量检索后，可以把后续提升分成三条线：

- **数据线**：增量写入、删除更新、索引重建、版本管理。
- **检索线**：metadata filter、混合检索、rerank、阈值策略。
- **平台线**：从轻量 Redis / Chroma 过渡到 Milvus、OpenSearch 等更专业的检索平台。

这三条线不用在本章全部展开，但它们会帮助你理解：向量数据库不是“存一下向量”这么简单，而是 RAG 系统效果和性能的底座。

所以，本章和第 11 章的关系可以概括为：

- **第 10 章**：先把“向量化 + 存储 + 检索”练熟
- **第 11 章**：再把它们和文档处理、Prompt、LLM 串成完整 RAG

------

**章节思考题：**

1. 为什么 Embedding 适合做语义检索，而普通关键词匹配不够？

   **参考思路：** Embedding 把文本映射到语义空间，能捕捉同义表达和相近含义；关键词匹配更依赖字面重合。比如“退款规则”和“怎么退钱”字面不同，但语义接近。

2. 向量写入数据库时，除了向量本身，还应该保存哪些信息？

   **参考思路：** 至少要保存原文片段、来源、文档 ID、段落位置、业务标签、更新时间等 metadata。否则检索回来只有一串向量，无法展示、追溯或过滤。

3. 相似度高是否一定代表答案可用？为什么？

   **参考思路：** 不一定。向量相似只能说明语义接近，可能仍然答非所问、缺少关键条件或不是最新资料。真实 RAG 还要结合阈值、过滤、Rerank 和答案生成约束。

4. 如果查询结果总是不相关，你会先排查哪些环节？

   **参考思路：** 查文档是否写入、Embedding 模型是否一致、向量维度是否匹配、查询文本是否合理、metadata 是否过滤过严、相似度计算和 Top K 是否设置得当。

**本章小结：**

- **向量与 Embedding**：Embedding 模型会把文本转换成固定长度向量，让“语义相近”可以转化成“向量接近”。
- **向量数据库**：它解决的不是普通字段查询，而是“按语义找最接近内容”的问题；这也是 RAG 能成立的基础。
- **Redis Stack**：本教程用 Redis 做向量存储，是为了让你在已有项目基础设施上快速理解向量索引与检索。
- **案例主线**：本章已经完整走通了“文本向量化 → 相似度计算 → 写入 Redis → 相似性检索”这条链路；而真正影响效果的，除了模型本身，还包括切块方式、元数据设计、阈值和是否需要混合检索。
- 学完本章后，你至少应该：能清楚说出 **向量、Embedding、向量数据库** 三者分别是什么，以及它们之间的先后关系；知道为什么“语义相近”可以映射成“向量相近”，以及为什么建库和查询要尽量使用同一个 Embedding 模型；能把“向量化 → 相似度计算 → 写入向量库 → 相似性检索”这条主线和后续 RAG 联系起来，并意识到检索效果不只由向量库本身决定。

**建议下一步：**

1. 先把 `09-embedding` 目录下的案例按顺序跑一遍，尤其是 `Text2Embedding_DashScope.py`、`Text2Embedding_CosSimilarity.py`、`EmbeddingStoreRedis.py`。
2. 再运行 `10-rag` 目录下的 `RedisVectorStore.py` 和 `RedisVectorStore_SimilaritySearch.py`，对比两种 Redis 向量库写法。
3. 学完本章后继续阅读 第 11 章 RAG 检索增强生成，把本章的向量能力接到完整 RAG 流程里。
