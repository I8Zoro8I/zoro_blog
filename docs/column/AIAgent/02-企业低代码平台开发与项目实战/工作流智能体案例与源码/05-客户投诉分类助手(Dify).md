---
date: 2026年08月13日
---

# Dify 案例：客户投诉分类助手

------

## 本案例概要

### 使用的工具 / 节点

| 类型         | 名称 / 能力 | 作用                                                         |
| ------------ | ----------- | ------------------------------------------------------------ |
| **节点**     | 开始        | 接收用户反馈内容（如 `feedback`），作为工作流输入。          |
| **节点**     | 问题分类器  | 调用 LLM，从预置问题列表中选出与用户提问最匹配的一级、二级分类。 |
| **节点**     | 总结助手    | 调用 LLM，根据一级/二级分类名称和用户问题生成简短总结。      |
| **内置工具** | 钉钉群消息  | 将总结等内容通过钉钉群机器人发送到指定群；需配置 Webhook、加签秘钥。 |

### 技术要点

- **输入**：用户在「开始」节点填写反馈内容（`feedback`）。
- **两级分类**：问题分类器（可配置为两级）调用 LLM，从预置列表中选出最符合的一级分类与二级分类，输出 `class_name` 等供下游使用。
- **总结生成**：总结助手在系统提示词中注入上一级的一级/二级分类名和用户问题，要求 LLM 只输出总结内容；通过 `/` 或变量引用关联上游输出。
- **钉钉推送**：使用 Dify 内置的钉钉群机器人工具，在工具中填写 Webhook 的 `access_token` 与加签秘钥；注意 ACCES TOKEN 填的是 Webhook URL 里 **access_token** 参数的值。

### 工作流程概览

```
开始(feedback：用户反馈)
    ↓
问题分类器(两级) → 一级 class_name、二级 class_name
    ↓
总结助手(一级分类名, 二级分类名, feedback) → 总结文本
    ↓
钉钉群消息工具(总结等) → 发送到钉钉群
    ↓
结束
```

------

## 1、功能概览

我们这里构建一个使用了钉钉群机器人的消息反馈工作流。将用户的文字问题进行分类和拆解，分析后通过钉钉群机器人发送到群中。

如下是其工作流的整体配置。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-1-1-1.png)

------

## 2、具体实现

### 2.1 开始

创建空白应用。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-1-1.png)

接着开始编辑工作流。

工作流从此处开始。我们在输入字段中添加自己指定的输入内容。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-1-2.png)

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-1-3.png)

### 2.2 问题分类器

这里调用了两级问题分类器。问题分类器会调用 LLM，从问题列表中选择与用户提问最匹配的一条，并进入该条对应的分支。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-2-1.png)

### 2.3 总结助手

是问题分类器的下游，在系统提示词中传入两级分类的名称以及初始问题，要求进行总结（需要输入变量时输入 **/** 即可唤起变量联想）。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-3-1.png)

```
你是一个总结助手，将下面的问题进行总结
一级分类：{{#1763188881440.class_name#}}，二级分类：{{#1763189022754.class_name#}}，用户问题：{{#1763188813397.feedback#}}
```

### 2.4 钉钉群消息工具

首先在 Dify 的工具中添加钉钉群机器人工具。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-4-1.png)

需使用 PC 端钉钉创建群机器人。先在你担任管理员的组织内创建一个群，然后在该群中创建机器人。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-4-2.png)

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-4-3.png)

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-4-4.png)

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-4-5.png)

保存该加签秘钥，后续配置时会用到。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-4-6.png)

```
SEC8bf8c991ebaf99cdf04b25a1dd85f2730541e6e15ef33bf9666b6cee1922d08b

https://oapi.dingtalk.com/robot/send?access_token=c4aadb7ea5e30cab326c6f47a747a0eb3780e43d3d3addfac3cc09299d757910
```

保存该 Webhook，后续配置时会用到。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-4-7.png)

完成创建后，在钉钉机器人工具中的「ACCESS TOKEN」中填入 Webhook 里的 `access_token` 值，在「加签秘钥」中填入刚才保存的加签秘钥。

> **注意**：ACCESS TOKEN 一定要填写 Webhook 中的 **access_token** 的值。
>
> https://oapi.dingtalk.com/robot/send?access_token=**89ab91b1ebf27b4t861650a4248e2e0b1226d4b3fd31d4dcec6b71a7f59ed0a4**

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-2-4-8.png)

------

## 3、测试

点击运行，输入初始反馈信息并开始运行。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-3-1-1.png)

运行成功。

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-3-1-2.png)

![客户投诉分类助手案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.5/3.5-3-1-3.png)
