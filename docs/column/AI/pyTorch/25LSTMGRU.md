---
date: 2026年06月09日
---

# PyTorch LSTM / GRU

循环神经网络（RNN）在处理序列数据时面临梯度消失问题，导致难以学习长距离依赖关系。

**长短期记忆网络（Long Short-Term Memory，LSTM）**和**门控循环单元（Gated Recurrent Unit，GRU）**通过引入门控机制解决了这一问题，是处理时间序列、自然语言、语音等序列任务的核心模型。

------

## 1. RNN 的局限与门控机制

标准 RNN 在每个时间步将当前输入与上一步的隐藏状态合并计算新的隐藏状态：
$$
h_t=\tanh\left(W_h h_{t-1}+W_x x_t+b\right)
$$
这一结构存在两个核心问题：

**梯度消失**：反向传播时梯度需要逐步乘以权重矩阵，序列较长时梯度指数级衰减，导致早期时间步的参数几乎不更新，模型无法学习长距离依赖。

**梯度爆炸**：当权重矩阵的最大特征值大于 1 时，梯度反向传播过程中指数级增大，训练不稳定（通常用梯度裁剪缓解）。

门控机制的核心思想是引入可学习的"开关"，让网络自主决定：在当前时间步，哪些信息应该被记住，哪些应该被遗忘，哪些新信息应该写入记忆。

LSTM 使用三个门（遗忘门、输入门、输出门）加上一个单独的细胞状态；GRU 将结构简化为两个门（重置门、更新门），参数更少，训练更快。

## 2. LSTM 原理

### 2.1 核心结构与三个门

LSTM 维护两个状态向量在时间步之间传递：

- **细胞状态（Cell State）** \(c_t\)：长期记忆的载体，信息可以在其中几乎无损地流动
- **隐藏状态（Hidden State）** \(h_t\)：短期记忆，也是当前时间步的输出

三个门均为 Sigmoid 激活的线性变换，输出值在 0~1 之间，起到"阀门"的作用：

```
遗忘门（Forget Gate）：决定从细胞状态中丢弃哪些信息
输入门（Input Gate）：决定将哪些新信息写入细胞状态
输出门（Output Gate）：决定基于细胞状态输出什么
```

### 2.2 前向计算公式

$$
\begin{array}{ll}
\text{输入：} & x_t,\ h_{t-1},\ c_{t-1} \\
\text{遗忘门：} & f_t = \sigma(W_f \cdot [h_{t-1}, x_t] + b_f) \\
\text{输入门：} & i_t = \sigma(W_i \cdot [h_{t-1}, x_t] + b_i) \\
\text{候选值：} & \tilde{g}_t = \tanh(W_g \cdot [h_{t-1}, x_t] + b_g) \\
\text{输出门：} & o_t = \sigma(W_o \cdot [h_{t-1}, x_t] + b_o) \\
\text{更新细胞状态：} & c_t = f_t \odot c_{t-1} + i_t \odot \tilde{g}_t \\
\text{更新隐藏状态：} & h_t = o_t \odot \tanh(c_t)
\end{array}
$$

其中 ⊙ 表示逐元素乘法（Hadamard 积），σ 表示 Sigmoid 函数。

计算逻辑解读：

- `f_t ⊙ c_{t-1}`：遗忘门决定保留多少历史记忆，接近 0 则遗忘，接近 1 则保留
- `i_t ⊙ g_t`：输入门决定写入多少新信息，`g_t` 是候选新内容
- `o_t ⊙ tanh(c_t)`：输出门决定从细胞状态中提取什么作为隐藏状态输出

## 3. GRU 原理

### 3.1 核心结构与两个门

GRU 将 LSTM 的遗忘门与输入门合并为**更新门**，并取消了独立的细胞状态，只保留隐藏状态，结构更加简洁。

```
重置门（Reset Gate）：决定忽略多少历史状态来计算候选隐藏状态
更新门（Update Gate）：决定保留多少历史状态，写入多少新状态
```

