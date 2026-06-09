---
date: 2026年06月09日
---

# PyTorch 批归一化与 Dropout

批归一化（Batch Normalization）和 Dropout 是深度神经网络训练中两种最核心的正则化与稳定化技术。前者解决训练过程中的内部协变量偏移问题，让更深的网络变得可训练；后者通过随机丢弃神经元防止过拟合，增强模型泛化能力。两者通常配合使用，是现代神经网络的标配组件。

------

## 1. 批归一化（Batch Normalization）

### 1.1 基础原理

深层网络在训练时，前一层参数的微小变化会随层数加深而被不断放大，导致后续层的输入分布持续变化——这一现象称为**内部协变量偏移（Internal Covariate Shift）**。批归一化通过在每一层的输出上做标准化，强制将激活值拉回稳定的分布，从而解决这一问题。

**归一化公式：**
$$
\hat{x}_i=\frac{x_i-\mu_B}{\sqrt{\sigma_B^2+\epsilon}}
$$

$$
y_i=\gamma \hat{x}_i+\beta
$$

其中：

- *μB*、$σB2$ 是当前 batch 的均值和方差
- ϵ是防止除零的小常数（默认 `1e-5`）
- *γ*、*β* 是可学习的缩放和平移参数，让网络自行决定最终的分布形态

**批归一化带来的好处：**

- 允许使用更大的学习率，加快训练速度
- 降低初始化的敏感性，训练更稳定
- 有一定正则化效果，减轻对 Dropout 的依赖
- 缓解梯度消失/爆炸，使更深的网络可训练

------

### 1.2 BatchNorm1d / 2d / 3d

PyTorch 根据输入维度提供三个版本，使用方式完全一致，只是处理的数据形状不同。

#### BatchNorm1d：用于全连接层 / 序列数据

```py
import torch
import torch.nn as nn

# 输入形状：(N, C) 或 (N, C, L)
# N=batch_size, C=特征数/通道数, L=序列长度
bn1d = nn.BatchNorm1d(
    num_features=128,    # 特征/通道数
    eps=1e-5,            # 防止除零的小常数（默认 1e-5）
    momentum=0.1,        # 滑动平均的动量（默认 0.1）
    affine=True,         # 是否学习 gamma 和 beta（默认 True）
    track_running_stats=True,  # 是否追踪运行时均值/方差（默认 True）
)

# 全连接层后使用
x = torch.randn(32, 128)     # (batch=32, features=128)
out = bn1d(x)
print(out.shape)              # torch.Size([32, 128])

# 序列数据（如 1D 卷积后）
x_seq = torch.randn(32, 128, 50)   # (batch, channels, seq_len)
out_seq = bn1d(x_seq)
print(out_seq.shape)               # torch.Size([32, 128, 50])
```

#### BatchNorm2d：用于 CNN 图像特征图

```py
# 输入形状：(N, C, H, W)
# 对每个通道 C 独立做归一化
bn2d = nn.BatchNorm2d(num_features=64)  # 64 个通道

x = torch.randn(32, 64, 28, 28)    # (batch, channels, height, width)
out = bn2d(x)
print(out.shape)                    # torch.Size([32, 64, 28, 28])
```

#### BatchNorm3d：用于 3D 卷积（视频/医学影像）

```py
# 输入形状：(N, C, D, H, W)
bn3d = nn.BatchNorm3d(num_features=32)

x = torch.randn(4, 32, 16, 32, 32)    # (batch, channels, depth, h, w)
out = bn3d(x)
print(out.shape)                        # torch.Size([4, 32, 16, 32, 32])
```

#### 查看可学习参数

```py
bn = nn.BatchNorm2d(64)

print(f"weight (gamma) shape: {bn.weight.shape}")   # torch.Size([64])
print(f"bias   (beta)  shape: {bn.bias.shape}")     # torch.Size([64])
print(f"running_mean   shape: {bn.running_mean.shape}")  # torch.Size([64])
print(f"running_var    shape: {bn.running_var.shape}")   # torch.Size([64])

# running_mean / running_var 不是可训练参数
# 它们是推理时使用的滑动平均统计量
print(f"可训练参数数量: {sum(p.numel() for p in bn.parameters())}")  # 128（64×2）
```

