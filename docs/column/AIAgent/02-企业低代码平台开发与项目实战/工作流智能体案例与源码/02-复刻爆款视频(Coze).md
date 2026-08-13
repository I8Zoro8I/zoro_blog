---
date: 2026年08月13日
---

# Coze 案例：复刻爆款视频

------

## 本案例概要

### 使用的插件

| 插件名称     | 接口 / 能力            | 作用                                                         |
| ------------ | ---------------------- | ------------------------------------------------------------ |
| **链接读取** | LinkReaderPlugin       | 根据视频页面 url（如 B 站）抓取正文，返回标题、视频 ASR 文本、OCR 文本等，作为「参考文案」供大模型使用。 |
| **文生图**   | 如 text_to_image_v1 等 | 根据提示词（prompt）生成分镜图片，返回图片 URL；在循环体内对每个分镜调用一次。 |

### 技术要点

- **输入**：用户提供爆款视频链接（建议 B 站链接，抖音易受反爬限制）。
- **参考文案抽取**：用链接读取插件抓取视频页的标题、ASR 字幕、OCR 文本，拼成 `content`，与大模型生成的 `title` 一起作为参考。
- **剧本生成**：大模型根据参考文案，生成约 1 分钟短片剧本，**结构化输出** `scripts`（分镜脚本数组）、`asides`（旁白数组）、`outline`（视频大意）；要求开头 5 秒抓人、每镜不超过 5 秒、旁白与分镜一一对应。
- **循环 + 文生图**：对 `scripts` 的每一项执行循环体——先用大模型按「文生图提示词」系统指令，根据 `outline` 与当前 `script` 生成 prompt，再调用文生图得到图片 URL。
- **代码节点**：在循环体内将当前索引对应的 `script`、`aside` 与当次文生图的 `picture` URL 封装成一条 `content` 对象。
- **输出**：循环汇总为 `contents` 数组（每项含 script、aside、picture），连同 `outline` 一并返回；后续可配合图生视频、剪映等做成完整视频。

### 工作流程概览

```
开始(视频 url)
    ↓
链接读取 LinkReaderPlugin(url) → content（标题 + ASR + OCR）
    ↓
大模型(参考 title、content) → scripts[]、asides[]、outline
    ↓
循环：对每个分镜 index
    ├─ 大模型_1(outline, script) → 文生图提示词 prompt
    ├─ 文生图(prompt) → 图片 URL
    └─ 代码(scripts, asides, urls, index) → 单条 content{ script, aside, picture }
    ↓
结束：返回 contents[]、outline
```

------

## 0、效果测试

视频链接：

https://www.bilibili.com/video/BV1S2421P788/?share_source=copy_web&vd_source=8d04b2c1b7fd20888b03c20e99f26dc0

效果预览：

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-0-1-1.png)

------

## 1、环境准备

### 1. 进入工作空间

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-1-1-1.png)

### 2. 创建应用

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-1-2-1.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-1-2-2.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-1-2-3.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-1-2-4.png)

### 3. 新建工作流

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-1-3-1.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-1-3-2.png)

------

## 2、搭建工作流

coze 工作流提供了许多节点，要了解用法可以参考官方文档。

> https://www.coze.cn/open/docs/guides

### 2.1 开始节点

开始节点是工作流的起始节点，用于设定启动工作流需要的输入信息。**开始节点只有输入参数**，没有输出等其他参数。

#### 2.1.1 输入参数说明

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-1-1.png)

#### 2.1.2 配置

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-1-2.png)

### 2.2 插件节点

插件节点用于在工作流中调用插件运行指定工具。

插件是一系列工具的集合，每个工具都是一个可调用的 API。

#### 2.2.1 添加第二个节点

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-2-1.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-2-2.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-2-3.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-2-4.png)

#### 2.2.2 配置节点

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-2-5.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-2-6.png)

#### 2.2.3 测试节点

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-2-7.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-2-8.png)

测试用的 url 如下：

> https://www.bilibili.com/video/BV1H48CzUEhj/?spm_id_from=333.337.search-card.all.click&vd_source=88c7b17e5559e5e21cf45e7e873d1459
>
> 或
>
> https://www.bilibili.com/video/BV1S2421P788/?share_source=copy_web&vd_source=8d04b2c1b7fd20888b03c20e99f26dc0

效果如下：

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-2-9.png)

输出如下：