### 3.2 前向计算公式

$$
\begin{array}{ll}
\text{输入：} & x_t,\ h_{t-1} \\
\text{重置门：} & r_t = \sigma(W_r \cdot [h_{t-1}, x_t] + b_r) \\
\text{更新门：} & z_t = \sigma(W_z \cdot [h_{t-1}, x_t] + b_z) \\
\text{候选值：} & \tilde{h}_t = \tanh(W_h \cdot [r_t \odot h_{t-1}, x_t] + b_h) \\
\text{更新隐藏状态：} & h_t = (1 - z_t) \odot h_{t-1} + z_t \odot \tilde{h}_t
\end{array}
$$

计算逻辑解读：

- 重置门 `r_t` 接近 0 时，候选状态 `h̃_t` 几乎不依赖历史，相当于重新开始
- 更新门 `z_t` 接近 1 时，新状态更多采用候选值；接近 0 时，更多保留历史状态
- GRU 没有独立的细胞状态，参数量约为 LSTM 的 75%

## 4. PyTorch 中的 LSTM

本节详细介绍 nn.LSTM 的参数、输入输出形状以及隐藏状态初始化方法。

### 4.1 nn.LSTM 参数详解

```py
import torch
import torch.nn as nn

lstm = nn.LSTM(
    input_size=64,       # 每个时间步输入向量的维度
    hidden_size=128,     # 隐藏状态（以及细胞状态）的维度
    num_layers=2,        # 堆叠层数，默认为 1
    bias=True,           # 是否使用偏置项，默认 True
    batch_first=False,   # 输入/输出 shape 中 batch 是否在第一维，默认 False
    dropout=0.0,         # 层间 dropout 概率（仅在 num_layers > 1 时生效）
    bidirectional=False, # 是否使用双向 LSTM，默认 False
    proj_size=0,         # 投影层维度（LSTM with projection），默认 0 表示不使用
)

# 查看参数量
total_params = sum(p.numel() for p in lstm.parameters())
print(f"LSTM 参数量: {total_params:,}")
# input_size=64, hidden_size=128, num_layers=2 时约为 197,632
```

参数量估算公式（单层单向）：
$$
\begin{array}{l}
\text{每一层参数量} = 4 \times (hidden\_size \times input\_size + hidden\_size \times hidden\_size + hidden\_size) \\
\phantom{\text{每一层参数量}} = 4 \times hidden\_size \times (input\_size + hidden\_size + 1)
\end{array}
$$
其中 4 对应四组权重矩阵：遗忘门、输入门、候选值、输出门。

### 4.2 输入与输出的形状

这是使用 LSTM 最容易出错的部分，需要特别注意 `batch_first` 参数的影响。

```py
import torch
import torch.nn as nn

# ── batch_first=False（默认）────────────────────────
lstm = nn.LSTM(input_size=32, hidden_size=64, batch_first=False)

# 输入形状：(seq_len, batch_size, input_size)
seq_len, batch_size, input_size = 10, 4, 32
x = torch.randn(seq_len, batch_size, input_size)

output, (h_n, c_n) = lstm(x)

print(f"output 形状: {output.shape}")
# torch.Size([10, 4, 64])   → (seq_len, batch_size, hidden_size)
# 每个时间步的隐藏状态输出

print(f"h_n 形状: {h_n.shape}")
# torch.Size([1, 4, 64])    → (num_layers * num_directions, batch_size, hidden_size)
# 最后一个时间步的隐藏状态

print(f"c_n 形状: {c_n.shape}")
# torch.Size([1, 4, 64])    → 同 h_n，最后一个时间步的细胞状态


# ── batch_first=True（推荐，更直观）────────────────
lstm_bf = nn.LSTM(input_size=32, hidden_size=64, batch_first=True)

# 输入形状：(batch_size, seq_len, input_size)
x = torch.randn(batch_size, seq_len, input_size)

output, (h_n, c_n) = lstm_bf(x)

print(f"output 形状: {output.shape}")
# torch.Size([4, 10, 64])   → (batch_size, seq_len, hidden_size)

print(f"h_n 形状: {h_n.shape}")
# torch.Size([1, 4, 64])    → (num_layers, batch_size, hidden_size)
# 注意：h_n 的形状不受 batch_first 影响


# ── 多层双向 LSTM 的输出形状 ──────────────────────
lstm_bd = nn.LSTM(input_size=32, hidden_size=64,
                   num_layers=3, bidirectional=True, batch_first=True)

x = torch.randn(batch_size, seq_len, input_size)
output, (h_n, c_n) = lstm_bd(x)

print(f"output 形状: {output.shape}")
# torch.Size([4, 10, 128])
# hidden_size × 2 = 128，因为双向拼接

print(f"h_n 形状: {h_n.shape}")
# torch.Size([6, 4, 64])
# num_layers × num_directions = 3 × 2 = 6
```

