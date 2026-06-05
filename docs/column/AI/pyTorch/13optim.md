---
date: 2026年06月05日
---

# PyTorch torch.optim 优化器模块

优化器是深度学习中的核心组件，负责根据损失函数的梯度调整模型参数，使模型能够逐步逼近最优解。

在 PyTorch 中，torch.optim 模块提供了多种优化算法的实现，是训练神经网络不可或缺的工具。

------

## 为什么需要优化器

优化器在深度学习中扮演着至关重要的角色，它解决了手动更新参数的繁琐问题。

- **自动化参数更新**：手动计算和更新每个参数非常繁琐，优化器自动完成这一工作
- **加速收敛**：使用优化算法比普通梯度下降更快找到最优解
- **避免局部最优**：某些优化器具有跳出局部最优的能力

## 常见优化器类型

不同优化器适用于不同场景，选择合适的优化器可以显著提升训练效果。

| 优化器名称 | 主要特点            | 适用场景                |
| :--------- | :------------------ | :---------------------- |
| SGD        | 简单基础，可带动量  | 基础教学、简单模型、CNN |
| Adam       | 自适应学习率        | 大多数深度学习任务      |
| AdamW      | Adam + 权重衰减分离 | 需要 L2 正则化的任务    |
| RMSprop    | 自适应学习率        | RNN 网络、语音识别      |
| Adagrad    | 参数独立学习率      | 稀疏数据、文本处理      |
| Adadelta   | 自适应学习率        | 长期训练任务            |

------

## 优化器核心 API

掌握优化器的基本使用流程是深度学习的第一步。

### 基本使用流程

优化器的使用遵循固定模式：创建实例 → 清空梯度 → 反向传播 → 更新参数。

```py
import torch
import torch.nn as nn
import torch.optim as optim

# 1. 定义一个简单的模型
class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(784, 10)

    def forward(self, x):
        return self.fc(x)

model = SimpleNet()

# 2. 创建优化器实例
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 3. 训练循环
for epoch in range(epochs):
    # 前向传播
    outputs = model(inputs)
    loss = criterion(outputs, labels)

    # 反向传播
    optimizer.zero_grad()  # 清空梯度缓存，避免梯度累积
    loss.backward()        # 计算梯度

    # 参数更新
    optimizer.step()       # 更新参数
```

### 关键方法说明

优化器提供了几个核心方法来管理参数更新过程。

- **zero_grad(set_to_none=True)**：清空参数的梯度缓存。设置为 True 时会将梯度设为 None，比设为 0 更节省显存
- **step()**：执行单次参数更新，根据梯度和学习率更新模型参数
- **state_dict()**：获取优化器状态字典，可用于保存检查点
- **load_state_dict(state_dict)**：加载优化器状态，用于恢复训练
- **add_param_group(param_group)**：动态添加参数组

> 注意：必须在每次反向传播前调用 zero_grad()，否则梯度会累积，导致训练不稳定。建议使用 zero_grad(set_to_none=True) 以节省显存。

### 保存和加载优化器状态

在恢复训练时，需要同时保存模型和优化器的状态。

```py
# 保存检查点（同时保存模型、优化器和调度器）
checkpoint = {
    'epoch': epoch,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'scheduler_state_dict': scheduler.state_dict(),
    'loss': loss,
}
torch.save(checkpoint, 'checkpoint.pth')

# 加载检查点
checkpoint = torch.load('checkpoint.pth')
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
start_epoch = checkpoint['epoch'] + 1
```

## 常用优化器详解

### SGD（随机梯度下降）

SGD 是最基础的优化算法，通过计算单个样本或小批量样本的梯度来更新参数。它是深度学习优化的基石，很多高级优化器都是在 SGD 基础上发展而来。

```py
# SGD 优化器参数说明
# params: 要优化的参数（通常来自 model.parameters()）
# lr: 学习率，控制参数更新的步长，默认 0.01
# momentum: 动量因子，用于加速收敛和减少震荡，默认 0
# weight_decay: L2 正则化系数，用于防止过拟合，默认 常用值 1e-4
# dampening: 动量阻尼，控制动量项的计算，默认 0
# nesterov: 是否使用 Nesterov 动量，默认 False
optimizer = optim.SGD(
    params=model.parameters(),
    lr=0.01,           # 学习率
    momentum=0.9,      # 动量因子
    weight_decay=1e-4, # L2 正则化
    nesterov=True      # 启用 Nesterov 动量
)
```

**特点：**