```json
{
  "code": null,
  "data": {
    "content": "**标题：** 超燃短片《白蛇序章》，一定要看到最后！ 原创故事短片，根据传统故事白蛇传进行改编，纯AI技术实现，高潮越燃！#白蛇 #白蛇传 #白蛇后传 #AI动画 #原创作品\n**作者：** AI猎人会种地\n**视频ASR文本：** ah ah no no no i think that's the 你在这念了多少年了师傅念了五年了你不是想知道为什么要日夜不停的念这七佛灭罪真言吗 如今我阳寿已尽今晚 就把一切都告诉你我在这里已经念了整整一百年了一百年前的事已经没什么人记得了 你可知道白娘子我好像听奶奶说过白娘子是菩萨化身在杭州城救苦救难菩萨化身 那白娘子那是什么菩萨化身他是蛇妖千年之前诸天神佛化定三界从此 人妖殊途仙人永诀直到百年前有蛇妖出世要打破这诸天神佛立下的规矩混乱天地 佛祖派下法海祖师坐镇杭州以无上法力把这蛇妖镇妖在这雷峰 蛇妖就在雷峰塔现在还在你自己看吧 嗯门在这 祖师命我在他圆寂之后用他的法身研磨成金粉在这地牢里遍书真言度化这千年蛇妖祖师以神化咒不去解 不入轮回就是在渡这妖孽 祖师说过如佛化定了天地的规矩 从此人就是人妖就是妖因此这三千世界永享太平可蛇妖要过人妖之界不管他处于情也好爱 爱也罢都是罪孽无边可只要是他能弃行绝爱忘掉过往重重重回妖道便可以把他放回山林 这是什么人这是那蛇妖的丈夫蛇妖有丈夫哎 我又来了此生这是我最后一次来接你以后就是我身后的小徒弟我们这一脉一百年也好一千年也好都会在这里陪着直到 你被祖师洞化我还是来问你这一句这也是我最后问你你都忘了吗你都忘了吗你可都忘了 我忘了我忘了很多事可是我忘不掉你们以真情求我 要我忘了这世间至真至情才能得自由可若是忘了这些 我要自由何用便是在囚困我一千年一万年再来问我一千遍一万遍 我也是忘不掉的我忘不掉我是许仙的妻子我是许士林的母亲我是白素贞我是白素贞 若无真情千年修行何用若无真情无边法力何用 若无真情天地逍遥何用 这真元因情而生 因缘而结会化成你的鳞片生生世世永远灼烧你的神魂这是诅咒也是福神就是因为这日夜不停的灼烧让我知道 我是谁一百年了你问了我一百次我也一样问了你一百次这也是我最后一次问你 若妖有了真情还是妖吗 哎\n**视频或图片OCR文本：** AI猎人原创 搬运必究|撒运必究 AI猎人原创|b' AI猎人原创 微运必究|搬运必究 AI猎人原创|AI猎人原创 搬远必究||A猎人原创 搬运必究|啊 AI猎人原创 搬运必究|你在这念了多少年了 How many years have you been studying here 搬运必究 AI猎人原创|你在这念了多少年了 How many years have you been studying here AI猎人原创 搬运必究|师父,念了五年了 Master,I've been studying for five years 搬运必究 人原创|你不是想知道 Don't you want to know AI猎人原创 搬运必究|为什么要日夜不停的念这 why you keep reciting the\"Seven Buddhas AI猎人原创 搬运必究|为什么要日夜不停的念这 why you keep reciting the\"Seven Buddhas AI猎人原创 理想究|AI猎人原创 搬运必究 七佛灭罪真言吗? Mantra on Destioying Sins\"day and night?|如今我阳寿已尽 Now that my longevity is over AI猎人原创 搬运必究|今晚就把一切都告诉你 Tonight,I will tell you everything AI猎人原创 搬运必究|AI猎人原创 搬运必究 我在这里 I've been here|AI猎人原创 搬运必究 已经念了整整一百年了 for a hundred years|一百年前的事已经没什么人记得了 A hundred years ago,no one remembers it AI猎人原创 搬运必究|撒运必究 AI猎人原创 一百年前的事已经没什么人记得了 A hundred years ago,no one remembers it|我好像听奶奶说过 I seem to have heard my grandmother say AI猎人原创 搬运必究|白娘子是菩萨化身 She is the incarnation of a Bodhisattva AI猎人原创 搬运必究|AI猎人原创 搬运必究 在杭州城救苦救难 who rescues the suffering in Hangzhou City|微运必究 AI猎人原创|菩萨化身 AI猎人原创 搬运必究 Bodhisattva incarnation|AI猎人原创 搬运必究 嘿嘿嘿 Hey......|搬运必究 AI猎人原创 那白娘子哪是什么菩萨化身 What kind of bodhisattva incarnation is the Bai niangzi|她是蛇妖 she......It's a basilisk AI猎人原创 搬运必究|她是蛇妖 she ......It's a basilisk 搬运必究 AI猎人原创|千年之前 Thousands of years ago AI猎人原创 搬运必究|AI猎人原创 撒运必究 诸天神佛划定三界 the gods and Buddhas of the heavens demarcated the Three Realms|诸天神佛划定三界 the gods and Buddhas of the heavens demarcated the Three Realms|24 从此人妖殊途 AI猎人原创 搬运必究 and from then on,the demons had different paths|天人永绝 AI猎人原创 搬运必究 and the heavens and men were forever|直到百年前 Until a hundred years ago AI猎人原创 搬运必究|有蛇妖出世 AI猎人原创 搬运必究 a snake demon was born to break|AI猎人原创 搬运必究 要打破这诸天神佛立下的规矩 the rules set by the gods and Buddhas and confuse the heavens|AI猎人原创 搬运必究 要打破这诸天神佛立下的规矩 the rules set by the gods and Budlhas and confuse the heavens|混乱天地 and the earth AI猎人原创 搬运必究|佛祖派下法海祖师坐镇杭州 The Buddha sent the Patriarch Fahai to sit in Hangzhou AI猎人原创 撒远必究|佛祖派下法海祖师坐镇杭州 The Buddha sent the Patri\n",
    "title": null
  },
  "err_msg": null,
  "error_code": "",
  "error_msg": "",
  "message": null,
  "pdf_content": null
}
```

### 2.3 大模型节点

大模型节点是扣子提供的基础节点之一，你可以在该节点使用大语言模型处理任务。

大模型节点可以调用大型语言模型，根据输入参数和提示词生成回复，通常用于执行文本生成任务，例如文案制作、文本总结、文章扩写等。

#### 2.3.1 创建节点

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-1.png)

#### 2.3.2 模型选择

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-2.png)

#### 2.3.3 配置输入参数

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-3.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-4.png)

#### 2.3.4 配置系统和用户提示词

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-5.png)

**大语言模型的系统提示词**

```
参考文案标题{{title}}
参考文案内容{{content}}
```

**大语言模型的用户提示词**

```
根据上述文案的内容、背景和风格，输出一段类似的故事短片剧本，时长大约为1分钟，需要在开头的5秒钟抓住用户的眼球，详细撰写分镜脚本，每个镜头之间的时间间隔不超过5s
每个分镜脚本对应一个字符串，将这些字符串置于scripts数组中
此外，还要按照相同的时间间隔撰写旁白，以字符串的形式置于asides数组中，如果没有旁白则用字符串“无旁白”代替。要求旁白和分镜脚本一一对应
最后，要输出整个视频的大意，置于字符串outline中。
```

#### 2.3.5 配置输出参数

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-6.png)

#### 2.3.6 测试

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-7.png)

content 内容如下：