输出形状总结：

| 变量     | batch_first=False     | batch_first=True      |
| :------- | :-------------------- | :-------------------- |
| `output` | `(seq_len, N, H * D)` | `(N, seq_len, H * D)` |
| `h_n`    | `(L * D, N, H)`       | `(L * D, N, H)`       |
| `c_n`    | `(L * D, N, H)`       | `(L * D, N, H)`       |

> \(N\) = batch_size，\(H\) = hidden_size，\(L\) = num_layers，\(D\) = 2（双向）或 1（单向）

### 4.3 隐藏状态的初始化

```py
import torch
import torch.nn as nn

lstm = nn.LSTM(input_size=32, hidden_size=64, num_layers=2, batch_first=True)
batch_size = 8
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
lstm = lstm.to(device)

# 方式一：不传入初始状态，PyTorch 自动使用全零初始化
x = torch.randn(batch_size, 10, 32).to(device)
output, (h_n, c_n) = lstm(x)


# 方式二：手动初始化为全零（与方式一等价，但明确显示意图）
num_layers, num_directions = 2, 1
h_0 = torch.zeros(num_layers * num_directions, batch_size, 64).to(device)
c_0 = torch.zeros(num_layers * num_directions, batch_size, 64).to(device)
output, (h_n, c_n) = lstm(x, (h_0, c_0))


# 方式三：有状态（stateful）模式 —— 跨 batch 传递状态
# 适用于超长序列切片（语言模型、长文本生成等）
# 需要调用 detach() 切断与前一 batch 的计算图，防止显存泄漏
h, c = h_0, c_0
for batch_x in data_loader:
    batch_x = batch_x.to(device)
    output, (h, c) = lstm(batch_x, (h, c))
    h = h.detach()    # 切断梯度，只保留数值
    c = c.detach()


# 方式四：使用 Xavier 或正态分布初始化（某些场景收敛更快）
def init_hidden(lstm_module, batch_size, device):
    num_layers = lstm_module.num_layers
    hidden_size = lstm_module.hidden_size
    directions = 2 if lstm_module.bidirectional else 1
    h = torch.zeros(num_layers * directions, batch_size, hidden_size, device=device)
    c = torch.zeros(num_layers * directions, batch_size, hidden_size, device=device)
    nn.init.orthogonal_(h)   # 正交初始化，有助于稳定训练
    return h, c
```

## 5. PyTorch 中的 GRU

GRU 的接口与 LSTM 几乎完全相同，主要区别是没有细胞状态 `c`。

### 5.1 nn.GRU 参数详解

```py
import torch.nn as nn

gru = nn.GRU(
    input_size=64,
    hidden_size=128,
    num_layers=2,
    bias=True,
    batch_first=True,    # 推荐设为 True
    dropout=0.3,         # 层间 dropout
    bidirectional=False,
)
```

### 5.2 基本使用示例

