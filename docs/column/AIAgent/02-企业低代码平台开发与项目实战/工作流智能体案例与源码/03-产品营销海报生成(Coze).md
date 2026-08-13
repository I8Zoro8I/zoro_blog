---
date: 2026年08月13日
---

# Coze 案例：产品营销海报生成

------

## 本案例概要

### 使用的插件 / 节点

| 类型         | 名称 / 能力         | 作用                                                         |
| ------------ | ------------------- | ------------------------------------------------------------ |
| **图像生成** | 图像处理 → 图像生成 | 根据提示词做**文生图**，支持不同宽高比（如 2:3）；按 proportion 分支选择对应比例与模型。 |
| **指令编辑** | 指令编辑插件        | **改图**：在用户上传的原图基础上，按提示词进行编辑。         |
| **画质提升** | 画质提升插件        | **变清晰**：对用户上传的图片做清晰度增强（无需提示词）。     |
| **叠图**     | 叠图插件            | 将二维码或 logo 叠加到底图上，可按位置参数（如 qr_place）指定相对位置与缩放比例。 |

```
【插件说明】
图片缩放 - 插件 - 扣子
https://www.coze.cn/store/plugin/7438917029320491008

指令编辑 - 插件 - 扣子
https://www.coze.cn/store/plugin/7436679907834626084

插件 - 扣子
https://www.coze.cn/store/plugin/7438835880728526898

叠图 - 插件 - 扣子
https://www.coze.cn/store/plugin/7438921536473612288

```

### 技术要点

- **双工作流**：本案例包含 **img_generate**（生成/导出海报）和 **read_history**（查询历史记录）；界面通过调用这两个工作流完成「生成」与「历史」能力。
- **生图 / 导出分流**：根据 `logo_place` 是否为空区分**生图链路**与**导出链路**；生图链路产出海报图，导出链路在已有图上加二维码和 logo。
- **生图链路分支**：`img` 为空时为**文生图**，按 `proportion` 路由到不同宽高比的生图节点；`img` 不为空时为**改图**或**变清晰**（由提示词是否为空区分）。
- **导出链路**：先根据 `qr_img` 是否为空决定用用户二维码或官方二维码，用叠图插件叠加到底图；再按同样方式用叠图插件添加 logo；两路分支通过**变量聚合**合并为统一 output。
- **持久化**：生图/导出后的图片与提示词写入数据表 **Generation**；read_history 从该表查询记录并返回列表供界面展示。

### 工作流程概览

**img_generate：**

```
开始(logo_place, img, proportion, prompt, qr_img, qr_place, …)
    ↓
分支：logo_place 是否为空？
    ├─ 为空 → 生图链路
    │     ├─ img 为空 → 文生图：按 proportion 分支 → 图像生成(提示词) → 海报图
    │     └─ img 不为空 → 改图 / 变清晰（指令编辑 或 画质提升）→ 海报图
    └─ 不为空 → 导出链路
          ├─ 按 qr_img 添加二维码（用户二维码或官方二维码）→ 叠图
          └─ 添加 logo → 叠图
    ↓
变量聚合 → 写入 Generation 表 → 结束：输出 output（图片）
```

**read_history：** 开始 → 数据库查询 Generation 表 → 结束：返回 outputList（历史记录列表）。

------

## 1、打开官方模板页面

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-1-1-1.png)

右侧展示的都是官方模板。

------

## 2、选择模板

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-2-1-1.png)

------

## 3、复制模板

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-3-1-1.png)

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-3-1-2.png)

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-3-1-3.png)

------

## 4、分析工作流

此处可以看到两个工作流。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-1.png)

### 4.1 img_generate

这是关键的生成图片的逻辑。

#### 4.1.1 开始

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-2.png)

#### 4.1.2 导出链路判定

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-3.png)

根据 logo_place 判断是否为导出链路，前者为空则不是导出，反之亦然。

##### 2.1 生图链路

logo_place 为空说明是生图链路。

**判断是否为文生图链路**

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-4.png)

如果 img 参数为空则说明是文生图，否则是图生图。

###### 2.1.1 文生图

根据具体的宽高比生成图片。

**首先由一个分支节点根据不同的 propotion 路由至不同的生图节点**

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-5.png)

**然后在不同的分支选择不同的生图比例，并选好生图模型，将用户的提示词作为生图提示词传入。**

以 2:3 为例。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-6.png)

此处的生图节点都是图像处理下的图像生成节点。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-7.png)

###### 2.1.2 改图

如果 img 不为空则是改图。

根据提示词判定是改图还是变清晰，如果提示词不为空是改图，否则为变清晰。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-8.png)

**改图**

将原图和提示词填入。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-9.png)

改图节点选择的是指令编辑插件。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-10.png)

**变清晰**

将原图填入。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-11.png)

变清晰节点选择的是画质提升插件。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-12.png)

##### 2.2 导出链路

###### 2.2.1 添加二维码

**根据 qr_img 参数是否为空判断用户是否上传了二维码**

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-13.png)

① 如果用户上传了二维码

**调整用户二维码图片大小，最大尺寸不超过 200 像素**

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-14.png)

**添加用户二维码**

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-15.png)

将调整后的用户二维码作为上层图，将传入的图片作为底图，上层图已经经过了尺寸调整，缩放比例为 100%，即不缩放。并根据 qr_place 指定上层图的相对位置。

**此处使用的是叠图插件**

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-16.png)

② 如果用户没有上传二维码

则直接添加扣子官方二维码，并按照 ① 中相同的方式叠图。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-17.png)

官方的二维码图片尺寸是固定的，所以直接按照指定的 30%比例缩放。

**变量聚合**

通过变量聚合节点将两个分支的数据聚合在一起，下游只需要处理同一个变量 output 即可。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-18.png)

多个分支的数据只有一个是存在的，直接将其拼接在一起，最终的效果就是执行哪个分支，哪个分支的输出就作为变量聚合后的 output。

###### 2.2.2 添加 logo

逻辑和二维码添加相同，略。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-19.png)

#### 4.1.3 变量聚合
无论上游是导出链路还是生图链路，最终输出的都是图片，聚合在一起作为 output 传输至下游。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-20.png)

#### 4.1.4 写入数据库

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-21.png)

将生成的图片和提示词存入数据表 Generation，该节点会将写入的行号和当前数据表中的数据列表输出至下游。当前链路中输出的数据无用。

##### 数据表

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-22.png)

官方在当前应用中创建了一个数据表 Generation，字段如上所示。

#### 4.1.5 结束

最终将变量聚合节点的 output 输出，无论执行哪个分支，生成的图片都会被输出。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-1-23.png)

### 4.2 read_history

#### 4.2.1 开始

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-2-1.png)

只有一个参数，该参数是用户在本轮对话中输入的内容，然而，在 UI 界面调用该工作流时该参数恒为空。可理解为开始节点实际上没有参数。

#### 4.2.2 数据库节点

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-2-2.png)

从数据表 Generation 查询所有记录的图片、写入时间和提示词，作为列表 outputList 返回，同时返回行号。

#### 4.2.3 结束节点

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-4-2-3.png)

将数据库节点查询到的数据作为 output 返回。

------

## 5、用户界面

官方提供两个用户界面，可以通过左侧结构-图层查看所有页面的所有组件。

![产品营销海报生成案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.3/3.3-5-1-1.png)

查看属性和事件标签，就可以知道何时及如何调用工作流，此处不展开。