#### momentum 参数的含义

```py
# PyTorch 的 momentum 与通常理解相反：
# running_mean = (1 - momentum) × running_mean + momentum × batch_mean
# 即 momentum 越大，对当前 batch 的统计量权重越大

# 默认 0.1：通常合适
# 小 batch size 时建议调小：momentum=0.01，避免统计量不稳定
bn = nn.BatchNorm2d(64, momentum=0.01)

# momentum=None：使用累积移动平均（CMA），适合非常小的 batch
bn = nn.BatchNorm2d(64, momentum=None)
```

### 1.3 LayerNorm 层归一化

对**单个样本的所有特征**做归一化，不依赖 batch，适合 batch size 小或可变的场景。**Transformer 的标配归一化方式**。

```
BatchNorm：在 batch 维度计算均值/方差（跨样本，同通道）
LayerNorm：在特征维度计算均值/方差（同样本，跨特征）
```

```py
import torch
import torch.nn as nn

# ── 用于全连接/Transformer ────────────────────────
# normalized_shape：对最后几个维度做归一化
ln = nn.LayerNorm(normalized_shape=512)

x = torch.randn(32, 10, 512)   # (batch, seq_len, embed_dim)
out = ln(x)
print(out.shape)                # torch.Size([32, 10, 512])

# ── 对多个维度归一化 ───────────────────────────────
ln_2d = nn.LayerNorm([64, 28, 28])   # 对 C, H, W 三个维度归一化
x = torch.randn(8, 64, 28, 28)
out = ln_2d(x)

# ── Transformer 中的典型用法 ──────────────────────
class TransformerBlock(nn.Module):
    def __init__(self, embed_dim, num_heads, ff_dim):
        super().__init__()
        self.attn  = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
        self.ff    = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Linear(ff_dim, embed_dim),
        )
        self.norm1 = nn.LayerNorm(embed_dim)   # ← 每个子层后归一化
        self.norm2 = nn.LayerNorm(embed_dim)

    def forward(self, x):
        attn_out, _ = self.attn(x, x, x)
        x = self.norm1(x + attn_out)            # 残差 + 归一化
        x = self.norm2(x + self.ff(x))
        return x
```

### 1.4 GroupNorm 组归一化

将通道分成若干**组**，在每组内做归一化。不依赖 batch size，在小 batch 场景（如目标检测、医学影像分割）效果优于 BatchNorm。

```py
# num_groups：将通道分成多少组（必须能整除 num_channels）
# 特殊情况：num_groups=1 等价于 LayerNorm
#           num_groups=num_channels 等价于 InstanceNorm
gn = nn.GroupNorm(
    num_groups=32,       # 分组数（常用：8, 16, 32）
    num_channels=256,    # 通道数
    eps=1e-5,
    affine=True,
)

x = torch.randn(4, 256, 56, 56)    # 小 batch（4 张图），256 通道
out = gn(x)
print(out.shape)                    # torch.Size([4, 256, 56, 56])

# GroupNorm 在 batch=1 时（如推理单张图）效果完全不受影响
x_single = torch.randn(1, 256, 56, 56)
out_single = gn(x_single)           # 完全正常工作
```

### 1.5 InstanceNorm 实例归一化

对**每个样本的每个通道**独立归一化，不涉及 batch 维度。常用于**图像风格迁移**——保留每张图自身的风格信息，不让 batch 内其他图像的统计量干扰。

```py
# InstanceNorm2d：对每个 (N, C) 上的 H×W 做归一化
in2d = nn.InstanceNorm2d(
    num_features=64,
    affine=False,    # 默认 False（不学习 gamma/beta）
)

x = torch.randn(8, 64, 128, 128)
out = in2d(x)
print(out.shape)    # torch.Size([8, 64, 128, 128])
```

### 1.6 各归一化方法对比

| 方法           | 归一化维度               | batch 依赖 | 适用场景                 |
| :------------- | :----------------------- | :--------- | :----------------------- |
| `BatchNorm`    | 跨 batch（同通道）       | 强依赖     | CNN 图像分类（大 batch） |
| `LayerNorm`    | 跨特征（同样本）         | 无依赖     | Transformer、NLP、RNN    |
| `GroupNorm`    | 组内通道（同样本）       | 无依赖     | 小 batch 目标检测、分割  |
| `InstanceNorm` | 空间维度（同样本同通道） | 无依赖     | 图像风格迁移、生成模型   |