```py
import torch
import torch.nn as nn

gru = nn.GRU(input_size=32, hidden_size=64, batch_first=True)

batch_size, seq_len = 8, 10
x = torch.randn(batch_size, seq_len, 32)

# GRU 只返回 output 和 h_n，没有 c_n
output, h_n = gru(x)

print(f"output 形状: {output.shape}")
# torch.Size([8, 10, 64])   → (batch_size, seq_len, hidden_size)

print(f"h_n 形状: {h_n.shape}")
# torch.Size([1, 8, 64])    → (num_layers, batch_size, hidden_size)

# 取最后一个时间步的输出（用于分类等任务）
last_hidden = output[:, -1, :]    # (batch_size, hidden_size)
# 或等价地：
last_hidden = h_n.squeeze(0)      # (batch_size, hidden_size)
```

## 6. LSTM 与 GRU 的变体

本节介绍双向、多层堆叠以及带 Dropout 的多层结构。

### 6.1 双向 LSTM / GRU

双向模型同时从序列的正向和反向处理信息，每个时间步的输出包含过去和未来的上下文，适合文本分类、命名实体识别等需要全局上下文的任务。

```py
import torch
import torch.nn as nn

# 双向 LSTM
bilstm = nn.LSTM(
    input_size=32,
    hidden_size=64,
    num_layers=2,
    batch_first=True,
    bidirectional=True,    # 开启双向
)

x = torch.randn(8, 10, 32)
output, (h_n, c_n) = bilstm(x)

print(f"output 形状: {output.shape}")
# torch.Size([8, 10, 128])
# 正向 64 维 + 反向 64 维 = 128 维

print(f"h_n 形状: {h_n.shape}")
# torch.Size([4, 8, 64])
# num_layers(2) × num_directions(2) = 4

# 分离正向和反向的最后隐藏状态
# h_n 的排列顺序：[正向layer0, 反向layer0, 正向layer1, 反向layer1]
h_forward  = h_n[-2, :, :]    # (batch_size, hidden_size) 正向最后一层
h_backward = h_n[-1, :, :]    # (batch_size, hidden_size) 反向最后一层
h_combined = torch.cat([h_forward, h_backward], dim=-1)  # (batch_size, 128)


# 双向 GRU 用法完全相同
bigru = nn.GRU(input_size=32, hidden_size=64,
                num_layers=2, batch_first=True, bidirectional=True)
output, h_n = bigru(x)
```

### 6.2 多层堆叠

```py
import torch
import torch.nn as nn

# 3 层堆叠 LSTM
deep_lstm = nn.LSTM(
    input_size=32,
    hidden_size=128,
    num_layers=3,          # 堆叠 3 层
    batch_first=True,
)

x = torch.randn(8, 20, 32)
output, (h_n, c_n) = deep_lstm(x)

print(f"output 形状: {output.shape}")
# torch.Size([8, 20, 128])  只包含最顶层的输出

print(f"h_n 形状: {h_n.shape}")
# torch.Size([3, 8, 128])   包含每一层的最终隐藏状态

# 获取各层的最终隐藏状态
h_layer1 = h_n[0]    # (batch_size, hidden_size) 第一层
h_layer2 = h_n[1]    # (batch_size, hidden_size) 第二层
h_layer3 = h_n[2]    # (batch_size, hidden_size) 第三层（最顶层）
```

### 6.3 带 Dropout 的多层结构

`nn.LSTM` 内置的 `dropout` 参数只作用于**层与层之间**，不作用于最后一层的输出。如需在最后一层后也加 Dropout，需要手动添加：

```py
import torch
import torch.nn as nn

class StackedLSTM(nn.Module):
    """
    多层 LSTM + 层间 Dropout + 输出 Dropout
    """
    def __init__(self, input_size, hidden_size, num_layers,
                 num_classes, dropout=0.3):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
            # num_layers=1 时 dropout 无效，设为 0 避免警告
        )
        self.dropout = nn.Dropout(dropout)    # 最后一层后的 Dropout
        self.fc = nn.Linear(hidden_size, num_classes)

    def forward(self, x):
        output, (h_n, c_n) = self.lstm(x)
        # 取最后一个时间步的隐藏状态
        last_output = output[:, -1, :]        # (batch_size, hidden_size)
        last_output = self.dropout(last_output)
        return self.fc(last_output)


model = StackedLSTM(input_size=64, hidden_size=128,
                     num_layers=3, num_classes=5, dropout=0.3)
x = torch.randn(16, 20, 64)
print(model(x).shape)   # torch.Size([16, 5])
```

