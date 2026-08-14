---
date: 2026年08月13日
---

# 3.10 - Coze 案例：商品营销卖点提炼

------

## 本案例概要

本案例是 Coze 教程中**结构最复杂**的一例：采用 **1 个 Agent + 5 个工作流** 的混合架构，实现从「设置产品信息」→「提炼卖点」→「卖点转买点」→「生成小红书文案 / 短视频脚本」的完整营销链路，并支持按需单独执行某一环节。

### 使用的平台能力（无外部插件）

| 能力/节点类型       | 作用说明                                                     |
| ------------------- | ------------------------------------------------------------ |
| **开始 / 结束**     | 工作流入口与出口；开始节点可接收 `BOT_USER_INPUT` 及与数据表字段同名的参数（如 `name`、`description`），便于 Agent 从对话或数据库补全入参。 |
| **输出**            | 向用户逐条或一次性输出提示/结果，流式开关控制输出方式。      |
| **问答**            | 多轮交互核心：支持「直接回答」（封装为 `USER_RESPONSE`）或「选项回答」（按选项走不同分支，相当于分支 + 意图识别）。 |
| **变量赋值**        | 将节点结果写入**用户变量**（产品名称、产品功能、三类卖点、三类买点等），供本工作流及后续工作流、主流程复用。 |
| **代码**            | Python：产品名称长度校验（≤9 字）、随机抽取「营销关键词 / 短视频开头·结尾技巧关键词」等，用于校验与生成多样性。 |
| **大模型**          | 生成产品一句话描述、通用/独特/保障性卖点、卖点 → 买点转换、小红书文案、短视频分镜脚本；依赖系统提示词约束格式与风格。 |
| **选择器**          | 根据代码或前序节点输出（如是否检索到热点、名称是否合法）做条件分支。 |
| **循环 / 终止循环** | 无限循环内实现「校验不通过则重新提问」或「多轮生成文案/脚本直到用户选择不再生成」。 |
| **文本处理**        | 字符串拼接与模板，如补充描述拼接、最终汇总卖点/买点/文案/脚本为一份 Markdown。 |
| **数据表 + SQL**    | 表 `product_list` 持久化产品名称与描述；SQL 自定义节点写入；Agent 在对话无产品信息时可从该表取最新一条填充工作流入参。 |
| **知识库检索**      | 知识库「尚硅谷-抖音热点」「尚硅谷-微博热点」「短视频脚本技巧_开头/结尾」「高质量营销文案技巧」为文案/脚本生成提供热点与技巧上下文。 |
| **工作流子调用**    | 主流程中顺序调用 4 个子工作流；Agent 也可根据用户意图单独调用其中某一个。 |

### 五个工作流职责

| 工作流名称                    | 职责概要                                                     |
| ----------------------------- | ------------------------------------------------------------ |
| **set_product_name_and_desc** | 设置/更新产品信息：引导输入或选择示例产品名 → 长度校验（循环+代码+选择器）→ 大模型生成描述 → 满意则写入用户变量，否则补充后拼接再写入 → 写入数据表 → 输出整理后的产品信息。 |
| **selling_point_generation**  | 生成三类卖点：通用性 / 独特性 / 保障性。每类均为「提示 → 多轮问答（可 AI 代答）→ 大模型生成 → 满意/修改分支 → 写入对应用户变量」。依赖用户变量中的产品名称、产品功能。 |
| **selling2buying_point**      | 将已有三类卖点转为三类买点（痛点、爽点、痒点、兴奋点、安全点等）。每类为「提示 → 大模型转换 → 满意/补充分支 → 写入对应用户变量」。输入来自用户变量，无需额外参数。 |
| **red_book_and_video_script** | 基于用户变量中的买点，多轮生成「小红书文案」或「短视频分镜脚本」。循环内：是否生成 → 热点检索（知识库）→ 是否使用热点 → 随机技巧关键词（代码）→ 技巧检索 → 大模型生成 → 输出；支持多轮直到用户选择不再生成。 |
| **主流程（全流程）**          | 开始 → set_product_name_and_desc → selling_point_generation → selling2buying_point → red_book_and_video_script → 文本处理（汇总产品+卖点+买点+文案+脚本）→ 结束。 |

### 技术要点

- **Agent 调度**：通过「人设与回复逻辑」中的自然语言条件（如「只要求设置产品信息」「只要求生成卖点」「只要求卖点转买点」「生成文案或脚本」）决定调用哪一个工作流；全流程一次跑完时按固定顺序调用上述 4 个子工作流。
- **用户变量贯穿多轮与多工作流**：产品名称、产品功能、通用/独特/保障性卖点、通用/独特/保障性买点等均存为用户变量，子工作流通过开始节点或直接引用用户变量获取输入，实现「设置一次、多处使用」。
- **问答节点分支**：大量使用「选项回答」（如满意 / 修改、A/B/其他），由模型判断用户意图并进入不同分支，实现「满意则落库/写变量，否则继续提问或调用大模型补充」。
- **循环 + 选择器 + 代码**：产品名称长度校验用「无限循环 + 代码算长度 + 选择器判断 + 终止循环/重新问答」；文案/脚本生成用「循环内问答是否继续 + 选择器区分小红书/短视频 + 代码随机关键词 + 知识库检索 + 大模型」。
- **数据表与参数补全**：`product_list` 与开始节点参数名一致（`name`、`description`），便于在对话中没有产品信息时，由 Agent 从数据库取最新一条填入工作流，保证「单独生成卖点」等场景可用。
- **知识库与随机技巧**：热点库、文案技巧库、短视频开头/结尾技巧库通过检索注入大模型上下文；代码节点随机选关键词（如「形容外观」「突出价格」等）再检索，使每次生成的文案/脚本角度不同。
- **结构化输出与格式约束**：大模型通过系统提示词约束输出格式（如卖点/买点列表、小红书标题/正文/标签、短视频分镜的时长/画面/台词等），便于后续展示与拼接。

### 工作流程概览

**全流程（一次完成：设置产品 → 卖点 → 买点 → 文案/脚本）：**

```
开始(BOT_USER_INPUT)
    ↓
set_product_name_and_desc → 用户变量：产品名称、产品功能；数据表 product_list 写入
    ↓
selling_point_generation(name, description) → 用户变量：通用/独特/保障性卖点
    ↓
selling2buying_point → 用户变量：通用/独特/保障性买点
    ↓
red_book_and_video_script → 循环内可多轮生成；输出 red_book_output、script_output（列表）
    ↓
文本处理：拼接 产品名称 + 三类卖点 + 三类买点 + 小红书文案列表 + 短视频脚本列表 → 汇总 Markdown
    ↓
结束：返回汇总结果
```

**单独设置产品信息：** 开始 → set_product_name_and_desc → 结束。

**单独生成卖点：** 开始 → selling_point_generation（入参来自用户变量或数据库 name/description）→ 结束。

**单独卖点转买点：** 开始 → selling2buying_point → 结束。

**单独生成文案或脚本：** 开始 → red_book_and_video_script（循环多轮）→ 结束。

------

## 1、整体架构

本项目采用 Agent 和工作流混合架构。

由 1 个 Agent 和 5 个工作流组成，Agent 负责处理用户请求并调用工作流。

### 1.1 全流程调用链

![1.全流程调用链](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-1-1-1.png)

### 1.2 单独设置产品信息调用链

![2.单独设置产品信息调用链](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-1-2-1.svg)

### 1.3 单独生成卖点调用链

![3.单独生成卖点调用链](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-1-3-1.svg)

### 1.4 单独生成买点调用链

![4.单独生成买点调用链](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-1-4-1.svg)

### 1.5 生成文案或脚本调用链

![5.生成文案或脚本调用链](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-1-5-1.svg)

------

## 2、环境准备

### 2.1 创建 Agent

![2.1 创建 Agent](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-2-1-1.png)

![2.1 创建 Agent](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-2-1-2.png)

![2.1 创建 Agent](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-2-1-3.png)

```
智能体名称：
尚硅谷-商品营销卖点提炼
智能体功能介绍：
负责生成产品营销卖点、买点，并基于产品买点生成小红书文案或视频分镜脚本。
```

### 2.2 创建用户变量

![2.2 创建用户变量](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-2-2-1.png)

![2.2 创建用户变量](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-2-2-2.png)

------

## 3、工作流配置

智能体依赖工作流，首先完成工作流配置。

**注意 1：**工作流中调用的部分模型随着时间的推移，可能被 coze 官方下架，替换功能类似的模型即可。

**注意 2：**工作流有很多分支，测试时仅选择其中**一种**执行路线进行展示。

### 3.1 set_product_name_and_desc

整体架构如下：

![set_product_name_and_desc](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-1.png)

SVG 后缀的文件是矢量图，放大不失真。

用浏览器打开**架构图**目录下的**set_product_name_and_desc.svg**文件，任意缩放以查看工作流细节。

**下同，不再赘述。**

#### 3.1.1 创建

![3.1.1 创建](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-2.png)

![3.1.1 创建](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-3.png)

#### 3.1.2 配置

##### 1.开始节点

![1.开始节点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-4.png)

`BOT_USER_INPUT`是特殊的变量，当工作流被调用时，Agent 会将用户输入打包作为该变量的值传递给**开始**节点。

##### 2.产品名称输入提示

创建**输出**节点

![2.产品名称输入提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-5.png)

**输出节点**用于在工作流执行过程中向调用者输出消息，当工作流被 Agent 调用时，执行至输出节点时，该节点的**输出内容**会被传递给 Agent，再被后者打印在用户对话窗口。

![2.产品名称输入提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-6.png)

输出内容可以自定义，当前节点的作用是**提示用户输入希望推销的产品/服务名称**

**流式输出**选项打开时，**输出内容**会被“逐字”输出，未打开时会“一次性整体”输出。

##### 3-1.问答节点介绍

创建问答节点

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-7.png)

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-8.png)

**模型**用于处理用户输入，根据节点模型的不同，将用户输入封装为变量，或确定下游分支。

**提问内容**是工作流运行至当前节点时，输出给用户的提示。

**问答节点**有两种回答方式：

1. 直接回答

顾名思义，选择这种方式，节点会将用户输入封装在`USER_RESPONSE`变量中，将提问内容封装在`QUESTION_DATA`变量中。

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-9.png)

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-10.png)

1. 选项回答

这种方式下，问答节点相当于一个分支结构，根据用户回答或选择，工作流将执行不同的分支结构。

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-11.png)

**其他**相当于分支结构的**else**，当用户输入的回答与任意选项都不匹配时，执行此分支。

搭建下图所示的简短工作流用于测试

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-12.png)

**试运行**

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-13.png)

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-14.png)

用户可以直接点击预设选项进行选择，也可以在下方的对话框输入自定义内容，由节点的大模型判断应该执行哪个下游分支。

**直接选择**

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-15.png)

**输入文本**

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-16.png)

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-17.png)

**输入不匹配任何预设选项时**

![3-1.问答节点介绍](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-18.png)

此时执行**其他**分支

##### 3-2.产品名称选择提问

创建**问答**节点

![3-2.产品名称选择提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-19.png)

![3-2.产品名称选择提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-20.png)

![3-2.产品名称选择提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-21.png)

##### 4-1.示例产品名称赋值

当用户选择**使用示例：红烧牛肉面**时，执行此分支

![4-1.示例产品名称赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-22.png)

这是个变量赋值节点，创建方式如下：

![4-1.示例产品名称赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-23.png)

执行此节点，说明用户选择示例，将用户变量**产品名称**赋值为**红烧牛肉面**。

![4-1.示例产品名称赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-24.png)

##### 4-2.1.产品名称输入提问

这也是一个问答节点，直接接收用户输入的产品名称。

![4-2.1.产品名称输入提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-25.png)

提问内容如下：

```
📝 亲，请直接输入您想要推广的"产品/服务"名称，按照[品牌]+[产品/服务]的形式输入，其中[产品/服务]需要准确输入，不要只输入品牌名，这样我就不知道您的产品是什么了？

举例：
- 正确的输入：康师傅牛肉面、海底捞火锅、脐橙
- 错误的输入：康师傅、海底捞

💡 小提示：单次只提炼一种产品哦，如果有多个产品，建议分开开启对话~
```

##### 4-2.2.用户输入产品名称赋值

![4-2.2.用户输入产品名称赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-26.png)

将 4-2-1 节点接收的用户输入赋值给 **用户变量：产品名称**

##### 4-2.3.用户输入产品名称校验

这是一个循环节点

![4-2.3.用户输入产品名称校验](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-27.png)

循环类型设置为**无限循环**

![4-2.3.用户输入产品名称校验](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-28.png)

当前节点用于校验产品名称是否合法，校验规则是：**产品名称不超过 9**，如`一二三四五六七八九十`长度为 10，不合法，`一二三四五六七八九`长度为 9，合法。

循环内部节点如下：

###### 1.根据名称长度赋值 ifshort

这是个代码节点

![1.根据名称长度赋值 ifshort](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-29.png)

代码如下：

```python
# 在这里，您可以通过 'args'  获取节点中的输入变量，并通过 'ret' 输出结果
# 'args' 已经被正确地注入到环境中
# 下面是一个示例，首先获取节点的全部输入参数params，其次获取其中参数名为'input'的值：
# params = args.params;
# input = params['input'];
# 下面是一个示例，输出一个包含多种数据类型的 'ret' 对象：
# ret: Output =  { "name": '小明', "hobbies": ["看书", "旅游"] };

async def main(args: Args) -> Output:
    params = args.params
    ifshort = len(params["input"]) <= 9
    # 构建输出对象
    ret: Output = {
        "ifshort": ifshort
    }

    return ret
```

###### 2.判断名称是否合法

这是个**选择器**节点

![2.判断名称是否合法](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-30.png)

![2.判断名称是否合法](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-31.png)

###### 3-1.名称合法终止循环

这是个**终止循环**节点

![3-1.名称合法终止循环](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-32.png)

![3-1.名称合法终止循环](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-33.png)

###### 3-2.名称非法重新输入提问

这是个**问答**节点

![3-2.名称非法重新输入提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-34.png)

###### 4.产品名称重新输入赋值

这是个**变量赋值**节点

![4.产品名称重新输入赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-35.png)

将用户重新输入的产品名称赋值给**用户变量：产品名称**

##### 5.AI 生成产品功能描述

这是大模型节点，在成功赋值**用户变量：产品名称**变量后运行当前节点。作用是根据产品名称生成产品描述。

![5.AI 生成产品功能描述](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-36.png)

系统提示词如下：

```
帮我用一句话，从以下方面对产品进行准确的描述：
1. 产品能解决什么问题
2. 产品有什么特别之处
3. 目标用户群体是谁
```

![5.AI 生成产品功能描述](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-37.png)

##### 6.功能描述是否满意提示

这是个**输出节点**

![6.功能描述是否满意提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-38.png)

输出内容如下：

```
🎯 亲爱的😊，我已经帮你生成了一些产品描述，如果符合您的产品，我们直接开始卖点提炼吧~

产品描述：
{{output}}
```

##### 7.功能描述是否满意询问

这是个问答节点

![7.功能描述是否满意询问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-39.png)

##### 8-1.产品功能变量赋值

节点 7 选项为**满意**时执行此节点。

![8-1.产品功能变量赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-40.png)

用户对描述满意，则将 LLM 生成的输出赋值给**用户变量：产品功能**

##### 8-2.1.补充功能描述问答

节点 7 选项为**我想要进行更准确的描述**或者未选择任何预设选项时，执行此节点

![8-2.1.补充功能描述问答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-41.png)

提问内容如下：

```
🎯 好的描述可以让我们找到更好的卖点😊，下面是一些描述的提示，除此之外您也可以自行添加描述：
1⃣ 产品能解决什么问题
2⃣ 产品有什么特别之处
3⃣ 目标用户群体是谁

示例描述：
方便快捷、大块牛肉、面料量足有劲道，卫生安全有保障

💡 小提示：越准确的描述，将会让我发挥更强的能力，得到更好的结果哦~
```

##### 8-2.2.补充后功能描述拼接

这是个**文本处理**节点

![8-2.2.补充后功能描述拼接](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-42.png)

![8-2.2.补充后功能描述拼接](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-43.png)

用于将 LLM 生成的产品描述和用户补充的描述拼接在一起，作为新的产品描述。

##### 8-2.3.补充后产品功能变量赋值

这是个**变量赋值**节点。

![8-2.3.补充后产品功能变量赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-44.png)

将补充后的完整描述赋值给**用户变量：产品功能**

##### 9-1.创建数据表

![9-1.创建数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-45.png)

![9-1.创建数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-46.png)

![9-1.创建数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-47.png)

按需选择权限模式

![9-1.创建数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-48.png)

![9-1.创建数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-49.png)

![9-1.创建数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-50.png)

![9-1.创建数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-51.png)

也可以随时移除或添加提前创建好的数据表

![9-1.创建数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-52.png)

![9-1.创建数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-53.png)

##### 9-2.产品信息入库

这是个**SQL 自定义**节点

![9-2.产品信息入库](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-54.png)

![9-2.产品信息入库](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-55.png)

本节点的作用是将当前的**产品名称**和**产品描述**记录在数据表**product_list**中。

##### 10.整理产品信息

这是个**文本处理**节点，用于将**产品名称**和**产品描述**整理为便于阅读的格式。

![10.整理产品信息](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-56.png)

##### 11.结束节点

![11.结束节点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-57.png)

#### 3.1.3 测试

**注意：**工作流有很多分支，此处仅选择其中**一种**执行路线进行展示。

##### 1.选择关联智能体

![1.选择关联智能体](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-58.png)

##### 2.输入

当前工作流并不需要输入，BOT_USER_INPUT 留空即可。

![2.输入](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-59.png)

##### 3.选择产品

![3.选择产品](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-60.png)

##### 4.“满意”LLM 生成的描述