```py
# batch_size >= 16，CNN 图像任务       → BatchNorm2d
# Transformer / BERT / GPT            → LayerNorm
# batch_size < 8，目标检测/分割        → GroupNorm(num_groups=32)
# 图像风格迁移 / CycleGAN             → InstanceNorm2d
```

## 2. Dropout

### 2.1 基础原理

Dropout 在训练时随机将某些神经元的输出置为 0（概率为 `p`），强迫网络不能依赖任何单一神经元，从而学习更鲁棒、分散的特征表示，有效防止过拟合。

**训练时：**
$$
y_i=
\begin{cases} 
0 , \text{以概率p}  \\ 
\dfrac{x_i}{1-p} , \text{以概率1-p} 
\end{cases}
$$
保留的神经元会被放大 1/(1-p) 倍，以保持期望值不变（即 Inverted Dropout）。

**推理时：** Dropout **自动关闭**，所有神经元正常参与计算，相当于多个子网络的集成平均。

```
训练时示意（p=0.5）：
输入:  [1.0,  2.0,  3.0,  4.0,  5.0]
掩码:  [ 1,    0,    1,    0,    1 ]   ← 随机生成
输出:  [2.0,  0.0,  6.0,  0.0, 10.0]  ← 保留的值乘以 1/(1-0.5)=2

推理时：
输出:  [1.0,  2.0,  3.0,  4.0,  5.0]  ← 原样输出
```

### 2.2 Dropout / Dropout2d / Dropout3d

#### Dropout：用于全连接层

```py
import torch
import torch.nn as nn

dropout = nn.Dropout(p=0.5)   # p：置零的概率

x = torch.ones(2, 10)
print("训练模式:")
dropout.train()
print(dropout(x))    # 约 50% 的值为 0，保留的值为 2.0

print("\n评估模式:")
dropout.eval()
print(dropout(x))    # 全为 1.0，Dropout 关闭
```

输出示例：

```
训练模式:
tensor([[2., 0., 2., 0., 2., 0., 0., 2., 2., 0.],
        [0., 2., 0., 2., 0., 2., 2., 0., 0., 2.]])

评估模式:
tensor([[1., 1., 1., 1., 1., 1., 1., 1., 1., 1.],
        [1., 1., 1., 1., 1., 1., 1., 1., 1., 1.]])
```

#### Dropout2d：用于 CNN 特征图（整通道丢弃）

`Dropout2d` 以通道为单位随机丢弃，即整个通道的所有空间位置一起被置零。这比逐点 Dropout 更适合卷积特征，因为相邻像素的激活值高度相关，逐点丢弃效果较弱。

```py
dropout2d = nn.Dropout2d(p=0.3)

# 输入：(N, C, H, W)
x = torch.ones(4, 16, 8, 8)    # 4 张图，16 通道
out = dropout2d(x)
print(out.shape)                # torch.Size([4, 16, 8, 8])

# 验证：整通道丢弃
# 第 0 张图的通道丢弃情况（非零 = 保留通道，全零 = 被丢弃通道）
kept_channels = (out[0].sum(dim=(1, 2)) != 0).sum().item()
print(f"第 0 张图保留了 {kept_channels}/16 个通道")
```

#### Dropout3d：用于 3D 卷积

```py
# 输入：(N, C, D, H, W)，整个 (D, H, W) 特征体被丢弃
dropout3d = nn.Dropout3d(p=0.2)
x = torch.ones(2, 8, 16, 16, 16)
out = dropout3d(x)
print(out.shape)   # torch.Size([2, 8, 16, 16, 16])
```

#### p 值的选择建议

```py
# 全连接层（隐藏层较宽）：较高 Dropout
nn.Dropout(p=0.5)     # 经典值，隐藏层标配

# 全连接层（隐藏层较窄）或小网络：较低 Dropout
nn.Dropout(p=0.2)     # 避免欠拟合

# 卷积层 Dropout2d：一般较低
nn.Dropout2d(p=0.1)   # 卷积层本身已有一定正则效果

# 分类头前的 Dropout（如 EfficientNet / ViT）
nn.Dropout(p=0.3)     # 通常在 0.2~0.5 之间

# Transformer 的注意力 / FFN Dropout
nn.Dropout(p=0.1)     # BERT 默认值，Transformer 通常较小
```