- 实现简单，是深度学习优化的基础算法
- 添加动量项可以加速收敛，提高训练稳定性
- 收敛速度较慢，但最终精度可能更高
- 适合作为基准与其他优化器比较

> SGD 虽然简单，但在合适的超参数下往往能达到很好的效果，是学习优化算法的良好起点。在图像分类任务中，SGD 配合动量仍是主流选择。

### Adam（自适应矩估计）

Adam 是目前最常用的优化器之一，结合了动量和自适应学习率的优点。它通过计算梯度的一阶和二阶矩估计来自适应调整每个参数的学习率。

```py
# Adam 优化器参数说明
# params: 要优化的参数
# lr: 学习率，默认 0.001（推荐值）
# betas: 用于计算梯度和梯度平方的移动平均系数 (beta1, beta2)
#         beta1 控制一阶矩估计（动量），默认 0.9
#         beta2 控制二阶矩估计（方差），默认 0.999
# eps: 数值稳定项，防止除零错误，默认 1e-8
# weight_decay: L2 正则化系数，默认 0
# amsgrad: 是否使用 AMSGrad 变体，默认 False
optimizer = optim.Adam(
    params=model.parameters(),
    lr=0.001,                      # 推荐使用较小的学习率
    betas=(0.9, 0.999),            # 常用的动量参数
    eps=1e-8,                      # 数值稳定项
    weight_decay=1e-4,             # L2 正则化
    amsgrad=False                  # 是否使用 AMSGrad
)
```

### Adam（自适应矩估计）

Adam 是目前最常用的优化器之一，结合了动量和自适应学习率的优点。它通过计算梯度的一阶和二阶矩估计来自适应调整每个参数的学习率。

```py
# Adam 优化器参数说明
# params: 要优化的参数
# lr: 学习率，默认 0.001（推荐值）
# betas: 用于计算梯度和梯度平方的移动平均系数 (beta1, beta2)
#         beta1 控制一阶矩估计（动量），默认 0.9
#         beta2 控制二阶矩估计（方差），默认 0.999
# eps: 数值稳定项，防止除零错误，默认 1e-8
# weight_decay: L2 正则化系数，默认 0
# amsgrad: 是否使用 AMSGrad 变体，默认 False
optimizer = optim.Adam(
    params=model.parameters(),
    lr=0.001,                      # 推荐使用较小的学习率
    betas=(0.9, 0.999),            # 常用的动量参数
    eps=1e-8,                      # 数值稳定项
    weight_decay=1e-4,             # L2 正则化
    amsgrad=False                  # 是否使用 AMSGrad
)
```

**特点：**

- 自适应学习率：根据参数的历史梯度自动调整学习率
- 结合动量概念：利用一阶矩估计加速收敛
- 鲁棒性强：对超参数选择相对不敏感
- 收敛速度快，适合快速原型开发

> Adam 是大多数深度学习任务的默认选择，但在某些特定场景（如 GAN、强化学习）下可能需要尝试其他优化器。

### AdamW（Adam with Weight Decay）

AdamW 是 Adam 的改进版，将权重衰减与梯度更新解耦，理论上更利于收敛。在实际应用中，AdamW 通常比 Adam 效果更好。

```py
# AdamW 优化器
# 与 Adam 的主要区别：weight_decay 的实现方式不同
# AdamW 的权重衰减更正确，不会影响梯度的计算
optimizer = optim.AdamW(
    params=model.parameters(),
    lr=0.001,
    betas=(0.9, 0.999),
    weight_decay=0.01,    # 权重衰减系数，通常比 Adam 设置更大
    amsgrad=False
)

# 推荐的配置：AdamW 通常使用 0.01 的 weight_decay
# 而 Adam 通常使用 0.001
```

> 如果你的任务需要使用权重衰减（L2 正则化），强烈推荐使用 AdamW 而不是 Adam。

### RMSprop

RMSprop 是一种自适应学习率优化器，特别适合处理非平稳目标和循环神经网络。

```py
# RMSprop 优化器
# 通过除以梯度的指数加权平均来归一化学习率
optimizer = optim.RMSprop(
    params=model.parameters(),
    lr=0.01,               # 学习率
    alpha=0.99,            # 平方梯度的指数衰减率
    eps=1e-8,              # 数值稳定项
    weight_decay=0,        # L2 正则化
    momentum=0,            # 动量因子
    centered=False         # 是否对梯度进行中心化
)
```

### Adagrad