![4.“满意”LLM 生成的描述](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-61.png)

##### 5.结束

![5.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-62.png)

运行结束，回答内容如下：

```markdown
## 产品名称

红烧牛肉面

## 产品功能

1. 产品能解决什么问题：快速满足饥饿感，提供便捷美味的正餐选择。
2. 产品有什么特别之处：浓郁鲜香的牛肉汤底，搭配软烂入味的牛肉块和筋道面条。
3. 目标用户群体是谁：忙碌的上班族、学生、夜宵爱好者等追求方便与美味兼顾的消费者。
```

##### 6.查看数据表

![6.查看数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-63.png)

点击上图框选部分，打开数据表测试数据列表。

![6.查看数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-64.png)

#### 3.1.4 发布工作流

![3.1.4 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-65.png)

![3.1.4 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-66.png)

**版本描述**和**默认测试集**可选，可留空。

当前工作流被引用时，弹窗如下，确认即可。创建工作流并首次发布时不会弹窗，不用理会。

![3.1.4 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-67.png)

发布完成后自动跳转至资源库列表

![3.1.4 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-68.png)

#### 3.1.5 和 Agent 交互

##### 1.确认已添加工作流

![1.确认已添加工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-69.png)

通过上述方式创建的工作流会被添加至 Agent 的工作流标签下，如果是在资源库直接创建的工作流也可以按照以下方式添加

![1.确认已添加工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-70.png)

![1.确认已添加工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-71.png)

##### 2.编辑“人设与回复逻辑”

![2.编辑“人设与回复逻辑”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-72.png)

输入英文括号即可呼出工作流选择窗口。

![2.编辑“人设与回复逻辑”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-73.png)

已被引用的工作流如上所示。

![2.编辑“人设与回复逻辑”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-74.png)

提示词如下：

```
用户只要求设置或更新产品信息时，调用{#LibraryBlock id="7574368297250308137" uuid="q9AFbj1EIUhPEulpEmmxv" type="workflow"#}set_product_name_and_desc{#/LibraryBlock#}

当用户打招呼、输入其他内容或询问与营销无关的问题，和用户闲聊

当工作流输出不为空时，将输出格式化后打印在对话框
```

##### 3.闲聊

![3.闲聊](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-75.png)

##### 4.调用工作流

![4.调用工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-76.png)

##### 5.选择产品

![5.选择产品](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-77.png)

##### 6.满意后结束调用

![6.满意后结束调用](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-78.png)

##### 7.查看此时的数据表

![7.查看此时的数据表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-79.png)

新增了一条数据。

#### 3.1.6 Agent 调试

##### 1.查看调用参数

![1.查看调用参数](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-80.png)

![1.查看调用参数](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-81.png)

arguments 是 Agent 传递给工作流的输入参数，**不包括`BOT_USER_INPUT`**，如果开始节点有额外的输入参数会包含在当前字段下。

##### 2.调试工作流

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-82.png)

点击上图的**扳手**图标即可展开最右侧的调试窗口

根据用户输入选择调试信息

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-83.png)

查看工作流详情

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-84.png)

##### 3.工作流详情

点击上图位置后即可跳转至工作流详情页，如下：

![3.工作流详情](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-1-85.png)

可以看到开始节点的`BOT_USER_INPUT`是与 Agent 交互时用户输入的文本，没有被列在`arguments`字段下。

### 3.2 selling_point_generation

全流程如下图

![selling_point_generation](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-1.png)

#### 3.2.1 创建

![3.2.1 创建](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-2.png)

#### 3.2.2 配置

##### 1.准备-开始节点

![1.准备-开始节点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-3.png)

`name`：对应产品名称

`description`：对应产品描述

Agent 调用工作流时默认会从**现存聊天记录**中选择语义符合的变量作为开始节点的输入参数。

**当聊天记录中没有产品信息时**，我们会要求 Agent 从数据库表**product_list**中提取信息，后者会将查询到的数据**赋值给和字段同名**的工作流输入**参数**。

为了确保参数可以被正确填充，**开始节点**的**参数名必须和**数据库表的产品名称和产品描述**字段名保持一致**。因此，这里必须是**`name`和`description`**。

而 BOT_USER_INPUT 固定为用户和 Agent 交互时输入的文本，和用户变量无关。

##### 2.准备-开始提炼卖点提示

![2.准备-开始提炼卖点提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-4.png)

提示如下：

```
📊 太棒了！接下来让我们一起来提炼产品的核心卖点~

我们将通过以下3个步骤，全方位展现您产品的优势：

### 3.2.1 第1步：通用性卖点 🎯
这些卖点能够让客户快速了解你的产品！
> 比如：解决需求、即时价值、易于理解。

### 3.2.2 第2步：独特性卖点 ⭐
这些卖点能够体现产品的差异化和独特性！
> 比如：差异点、市场认可度、持续的优势。

### 3.2.3 第3步：保障性卖点 🛡
这些卖点是让用户放心购买的保证！
> 比如：品质认证、售后服务、安全保障等。
```

##### 3.通用-通用性卖点

![3.通用-通用性卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-5.png)

```
👣Step1 通用性卖点

通用性卖点是指大多数产品或服务都具备的一些基本特性或优势，如价格、质量、服务等。这些卖点虽然不是独一无二的，但它们是消费者在购买决策时会考虑的重要因素。比如洗发水产品的去屑、去油、柔顺。

接下来，让我们一起探索下面的3个问题，如果你暂时没有想法，可以让AI帮忙回答哦

1. 解决需求：我们的产品或服务解决了用户什么样的需求呢？😊
2. 即时价值：为什么用户现在就需要这个产品呢？✨
3. 易于理解的优势：这个产品或服务有什么简单易懂的优势，让客户能马上明白它的好处呢？🌟

💡 小提示：越准确的描述，将会让我发挥更强的能力，得到更好的结果哦~
```

##### 4.通用-通用卖点提问-1

![4.通用-通用卖点提问-1](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-6.png)

##### 5-1.通用-通用卖点提问-2

![5-1.通用-通用卖点提问-2](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-7.png)

当选项为**A 或者其他**时运行此节点。

![5-1.通用-通用卖点提问-2](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-8.png)

```
👣Step1 通用性卖点

通用性卖点是指大多数产品或服务都具备的一些基本特性或优势，如价格、质量、服务等。这些卖点虽然不是独一无二的，但它们是消费者在购买决策时会考虑的重要因素。比如洗发水产品的去屑、去油、柔顺。

1. 解决需求：我们的产品或服务解决了用户什么样的需求呢？😊
2. 即时价值：为什么用户现在就需要这个产品呢？✨
3. 易于理解的优势：这个产品或服务有什么简单易懂的优势，让客户能马上明白它的好处呢？🌟
```

##### 5-2.1.通用-通用-AI 回答提问

![5-2.1.通用-通用-AI 回答提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-9.png)

系统提示词如下：

```
我的产品是{{name}}，主要功能是{{function}}，帮我用一段话回答下面的问题，要尽量简短
```

![5-2.1.通用-通用-AI 回答提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-10.png)

用户提示词如下：

```
通用性卖点是指大多数产品或服务都具备的一些基本特性或优势，如价格、质量、服务等。这些卖点虽然不是独一无二的，但它们是消费者在购买决策时会考虑的重要因素。比如洗发水产品的去屑、去油、柔顺。

1. **解决需求**：我们的产品或服务解决了用户什么样的需求呢？😊
2. **即时价值**：为什么用户现在就需要这个产品呢？✨
3. **易于理解的优势**：这个产品或服务有什么简单易懂的优势，让客户能马上明白它的好处呢？🌟
```

##### 5-2.2.通用-AI 回答输出

![5-2.2.通用-AI 回答输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-11.png)

##### 6.通用-AI 提炼通用卖点

![6.通用-AI 提炼通用卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-12.png)

![6.通用-AI 提炼通用卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-13.png)

系统提示词如下：

```markdown
# Role: 营销策略专家

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是帮助用户从产品描述中提炼出通用性卖点。通用性卖点需要具备易于理解、带来即时价值、直接解决用户需求的特点。

## Constrains:

- 提炼的卖点必须满足通用性卖点的三大核心特性：
  1. 易于理解：用户无需专业知识即可立即理解
  2. 即时价值：用户能够快速感知到产品带来的实际好处
  3. 直接解决需求：明确指出能解决用户什么具体问题
- 卖点必须具有以下特质：
  1. 表述简单直接，避免专业术语和复杂概念
  2. 价值明确可感知，避免抽象或延迟性收益
  3. 解决方案具体化，避免模糊或笼统的表述
- 严格把控卖点质量：
  1. 每个卖点都需要关联具体的用户价值
  2. 确保卖点具有普遍适用性
  3. 避免夸大或虚假宣传
  4. 剔除非通用性卖点（如价格优势、一次性活动等）

## Skill:

- 深入的市场营销知识
- 优秀的信息提炼能力
- 准确的用户需求洞察能力
- 清晰的价值传达能力
- 产品分析能力

## Workflow:

1. 接收用户的产品描述和初步卖点想法
2. 分析产品的核心功能和特性
3. 识别产品的主要价值点
4. 将复杂特性转化为简单易懂的卖点
5. 验证卖点的通用性和即时性
6. 输出结构化的卖点总结

## OutputFormat:

- [卖点 1]
- [卖点 2]
- [卖点 3]

## Attention

- 每个卖点 15 字以内，简洁清晰
- 若用户没有提供任何信息或提供无关信息，则根据你的理解来输出卖点，直接输出，不需要任何解释说明
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-14.png)

用户提示词如下：

```markdown
产品名称：{{name}}
产品功能：{{function}}

用户关键描述：{{user_response}}{{ai_response}}
```

##### 7-1.通用-写入通用卖点变量

![7-1.通用-写入通用卖点变量](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-15.png)

##### 7-2.通用-通用性卖点输出

![7-2.通用-通用性卖点输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-16.png)

##### 8.通用-完善通用卖点提示

![8.通用-完善通用卖点提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-17.png)

##### 9.通用-通用卖点修改选择

![9.通用-通用卖点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-18.png)

![9.通用-通用卖点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-19.png)

这一分支结构用于补充或修改卖点，其整体架构如下：

![9.通用-通用卖点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-20.png)

##### 9-A/其它.通用-空

直接进行下一步：独特性卖点的生成。

##### 9-B.1.通用-通用卖点修改内容提问

![9-B.1.通用-通用卖点修改内容提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-21.png)

##### 9-B.1.通用-通用卖点修改提示词处理

![9-B.1.通用-通用卖点修改提示词处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-22.png)

```
我需要修改卖点，修改要求如下：
{{String1}}

原内容：
{{String2}}
```

当前节点根据用户需求，生成提示词，用于指导 LLM 按照用户的需求对卖点进行修改。

##### 9-C.1.通用-通用卖点补充内容提问

![9-C.1.通用-通用卖点补充内容提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-23.png)

##### 9-C.2.通用-通用卖点补充提示词处理

![9-C.2.通用-通用卖点补充提示词处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-24.png)

```
我需要补充卖点，补充内容如下：
{{String1}}

原内容：
{{String2}}
```

##### 9-D.通用-通用卖点 AI 补充提示词处理

![9-D.通用-通用卖点 AI 补充提示词处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-25.png)

```
请帮我再补充2个卖点，补充的卖点加在原内容的后面，并且加粗

原内容：
{{String2}}
```

##### 9-E.通用-跳转至 LLM

直接进行补充或修改，不补充提示词

![9-E.通用-跳转至 LLM](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-26.png)

##### 9-[B/C/D/E\].1.通用-通用卖点修改或补充

![9-[B/C/D/E].1.通用-通用卖点修改或补充](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-27.png)

![9-[B/C/D/E].1.通用-通用卖点修改或补充](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-28.png)

系统提示词

```markdown
# Role: 营销策略专家

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是帮助用户从产品描述中提炼出通用性卖点。通用性卖点需要具备易于理解、带来即时价值、直接解决用户需求的特点。

## Constrains:

- 提炼的卖点必须满足通用性卖点的三大核心特性：
  1. 易于理解：用户无需专业知识即可立即理解
  2. 即时价值：用户能够快速感知到产品带来的实际好处
  3. 直接解决需求：明确指出能解决用户什么具体问题
- 卖点必须具有以下特质：
  1. 表述简单直接，避免专业术语和复杂概念
  2. 价值明确可感知，避免抽象或延迟性收益
  3. 解决方案具体化，避免模糊或笼统的表述
- 严格把控卖点质量：
  1. 每个卖点都需要关联具体的用户价值
  2. 确保卖点具有普遍适用性
  3. 避免夸大或虚假宣传
  4. 剔除非通用性卖点（如价格优势、一次性活动等）

## Skill:

- 深入的市场营销知识
- 优秀的信息提炼能力
- 准确的用户需求洞察能力
- 清晰的价值传达能力
- 产品分析能力

## Workflow:

1. 接收用户的产品描述和初步卖点想法
2. 分析产品的核心功能和特性
3. 识别产品的主要价值点
4. 将复杂特性转化为简单易懂的卖点
5. 验证卖点的通用性和即时性
6. 输出结构化的卖点总结

## OutputFormat:

- [卖点 1]
- [卖点 2]
- [卖点 3]

## Attention

- 每个卖点 15 字以内，简洁清晰
- 若用户没有提供任何信息或提供无关信息，则根据你的理解来输出卖点，直接输出，不需要任何解释说明
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-29.png)

用户提示词

```
产品名称：{{name}}
产品功能：{{function}}

用户关键描述：{{user_response}}{{AI_response}}

{{modify}}{{append}}{{AI_append}}
```

##### 9-[B/C/D/E\].1-1.通用-更新通用卖点变量

![9-[B/C/D/E].1-1.通用-更新通用卖点变量](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-30.png)

##### 9-[B/C/D/E\].1-2.通用-通用性卖点修改后输出

![9-[B/C/D/E].1-2.通用-通用性卖点修改后输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-31.png)

##### 10.独特-独特性卖点

![10.独特-独特性卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-32.png)

```
👣 Step2：独特性卖点

独特性卖点就像产品的"独门绝技"，是竞争对手难以复制的优势。
就像早期的海底捞用"极致服务"打动顾客一样，好的独特性卖点能让产品在激烈的市场竞争中脱颖而出。

接下来，让我们一起探索下面的3个问题，请尽量尝试回答，如果回答不了也没关系，我会帮助你找到合适的答案

1. 差异化：相比市场上现有的产品，我们的产品是否解决了他们无法满足的用户需求呢？🌟
2. 市场认可度：用户最终选择我们产品的原因是什么呢？💖
3. 持续性：我们是否拥有一个长期保持的优势，让竞争者难以模仿呢？🤔

💡 小提示：可以让我来帮你回答哦，或者是您已经有想好的答案。
```

##### 11.独特-独特卖点提问-1

![11.独特-独特卖点提问-1](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-33.png)

##### 12-1.独特-独特卖点提问-2

![12-1.独特-独特卖点提问-2](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-34.png)

当选项为**A 或者其他**时运行此节点。

![12-1.独特-独特卖点提问-2](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-35.png)

```
👣 Step2：独特性卖点

独特性卖点就像产品的"独门绝技"，是竞争对手难以复制的优势。
就像早期的海底捞用"极致服务"打动顾客一样，好的独特性卖点能让产品在激烈的市场竞争中脱颖而出。

1. 差异化：相比市场上现有的产品，我们的产品是否解决了他们无法满足的用户需求呢？🌟
2. 市场认可度：用户最终选择我们产品的原因是什么呢？💖
3. 持续性：我们是否拥有一个长期保持的优势，让竞争者难以模仿呢？🤔
```

##### 12-2.1.独特-独特-AI 回答提问

![12-2.1.独特-独特-AI 回答提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-36.png)

系统提示词如下：

```
我的产品是{{name}}，主要功能是{{function}}，帮我用一段话回答下面的问题，要尽量简短
```

![12-2.1.独特-独特-AI 回答提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-37.png)

用户提示词如下：

```
独特性卖点是指产品或服务中独有的、与众不同的特点，这些特点是竞争对手所不具备的。独特性卖点可以是产品的功能、设计、技术、品牌故事等，它能够使产品在市场中脱颖而出，为消费者提供一个明确的购买理由。通常是人无我有，人有我强。比如早期海底捞时期，极致的服务是它的独特性卖点。

1. **差异化**：相比市场上现有的产品，我们的产品是否解决了他们无法满足的用户需求呢？🌟
2. **市场认可度**：用户最终选择我们产品的原因是什么呢？💖
3. **持续性**：我们是否拥有一个长期保持的优势，让竞争者难以模仿呢？🤔
```

##### 12-2.2.独特-AI 回答输出

![12-2.2.独特-AI 回答输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-38.png)

##### 13.独特-AI 提炼独特卖点

![13.独特-AI 提炼独特卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-39.png)

![13.独特-AI 提炼独特卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-40.png)

系统提示词如下：

```markdown
# Role: 营销策略专家

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是帮助用户从产品描述中提炼出独特性卖点。独特性卖点需要体现产品的差异化优势、市场认可度高且具有持续性的竞争优势。

## Constrains:

- 提炼的卖点必须满足独特性卖点的三大核心特性：
  1. 差异化：与竞品形成明显区隔，具有不易被模仿的特征
  2. 高认可度：目标市场对该特性有强烈的认可和需求
  3. 持续性：优势能够在较长时间内保持，不易被替代
- 卖点必须具有以下特质：
  1. 具体且可验证，避免空泛或主观的表述
  2. 有明确的竞争壁垒，如技术专利、独特资源等
  3. 能带来持续的市场竞争优势
  4. 符合目标用户的核心需求和价值观
- 严格把控卖点质量：
  1. 每个卖点都需要有支撑数据或事实依据
  2. 确保卖点具有市场差异性
  3. 避免易被模仿或替代的表面特征
  4. 剔除临时性卖点（如短期促销、一次性活动等）

## Skill:

- 深入的市场竞争分析能力
- 准确的差异化特征识别能力
- 市场趋势判断能力
- 用户需求洞察能力
- 竞争优势评估能力

## Workflow:

1. 接收用户的产品描述和初步卖点想法
2. 分析产品在市场中的竞争地位
3. 识别产品的差异化特征
4. 评估特征的市场认可度
5. 判断优势的持续性
6. 提炼独特性卖点

## OutputFormat:

- [卖点 1]
- [卖点 2]
- [卖点 3]

## Attention

- 每个卖点 15 字以内，简洁清晰
- 若用户没有提供任何信息或提供无关信息，则根据你的理解来输出卖点，直接输出，不需要任何解释说明
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-41.png)

用户提示词如下：

```markdown
产品名称：{{name}}
产品功能：{{function}}