### 2.3 AlphaDropout

专为 **SELU 激活函数**设计的 Dropout 变体，在丢弃神经元后会自动调整均值和方差，保持自归一化（self-normalizing）属性。

```py
# 配合 SELU 使用（自归一化网络 SELU + AlphaDropout）
class SelfNormalizingNet(nn.Module):
    def __init__(self, in_dim, hidden_dim, num_classes):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden_dim),
            nn.SELU(),
            nn.AlphaDropout(p=0.1),   # ← 配合 SELU 使用
            nn.Linear(hidden_dim, hidden_dim),
            nn.SELU(),
            nn.AlphaDropout(p=0.1),
            nn.Linear(hidden_dim, num_classes),
        )

    def forward(self, x):
        return self.net(x)
```

> **注意：** AlphaDropout 仅在使用 SELU 激活函数时有意义，配合其他激活函数时直接用普通 Dropout。

------

## 3. 训练模式与评估模式

BatchNorm 和 Dropout 的行为在训练和评估时**完全不同**，必须正确切换，这是初学者最常见的错误之一。

### 行为差异对比

| 组件      | `model.train()`                                           | `model.eval()`                         |
| :-------- | :-------------------------------------------------------- | :------------------------------------- |
| BatchNorm | 用当前 batch 的均值/方差归一化；**更新** running_mean/var | 用 running_mean/var 归一化；**不更新** |
| Dropout   | 随机置零（按概率 p）                                      | 关闭，所有神经元正常输出               |

### 正确使用方式

```py
import torch
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(128, 256),
    nn.BatchNorm1d(256),
    nn.ReLU(),
    nn.Dropout(0.5),
    nn.Linear(256, 10),
)

# ── 训练阶段 ──────────────────────────────────────
model.train()    # ← 切换到训练模式（默认状态）

for inputs, labels in train_loader:
    optimizer.zero_grad()
    outputs = model(inputs)   # BN 用 batch 统计，Dropout 随机丢弃
    loss = criterion(outputs, labels)
    loss.backward()
    optimizer.step()

# ── 评估/验证阶段 ─────────────────────────────────
model.eval()     # ← 切换到评估模式（非常重要！）

with torch.no_grad():              # 同时关闭梯度计算
    for inputs, labels in val_loader:
        outputs = model(inputs)    # BN 用运行统计，Dropout 关闭
        # ...

# ── 推理单张图片 ──────────────────────────────────
model.eval()
with torch.inference_mode():       # 比 no_grad 更快，推理专用
    output = model(single_input.unsqueeze(0))
    pred   = output.argmax(1).item()
```

### 验证模式切换是否正确

```py
# 用这段代码验证 BN 和 Dropout 是否在正确模式下工作
x = torch.randn(8, 128)

model.train()
out_train_1 = model(x)
out_train_2 = model(x)
print("训练模式两次输出相同?", torch.allclose(out_train_1, out_train_2))
# False ← 每次 Dropout 掩码不同，输出不同（正常现象）

model.eval()
out_eval_1 = model(x)
out_eval_2 = model(x)
print("评估模式两次输出相同?", torch.allclose(out_eval_1, out_eval_2))
# True ← Dropout 关闭，BN 使用固定统计量，输出确定（正常现象）
```

## 4. 在网络中的使用位置

### BatchNorm 的放置位置

BatchNorm 的位置存在两种流派，目前均有实践：

流派一：激活函数之前（原始论文）

```py
# Conv → BN → ReLU
nn.Sequential(
  nn.Conv2d(32, 64, 3, padding=1),
  nn.BatchNorm2d(64),    # BN 在激活前
  nn.ReLU(inplace=True),
)
```

 流派二：激活函数之后（部分研究认为效果更好）

```py
# Conv → ReLU → BN
nn.Sequential(
  nn.Conv2d(32, 64, 3, padding=1),
  nn.ReLU(inplace=True),
  nn.BatchNorm2d(64),    # BN 在激活后
)
```