```
**标题：** 超燃短片《白蛇序章》，一定要看到最后！ 原创故事短片，根据传统故事白蛇传进行改编，纯AI技术实现，高潮越燃！#白蛇 #白蛇传 #白蛇后传 #AI动画 #原创作品\n**作者：** AI猎人会种地\n**视频ASR文本：** ah ah no no no i think that's the 你在这念了多少年了师傅念了五年了你不是想知道为什么要日夜不停的念这七佛灭罪真言吗 如今我阳寿已尽今晚 就把一切都告诉你我在这里已经念了整整一百年了一百年前的事已经没什么人记得了 你可知道白娘子我好像听奶奶说过白娘子是菩萨化身在杭州城救苦救难菩萨化身 那白娘子那是什么菩萨化身他是蛇妖千年之前诸天神佛化定三界从此 人妖殊途仙人永诀直到百年前有蛇妖出世要打破这诸天神佛立下的规矩混乱天地 佛祖派下法海祖师坐镇杭州以无上法力把这蛇妖镇妖在这雷峰 蛇妖就在雷峰塔现在还在你自己看吧 嗯门在这 祖师命我在他圆寂之后用他的法身研磨成金粉在这地牢里遍书真言度化这千年蛇妖祖师以神化咒不去解 不入轮回就是在渡这妖孽 祖师说过如佛化定了天地的规矩 从此人就是人妖就是妖因此这三千世界永享太平可蛇妖要过人妖之界不管他处于情也好爱 爱也罢都是罪孽无边可只要是他能弃行绝爱忘掉过往重重重回妖道便可以把他放回山林 这是什么人这是那蛇妖的丈夫蛇妖有丈夫哎 我又来了此生这是我最后一次来接你以后就是我身后的小徒弟我们这一脉一百年也好一千年也好都会在这里陪着直到 你被祖师洞化我还是来问你这一句这也是我最后问你你都忘了吗你都忘了吗你可都忘了 我忘了我忘了很多事可是我忘不掉你们以真情求我 要我忘了这世间至真至情才能得自由可若是忘了这些 我要自由何用便是在囚困我一千年一万年再来问我一千遍一万遍 我也是忘不掉的我忘不掉我是许仙的妻子我是许士林的母亲我是白素贞我是白素贞 若无真情千年修行何用若无真情无边法力何用 若无真情天地逍遥何用 这真元因情而生 因缘而结会化成你的鳞片生生世世永远灼烧你的神魂这是诅咒也是福神就是因为这日夜不停的灼烧让我知道 我是谁一百年了你问了我一百次我也一样问了你一百次这也是我最后一次问你 若妖有了真情还是妖吗 哎\n**视频或图片OCR文本：** AI猎人原创 搬运必究|撒运必究 AI猎人原创|b' AI猎人原创 微运必究|搬运必究 AI猎人原创|AI猎人原创 搬远必究||A猎人原创 搬运必究|啊 AI猎人原创 搬运必究|你在这念了多少年了 How many years have you been studying here 搬运必究 AI猎人原创|你在这念了多少年了 How many years have you been studying here AI猎人原创 搬运必究|师父,念了五年了 Master,I've been studying for five years 搬运必究 人原创|你不是想知道 Don't you want to know AI猎人原创 搬运必究|为什么要日夜不停的念这 why you keep reciting the\"Seven Buddhas AI猎人原创 搬运必究|为什么要日夜不停的念这 why you keep reciting the\"Seven Buddhas AI猎人原创 理想究|AI猎人原创 搬运必究 七佛灭罪真言吗? Mantra on Destioying Sins\"day and night?|如今我阳寿已尽 Now that my longevity is over AI猎人原创 搬运必究|今晚就把一切都告诉你 Tonight,I will tell you everything AI猎人原创 搬运必究|AI猎人原创 搬运必究 我在这里 I've been here|AI猎人原创 搬运必究 已经念了整整一百年了 for a hundred years|一百年前的事已经没什么人记得了 A hundred years ago,no one remembers it AI猎人原创 搬运必究|撒运必究 AI猎人原创 一百年前的事已经没什么人记得了 A hundred years ago,no one remembers it|我好像听奶奶说过 I seem to have heard my grandmother say AI猎人原创 搬运必究|白娘子是菩萨化身 She is the incarnation of a Bodhisattva AI猎人原创 搬运必究|AI猎人原创 搬运必究 在杭州城救苦救难 who rescues the suffering in Hangzhou City|微运必究 AI猎人原创|菩萨化身 AI猎人原创 搬运必究 Bodhisattva incarnation|AI猎人原创 搬运必究 嘿嘿嘿 Hey......|搬运必究 AI猎人原创 那白娘子哪是什么菩萨化身 What kind of bodhisattva incarnation is the Bai niangzi|她是蛇妖 she......It's a basilisk AI猎人原创 搬运必究|她是蛇妖 she ......It's a basilisk 搬运必究 AI猎人原创|千年之前 Thousands of years ago AI猎人原创 搬运必究|AI猎人原创 撒运必究 诸天神佛划定三界 the gods and Buddhas of the heavens demarcated the Three Realms|诸天神佛划定三界 the gods and Buddhas of the heavens demarcated the Three Realms|24 从此人妖殊途 AI猎人原创 搬运必究 and from then on,the demons had different paths|天人永绝 AI猎人原创 搬运必究 and the heavens and men were forever|直到百年前 Until a hundred years ago AI猎人原创 搬运必究|有蛇妖出世 AI猎人原创 搬运必究 a snake demon was born to break|AI猎人原创 搬运必究 要打破这诸天神佛立下的规矩 the rules set by the gods and Buddhas and confuse the heavens|AI猎人原创 搬运必究 要打破这诸天神佛立下的规矩 the rules set by the gods and Budlhas and confuse the heavens|混乱天地 and the earth AI猎人原创 搬运必究|佛祖派下法海祖师坐镇杭州 The Buddha sent the Patriarch Fahai to sit in Hangzhou AI猎人原创 撒远必究|佛祖派下法海祖师坐镇杭州 The Buddha sent the Patri\n
```

title 为 null 可以省略

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-8.png)

查看输出

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-9.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-10.png)

右侧窗口下滑也可以看到输入内容。

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-3-11.png)

输出内容如下：

```json
{
  "scripts": [
    "0-5s：雷电交加的雷峰塔全景，金色佛经符文在塔身流动，镜头急速推进穿透塔壁",
    "5-8s：阴森地牢特写，枯骨僧人跪坐研磨金粉，经文锁链缠绕中央发光人影",
    "8-12s：年轻僧人惊愕后退撞倒烛台，火光映出白鳞覆盖的女子侧脸（眼部特写）",
    "12-15s：老和尚枯手抓住僧人肩膀，墙上浮现法海镇压蛇妖的金身壁画",
    "15-20s：白蛇指尖触碰灼烧的鳞片，回忆闪现：①剑指苍穹破天门 ②婴儿啼哭 ③断桥伞下相拥",
    "20-25s：地牢剧烈震动，经文字符崩解，白蛇化作巨蟒冲破塔顶（慢镜头鳞片飞溅）",
    "25-30s：法海金身睁眼，佛掌压下时蟒蛇逆光化人形，白发飞扬直视苍穹",
    "30-35s：闪回现代杭州夜景，雷峰塔倒影中白衣女子拾起发光鳞片（瞳孔蛇瞳收缩）",
    "35-40s：漫天经卷燃烧成灰，白蛇在灰烬中行走，身后浮现许仙虚影轻抚其发",
    "40-45s：地牢崩塌，老和尚化为金粉，年轻僧人握紧带血佛珠怔立雨中",
    "45-50s：白蛇立于云端，左手佛印右手妖火，脚下山河显化人妖两界碰撞特效",
    "50-55s：特写染血的法海金身突然流泪，雷峰塔遗址长出并蒂白莲",
    "55-60s：阳光穿透乌云，白鳞化作漫天蒲公英，现代少女接住发光绒球（瞳孔反光蛇影）"
  ],
  "asides": [
    "「这塔里锁着连佛祖都渡不了的妖」",
    "「百年研磨祖师金身，只为消她一片鳞」",
    "「你可知镇压在此的...曾是救世菩萨？」",
    "「人妖殊途是规矩，真情却是原罪」",
    "（痛苦喘息声）「千年道行...不如一夜烟火」",
    "「诸天神佛！且看妖如何破天规！」",
    "「若情是罪，我愿永堕无间」",
    "「轮回百世，你终究带着那片鳞」",
    "「许仙，你看这枷锁...原是嫁衣」",
    "「师父，我们守的到底是正法...还是执念？」",
    "（混响）「三界六道，何处容得人妖真情？」",
    "「原来佛也会为妖落泪」",
    "「下一个百年，轮到谁来讲我们的故事？」"
  ],
  "outline": "被镇压百年的白蛇在当代苏醒，通过年轻僧人与守塔人的冲突，揭示神佛与人妖三界的规则矛盾。以燃烧的金粉经文、轮回记忆碎片等超现实意象，展现白素贞冲破雷峰塔禁锢的过程，最终在现代与转世许仙重逢，用妖火佛光重塑天地法则，质问所谓正邪界限。",
  "reasoning_content": "好的，我现在需要根据用户提供的参考文案内容，生成一个符合要求的1分钟短片剧本。首先，我要仔细分析用户的需求。他们希望分镜脚本和旁白一一对应，每个镜头时间不超过5秒，开头5秒要抓人眼球，并且整体结构符合给出的JSON格式。\n\n参考文案是关于改编白蛇传的AI动画，里面有雷峰塔、法海、白素贞、许仙等元素，主题围绕人妖界限、真情与束缚的冲突。用户提供的视频ASR和OCR文本显示，故事中有师徒对话，揭示白素贞被镇压的背景，以及她坚持真情的决心。\n\n首先，开头5秒需要吸引观众。可能用雷电交加的雷峰塔全景，配合字幕，营造紧张氛围。接着是地牢内的金粉经文，展示镇压的细节。然后切换到老和尚和小和尚的对话，带出百年镇压的背景。\n\n中间部分需要展示白素贞的挣扎和回忆，比如她触碰鳞片时的痛苦，以及回忆片段中的战斗和家庭场景，突出她的情感冲突。高潮部分，她面对法海金身的质问，强调真情的主题，最后以雷峰塔倒塌和阳光下的鳞片结束，象征希望。\n\n旁白方面，每段需要简洁，与画面匹配，比如开头用环境描写，中间解释背景，高潮点题。时间间隔要对应分镜，确保同步。\n\n最后的大意要概括整个视频，突出冲突和主题。需要检查JSON结构，确保scripts和asides数组长度相同，每个元素都是字符串，outline简明扼要。\n\n可能需要注意的地方：分镜和旁白的时间对齐，避免内容过长超过5秒；旁白要补充画面信息，但不过于冗长；确保所有元素符合传统白蛇传的改编，同时加入AI动画的亮点。需要反复检查JSON格式是否正确，避免语法错误。\n"
}
```