用户关键描述：{{user_response}}{{ai_response}}
```

##### 14-1.独特-写入独特卖点变量

![14-1.独特-写入独特卖点变量](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-42.png)

##### 14-2.独特-独特性卖点输出

![14-2.独特-独特性卖点输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-43.png)

##### 15.独特-完善独特卖点提示

![15.独特-完善独特卖点提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-44.png)

##### 16.独特-独特卖点修改选择

![16.独特-独特卖点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-45.png)

![16.独特-独特卖点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-46.png)

这一分支结构用于补充或修改卖点，其整体架构如下：

![16.独特-独特卖点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-47.png)

##### 16-A/其它.独特-空

直接进行下一步：独特性卖点的生成。

##### 16-B.1.独特-独特卖点修改内容提问

![16-B.1.独特-独特卖点修改内容提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-48.png)

##### 16-B.1.独特-独特卖点修改提示词处理

![16-B.1.独特-独特卖点修改提示词处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-49.png)

```
我需要修改卖点，修改要求如下：
{{String1}}

原内容：
{{String2}}
```

当前节点根据用户需求，生成提示词，用于指导 LLM 按照用户的需求对卖点进行修改。

##### 16-C.1.独特-独特卖点补充内容提问

![16-C.1.独特-独特卖点补充内容提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-50.png)

##### 16-C.2.独特-独特卖点补充提示词处理

![16-C.2.独特-独特卖点补充提示词处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-51.png)

```
我需要补充卖点，补充内容如下：
{{String1}}

原内容：
{{String2}}
```

##### 16-D.独特-独特卖点 AI 补充提示词处理

![16-D.独特-独特卖点 AI 补充提示词处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-52.png)

```
请帮我再补充2个卖点，补充的卖点加在原内容的后面，并且加粗

原内容：
{{String2}}
```

##### 16-E.独特-跳转至 LLM

直接进行补充或修改，不补充提示词

![16-E.独特-跳转至 LLM](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-53.png)

##### 16-[B/C/D/E\].1.独特-独特卖点修改或补充

![16-[B/C/D/E].1.独特-独特卖点修改或补充](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-54.png)

![16-[B/C/D/E].1.独特-独特卖点修改或补充](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-55.png)

系统提示词

```markdown
# Role: 营销策略专家

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是帮助用户从产品描述中提炼出独特性卖点。独特性卖点需要体现产品的差异化优势、市场认可度高且具有持续性的竞争优势。

## Constrains:

- 提炼的卖点必须满足独特性卖点的三大核心特性：
  1. 差异化：与竞品形成明显区隔，具有不易被模仿的特征
  2. 高认可度：目标市场对该特性有强烈的认可和需求
  3. 持续性：优势能够在较长时间内保持，不易被替代
- 卖点必须具有以下特质：
  1. 具体且可验证，避免空泛或主观的表述
  2. 有明确的竞争壁垒，如技术专利、独特资源等
  3. 能带来持续的市场竞争优势
  4. 符合目标用户的核心需求和价值观
- 严格把控卖点质量：
  1. 每个卖点都需要有支撑数据或事实依据
  2. 确保卖点具有市场差异性
  3. 避免易被模仿或替代的表面特征
  4. 剔除临时性卖点（如短期促销、一次性活动等）

## Skill:

- 深入的市场竞争分析能力
- 准确的差异化特征识别能力
- 市场趋势判断能力
- 用户需求洞察能力
- 竞争优势评估能力

## Workflow:

1. 接收用户的产品描述和初步卖点想法
2. 分析产品在市场中的竞争地位
3. 识别产品的差异化特征
4. 评估特征的市场认可度
5. 判断优势的持续性
6. 提炼独特性卖点

## OutputFormat:

- [卖点 1]
- [卖点 2]
- [卖点 3]

## Attention

- 每个卖点 15 字以内，简洁清晰
- 若用户没有提供任何信息或提供无关信息，则根据你的理解来输出卖点，直接输出，不需要任何解释说明
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-56.png)

用户提示词

```
产品名称：{{name}}
产品功能：{{function}}

用户关键描述：{{user_response}}{{AI_response}}

{{modify}}{{append}}{{AI_append}}
```

##### 16-[B/C/D/E\].1-1.独特-更新独特卖点变量

![16-[B/C/D/E].1-1.独特-更新独特卖点变量](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-57.png)

##### 16-[B/C/D/E\].1-2.独特-独特性卖点修改后输出

![16-[B/C/D/E].1-2.独特-独特性卖点修改后输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-58.png)

##### 17.保障-保障性卖点

![17.保障-保障性卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-59.png)

```
👣 Step3：保障性卖点

保障性卖点就像给客户的"安心承诺"，能有效消除购买顾虑。
就像番茄读书承诺"永久免费"一样，好的保障性卖点能让客户放心选择。

接下来，让我们一起探索下面的3个问题，请尽量尝试回答，如果回答不了也没关系，我会帮助你找到合适的答案

1. 风险降低：客户在选择类似产品时，最担心会遇到什么风险呢？🤔🔍
2. 信任证明：有哪些具体的证明或保障措施，可以让您对产品更有信心呢？😊🔒
3. 长期承诺：为了确保客户的长期选择，您愿意做出什么样的承诺呢？🤝🌟

💡 小提示：可以让我来帮你回答哦，或者是您已经有想好的答案。
```

##### 18.保障-保障卖点提问-1

![18.保障-保障卖点提问-1](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-60.png)

##### 19-1.保障-保障卖点提问-2

![19-1.保障-保障卖点提问-2](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-61.png)

当选项为**A 或者其他**时运行此节点。

![19-1.保障-保障卖点提问-2](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-62.png)

```
👣 Step3：保障性卖点

保障性卖点就像给客户的"安心承诺"，能有效消除购买顾虑。
就像番茄读书承诺"永久免费"一样，好的保障性卖点能让客户放心选择。

1. 风险降低：客户在选择类似产品时，最担心会遇到什么风险呢？🤔🔍
2. 信任证明：有哪些具体的证明或保障措施，可以让您对产品更有信心呢？😊🔒
3. 长期承诺：为了确保客户的长期选择，您愿意做出什么样的承诺呢？🤝🌟
```

##### 19-2.1.保障-保障-AI 回答提问

![19-2.1.保障-保障-AI 回答提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-63.png)

系统提示词如下：

```
我的产品是{{name}}，主要功能是{{function}}，帮我用一段话回答下面的问题，要尽量简短
```

![19-2.1.保障-保障-AI 回答提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-64.png)

用户提示词如下：

```
保障性卖点通常与产品或服务的可靠性和安全性有关，它包括了产品的质量保证、售后服务、退款政策等。这种卖点能够减少消费者的购买风险，增加消费者对品牌的信任感。比如番茄读书的保障性卖点，永久不收费。

1. **风险降低**：客户在选择类似产品时，最担心会遇到什么风险呢？🤔🔍
2. **信任证明**：有哪些具体的证明或保障措施，可以让您对产品更有信心呢？😊🔒
3. **长期承诺**：为了确保客户的长期选择，您愿意做出什么样的承诺呢？🤝🌟
```

##### 19-2.2.保障-AI 回答输出

![19-2.2.保障-AI 回答输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-65.png)

##### 20.保障-AI 提炼保障卖点

![20.保障-AI 提炼保障卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-66.png)

![20.保障-AI 提炼保障卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-67.png)

系统提示词如下：

```markdown
# Role: 营销策略专家-保障性卖点提炼

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是帮助用户从产品描述中提炼出保障性卖点。保障性卖点需要体现产品能有效降低客户选择风险，提供可靠的信任证明，并具备长期服务承诺。

## Constrains:

- 提炼的卖点必须满足保障性卖点的三大核心特性：
  1. 风险降低：能有效消除客户的顾虑和担忧
  2. 信任证明：提供具体、可验证的保障措施
  3. 长期承诺：明确的服务承诺和售后保障
- 卖点必须具有以下特质：
  1. 具体且可执行，避免空泛承诺
  2. 有明确的保障措施和执行标准
  3. 能持续兑现对客户的承诺
  4. 符合行业规范和法律要求
- 严格把控卖点质量：
  1. 每个保障措施都要具备可操作性
  2. 确保承诺内容在企业能力范围内
  3. 避免过度承诺或模糊表述
  4. 剔除无法长期坚持的临时性承诺

## Skill:

- 准确的风险识别能力
- 可靠的保障方案设计能力
- 长期服务承诺规划能力
- 客户信任建立能力
- 风险管理评估能力

## Workflow:

1. 接收用户的产品描述和初步保障想法
2. 分析客户主要顾虑点
3. 识别现有保障措施
4. 评估信任证明的可靠性
5. 判断承诺的可持续性
6. 提炼保障性卖点
7. 确保承诺可执行性

## OutputFormat:

- [卖点 1]
- [卖点 2]
- [卖点 3]

## Attention

- 每个卖点 15 字以内，简洁清晰
- 若用户没有提供任何信息或提供无关信息，则根据你的理解来输出卖点，直接输出，不需要任何解释说明
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-68.png)

用户提示词如下：

```markdown
产品名称：{{name}}
产品功能：{{function}}

用户关键描述：{{user_response}}{{ai_response}}
```

##### 21-1.保障-写入保障卖点变量

![21-1.保障-写入保障卖点变量](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-69.png)

##### 21-2.保障-保障性卖点输出

![21-2.保障-保障性卖点输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-70.png)

##### 22.保障-完善保障卖点提示

![22.保障-完善保障卖点提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-71.png)

##### 23.保障-保障卖点修改选择

![23.保障-保障卖点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-72.png)

![23.保障-保障卖点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-73.png)

这一分支结构用于补充或修改卖点，其整体架构如下：

![23.保障-保障卖点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-74.png)

##### 23-A/其它.保障-空

直接进行下一步：独特性卖点的生成。

##### 23-B.1.保障-保障卖点修改内容提问

![23-B.1.保障-保障卖点修改内容提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-75.png)

##### 23-B.1.保障-保障卖点修改提示词处理

![23-B.1.保障-保障卖点修改提示词处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-76.png)

```
我需要修改卖点，修改要求如下：
{{String1}}

原内容：
{{String2}}
```

当前节点根据用户需求，生成提示词，用于指导 LLM 按照用户的需求对卖点进行修改。

##### 23-C.1.保障-保障卖点补充内容提问

![23-C.1.保障-保障卖点补充内容提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-77.png)

##### 23-C.2.保障-保障卖点补充提示词处理

![23-C.2.保障-保障卖点补充提示词处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-78.png)

```
我需要补充卖点，补充内容如下：
{{String1}}

原内容：
{{String2}}
```

##### 23-D.保障-保障卖点 AI 补充提示词处理

![23-D.保障-保障卖点 AI 补充提示词处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-79.png)

```
请帮我再补充2个卖点，补充的卖点加在原内容的后面，并且加粗

原内容：
{{String2}}
```

##### 23-E.保障-跳转至 LLM

直接进行补充或修改，不补充提示词

![23-E.保障-跳转至 LLM](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-80.png)

##### 23-[B/C/D/E\].1.保障-保障卖点修改或补充

![23-[B/C/D/E].1.保障-保障卖点修改或补充](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-81.png)

![23-[B/C/D/E].1.保障-保障卖点修改或补充](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-82.png)

系统提示词

```markdown
# Role: 营销策略专家-保障性卖点提炼

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是帮助用户从产品描述中提炼出保障性卖点。保障性卖点需要体现产品能有效降低客户选择风险，提供可靠的信任证明，并具备长期服务承诺。

## Constrains:

- 提炼的卖点必须满足保障性卖点的三大核心特性：
  1. 风险降低：能有效消除客户的顾虑和担忧
  2. 信任证明：提供具体、可验证的保障措施
  3. 长期承诺：明确的服务承诺和售后保障
- 卖点必须具有以下特质：
  1. 具体且可执行，避免空泛承诺
  2. 有明确的保障措施和执行标准
  3. 能持续兑现对客户的承诺
  4. 符合行业规范和法律要求
- 严格把控卖点质量：
  1. 每个保障措施都要具备可操作性
  2. 确保承诺内容在企业能力范围内
  3. 避免过度承诺或模糊表述
  4. 剔除无法长期坚持的临时性承诺

## Skill:

- 准确的风险识别能力
- 可靠的保障方案设计能力
- 长期服务承诺规划能力
- 客户信任建立能力
- 风险管理评估能力

## Workflow:

1. 接收用户的产品描述和初步保障想法
2. 分析客户主要顾虑点
3. 识别现有保障措施
4. 评估信任证明的可靠性
5. 判断承诺的可持续性
6. 提炼保障性卖点
7. 确保承诺可执行性

## OutputFormat:

- [卖点 1]
- [卖点 2]
- [卖点 3]

## Attention

- 每个卖点 15 字以内，简洁清晰
- 若用户没有提供任何信息或提供无关信息，则根据你的理解来输出卖点，直接输出，不需要任何解释说明
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-83.png)

用户提示词

```
产品名称：{{name}}
产品功能：{{function}}

用户关键描述：{{user_response}}{{AI_response}}

{{modify}}{{append}}{{AI_append}}
```

##### 23-[B/C/D/E\].1-1.保障-更新保障卖点变量

![23-[B/C/D/E].1-1.保障-更新保障卖点变量](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-84.png)

##### 23-[B/C/D/E\].1-2.保障-保障性卖点修改后输出

![23-[B/C/D/E].1-2.保障-保障性卖点修改后输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-85.png)

##### 24.卖点整理

![24.卖点整理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-86.png)

```markdown
## 通用性卖点

{{String1}}

## 独特性卖点

{{String2}}

## 保障性卖点

{{String3}}
```

##### 25.结束

![25.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-87.png)

```
产品卖点已生成~
当前卖点为：

{{output}}
```

#### 3.2.6 测试

##### 1.选择关联智能体并配置输入

BOT_USER_INPUT 留空即可。

![1.选择关联智能体并配置输入](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-88.png)

##### 2.AI 帮答

![2.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-89.png)

##### 3.“满意”并“下一步”

![3.“满意”并“下一步”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-90.png)

##### 4.AI 帮答

![4.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-91.png)

##### 5.“满意”并“下一步”

![5.“满意”并“下一步”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-92.png)

##### 6.AI 帮答

![6.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-93.png)

##### 7.“满意”并“下一步”

![7.“满意”并“下一步”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-94.png)

##### 8.结束

![8.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-95.png)

![8.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-96.png)

输出如下：

```markdown
{
"output": "## 通用性卖点\n- 5 分钟快速解饿\n- 餐厅级美味速享\n- 营养美味两不误\n- 深夜加班好伴侣\n- 香浓汤底更解馋\n\n## 独特性卖点\n- 24 小时慢炖秘制汤底\n- 厚切优质牛肉真材实料\n- 5 分钟还原餐厅级美味\n- 独家配方+稳定供应链\n- 加班熬夜专属美食方案\n\n## 保障性卖点\n- 精选优质牛肉，确保新鲜\n- 秘制汤底配方，地道美味\n- 30 分钟送达，保证口感\n- 不满意随时退换\n- 严格质检，安全放心"
}
```

回答如下：

```markdown
产品卖点已生成~
当前卖点为：

## 通用性卖点

- 5 分钟快速解饿
- 餐厅级美味速享
- 营养美味两不误
- 深夜加班好伴侣
- 香浓汤底更解馋

## 独特性卖点

- 24 小时慢炖秘制汤底
- 厚切优质牛肉真材实料
- 5 分钟还原餐厅级美味
- 独家配方+稳定供应链
- 加班熬夜专属美食方案

## 保障性卖点

- 精选优质牛肉，确保新鲜
- 秘制汤底配方，地道美味
- 30 分钟送达，保证口感
- 不满意随时退换
- 严格质检，安全放心
```

#### 3.2.7 发布工作流

![3.2.7 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-97.png)

**版本描述**和**默认测试集**可选，可留空。

当前工作流被引用时，弹窗如下，确认即可。创建工作流并首次发布时不会弹窗，不用理会。

![3.2.7 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-98.png)

发布完成后自动跳转至资源库列表

![3.2.7 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-99.png)

#### 3.2.8 和 Agent 交互

##### 1.确认已添加工作流

![1.确认已添加工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-100.png)

##### 2.编辑“人设与回复逻辑”

![2.编辑“人设与回复逻辑”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-101.png)

提示词如下：

```
用户只要求设置或更新产品信息时，调用{#LibraryBlock id="7574368297250308137" uuid="q9AFbj1EIUhPEulpEmmxv" type="workflow"#}set_product_name_and_desc{#/LibraryBlock#}
用户只要求生成卖点时，调用{#LibraryBlock id="7570982817757331508" uuid="UPgTh3SXS-DJX-dXAIlaN" type="workflow"#}selling_point_generation{#/LibraryBlock#}，当对话记录中没有产品信息时，从数据库读取最新的数据作为产品信息

当用户打招呼、输入其他内容或询问与营销无关的问题，和用户闲聊

当工作流输出不为空时，将输出格式化后打印在对话框
```