> **实际建议：** 遵循你所参考论文的设计；没有特殊要求时，Conv → BN → ReLU 更为主流

### Dropout 的放置位置

全连接网络:放在激活函数之后

```py
nn.Sequential(
    nn.Linear(512, 256),
    nn.ReLU(),
    nn.Dropout(0.5),         # 在 ReLU 后
    nn.Linear(256, 128),
    nn.ReLU(),
    nn.Dropout(0.5),
    nn.Linear(128, 10),      # 输出层前通常不加 Dropout
)
```

CNN:放在BN之后(如果有BN则Dropout可以省略)

```py
# 注意：BN 本身有正则效果，CNN 中若已有 BN，卷积层不必加 Dropout
# Dropout 通常只加在全连接层或分类头前
nn.Sequential(
    nn.Conv2d(64, 128, 3, padding=1),
    nn.BatchNorm2d(128),
    nn.ReLU(inplace=True),
    # 通常不在这里加 Dropout（BN 已提供正则效果）
)
```

Transformer:放在FFN和注意力层内部

```py
class FeedForward(nn.Module):
    def __init__(self, d_model, d_ff, dropout=0.1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),  # FFN 内部加 Dropout
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout),  # 输出前再加一次
        )
    def forward(self, x):
        return self.net(x)
```

### BN 与 Dropout 是否同时使用？

 全连接网络：可以同时使用

```py
nn.Sequential(
    nn.Linear(512, 256),
    nn.BatchNorm1d(256),
    nn.ReLU(),
    nn.Dropout(0.3),         # BN + Dropout 共存，常见且有效
    nn.Linear(256, 10),
)
```

卷积网络：通常二选一或仅在头部用 Dropout。

原因：BN 的归一化操作与 Dropout 可能产生"方差偏移"问题。即训练时 Dropout 改变了激活值的方差，而推理时 Dropout 关闭，导致 BN 推理时看到的统计量与训练时不一致。

**推荐做法：**

方案 A：卷积层只用 BN，全连接/分类头只用 Dropout

```py
class ConvNet(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, 3, padding=1),
            nn.BatchNorm2d(64),       # 卷积部分：只用 BN
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128, 256),
            nn.ReLU(),
            nn.Dropout(0.5),          # 全连接部分：只用 Dropout
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.features(x))
```

## 5. 完整网络实例

### 实例一：全连接分类网络（BN + Dropout）

```py
import torch
import torch.nn as nn

class MLPClassifier(nn.Module):
    """
    带 BatchNorm1d 和 Dropout 的全连接分类器
    适用于表格数据分类任务
    """
    def __init__(self, in_dim, hidden_dims, num_classes, dropout=0.5):
        super().__init__()
        layers = []
        prev_dim = in_dim

        for hidden_dim in hidden_dims:
            layers += [
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(inplace=True),
                nn.Dropout(dropout),
            ]
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, num_classes))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)


model = MLPClassifier(
    in_dim=784,
    hidden_dims=[512, 256, 128],
    num_classes=10,
    dropout=0.4
)

# 验证输出形状
x = torch.randn(32, 784)
model.eval()
print(model(x).shape)   # torch.Size([32, 10])
```

### 实例二：CNN 图像分类（BN 为主）

```py
class ConvBNBlock(nn.Module):
    """标准卷积块：Conv → BN → ReLU"""
    def __init__(self, in_ch, out_ch, stride=1):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, stride=stride, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),    # bias=False：BN 的 beta 已起偏置作用
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.block(x)


class SmallCNN(nn.Module):
    """用于 CIFAR-10 的小型 CNN"""
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            ConvBNBlock(3, 32),               # 32×32 → 32×32
            ConvBNBlock(32, 64, stride=2),    # 32×32 → 16×16
            ConvBNBlock(64, 128, stride=2),   # 16×16 → 8×8
            ConvBNBlock(128, 256, stride=2),  # 8×8 → 4×4
            nn.AdaptiveAvgPool2d(1),          # 4×4 → 1×1
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.5),                  # 只在全连接层用 Dropout
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.features(x))


model = SmallCNN(num_classes=10)
x = torch.randn(16, 3, 32, 32)
model.eval()
print(model(x).shape)   # torch.Size([16, 10])
```

