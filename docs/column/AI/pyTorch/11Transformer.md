---
date: 2026年06月05日
---

# Transformer 模型

Transformer 是一种基于注意力机制的深度学习模型，最初由 Vaswani 等人在 2017 年的论文《Attention is All You Need》中提出。

它彻底改变了自然语言处理（NLP）领域，并逐渐扩展到计算机视觉等几乎所有 AI 方向。

> Transformer 的核心思想是完全放弃传统的逐词处理方式（RNN），改用注意力机制让模型一次性看完整个句子，同时判断每个词与其他词的关系，从而实现更快的训练和更强的理解能力。

------

## 为什么需要 Transformer？

在 Transformer 出现之前，NLP 领域主要依赖 RNN（循环神经网络）系列模型（如 LSTM、GRU），它们按顺序处理文本，存在两个关键缺陷。

### RNN 的局限性

RNN 像人类"逐字阅读"一样处理文本，这带来了以下问题：

- **梯度消失：**处理长文本时，模型会"忘记"较早的信息。例如"我昨天在图书馆借了一本关于量子物理的书"中，读到"书"时早已忘记"我"是主语，长距离依赖极难捕捉。
- **无法并行：**RNN 必须按顺序处理每一个词，无法利用 GPU 的并行计算能力，训练超长文本时速度极慢。

### Transformer 的解决方案

通过自注意力机制，模型同时处理所有词，并动态计算每对词之间的关联强度，彻底解决了上述两个问题。

```html
<style>
.rnn-transformer-diagram {
    font-family: system-ui, -apple-system, sans-serif;
    background: #222;
    color: #eee;
    padding: 20px;
    border-radius: 0px;
    max-width: 1200px;
    margin: 0 auto;
}
.main-title {
    text-align: center;
    font-size: 20px;
    color: #aaa;
    margin-top: 20px;
}
.row {
    display: flex;
    gap: 30px;
    margin-bottom: 30px;
}
.col {
    flex: 1;
    padding: 20px;
    border: 2px solid;
    border-radius: 0px;
    position: relative;
}
.col.rnn {
    border-color: #b33951;
}
.col.transformer {
    border-color: #4dabf7;
}
.title {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 30px;
}
.title.rnn {
    color: #b33951;
}
.title.transformer {
    color: #4dabf7;
}
.subtitle {
    text-align: center;
    font-size: 18px;
    color: #aaa;
    margin-bottom: 30px;
}
.rnn-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 20px;
}
.rnn-node {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    background: #ffc9c9;
    border: 2px solid #b33951;
    color: #b33951;
    position: relative;
}
.rnn-word {
    width: 100px;
    height: 60px;
    border: 2px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin-top: 10px;
}
.rnn-word.highlight {
    border-color: #b33951;
    background: #ffe8e8;
    color: #b33951;
}
.rnn-arrow {
    width: 60px;
    height: 2px;
    background: #b33951;
    position: relative;
}
.rnn-arrow::after {
    content: '';
    position: absolute;
    right: 0;
    top: -6px;
    border: 6px solid transparent;
    border-left-color: #b33951;
}
.rnn-arrow.dashed {
    background: transparent;
    border-top: 2px dashed #b33951;
}
.rnn-arrow.dashed::after {
    border-left-color: #b33951;
}
.rnn-note {
    text-align: center;
    font-size: 20px;
    color: #aaa;
    margin-top: 30px;
}
.transformer-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
}
.transformer-word {
    width: 100px;
    height: 60px;
    border: 2px solid #4dabf7;
    background: #e7f5ff;
    color: #4dabf7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
}
.attn-node {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #cce7ff;
    border: 2px solid #4dabf7;
    color: #4dabf7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    position: absolute;
    top: -40px;
    right: 0;
}
.attn-line {
    position: absolute;
    background: #4dabf7;
    height: 2px;
}
.attn-line.w1 { width: 200px; top: 20px; left: 100px; }
.attn-line.w2 { width: 160px; top: 30px; left: 180px; }
.attn-line.w3 { width: 120px; top: 40px; left: 260px; }
.attn-line.w4 { width: 80px; top: 50px; left: 340px; }
.attn-line.w5 { width: 40px; top: 60px; left: 420px; }
.attn-label {
    position: absolute;
    color: #aaa;
    font-size: 20px;
}
.attn-label.l1 { top: 0; left: 80px; color: #aaa; }
.attn-label.l2 { top: 10px; left: 160px; color: #aaa; }
.attn-label.l3 { top: 20px; left: 240px; color: #aaa; }
.attn-label.l4 { top: 30px; left: 320px; color: #4dabf7; }
</style>

<div class="rnn-transformer-diagram">
    <div class="row">
        <!-- 左边 RNN -->
        <div class="col rnn">
            <div class="title rnn">RNN 顺序处理（慢，遗忘远距离关系）</div>

            <div class="rnn-container">
                <div>
                    <div class="rnn-node">h1</div>
                    <div class="rnn-word">我</div>
                </div>
                <div class="rnn-arrow"></div>
                <div>
                    <div class="rnn-node">h2</div>
                    <div class="rnn-word">爱</div>
                </div>
                <div class="rnn-arrow"></div>
                <div>
                    <div class="rnn-node">h3</div>
                    <div class="rnn-word">学习</div>
                </div>
                <div class="rnn-arrow"></div>
                <div>
                    <div class="rnn-node">h4</div>
                    <div class="rnn-word">深度</div>
                </div>
                <div class="rnn-arrow dashed"></div>
                <div>
                    <div class="rnn-node">h5</div>
                    <div class="rnn-word highlight">学习</div>
                </div>
            </div>

            <div class="rnn-note">必须等 h1→h2→h3→h4 才能算 h5</div>
        </div>

        <!-- 右边 Transformer -->
        <div class="col transformer">
            <div class="title transformer">Transformer 并行处理（快，全局关注）</div>
            <div class="subtitle">所有词同时计算，线粗细=注意力权重</div>

            <div class="transformer-container">
                <div class="attn-node">attn</div>

                <div class="attn-line w1"></div>
                <div class="attn-line w2"></div>
                <div class="attn-line w3"></div>
                <div class="attn-line w4"></div>
                <div class="attn-line w5"></div>

                <div class="attn-label l1">0.05</div>
                <div class="attn-label l2">0.1</div>
                <div class="attn-label l3">0.25</div>
                <div class="attn-label l4">0.6</div>

                <div class="transformer-word">我</div>
                <div class="transformer-word">爱</div>
                <div class="transformer-word">学习</div>
                <div class="transformer-word">深度</div>
                <div class="transformer-word">学习</div>
            </div>
        </div>
    </div>

    <div class="main-title">RNN 顺序处理 vs Transformer 并行 + 全局注意力对比</div>
</div>
```