##### 3.调用工作流

此时，调试窗口的历史记录已被清空，Agent 调用自带的**TableMemory**工具查询数据库

![3.调用工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-102.png)

![3.调用工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-103.png)

![3.调用工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-104.png)

可以看到，参数被正确传递给工作流**selling_point_generation**。

##### 4.AI 帮答

![4.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-105.png)

![4.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-106.png)

##### 5.“满意”并“下一步”

![5.“满意”并“下一步”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-107.png)

##### 6.AI 帮答

![6.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-108.png)

![6.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-109.png)

##### 7.“满意”并“下一步”

![7.“满意”并“下一步”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-110.png)

![7.“满意”并“下一步”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-111.png)

##### 8.AI 帮答

![8.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-112.png)

![8.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-113.png)

##### 9.“满意”并“下一步”

![9.“满意”并“下一步”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-114.png)

![9.“满意”并“下一步”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-115.png)

全流程结束，输出如下：

```markdown
产品卖点已生成~
当前卖点为：

## 通用性卖点

- 一秒测温，快速掌握体温状况
- 手机实时查看，健康数据随时掌握
- 发烧自动提醒，守护家人更安心
- 小巧便携，随时随地监测健康
- 自动记录体温，省心管理健康

## 独特性卖点

- 24 小时持续体温监测
- 医用级精准测量技术
- 智能高温预警系统

## 保障性卖点

- 医疗级 ±0.1℃ 精准测温
- 国家认证+1 年只换不修
- 终身免费校准服务
- 蓝牙自动备份防丢失
- 30 天无理由退换保障
```

#### 3.2.9 Agent 调试

##### 1.查看调用参数

![1.查看调用参数](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-116.png)

arguments 是 Agent 传递给工作流的输入参数，**不包括`BOT_USER_INPUT`**。

##### 2.调试工作流

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-117.png)

点击上图的**扳手**图标即可展开最右侧的调试窗口

根据用户输入选择调试信息

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-118.png)

查看工作流详情

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-119.png)

##### 3.工作流详情

点击上图位置后即可跳转至工作流详情页，如下：

![3.工作流详情](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-120.png)

`BOT_USER_INPUT`是用户输入

`name`和`description`和工作流详情中**`arguments`**字段下列出的参数一致。

#### 3.2.10 附录

聊天记录中存在产品信息时，Agent 会自动提取，赋值给语义相关的工作流入参，此时不会调用**`TableMemory`**工具查询数据库表**`product_list`**

![3.2.10 附录](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-2-121.png)

### 3.3 selling2buying_point

整体架构如下：

![selling2buying_point](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-1.png)

#### 3.3.1 创建

![3.3.1 创建](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-2.png)

#### 3.3.2 配置

##### 1.准备-开始节点

![1.准备-开始节点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-3.png)

保持默认即可，当前工作流不需要额外的参数，**`BOT_USER_INPUT`**无用，可以删除。

##### 2.通用-通用卖点-买点转换开始提示

这是个**输出**节点

![2.通用-通用卖点-买点转换开始提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-4.png)

输出内容如下：

```
接下来，我们将把所有的通用性卖点、独特性卖点、保障性卖点转化为买点，您是否希望根据您的产品或服务，激发某种特定的情绪价值点呢？😊💕
```

##### 3.通用-通用买点需求提问

这是个**问答**节点

![3.通用-通用买点需求提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-5.png)

![3.通用-通用买点需求提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-6.png)

这一分支用于补充通用买点转换时的额外需求，整体架构如下。

![3.通用-通用买点需求提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-7.png)

##### 4-A/其他.通用-空

当前选项没有额外需求，不补充提示词，直接进行下一步**通用性卖点-买点转化**。

##### 4-B.通用-通用-痛点提示词

这是个**文本处理**节点。

![4-B.通用-通用-痛点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-8.png)

```
我希望激发下面的这个情绪价值点：
痛点：迫切性、亟待解决、恐惧等负面情绪
```

##### 4-C.通用-通用-爽点提示词

这是个**文本处理**节点。

![4-C.通用-通用-爽点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-9.png)

```
我希望激发下面的这个情绪价值点：
爽点：满足感、即时反馈、明显效果、成就感
```

##### 4-D.通用-通用-痒点提示词

这是个**文本处理**节点。

![4-D.通用-通用-痒点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-10.png)

```
我希望激发下面的这个情绪价值点：
痒点：从众心理、稀缺感、社交驱动、向往的
```

##### 4-E.通用-通用-兴奋点提示词

这是个**文本处理**节点。

![4-E.通用-通用-兴奋点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-11.png)

```
我希望激发下面的这个情绪价值点：
兴奋点：意外惊喜、独特体验、创新体验
```

##### 4-F.通用-通用-安全点提示词

这是个**文本处理**节点。

![4-F.通用-通用-安全点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-12.png)

```
我希望激发下面的这个情绪价值点：
安全点：带来安全感、带来信任感、感觉可靠
```

##### 4-G.1.通用-通用-其它情绪点问答

这是个**问答**节点。

![4-G.1.通用-通用-其它情绪点问答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-13.png)

提问内容如下：

```
具体是什么情绪价值点呢？

成就点、焦虑点、荣誉点、怀旧点、萌点、暖心点
```

##### 4-G.2.通用-通用-其它情绪点提示词

这是个**文本处理**节点。

![4-G.2.通用-通用-其它情绪点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-14.png)

```
我希望激发下面的这个情绪价值点：
{{String1}}
```

##### 5.通用-通用性卖点-买点转化

这是个**大模型**节点

![5.通用-通用性卖点-买点转化](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-15.png)

![5.通用-通用性卖点-买点转化](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-16.png)

系统提示词如下：

```markdown
# Role: 营销策略专家-卖点转化买点

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是将产品卖点转化为情感共鸣的买点。买点需要从用户视角出发，通过情感化表达、场景化描述，将产品价值延伸到情绪价值层面，触动用户的各类情感需求点。

## Constrains:

- 买点转化必须满足以下核心要素：
  1. 情感化表达：使用温度感、共情性的语言
  2. 用户视角：站在用户立场思考和表达
  3. 场景化描述：结合用户实际使用场景
  4. 情绪价值：触及用户的情感需求点
- 情绪点类型包括：
  1. 痛点：解决用户的困扰和不适
  2. 爽点：带来愉悦和满足感
  3. 痒点：激发用户的向往和期待
  4. 兴奋点：引发用户的热情和激动
  5. 安全点：给予用户安心和信任感
- 表达要求：
  1. 语言要简洁有力
  2. 突出情感共鸣
  3. 避免生硬的功能描述
  4. 强调用户价值体验

## Skill:

- 深度共情能力
- 场景化表达能力
- 情感诉求识别能力
- 用户心理洞察能力
- 价值转化能力

## Workflow:

1. 接收产品卖点清单
2. 分析用户情感需求
3. 识别关键场景
4. 转化情感表达
5. 提炼核心买点
6. 优化表达方式

## OutputFormat:

- [买点 1]
- [买点 2]
- [买点 3]

## Attention

每个买点 15 字以内，简洁清晰
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-17.png)

用户提示词如下：

```markdown
{{input}}

{{prompt1}}{{prompt2}}{{prompt3}}{{prompt4}}{{prompt5}}{{prompt6}}
```

##### 6.通用-通用性买点输出

这是个**输出**节点。

![6.通用-通用性买点输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-18.png)

输出内容如下：

```
通用性买点：
{{output}}
```

##### 7.通用-完善通用买点提示

这是个**输出**节点。

![7.通用-完善通用买点提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-19.png)

输出内容如下：

```
是否需要再生成一些通用性买点内容
```

##### 8.通用-通用买点修改选择

这是个**问答**节点。

![8.通用-通用买点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-20.png)

当前分支结构的作用是按照用户需求补充通用买点并为**用户变量：通用性买点**赋值，整体架构如下：

![8.通用-通用买点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-21.png)

##### 9-A/其他.通用-通用买点直接赋值

这是个**变量赋值**节点。

![9-A/其他.通用-通用买点直接赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-22.png)

用于为**用户变量：通用性买点**赋值。

##### 9-B.1.通用-AI 补充通用买点

这是个**大模型**节点。

![9-B.1.通用-AI 补充通用买点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-23.png)

![9-B.1.通用-AI 补充通用买点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-24.png)

系统提示词如下：

```markdown
# Role: 营销策略专家-卖点转化买点

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是将产品卖点转化为情感共鸣的买点。买点需要从用户视角出发，通过情感化表达、场景化描述，将产品价值延伸到情绪价值层面，触动用户的各类情感需求点。

## Constrains:

- 买点转化必须满足以下核心要素：
  1. 情感化表达：使用温度感、共情性的语言
  2. 用户视角：站在用户立场思考和表达
  3. 场景化描述：结合用户实际使用场景
  4. 情绪价值：触及用户的情感需求点
- 情绪点类型包括：
  1. 痛点：解决用户的困扰和不适
  2. 爽点：带来愉悦和满足感
  3. 痒点：激发用户的向往和期待
  4. 兴奋点：引发用户的热情和激动
  5. 安全点：给予用户安心和信任感
- 表达要求：
  1. 语言要简洁有力
  2. 突出情感共鸣
  3. 避免生硬的功能描述
  4. 强调用户价值体验

## Skill:

- 深度共情能力
- 场景化表达能力
- 情感诉求识别能力
- 用户心理洞察能力
- 价值转化能力

## Workflow:

1. 接收产品卖点清单
2. 分析用户情感需求
3. 识别关键场景
4. 转化情感表达
5. 提炼核心买点
6. 优化表达方式

## OutputFormat:

- [买点 1]
- [买点 2]
- [买点 3]

## Attention

每个买点 15 字以内，简洁清晰
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-25.png)

##### 9-B.2.通用-通用性买点修改后输出

![9-B.2.通用-通用性买点修改后输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-26.png)

输出内容如下：

```
通用性买点：
{{output}}
```

##### 9-B.3.通用-通用买点补充后赋值

![9-B.3.通用-通用买点补充后赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-27.png)

##### 10.独特-独特卖点-买点转换开始提示

这是个**输出**节点

![10.独特-独特卖点-买点转换开始提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-28.png)

输出内容如下：

```
接下来我将帮你把独特性卖点转化为独特性买点
```

##### 11.独特-独特买点需求提问

这是个**问答**节点

![11.独特-独特买点需求提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-29.png)

![11.独特-独特买点需求提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-30.png)

这一分支用于补充通用买点转换时的额外需求，整体架构如下。

![11.独特-独特买点需求提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-31.png)

##### 12-A/其他.独特-空

当前选项没有额外需求，不补充提示词，直接进行下一步**独特性卖点-买点转化**。

##### 12-B.独特-独特-痛点提示词

这是个**文本处理**节点。

![12-B.独特-独特-痛点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-32.png)

```
我希望激发下面的这个情绪价值点：
痛点：迫切性、亟待解决、恐惧等负面情绪
```

##### 12-C.独特-独特-爽点提示词

这是个**文本处理**节点。

![12-C.独特-独特-爽点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-33.png)

```
我希望激发下面的这个情绪价值点：
爽点：满足感、即时反馈、明显效果、成就感
```

##### 12-D.独特-独特-痒点提示词

这是个**文本处理**节点。

![12-D.独特-独特-痒点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-34.png)

```
我希望激发下面的这个情绪价值点：
痒点：从众心理、稀缺感、社交驱动、向往的
```

##### 12-E.独特-独特-兴奋点提示词

这是个**文本处理**节点。

![12-E.独特-独特-兴奋点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-35.png)

```
我希望激发下面的这个情绪价值点：
兴奋点：意外惊喜、独特体验、创新体验
```

##### 12-F.独特-独特-安全点提示词

这是个**文本处理**节点。

![12-F.独特-独特-安全点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-36.png)

```
我希望激发下面的这个情绪价值点：
安全点：带来安全感、带来信任感、感觉可靠
```

##### 12-G.1.独特-独特-其它情绪点问答

这是个**问答**节点。

![12-G.1.独特-独特-其它情绪点问答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-37.png)

提问内容如下：

```
具体是什么情绪价值点呢？

成就点、焦虑点、荣誉点、怀旧点、萌点、暖心点
```

##### 12-G.2.独特-独特-其它情绪点提示词

这是个**文本处理**节点。

![12-G.2.独特-独特-其它情绪点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-38.png)

```
我希望激发下面的这个情绪价值点：
{{String1}}
```

##### 13.独特-独特性卖点-买点转化

这是个**大模型**节点

![13.独特-独特性卖点-买点转化](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-39.png)

![13.独特-独特性卖点-买点转化](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-40.png)

系统提示词如下：

```markdown
# Role: 营销策略专家-卖点转化买点

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是将产品卖点转化为情感共鸣的买点。买点需要从用户视角出发，通过情感化表达、场景化描述，将产品价值延伸到情绪价值层面，触动用户的各类情感需求点。

## Constrains:

- 买点转化必须满足以下核心要素：
  1. 情感化表达：使用温度感、共情性的语言
  2. 用户视角：站在用户立场思考和表达
  3. 场景化描述：结合用户实际使用场景
  4. 情绪价值：触及用户的情感需求点
- 情绪点类型包括：
  1. 痛点：解决用户的困扰和不适
  2. 爽点：带来愉悦和满足感
  3. 痒点：激发用户的向往和期待
  4. 兴奋点：引发用户的热情和激动
  5. 安全点：给予用户安心和信任感
- 表达要求：
  1. 语言要简洁有力
  2. 突出情感共鸣
  3. 避免生硬的功能描述
  4. 强调用户价值体验

## Skill:

- 深度共情能力
- 场景化表达能力
- 情感诉求识别能力
- 用户心理洞察能力
- 价值转化能力

## Workflow:

1. 接收产品卖点清单
2. 分析用户情感需求
3. 识别关键场景
4. 转化情感表达
5. 提炼核心买点
6. 优化表达方式

## OutputFormat:

- [买点 1]
- [买点 2]
- [买点 3]

## Attention

每个买点 15 字以内，简洁清晰
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-41.png)

用户提示词如下：

```markdown
{{input}}

{{prompt1}}{{prompt2}}{{prompt3}}{{prompt4}}{{prompt5}}{{prompt6}}
```

##### 14.独特-独特性买点输出

这是个**输出**节点。

![14.独特-独特性买点输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-42.png)

输出内容如下：

```
独特性买点：
{{output}}
```

##### 15.独特-完善独特买点提示

这是个**输出**节点。

![15.独特-完善独特买点提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-43.png)

输出内容如下：

```
是否需要再生成一些独特性买点内容
```

##### 16.独特-独特买点修改选择

这是个**问答**节点。

![16.独特-独特买点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-44.png)

当前分支结构的作用是按照用户需求补充独特买点并为***用户变量：\*独特性买点**赋值，整体架构如下：

![16.独特-独特买点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-45.png)

##### 17-A/其他.独特-独特买点直接赋值

这是个**变量赋值**节点。

![17-A/其他.独特-独特买点直接赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-46.png)

用于为**用户变量：独特性买点**赋值。

##### 17-B.1.独特-AI 补充独特买点

这是个**大模型**节点。

![17-B.1.独特-AI 补充独特买点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-47.png)

![17-B.1.独特-AI 补充独特买点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-48.png)

系统提示词如下：

```markdown
# Role: 营销策略专家-卖点转化买点

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是将产品卖点转化为情感共鸣的买点。买点需要从用户视角出发，通过情感化表达、场景化描述，将产品价值延伸到情绪价值层面，触动用户的各类情感需求点。

## Constrains:

- 买点转化必须满足以下核心要素：
  1. 情感化表达：使用温度感、共情性的语言
  2. 用户视角：站在用户立场思考和表达
  3. 场景化描述：结合用户实际使用场景
  4. 情绪价值：触及用户的情感需求点
- 情绪点类型包括：
  1. 痛点：解决用户的困扰和不适
  2. 爽点：带来愉悦和满足感
  3. 痒点：激发用户的向往和期待
  4. 兴奋点：引发用户的热情和激动
  5. 安全点：给予用户安心和信任感
- 表达要求：
  1. 语言要简洁有力
  2. 突出情感共鸣
  3. 避免生硬的功能描述
  4. 强调用户价值体验

## Skill:

- 深度共情能力
- 场景化表达能力
- 情感诉求识别能力
- 用户心理洞察能力
- 价值转化能力

## Workflow:

1. 接收产品卖点清单
2. 分析用户情感需求
3. 识别关键场景
4. 转化情感表达
5. 提炼核心买点
6. 优化表达方式

## OutputFormat:

- [买点 1]
- [买点 2]
- [买点 3]

## Attention

每个买点 15 字以内，简洁清晰
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-49.png)

##### 17-B.2.独特-独特性买点修改后输出

![17-B.2.独特-独特性买点修改后输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-50.png)

输出内容如下：

```
独特性买点：
{{output}}
```

##### 17-B.3.独特-独特买点补充后赋值

![17-B.3.独特-独特买点补充后赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-51.png)

##### 18.保障-保障卖点-买点转换开始提示

这是个**输出**节点

![18.保障-保障卖点-买点转换开始提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-52.png)

输出内容如下：

```
接下来我将帮你把保障性卖点转化为保障性买点
```

##### 19.保障-保障买点需求提问

这是个**问答**节点

![19.保障-保障买点需求提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-53.png)

![19.保障-保障买点需求提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-54.png)

这一分支用于补充通用买点转换时的额外需求，整体架构如下。

![19.保障-保障买点需求提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-55.png)

##### 20-A/其他.保障-空

当前选项没有额外需求，不补充提示词，直接进行下一步**保障性卖点-买点转化**。

##### 20-B.保障-保障-痛点提示词

这是个**文本处理**节点。

![20-B.保障-保障-痛点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-56.png)

```
我希望激发下面的这个情绪价值点：
痛点：迫切性、亟待解决、恐惧等负面情绪
```