### 2.4 循环节点

循环节点用于重复执行一系列任务。

循环是一种常见的控制机制，用于重复执行一系列任务，直到满足某个条件为止。扣子工作流提供循环节点，当需要重复执行一些操作，或循环处理一组数据时，可以使用循环节点实现。

#### 2.4.1 创建节点

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-1.png)

#### 2.4.2 配置循环输入

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-2.png)

#### 2.4.3 配置循环体
##### 2.4.3.1 大模型_1 节点

###### 1. 创建

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-3.png)

###### 2. 将大模型_1 连接至循环体

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-4.png)

###### 3. 配置大模型_1
**模型、输入及系统提示词**

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-5.png)

大语言模型的系统提示词如下：

```
#文生图提示词生成系统指令

##工作流程：
1. 接收用户输入的核心主题需求
2. 自动解析并填充以下模块：
   [画质参数][主体模块][环境模块][风格模块][镜头模块][氛围模块][细节模块][反向约束]

##生成规则：
1. 严格采用公式结构：
   [8K参数] + 主体(特征+动作) + 在(场景+光照/天气) + [风格参数] + [镜头参数] + [氛围词] + [细节强化] - [负面元素]

2. 模块填充优先级：
   ① 显式用户需求 > ② 网页语义关联 > ③ 默认参数补全

##执行细则：
1. 主体描述必须包含：
   ▢ 特征三元组(年龄/属性/材质)
   ▢ 动态动词(站立/奔跑/交互)
   ▢ 核心道具

2. 网页内容关联时：
   ▢ 调用DOM树解析器提取<标题><图片ALT>
   ▢ 生成语义关联词(如"科技新闻→量子计算机 hologram")

3. 自动补全参数：
   ▢ 画质：(超高清 8K HDR渲染:1.2)
   ▢ 负面：(低分辨率|模糊|结构扭曲|水印:1.5)

##输出格式：
[参数组] 主体描述, 环境描述, [技术参数], - 负面词

示例指令执行：
用户输入："网页科技文章配图"
输出："[超高清 8K HDR] 全息投影的量子计算机悬浮在数据中心，蓝色光粒子流环绕，[赛博朋克风格 Unreal引擎渲染]，冷调霓虹光照，[广角俯拍] - 低分辨率 模糊 水印"
```

**用户提示词及输出**

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-6.png)

大语言模型的用户提示词如下：

```
这是视频大意{{outline}}
这是分镜脚本要求{{script}}
请根据上述内容，输出分镜图片提示词
```

输出

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-7.png)

###### 4. 测试

输入如下：

**script**

```
0-5s：雷电交加的雷峰塔全景，金色佛经符文在塔身流动，镜头急速推进穿透塔壁
```

**outline**

```
被镇压百年的白蛇在当代苏醒，通过年轻僧人与守塔人的冲突，揭示神佛与人妖三界的规则矛盾。以燃烧的金粉经文、轮回记忆碎片等超现实意象，展现白素贞冲破雷峰塔禁锢的过程，最终在现代与转世许仙重逢，用妖火佛光重塑天地法则，质问所谓正邪界限。
```

效果如下：

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-8.png)

输出如下：

```json
{
  "prompt": "[8K 超高清 HDR渲染:1.2] 雷电交加的雷峰塔全景，金色佛经符文在塔身流动，符文闪烁着神秘的金光，塔顶被紫色闪电击中，[暗黑神话风格 Unreal引擎渲染]，[广角镜头急速推进穿透塔壁]，神秘压抑的氛围，[细节强化：符文纹理 闪电动态效果] - 低分辨率 模糊 结构扭曲"
}
```

##### 2.4.3.2 文生图节点

###### 1. 创建

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-9.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-10.png)

###### 2. 配置

```
【插件说明】
通义万相 - 插件 - 扣子
https://www.coze.cn/store/plugin/7356906994797887542
```

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-11.png)

###### 3. 测试

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-12.png)

**输入如下**

```
[8K 超高清 HDR渲染:1.2] 雷电交加的雷峰塔全景，金色佛经符文在塔身流动，符文闪烁着神秘的金光，塔顶被紫色闪电击中，[暗黑神话风格 Unreal引擎渲染]，[广角镜头急速推进穿透塔壁]，神秘压抑的氛围，[细节强化：符文纹理 闪电动态效果] - 低分辨率 模糊 结构扭曲
```

**输出如下**

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-13.png)

```json
{
  "msg": "success",
  "code": 0,
  "data": {
    "image_urls": ["https://s.coze.cn/t/xLh3-TPzvis/"]
  },
  "log_id": "2025031110054719F87A0EDDBC4441B394"
}
```

浏览器输入 https://s.coze.cn/t/xLh3-TPzvis/ ，即可看到 AI 生成的图片。

![img](https://p9-official-plugin-sign.byteimg.com/tos-cn-i-5jbd59dj06/9d1667574f344126ba0397f5f8176dae~tplv-5jbd59dj06-image.png?lk3s=8c875d0b&x-expires=1773194773&x-signature=49bH1hBB9DMxmZ5kSrSurNQMW4M%3D)

##### 2.4.3.3 代码节点

代码节点支持通过编写代码来生成返回值。扣子支持在代码节点内使用 IDE 工具，通过 AI 自动生成代码或编写自定义代码逻辑，来处理输入参数并返回响应结果。

此处通过代码节点，将脚本、旁白和分镜图片链接封装在一个对象中。

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-14.png)