Adagrad 适合处理稀疏数据，它会为每个参数自适应调整学习率。

```py
# Adagrad 优化器
# 适合稀疏数据的优化，会对频繁更新的参数使用较小的学习率
optimizer = optim.Adagrad(
    params=model.parameters(),
    lr=0.01,               # 学习率
    lr_decay=0,            # 学习率衰减
    weight_decay=0,       # L2 正则化
    initial_accumulator_value=0  # 初始累积值
)
```

## 优化器高级技巧

### 学习率调度

学习率调度允许在训练过程中动态调整学习率，通常可以显著提升模型收敛效果。

```py
from torch.optim.lr_scheduler import (
    StepLR,                # 步进衰减
    MultiStepLR,           # 多里程碑衰减
    ExponentialLR,         # 指数衰减
    CosineAnnealingLR,     # 余弦退火
    ReduceLROnPlateau,     # 基于指标自动调整
)

# 方式一：StepLR - 每 30 个 epoch 衰减一次
optimizer = optim.SGD(model.parameters(), lr=0.1)
scheduler = StepLR(optimizer, step_size=30, gamma=0.1)

# 方式二：MultiStepLR - 在指定 epoch 衰减
optimizer = optim.SGD(model.parameters(), lr=0.1)
scheduler = MultiStepLR(optimizer, milestones=[30, 60, 80], gamma=0.1)

# 方式三：CosineAnnealingLR - 余弦曲线退火
optimizer = optim.Adam(model.parameters(), lr=0.001)
scheduler = CosineAnnealingLR(optimizer, T_max=50, eta_min=1e-6)

# 方式四：ReduceLROnPlateau - 监控指标自动调整
optimizer = optim.Adam(model.parameters(), lr=0.001)
scheduler = ReduceLROnPlateau(
    optimizer, mode='min',     # 监控 loss
    factor=0.5,                 # 衰减系数
    patience=5,                 # 等待 epoch 数
    verbose=True                # 打印信息
)

# 训练循环
for epoch in range(100):
    train_loss = train(...)
    val_loss = validate(...)

    # StepLR 等调度器
    scheduler.step()

    # ReduceLROnPlateau 需要传入监控的指标
    scheduler.step(val_loss)
```

*学习率调度器需要与优化器配合使用，step() 必须在 optimizer.step() 之后调用，否则可能导致学习率更新异常。*

### 参数分组优化

参数分组允许为不同层设置不同的学习率，这在迁移学习中特别有用。

```py
# 参数分组优化示例
# 为不同层设置不同的学习率
# 通常：主干网络使用较小学习率，分类头使用较大学习率
optimizer = optim.SGD([
    {'params': model.base.parameters(), 'lr': 1e-3},      # 基础层：大学习率
    {'params': model.classifier.parameters(), 'lr': 1e-2} # 分类层：大学习率
], lr=1e-4)  # 全局默认学习率（未指定参数组时使用）

# 实际应用中更常见的写法
optimizer = optim.Adam([
    {'params': model.fc.parameters(), 'lr': 1e-3},       # 分类头
    {'params': [p for n, p in model.named_parameters()    # 主干网络
                if not n.startswith('fc')],
     'lr': 1e-5},
])
```

### 梯度裁剪

梯度裁剪可以防止梯度爆炸，提高训练稳定性。特别是在 RNN、LSTM 等深层网络中非常有用。

```py
import torch.nn as nn

# 梯度裁剪示例
# max_norm: 梯度的最大范数，超过此值的梯度会被缩放
# norm_type: 范数类型，默认为 2（二范数）
nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

# 在训练循环中的使用位置
for epoch in range(epochs):
    optimizer.zero_grad()
    outputs = model(inputs)
    loss = criterion(outputs, labels)
    loss.backward()

    # 在 loss.backward() 之后，optimizer.step() 之前裁剪梯度
    nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

    optimizer.step()

# 梯度裁剪的另一种方式：按值裁剪
for param in model.parameters():
    if param.grad is not None:
        param.grad.data.clamp_(min=-1.0, max=1.0)
```

> 梯度裁剪是训练深度神经网络（尤其是 RNN、LSTM 等）的常用技巧，可以有效防止梯度爆炸导致的训练崩溃。

### 梯度累积

当显存不足时，可以通过梯度累积来模拟大 batch size 的训练效果。