##### 20-C.保障-保障-爽点提示词

这是个**文本处理**节点。

![20-C.保障-保障-爽点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-57.png)

```
我希望激发下面的这个情绪价值点：
爽点：满足感、即时反馈、明显效果、成就感
```

##### 20-D.保障-保障-痒点提示词

这是个**文本处理**节点。

![20-D.保障-保障-痒点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-58.png)

```
我希望激发下面的这个情绪价值点：
痒点：从众心理、稀缺感、社交驱动、向往的
```

##### 20-E.保障-保障-兴奋点提示词

这是个**文本处理**节点。

![20-E.保障-保障-兴奋点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-59.png)

```
我希望激发下面的这个情绪价值点：
兴奋点：意外惊喜、独特体验、创新体验
```

##### 20-F.保障-保障-安全点提示词

这是个**文本处理**节点。

![20-F.保障-保障-安全点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-60.png)

```
我希望激发下面的这个情绪价值点：
安全点：带来安全感、带来信任感、感觉可靠
```

##### 20-G.1.保障-保障-其它情绪点问答

这是个**问答**节点。

![20-G.1.保障-保障-其它情绪点问答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-61.png)

提问内容如下：

```
具体是什么情绪价值点呢？

成就点、焦虑点、荣誉点、怀旧点、萌点、暖心点
```

##### 20-G.2.保障-保障-其它情绪点提示词

这是个**文本处理**节点。

![20-G.2.保障-保障-其它情绪点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-62.png)

```
我希望激发下面的这个情绪价值点：
{{String1}}
```

##### 21.保障-保障性卖点-买点转化

这是个**大模型**节点

![21.保障-保障性卖点-买点转化](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-63.png)

![21.保障-保障性卖点-买点转化](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-64.png)

系统提示词如下：

```markdown
# Role: 营销策略专家-卖点转化买点

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是将产品卖点转化为情感共鸣的买点。买点需要从用户视角出发，通过情感化表达、场景化描述，将产品价值延伸到情绪价值层面，触动用户的各类情感需求点。

## Constrains:

- 买点转化必须满足以下核心要素：
  1. 情感化表达：使用温度感、共情性的语言
  2. 用户视角：站在用户立场思考和表达
  3. 场景化描述：结合用户实际使用场景
  4. 情绪价值：触及用户的情感需求点
- 情绪点类型包括：
  1. 痛点：解决用户的困扰和不适
  2. 爽点：带来愉悦和满足感
  3. 痒点：激发用户的向往和期待
  4. 兴奋点：引发用户的热情和激动
  5. 安全点：给予用户安心和信任感
- 表达要求：
  1. 语言要简洁有力
  2. 突出情感共鸣
  3. 避免生硬的功能描述
  4. 强调用户价值体验

## Skill:

- 深度共情能力
- 场景化表达能力
- 情感诉求识别能力
- 用户心理洞察能力
- 价值转化能力

## Workflow:

1. 接收产品卖点清单
2. 分析用户情感需求
3. 识别关键场景
4. 转化情感表达
5. 提炼核心买点
6. 优化表达方式

## OutputFormat:

- [买点 1]
- [买点 2]
- [买点 3]

## Attention

每个买点 15 字以内，简洁清晰
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-65.png)

用户提示词如下：

```markdown
{{input}}

{{prompt1}}{{prompt2}}{{prompt3}}{{prompt4}}{{prompt5}}{{prompt6}}
```

##### 22.保障-保障性买点输出

这是个**输出**节点。

![22.保障-保障性买点输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-66.png)

输出内容如下：

```
保障性买点：
{{output}}
```

##### 23.保障-完善保障买点提示

这是个**输出**节点。

![23.保障-完善保障买点提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-67.png)

输出内容如下：

```
是否需要再生成一些保障性买点内容
```

##### 24.保障-保障买点修改选择

这是个**问答**节点。

![24.保障-保障买点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-68.png)

当前分支结构的作用是按照用户需求补充保障买点并为**用户变量：保障性买点**赋值，整体架构如下：

![24.保障-保障买点修改选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-69.png)

##### 25-A/其他.保障-保障买点直接赋值

这是个**变量赋值**节点。

![25-A/其他.保障-保障买点直接赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-70.png)

用于为***用户变量：\*保障性买点**赋值。

##### 25-B.1.保障-AI 补充保障买点

这是个**大模型**节点。

![25-B.1.保障-AI 补充保障买点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-71.png)

![25-B.1.保障-AI 补充保障买点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-72.png)

系统提示词如下：

```markdown
# Role: 营销策略专家-卖点转化买点

# Goals:

## Background:

作为一名专业的营销策略专家，主要职责是将产品卖点转化为情感共鸣的买点。买点需要从用户视角出发，通过情感化表达、场景化描述，将产品价值延伸到情绪价值层面，触动用户的各类情感需求点。

## Constrains:

- 买点转化必须满足以下核心要素：
  1. 情感化表达：使用温度感、共情性的语言
  2. 用户视角：站在用户立场思考和表达
  3. 场景化描述：结合用户实际使用场景
  4. 情绪价值：触及用户的情感需求点
- 情绪点类型包括：
  1. 痛点：解决用户的困扰和不适
  2. 爽点：带来愉悦和满足感
  3. 痒点：激发用户的向往和期待
  4. 兴奋点：引发用户的热情和激动
  5. 安全点：给予用户安心和信任感
- 表达要求：
  1. 语言要简洁有力
  2. 突出情感共鸣
  3. 避免生硬的功能描述
  4. 强调用户价值体验

## Skill:

- 深度共情能力
- 场景化表达能力
- 情感诉求识别能力
- 用户心理洞察能力
- 价值转化能力

## Workflow:

1. 接收产品卖点清单
2. 分析用户情感需求
3. 识别关键场景
4. 转化情感表达
5. 提炼核心买点
6. 优化表达方式

## OutputFormat:

- [买点 1]
- [买点 2]
- [买点 3]

## Attention

每个买点 15 字以内，简洁清晰
```

![Attention](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-73.png)

##### 25-B.2.保障-保障性买点修改后输出

![25-B.2.保障-保障性买点修改后输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-74.png)

输出内容如下：

```
保障性买点：
{{output}}
```

##### 25-B.3.保障-保障买点补充后赋值

![25-B.3.保障-保障买点补充后赋值](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-75.png)

##### 26.保障-买点汇总

这是个文本处理节点，用于整理买点，便于向用户展示。

![26.保障-买点汇总](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-76.png)

```markdown
## 通用性买点

{{String1}}

## 独特性买点

{{String2}}

## 保障性买点

{{String3}}
```

##### 27.保障-买点汇总

![27.保障-买点汇总](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-77.png)

```
营销买点转换完成~
新的买点如下：

{{output}}
```

#### 3.3.3 测试

##### 1.输入

![1.输入](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-78.png)

`BOT_USER_INPUT`留空即可。

##### 2.选择第一项并继续

![2.选择第一项并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-79.png)

##### 3.满意并继续

![3.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-80.png)

##### 4.选择第一项并继续

![4.选择第一项并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-81.png)

##### 5.满意并继续

![5.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-82.png)

##### 6.选择第一项并继续

![6.选择第一项并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-83.png)

##### 7.满意并继续

![7.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-84.png)

##### 8.结束

![8.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-85.png)

![8.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-86.png)

输出变量如下：

```markdown
{
"output": "## 通用性买点\n- [深夜加班不再饿肚子]（痛点+安全点）\n- [一口回到餐厅幸福感]（爽点+兴奋点）\n- [5 分钟治愈你的胃]（爽点+痒点）\n- [营养和美味同时到胃]（安全点+爽点）\n- [浓香汤底瞬间唤醒味蕾]（兴奋点+爽点）\n\n## 独特性买点\n- [深夜暖心治愈，一碗慢炖的温柔]\n- [大口吃肉才过瘾，真材实料看得见]\n- [5 分钟变身大厨，在家享受餐厅级美味]\n- [独家秘方传承，品质始终如一]\n- [加班不再孤单，热汤暖胃又暖心]\n\n## 保障性买点\n- [一口鲜嫩，满嘴幸福]（爽点：精选牛肉带来的口感满足）\n- [妈妈的味道，暖胃更暖心]（痒点：秘制汤底唤起家的记忆）\n- [热乎到家，就像刚出锅]（兴奋点：极速送达保持最佳风味）\n- [吃得放心，退得随心]（安全点：无忧售后保障消费权益）\n- [从牧场到餐桌，全程守护]（安全点：严格质检带来安心体验）\n"
}
```

回答内容如下：

```markdown
营销买点转换完成~
新的买点如下

## 通用性买点

- [深夜加班不再饿肚子]（痛点+安全点）
- [一口回到餐厅幸福感]（爽点+兴奋点）
- [5 分钟治愈你的胃]（爽点+痒点）
- [营养和美味同时到胃]（安全点+爽点）
- [浓香汤底瞬间唤醒味蕾]（兴奋点+爽点）

## 独特性买点

- [深夜暖心治愈，一碗慢炖的温柔]
- [大口吃肉才过瘾，真材实料看得见]
- [5 分钟变身大厨，在家享受餐厅级美味]
- [独家秘方传承，品质始终如一]
- [加班不再孤单，热汤暖胃又暖心]

## 保障性买点