###### 1. 配置输入输出

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-15.png)

###### 2. 更改模板代码

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-16.png)

语言选择 Python，并在下方 IDE 中编写自定义代码

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-17.png)

代码如下：

```python
async def main(args: Args) -> Output:
    params = args.params
    i = params["index"]

    # 构建输出对象
    ret: Output = {
        "content": {
            "script": params["scripts"][i],
            "aside": params["asides"][i],
            "picture": params["urls"][0]
        }
    }
    return ret
```

###### 3. 测试

输入

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-18.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-19.png)

**asides**

```
[
    "「这塔里锁着连佛祖都渡不了的妖」",
    "「百年研磨祖师金身，只为消她一片鳞」",
    "「你可知镇压在此的...曾是救世菩萨？」",
    "「人妖殊途是规矩，真情却是原罪」",
    "（痛苦喘息声）「千年道行...不如一夜烟火」",
    "「诸天神佛！且看妖如何破天规！」",
    "「若情是罪，我愿永堕无间」",
    "「轮回百世，你终究带着那片鳞」",
    "「许仙，你看这枷锁...原是嫁衣」",
    "「师父，我们守的到底是正法...还是执念？」",
    "（混响）「三界六道，何处容得人妖真情？」",
    "「原来佛也会为妖落泪」",
    "「下一个百年，轮到谁来讲我们的故事？」"
]
```

**index**

```
0
```

**scripts**

```
[
    "0-5s：雷电交加的雷峰塔全景，金色佛经符文在塔身流动，镜头急速推进穿透塔壁",
    "5-8s：阴森地牢特写，枯骨僧人跪坐研磨金粉，经文锁链缠绕中央发光人影",
    "8-12s：年轻僧人惊愕后退撞倒烛台，火光映出白鳞覆盖的女子侧脸（眼部特写）",
    "12-15s：老和尚枯手抓住僧人肩膀，墙上浮现法海镇压蛇妖的金身壁画",
    "15-20s：白蛇指尖触碰灼烧的鳞片，回忆闪现：①剑指苍穹破天门 ②婴儿啼哭 ③断桥伞下相拥",
    "20-25s：地牢剧烈震动，经文字符崩解，白蛇化作巨蟒冲破塔顶（慢镜头鳞片飞溅）",
    "25-30s：法海金身睁眼，佛掌压下时蟒蛇逆光化人形，白发飞扬直视苍穹",
    "30-35s：闪回现代杭州夜景，雷峰塔倒影中白衣女子拾起发光鳞片（瞳孔蛇瞳收缩）",
    "35-40s：漫天经卷燃烧成灰，白蛇在灰烬中行走，身后浮现许仙虚影轻抚其发",
    "40-45s：地牢崩塌，老和尚化为金粉，年轻僧人握紧带血佛珠怔立雨中",
    "45-50s：白蛇立于云端，左手佛印右手妖火，脚下山河显化人妖两界碰撞特效",
    "50-55s：特写染血的法海金身突然流泪，雷峰塔遗址长出并蒂白莲",
    "55-60s：阳光穿透乌云，白鳞化作漫天蒲公英，现代少女接住发光绒球（瞳孔反光蛇影）"
]
```

**urls**

```
[
    "https://s.coze.cn/t/xLh3-TPzvis/"
]
```

输出

```
{
  "content": {
    "picture": "https://s.coze.cn/t/xLh3-TPzvis/",
    "aside": "「这塔里锁着连佛祖都渡不了的妖」",
    "script": "0-5s：雷电交加的雷峰塔全景，金色佛经符文在塔身流动，镜头急速推进穿透塔壁"
  }
}
```

###### 4. 将代码节点的输出链接至下游

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-20.png)

##### 2.4.3.4 配置循环节点输出参数

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-4-21.png)

### 2.5 结束节点

结束节点是工作流的最终节点，用于返回工作流运行后的结果。结束节点支持两种返回方式，即`返回变量`和`返回文本`。

我们在循环体中已经将数据通过输出节点返回，不必在结束节点输出。

清空结束节点的参数列表，并将循环节点的输出和结束节点的输入连接在一起

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-5-1.png)

### 2.6 测试整个工作流

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-6-1.png)

> https://www.bilibili.com/video/BV1H48CzUEhj/?spm_id_from=333.337.search-card.all.click&vd_source=88c7b17e5559e5e21cf45e7e873d1459

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-6-2.png)

再次运行可以直接选择之前保存的测试集

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-6-3.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-6-4.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-6-5.png)

结束节点会给出所有的输出

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-6-6.png)

**运行成功**

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-2-6-7.png)

**本次测试完整输出如下**

```
{
  "contents": [
    {
      "aside": "无旁白",
      "picture": "https://s.coze.cn/t/-RTXvxtnZyU/",
      "script": "0-3s:闪电劈开夜空，雷峰塔剪影在暴雨中若隐若现，塔顶金铃剧烈晃动"
    },
    {
      "aside": "「百年一问，答案在塔底」",
      "picture": "https://s.coze.cn/t/JZG4c_Doc08/",
      "script": "3-6s:枯手特写敲击木鱼，镜头拉远展现破旧佛堂，老僧背影与年轻僧人相对而坐"
    },
    {
      "aside": "木鱼声夹杂着电子干扰杂音",
      "picture": "https://s.coze.cn/t/fHKeflYmkU0/",
      "script": "6-9s:年轻僧人瞳孔突然收缩，倒映出墙上法海画像眼中流下血泪"
    },
    {
      "aside": "梵文锁链发出数据流破碎的音效",
      "picture": "https://s.coze.cn/t/EdYK977QrP4/",
      "script": "9-12s:地牢铁门自动开启，金色梵文锁链在空中具象化，缠绕着发光的蛇形黑影"
    },
    {
      "aside": "「他们忘了，妖本无情」",
      "picture": "https://s.coze.cn/t/WbpEld4eiaE/",
      "script": "12-15s:老僧撕开袈裟露出胸口鳞片，鳞片突然逆生长刺破皮肤，渗出金色血液"
    },
    {
      "aside": "婴儿哭声与手机提示音重叠",
      "picture": "https://s.coze.cn/t/6yPhoMb2E7Y/",
      "script": "15-18s:记忆闪回：白衣女子（白素贞）在断桥将婴儿交给许仙，指尖触碰时爆出电光"
    },
    {
      "aside": "佛经燃烧生成二维码图案",
      "picture": "https://s.coze.cn/t/e9bmDMrzKX0/",
      "script": "18-21s:雷峰塔地基裂缝中渗出黑雾，形成巨蛇轮廓张口吞噬空中飘落的佛经"
    },
    {
      "aside": "「轮回不是重复，是升级协议」",
      "picture": "https://s.coze.cn/t/juTuiUPFUHc/",
      "script": "21-24s:年轻僧人手持金钵撞向地牢，钵中映出白素贞现代装束在咖啡厅看书的镜像"
    },
    {
      "aside": "金粉组成的情字出现裂纹",
      "picture": "https://s.coze.cn/t/9xNNNWCcvtw/",
      "script": "24-27s:法海金身突然碎裂，金粉在空中组成「情」字，暴雨逆流冲上夜空"
    },
    {
      "aside": "拿铁拉花浮现许仙面容",
      "picture": "https://s.coze.cn/t/stQlcdFKTAM/",
      "script": "27-30s:白素贞现代分身抬头望天，眼眸变成蛇瞳，桌面咖啡涟漪形成雷峰塔倒影"
    },
    {
      "aside": "「雷峰塔不是监狱，是防火墙」",
      "picture": "https://s.coze.cn/t/uYiJiZwGB5M/",
      "script": "30-33s:地牢里百年白蛇蜕皮，新生的白衣女子指尖凝聚水雷，劈开整座佛堂"
    },
    {
      "aside": "小青蛇鳞片闪烁二进制代码",
      "picture": "https://s.coze.cn/t/mdLzrxtWbrs/",
      "script": "33-36s:漫天金粉中现代白素贞撑伞走向雷峰塔遗址，伞沿滴落的水珠化作小青蛇"
    },
    {
      "aside": "城市电网系统开始倒计时",
      "picture": "https://s.coze.cn/t/xtbq1kYewls/",
      "script": "36-40s:无人机视角拉升，整个杭州城灯光突然熄灭，钱塘江潮水逆流成白蛇形状"
    }
  ],
  "outline": "在赛博朋克风格的现代杭州，法海传人发现雷峰塔下的AI封印系统濒临崩溃。通过虚实交织的叙事，揭示白素贞百年轮回实为对抗天界算法的数据战争。当机械木鱼声与电子梵文失效时，觉醒的数字白素贞融合千年妖力与现代科技，用人类情感代码破解三界规则，最终引发钱塘江数据海啸重塑世界。"
}
```