## 7. 处理变长序列

实际任务中，同一 batch 内的序列长度通常不同。PyTorch 提供了 `pack_padded_sequence` 和 `pad_packed_sequence` 处理这一问题，避免 LSTM 在填充位置（padding）上做无效计算。

### 7.1 pack_padded_sequence

```py
import torch
import torch.nn as nn
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence, pad_sequence

# 模拟一个 batch 中的变长序列（已排序，从长到短）
seq1 = torch.randn(5, 32)    # 序列长度 5
seq2 = torch.randn(3, 32)    # 序列长度 3
seq3 = torch.randn(2, 32)    # 序列长度 2

# pad_sequence 自动补零，对齐到最长序列
# batch_first=True 时输出形状为 (batch_size, max_seq_len, input_size)
padded = pad_sequence([seq1, seq2, seq3], batch_first=True, padding_value=0.0)
lengths = torch.tensor([5, 3, 2])

print(f"补零后形状: {padded.shape}")   # torch.Size([3, 5, 32])

# pack_padded_sequence：压缩填充，告诉 LSTM 真实长度
packed = pack_padded_sequence(
    padded,
    lengths=lengths,
    batch_first=True,
    enforce_sorted=True,    # 序列必须按长度降序排列
    # enforce_sorted=False  # 允许任意顺序（内部自动排序），推荐设为 False
)

print(type(packed))         # <class 'torch.nn.utils.rnn.PackedSequence'>
```

### 7.2 pad_packed_sequence

```py
lstm = nn.LSTM(input_size=32, hidden_size=64, batch_first=True)

# 将 PackedSequence 传入 LSTM
packed_output, (h_n, c_n) = lstm(packed)

# pad_packed_sequence：还原为补零张量
output, output_lengths = pad_packed_sequence(packed_output, batch_first=True)

print(f"还原后 output 形状: {output.shape}")
# torch.Size([3, 5, 64])    → (batch_size, max_seq_len, hidden_size)
# 补零位置的输出为 0

print(f"各序列实际长度: {output_lengths}")
# tensor([5, 3, 2])
```

### 7.3 完整变长序列处理流程

```py
import torch
import torch.nn as nn
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence

class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_size, num_classes, padding_idx=0):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=padding_idx)
        self.lstm      = nn.LSTM(embed_dim, hidden_size, batch_first=True)
        self.fc        = nn.Linear(hidden_size, num_classes)

    def forward(self, x, lengths):
        # x: (batch_size, max_seq_len) — 词索引
        embedded = self.embedding(x)   # (batch_size, max_seq_len, embed_dim)

        # 打包
        packed = pack_padded_sequence(
            embedded, lengths.cpu(), batch_first=True, enforce_sorted=False
        )

        # LSTM 前向传播（跳过填充位置）
        packed_output, (h_n, c_n) = self.lstm(packed)

        # 方式一：使用最后一层的 h_n 作为序列表示
        last_hidden = h_n.squeeze(0)    # (batch_size, hidden_size)

        # 方式二：解包后取每个序列真实最后位置的输出（与方式一等价）
        # output, _ = pad_packed_sequence(packed_output, batch_first=True)
        # last_hidden = output[range(len(lengths)), lengths - 1, :]

        return self.fc(last_hidden)


model = LSTMClassifier(vocab_size=10000, embed_dim=128,
                        hidden_size=256, num_classes=5)

# 模拟一个 batch
batch_tokens  = torch.randint(1, 10000, (8, 30))   # (batch_size=8, max_len=30)
batch_lengths = torch.randint(5, 31, (8,))          # 每条序列的真实长度

output = model(batch_tokens, batch_lengths)
print(output.shape)   # torch.Size([8, 5])
```