- [一口鲜嫩，满嘴幸福]（爽点：精选牛肉带来的口感满足）
- [妈妈的味道，暖胃更暖心]（痒点：秘制汤底唤起家的记忆）
- [热乎到家，就像刚出锅]（兴奋点：极速送达保持最佳风味）
- [吃得放心，退得随心]（安全点：无忧售后保障消费权益）
- [从牧场到餐桌，全程守护]（安全点：严格质检带来安心体验）
```

#### 3.3.4 发布工作流

![3.3.4 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-87.png)

![3.3.4 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-88.png)

![3.3.4 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-89.png)

#### 3.3.5 和 Agent 交互

##### 1.确认已添加工作流

![1.确认已添加工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-90.png)

##### 2.编辑“人设与回复逻辑”

![2.编辑“人设与回复逻辑”](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-91.png)

```
用户只要求设置或更新产品信息时，调用{#LibraryBlock id="7574368297250308137" uuid="q9AFbj1EIUhPEulpEmmxv" type="workflow"#}set_product_name_and_desc{#/LibraryBlock#}
用户只要求生成卖点时，调用{#LibraryBlock id="7570982817757331508" uuid="UPgTh3SXS-DJX-dXAIlaN" type="workflow"#}selling_point_generation{#/LibraryBlock#}，当对话记录中没有产品信息时，从数据库读取最新的数据作为产品信息
用户只要求进行卖点到买点的转换时，调用{#LibraryBlock id="7573974383871295515" uuid="PHsCeuIfqmnD7FirsjefS" type="workflow"#}selling2buying_point{#/LibraryBlock#}

当用户打招呼、输入其他内容或询问与营销无关的问题，和用户闲聊

当工作流输出不为空时，将输出格式化后打印在对话框
```

##### 3.调用工作流

![3.调用工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-92.png)

![3.调用工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-93.png)

##### 4.选择第一项并继续

![4.选择第一项并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-94.png)

![4.选择第一项并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-95.png)

##### 5.满意并继续

![5.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-96.png)

![5.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-97.png)

##### 6.选择第一项并继续

![6.选择第一项并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-98.png)

![6.选择第一项并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-99.png)

##### 7.满意并继续

![7.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-100.png)

![7.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-101.png)

##### 8.选择第一项并继续

![8.选择第一项并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-102.png)

![8.选择第一项并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-103.png)

##### 9.满意并继续

![9.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-104.png)

![9.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-105.png)

![9.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-106.png)

最终输出如下：

```markdown
营销买点转换完成~
新的买点如下

## 通用性买点

- [发烧即刻知，守护不慌张]（痛点+安全点）
- [体温变化全掌握，家人健康看得见]（爽点+安全点）
- [口袋里的健康管家，发烧第一时间提醒]（兴奋点+安全点）
- [测温不用等，一秒知冷暖]（爽点）
- [自动记录每一天，健康管理更省心]（爽点+安全点）

## 独特性买点

- [宝宝安睡，妈妈安心]（安全点+痛点：解决夜间频繁测温的困扰，给予全天候守护的安心感）
- [误差小于 0.1℃，像医生一样可靠]（安全点+兴奋点：专业级精准激发信任感，满足家长对医疗级呵护的期待）
- [温度异常即刻提醒，危险早发现]（痛点+安全点：化解突发高烧的焦虑，提供及时干预的保障）

## 保障性买点

- [宝宝发烧不慌张，测温精准更安心]（安全点+痛点）
- [国家认证品质，365 天无忧换新]（安全点+爽点）
- [专业校准永相伴，体温数据更可靠]（安全点+兴奋点）
- [蓝牙自动记录，再也不怕数据丢失]（爽点+痛点）
- [30 天放心体验，不满意随时退]（安全点+爽点）
```

#### 3.3.6 Agent 调试

##### 1.查看调用参数

![1.查看调用参数](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-107.png)

##### 2.调试工作流

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-108.png)

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-109.png)

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-110.png)

##### 3.工作流详情

![3.工作流详情](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-3-111.png)

### 3.4 red_book_and_video_script

整体架构如下：

![red_book_and_video_script](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-1.png)

#### 3.4.1 创建

![3.4.1 创建](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-2.png)

#### 3.4.2 创建知识库

##### 1.尚硅谷-抖音热点

![1.尚硅谷-抖音热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-3.png)

![1.尚硅谷-抖音热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-4.png)

![1.尚硅谷-抖音热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-5.png)

找到数据目录

![1.尚硅谷-抖音热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-6.png)

![1.尚硅谷-抖音热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-7.png)

![1.尚硅谷-抖音热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-8.png)

![1.尚硅谷-抖音热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-9.png)

![1.尚硅谷-抖音热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-10.png)

![1.尚硅谷-抖音热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-11.png)

导入完成

![1.尚硅谷-抖音热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-12.png)

##### 2.尚硅谷-微博热点

![2.尚硅谷-微博热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-13.png)

![2.尚硅谷-微博热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-14.png)

![2.尚硅谷-微博热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-15.png)

![2.尚硅谷-微博热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-16.png)

![2.尚硅谷-微博热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-17.png)

![2.尚硅谷-微博热点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-18.png)

##### 3.尚硅谷-短视频脚本技巧_开头

![3.尚硅谷-短视频脚本技巧\开头](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-19.png)

![3.尚硅谷-短视频脚本技巧\开头](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-20.png)

![3.尚硅谷-短视频脚本技巧\开头](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-21.png)

![3.尚硅谷-短视频脚本技巧\开头](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-22.png)

![3.尚硅谷-短视频脚本技巧\开头](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-23.png)

![3.尚硅谷-短视频脚本技巧\开头](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-24.png)

##### 4.尚硅谷-短视频脚本技巧_结尾

![4.尚硅谷-短视频脚本技巧\结尾](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-25.png)

![4.尚硅谷-短视频脚本技巧\结尾](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-26.png)

![4.尚硅谷-短视频脚本技巧\结尾](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-27.png)

![4.尚硅谷-短视频脚本技巧\结尾](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-28.png)

![4.尚硅谷-短视频脚本技巧\结尾](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-29.png)

![4.尚硅谷-短视频脚本技巧\结尾](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-30.png)

##### 5.尚硅谷-高质量营销文案技巧

![5.尚硅谷-高质量营销文案技巧](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-31.png)

![5.尚硅谷-高质量营销文案技巧](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-32.png)

![5.尚硅谷-高质量营销文案技巧](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-33.png)

![5.尚硅谷-高质量营销文案技巧](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-34.png)

![5.尚硅谷-高质量营销文案技巧](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-35.png)

![5.尚硅谷-高质量营销文案技巧](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-36.png)

#### 3.4.3 配置

##### 1.开始

![1.开始](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-37.png)

当前工作流的输入来源于用户变量，不需要参数传递，**`BOT_USER_INPUT`**无用。

##### 2.生成小红书文案和短视频脚本

![2.生成小红书文案和短视频脚本](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-38.png)

每轮循环根据用户需求完成小红书文案和短视频脚本的生成，输出需要在内部节点配置完成后才可配置。

##### 2.1.循环-是否生成提示

这是个**输出**节点。

![2.1.循环-是否生成提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-39.png)

输出内容如下：

```
是否需要继续使用买点生成小红书文案或短视频脚本呢
```

##### 2.2.循环-是否生成选择

这是个**问答**节点。

![2.2.循环-是否生成选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-40.png)

该节点用于询问用户是否终止循环。

##### 2.3-B/其他.循环-不再生成终止循环

![2.3-B/其他.循环-不再生成终止循环](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-41.png)

##### 2.3-A.循环-热点搜集

这是个**知识库检索**节点

![2.3-A.循环-热点搜集](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-42.png)

![2.3-A.循环-热点搜集](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-43.png)

添加抖音热点和微博热点

![2.3-A.循环-热点搜集](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-44.png)

![2.3-A.循环-热点搜集](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-45.png)

##### 2.4.循环-是否搜索到相关热点判断

这是个**选择器**节点

![2.4.循环-是否搜索到相关热点判断](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-46.png)

![2.4.循环-是否搜索到相关热点判断](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-47.png)

当前分支结构用于根据检索结构生成热点提示词，整体架构如下。

![2.4.循环-是否搜索到相关热点判断](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-48.png)

分支逻辑大致为：

① 未检索到结果，则热点提示词为空。

② 检索到结果，则根据用户意愿选择是否使用热点。

##### 2.5-False.循环-热点提示词-空

![2.5-False.循环-热点提示词-空](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-49.png)

##### 2.5-True.1.循环-是否使用热点提示

![2.5-True.1.循环-是否使用热点提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-50.png)

输出内容如下：

```
为你匹配到如下热点
{{output}}

是否使用这些热点
```

##### 2.5-True.2.循环-是否使用热点提问

![2.5-True.2.循环-是否使用热点提问](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-51.png)

##### 2.5-True.2-A.循环-热点提示词

![2.5-True.2-A.循环-热点提示词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-52.png)

字符串拼接内容如下：

```
结合以下热点：{{String1}}
```

##### 2.5-True.2-B/其他.循环-热点提示词-空

![2.5-True.2-B/其他.循环-热点提示词-空](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-53.png)

##### 2.6.循环-热点提示词整理

![2.6.循环-热点提示词整理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-54.png)

字符串拼接内容如下：

```
{{String1}}{{String2}}
```

##### 2.7.循环-生成内容提示

![2.7.循环-生成内容提示](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-55.png)

输出内容如下：

```
请选择生成内容
(默认选择小红书文案)
```

##### 2.8.循环-生成内容选择

![2.8.循环-生成内容选择](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-56.png)

该节点用于选择生成内容。

##### 2.8-A/其他.1.循环-小红书文案随机关键词

当前分支负责生成小红书文案。

![2.8-A/其他.1.循环-小红书文案随机关键词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-57.png)

代码内容如下：

```python
import time
import random

async def main(args: Args) -> Output:
    keywords = [
        "形容外观",
        "突出价格",
        "展示工艺",
        "展示材料/成分",
        "形容功能",
        "凸显场景",
        "描述地理/源头",
        "突出人群",
        "使用方法",
        "背书证明",
        "打造情怀",
        "营造稀缺"
    ]

    # 使用当前时间戳与随机数结合来增加随机性
    base_random = random.random()
    time_seed = int(time.time() * 1000)  # 毫秒级时间戳
    enhanced_random = (base_random + time_seed) % 1

    random_index = int(enhanced_random * len(keywords))
    keyword = keywords[random_index]

    ret: Output = {
        "keyword": keyword
    }

    return ret

```

##### 2.8-A/其他.2.循环-营销文案技巧检索

![2.8-A/其他.2.循环-营销文案技巧检索](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-58.png)

##### 2.8-A/其他.3.循环-AI 生成小红书文案

![2.8-A/其他.3.循环-AI 生成小红书文案](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-59.png)

![2.8-A/其他.3.循环-AI 生成小红书文案](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-60.png)

系统提示词如下：

```markdown
# Role

小红书文案大师

## Attention

- 你有丰富的小红书文案经验，知道一段文案最重要的信息是什么
- 你熟知写小红书文案的技巧，能够尝试运用不同的方法写文案，但保持内容简洁

## Background

根据用户已有的产品买点，生成高质量的小红书营销文案

## Constraints

- 遵循[标题][正文][标签]格式，[标题]少于 20 字，[正文]500 字以上，1000 字以内，[标签]至少 8 个
- 突出产品的关键词
- 语言年轻化、口语化，风格活泼、俏皮、搞怪，使用女生的口吻
- 多多使用符号表情
- 多分段，避免使用长句
- 与读者互动，鼓励读者收藏、私信、留言
- 使用这些热词：大数据,秘方,压箱底,建议收藏,挑战全网,普通女生,吹爆,打工人,高级感,治愈,被夸爆,正确姿势,疯狂点赞,超有料,小确幸,欲罢不能,指南,拯救,满分,独家
- 避免使用中文句号
- 避免“最”“第一”“极限”“世界级”等表示极限的词
- 避免不适当或冒犯内容

##Examples

- Example1:
  """
  关注 🔦 光盐团建 👥 团建策划 📝 团建实施 🛠️ 团建资讯 📰🚫 不迷路 🔀
  """
- Example2:
  """
  🕘09:00 🎉 集合咯！🏞️ 北京金海湖 🚶‍♂️Let's go🚗！
  🕙10:00 DIY 植物拓印 🌺
  🕚11:00 自制 🍹 饮料 🍸
  🕛12:00 谁是 BBQ👩‍🍳 大师 👀
  🕑14:00 放风筝 🪁 或其他 🏐 集体项目 🥏
  🕒15:00 户外时间！🛶 皮划艇 🏎️ 卡丁车 🐎 骑马 🏹 射箭 🌲
  🕔17:00 🎁 在手 📸 合影纪念美好一天！
  🌇 活动结束 🚌 乘车回家
  """
- Example3:
  """
  🔸 春日徜徉在北京平谷金海湖 🌊 棒！🤩
  🔸 皮划艇 🚣‍♀️ 穿越湖光山色 ⛰️ 刺激的山地滑车 🛷 爽！💥
  🔸 别样的趣味 🎈 运动会 🏅 乐！😂
  🔸 金海湖春游 🌷 等你来探索 🔍 快！🎉
  """

## Output

按下面的格式输出
**标题**
[标题内容]
**正文**
[正文内容]（500 字左右）
**标签**
[标签内容]
```

![Output](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-61.png)

用户提示词如下：

```markdown
产品名称：{{name}}
{{m1}}
{{m2}}
{{m3}}

使用下面的技巧：
{{output}}

{{output1}}
```

##### 2.8-A/其他.4.循环-小红书文案输出

![2.8-A/其他.4.循环-小红书文案输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-62.png)

输出内容如下：

```
{{output}}
```

##### 2.8-B.1.循环-短视频开头脚本随机关键词

![2.8-B.1.循环-短视频开头脚本随机关键词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-63.png)

```python
import time
import random

async def main(args: Args) -> Output:
    keywords = [
        "身份推荐",
        "点名人群",
        "直陈痛点",
        "直陈效果",
        "提出疑问",
        "引发好奇",
        "正话反说",
        "塑造情绪",
        "价格利益"
    ]

    # 使用当前时间戳与随机数结合来增加随机性
    base_random = random.random()
    time_seed = int(time.time() * 1000)  # 毫秒级时间戳
    enhanced_random = (base_random + time_seed) % 1

    random_index = int(enhanced_random * len(keywords))
    keyword = keywords[random_index]

    ret: Output = {
        "keyword": keyword
    }

    return ret

```

##### 2.8-B.2.循环-短视频开头技巧检索

![2.8-B.2.循环-短视频开头技巧检索](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-64.png)

##### 2.8-B.3.循环-短视频结尾脚本随机关键词

![2.8-B.3.循环-短视频结尾脚本随机关键词](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-65.png)

```python
# 在这里，您可以通过 'args'  获取节点中的输入变量，并通过 'ret' 输出结果
# 'args' 已经被正确地注入到环境中
# 下面是一个示例，首先获取节点的全部输入参数params，其次获取其中参数名为'input'的值：
# params = args.params;
# input = params['input'];
# 下面是一个示例，输出一个包含多种数据类型的 'ret' 对象：
# ret: Output =  { "name": '小明', "hobbies": ["看书", "旅游"] };

import random
import time
import asyncio

async def main(args: Args) -> Output:
    keywords = [
        "饥饿营销",
        "从众引导",
        "点名人群",
        "放出优惠",
        "身份承诺"
    ]

    # 基础随机数
    base_random = random.random()
    # 当前时间戳（毫秒）
    time_seed = int(time.time() * 1000)
    enhanced_random = (base_random + (time_seed % 1)) % 1

    random_index = int(enhanced_random * len(keywords))
    keyword = keywords[random_index]

    # 构建输出对象
    ret: Output = {
        "keyword": keyword
    }

    return ret

```

##### 2.8-B.4.循环-短视频结尾技巧检索

![2.8-B.4.循环-短视频结尾技巧检索](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-66.png)

##### 2.8-B.5.循环-AI 生成短视频脚本

![2.8-B.5.循环-AI 生成短视频脚本](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-67.png)

![2.8-B.5.循环-AI 生成短视频脚本](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-68.png)

系统提示词如下：

```markdown
# Role:视频脚本大师 - 创意无限

我是你的视频魔法师，帮你在抖音和 YouTube 上大放异彩！

## Goals

- 量身定制创意脚本，助力内容病毒式传播。

## Skill-1: AIDA 框架

1. **注意**：开场 5 秒，抛出有趣问题或数据。
2. **兴趣**：内容贴合观众生活，用小故事吸引。
3. **渴望**：展示独家技巧，引用权威提升可信度。
4. **行动**：鼓励评论互动，呼吁订阅分享。

## Skill-2: 内容结构

1. **分段内容**：每段围绕一个主题，清晰直观。
2. **递进式结构**：逐步引导观众，解答疑惑。
3. **故事化叙述**：加入冲突和案例增强戏剧性。
4. **悬念和奖励**：埋下悬念，给予知识满足。
5. **视觉化语言**：清晰描述，少用专业术语。
6. **互动引导**：适时号召点赞、评论或订阅。

## Skill-3: 视觉与音效提示

1. **视觉提示**：建议展示图表或流程图。
2. **音效提示**：添加音效提升感染力。
3. **文字效果**：用效果突出关键词。
4. **视觉分段**：使用过渡效果让视频更流畅。

## Constraints

1. **一分钟 200 字**：控制字数，保证内容充实。
2. **逐段计算字数**：确保每段不超标。
3. **自动扩展内容**：逻辑连贯地增加细节。
4. **短视频不需精确字数**：保持节奏快、吸引力强。
5. **避免冗长术语**：大白话解释专业词汇。

## OutputFormat

标题：
主题：
时长：（总时长 30s 左右）
风格和语调：
目标受众：
分镜：

- 分镜 1
  - 时长：
  - 画面和字幕：
  - 音乐和音效：
  - 台词或旁白：
- 分镜 2
  - 时长：
  - 画面和字幕：
  - 音乐和音效：
  - 台词或旁白：
    ……
```

![OutputFormat](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-69.png)

用户提示词如下：

```markdown
产品名称：{{name}}
{{m1}}
{{m2}}
{{m3}}

使用下面的技巧：
{{output}}
{{output1}}

{{output2}}
```

##### 2.8-B.6.循环-短视频脚本输出

![2.8-B.6.循环-短视频脚本输出](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-70.png)

输出内容如下：

```
{{output}}
```

##### 2.循环变量配置

循环内部节点配置完成后，即可配置循环节点的输出变量

![2.循环变量配置](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-71.png)

##### 3.结束

![3.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-72.png)

![3.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-73.png)

#### 3.4.4 测试

##### 1.输入

![1.输入](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-74.png)

**`BOT_USER_INPUT`**无用，留空即可。

##### 2.生成并继续

![2.生成并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-75.png)

##### 3.选择“小红书文案”并继续

![3.选择“小红书文案”并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-76.png)

##### 4.再次生成并继续

![4.再次生成并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-77.png)

##### 5.选择“短视频脚本”并继续

![5.选择“短视频脚本”并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-78.png)

##### 6.结束

![6.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-79.png)

![6.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-80.png)

![6.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-81.png)

输出如下：

```json
{
  "red_book_output": [
    "**标题**\n深夜食堂｜5分钟get餐厅级红烧牛肉面🍜\n\n**正文**\n姐妹们！打工人深夜加班的救星来啦✨ 这碗红烧牛肉面真的被夸爆了💥 大数据推给我的时候还半信半疑 结果第一口就欲罢不能🤤\n\n浓香汤底是用独家秘方慢炖8小时 喝一口瞬间唤醒味蕾👅 精选的牛肉块超大超实在 咬下去鲜嫩多汁 完全不像速食面该有的品质🥩 面条Q弹有嚼劲 吸饱了汤汁超级有料🍜\n\n最绝的是5分钟就能搞定！加班回家累成狗🐶 烧水的时间就能闻到香味 热乎乎的汤喝下去整个人都被治愈了💕 连我妈都说这味道跟她炖的一样（偷偷说比她的还好吃🤫）\n\n包装也超有高级感 不是普通泡面那种塑料感 而是像餐厅外卖一样的精致盒子 拍照发朋友圈被疯狂点赞👍 建议收藏这个压箱底的好物 我已经囤了10盒在办公室💼\n\n普通女生也能秒变大厨👩‍🍳 深夜来一碗 暖胃又暖心 这才是打工人该有的小确幸呀💖 你们一定要试试看 不好吃来找我！\n\nPS：汤底可以选择辣度哦 从微辣到重辣都有 满足各种口味需求🌶️ 吃完记得来评论区告诉我你最喜欢哪种呀～\n\n**标签**\n#红烧牛肉面 #深夜食堂 #速食推荐 #打工人必备 #美食分享 #治愈系美食 #办公室囤货 #懒人食谱 #美食测评 #吃货日常"
  ],
  "script_output": [
    "标题：《深夜食堂｜5分钟复刻米其林红烧牛肉面》\n主题：便捷美食带来的幸福感\n时长：30秒\n风格和语调：温暖治愈系+轻快节奏\n目标受众：20-35岁都市加班族/独居青年\n\n分镜：\n- 分镜1（黄金5秒）\n  + 时长：5s\n  + 画面和字幕：办公室时钟指向23:00 + \"加班到深夜的你还在吃泡面？\"\n  + 音乐和音效：键盘敲击声+叹气声\n  + 台词或旁白：（画外音）\"米其林主厨老张说...\"\n\n- 分镜2\n  + 时长：8s\n  + 画面和字幕：慢镜头展示面条吸饱汤汁 + \"5分钟复刻餐厅级美味\"\n  + 音乐和音效：汤汁沸腾声+筷子搅拌声\n  + 台词或旁白：\"选用澳洲牧场直供牛肉，3小时慢炖浓汤\"\n\n- 分镜3\n  + 时长：7s\n  + 画面和字幕：筷子夹起大块牛肉特写 + \"真材实料看得见\"\n  + 音乐和音效：咀嚼音效+满足的叹息\n  + 台词或旁白：\"作为十年餐饮人，这款必须安利给熬夜的你\"\n\n- 分镜4（高潮）\n  + 时长：6s\n  + 画面和字幕：热气蒸腾的碗面特写 + \"妈妈秘方熬制\"\n  + 音乐和音效：温馨钢琴旋律\n  + 台词或旁白：\"三年来我们坚持72项质检标准\"\n\n- 分镜5（转化）\n  + 时长：4s\n  + 画面和字幕：产品包装展示+二维码 + \"点击下方立即暖胃\"\n  + 音乐和音效：收银机\"叮\"声\n  + 台词或旁白：\"厂家直发，不好吃随时找我退！\"\n\n[身份推荐技巧运用]\n1. 米其林主厨专业背书\n2. 十年餐饮人身份担保\n3. 质检人员严格把关形象\n\n[身份承诺技巧运用]\n1. 结尾厂家直发承诺\n2. 质量无忧售后保障\n3. 个人化推荐话术"
  ]
}
```

#### 3.4.5 发布工作流

![3.4.5 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-82.png)

![3.4.5 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-83.png)

![3.4.5 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-84.png)

#### 3.4.6 和 Agent 交互

##### 1.确认已添加工作流

![1.确认已添加工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-85.png)

##### 2.编辑“人设与回复逻辑

![2.编辑“人设与回复逻辑](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-86.png)

##### 3.调用工作流

![3.调用工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-87.png)

##### 4.生成并继续

![4.生成并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-88.png)

![4.生成并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-89.png)

##### 5.选择“小红书文案”并继续

![5.选择“小红书文案”并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-90.png)

![5.选择“小红书文案”并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-91.png)

输出内容如下：

```
标题
[宝宝发烧不慌张！这个测温神器被我吹爆了！]

正文
姐妹们！大数据真的没骗我！这次挖到的测温神器简直拯救了本老母亲的深夜焦虑😭

以前每次宝宝半夜发烧🌡️
我都得手忙脚乱找体温计➕强光照射➕疯狂祈祷别吵醒娃
现在！这个会发光会报警的测温仪直接让我躺赢！

✨【3 大救命功能我必须吹】✨
1️⃣ 0.1℃医疗级精度👉🏻误差比水银体温计还小！
（上次去医院对比过数据🧑‍⚕️医生都夸专业）
2️⃣ 24 小时蓝牙监测👉🏻手机弹窗提醒比闹钟还快⏰
（再也不用定 3 个闹钟半夜爬起来测体温了！）
3️⃣ 国家认证 + 365 天换新👉🏻本抠门妈妈算过账超划算💰

💡真实使用场景安利：
上周娃突然高烧到 39℃
我正敷着面膜呢手机就疯狂震动📱
从发现到喂退烧药全程不到 5 分钟！
（要是等娃哭醒再处理真的会急哭😢）

偷偷说个压箱底用法👂🏻
把它贴在水杯上还能测奶温！
（再也不用手腕试温被烫到跳脚啦）

现在全家都抢着用🤣
老公感冒时偷偷监测他有没有偷偷吃冰淇淋🍦
（结果真的抓到现行哈哈哈）

⚠️重要提示：
买回来记得做 3 次校准测试！
（具体方法我放图 3 了👉🏻建议收藏）

最后暴风感谢这个神器
让我从「一摸额头就心慌」的新手妈妈
变成「随时掌控体温」的淡定王者👑

👉🏻评论区揪 3 个姐妹送同款测温贴！
（点赞 + 留言 "求拯救" 参与）

标签
#育儿神器 #宝妈必备 #黑科技育儿 #好物分享 #母婴好物 #发烧护理 #智能测温 #带娃必备
```

##### 6.生成并继续

![6.生成并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-92.png)

![6.生成并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-93.png)

##### 7.选择“短视频脚本”并继续

![7.选择“短视频脚本”并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-94.png)

![7.选择“短视频脚本”并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-95.png)

输出内容如下：

```
标题：红烧牛肉面，一碗面里的幸福密码

主题：揭秘红烧牛肉面的独特魅力，让你在家也能享受餐厅级美味

时长：30 秒

风格和语调：轻松活泼，带点幽默感，贴近年轻人的日常

目标受众：18-35 岁，喜欢美食、追求便捷生活的年轻人
分镜 1

时长：5 秒
画面和字幕：

画面：一碗热气腾腾的红烧牛肉面特写，汤汁浓郁，牛肉大块，面条筋道
字幕：“你还在用泡面解决晚餐吗？”（大字突出）
音乐和音效：
背景音乐：轻快的 BGM
音效：面条 “吸溜” 声，增强食欲感
台词或旁白：
（旁白，带点调侃）“泡面吃腻了？试试这碗红烧牛肉面！”
分镜 2

时长：8 秒
画面和字幕：

画面：快速剪辑展示红烧牛肉面的制作过程 —— 大块牛肉炖煮、面条下锅、浇上浓郁汤汁
字幕：“大块牛肉，慢火炖煮 8 小时”
音乐和音效：
背景音乐：节奏感强的 BGM
音效：炖煮的 “咕嘟” 声，增强真实感
台词或旁白：
（旁白，兴奋）“每一口都是满满的肉香，汤汁浓郁到上头！”
分镜 3

时长：7 秒
画面和字幕：

画面：对比普通泡面和红烧牛肉面，普通泡面显得单调，红烧牛肉面丰富诱人
字幕：“泡面 vs 红烧牛肉面，你选哪个？”
音乐和音效：
背景音乐：悬念感的 BGM
音效：对比切换的 “唰” 声
台词或旁白：
（旁白，带点挑衅）“泡面只能填饱肚子，这碗面却能让你幸福一整天！”
分镜 4

时长：5 秒
画面和字幕：

画面：一家人围坐吃面，笑容满足，最后镜头定格在包装盒上
字幕：“5 分钟搞定，全家人都爱吃！”
音乐和音效：
背景音乐：温馨的 BGM
音效：筷子碰撞碗的清脆声
台词或旁白：
（旁白，温暖）“忙碌的夜晚，一碗红烧牛肉面，温暖你的胃和心。”
分镜 5

时长：5 秒
画面和字幕：

画面：包装盒特写，旁边弹出购买链接或二维码
字幕：“爱吃面的你，还不赶紧囤货？”（大字 + 箭头指向购买入口）
音乐和音效：
背景音乐：高潮部分，节奏明快
音效：收银台 “叮” 的结账声
台词或旁白：
（旁白，号召）“点击下方链接，马上享受美味！”

结尾技巧：点名人群

“熬夜加班的、懒得做饭的、爱吃肉的兄弟姐妹们，这碗面就是为你准备的！”

互动引导：

“你最喜欢红烧牛肉面里的哪一部分？牛肉还是汤汁？评论区告诉我！”
“点赞收藏，下次不知道吃啥就翻出来看！”

总结：

开头用疑问句引发好奇（“你还在用泡面解决晚餐吗？”）
中间展示产品亮点（大块牛肉、浓郁汤汁、便捷性）
结尾直接点名目标用户（熬夜党、懒人、肉食爱好者），促动下单
全程节奏快，画面诱人，音乐和音效增强代入感
```

##### 8.停止生成

![8.停止生成](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-96.png)

![8.停止生成](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-97.png)

![8.停止生成](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-98.png)

##### 9.最终输出

```markdown
### 小红书文案

**标题**  
[宝宝发烧不慌张！这个测温神器被我吹爆了！]

**正文**  
姐妹们！大数据真的没骗我！这次挖到的测温神器简直拯救了本老母亲的深夜焦虑 😭

以前每次宝宝半夜发烧 🌡️  
我都得手忙脚乱找体温计 ➕ 强光照射 ➕ 疯狂祈祷别吵醒娃  
现在！这个会发光会报警的测温仪直接让我躺赢！

✨【3 大救命功能我必须吹】✨  
1️⃣ 0.1℃ 医疗级精度 👉🏻 误差比水银体温计还小！  
（上次去医院对比过数据 🧑‍⚕️ 医生都夸专业）  
2️⃣ 24 小时蓝牙监测 👉🏻 手机弹窗提醒比闹钟还快 ⏰  
（再也不用定 3 个闹钟半夜爬起来测体温了！）  
3️⃣ 国家认证+365 天换新 👉🏻 本抠门妈妈算过账超划算 💰

💡 真实使用场景安利：  
上周娃突然高烧到 39℃  
我正敷着面膜呢手机就疯狂震动 📱  
从发现到喂退烧药全程不到 5 分钟！  
（要是等娃哭醒再处理真的会急哭 😢）

偷偷说个压箱底用法 👂🏻  
把它贴在水杯上还能测奶温！  
（再也不用手腕试温被烫到跳脚啦）

现在全家都抢着用 🤣  
老公感冒时偷偷监测他有没有偷偷吃冰淇淋 🍦  
（结果真的抓到现行哈哈哈）

⚠️ 重要提示：  
买回来记得做 3 次校准测试！  
（具体方法我放图 3 了 👉🏻 建议收藏）

最后暴风感谢这个神器  
让我从「一摸额头就心慌」的新手妈妈  
变成「随时掌控体温」的淡定王者 👑

👉🏻 评论区揪 3 个姐妹送同款测温贴！  
（点赞+留言"求拯救"参与）

**标签**  
#育儿神器 #宝妈必备 #黑科技育儿 #好物分享 #母婴好物 #发烧护理 #智能测温 #带娃必备

---

### 短视频脚本

**标题**：红烧牛肉面，一碗面里的幸福密码

**主题**：揭秘红烧牛肉面的独特魅力，让你在家也能享受餐厅级美味

**时长**：30 秒

**风格和语调**：轻松活泼，带点幽默感，贴近年轻人的日常

**目标受众**：18-35 岁，喜欢美食、追求便捷生活的年轻人

#### 分镜 1

**时长**：5 秒  
**画面和字幕**：

- 画面：一碗热气腾腾的红烧牛肉面特写，汤汁浓郁，牛肉大块，面条筋道
- 字幕：**“你还在用泡面解决晚餐吗？”**（大字突出）  
  **音乐和音效**：
- 背景音乐：轻快的 BGM
- 音效：面条“吸溜”声，增强食欲感  
  **台词或旁白**：
- （旁白，带点调侃）**“泡面吃腻了？试试这碗红烧牛肉面！”**

#### 分镜 2

**时长**：8 秒  
**画面和字幕**：

- 画面：快速剪辑展示红烧牛肉面的制作过程——大块牛肉炖煮、面条下锅、浇上浓郁汤汁
- 字幕：**“大块牛肉，慢火炖煮 8 小时”**  
  **音乐和音效**：
- 背景音乐：节奏感强的 BGM
- 音效：炖煮的“咕嘟”声，增强真实感  
  **台词或旁白**：
- （旁白，兴奋）**“每一口都是满满的肉香，汤汁浓郁到上头！”**

#### 分镜 3

**时长**：7 秒  
**画面和字幕**：

- 画面：对比普通泡面和红烧牛肉面，普通泡面显得单调，红烧牛肉面丰富诱人
- 字幕：**“泡面 vs 红烧牛肉面，你选哪个？”**  
  **音乐和音效**：
- 背景音乐：悬念感的 BGM
- 音效：对比切换的“唰”声  
  **台词或旁白**：
- （旁白，带点挑衅）**“泡面只能填饱肚子，这碗面却能让你幸福一整天！”**

#### 分镜 4

**时长**：5 秒  
**画面和字幕**：

- 画面：一家人围坐吃面，笑容满足，最后镜头定格在包装盒上
- 字幕：**“5 分钟搞定，全家人都爱吃！”**  
  **音乐和音效**：
- 背景音乐：温馨的 BGM
- 音效：筷子碰撞碗的清脆声  
  **台词或旁白**：
- （旁白，温暖）**“忙碌的夜晚，一碗红烧牛肉面，温暖你的胃和心。”**

#### 分镜 5

**时长**：5 秒  
**画面和字幕**：

- 画面：包装盒特写，旁边弹出购买链接或二维码
- 字幕：**“爱吃面的你，还不赶紧囤货？”**（大字+箭头指向购买入口）  
  **音乐和音效**：
- 背景音乐：高潮部分，节奏明快
- 音效：收银台“叮”的结账声  
  **台词或旁白**：
- （旁白，号召）**“点击下方链接，马上享受美味！”**

**结尾技巧**：点名人群

- **“熬夜加班的、懒得做饭的、爱吃肉的兄弟姐妹们，这碗面就是为你准备的！”**

**互动引导**：

- **“你最喜欢红烧牛肉面里的哪一部分？牛肉还是汤汁？评论区告诉我！”**
- **“点赞收藏，下次不知道吃啥就翻出来看！”**

**总结**：

- 开头用疑问句引发好奇（**“你还在用泡面解决晚餐吗？”**）
- 中间展示产品亮点（大块牛肉、浓郁汤汁、便捷性）
- 结尾直接点名目标用户（熬夜党、懒人、肉食爱好者），促动下单
- 全程节奏快，画面诱人，音乐和音效增强代入感

如果需要进一步优化或调整，请告诉我！
```

#### 3.4.7 Agent 调试

##### 1.查看调用参数

![1.查看调用参数](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-99.png)

当前工作流没有`BOT_USER_INPUT`之外的输入参数，arguments 字段为空。

##### 2.调试工作流

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-100.png)

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-101.png)

![2.调试工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-102.png)

##### 3.工作流详情

![3.工作流详情](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-4-103.png)

### 3.5 main_flow

整体架构如下：

![main_flow](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-1.png)

#### 3.5.1 创建

![3.5.1 创建](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-2.png)

工作流描述如下：

```
当用户要求执行全流程时被调用，底层调用set_product_name_and_desc设置产品名称和功能，调用selling_point_generation生成营销卖点，调用selling2buying_point将卖点转换为买点，调用red_book_and_video_script根据买点生成小红书文案和视频分镜脚本，最终整理所有信息，将最终结果返还给用户~
```

#### 3.5.2 配置

##### 1.开始

![1.开始](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-3.png)

##### 2.设置产品名称和功能

![2.设置产品名称和功能](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-4.png)

![2.设置产品名称和功能](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-5.png)

![2.设置产品名称和功能](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-6.png)

##### 3.生成产品卖点

![3.生成产品卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-7.png)

![3.生成产品卖点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-8.png)

##### 4.产品卖点转换为买点

![4.产品卖点转换为买点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-9.png)

![4.产品卖点转换为买点](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-10.png)

##### 5.生成小红书文案和分镜脚本

![5.生成小红书文案和分镜脚本](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-11.png)

![5.生成小红书文案和分镜脚本](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-12.png)

##### 6.最终文本处理

这是个**文本处理**节点。

![6.最终文本处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-13.png)

![6.最终文本处理](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-14.png)

字符串拼接内容如下：

```markdown
# 产品：{{String1}}

## 卖点：

### 通用性卖点：

{{String2}}

### 独特性卖点：

{{String3}}

### 保障性卖点：

{{String4}}

## 买点：

### 通用性买点：

{{String5}}

### 独特性买点：

{{String6}}

### 保障性买点：

{{String7}}

## 文案：

### 小红书文案

{{String8}}

### 短视频脚本

{{String9}}
```

##### 7.结束

![7.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-15.png)

回答内容如下：

```markdown
{{output}}🥳 恭喜你，已经顺利通关啦 🎊
如果觉得不错，记得给我们点个赞 👍 分享给其他朋友哦 👏
如果还需要提炼其他产品的卖点，请开启新的对话 💐
```

#### 3.5.3 测试

##### 1.输入

![1.输入](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-16.png)

##### 2.使用示例

![2.使用示例](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-17.png)

##### 3.满意

![3.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-18.png)

##### 4.AI 帮答

![4.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-19.png)

##### 5.满意并继续

![5.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-20.png)

##### 6.AI 帮答

![6.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-21.png)

##### 7.满意并继续

![7.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-22.png)

##### 8.AI 帮答

![8.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-23.png)

##### 9.满意并继续

![9.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-24.png)

##### 10.没想法

![10.没想法](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-25.png)

##### 11.满意并继续

![11.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-26.png)

##### 12.没想法

![12.没想法](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-27.png)

##### 13.满意并继续

![13.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-28.png)

##### 14.没想法

![14.没想法](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-29.png)

##### 15.满意并继续

![15.满意并继续](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-30.png)

##### 16.生成

![16.生成](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-31.png)

##### 17.小红书文案

![17.小红书文案](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-32.png)

##### 18.生成

![18.生成](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-33.png)

##### 19.短视频脚本

![19.短视频脚本](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-34.png)

##### 20.足够啦

![20.足够啦](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-35.png)

##### 21.结束

![21.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-36.png)

![21.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-37.png)

输出变量如下：

```json
{
  "output": "# 产品：红烧牛肉面\n\n## 卖点：\n\n### 通用性卖点：\n\n- 快速解决饥饿疲惫\n- 3分钟享餐厅美味\n- 真材实料更营养\n\n### 独特性卖点：\n\n- 15分钟媲美餐厅现做\n- 独家秘制汤底配方\n- 优质牛肉软烂入味\n\n### 保障性卖点：\n\n- 精选牛肉，安全质检\n- 透明包装，真材实料\n- 品质稳定，口味如一\n\n## 买点：\n\n### 通用性买点：\n\n- 疲惫一扫空，活力秒回血（爽点）  \n- 懒人也能吃出仪式感（痒点）  \n- 妈妈放心的营养补给（安全点）\n\n### 独特性买点：\n\n- 在家也能享受大厨级美味（爽点）\n- 一口汤底，尝遍地道风味（兴奋点）  \n- 牛肉入口即化，幸福感爆棚（爽点）\n\n### 保障性买点：\n\n- [买点1] 每一口都是安心的味道（安全点）\n- [买点2] 看得见的新鲜，吃得到的放心（爽点）\n- [买点3] 熟悉的美味，不变的陪伴（情感点）\n\n## 文案：\n\n### 小红书文案\n\n**标题**\n🍜红烧牛肉面｜打工人续命神器来啦💥\n\n**正文**\n姐妹们！大数据终于把我推给这款红烧牛肉面了😭 作为一个996打工人，这碗面简直是我的压箱底救命秘方💯\n\n深夜加班回到家🏙️ 5分钟就能get大厨级美味👩‍🍳 牛肉入口即化的瞬间✨ 一天的疲惫都被治愈了🥺 汤底浓郁到让我疯狂点赞👍 每一口都是妈妈放心的味道👩‍👧\n\n偷偷告诉你们🤫 我囤了整整三箱在冰箱🧊 因为活动真的没几天了❗️上次想买都断货了😱 这次直接怒囤三箱才安心💪\n\n懒人也能吃出高级感仪式感💅 周末宅家来一碗🍜 配上综艺📺 这就是打工人的小确幸啊💕 汤底喝到一滴不剩🥣 欲罢不能说的就是它！\n\n重点来啦📢 看得见的大块牛肉🐂 新鲜到爆炸💥 营养补给满分💯 熟悉的美味就像闺蜜的拥抱🤗 每次吃都幸福感爆棚💖\n\n建议收藏这篇笔记⭐️ 挑战全网最好吃的速食面🍜 普通女生也能轻松get的高级感✨ 被夸爆的正确吃法在这里👆\n\n评论区告诉我你们最爱怎么吃👇 私信我要独家优惠券领取方式🎫 拯救你的深夜饥饿时刻⏰\n\n**标签**\n#红烧牛肉面 #打工人必备 #速食推荐 #深夜食堂 #美食分享 #懒人食谱 #治愈系美食 #囤货指南\n\n### 短视频脚本\n\n标题：一碗让你秒变美食家的红烧牛肉面\n主题：懒人也能享受大厨级美味\n时长：30s\n风格和语调：轻松愉快、充满诱惑力\n目标受众：忙碌上班族、宅家懒人、美食爱好者\n\n分镜：\n- 分镜1\n  + 时长：5s\n  + 画面和字幕：谢霆锋在厨房竖起大拇指（字幕：谢霆锋同款推荐）\n  + 音乐和音效：欢快开场音乐\n  + 台词或旁白：\"谢霆锋都说好吃的红烧牛肉面，到底有多绝？\"\n\n- 分镜2\n  + 时长：7s\n  + 画面和字幕：面条在锅中翻滚，大块牛肉特写\n  + 音乐和音效：咕嘟咕嘟的煮面声\n  + 台词或旁白：\"看得见的大块牛肉，入口即化，汤底熬足8小时\"\n\n- 分镜3\n  + 时长：6s\n  + 画面和字幕：上班族狼吞虎咽吃面（字幕：疲惫一扫空）\n  + 音乐和音效：满足的咀嚼声\n  + 台词或旁白：\"加班回家5分钟，吃出米其林仪式感\"\n\n- 分镜4\n  + 时长：7s\n  + 画面和字幕：妈妈给孩子盛面（字幕：妈妈放心的选择）\n  + 音乐和音效：温馨背景音乐\n  + 台词或旁白：\"作为三个孩子的妈，这款面我回购了三年\"\n\n- 分镜5\n  + 时长：5s\n  + 画面和字幕：产品包装特写+购买二维码\n  + 音乐和音效：促销倒计时音效\n  + 台词或旁白：\"厂家直供，不好吃来找我！现在下单立减10元\"\n\n[创意亮点]\n1. 用谢霆锋IP提升产品档次\n2. 通过\"三个孩子的妈\"身份增强信任感\n3. 突出\"8小时熬制\"工艺差异化\n4. 场景化展示上班族和家庭两种使用场景\n5. 结尾厂家承诺打消顾虑\n\n[升级建议]\n1. 可增加\"与其他品牌对比\"镜头\n2. 加入\"开箱\"环节展示真材实料\n3. 设置\"限时优惠\"增加紧迫感\n4. 考虑用\"测评博主\"身份背书\n5. 添加\"吃播\"式大口吃面镜头增强食欲"
}
```

回答内容如下：

```markdown
# 产品：红烧牛肉面

## 卖点：

### 通用性卖点：

- 快速解决饥饿疲惫
- 3 分钟享餐厅美味
- 真材实料更营养

### 独特性卖点：

- 15 分钟媲美餐厅现做
- 独家秘制汤底配方
- 优质牛肉软烂入味

### 保障性卖点：

- 精选牛肉，安全质检
- 透明包装，真材实料
- 品质稳定，口味如一

## 买点：

### 通用性买点：

- 疲惫一扫空，活力秒回血（爽点）
- 懒人也能吃出仪式感（痒点）
- 妈妈放心的营养补给（安全点）

### 独特性买点：

- 在家也能享受大厨级美味（爽点）
- 一口汤底，尝遍地道风味（兴奋点）
- 牛肉入口即化，幸福感爆棚（爽点）

### 保障性买点：

- [买点 1] 每一口都是安心的味道（安全点）
- [买点 2] 看得见的新鲜，吃得到的放心（爽点）
- [买点 3] 熟悉的美味，不变的陪伴（情感点）

## 文案：

### 小红书文案

**标题**
🍜 红烧牛肉面｜打工人续命神器来啦 💥

**正文**
姐妹们！大数据终于把我推给这款红烧牛肉面了 😭 作为一个 996 打工人，这碗面简直是我的压箱底救命秘方 💯

深夜加班回到家 🏙️ 5 分钟就能 get 大厨级美味 👩‍🍳 牛肉入口即化的瞬间 ✨ 一天的疲惫都被治愈了 🥺 汤底浓郁到让我疯狂点赞 👍 每一口都是妈妈放心的味道 👩‍👧

偷偷告诉你们 🤫 我囤了整整三箱在冰箱 🧊 因为活动真的没几天了 ❗️ 上次想买都断货了 😱 这次直接怒囤三箱才安心 💪

懒人也能吃出高级感仪式感 💅 周末宅家来一碗 🍜 配上综艺 📺 这就是打工人的小确幸啊 💕 汤底喝到一滴不剩 🥣 欲罢不能说的就是它！

重点来啦 📢 看得见的大块牛肉 🐂 新鲜到爆炸 💥 营养补给满分 💯 熟悉的美味就像闺蜜的拥抱 🤗 每次吃都幸福感爆棚 💖

建议收藏这篇笔记 ⭐️ 挑战全网最好吃的速食面 🍜 普通女生也能轻松 get 的高级感 ✨ 被夸爆的正确吃法在这里 👆

评论区告诉我你们最爱怎么吃 👇 私信我要独家优惠券领取方式 🎫 拯救你的深夜饥饿时刻 ⏰

**标签** #红烧牛肉面 #打工人必备 #速食推荐 #深夜食堂 #美食分享 #懒人食谱 #治愈系美食 #囤货指南

### 短视频脚本

标题：一碗让你秒变美食家的红烧牛肉面
主题：懒人也能享受大厨级美味
时长：30s
风格和语调：轻松愉快、充满诱惑力
目标受众：忙碌上班族、宅家懒人、美食爱好者

分镜：

- 分镜 1
  - 时长：5s
  - 画面和字幕：谢霆锋在厨房竖起大拇指（字幕：谢霆锋同款推荐）
  - 音乐和音效：欢快开场音乐
  - 台词或旁白："谢霆锋都说好吃的红烧牛肉面，到底有多绝？"

- 分镜 2
  - 时长：7s
  - 画面和字幕：面条在锅中翻滚，大块牛肉特写
  - 音乐和音效：咕嘟咕嘟的煮面声
  - 台词或旁白："看得见的大块牛肉，入口即化，汤底熬足 8 小时"

- 分镜 3
  - 时长：6s
  - 画面和字幕：上班族狼吞虎咽吃面（字幕：疲惫一扫空）
  - 音乐和音效：满足的咀嚼声
  - 台词或旁白："加班回家 5 分钟，吃出米其林仪式感"

- 分镜 4
  - 时长：7s
  - 画面和字幕：妈妈给孩子盛面（字幕：妈妈放心的选择）
  - 音乐和音效：温馨背景音乐
  - 台词或旁白："作为三个孩子的妈，这款面我回购了三年"

- 分镜 5
  - 时长：5s
  - 画面和字幕：产品包装特写+购买二维码
  - 音乐和音效：促销倒计时音效
  - 台词或旁白："厂家直供，不好吃来找我！现在下单立减 10 元"

[创意亮点]

1. 用谢霆锋 IP 提升产品档次
2. 通过"三个孩子的妈"身份增强信任感
3. 突出"8 小时熬制"工艺差异化
4. 场景化展示上班族和家庭两种使用场景
5. 结尾厂家承诺打消顾虑

[升级建议]

1. 可增加"与其他品牌对比"镜头
2. 加入"开箱"环节展示真材实料
3. 设置"限时优惠"增加紧迫感
4. 考虑用"测评博主"身份背书
5. 添加"吃播"式大口吃面镜头增强食欲 🥳 恭喜你，已经顺利通关啦 🎊
   如果觉得不错，记得给我们点个赞 👍 分享给其他朋友哦 👏
   如果还需要提炼其他产品的卖点，请开启新的对话 💐
```

#### 3.5.4 发布工作流

![3.5.4 发布工作流](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-38.png)

#### 3.5.5 Agent 配置

##### 1.确保 main_flow 在工作流列表

![1.确保 mainflow 在工作流列表](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-39.png)

##### 2.补充“人设与回复逻辑“

![2.补充“人设与回复逻辑“](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-40.png)

提示词如下：

```
当用户要求生成产品卖点和买点或要求执行全流程时，调用{#LibraryBlock id="7570982828394037283" uuid="iEoxB5eZ_TojERO6g2EKy" type="workflow"#}main_flow{#/LibraryBlock#}
用户只要求设置或更新产品信息时，调用{#LibraryBlock id="7574368297250308137" uuid="q9AFbj1EIUhPEulpEmmxv" type="workflow"#}set_product_name_and_desc{#/LibraryBlock#}
用户只要求生成卖点时，调用{#LibraryBlock id="7570982817757331508" uuid="UPgTh3SXS-DJX-dXAIlaN" type="workflow"#}selling_point_generation{#/LibraryBlock#}，当对话记录中没有产品信息时，从数据库读取最新的数据作为产品信息
用户只要求进行卖点到买点的转换时，调用{#LibraryBlock id="7573974383871295515" uuid="PHsCeuIfqmnD7FirsjefS" type="workflow"#}selling2buying_point{#/LibraryBlock#}
用户只要求生成小红书文案或视频分镜脚本时，调用{#LibraryBlock id="7574317541242880040" uuid="NMT4wq87gVUGni8FlzCcY" type="workflow"#}red_book_and_video_script{#/LibraryBlock#}

当用户打招呼、输入其他内容或询问与营销无关的问题，和用户闲聊

当工作流输出不为空时，将输出格式化后打印在对话框
```

#### 3.5.6 和 Agent 交互与调试

相关内容放在下一章。

------

## 4、Agent 配置

### 4.1 模型选择

只要选择带有**工具调用**能力的模型即可。

不同模型理解用户意图的能力有所差别，**测试并选择**效果最好的模型。

此处选择**DeepSeek-V3-0324**。需要注意，Coze 每隔一段时间会淘汰旧模型，如果阅读本文时，该模型已被淘汰，按照此处说明更换模型即可。

### 4.2 开场白和预置问题测试

#### 4.2.1 开场白

##### 1.插入图片

![1.插入图片](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-41.png)

![1.插入图片](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-42.png)

##### 2.开场白文本

![2.开场白文本](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-43.png)

开场白文本如下：

```
 🌟 您好，我是「产品卖点&买点提炼专家」！
拥有10年营销实战经验，曾助力上百个品牌实现增长，贯通营销策略与用户洞察，现为您提供以下核心服务：
✨ 核心功能：
·产品卖点深度挖掘
·卖点精准转化为买点
·小红书爆款文案生成
·短视频分镜脚本创作
💫 我的优势：
• 深耕产品营销，精准把握用户心理与市场趋势
• 系统化提炼方法论，让产品卖点更具吸引力与说服力
• 一站式内容转化支持，赋能小红书爆文与短视频出圈
```

#### 4.2.2 开场白预置问题

![4.2.2 开场白预置问题](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-44.png)

#### 4.2.3 添加背景图片

![4.2.3 添加背景图片](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-45.png)

![4.2.3 添加背景图片](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-46.png)

![4.2.3 添加背景图片](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-47.png)

![4.2.3 添加背景图片](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-48.png)

背景已更换

![4.2.3 添加背景图片](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-49.png)

#### 4.2.4 清屏

![4.2.4 清屏](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-50.png)

![4.2.4 清屏](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-51.png)

可以看到，开场白出现在对话窗口。

![4.2.4 清屏](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-52.png)

预置问题没有全部展示。

![4.2.4 清屏](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-53.png)

打开“全部展示”选项，所有“开场白选项“全部展示在对话窗口。

### 4.3 测试与调试

#### 4.3.1 测试

##### 1.执行全流程

![1.执行全流程](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-54.png)

##### 2.使用示例

![2.使用示例](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-55.png)

![2.使用示例](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-56.png)

##### 3.满意

![3.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-57.png)

![3.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-58.png)

![3.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-59.png)

##### 4.AI 帮答

![4.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-60.png)

![4.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-61.png)

![4.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-62.png)

##### 5.满意

![5.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-63.png)

![5.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-64.png)

##### 6.AI 帮答

![6.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-65.png)

![6.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-66.png)

##### 7.满意

![7.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-67.png)

![7.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-68.png)

##### 8.AI 帮答

![8.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-69.png)

![8.AI 帮答](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-70.png)

##### 9.满意

![9.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-71.png)

![9.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-72.png)

##### 10.没想法

![10.没想法](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-73.png)

![10.没想法](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-74.png)

##### 11.满意

![11.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-75.png)

##### 12.没想法

![12.没想法](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-76.png)

##### 13.满意

![13.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-77.png)

![13.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-78.png)

##### 14.没想法

![14.没想法](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-79.png)

![14.没想法](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-80.png)

##### 15.满意

![15.满意](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-81.png)

##### 16.生成

![16.生成](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-82.png)

##### 17.小红书文案

![17.小红书文案](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-83.png)

![17.小红书文案](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-84.png)

##### 18.生成

![18.生成](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-85.png)

##### 19.短视频脚本

![19.短视频脚本](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-86.png)

![19.短视频脚本](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-87.png)

##### 20.足够啦

![20.足够啦](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-88.png)

##### 21.结束

![21.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-89.png)

![21.结束](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-90.png)

最终输出如下：

```markdown
# 产品：红烧牛肉面

## 卖点：

### 通用性卖点：

- 5 分钟享正宗红烧牛肉面
- 比外卖更快更实惠的热汤面
- 大块真实牛肉，汤浓肉香
- 加班赶时间，拆开即煮
- 手工面口感，不输面馆

### 独特性卖点：

- 8 小时慢炖工艺，牛肉软烂入味
- 5 分钟还原餐厅级美味体验
- 独家秘制汤料配方，难以复制

### 保障性卖点：

- 真空包装牛肉保鲜
- 面条无添加剂保证
- 不满意全额退款
- 品质不符永久退换
- 牛肉来源全程可溯

## 买点：

### 通用性买点：

- [加班族的深夜食堂]（痛点+爽点：解决加班饥饿困扰，快速享受热汤面）
- [10 元吃到大块牛肉面]（爽点+兴奋点：超高性价比的满足感）
- [比外卖更快的第一口热乎]（痛点+爽点：抢时间时的即时温暖）
- [泡面吃出手工面仪式感]（痒点：低成本获得面馆级体验）
- [浓汤滚烫治愈疲惫胃]（安全点+爽点：热汤带来的安心与满足）

### 独特性买点：

- [8 小时慢炖，每一口都是家的温暖]（安全点+爽点：强调慢工出细活的安心感，唤起家庭温馨记忆）
- [5 分钟上桌，比外卖更快的大厨体验]（爽点+兴奋点：突出极速便捷的同时，满足用户对专业口味的追求）
- [秘制汤底，喝一口就忘不掉的味道]（痒点+兴奋点：用"忘不掉"激发好奇心，暗示独特味觉享受）

### 保障性买点：

- [锁住新鲜，留住家的味道]（安全点+爽点：真空保鲜技术让家人吃得放心，保留食材原汁原味）
- [纯净面条，妈妈的选择]（安全点+痛点：无添加配方解决家长对孩子食品安全的担忧）
- [吃得放心，买得安心]（安全点+爽点：双重售后保障消除消费顾虑，增强信任感）
- [源头看得见，美味更安心]（安全点+兴奋点：全程溯源满足现代人对透明供应链的期待）
- [不好吃？我们负责到底]（爽点+安全点：超强售后承诺让顾客无后顾之忧）

## 文案：

### 小红书文案

**标题**
[加班党必囤！10 元吃到大块牛肉面的快乐谁懂 😭]

**正文**
姐妹们！大数据终于让我挖到宝了 💥 这碗红烧牛肉面简直是我的压箱底秘方 🍜 打工人深夜加班的治愈神器非它莫属！

作为一个 996 的普通女生 👩‍💻 每次加班到深夜饿得胃疼的时候 这碗面就是我的救命稻草 🌙 5 分钟就能 get 比外卖更快的第一口热乎 浓汤滚烫瞬间治愈疲惫胃 谁懂啊！！

重点来了姐妹们 👂 10 块钱就能吃到这么大块的牛肉 🐂 8 小时慢炖的汤底香到欲罢不能 每一口都是家的温暖 🏠 泡面吃出手工面的仪式感 这性价比简直吹爆 💥

偷偷告诉你们我的正确姿势 👇
1️⃣ 开水冲泡 5 分钟（比等外卖快多啦 ⏰）
2️⃣ 加入秘制汤料包（香到邻居来敲门 🚪）
3️⃣ 疯狂搅拌让每根面条都裹满汤汁（口水已经流下来了 🤤）
4️⃣ 开吃前记得拍照发朋友圈（被夸爆的深夜食堂认证 📸）

最近发现活动快结束了 😱 我直接囤了三箱在家 听说每次只能买一单 建议收藏这篇赶紧下单‼️ 不好吃？他们承诺负责到底 这售后也太有安全感了吧 💯

留言区告诉我你们最爱什么口味的泡面呀 👇 点赞过 100 抽 3 位姐妹送同款试吃装 🎁

**标签** #红烧牛肉面 #打工人必备 #深夜食堂 #泡面推荐 #加班治愈 #美食分享 #速食推荐 #性价比之王 #吃货日常 #美食测评

### 短视频脚本

标题：深夜加班党的救星来了！  
主题：红烧牛肉面 - 加班族的深夜食堂  
时长：30s  
风格和语调：温暖治愈+小确幸风格，略带深夜电台的亲切感  
目标受众：20-35 岁都市加班族

分镜：

- 分镜 1（0-5s）
  - 画面和字幕：办公室时钟指向 23:00 特写 + "还在加班？"动态文字
  - 音乐和音效：键盘敲击声+叹气声
  - 台词或旁白：（男声温暖）"咱们加班党啊，最懂深夜饥肠辘辘的委屈..."

- 分镜 2（6-12s）
  - 画面和字幕：撕开包装特写 → 沸水冲入面碗升腾蒸汽 + "10 元吃到大块牛肉！"爆炸式字幕
  - 音乐和音效："叮！"微波炉提示音+热汤咕嘟声
  - 台词或旁白："比外卖更快的第一口热乎，8 小时慢炖的浓汤正在治愈你..."

- 分镜 3（13-20s）
  - 画面和字幕：筷子挑起带肉块的面条慢镜头 + "妈妈级安心配方"温馨字幕条
  - 音乐和音效：吸面声+满足的"嗯~"声效
  - 台词或旁白：（切换女声）"纯净面条无添加，锁住的新鲜就是家的温度"

- 分镜 4（21-28s）
  - 画面和字幕：办公室全景镜头拉远，主角满足擦嘴 + "源头可查·不好包退"品质印章动画
  - 音乐和音效：轻松吉他旋律+手机下单"叮咚"声
  - 台词或旁白："这个深夜，让红烧牛肉面替你妈妈说'趁热吃'"

- 分镜 5（29-30s）
  - 画面和字幕：产品包装 360° 旋转+直播间二维码弹幕
  - 音乐和音效：欢快口哨声
  - 台词或旁白：（卖家身份）"厂家直发，不好吃你来找我！"

【创意点】

1. 用"时钟特写 → 蒸汽升腾"的冷暖对比强化深夜场景
2. "吸面声+满足叹息"的 ASMR 音效设计增强代入感
3. 结尾采用卖家身份承诺，配合二维码出现时机提升转化 🥳 恭喜你，已经顺利通关啦 🎊
   如果觉得不错，记得给我们点个赞 👍 分享给其他朋友哦 👏
   如果还需要提炼其他产品的卖点，请开启新的对话 💐
```

#### 4.3.2 Agent 调试

##### 1.查看工作流调用情况

![1.查看工作流调用情况](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-91.png)

##### 2.调试

![2.调试](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-92.png)

![2.调试](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-93.png)

![2.调试](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-94.png)

##### 3.工作流详情

![3.工作流详情](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-95.png)

### 4.4 发布 Agent

![4.4 发布 Agent](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-96.png)

![4.4 发布 Agent](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-97.png)

![4.4 发布 Agent](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-98.png)

![4.4 发布 Agent](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-99.png)

等待审核完成即可。

![4.4 发布 Agent](https://didilili.github.io/ai-agents-from-zero/images/3.10/3.10-3-5-100.png)

状态为**已发布**。

### 4.5 补充：检索方式

- **向量检索：**

  通过生成查询嵌入并查询与其向量表示最相似的文本分段。

- **全文检索：**

  索引文档中的所有词汇，从而允许用户查询任意词汇，并返回包含这些词汇的文本片段。

- **混合检索［推荐]**

  同时执行全文检索和向量检索，并应用重排序步骤，从两类查询结果中选择匹配用户问题的最佳结果，用户可以选择设置权重或配置重新排序模型。