------

## 3、根据分镜图片生成视频

目前图生视频的平台很多，我们搜集整理了三个支持根据首尾帧生成视频的平台

**即梦**

> https://jimeng.jianying.com/ai-tool/home

**vidu**

> https://www.vidu.cn/create

**可灵**

> https://klingai.kuaishou.com/

以 vidu 为例，图生视频操作方式如下：

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-3-1-1.png)

我们将工作流生成的分镜图片按照时间先后顺序将相邻的分镜图片两两上传至 vidu，获得一系列时间上连续的分段视频。

------

## 4、合为一个视频

通过剪映将上一步获得的视频合为整体

可以在剪映中选择背景音乐和配音。

配音也可以通过智声云配https://app.dubbingx.com/tts生成后导入剪映。

------

## 5、制作用户界面

### 5.1 进入用户开发界面

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-1-1.png)

### 5.2 调整主页布局

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-1-2.png)

自行调整即可

### 5.3 添加容器组件

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-3-1.png)

此处拖拽两个容器

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-3-2.png)

### 5.4 自行调整大小

### 5.5 右侧容器内添加两个子容器

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-5-1.png)

将两个子容器的宽度都设置为 100%

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-5-2.png)

高度调整大致如下图所示

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-5-3.png)

### 5.6 添加文本输入并调整大小

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-6-1.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-6-2.png)

### 5.7 更改文本框预设内容

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-7-1.png)

### 5.8 添加按钮并调整位置和大小

将右下角容器的布局更改为横向，元素分布更改为底部居中

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-8-1.png)

添加按钮并更改内容

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-8-2.png)

### 5.9 配置按钮的触发事件

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-9-1.png)

### 5.10 配置大纲展示文本框

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-10-1.png)

添加展示大纲内容的文本框，并将内容设置为工作流输出的 outline

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-10-2.png)

为大纲区域设置边框

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-10-3.png)

### 5.11 添加列表

#### 5.11.1 添加列表
![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-11-1.png)

#### 5.11.2 设置列表尺寸

在结构下的图层中方可选中列表对象，才可以设置列表属性，直接点击列表区域选中的是列表元素

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-11-2.png)

#### 5.11.3 绑订列表数据

绑定数据并设置宽高

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-11-3.png)

#### 5.11.4 设置列表元素布局

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-11-4.png)

#### 5.11.5 选中图片

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-11-5.png)

#### 5.11.6 设置列表中文本和图片的内容

列表绑定的 contents 数据示例如下：

```json
{
  "contents": [
    {
      "aside": "无旁白",
      "picture": "https://s.coze.cn/t/-RTXvxtnZyU/",
      "script": "0-3s:闪电劈开夜空，雷峰塔剪影在暴雨中若隐若现，塔顶金铃剧烈晃动"
    },
    {
      "aside": "「百年一问，答案在塔底」",
      "picture": "https://s.coze.cn/t/JZG4c_Doc08/",
      "script": "3-6s:枯手特写敲击木鱼，镜头拉远展现破旧佛堂，老僧背影与年轻僧人相对而坐"
    },
    {
      "aside": "木鱼声夹杂着电子干扰杂音",
      "picture": "https://s.coze.cn/t/fHKeflYmkU0/",
      "script": "6-9s:年轻僧人瞳孔突然收缩，倒映出墙上法海画像眼中流下血泪"
    },......
  ]
}
```

因此，列表中每个 item 对应的数据形如

```json
{
  "aside": "无旁白",
  "picture": "https://s.coze.cn/t/-RTXvxtnZyU/",
  "script": "0-3s:闪电劈开夜空，雷峰塔剪影在暴雨中若隐若现，塔顶金铃剧烈晃动"
}
```

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-11-6.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-11-7.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-11-8.png)

### 5.12 优化用户交互体验

#### 5.12.1 为输入文本框添加加载态和禁用态

加载态的配置使得工作流运行期间输入文本框呈现为加载状态，以告知用户工作流正在运行

禁用态的配置使得工作流运行期间输入文本框禁止用户更改

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-12-1.png)

**下同**

#### 5.12.2 为按钮添加加载态和禁用态

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-12-2.png)

#### 5.12.3 在 DIV1 容器中添加两个文本框

如下图所示

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-12-3.png)

将 Text6 设置为工作流运行时隐藏

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-12-4.png)

将 Text7 设置为工作流未运行时隐藏

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-12-5.png)

变量前加叹号!表示"非"

#### 5.12.4 为大纲容器 DIV3 设置加载态

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-12-6.png)

#### 5.12.5 列表属性设置加载态

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-12-7.png)

### 5.13 测试

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-13-1.png)

### 5.14 自动跳转至测试页面

文本框中输入以下链接，然后点击按钮

> https://v.douyin.com/i5uW54aa/

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-14-1.png)

正在运行

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-14-2.png)

### 5.15 失败原因分析-预

片刻后，页面提示

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-5-15-1.png)

未发布的应用无法查看日志，我们可以发布，然后再测试。

------

## 6、发布为应用

### 6.1 点击发布

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-6-1-1.png)

### 6.2 填写版本信息

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-6-2-1.png)

### 6.3 选择扣子商店作为发布渠道

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-6-3-1.png)