### 实例三：完整训练循环

```py
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
EPOCHS = 50

model     = SmallCNN(num_classes=10).to(DEVICE)
criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
scheduler = CosineAnnealingLR(optimizer, T_max=EPOCHS)

def run_epoch(model, loader, optimizer=None, train=True):
    if train:
        model.train()    # ← BN 用 batch 统计，Dropout 激活
    else:
        model.eval()     # ← BN 用 running 统计，Dropout 关闭

    total_loss, correct = 0.0, 0

    ctx = torch.enable_grad() if train else torch.no_grad()
    with ctx:
        for imgs, labels in loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)

            if train:
                optimizer.zero_grad()

            outputs = model(imgs)
            loss    = criterion(outputs, labels)

            if train:
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * imgs.size(0)
            correct    += (outputs.argmax(1) == labels).sum().item()

    n = len(loader.dataset)
    return total_loss / n, correct / n


best_acc = 0.0
for epoch in range(1, EPOCHS + 1):
    train_loss, train_acc = run_epoch(model, train_loader, optimizer, train=True)
    val_loss,   val_acc   = run_epoch(model, val_loader,   train=False)
    scheduler.step()

    print(f"Epoch {epoch:2d}/{EPOCHS} | "
          f"Train {train_loss:.4f}/{train_acc:.4f} | "
          f"Val {val_loss:.4f}/{val_acc:.4f}")

    if val_acc > best_acc:
        best_acc = val_acc
        torch.save(model.state_dict(), 'best.pth')
```

## 6. 超参数调优指南

### BatchNorm 参数调优

```py
# ── momentum（最常需要调整的参数）─────────────────
# 默认值 0.1 在大多数情况下有效

# batch_size 很小（< 8）→ 统计量不稳定 → 减小 momentum
nn.BatchNorm2d(64, momentum=0.01)

# 训练步数很多、数据分布平稳 → 可以适当增大 momentum
nn.BatchNorm2d(64, momentum=0.2)

# ── affine=False（不学习 gamma/beta）──────────────
# 极少使用，通常保持默认 True
# 除非明确不希望 BN 改变特征的缩放和偏移
nn.BatchNorm2d(64, affine=False)

# ── track_running_stats=False ──────────────────────
# 每次推理也用当前 batch 统计（训练和推理行为一致）
# 适合在线学习、流数据等特殊场景
nn.BatchNorm2d(64, track_running_stats=False)
```

### Dropout 调优策略

```py
# ── 根据过拟合程度调整 p ───────────────────────────
# 训练 acc 远高于验证 acc（严重过拟合） → 增大 p
# 训练 acc 与验证 acc 接近但都偏低（欠拟合） → 减小 p 或去掉 Dropout

# ── 推荐的 p 值参考 ───────────────────────────────
p_values = {
    '大型全连接隐藏层（> 1024）': 0.5,
    '中型全连接隐藏层（256~1024）': 0.3,
    '小型全连接隐藏层（< 256）': 0.2,
    'CNN 卷积层（Dropout2d）': 0.1,
    '分类头前': 0.3,
    'Transformer FFN': 0.1,
    'Transformer 注意力': 0.1,
}

# ── 动态 Dropout（随训练进程调整）──────────────────
# 某些实践中，训练初期 p 较小，后期增大（模型越来越复杂时加强正则）
class DynamicDropoutNet(nn.Module):
    def __init__(self, initial_p=0.1):
        super().__init__()
        self.dropout = nn.Dropout(initial_p)
        self.fc = nn.Linear(256, 10)

    def set_dropout(self, p):
        self.dropout.p = p

    def forward(self, x):
        return self.fc(self.dropout(x))

model = DynamicDropoutNet(initial_p=0.1)
# 训练到中期，增大 Dropout
model.set_dropout(0.4)
```

## 7. 常见错误与注意事项

### 错误一：忘记切换 eval() 模式

```py
# 错误：评估时没有调用 model.eval()
model.train()   # 默认状态
for imgs, labels in val_loader:
    with torch.no_grad():
        outputs = model(imgs)   # Dropout 仍然随机丢弃！BN 仍在更新！
        # 结果不确定，准确率虚低，且污染了 running_mean/var
        
        
# 正确：评估前明确切换模式
model.eval()
with torch.no_grad():
    outputs = model(imgs)    # 确定性输出
```