## 8. 完整实战：文本情感分类

以 IMDB 影评情感二分类为例，展示双向 LSTM 处理文本的完整流程：

```py
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torch.nn.utils.rnn import pack_padded_sequence, pad_sequence
from torch.optim.lr_scheduler import ReduceLROnPlateau

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── 模型定义 ──────────────────────────────────────
class BiLSTMClassifier(nn.Module):
    """
    双向 LSTM 文本分类模型
    结构：Embedding -> BiLSTM -> Dropout -> FC
    """
    def __init__(self, vocab_size, embed_dim, hidden_size,
                 num_layers, num_classes, dropout=0.5, padding_idx=0):
        super().__init__()

        self.embedding = nn.Embedding(
            vocab_size, embed_dim, padding_idx=padding_idx
        )
        # 使用预训练词向量时：
        # self.embedding = nn.Embedding.from_pretrained(pretrained_vectors)

        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
            bidirectional=True,
        )

        self.dropout = nn.Dropout(dropout)

        # 双向 LSTM：拼接正向和反向最后隐藏状态
        self.fc = nn.Linear(hidden_size * 2, num_classes)

    def forward(self, x, lengths):
        # x: (batch_size, max_seq_len)
        embedded = self.dropout(self.embedding(x))

        packed = pack_padded_sequence(
            embedded, lengths.cpu(), batch_first=True, enforce_sorted=False
        )
        packed_output, (h_n, c_n) = self.lstm(packed)

        # h_n: (num_layers * 2, batch_size, hidden_size)
        # 取最后一层的正向和反向隐藏状态并拼接
        h_forward  = h_n[-2, :, :]    # (batch_size, hidden_size)
        h_backward = h_n[-1, :, :]    # (batch_size, hidden_size)
        h_combined = torch.cat([h_forward, h_backward], dim=-1)
        # (batch_size, hidden_size * 2)

        out = self.dropout(h_combined)
        return self.fc(out)


# ── 自定义 Dataset ────────────────────────────────
class TextDataset(Dataset):
    def __init__(self, texts, labels, vocab, max_len=200):
        self.data   = texts
        self.labels = labels
        self.vocab  = vocab
        self.max_len = max_len

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        tokens = self.data[idx][:self.max_len]
        ids    = [self.vocab.get(t, 1) for t in tokens]  # 1 = <UNK>
        return torch.tensor(ids, dtype=torch.long), torch.tensor(self.labels[idx])


def collate_fn(batch):
    """自定义 collate：对变长序列补零，记录真实长度"""
    sequences, labels = zip(*batch)
    lengths = torch.tensor([len(s) for s in sequences])
    padded  = pad_sequence(sequences, batch_first=True, padding_value=0)
    labels  = torch.stack(labels)
    return padded, lengths, labels


# ── 训练与评估函数 ────────────────────────────────
def train_epoch(model, loader, optimizer, criterion):
    model.train()
    total_loss, correct = 0.0, 0
    for texts, lengths, labels in loader:
        texts, labels = texts.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(texts, lengths)
        loss    = criterion(outputs, labels)
        loss.backward()
        # 梯度裁剪：防止 RNN 的梯度爆炸
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_loss += loss.item() * len(labels)
        correct    += (outputs.argmax(1) == labels).sum().item()

    n = len(loader.dataset)
    return total_loss / n, correct / n


def eval_epoch(model, loader, criterion):
    model.eval()
    total_loss, correct = 0.0, 0
    with torch.no_grad():
        for texts, lengths, labels in loader:
            texts, labels = texts.to(device), labels.to(device)
            outputs = model(texts, lengths)
            loss    = criterion(outputs, labels)
            total_loss += loss.item() * len(labels)
            correct    += (outputs.argmax(1) == labels).sum().item()
    n = len(loader.dataset)
    return total_loss / n, correct / n


# ── 初始化与训练 ──────────────────────────────────
VOCAB_SIZE  = 50000
EMBED_DIM   = 128
HIDDEN_SIZE = 256
NUM_LAYERS  = 2
NUM_CLASSES = 2
DROPOUT     = 0.5
EPOCHS      = 15

model     = BiLSTMClassifier(VOCAB_SIZE, EMBED_DIM, HIDDEN_SIZE,
                              NUM_LAYERS, NUM_CLASSES, DROPOUT).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)
scheduler = ReduceLROnPlateau(optimizer, mode="max",
                               patience=3, factor=0.5)

best_acc = 0.0
for epoch in range(1, EPOCHS + 1):
    train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion)
    val_loss,   val_acc   = eval_epoch(model,  val_loader,   criterion)
    scheduler.step(val_acc)

    print(f"Epoch {epoch:2d}/{EPOCHS} | "
          f"Train Loss: {train_loss:.4f}, Acc: {train_acc:.4f} | "
          f"Val Loss: {val_loss:.4f}, Acc: {val_acc:.4f}")

    if val_acc > best_acc:
        best_acc = val_acc
        torch.save(model.state_dict(), "best_bilstm.pth")
        print(f"  -> 保存最优模型，Val Acc: {best_acc:.4f}")
```