RNN 顺序处理 vs Transformer 并行 + 全局注意力对比

------

## Transformer 整体架构

Transformer 由编码器（Encoder）和解码器（Decoder）两大部分组成，各自由多层相同模块堆叠而成。

> 类比理解：编码器好比"读书人"，把输入的中文句子理解为一组富含语义的向量；解码器好比"翻译官"，参考这些向量，一个词一个词地生成英文输出。

以下是 Transformer 架构图，左边为编码器，右边为解码器。

![img](https://www.runoob.com/wp-content/uploads/2025/03/Transformer_full_architecture.png)

```html
<style>
.transformer-diagram {
    font-family: system-ui, -apple-system, sans-serif;
    background: #222;
    color: #eee;
    padding: 20px;
    border-radius: 0px;
    max-width: 1200px;
    margin: 0 auto;
}
.row {
    display: flex;
    gap: 40px;
    margin-bottom: 30px;
}
.col {
    flex: 1;
    border: 2px solid;
    border-radius: 0px;
    padding: 20px;
    position: relative;
}
.col.encoder {
    border-color: #4dabf7;
}
.col.decoder {
    border-color: #be4bdb;
}
.col-title {
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
}
.col-title.encoder {
    color: #4dabf7;
}
.col-title.decoder {
    color: #be4bdb;
}
.block-group {
    border: 1px solid;
    border-radius: 0px;
    padding: 15px;
    margin-bottom: 20px;
}
.block-group.encoder {
    border-color: #4dabf7;
}
.block-group.decoder {
    border-color: #be4bdb;
}
.block-group .layer-count {
    text-align: right;
    color: #aaa;
    font-size: 14px;
    margin-bottom: 10px;
}
.block {
    padding: 12px;
    margin: 8px 0;
    text-align: center;
    border: 1px solid;
    border-radius: 0px;
}
.block.blue {
    border-color: #4dabf7;
    color: #4dabf7;
}
.block.green {
    border-color: #51cf66;
    color: #51cf66;
    background: rgba(81, 207, 102, 0.1);
}
.block.purple {
    border-color: #be4bdb;
    color: #be4bdb;
}
.block.orange {
    border-color: #f59f00;
    color: #fff;
    background: #8b5a2b;
}
.block.white {
    border-color: #ccc;
    color: #ccc;
}
.encoder-dashed-arrow {
    width: 2px;
    height: 80px;
    background: transparent;
    border-left: 2px dashed #4dabf7;
    margin: 0 auto;
    position: relative;
}
.encoder-dashed-arrow::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: -6px;
    border: 6px solid transparent;
    border-top-color: #4dabf7;
}
.cross-attention-arrow {
    position: absolute;
    top: 220px;
    left: 50%;
    width: 200px;
    height: 2px;
    background: #f59f00;
    transform: translateX(-50%);
}
.cross-attention-arrow::after {
    content: '';
    position: absolute;
    right: 0;
    top: -6px;
    border: 6px solid transparent;
    border-left-color: #f59f00;
}
.cross-attention-label {
    position: absolute;
    top: 200px;
    left: 50%;
    transform: translateX(-50%);
    color: #f59f00;
    font-size: 14px;
}
.decoder-arrow {
    width: 2px;
    height: 40px;
    background: #be4bdb;
    margin: 0 auto;
    position: relative;
}
.decoder-arrow::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: -6px;
    border: 6px solid transparent;
    border-top-color: #be4bdb;
}
.footer-note {
    text-align: center;
    font-size: 18px;
    color: #aaa;
    margin-top: 30px;
}
</style>

<div class="transformer-diagram">
    <div class="row">
        <!-- 编码器 Encoder -->
        <div class="col encoder">
            <div class="col-title encoder">编码器 Encoder</div>

            <div class="block-group encoder">
                <div class="layer-count">× N 层</div>
                <div class="block blue">多头自注意力</div>
                <div class="block green">Add & Norm（残差 + 归一化）</div>
                <div class="block blue">前馈神经网络</div>
                <div class="block green">Add & Norm（残差 + 归一化）</div>
            </div>

            <div class="encoder-dashed-arrow"></div>

            <div class="block green">位置编码（Positional Encoding）</div>
            <div class="block white">词嵌入（Input Embedding）</div>
            <div style="text-align: center; margin-top: 15px; color: #aaa;">输入：我 爱 学习</div>
        </div>

        <!-- 解码器 Decoder -->
        <div class="col decoder">
            <div class="col-title decoder">解码器 Decoder</div>

            <div class="block-group decoder">
                <div class="layer-count">× N 层</div>
                <div class="block purple">掩码多头自注意力<br>(Masked Multi-Head Attention)</div>
                <div class="block green">Add & Norm</div>
                <div class="block orange">编码器-解码器注意力<br>(Cross-Attention)</div>
                <div class="block green">Add & Norm</div>
                <div class="block purple">前馈神经网络（Feed-Forward）</div>
            </div>

            <div class="decoder-arrow"></div>

            <div class="block white">线性层 + Softmax</div>
            <div style="text-align: center; margin-top: 10px; color: #f59f00;">输出概率分布</div>

            <div class="block green" style="margin-top: 20px;">位置编码（Positional Encoding）</div>
            <div class="block white">词嵌入（Output Embedding）</div>
            <div style="text-align: center; margin-top: 15px; color: #aaa;">输出：I Love Learning</div>
        </div>

        <!-- Cross-Attention 箭头 -->
        <div class="cross-attention-arrow"></div>
        <div class="cross-attention-label">K, V</div>
    </div>

    <div class="footer-note">Transformer 编码器 + 解码器完整架构（橙色箭头为 Cross-Attention 信息流）</div>
</div>
```

Transformer 编码器 + 解码器完整架构（虚线箭头为 Cross-Attention 信息流）

Transformer 模型由 编码器（Encoder） 和 解码器（Decoder） 两部分组成，每部分都由多层堆叠的相同模块构成。

![img](https://www.runoob.com/wp-content/uploads/2025/03/runoob-transformer-1.png)

### 编码器（Encoder）

编码器由 NN 层相同的模块堆叠而成，每层包含两个子层：

- **多头自注意力机制（Multi-Head Self-Attention）：**计算输入序列中每个词与其他词的相关性。
- **前馈神经网络（Feed-Forward Neural Network）：**对每个词进行独立的非线性变换。

每个子层后面都接有 残差连接（Residual Connection） 和 层归一化（Layer Normalization）。

### 解码器（Decoder）

解码器也由 NN 层相同的模块堆叠而成，每层包含三个子层：

- **掩码多头自注意力机制（Masked Multi-Head Self-Attention）：**计算输出序列中每个词与前面词的相关性（使用掩码防止未来信息泄露）。
- **编码器-解码器注意力机制（Encoder-Decoder Attention）：**计算输出序列与输入序列的相关性。
- **前馈神经网络（Feed-Forward Neural Network）：**对每个词进行独立的非线性变换。

同样，每个子层后面都接有残差连接和层归一化。

在 Transformer 模型出现之前，NLP 领域的主流模型是基于 RNN 的架构，如长短期记忆网络（LSTM）和门控循环单元（GRU）。这些模型通过顺序处理输入数据来捕捉序列中的依赖关系，但存在以下问题：

1. **梯度消失问题**：长距离依赖关系难以捕捉。
2. **顺序计算的局限性**：无法充分利用现代硬件的并行计算能力，训练效率低下。

![img](https://www.runoob.com/wp-content/uploads/2025/03/Multi-Layer_Neural_Network-Vector-Blank.svg)

Transformer 通过引入自注意力机制解决了这些问题，允许模型同时处理整个输入序列，并动态地为序列中的每个位置分配不同的权重。

------

## 核心：自注意力机制

自注意力机制是 Transformer 最重要的组件，它回答一个问题："处理这个词时，我应该重点关注句子中的哪些其他词？"

### Q、K、V 是什么？

每个词的向量会被线性变换成三个角色：Query（查询）、Key（键）、Value（值）。

```html
<style>
.attention-diagram {
    font-family: system-ui, -apple-system, sans-serif;
    background: #222;
    color: #eee;
    padding: 30px;
    border-radius: 0px;
    max-width: 1200px;
    margin: 0 auto;
}
.diagram-container {
    position: relative;
    width: 100%;
    height: 400px;
}
.node {
    position: absolute;
    padding: 20px 30px;
    text-align: center;
    font-weight: bold;
    border: 2px solid;
    border-radius: 0px;
    background: transparent;
}
.node.x {
    top: 180px;
    left: 20px;
    border-color: #4dabf7;
    color: #eee;
}
.node.q {
    top: 40px;
    left: 300px;
    border-color: #4dabf7;
    color: #4dabf7;
}
.node.k {
    top: 160px;
    left: 300px;
    border-color: #be4bdb;
    color: #be4bdb;
}
.node.v {
    top: 280px;
    left: 300px;
    border-color: #51cf66;
    color: #51cf66;
    background: rgba(81, 207, 102, 0.15);
}
.node.score {
    top: 160px;
    left: 550px;
    border-color: #f59f00;
    color: #fff;
    background: rgba(245, 159, 0, 0.3);
}
.node.softmax {
    top: 160px;
    left: 800px;
    border-color: #4dabf7;
    color: #4dabf7;
}
.node.attn {
    top: 160px;
    right: 20px;
    border-color: #51cf66;
    color: #51cf66;
    background: rgba(81, 207, 102, 0.15);
}
.label {
    position: absolute;
    color: #aaa;
    font-size: 18px;
}
.label.q-title {
    top: 0;
    left: 300px;
    color: #4dabf7;
}
.label.k-title {
    top: 120px;
    left: 300px;
    color: #be4bdb;
}
.label.v-title {
    top: 240px;
    left: 300px;
    color: #51cf66;
}
.label.xwq {
    top: 80px;
    left: 150px;
}
.label.xwk {
    top: 180px;
    left: 150px;
}
.label.xwv {
    top: 280px;
    left: 150px;
}
.label.vmul {
    top: 260px;
    left: 650px;
    color: #51cf66;
}
.footer {
    text-align: center;
    margin-top: 40px;
    color: #aaa;
    font-size: 20px;
}
/* 箭头 */
.arrow {
    position: absolute;
    background-color: #4dabf7;
    height: 2px;
    z-index: 1;
}
.arrow.q-line {
    top: 100px;
    left: 100px;
    width: 180px;
    transform: rotate(-30deg);
}
.arrow.k-line {
    top: 180px;
    left: 100px;
    width: 180px;
}
.arrow.v-line {
    top: 280px;
    left: 100px;
    width: 180px;
    transform: rotate(30deg);
}
.arrow.qk-line {
    top: 120px;
    left: 450px;
    width: 100px;
    transform: rotate(30deg);
    background-color: #be4bdb;
}
.arrow.score-line {
    top: 160px;
    left: 700px;
    width: 100px;
    background-color: #4dabf7;
}
.arrow.vmul-line {
    top: 280px;
    left: 450px;
    width: 350px;
    background-color: #51cf66;
}
.arrow.attn-line {
    top: 160px;
    left: 900px;
    width: 100px;
    background-color: #51cf66;
}
/* 箭头三角形 */
.arrow::after {
    content: '';
    position: absolute;
    right: 0;
    top: -6px;
    border: 6px solid transparent;
    border-left-color: inherit;
}
</style>

<div class="attention-diagram">
    <div class="diagram-container">
        <!-- 节点 -->
        <div class="node x">词向量 x</div>
        <div class="node q">Q</div>
        <div class="node k">K</div>
        <div class="node v">V</div>
        <div class="node score">Q·K^T / sqrt(dk)<br>（相似度得分）</div>
        <div class="node softmax">softmax</div>
        <div class="node attn">输出<br>Attn</div>

        <!-- 标签 -->
        <div class="label q-title">Query（我要查什么？）</div>
        <div class="label k-title">Key（我能匹配什么？）</div>
        <div class="label v-title">Value（我提供什么信息？）</div>
        <div class="label xwq">xWq</div>
        <div class="label xwk">xWk</div>
        <div class="label xwv">xWv</div>
        <div class="label vmul">× V</div>

        <!-- 箭头 -->
        <div class="arrow q-line"></div>
        <div class="arrow k-line"></div>
        <div class="arrow v-line"></div>
        <div class="arrow qk-line" style="color:#be4bdb"></div>
        <div class="arrow score-line"></div>
        <div class="arrow vmul-line" style="color:#51cf66"></div>
        <div class="arrow attn-line" style="color:#51cf66"></div>
    </div>

    <div class="footer">数学公式：Attention(Q,K,V) = softmax(QK^T/sqrt(dk))·V</div>
    <div class="footer" style="margin-top:20px; font-size:18px;">Q、K、V 的来源与注意力计算流程</div>
</div>
```

Q、K、V 的来源与注意力计算流程

> 用搜索引擎类比理解 Q/K/V：
>
> Q（Query）= 你在搜索框里输入的关键词，代表"我要查什么？"
>
> K（Key）= 每个网页的标题标签，代表"我能匹配哪些词？"
>
> V（Value）= 每个网页的实际内容，代表"我能提供什么信息？"
>
> 注意力权重 = Q 与每个 K 的相似度，最终结果 = 用权重对所有 V 加权求和。

### 注意力公式

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

其中：

- Q 是查询矩阵，K 是键矩阵，V 是值矩阵。
- dk 是向量的维度，用于缩放点积，防止梯度爆炸。
- softmax 将原始得分转为 0~1 之间的概率分布（权重之和为 1）

### 多头注意力（Multi-Head Attention）

单一注意力视角有限，就像只用一种角度看问题。

多头注意力将输入分成 h 个子空间，每个"头"独立学习不同的关注模式，最后拼接结果。

![img](https://www.runoob.com/wp-content/uploads/2025/03/Multi-Head-Attention-runoob.png)

------

## 位置编码（Positional Encoding）

Transformer 同时处理所有词，天然没有"顺序感"——"猫吃鱼"和"鱼吃猫"会被当成一样的。

位置编码就是给每个词加上"座位号"，告诉模型各词在句子中的位置。

> 类比：就像考试时在试卷上标"第1题、第2题"，位置编码让 Transformer 知道"我"是第1个词，"爱"是第2个词。

由于 Transformer 没有显式的序列信息（如 RNN 中的时间步），位置编码被用来为输入序列中的每个词添加位置信息。通常使用正弦和余弦函数生成位置编码：
$$
PE_{(pos,2i)} = \sin\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)
$$

$$
PE_{(pos,2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right)
$$

其中：

*p**os* 是词的位置，i*i* 是维度索引。

```html
<style>
.pos-encoding-diagram {
    font-family: system-ui, -apple-system, sans-serif;
    background: #222;
    color: #eee;
    padding: 30px;
    border-radius: 0px;
    max-width: 1200px;
    margin: 0 auto;
}
.row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 30px;
}
.col {
    flex: 1;
    text-align: center;
}
.word-label {
    font-size: 24px;
    color: #ccc;
    margin-bottom: 20px;
}
.box {
    padding: 20px;
    border: 2px solid;
    border-radius: 0px;
    margin-bottom: 10px;
}
.box.embedding {
    border-color: #4dabf7;
    color: #eee;
}
.box.pos {
    border-color: #51cf66;
    color: #51cf66;
    background: rgba(81, 207, 102, 0.15);
}
.plus {
    font-size: 30px;
    color: #51cf66;
    margin: 10px 0;
}
.equal-label {
    font-size: 24px;
    color: #ccc;
    text-align: right;
    align-self: center;
}
.footer {
    text-align: center;
    margin-top: 40px;
    color: #aaa;
    font-size: 22px;
}
</style>

<div class="pos-encoding-diagram">
    <div class="row">
        <!-- 第一列：我 -->
        <div class="col">
            <div class="word-label">我（pos=0）</div>
            <div class="box embedding">
                词嵌入<br>
                <span style="color:#4dabf7; font-size:20px;">[0.2, 0.8...]</span>
            </div>
            <div class="plus">+</div>
            <div class="box pos">
                位置编码<br>
                sin(0)=0.0
            </div>
        </div>

        <!-- 第二列：爱 -->
        <div class="col">
            <div class="word-label">爱（pos=1）</div>
            <div class="box embedding">
                词嵌入<br>
                <span style="color:#4dabf7; font-size:20px;">[0.5, 0.1...]</span>
            </div>
            <div class="plus">+</div>
            <div class="box pos">
                位置编码<br>
                sin(1)~0.84
            </div>
        </div>

        <!-- 第三列：学习 -->
        <div class="col">
            <div class="word-label">学习（pos=2）</div>
            <div class="box embedding">
                词嵌入<br>
                <span style="color:#4dabf7; font-size:20px;">[0.7, 0.3...]</span>
            </div>
            <div class="plus">+</div>
            <div class="box pos">
                位置编码<br>
                sin(2)~0.91
            </div>
        </div>

        <!-- 第四列：深度 -->
        <div class="col">
            <div class="word-label">深度（pos=3）</div>
            <div class="box embedding">
                词嵌入<br>
                <span style="color:#4dabf7; font-size:20px;">[0.4, 0.6...]</span>
            </div>
            <div class="plus">+</div>
            <div class="box pos">
                位置编码<br>
                sin(3)~0.14
            </div>
        </div>

        <!-- 右侧说明 -->
        <div class="equal-label">
            = 带位置<br>
            <span style="color:#4dabf7;">信息的向量</span>
        </div>
    </div>

    <div class="footer">位置编码与词嵌入相加，给模型注入位置信息</div>
</div>
```

位置编码与词嵌入相加，给模型注入位置信息

### 编码器-解码器架构

### 编码器-解码器架构

Transformer 模型由编码器和解码器两部分组成：

- **编码器：**将输入序列转换为一系列隐藏表示。每个编码器层包含一个自注意力机制和一个前馈神经网络。
- **解码器：** 根据编码器的输出生成目标序列。每个解码器层包含两个注意力机制（自注意力和编码器-解码器注意力）和一个前馈神经网络。

------

## 残差连接与层归一化

每个子层（自注意力、前馈网络）输出后，会执行残差连接和层归一化两个操作，帮助深层网络稳定训练。

```html
<style>
.residual-diagram {
    font-family: system-ui, -apple-system, sans-serif;
    background: #222;
    color: #eee;
    padding: 30px;
    border-radius: 0px;
    max-width: 1200px;
    margin: 0 auto;
}
.diagram-container {
    position: relative;
    width: 100%;
    height: 300px;
}
.node {
    position: absolute;
    padding: 20px 30px;
    text-align: center;
    font-weight: bold;
    border: 2px solid;
    border-radius: 0px;
    background: transparent;
    color: #fff;
}
.node.x {
    top: 120px;
    left: 20px;
    border-color: #4dabf7;
    color: #4dabf7;
    font-size: 24px;
}
.node.sub {
    top: 120px;
    left: 250px;
    border-color: #4dabf7;
    color: #4dabf7;
}
.node.add {
    top: 120px;
    left: 550px;
    border-radius: 50%;
    border-color: #f59f00;
    background: rgba(245, 159, 0, 0.2);
    color: #f59f00;
    font-size: 30px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}
.node.ln {
    top: 120px;
    left: 700px;
    border-color: #51cf66;
    color: #51cf66;
    background: rgba(81, 207, 102, 0.15);
}
.label-top {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: #f59f00;
    font-size: 24px;
}
.label-output {
    position: absolute;
    top: 120px;
    right: 20px;
    color: #51cf66;
    font-size: 28px;
}
.footer-text {
    text-align: center;
    margin-top: 40px;
    color: #aaa;
    font-size: 22px;
}
/* 箭头 */
.arrow {
    position: absolute;
    background-color: #4dabf7;
    height: 3px;
    z-index: 1;
}
.arrow::after {
    content: '';
    position: absolute;
    right: 0;
    top: -8px;
    border: 8px solid transparent;
    border-left-color: inherit;
}
/* 残差虚线箭头 */
.arrow-residual {
    background-color: #f59f00;
    border-style: dashed;
    border-width: 0;
    border-top: 3px dashed #f59f00;
    height: 0;
    border-radius: 0;
}
.arrow-residual::after {
    border-left-color: #f59f00;
}
</style>

<div class="residual-diagram">
    <div class="diagram-container">
        <!-- 节点 -->
        <div class="node x">x</div>
        <div class="node sub">子层<br>F(x)</div>
        <div class="node add">+</div>
        <div class="node ln">层归一化<br>LayerNorm</div>

        <!-- 文字 -->
        <div class="label-top">残差连接（直接跳过子层，加到输出上）</div>
        <div class="label-output">输出</div>

        <!-- 箭头 -->
        <div class="arrow" style="top: 150px; left: 140px; width: 80px;"></div>
        <div class="arrow" style="top: 150px; left: 400px; width: 120px;"></div>
        <div class="arrow" style="top: 150px; left: 630px; width: 60px;"></div>
        <div class="arrow" style="top: 150px; left: 850px; width: 80px; background-color:#51cf66;"></div>

        <!-- 残差虚线箭头（曲线效果用伪元素模拟） -->
        <svg width="100%" height="100%" style="position:absolute;top:0;left:0;pointer-events:none;">
            <path d="M 100 150 Q 100 50 600 150" stroke="#f59f00" stroke-width="3" stroke-dasharray="8 4" fill="none" />
            <polygon points="600,150 592,142 592,158" fill="#f59f00" />
        </svg>
    </div>

    <div class="footer-text">输出 = LayerNorm( F(x) + x )</div>
    <div class="footer-text" style="margin-top:20px; font-size:20px;">残差连接让梯度"短路"流过，层归一化稳定训练</div>
</div>
```

- **残差连接：**将子层的输入直接加到输出上（output = F(x) + x），避免深层网络的梯度消失，也让模型可以"选择性忽略"某层的变换。
- **层归一化：**对每层的激活值做归一化，使训练更稳定，收敛更快。

------

## Transformer 的优势

相比传统的 RNN 架构，Transformer 有以下几个显著优势：

| 并行计算                                                    | 长距离依赖                                                   | 可扩展性强                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 同时处理整个序列，充分利用 GPU 并行能力，训练速度远超 RNN。 | 自注意力机制让任意两个词之间的 "通信距离" 始终为 1，不再受序列长度限制。 | 堆叠更多层、增大维度即可提升性能，催生了 BERT、GPT 等强大模型。 |

------

## Transformer 的应用

Transformer 架构已在 AI 各领域得到广泛应用，以下按领域分类介绍。

### 自然语言处理 (NLP)

`机器翻译 (Google Translate)` | `文本生成(GPT 系列)`  | `文本分类` | `问答系统` | `情感分析` | `摘要生成`

### 计算机视觉（CV）

`图像分类 (Vision Transformer / ViT)` | `目标检测` | `图像生成`

### 多模态任务

`图文对齐 (CLIP) `|`文本生成图像 (DALL-E / Stable Diffusion)` |`视频理解`

------

## Transformer 的应用

- **自然语言处理（NLP）**：
  - 机器翻译（如 Google Translate）
  - 文本生成（如 GPT 系列模型）
  - 文本分类、问答系统等。
- **计算机视觉（CV）**：
  - 图像分类（如 Vision Transformer）
  - 目标检测、图像生成等。
- **多模态任务**：
  - 结合文本和图像的任务（如 CLIP、DALL-E）。



## PyTorch 实现示例

以下是一个完整的 PyTorch Transformer 示例，包含详细注释帮助初学者理解每个步骤：

```py
import torch
import torch.nn as nn
import torch.optim as optim

# --- 定义 Transformer 模型 ---

class TransformerModel(nn.Module):
    def __init__(self, input_dim, model_dim, num_heads, num_layers, output_dim):
        super(TransformerModel, self).__init__()

        # 词嵌入：将词索引映射为 model_dim 维向量
        self.embedding = nn.Embedding(input_dim, model_dim)

        # 位置编码：可学习的位置向量，最大支持长度 1000
        self.positional_encoding = nn.Parameter(
            torch.zeros(1, 1000, model_dim)
        )

        # PyTorch 内置 Transformer（包含编码器 + 解码器）
        self.transformer = nn.Transformer(
            d_model=model_dim,               # 向量维度
            nhead=num_heads,                 # 多头注意力的头数
            num_encoder_layers=num_layers,   # 编码器层数
            num_decoder_layers=num_layers    # 解码器层数
        )

        # 最终线性层：将向量映射回词汇表大小（用于预测下一个词）
        self.fc = nn.Linear(model_dim, output_dim)

    def forward(self, src, tgt):
        src_seq_length = src.size(1)
        tgt_seq_length = tgt.size(1)

        # 词嵌入 + 位置编码（两者相加）
        src = self.embedding(src) + self.positional_encoding[:, :src_seq_length, :]
        tgt = self.embedding(tgt) + self.positional_encoding[:, :tgt_seq_length, :]

        # 通过 Transformer（编码器读 src，解码器生成 tgt）
        transformer_output = self.transformer(src, tgt)

        # 线性层输出每个位置的词汇概率
        output = self.fc(transformer_output)
        return output

# --- 超参数设置 ---

input_dim  = 10000  # 词汇表大小（共有多少个不同的词）
model_dim  = 512    # 每个词的向量维度（原论文使用 512）
num_heads  = 8      # 多头注意力头数（需能整除 model_dim）
num_layers = 6      # 编码器/解码器层数（原论文使用 6）
output_dim = 10000  # 输出维度（与词汇表大小相同）

# --- 初始化模型、损失函数和优化器 ---

model     = TransformerModel(input_dim, model_dim, num_heads, num_layers, output_dim)
criterion = nn.CrossEntropyLoss()                # 多分类交叉熵损失
optimizer = optim.Adam(model.parameters(), lr=0.001)  # Adam 优化器

# --- 构造示例数据（实际使用时换成真实语料） ---

# src: 源序列（如中文），shape = (序列长度=10, 批量大小=32)
src = torch.randint(0, input_dim, (10, 32))
# tgt: 目标序列（如英文），shape = (序列长度=20, 批量大小=32)
tgt = torch.randint(0, input_dim, (20, 32))

# --- 前向传播 ---

output = model(src, tgt)
# output.shape = (20, 32, 10000)：每个位置对词汇表的预测分布

# --- 计算损失 ---

# view(-1, output_dim) 将 (20,32,10000) 展平为 (640, 10000)
loss = criterion(output.view(-1, output_dim), tgt.view(-1))

# --- 反向传播 + 更新权重 ---

optimizer.zero_grad()   # 清空上一步的梯度
loss.backward()         # 计算梯度
optimizer.step()        # 更新参数

print(f"损失值: {loss.item():.4f}")
```

> 上面的代码使用随机数据只是为了演示流程。实际训练时需要：
>
> - 1) 准备真实的平行语料（如中英翻译对）；
> - 2) 做好分词和词汇表构建；
> - 3) 实现 Decoder 的逐步推理（自回归生成）；
> - 4) 调整学习率调度策略（原论文用 Warmup）。