```py
# 梯度累积示例
# 实际 batch_size = batch_size * accumulation_steps
accumulation_steps = 4   # 累积 4 个小 batch

optimizer.zero_grad()

for i, (inputs, labels) in enumerate(train_loader):
    outputs = model(inputs)
    loss = criterion(outputs, labels)

    # 将损失除以累积步数，实现平均
    loss = loss / accumulation_steps
    loss.backward()

    # 每累积指定步数后更新一次参数
    if (i + 1) % accumulation_steps == 0:
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        optimizer.zero_grad()

# 处理剩余的梯度
if (i + 1) % accumulation_steps != 0:
    optimizer.step()
    optimizer.zero_grad()
```

## 完整训练示例

以下是一个完整的训练流程，展示了优化器的最佳实践。

```py
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR

# 配置
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
EPOCHS = 100
BATCH_SIZE = 32
LR = 1e-3

# 创建模型并移动到设备
model = SimpleNet().to(DEVICE)

# 损失函数和优化器
criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=LR, weight_decay=0.01)

# 学习率调度器（余弦退火）
scheduler = CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-6)

# 训练循环
best_acc = 0.0
for epoch in range(EPOCHS):
    model.train()
    total_loss = 0.0
    correct = 0

    for inputs, labels in train_loader:
        inputs = inputs.to(DEVICE)
        labels = labels.to(DEVICE)

        # 清空梯度（推荐使用 set_to_none=True）
        optimizer.zero_grad(set_to_none=True)

        # 前向传播
        outputs = model(inputs)
        loss = criterion(outputs, labels)

        # 反向传播
        loss.backward()

        # 梯度裁剪（防止梯度爆炸）
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

        # 更新参数
        optimizer.step()

        # 统计
        total_loss += loss.item()
        correct += (outputs.argmax(1) == labels).sum().item()

    # 更新学习率
    scheduler.step()

    # 打印训练信息
    avg_loss = total_loss / len(train_loader)
    accuracy = correct / len(train_loader.dataset)
    current_lr = scheduler.get_last_lr()[0]
    print(f"Epoch {epoch+1}/{EPOCHS} | Loss: {avg_loss:.4f} | "
          f"Acc: {accuracy:.4f} | LR: {current_lr:.6f}")

    # 保存最佳模型
    if accuracy > best_acc:
        best_acc = accuracy
        torch.save({
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'scheduler_state_dict': scheduler.state_dict(),
            'best_acc': best_acc,
        }, 'best_model.pth')

print(f"训练完成，最佳准确率: {best_acc:.4f}")
```

## 优化器选择指南

选择合适的优化器需要根据具体任务、数据特点和训练阶段来决定。

### 按任务选择

不同任务类型有不同的优化器推荐。

| 任务类型          | 推荐优化器          | 推荐学习率     | 备注           |
| :---------------- | :------------------ | :------------- | :------------- |
| 图像分类（CNN）   | SGD + Momentum      | 0.01 ~ 0.1     | 收敛慢但精度高 |
| 图像分类（CNN）   | AdamW               | 0.001          | 收敛快         |
| NLP / Transformer | AdamW               | 1e-5 ~ 1e-4    | 较小学习率     |
| RNN / LSTM        | RMSprop / Adam      | 0.001          | 自适应学习率   |
| GAN               | Adam (G) / Adam (D) | 0.0001         | 较小学习率     |
| 强化学习          | Adam / RMSprop      | 0.0001 ~ 0.001 | 视具体任务     |
| 快速实验          | Adam / AdamW        | 0.001          | 收敛快         |

### 性能对比

| 优化器         | 收敛速度 | 内存占用 | 超参数敏感度 | 最终精度 |
| :------------- | :------- | :------- | :----------- | :------- |
| SGD + Momentum | 慢       | 低       | 高           | 高       |
| Adam           | 快       | 中       | 低           | 中       |
| AdamW          | 快       | 中       | 低           | 高       |
| RMSprop        | 中       | 中       | 中           | 中       |
| Adagrad        | 中       | 高       | 中           | 低       |

### 常见问题与解决

- 训练不稳定（Loss 震荡）：降低学习率，添加梯度裁剪
- 收敛太慢：使用 Adam 或 AdamW，增加学习率
- 过拟合：增加 weight_decay，使用正则化
- 显存不足：减小 batch_size，使用梯度累积

> 优化器的选择不是绝对的，建议从 Adam 或 AdamW 开始尝试，如果效果不佳再考虑其他优化器。对于特定任务，可能需要通过实验来确定最优选择。

如果需要更详细的信息，可以参考 [PyTorch 官方文档](https://pytorch.org/docs/stable/optim.html)。