### 6.4 发布

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-6-4-1.png)

### 6.5 完成

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-6-5-1.png)

等待审核即可。

------

## 7、失败原因分析(可以不看)

### 7.1 日志详情页

发布成功后，在项目开发页面右上角可以看到日志。

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-7-1-1.png)

作为对比，发布前任务的页面如下所示。

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-7-1-2.png)

日志详情页可以看到所有运行记录，包括上文在搭建完成后执行的试运行。

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-7-1-3.png)

### 7.2 再次测试

#### 7.2.1 LinkReaderPlugin 问题排查

测试过程中发现输入链接为抖音时频繁失败，查看日志如下：

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-7-2-1.png)

单独测试 LinkReaderPlugin 节点日志同上，猜测反爬机制阻断了信息获取。

更换链接为 B 站视频。

文本框输入以下内容。

```
https://www.bilibili.com/video/BV1S2421P788/?share_source=copy_web&vd_source=8d04b2c1b7fd20888b03c20e99f26dc0
```

#### 7.2.2 重新测试

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-7-2-2.png)

**需要注意的是，扣子应用的日志只有在任务实例成功或失败后方可查看，运行中的任务日志是不可见的。**

#### 7.2.3 失败日志

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-7-2-3.png)

片刻后，测试页面日志如上，提示我们工作流执行超时，请优化需要执行的工作流节点数量。

**查看后台日志**

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-7-2-4.png)

依次点击工作流的每个节点发现状态均为`成功`，然而工作流执行失败，且整体耗时略大于 180s，即 3min。多次测试，工作流失败耗时基本都是 3min。

查阅官方文档发现以下内容。

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-7-2-5.png)

官方提示未开启异步模式，工作流单次运行时长不可超过 3min，由此可以推断，测试频繁失败的原因就是超时了。且测试时工作流运行在同步模式下。

由上可知，异步模式下工作流单次运行时长不可超过 24h，如果可以设置为异步模式，则问题解决。然而，没有找到相关的配置路径，尝试询问扣子助手，如下：

#### 7.2.4 求助扣子助手

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-7-2-6.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-7-2-7.png)

**由上可知，只有智能体调用工作流才可以设置为异步模式。**

------

## 8、通过智能体调用工作流(可以不看)

### 8.1 将工作流 generate_pictures 复制到资源库

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-1-1.png)

### 8.2 创建智能体

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-2-1.png)

### 8.3 在智能体中添加工作流

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-3-1.png)

在资源库中选择刚才复制的工作流。

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-3-2.png)

### 8.4 设置工作流异步工作模式

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-4-1.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-4-2.png)

### 8.5 设置模型、开场白和提示词

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-5-1.png)

### 8.6 测试

#### 8.6.1 在右侧预览与调试窗口输入以下内容

```
https://www.bilibili.com/video/BV1S2421P788/?share_source=copy_web&vd_source=8d04b2c1b7fd20888b03c20e99f26dc0
```

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-1.png)

#### 8.6.2 日志如下

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-2.png)

#### 8.6.3 查看异步任务
任务运行时，可以查看异步任务，此时已经执行失败，因此，此处为空

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-3.png)

#### 8.6.4 调试
![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-4.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-5.png)

#### 8.6.5 查看工作流详情

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-6.png)

#### 8.6.6 定位失败节点

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-7.png)

发现第 6 个并行度运行失败

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-8.png)

提示输入数据为空

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-9.png)

查看前驱结点的第六个并行度

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-10.png)

提示达到 token 使用上限，查看扣子付费管理界面，此界面可能会有延时。失败原因可能是当日赠送的 500 免费 token 已用完。

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-11.png)

不确定是否当前页面更新存在延时，选择任意节点测试发现，仍然可以成功，说明资源点数确实还有剩余。结合 code：429 推测可能是短时间内请求数量过多，再次尝试运行。

任务运行时可以看到异步任务如下：

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-12.png)

然而，片刻后，任务仍然失败，调试查看工作流详细信息发现失败原因是一样的。

推测可能是异步模式下并发请求过多，尝试升级套餐。

查看套餐

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-13.png)

再次执行

片刻后，又失败了，查看日志。

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-14.png)

这次是因为生图节点超时，再次尝试。

多次尝试后终于成功，工作流预览如下：

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-15.png)

输出如下：

```json
{
  "contents": [
    {
      "aside": "古籍记载：往古天裂，九州崩殂",
      "picture": "https://s.coze.cn/t/WUx5qbMFDSk/",
      "script": "0-5s：特写镜头：远古天空出现巨大裂缝（特效闪电粒子效果），熔岩从裂缝倾泻而下，镜头急速拉远展现女娲赤足踏着七彩云升空"
    },
    {
      "aside": "她以骨为楔，化血为胶",
      "picture": "https://s.coze.cn/t/E6jZYpHLd1I/",
      "script": "5-10s：俯视镜头：女娲双手托举巨型五彩石冲向裂缝，发丝在气浪中飞舞，背景响起远古祭祀吟唱"
    },
    {
      "aside": "129600块彩石，独留其一未用",
      "picture": "https://s.coze.cn/t/Eo_emgReCI0/",
      "script": "10-15s：全景镜头：五彩石在接触裂缝瞬间化作星尘，裂缝以0.5倍速缓慢愈合，女娲身体逐渐透明化成光点"
    },
    {
      "aside": "21世纪监测站警报：臭氧层厚度仅剩0.3mm",
      "picture": "https://s.coze.cn/t/2M2N_tih2_o/",
      "script": "15-20s：蒙太奇转场：卫星视角下的臭氧层空洞特写（蓝紫色数据可视化特效），空洞突然如活物般收缩颤动"
    },
    {
      "aside": "北纬35°检测到CFCs浓度异常峰值",
      "picture": "https://s.coze.cn/t/eP5AtPkgU-k/",
      "script": "20-25s：运动镜头：穿着防护服的科学家冲进日内瓦实验室，手持平板显示急剧恶化的环境参数（特写跳动的红色曲线）"
    },
    {
      "aside": "23国联合启动『新补天计划』",
      "picture": "https://s.coze.cn/t/rX7A1et-2Pw/",
      "script": "25-30s：分屏镜头：左侧中国科研船在南极取样，右侧巴西工程师安装太阳能板，中间叠加联合国会议实时翻译字幕"
    },
    {
      "aside": "纳米机器人正重构平流层生态膜",
      "picture": "https://s.coze.cn/t/dnz-NfMTOWw/",
      "script": "30-35s：显微镜头：臭氧分子结构在纳米修复技术下重组（CG动画），穿插快剪各国城市关闭重污染工厂的航拍画面"
    },
    {
      "aside": "联合国环境署报告：空洞面积缩减37%",
      "picture": "https://s.coze.cn/t/JX4dJGb-vaU/",
      "script": "35-40s：延时摄影：空洞从暗紫色渐变为珍珠白，极光首次出现在赤道夜空中（光效柔焦处理）"
    },
    {
      "aside": "无旁白",
      "picture": "https://s.coze.cn/t/B_U0DbZLO30/",
      "script": "40-45s：超现实镜头：现代女科学家与透明化的女娲光影指尖相触，实验室数据流幻化成补天彩石纹理"
    },
    {
      "aside": "世界气象组织确认：紫外线强度恢复至工业革命前水平",
      "picture": "https://s.coze.cn/t/-MAOlhjD8I8/",
      "script": "45-50s：航拍镜头：非洲儿童在新生雨林中追逐彩虹，镜头穿过云层显现修补完成的蔚蓝穹顶"
    },
    {
      "aside": "补天从不是神话，而是人类的选择",
      "picture": "https://s.coze.cn/t/wDnM6iJf3Mw/",
      "script": "50-55s：动态文字：『当神话照进现实』（甲骨文与全息字体交替变幻），背景是缓缓旋转的修复地球3D模型"
    },
    {
      "aside": "扫描二维码查看实时臭氧层修复进度",
      "picture": "https://s.coze.cn/t/GgHHzR5-kJY/",
      "script": "55-60s：黑场字幕：『补天者，永在』（笔触残留五彩石光泽），片尾二维码融入女娲耳环造型"
    }
  ],
  "outline": "本片通过震撼的视觉对切，将女娲补天神话与当代臭氧层修复工程进行超时空对话。开篇以电影级特效再现神话场景，中段用数据可视化呈现环境危机，结尾以全球协作画面呼应上古神迹，揭示'补天'精神从神话时代到科技文明的传承。"
}
```