### 错误二：Conv 层加了 bias 又接 BN

```py
# 多余：Conv 的 bias 会被 BN 的 beta 抵消，浪费参数
nn.Conv2d(64, 128, 3, padding=1, bias=True),   # 默认 True
nn.BatchNorm2d(128),

# 正确：Conv 接 BN 时，关闭 bias
nn.Conv2d(64, 128, 3, padding=1, bias=False),  # ← bias=False
nn.BatchNorm2d(128),
```

### 错误三：batch size=1 时使用 BatchNorm

```py
# 错误：batch=1 时 BN 无法计算方差，训练时会出现 NaN 或 inf
# 单样本推理没问题（使用 running stats），但单样本训练会崩溃
model.train()
x = torch.randn(1, 64, 32, 32)
out = bn2d(x)    # ← 训练模式下 batch=1 会报错或产生 NaN

# 解决方案一：使用 GroupNorm 替代
nn.GroupNorm(num_groups=32, num_channels=64)

# 解决方案二：使用 LayerNorm
nn.LayerNorm([64, 32, 32])

# 解决方案三：推理时切换 eval()，不影响 BN
model.eval()
out = bn2d(x)    # 推理模式下 batch=1 完全正常
```

### 错误四：Dropout 导致 BN 的方差偏移

```py
# 问题：Dropout 在训练时改变激活值的方差
# 推理时 Dropout 关闭，BN 用训练时的 running_var（含 Dropout 影响）
# 统计量不匹配，推理结果有偏差
nn.Sequential(
    nn.Conv2d(64, 128, 3),
    nn.Dropout2d(0.5),        # ← 在卷积层用 Dropout
    nn.BatchNorm2d(128),      # ← BN 看到的方差被 Dropout 改变了
)


# 方案一：BN 在前，Dropout 在后
nn.Sequential(
    nn.Conv2d(64, 128, 3),
    nn.BatchNorm2d(128),      # 先 BN（不受 Dropout 影响）
    nn.ReLU(),
    nn.Dropout2d(0.1),        # 后 Dropout
)

# 方案二：卷积层只用 BN，全连接层只用 Dropout（最推荐）
```

### 错误五：在冻结的 BN 层忘记改为 eval 模式

```py
# 迁移学习中，冻结主干时，预训练 BN 的 running stats 不应被更新
# 否则新数据分布会污染预训练的统计量

# 错误：冻结参数，但 BN 的 running_mean/var 仍在更新
model = models.resnet50(weights='IMAGENET1K_V2')
for param in model.parameters():
    param.requires_grad = False   # 仅冻结可学习参数，BN 统计量仍更新
    
    
# 正确方案：将主干的 BN 层也切换为 eval 模式
def freeze_bn(model):
    for module in model.modules():
        if isinstance(module, (nn.BatchNorm1d, nn.BatchNorm2d, nn.BatchNorm3d)):
            module.eval()              # 固定 running_mean/var
            for param in module.parameters():
                param.requires_grad = False

model = models.resnet50(weights='IMAGENET1K_V2')
freeze_bn(model)          # 冻结所有 BN
model.fc = nn.Linear(model.fc.in_features, 10)  # 只有新 FC 层可训练
```

### 快速诊断清单

| 现象                   | 可能原因                | 检查项                      |
| :--------------------- | :---------------------- | :-------------------------- |
| 验证 loss 忽高忽低     | 忘记 `model.eval()`     | 确认评估前调用 `eval()`     |
| 训练/验证 acc 差距极大 | Dropout `p` 过大        | 尝试减小 `p` 或去掉 Dropout |
| 训练 NaN/inf           | batch=1 用了 BatchNorm  | 换 GroupNorm 或 LayerNorm   |
| 迁移学习效果差         | BN running stats 被污染 | 主干 BN 层调用 `eval()`     |
| 模型推理结果不稳定     | 推理时没切 `eval()`     | 推理前必须 `model.eval()`   |
| Conv 参数量偏多        | Conv+BN 未关 bias       | 设置 `bias=False`           |