------

## 总结

从 RNN 到 Transformer 的演进，代表了深度学习领域一次重要的范式转变。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
    .container {
        background-color: #222;
        color: #fff;
        padding: 50px;
        font-family: sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .pipeline {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .node {
        width: 100px;
        height: 100px;
        border: 2px solid #55aaff;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 10px;
        background-color: #333;
        font-size: 14px;
        box-sizing: border-box;
    }

    .arrow {
        color: #55aaff;
        font-size: 24px;
    }

    .label {
        margin-top: 10px;
        font-size: 12px;
        color: #aaa;
        text-align: center;
        width: 100px;
    }

    .node-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .title {
        margin-top: 30px;
        font-size: 20px;
    }
</style>
</head>
<body>

<div class="container">
    <div class="pipeline">
        <div class="node-wrapper">
            <div class="node" style="border-color: #ff5555;">RNN</div>
            <div class="label">顺序 / 慢<br>梯度消失</div>
        </div>

        <div class="arrow">→</div>

        <div class="node-wrapper">
            <div class="node" style="border-color: #55ffaa;">位置<br>编码</div>
            <div class="label">告知顺序</div>
        </div>

        <div class="arrow">→</div>

        <div class="node-wrapper">
            <div class="node">自注意<br>力机制</div>
            <div class="label">全局关联</div>
        </div>

        <div class="arrow">→</div>

        <div class="node-wrapper">
            <div class="node" style="border-color: #aa55ff;">多头<br>注意力</div>
            <div class="label">多角度</div>
        </div>

        <div class="arrow">→</div>

        <div class="node-wrapper">
            <div class="node">Trans<br>former</div>
            <div class="label">革命</div>
        </div>
    </div>

    <div class="title">从 RNN 到 Transformer 的演进路径</div>
</div>

</body>
</html>
```

从 RNN 到 Transformer 的演进路径

Transformer 的三大创新彻底改变了深度学习格局：

1. **自注意力机制**——让任意两词直接"对话"，告别梯度消失。
2. **完全并行化**——训练速度质的飞跃，使大规模预训练成为可能。
3. **通用架构**——从 NLP 到 CV、多模态，Transformer 已成为 AI 时代的"通用积木"。

掌握 Transformer，你就掌握了理解 GPT、BERT、Stable Diffusion 等现代 AI 模型的钥匙。

------

## 相关术语速查

| 术语       | 英文                 | 说明                                           |
| :--------- | :------------------- | :--------------------------------------------- |
| 自注意力   | Self-Attention       | 计算序列内各元素之间相关性的机制               |
| 多头注意力 | Multi-Head Attention | 多个注意力头并行计算，捕捉不同特征子空间的信息 |
| 位置编码   | Positional Encoding  | 为模型提供序列中元素位置信息的技术             |
| 残差连接   | Residual Connection  | 将输入直接加到子层输出上，缓解梯度消失         |
| 层归一化   | Layer Normalization  | 对每层激活值归一化，加速训练收敛               |
| 编码器     | Encoder              | 将输入序列编码为上下文表示                     |
| 解码器     | Decoder              | 根据编码器输出生成目标序列                     |
| 交叉注意力 | Cross-Attention      | 解码器关注编码器输出的注意力机制               |
| 掩码注意力 | Masked Attention     | 解码器中防止关注未来位置信息的机制             |
| 前馈网络   | Feed-Forward Network | 对每个位置独立应用的全连接层                   |