## 9. 完整实战：时间序列预测

以多步时间序列预测为例，使用 LSTM 预测未来 N 步的数值：

```py
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from torch.utils.data import Dataset, DataLoader

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── 滑动窗口 Dataset ──────────────────────────────
class TimeSeriesDataset(Dataset):
    """
    滑动窗口切割时间序列
    输入：过去 input_len 步
    目标：未来 output_len 步
    """
    def __init__(self, series, input_len, output_len):
        self.data       = torch.tensor(series, dtype=torch.float32)
        self.input_len  = input_len
        self.output_len = output_len

    def __len__(self):
        return len(self.data) - self.input_len - self.output_len + 1

    def __getitem__(self, idx):
        x = self.data[idx : idx + self.input_len]
        y = self.data[idx + self.input_len : idx + self.input_len + self.output_len]
        return x.unsqueeze(-1), y   # x: (input_len, 1), y: (output_len,)


# ── 模型定义 ──────────────────────────────────────
class LSTMForecaster(nn.Module):
    """
    多步时间序列预测模型
    结构：LSTM -> Dropout -> FC
    """
    def __init__(self, input_size, hidden_size, num_layers,
                 output_len, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.dropout = nn.Dropout(dropout)
        self.fc      = nn.Linear(hidden_size, output_len)

    def forward(self, x):
        # x: (batch_size, input_len, input_size)
        output, (h_n, c_n) = self.lstm(x)

        # 取最后一个时间步的输出
        last = output[:, -1, :]            # (batch_size, hidden_size)
        last = self.dropout(last)
        return self.fc(last)               # (batch_size, output_len)


# ── 数据准备（以正弦波为例）──────────────────────
t      = np.linspace(0, 200, 10000)
series = np.sin(t) + 0.1 * np.random.randn(len(t))

INPUT_LEN  = 60     # 使用过去 60 步
OUTPUT_LEN = 10     # 预测未来 10 步

split      = int(len(series) * 0.8)
train_data = series[:split]
val_data   = series[split:]

train_dataset = TimeSeriesDataset(train_data, INPUT_LEN, OUTPUT_LEN)
val_dataset   = TimeSeriesDataset(val_data,   INPUT_LEN, OUTPUT_LEN)

train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
val_loader   = DataLoader(val_dataset,   batch_size=64, shuffle=False)

# ── 训练 ──────────────────────────────────────────
model     = LSTMForecaster(input_size=1, hidden_size=128,
                            num_layers=2, output_len=OUTPUT_LEN).to(device)
criterion = nn.MSELoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)

def train_epoch_ts(model, loader, optimizer, criterion):
    model.train()
    total_loss = 0.0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        pred = model(x)
        loss = criterion(pred, y)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        total_loss += loss.item() * x.size(0)
    return total_loss / len(loader.dataset)

def eval_epoch_ts(model, loader, criterion):
    model.eval()
    total_loss = 0.0
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            pred = model(x)
            total_loss += criterion(pred, y).item() * x.size(0)
    return total_loss / len(loader.dataset)

for epoch in range(1, 31):
    train_loss = train_epoch_ts(model, train_loader, optimizer, criterion)
    val_loss   = eval_epoch_ts(model,  val_loader,   criterion)
    print(f"Epoch {epoch:2d}/30 | Train MSE: {train_loss:.6f} | Val MSE: {val_loss:.6f}")


# ── 多步递归预测（另一种策略）────────────────────
def recursive_forecast(model, init_sequence, steps, device):
    """
    递归预测：每次预测一步，将预测值追加到序列中再预测下一步
    适合 output_len=1 的单步预测模型
    """
    model.eval()
    sequence = list(init_sequence)
    predictions = []

    with torch.inference_mode():
        for _ in range(steps):
            x = torch.tensor(sequence[-INPUT_LEN:], dtype=torch.float32)
            x = x.unsqueeze(0).unsqueeze(-1).to(device)   # (1, input_len, 1)
            pred = model(x).item()
            predictions.append(pred)
            sequence.append(pred)

    return predictions
```

