---
date: 2026年08月17日
---

# LangChain 快速上手与 HelloWorld

------

**本章课程目标：**

- 从“知道 LangChain 是什么”真正走到“**亲手跑通第一次 LangChain 调用**”，完成从环境准备到 HelloWorld 的闭环。
- 理解接入大模型最重要的 **调用三件套**：**API Key、模型名、Base URL**，并以 LangChain **1.x** 写法作为主线，同时能读懂旧资料里的 classic 写法。
- 会运行并理解本章全部案例：**环境检查、HelloWorld、多模型共存、企业级封装、流式输出**，为后续 Model I/O、Ollama 本地调用、提示词与消息模板、输出解析器 打基础。

**学习建议：** 这一章的目标很朴素：先让一次模型调用真的跑起来。学习时先确认依赖、模型名、API Key、Base URL 这几项，再看代码结构；第一次成功后，再比较多模型共存和工程化封装。遇到旧教程里的 0.x 写法，重点看它和本章 1.x 写法在入口和对象组织上有什么差别。

**官方文档与资源**：详见 [工具导航与参考资料索引](https://i8zoro8i.github.io/zoro_blog/column/AIAgent/工具导航与参考资料索引)。

------

## 1、LangChain 环境与约定

### 1.1 支持的大模型与课程选用

LangChain 可以通过不同集成包接入很多模型提供商，官方提供了完整的 Provider 列表：

- **Providers Overview**：https://docs.langchain.com/oss/python/integrations/providers/overview

![LangChain支持的大模型](https://didilili.github.io/ai-agents-from-zero/images/10/10-1-1-1.png)

本课程的选型是：

- **主要模型**：阿里云百炼 / 通义千问
- **辅助模型**：DeepSeek
- **扩展平台**：OpenRouter、硅基流动、Ollama 等

这样安排有两个现实原因：

1. **对国内开发者更友好**：注册、获取 API Key、访问稳定性、成本控制通常都更容易。
2. **便于迁移理解**：无论是百炼、DeepSeek，还是其他兼容 OpenAI 协议的平台，本质上都绕不开 **API Key、模型名、Base URL** 这套调用逻辑。

因此，本章虽然主要用 **阿里百炼 + DeepSeek** 举例，但你真正要学会的是“**怎么用 LangChain 接模型**”，而不是只会某一个平台。

### 1.2 Python 版本与项目环境约定

这一点先说明清楚，因为它直接决定你后面会不会遇到一连串兼容性问题。

根据 **LangChain 1.x 官方安装文档**和本项目当前依赖约定，建议你使用：

- **推荐版本**：Python **3.10**
- **支持范围**：Python **3.10–3.13**
- **不建议使用**：Python **3.14**

本仓库根目录的 requirements.txt 已明确写明：项目当前推荐 **Python 3.10**，并说明 **`langchain-redis` 等依赖暂未兼容 3.14**。因此，本章不再沿用旧资料里常见的“Python 3.8+”说法，而是建议你直接按本项目约定来，后续章节更省心。

如果你是第一次跑本仓库案例，推荐做法是：

1. 在项目根目录创建虚拟环境
2. 激活虚拟环境
3. 安装本项目完整依赖

### 1.3 运行案例前置注意事项

先看两个运行约定。很多人第一次跑不通不是代码问题，而是下面两点没注意到。

**约定一：尽量在项目根目录运行案例。**
本仓库很多脚本通过 `load_dotenv()` 从当前工作目录读取 `.env`。如果你在案例子目录里直接运行脚本，可能会读不到根目录下的 `.env`，从而出现 API Key 为空、401、403 等报错。

推荐写法：

```python
import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

load_dotenv(encoding="utf-8")

# ==================== 1. DeepSeek 模型 ====================
model_deepseek = init_chat_model(
    model="deepseek-v4-pro",  # 根据你的网关支持填入模型名
    model_provider="openai",
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
)

# ==================== 2. OpenAI 模型 (使用第三方中转网关) ====================
model_openai = init_chat_model(
    model="gpt-4o",  # 或 gpt-3.5-turbo 等
    model_provider="openai",
    api_key=os.getenv("OPENAI_API_KEY"),  # 中转站的 API Key
    base_url="https://api.chrouter.com/v1",  # 指定自定义的 OpenAI Base URL
)

# ==================== 3. Gemini 模型 ====================
# 情况 3.1: 如果 Gemini 也是通过同一个 OpenAI 中转站调用（推荐，接口统一）
model_gemini = init_chat_model(
    model="gemini-1.5-pro",  # 中转站映射的 gemini 模型 ID
    model_provider="openai",
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://api.chrouter.com/v1",
)

# 情况 3.2: 如果 Gemini 是直连 Google 官方 API (需 pip install langchain-google-genai)
# model_gemini_official = init_chat_model(
#     model="gemini-1.5-pro",
#     model_provider="google_genai",
#     api_key=os.getenv("GEMINI_API_KEY"),
# )

# ==================== 4. 测试调用 ====================
if __name__ == "__main__":
    print("--- 1. 调用 DeepSeek ---")
    print(model_deepseek.invoke("你是谁").content)
    print("*" * 50)

    print("--- 2. 调用 OpenAI (通过 chrouter 中转) ---")
    print(model_openai.invoke("你是谁").content)
    print("*" * 50)

    print("--- 3. 调用 Gemini ---")
    print(model_gemini.invoke("你是谁").content)
    print("*" * 50)
```

**约定二：先配置 `.env`，不要把 API Key 写死在代码里。**

```python
# 环境变量示例：复制此文件为 .env 并填入真实 API Key 后使用
# 各平台 Key 可在对应控制台申请，格式一般为 sk- 开头的字符串

QWEN_API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
aliQwen-api = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
deepseek-api= 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
```

------

## 2、常见大模型服务平台介绍

### 2.1 什么是调用三件套

无论你最终接的是阿里百炼、DeepSeek、OpenAI，还是其他兼容 OpenAI 协议的平台，绝大多数场景都绕不开三项信息：

- **API Key**：你是谁，用来鉴权
- **模型名**：你要调哪个模型
- **Base URL**：请求要发到哪里

这三项我把它简称为“**调用三件套**”。

可以把它们看作“打电话”时必须知道的三件事：

- **API Key**：相当于你的身份凭证
- **模型名**：相当于你要找哪位专家
- **Base URL**：相当于你拨打哪个号码

没有 API Key，平台不知道你是谁；没有模型名，平台不知道你要调哪个模型；没有 Base URL，请求甚至不知道该发往哪里。所以，本章后面的 HelloWorld 就是围绕这三件套展开。

### 2.2 常见平台一览

下面列出当前学习中比较常见的平台。你不需要一开始全部注册，但至少要知道它们的角色：

| 平台           | 入口                                                   | API Key 管理                                                 | 文档                                                         | 模型                                                         | 说明                                               |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------- |
| **阿里云百炼** | [平台](https://bailian.console.aliyun.com/)            | [API-Key](https://bailian.console.aliyun.com/?tab=model#/api-key) | [文档](https://bailian.console.aliyun.com/?tab=doc#/doc/?type=model) | [模型](https://bailian.console.aliyun.com/?tab=model#/model-market/all) | 本课程主线平台，主要用于通义千问与 OpenAI 兼容接入 |
| **DeepSeek**   | [平台](https://platform.deepseek.com/)                 | [API-Key](https://platform.deepseek.com/api_keys)            | [文档](https://api-docs.deepseek.com/zh-cn/)                 | [模型](https://platform.deepseek.com/usage)                  | 推理与代码能力强，本章用于多模型共存示例           |
| **OpenRouter** | [平台](https://openrouter.ai/)                         | [API-Key](https://openrouter.ai/settings/keys)               | [文档](https://openrouter.ai/docs/community/frameworks-and-integrations-overview) | [模型](https://openrouter.ai/models)                         | 多模型统一聚合平台，适合做“一个入口接多家模型”     |
| **硅基流动**   | [平台](https://www.siliconflow.cn/)                    | [API-Key](https://cloud.siliconflow.cn/me/account/ak)        | [文档](https://docs.siliconflow.cn/cn/userguide/capabilities/text-generation) | [模型](https://cloud.siliconflow.cn/me/models)               | 国内常见 AI API 平台，适合练手与接入开源模型       |
| **百度千帆**   | [平台](https://console.bce.baidu.com/qianfan/overview) | [API-Key](https://console.bce.baidu.com/qianfan/ais/console/apiKey) | [文档](https://cloud.baidu.com/doc/qianfan-docs/s/Mm8r1mejk) | [模型](https://console.bce.baidu.com/qianfan/modelcenter/model/buildIn/list) | 百度系模型平台                                     |
| **CloseAI**    | [平台](https://platform.closeai-asia.com/)             | [API-Key](https://platform.closeai-asia.com/)                | [文档](https://doc.closeai-asia.com/tutorial/api/openai.html) | [模型](https://doc.closeai-asia.com/)                        | OpenAI / 国际模型兼容接入平台之一                  |

------

## 3、安装依赖

### 3.1 推荐方式

如果你是跟着本仓库按章节学习，**最推荐的方式不是手动一个个装包，而是直接安装项目依赖**：

```bash
pip install -r requirements.txt
```

```python
# Python 版本要求：推荐 3.10，支持 3.10–3.13；不支持 3.14（langchain-redis 等尚未兼容）。
# 使用方式：在项目根目录执行
#   创建虚拟环境（推荐用 3.10）：
#   macOS/Linux:  python3.10 -m venv .venv && source .venv/bin/activate
#   或:           python3 -m venv .venv   （若 python3 已是 3.10–3.13）
#   Windows CMD:  py -3.10 -m venv .venv 然后  .venv\Scripts\activate.bat
#   Windows PowerShell:  py -3.10 -m venv .venv 然后  .venv\Scripts\Activate.ps1
#   激活后:  pip install -r requirements.txt

# ---------- 核心框架（01-helloworld、02-models_io、04-prompt、05_parser 等） ----------
langchain>=1.2,<2
langchain-core>=1.2,<2
langchain-openai>=1.1,<2
openai>=1.0,<3
python-dotenv>=1.0
pydantic>=2.7,<3
httpx>=0.27

# ---------- 社区与厂商集成 ----------
langchain-community>=0.3,<1
langchain-deepseek>=0.1
langchain-ollama>=0.2

# ---------- 通义千问原生 API（02-models_io/ModelIO_Qwen.py 使用 ChatTongyi 时需装） ----------
dashscope>=1.0

# ---------- 输出解析与日志（05_parser 等） ----------
loguru>=0.7

# ---------- LCEL 图可视化（06-lcel 中 get_graph().print_ascii() 需此依赖） ----------
grandalf>=0.6

# ---------- 记忆与对话历史（07-memory 中 Redis 持久化案例需此依赖，建议 5.3.1） ----------
redis>=5.3,<6

# ---------- 向量库 Redis（10-rag 中 RedisVectorStore.py、RedisVectorStore_SimilaritySearch.py 需此依赖，需 Python 3.10–3.13） ----------
langchain-redis>=0.2

# ---------- RAG 文档加载（10-rag：PDF 需 pypdf，Word 需 unstructured+python-docx 或 docx2txt，Markdown 需 markdown，JSON 需 jq） ----------
pypdf>=4.0
unstructured>=0.10
python-docx>=1.0
docx2txt>=0.8
markdown>=3.4
jq>=1.6

# ---------- RAG 文本分割（10-rag/textsplit 中 RecursiveDocumentSplitter 用 UnstructuredLoader 加载 rag.txt 需此依赖） ----------
langchain-unstructured>=1.0

# ---------- MCP 与 Agent（11-mcp、12-agent：McpServerByFastMCP / McpServerWeatherByFastMCP / McpClientAgent / AgentSmartSelectV0.3 等） ----------
mcp>=1.0
langchain-classic>=1.0
langchain-mcp-adapters>=0.2

# ---------- LangGraph（第 22–26 章、案例与源码-3-LangGraph框架） ----------
langgraph>=1.0,<2
# SQLite 检查点：案例 SqlitePersistence.py 使用 langgraph.checkpoint.sqlite.SqliteSaver 时需此包（标准库 sqlite3 无需另装）
langgraph-checkpoint-sqlite>=2.0,<4
# Supervisor 多智能体：08-multi_agent/SupervisorV0.3.py（from langgraph_supervisor import create_supervisor）
langgraph-supervisor>=0.0.20,<1

# ---------- 代码格式（可选，用于统一 .py 风格） ----------
black>=24.0
```


它能和本仓库案例保持一致，后续学到 Prompt、Parser、LCEL、Memory、RAG、Agent 时也不用再频繁补装依赖，还能避免“当前章节能跑、下一章突然缺包”的情况。

如果网络较慢，可用国内镜像：

```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 3.2 手动安装最小依赖

如果你只是想先跑通本章 HelloWorld，也可以安装最小依赖集合。 以本章案例为核心，建议至少安装：

```bash
# LangChain 主包
pip install langchain -i https://pypi.tuna.tsinghua.edu.cn/simple

# OpenAI 兼容接入（阿里百炼、OpenAI 兼容网关等常用）
pip install langchain-openai -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install openai -i https://pypi.tuna.tsinghua.edu.cn/simple

# 读取 .env
pip install python-dotenv -i https://pypi.tuna.tsinghua.edu.cn/simple

# 本项目后续大量案例会用到的核心抽象
pip install langchain-core -i https://pypi.tuna.tsinghua.edu.cn/simple
```

如果你要运行本章的 **DeepSeek 多模型共存案例**，还建议安装：

```bash
pip install langchain-deepseek -i https://pypi.tuna.tsinghua.edu.cn/simple
```

> **说明**：本项目的 requirements.txt 已包含 `langchain-deepseek`，所以如果你已经执行过 `pip install -r requirements.txt`，这里通常不需要再单独安装。

### 3.3 验证安装

安装完成后，建议先验证环境。这样可以提前发现“装错 Python”“装进了别的虚拟环境”“版本对不上”等问题。

**方法一：运行环境检查脚本**

【案例源码】

```py
"""
【案例】环境检查：LangChain 版本与安装路径

对应教程章节： - LangChain 快速上手与 HelloWorld → 3、安装依赖

知识点速览：
本脚本用于确认当前 Python 环境中 LangChain、langchain_community 的版本与安装路径，
便于排查「装错版本」「没进虚拟环境」或「解释器不是当前项目那一个」等问题。无需 API Key，可直接运行。
"""

import langchain  # 核心框架（Chain、Agent、Memory 等）
import langchain_community  # 社区扩展（部分集成、第三方工具等）
import sys  # 获取 Python 解释器信息

# LangChain 核心包版本号（需与教程/文档要求的版本区间一致）
print("langchainVersion:  " + langchain.__version__)
# 社区扩展包版本号
print("langchain_communityVersion:  " + langchain_community.__version__)
# LangChain 实际安装路径（可确认是否来自当前虚拟环境）
print("langchainfile:" + langchain.__file__)

# 当前 Python 解释器版本（如 3.10.x），用于确认运行环境
print(sys.version)
# 当前 Python 可执行文件路径；当你怀疑“包装到了 A 环境，但运行却走了 B 环境”时尤其有用
print("pythonExecutable:" + sys.executable)

"""
【输出示例】
 langchainVersion:  1.2.9
 langchain_communityVersion:  0.4.1
 langchainfile:/Users/tools/PyCharmMiscProject/python100/.venv/lib/python3.10/site-packages/langchain/__init__.py
 3.10.19 (main, Oct  9 2025, 15:25:03) [Clang 17.0.0 (clang-1700.6.3.2)]
 pythonExecutable:/Users/tools/PyCharmMiscProject/python100/.venv/bin/python
"""
```

这个脚本会输出：

- `langchain` 版本
- `langchain_community` 版本
- LangChain 实际安装路径
- 当前 Python 版本

它的价值在真实项目里非常大。因为很多“明明装了包却提示找不到”的问题，最后都是因为你运行脚本时用的不是同一个 Python 环境。

**方法二：用 PyCharm 查看已安装包**

在 PyCharm 的 **Python 软件包** 面板里，可以直接确认 `langchain`、`langchain-core`、`langchain-openai` 等包是否存在、版本是什么。

![PyCharm「Python 软件包」面板：查看已安装的 langchain、langchain-core、langchain-openai 等包及版本，用于核对是否装对虚拟环境](https://didilili.github.io/ai-agents-from-zero/images/10/10-3-3-1.png)

------

## 4、案例：基于阿里百炼的 HelloWorld

### 4.1 调用三件套

无论你接的是百炼还是其他平台，真正写代码时都离不开三件套。这里用百炼做一次完整说明。

#### 4.1.1 获得 API Key

在百炼控制台的 **API-KEY 管理**中创建并复制密钥，通常形如 `sk-xxx`。

![阿里云百炼控制台：API-KEY 管理页创建与复制密钥（形如 sk-xxx）](https://didilili.github.io/ai-agents-from-zero/images/10/10-4-1-1.jpeg)

#### 4.1.2 获得模型名

在模型广场或模型详情页里确认你真正要调用的模型标识，例如 `qwen-plus`、`qwen3-max` 等。

![百炼模型广场：浏览可选模型及在列表中展示的模型标识](https://didilili.github.io/ai-agents-from-zero/images/10/10-4-1-2.jpeg)

![模型详情页：查看实际调用时使用的模型名（与界面展示名称可能略有差异，以详情/API 文档为准）](https://didilili.github.io/ai-agents-from-zero/images/10/10-4-1-3.jpeg)

![模型名示例：如 qwen-plus、qwen3-max 等在代码 `model=` 中填写的字符串](https://didilili.github.io/ai-agents-from-zero/images/10/10-4-1-4.jpeg)

#### 4.1.3 获得 Base URL

如果你走的是 OpenAI 兼容接法，就需要对应的兼容接口地址，例如：

![百炼文档或控制台：OpenAI 兼容模式的 Base URL（如 compatible-mode/v1 根地址）](https://didilili.github.io/ai-agents-from-zero/images/10/10-4-1-5.jpeg)

当前课程里最常见的百炼 Base URL 是：

```text
https://dashscope.aliyuncs.com/compatible-mode/v1
```

**本节小结**

| 项目         | 示例 / 说明                                         |
| ------------ | --------------------------------------------------- |
| **API Key**  | `sk-xxx`（在控制台创建）                            |
| **模型名**   | 如 `qwen-plus`、`qwen3-max`                         |
| **Base URL** | `https://dashscope.aliyuncs.com/compatible-mode/v1` |

### 4.2 HelloWorld 的最小调用链路

在写代码之前，先把最小链路想明白：

```text
准备三件套 → 初始化模型 → invoke("问题") → 读取 response.content
```

这里有两个关键词先认识：

- `invoke()`：同步调用模型，返回一个消息对象
- `.content`：取出消息对象里的正文文本

换句话说：

- `invoke()` = “把问题发出去”
- `.content` = “把模型真正回答的文字取出来”

这就是本章最核心的最小调用链。

### 4.3 示例代码（0.3 与 1.x 两种写法）

这一节会保留两种写法，不是因为你新项目里都要用，而是因为现实里你一定会同时遇到两类资料：

- 老教程、老项目：经常还是 0.x / 经典写法
- 新项目、官方主线：更多使用 1.x 统一入口写法

#### 4.3.1 方式一：LangChain 0.3 / 经典写法

【案例源码】

```py
"""
【案例】LangChain 0.x 写法：ChatOpenAI + 三种配置方式（硬编码 / 环境变量 / .env）

对应教程章节： - LangChain 快速上手与 HelloWorld → 4、实战：基于阿里百炼的 HelloWorld

知识点速览：
- 0.x 写法从各厂商包直接导入具体类（如 ChatOpenAI），通过 base_url 接国内兼容接口。
- 配置方式演进：硬编码（不推荐）→ 环境变量 → .env + load_dotenv（推荐），避免 API Key 进版本库。
- invoke 同步调用、response.content 取回复正文。了解即可，当前主推 1.0 的 init_chat_model 写法。

补充说明：
- 本脚本虽然放在“阿里百炼 HelloWorld”这一节里，但当前演示模型使用的是部署在阿里百炼兼容端点上的 `deepseek-v3.2`。
- 重点不在“必须调用哪一个模型”，而在“看懂 0.x/经典写法如何通过 OpenAI 兼容接口完成第一次调用”。
- 运行前请在项目根目录准备 `.env`；本仓库里 `QWEN_API_KEY` / `aliQwen-api` 都可能指向阿里百炼 Key，这是历史兼容写法。
"""

from langchain_openai import (
    ChatOpenAI,
)  # OpenAI 兼容的聊天模型封装，可配合 base_url 接国内平台
import os
from dotenv import load_dotenv  # 从 .env 文件加载环境变量，避免把 API Key 写进代码

# ========== 1. 大模型客户端初始化（三种配置方式，推荐第 3 版） ==========

# 第 1 版：硬编码写死（仅演示，不推荐）
# 缺点：API Key 会进版本库，有泄露风险；换环境要改代码。
# llm = ChatOpenAI(
#     model="qwen-plus",
#     api_key="你自己的api-key",
#     base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
# )

# 第 2 版：用系统环境变量（需先 export 或在运行前 set）
# 缺点：若未先 export/set 或未执行 load_dotenv()，代码就可能取到空值。
# llm = ChatOpenAI(
#     model="qwen-plus",
#     api_key=os.getenv("aliQwen-api"),
#     base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
# )

# 第 3 版（推荐）：用 python-dotenv 从 .env 加载，再通过 os.getenv 读取
# 项目根目录放 .env 文件，内容如：QWEN_API_KEY=sk-xxx（不要提交到 Git）。

load_dotenv(encoding="utf-8")  # encoding 指定 utf-8，避免 .env 中中文注释乱码

llm = ChatOpenAI(
    model="deepseek-v3.2",  # 模型名需与阿里百炼「模型广场」中的调用名一致
    api_key=os.getenv("QWEN_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",  # 阿里百炼 OpenAI 兼容接口地址
)

# ========== 2. 调用大模型并打印结果 ==========
# invoke：同步调用，传入用户问题字符串，返回 AIMessage 等消息对象
response = llm.invoke("你是谁")

# response 为 LangChain 消息对象，包含 content、additional_kwargs 等元数据
print(response)  # 打印完整对象（含 token 用量、finish_reason 等元数据，便于调试）
print()
print(response.content)  # 只取「正文」文本，即模型回复内容

print()

"""
【输出示例】
content='你好！我是DeepSeek，由深度求索公司创造的AI助手！😊\n\n我是一个纯文本模型，虽然不支持多模态识别功能，但我可以帮你处理上传的各种文件，比如图像、txt、pdf、ppt、word、excel文件，并从中读取文字信息进行分析处理。\n\n我的特点包括：\n- 完全免费使用，没有收费计划\n- 拥有128K的上下文处理能力\n- 支持联网搜索功能（需要手动开启）\n- 可以通过官方应用商店下载App使用\n- 知识截止到2024年7月\n\n我会以热情、细腻的方式为你提供帮助，无论是回答问题、协助思考、创作内容还是处理文档，我都很乐意为你服务！你可以随时向我提出各种问题。\n\n有什么我可以帮助你的吗？✨' additional_kwargs={'refusal': None} response_metadata={'token_usage': {'completion_tokens': 160, 'prompt_tokens': 5, 'total_tokens': 165, 'completion_tokens_details': None, 'prompt_tokens_details': {'audio_tokens': None, 'cached_tokens': 0}}, 'model_provider': 'openai', 'model_name': 'deepseek-v3.2', 'system_fingerprint': None, 'id': 'chatcmpl-aecd007c-44e7-9240-8d71-c6f49b6a6c1f', 'finish_reason': 'stop', 'logprobs': None} id='lc_run--019d2961-6144-7463-ab84-fe5828802d34-0' tool_calls=[] invalid_tool_calls=[] usage_metadata={'input_tokens': 5, 'output_tokens': 160, 'total_tokens': 165, 'input_token_details': {'cache_read': 0}, 'output_token_details': {}}

你好！我是DeepSeek，由深度求索公司创造的AI助手！😊

我是一个纯文本模型，虽然不支持多模态识别功能，但我可以帮你处理上传的各种文件，比如图像、txt、pdf、ppt、word、excel文件，并从中读取文字信息进行分析处理。

我的特点包括：
- 完全免费使用，没有收费计划
- 拥有128K的上下文处理能力
- 支持联网搜索功能（需要手动开启）
- 可以通过官方应用商店下载App使用
- 知识截止到2024年7月

我会以热情、细腻的方式为你提供帮助，无论是回答问题、协助思考、创作内容还是处理文档，我都很乐意为你服务！你可以随时向我提出各种问题。

有什么我可以帮助你的吗？✨
"""

```

这个案例最有价值的地方有三点：

- 它展示了 **`ChatOpenAI` + `base_url`** 这种经典的 OpenAI 兼容接法
- 它明确对比了 **硬编码 Key → 环境变量 → `.env`** 三种配置方式
- 它让你看到 `invoke()` 返回的是一个对象，而不只是字符串

这里要养成一个习惯：**不要把 API Key 写死在代码里**。

#### 4.3.2 方式二：LangChain 1.x 推荐写法

【案例源码】

```py
"""
【案例】LangChain 1.0 写法：init_chat_model 统一入口调用大模型

对应教程章节： - LangChain 快速上手与 HelloWorld → 4、实战：基于阿里百炼的 HelloWorld

知识点速览：
- 1.0 推荐用 init_chat_model 作为统一入口，通过 model_provider（如 "openai"）指定厂商，同一套写法可切换模型。
- 接国内平台（阿里百炼、通义等）时需显式写 model_provider="openai"，否则会报错无法推断 provider。
- 调用三件套：API Key、模型名、Base URL；invoke(问题) 返回消息对象，.content 取正文。
"""

# ========== 1. 导入依赖 ==========
import os
from dotenv import load_dotenv
from langchain.chat_models import (
    init_chat_model,
)  # 1.0 统一入口：根据 model + model_provider 创建聊天模型

load_dotenv(encoding="utf-8")

# ========== 2. 实例化模型并调用 ==========
# 关键字参数：k1=v1, k2=v2 的形式（比如这种写法：model="qwen-plus"，就是关键字参数），顺序可打乱，可读性更好
model = init_chat_model(
    model="qwen-plus",  # 模型 ID，与平台模型广场一致
    model_provider="openai",  # 表示使用「OpenAI 兼容」的 API（阿里百炼、通义等均兼容，阿里百炼不支持直接调用，需要通过OpenAI 兼容的 API 调用）
    api_key=os.getenv("aliQwen-api"),  # 需事先 export 或在下面 load_dotenv 之后再用
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# 调用并直接取回复正文：invoke 返回消息对象，.content 为文本内容
print(model.invoke("你是谁").content)

print("*" * 50)

# 若不写 model_provider="openai"，会报错：
# ValueError: Unable to infer model provider for model='qwen-plus', please specify model_provider directly.
# 原因：qwen-plus 等名称无法自动推断厂商，必须显式指定。
# 对比 0.3：0.3 用 ChatOpenAI 类，类名已表示「OpenAI 兼容」，故无需 model_provider。

# 同一个系统里面，可以同时存在多个模型，比如
model2 = init_chat_model(
    model="deepseek-v3",
    model_provider="openai",
    api_key=os.getenv("QWEN_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

print(model2.invoke("你是谁").content)

"""
【输出示例】
你好！我是通义千问（Qwen），阿里巴巴集团旗下的超大规模语言模型。我能够回答问题、创作文字，比如写故事、写公文、写邮件、写剧本、逻辑推理、编程等等，还能表达观点，玩游戏等。如果你有任何问题或需要帮助，欢迎随时告诉我！😊
**************************************************
我是DeepSeek Chat，由深度求索公司打造的AI助手！🤖✨ 我可以帮你回答问题、提供建议、聊天解闷，还能处理各种文本和文件信息。有什么我可以帮你的吗？😊
"""

```

这个案例是当前更推荐你重点掌握的写法。它最大的意义在于：通过 **`init_chat_model` 统一入口**，你不再需要为每个模型厂商记一套不同的初始化方式，而是先记住同一套调用骨架，再通过参数切换不同模型和 provider。

在 1.x 主线里，先记住这个最小关系：

| 写法                                    | 适合场景                          | 你该怎么学     |
| --------------------------------------- | --------------------------------- | -------------- |
| `init_chat_model(...)`                  | 新项目、多模型切换、课程主线      | 优先掌握       |
| `ChatOpenAI(...)` / `ChatDeepSeek(...)` | 旧项目、特定 provider 能力        | 能读懂，会迁移 |
| 厂商原生 SDK                            | 只调一次接口，不接 LangChain 链路 | 知道边界即可   |

### 4.4 0.3 与 1.x 写法差异

这个问题要先讲清，否则你后面看旧代码会很乱。

**0.3 / 经典写法的思路**是：

- 直接从具体集成包导入类，例如 `ChatOpenAI`
- 类名本身就带有“我是按哪种协议接入”的语义
- 代码非常直观，但不同厂商、不同类名会让项目越写越散

**1.x 的思路**是：

- 用 `init_chat_model` 作为统一入口
- 通过 `model`、`model_provider`、`api_key`、`base_url` 等参数描述“我要接谁”
- 同一套代码骨架更容易迁移、统一与维护

你可以这样记：

| 维度           | 0.3 / 经典写法             | 1.x / 推荐写法         |
| -------------- | -------------------------- | ---------------------- |
| **入口**       | `ChatOpenAI(...)` 等具体类 | `init_chat_model(...)` |
| **特点**       | 简单直接、旧资料常见       | 统一入口、适合新项目   |
| **适合做什么** | 读懂旧教程、兼容旧代码     | 作为当前主学习路线     |

这里补充一个真实项目建议：

> 如果你现在是从零开始做新项目，优先学 **1.x 写法**；如果你是在维护现有项目，也要能读懂 **0.3 / 经典写法**。

------

## 5、案例：多模型共存（通义 + DeepSeek）

### 5.1 多模型共存场景

现实项目里，多模型共存反而是常态。原因很简单：

- 不同模型的成本不同
- 不同模型的强项不同
- 不同业务场景对稳定性、速度、推理能力的要求不同

例如：

- 日常客服问答，用一个便宜稳定的模型
- 复杂推理或代码生成，用更擅长推理的模型
- 某些企业还会同时保留在线模型和本地模型作为备选

所以，多模型共存不是“进阶玩法”，而是非常现实的工程需求。

### 5.2 调用三件套

#### 5.2.1 获得 API Key

在 DeepSeek 控制台创建并复制 Key。

![DeepSeek 开放平台：API Key 创建、查看与管理入口](https://didilili.github.io/ai-agents-from-zero/images/10/10-5-2-1.jpeg)

#### 5.2.2 获得模型名

当前 DeepSeek API 官方主推的模型名包括：

- `deepseek-v4-flash`：适合作为默认示例模型，兼顾速度与成本。
- `deepseek-v4-pro`：适合更复杂的推理、代码和高质量生成场景。

> 说明：DeepSeek 官方文档已将 `deepseek-chat` 和 `deepseek-reasoner` 标注为兼容别名，它们会在 2026-07-24 弃用。新写代码时，优先以官方当前模型列表里的 `deepseek-v4-flash`、`deepseek-v4-pro` 等模型名为准。

![DeepSeek 文档或控制台：模型列表与调用名示意（如 deepseek-v4-flash、deepseek-v4-pro）](https://didilili.github.io/ai-agents-from-zero/images/10/10-5-2-2.jpeg)

#### 5.2.3 获得 Base URL

常见写法为：

```text
https://api.deepseek.com
```

具体仍应以 DeepSeek 官方文档为准。

![DeepSeek：普通对话模式与推理（reasoner）模式的适用场景说明示意](https://didilili.github.io/ai-agents-from-zero/images/10/10-5-2-3.jpeg)

### 5.3 多模型共存示例代码

【案例源码】

```py
"""
【案例】多模型共存：同一脚本中接入通义与 DeepSeek

对应教程章节： - LangChain 快速上手与 HelloWorld → 5、案例：多模型共存（通义 + DeepSeek）

知识点速览：
- 同一脚本可初始化多个聊天模型实例（不同 model、base_url、api_key），按场景选用或对比调用。
- 每个实例用 init_chat_model 单独配置，变量名区分（如 llm_qwen、llm_deepseek）便于后续复用。
- 通义用 model_provider="openai" + 阿里百炼 base_url；DeepSeek 可用 model_provider="deepseek" 或兼容接口。

补充说明：
- 运行本脚本前，建议已经完成本章前面的单模型 HelloWorld，否则更容易被“多变量、多平台”搞乱。
- 如果你使用的是 `model_provider="deepseek"` 这种官方 provider 写法，请确保已经安装 `langchain-deepseek`。
"""

# ========== 1. 导入依赖与环境 ==========
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
import os

load_dotenv(
    encoding="utf-8"
)  # 从 .env 加载，建议在 .env 中配置 QWEN_API_KEY、deepseek-api 等

# ========== 2. 实例化模型一：通义/百炼（OpenAI 兼容） ==========
llm_qwen = init_chat_model(
    model="qwen-plus",
    model_provider="openai",  # 阿里百炼为 OpenAI 兼容接口
    api_key=os.getenv("QWEN_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

print(llm_qwen.invoke("你是谁").content)

print("*" * 70)

# ========== 3. 实例化模型二：DeepSeek 官方 ==========
# 显式写 model_provider="deepseek" 更稳妥。若接其他厂商（如 OpenAI 兼容），则需写 model_provider="openai"。
llm_deepseek = init_chat_model(
    model="deepseek-v4-flash",  # 复杂推理或高质量生成可改用 deepseek-v4-pro
    model_provider="deepseek",  # 这里走的是 DeepSeek 官方 provider，而不是阿里百炼兼容端点
    api_key=os.getenv("deepseek-api"),  # .env 中配置 DeepSeek API Key
    base_url="https://api.deepseek.com",
)

# 多模型共存：两个实例可同时保留，按需调用
print(llm_deepseek.invoke("你是谁").content)
# 调试时可查看实例属性：print(llm_deepseek.__dict__)

"""
【输出示例】
**********************************************************************
你好！我是DeepSeek，由深度求索公司创造的AI助手！😊

我是一个纯文本模型，虽然不支持多模态识别功能，但我有文件上传功能，可以帮你处理图像、txt、pdf、ppt、word、excel等各种文件，从中读取文字信息进行分析处理。我完全免费使用，拥有128K的上下文长度，还支持联网搜索功能（需要你在Web/App中手动点开联网搜索按键）。

你可以通过官方应用商店下载我的App来使用我。我很乐意为你解答问题、协助处理各种任务，无论是学习、工作还是日常生活中的疑问，我都会热情地为你提供帮助！

有什么我可以为你做的吗？✨
"""

```

这个案例有三个特别重要的知识点：

1. **同一个脚本里可以同时创建多个模型实例**
2. **每个实例可以有自己的模型名、API Key、Base URL、provider**
3. **变量名要区分清楚**，例如 `llm_qwen`、`llm_deepseek`，避免后一个把前一个覆盖掉

它其实已经很接近真实项目了。因为正式项目里，我们很少只保留一个模型对象，而是会把多个模型按用途封装起来，例如：

- 默认问答模型
- 高级推理模型
- 便宜快速模型
- 备用降级模型

------

## 6、实战：企业级封装与流式输出

### 6.1 从 HelloWorld 到项目写法

如果你只是做一个临时脚本，HelloWorld 那种“写几行代码直接调模型”的方式已经够用了。
但只要你想把它放进真实项目，就会马上遇到这些问题：

- API Key 是否配置正确
- 日志打在哪里
- 出错时怎么区分“配置错误”和“模型调用错误”
- 模型初始化是不是每个文件都要重复写
- 网页端或终端能不能边生成边显示

这就是为什么本章最后一节要引入“**企业级封装**”和“**流式输出**”。

### 6.2 invoke() 与 stream() 的区别

这是初学者最先会用到的两种调用方式。

`invoke()`：一次性返回完整结果。
适合：

- 简单问答
- 后台处理
- 不需要实时展示中间输出的场景

`stream()`：边生成边返回。
适合：

- 命令行实时输出
- 聊天界面打字机效果
- 长文本生成
- 用户等待体验更敏感的场景

最小示例：

```python
for chunk in model.stream("请介绍一下 LangGraph"):
    print(chunk.content, end="")
```

可以这样记：

- `invoke()`：等模型全部想完，再一次性告诉你答案
- `stream()`：模型边想边说，你一边接一边显示

### 6.3 示例代码（封装、异常、流式）

【案例源码】

```py
"""
【案例】标准/工程化写法：用 LangChain 调用大模型（invoke + stream）

对应教程章节： - LangChain 快速上手与 HelloWorld → 6、实战：企业级封装与流式输出

本案例演示从零到一的完整工程化写法：
- 用通义/阿里云兼容接口通过 LangChain 发问，掌握 invoke（一次性返回）与 stream（流式返回）两种调用方式。
- 将「初始化模型」封装成函数便于复用；用 .env 存密钥、logging 打日志、try/except 区分错误，符合正式项目习惯。
- 运行前在项目根目录配置 .env 中的 QWEN_API_KEY，执行：python 案例与源码-2-LangChain框架/01-helloworld/StandardDesc.py

补充说明：
- 为了让工程化示例更直观，这里继续使用很多同学在旧资料里更常见的 `ChatOpenAI` 写法；若你想看 1.x 统一入口，请对照同目录下的 `LangChainV1.0.py`。
- 当前脚本使用的是“阿里百炼兼容端点 + DeepSeek 模型”这组组合，重点仍然是学习工程化写法，而不是限定某一个具体模型。
"""

# ========== 1. 导入与环境 ==========
# 下面每一行都是「把别人写好的功能拿进来」，后面才能用。

from langchain_openai import (
    ChatOpenAI,
)  # 用 OpenAI 兼容接口和模型对话（阿里云等也兼容这个接口）
import os  # Python 自带：用来读「环境变量」（如 API 密钥）

# load_dotenv：从项目根目录的 .env 文件里，把变量加载到「环境」里，之后用 os.getenv("变量名") 就能读到。
# 把密钥写在 .env 里而不是代码里，既安全（不把密钥提交到 Git），又方便换环境（开发/生产用不同 .env）。
from dotenv import load_dotenv

# LangChainException：LangChain 在调用模型失败时会抛出的异常类型。
# 在 main() 里用 except LangChainException 单独接住这类错误，就能打出「模型调用失败」的日志，和配置错误、其他未知错误区分开。
from langchain_core.exceptions import LangChainException

# 真正执行「从 .env 加载到环境」；encoding='utf-8' 避免 .env 里有中文时乱码。
load_dotenv(encoding="utf-8")

# ----- 日志配置 -----
# logging 是 Python 自带的日志库，不用 pip 安装。用 logger.info() / logger.error() 代替 print，方便区分「普通信息」和「错误」，且可统一格式、写文件等。
# 通过环境变量 LOG_LEVEL 控制输出多少：开发时用 INFO（看得到调试信息），生产时在 .env 里设 LOG_LEVEL=WARNING，就只打警告和错误，减少刷屏。
import logging

_log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, _log_level, logging.INFO),
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)  # 当前模块的 logger，后面用 logger.info(...) 即可


# ========== 2. LLM 客户端初始化（封装为函数，便于多处复用） ==========
# 「LLM」= 大语言模型（如通义千问、DeepSeek）。这里把「创建可对话的客户端」封装成一个函数，以后在别处也能直接调 init_llm_client()，不用重复写一长串配置。


def init_llm_client() -> ChatOpenAI:
    """
    初始化 LLM 客户端（封装成函数，提高复用性）。

    Returns:
        ChatOpenAI: 初始化好的「对话客户端」，可以对其调用 .invoke(问题) 或 .stream(问题)。
    """
    # 从环境变量里拿 API 密钥；没配置的话直接报错，提示去检查 .env。
    api_key = os.getenv("QWEN_API_KEY")
    if not api_key:
        raise ValueError("环境变量 QWEN_API_KEY 未配置，请检查 .env 文件")

    # 创建客户端：指定用哪个模型、密钥、接口地址，以及「回复风格」相关参数。
    llm = ChatOpenAI(
        model="deepseek-v3.2",  # 模型名称（这里演示的是“DeepSeek 模型 + 阿里百炼兼容接口”）
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",  # 阿里云提供的兼容 OpenAI 的地址
        temperature=0.7,  # 控制「随机程度」：0 更确定、重复性高；1 更随机、更有创意。一般 0.5～0.8 即可。
        max_tokens=2048,  # 单次回复最多生成多少个 token（约等于字数），防止回复过长或超限。
    )
    return llm


# ========== 3. 主逻辑：invoke（一次性） + stream（流式）两种调用方式 ==========
# 这里把「问问题、拿回答、打日志」都放在 main() 里，并用 try/except 把可能出现的错误分开处理，避免程序一报错就崩掉、且能打出清晰错误信息。


def main():
    """主函数：封装核心逻辑，符合 Python 工程化规范。"""
    try:
        # 先拿到「可对话的客户端」
        llm = init_llm_client()
        logger.info("LLM客户端初始化成功")

        # ----- 方式一：invoke（一次性拿完整回复） -----
        # 发一个问题，程序会等模型全部答完，再一次性把 response 给你。适合短问答。
        question = "你是谁"
        response = llm.invoke(question)
        logger.info(f"问题：{question}")
        logger.info(f"回答：{response.content}")  # .content 里是模型的纯文字回复

        # ----- 方式二：stream（流式，边生成边输出） -----
        # 模型边想边返回，每次返回一小段（chunk），用 for 循环一段段打印，就像打字机效果。适合长文或需要「实时看到输出」的场景。
        print("==================== 以下是流式输出（另一种调用方式）")
        print("*" * 50)
        response_stream = llm.stream("介绍下 langchain，300字以内")
        for chunk in response_stream:
            print(chunk.content, end="")  # end="" 表示不换行，紧挨着打
        print()  # 流式结束后补一个换行，避免和后续输出粘在一起

    # ----- 异常处理：根据错误类型打不同日志，方便排查 -----
    # try 里面的代码一旦报错，会跳到下面某个 except；若都不匹配，再往上抛。
    except ValueError as e:
        # 例如：.env 里没配 QWEN_API_KEY，init_llm_client 里会 raise ValueError
        logger.error(f"配置错误：{str(e)}")
    except LangChainException as e:
        # 例如：网络失败、API 限流、模型返回异常等，LangChain 会抛出 LangChainException
        logger.error(f"模型调用失败：{str(e)}")
    except Exception as e:
        # 其他没预料到的错误都归到这里，避免程序静默崩溃
        logger.error(f"未知错误：{str(e)}")


# ========== 脚本入口 ==========
# __name__ 是 Python 给每个模块自动设置的内置变量，表示「当前模块的名字」：
#   - 直接运行本文件时（如 python StandardDesc.py），Python 会把 __name__ 设为字符串 "__main__"（前后各两个下划线），
#     于是下面的条件为真，会执行 main()；
#   - 被别的文件 import 时，__name__ 是模块名（如 "01_helloworld.StandardDesc"），不等于 "__main__"，不会执行 main()，
#     避免一导入就自动跑一遍问问题。
#
# 注意：必须写 "__main__" 不能写成 "main"。Python 规定「主程序」的 __name__ 就是 "__main__"，
# 若写成 if __name__ == "main": 则条件永远为假（因为 __name__ 实际是 "__main__"），直接运行脚本时 main() 也不会被调用。
#
# 这里直接写 main() 即可，因为本文件的 main 是普通函数（def main），调用即执行。
# 若 main 是异步函数（async def main），则必须写 asyncio.run(main())，否则协程不会真正运行。
if __name__ == "__main__":
    main()

"""
【输出示例】
2026-03-26 17:30:58,192 - INFO - LLM客户端初始化成功
2026-03-26 17:31:03,613 - INFO - HTTP Request: POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions "HTTP/1.1 200 OK"
2026-03-26 17:31:03,617 - INFO - 问题：你是谁
2026-03-26 17:31:03,617 - INFO - 回答：你好！我是DeepSeek，由深度求索公司创造的AI助手。😊

我是一个纯文本模型，可以帮你解答各种问题、进行对话、协助处理文档等。虽然我不支持多模态识别，但我具有文件上传功能，可以读取和处理图像、txt、pdf、ppt、word、excel等文件中的文字信息。

我的知识截止到2024年7月，拥有128K的上下文处理能力，而且完全免费使用！如果需要最新信息，你可以手动开启联网搜索功能。

有什么我可以帮助你的吗？无论是学习、工作还是日常问题，我都很乐意为你提供帮助！✨
==================== 以下是流式输出（另一种调用方式）
**************************************************
2026-03-26 17:31:04,798 - INFO - HTTP Request: POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions "HTTP/1.1 200 OK"
LangChain 是一个用于开发大语言模型（LLM）应用的开源框架。它核心解决了LLM应用中的两大问题：**数据实时性**（LLM训练数据可能过时）和**领域局限性**（缺乏特定领域知识）。

其核心思想是通过“链”式设计，将LLM与外部数据源和工具连接起来，构建功能更强的应用。主要组件包括：
*   **模型**：兼容多种LLM（如GPT、Claude等）。
*   **提示模板**：管理并优化与LLM的交互提示。
*   **数据检索**：能从外部文档、数据库、网络等获取实时信息。
*   **链**：将多个组件按顺序组合，完成复杂任务（如问答、摘要）。
*   **代理**：让LLM自主选择调用工具（如计算器、搜索引擎）来完成任务。

简而言之，LangChain如同“乐高积木”，帮助开发者快速搭建基于LLM的智能应用，如知识库问答、文档分析、智能客服等，极大地提升了开发效率。
"""

```

这个案例比前面的 HelloWorld 更接近真实项目，主要体现在：

- **把模型初始化封装成函数**，避免到处重复写配置
- **显式检查环境变量**，减少“Key 为空还去请求”的低级错误
- **使用日志**，而不是只靠 `print`
- **区分异常类型**，便于排查问题
- **同时演示 `invoke()` 与 `stream()`**

如果说前面的案例是在教你“怎么调通”，这个案例就在教你“怎么写得像一个真正的项目”。

------

**章节思考题：**

1. 第一次 LangChain 调用失败时，你会按什么顺序排查？

   **参考思路：** 先查依赖是否安装，再查环境变量、Base URL、模型名、网络和额度，最后看代码对象和调用方式。不要一上来怀疑 LangChain；很多 HelloWorld 问题其实是配置没通。

2. 为什么本章要同时关注 `invoke()` 和 `stream()`？

   **参考思路：** `invoke()` 适合先验证完整结果，`stream()` 更接近真实产品体验，能边生成边展示。一个解决“能不能通”，一个解决“用户等待时怎么展示过程”。

3. 多模型共存时，哪些配置最容易写乱？

   **参考思路：** 模型名、Base URL、API Key、provider 包和默认参数最容易混。工程上应把不同模型的配置集中管理，避免在业务代码里到处散落。

4. 教学 Demo 和真实项目代码最大的差别是什么？

   **参考思路：** Demo 只要跑通，真实项目还要处理配置校验、日志、异常、超时、重试、流式输出和敏感信息隐藏。本章后面的工程化写法就是从“能跑”走向“能维护”。

**本章小结：**

- **HelloWorld 的本质**不是“写一个很简单的例子”，而是验证整条调用链是否打通。对 LangChain 来说，这条最小链路就是：**准备 API Key、模型名、Base URL → 初始化模型 → `invoke()` 调用 → `.content` 取回复**。
- 本章建议按 **LangChain 1.x** 语境学习，并遵循本项目当前环境约定：**Python 3.10–3.13，推荐 3.10**。如果是跟着本仓库学，优先执行 `pip install -r requirements.txt`；如果只想跑本章最小案例，至少安装 `langchain`、`langchain-openai`、`openai`、`python-dotenv`、`langchain-core`，运行 DeepSeek 多模型案例时建议补 `langchain-deepseek`。
- 本章保留的全部案例，分别对应了不同学习目标：`GetEnvInfo.py` 用于**检查环境**，`LangChainV0.3.py` 与 `LangChainV1.0.py` 用于理解 **经典写法与 1.x 写法**，`LangChain_MoreV1.0.py` 用于掌握 **多模型共存**，`StandardDesc.py` 则让你迈出从“教学 Demo”走向“工程化写法”的第一步。

**建议下一步：** 先亲手跑通本章至少两个脚本，推荐顺序是：`GetEnvInfo.py` → `LangChainV1.0.py` → `LangChain_MoreV1.0.py` → `StandardDesc.py`。跑通之后，马上进入 第 3 章 Model I/O 与模型接入，把这章中“会用”的部分升级成“真正理解为什么这样接、不同模型如何统一接入”。等你再接着学 第 5 章 提示词与消息模板 和 第 6 章 输出解析器，就能形成完整的 **输入 → 模型 → 输出** 学习闭环。