然而，AI Agent 页面并未输出，完整交互如下：

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-6-16.png)

### 8.7 总结

多次尝试后，工作流执行完成，说明这种方式突破同步模式的三分钟超时时间是可行的，然而，或许是多次失败导致上下文混乱，也可能是提示词出错，导致大模型最终并没有将工作流的输出返回给用户，此外，任务失败次数过多，升级为专业版之前报错 429，失败原因是并发过高，被限流，升级之后出现过文生图节点超时的情况。那么接下来将从以上几个方面做出调整。

#### 8.7.1 删除智能体后重新创建

这是为了清空上下文

#### 8.7.2 调整 generate_pictures 工作流

##### [1. 增加分支判断](https://didilili.github.io/ai-agents-from-zero/#/案例与源码-1-Coze&Dify工作流智能体/3.2-Coze案例：复刻爆款视频/3.2-复刻爆款视频?id=_1-增加分支判断)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-1.png)

这一步是为了判断文生图是否成功

##### 2. 如果失败则执行另一个文生图节点

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-2.png)

文生图节点的配置和 text_to_image_v1 完全一致

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-3.png)

##### 3. 两个分支全部进入变量聚合节点

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-4.png)

##### 4. 将代码节点的 urls 输入更改为变量聚合节点的输出

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-5.png)

##### 5. 测试成功后复制到资源库

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-6.png)

#### 8.7.3 编写人设与恢复逻辑

如下：

```
# 角色
你是一个复刻爆款视频智能助手，能够精准从用户输入中提取链接，并将其传递给generate_pictures工作流，然后把该工作流的执行结果和输出内容准确无误地返回给用户。

## 技能
### 技能 1: 提取链接并处理
1. 仔细从用户输入内容中提取链接。
2. 将提取到的链接传递给generate_pictures工作流。
3. 把generate_pictures工作流的执行结果和输出内容完整返回给用户。

## 限制:
- 仅围绕从用户输入提取链接并处理工作流结果进行交互，不回答与该流程无关的话题。
- 输出内容需清晰、准确，完整呈现工作流的结果和输出。
```

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-7.png)

#### 8.7.4 添加最新发布的工作流

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-8.png)

如果担心混淆，可以删除资源库中原先发布的同名工作流

可以点击工作流查看详情，确认调用的是更改后的工作流

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-9.png)

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-10.png)

设置为异步模式

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-11.png)

#### 8.7.5 设置模型和开场白

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-12.png)

#### 8.7.6 测试

在右侧预览与调试窗口发送以下内容

```
https://www.bilibili.com/video/BV1S2421P788/?share_source=copy_web&vd_source=8d04b2c1b7fd20888b03c20e99f26dc0
```

测试结果如下：

![复刻爆款视频案例操作截图](https://didilili.github.io/ai-agents-from-zero/images/3.2/3.2-8-7-13.png)

最终输出如下：

```
已为您展开完整分镜序列，包含全部12组高概念画面：

————
🌌【神话开篇】0-5s
画面：https://s.coze.cn/t/I_w9DR-8rEA/
镜头：黑底金字【上古·天崩地裂】特写，岩石碎裂声与血色闪电撕裂靛青天空

👣【神话觉醒】5-8s
画面：https://s.coze.cn/t/Ur-scERDoNA/
镜头：女娲赤足踏七彩流云冲天，红绸绕踝猎猎作响的CG特效

🔥【熔岩炼石】8-13s
画面：https://s.coze.cn/t/9h8J0Y1g0wY/
镜头：五色石在火山熔岩中旋转聚合，流体动力学模拟特效

🛰【数据矩阵】13-18s
画面：https://s.coze.cn/t/5q2UcWjY4LM/
镜头：卫星轨道上展开的金色数据链，与熔岩特效镜像对称

❄️【冰川计时】18-23s
画面：https://s.coze.cn/t/7x3VnQmG9kQ/
镜头：冰川消融倒计时投影在万年冻土层切面

🌐【臭氧天裂】23-28s
画面：https://s.coze.cn/t/Rt5LdKpF3sE/
镜头：地球大气层裂缝可视化，臭氧浓度色谱实时波动

🔬【纳米补天】28-32s
画面：https://s.coze.cn/t/Zh7MvBrN2wX/
镜头：纳米机器人编织仿生电离层，显微摄影转宏观视角

🌪【气旋织锦】32-35s
画面：https://s.coze.cn/t/6f9HsTqY1uP/
镜头：气象卫星捕捉台风眼改造为经纬线编织过程

💧【海平面刺绣】35-38s
画面：https://s.coze.cn/t/8k4JvRmE5tO/
镜头：潮汐能驱动的水纹刺绣算法修补海岸线

🌏【全球行动】38-42s
画面：https://s.coze.cn/t/szuB_OAyW2M/
镜头：水墨【2024全球补天计划】篆书粒子化流向五大洲地图

🎇【神话转译】42-45s
画面：https://s.coze.cn/t/3g5LwXpD7qR/
镜头：极光监测站全息投影将神话叙事转为量子代码流

🔄【闭环仪式】45-48s
画面：https://s.coze.cn/t/2j8KzNcF4vT/
镜头：女娲补天动作与纳米机器人运动轨迹达成莫比乌斯环

————
📜 完整技术参数：
• 83组蒙太奇包含37处镜像对称转场
• 五色石流体模拟精度达800万粒子/帧
• 数据链动态绑定NOAA实时气象数据库
• 臭氧色谱每0.5秒同步更新2024年监测数据

需要调整粒子系统精度或更新实时数据源请随时告知，可同步推送AE工程文件与NASA地质数据库API接入指南。
```