## 10. LSTM 与 GRU 对比及选型

本节对比 LSTM 和 GRU 的结构差异，并提供选型建议。

### 结构对比

| 对比项                     | LSTM                  | GRU             |
| :------------------------- | :-------------------- | :-------------- |
| 门的数量                   | 3（遗忘、输入、输出） | 2（重置、更新） |
| 状态向量                   | 细胞状态 + 隐藏状态   | 只有隐藏状态    |
| 参数量（相同 hidden_size） | 基准                  | 约 75%          |
| 训练速度                   | 较慢                  | 较快            |
| 长序列表现                 | 通常更好              | 接近            |
| 短序列表现                 | 相近                  | 相近            |
| 实现复杂度                 | 较高                  | 较低            |

### 选型建议

```
数据量小、训练资源有限
    -> 优先选 GRU，参数少，不容易过拟合，训练快

序列较长（> 100 步）、长距离依赖重要
    -> 优先选 LSTM，细胞状态更擅长保留远期信息

需要快速实验和基线对比
    -> 先用 GRU，效果差再换 LSTM

任务对准确率要求极高，有充足数据
    -> 两者都试，结合交叉验证选择

2020 年后的新项目
    -> 考虑 Transformer 架构（BERT、GPT），在大数据量下通常优于 LSTM/GRU
       LSTM/GRU 仍在边缘设备、低延迟推理、数据量较小的场景中有优势
```

### 常见问题速查

| 问题                     | 原因                       | 解决方法                                   |
| :----------------------- | :------------------------- | :----------------------------------------- |
| 训练 Loss 不下降         | 学习率过大或梯度爆炸       | 降低学习率；添加梯度裁剪 `clip_grad_norm_` |
| 验证集 Loss 远高于训练集 | 过拟合                     | 增大 Dropout；减少层数或 hidden_size       |
| 序列尾部预测差           | 梯度消失                   | 增加层数；使用双向结构；考虑注意力机制     |
| 显存占用过大             | 序列过长或 batch 过大      | 减小 seq_len 或 batch_size；使用梯度检查点 |
| 有状态训练中 Loss 异常   | 跨 batch 传递状态未 detach | 每个 batch 后调用 `h.detach_()`            |
| 双向 LSTM 拼接维度错误   | h_n 索引理解错误           | 用 `h_n[-2]`（正向）和 `h_n[-1]`（反向）   |
| PackedSequence 报错      | 序列长度未降序排列         | 设置 `enforce_sorted=False`                |
| batch_first 混淆         | 忘记统一设置               | 推荐全程使用 `batch_first=True`            |
