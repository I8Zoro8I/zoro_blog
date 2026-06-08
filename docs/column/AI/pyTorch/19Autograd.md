---
date: 2026年06月08日
---

# PyTorch Autograd 自动微分

深度学习的训练本质上是一个反复求梯度、更新参数的过程。

手动推导每一层的梯度既繁琐又容易出错，PyTorch 的 **Autograd**（自动微分）引擎正是为了解决这个问题而生——它能够**自动计算任意计算图的梯度**，让你专注于模型设计，而不是微积分推导。

------

## 核心概念

### 1、什么是自动微分

自动微分（Automatic Differentiation）不是数值微分（有限差分法），也不是符号微分（代数推导），而是通过**记录计算过程、反向逐步应用链式法则**来精确计算导数。

PyTorch 的 Autograd 采用**动态计算图**（Define-by-Run）方式：每次前向传播都会实时构建一张有向无环图（DAG），记录每个操作及其输入输出；反向传播时沿图反向遍历，依次计算各节点的梯度。

### 2、requires_grad 属性

Tensor 的 `requires_grad` 属性控制是否需要为该张量追踪梯度：

```py
import torch

# 创建一个需要追踪梯度的张量（默认 requires_grad=False）
x = torch.tensor(3.0, requires_grad=True)
print(x)              # tensor(3., requires_grad=True)
print(x.requires_grad)  # True

# 也可以在创建后修改
y = torch.tensor(2.0)
print(y.requires_grad)   # False
y.requires_grad_(True)   # 原地修改（注意末尾有下划线）
print(y.requires_grad)   # True

# 由 requires_grad=True 的张量参与运算的结果，自动继承 requires_grad=True
z = x * y
print(z.requires_grad)   # True
```

### 3、grad_fn 与计算图

每个由运算产生的张量都会记录一个 `grad_fn`，指向创建它的操作节点。这就是计算图的"骨架"：

```py
import torch

x = torch.tensor(2.0, requires_grad=True)
y = torch.tensor(3.0, requires_grad=True)

z = x ** 2 + y * 3    # z = x² + 3y

print(z)           # tensor(13., grad_fn=<AddBackward0>)
print(z.grad_fn)   # <AddBackward0 object>

# 追踪创建 z 的操作链
print(z.grad_fn.next_functions)
# ((<PowBackward0 object>, 0), (<MulBackward0 object>, 0))
# 可以看到 z 由一个幂运算和一个乘法运算组合而来
```

## backward() 反向传播

### 1、标量输出调用 backward()

对最终的标量（损失值）调用 `.backward()`，Autograd 会自动沿计算图反向计算所有叶节点的梯度，结果存入各张量的 `.grad` 属性：

```py
import torch

x = torch.tensor(2.0, requires_grad=True)
y = torch.tensor(3.0, requires_grad=True)

# 前向传播：z = x² + 3y
z = x ** 2 + y * 3

# 反向传播：自动计算 dz/dx 和 dz/dy
z.backward()

# 查看梯度
print(x.grad)   # tensor(4.)  ← dz/dx = 2x = 2×2 = 4
print(y.grad)   # tensor(3.)  ← dz/dy = 3

# 数学验证：
# z = x² + 3y
# dz/dx = 2x = 2×2 = 4  ✓
# dz/dy = 3             ✓
```

### 2、多次调用 backward() 的累积问题

Autograd 的梯度是**累积**的，不是覆盖。每次调用 `backward()`，梯度会加到 `.grad` 已有的值上。这在训练循环中是最容易踩的坑：

```py
import torch

x = torch.tensor(2.0, requires_grad=True)

# 第一次反向传播
loss = x ** 2
loss.backward()
print(x.grad)    # tensor(4.)  ← dL/dx = 2x = 4

# 第二次反向传播（没有清零！）
loss = x ** 2
loss.backward()
print(x.grad)    # tensor(8.)  ← 累积了！不是 4，而是 4+4=8

# &#x2705; 正确做法：每次反向传播前先清零
x.grad.zero_()   # 原地清零（注意下划线）
loss = x ** 2
loss.backward()
print(x.grad)    # tensor(4.)  ← 正确
```

*在训练神经网络时，必须在每次* `backward()` *之前调用* `optimizer.zero_grad()` *清零梯度，否则梯度会不断累积，导致参数更新错误。*

### 3、非标量输出调用 backward(gradient)

如果输出是一个向量或矩阵而不是标量，`backward()` 需要传入一个与输出形状相同的 `gradient` 参数（即"上游梯度"），本质上是计算向量-雅可比积（VJP）：

```py
import torch

x = torch.tensor([1.0, 2.0, 3.0], requires_grad=True)

# 前向传播：y 是向量
y = x ** 2   # y = [1, 4, 9]

# 非标量必须传入 gradient 参数（形状与 y 相同）
# gradient 可以理解为"损失对 y 的梯度"
y.backward(gradient=torch.ones_like(y))   # 假设上游梯度全为 1

print(x.grad)
# tensor([2., 4., 6.])  ← dy/dx = 2x，逐元素计算

# 如果上游梯度不是全 1（例如加权）
x.grad.zero_()
y.backward(gradient=torch.tensor([1.0, 0.5, 2.0]))  # 不同权重
# 实际计算：x.grad = 2x * gradient = [2×1, 4×0.5, 6×2]
print(x.grad)
# tensor([2., 2., 12.])

# 更常见的做法：先 sum/mean 变为标量，再 backward()
x.grad.zero_()
loss = (x ** 2).sum()   # 将向量聚合为标量
loss.backward()
print(x.grad)
# tensor([2., 4., 6.])  ← 与第一种写法等价
```

## torch.no_grad() 停止梯度追踪

在模型推理（预测）阶段，不需要计算梯度。使用 `torch.no_grad()` 可以跳过计算图的构建，显著节省内存和计算：

```py
import torch

x = torch.tensor(3.0, requires_grad=True)

# 在 no_grad 上下文中，所有运算不会被追踪梯度
with torch.no_grad():
    y = x ** 2
    print(y.requires_grad)  # False ← 不再追踪梯度
    print(y.grad_fn)        # None  ← 没有计算图节点

# 退出 no_grad 上下文后，恢复正常追踪
z = x ** 2
print(z.requires_grad)  # True

# 常见用途：模型评估时包裹整个推理过程
model = torch.nn.Linear(10, 1)
inputs = torch.randn(32, 10)

with torch.no_grad():
    outputs = model(inputs)   # 不构建计算图，速度更快，内存更省
```

### @torch.no_grad() 装饰器写法

也可以用装饰器形式，适合将整个推理函数标记为无梯度：

```py
import torch
import torch.nn as nn

model = nn.Linear(10, 1)

@torch.no_grad()
def predict(model, x):
    """推理函数，不需要计算梯度"""
    return model(x)

x = torch.randn(5, 10)
output = predict(model, x)
print(output.requires_grad)   # False
```

## detach() 从计算图中分离

`.detach()` 返回一个与原张量共享数据、但不追踪梯度的新张量。常用于以下场景：

| 场景                      | 说明                                      |
| :------------------------ | :---------------------------------------- |
| 将中间结果转为 numpy 数组 | numpy 不支持带梯度的张量，必须先 detach() |
| 记录训练损失（日志）      | 避免保存整个计算图，防止内存泄漏          |
| 冻结某部分网络的梯度传播  | GAN 训练、迁移学习等场景                  |

```py
import torch

x = torch.tensor([1.0, 2.0, 3.0], requires_grad=True)
y = x ** 2 + x * 3   # y 有 grad_fn

# detach 后的张量与 y 共享数据，但脱离计算图
y_detached = y.detach()
print(y_detached.requires_grad)  # False
print(y_detached.grad_fn)        # None

# &#x2705; 转为 numpy（带梯度的张量不能直接转）
# y.numpy()           # &#x274c; 报错：RuntimeError
y_detached.numpy()    # &#x2705; 正常

# &#x2705; 记录损失值时应 detach（避免保留计算图消耗内存）
losses = []
for i in range(3):
    loss = (x ** 2).sum()
    losses.append(loss.detach().item())  # .item() 将标量张量转为 Python float
    loss.backward()
    x.grad.zero_()

print(losses)   # [14.0, 14.0, 14.0]
```

## retain_graph 保留计算图

默认情况下，`backward()` 执行后计算图会被**自动释放**（节省内存）。如果需要对同一个计算图多次反向传播（如某些 GAN 训练），需要传入 `retain_graph=True`：

```py
import torch

x = torch.tensor(2.0, requires_grad=True)
y = x ** 3   # y = x³

# 第一次 backward（保留计算图）
y.backward(retain_graph=True)
print(x.grad)    # tensor(12.)  ← dy/dx = 3x² = 3×4 = 12

# 第二次 backward（计算图仍然存在）
x.grad.zero_()
y.backward(retain_graph=True)
print(x.grad)    # tensor(12.)  ← 同样结果

# 最后一次不再需要保留
x.grad.zero_()
y.backward()     # 此后计算图被释放
print(x.grad)    # tensor(12.)

# 再次尝试 backward 会报错（计算图已释放）
# y.backward()   # &#x274c; RuntimeError: Trying to backward through the graph a second time
```

> 不必要地使用 `retain_graph=True` 会导致内存持续增长，因为计算图无法被释放。只在确实需要多次反向传播时才使用。

------

## 梯度在神经网络训练中的应用

以下是一个完整的使用 Autograd 手动实现梯度下降的示例，展示了 Autograd 在实际训练中的完整流程：

```py
import torch

# 构造训练数据：y = 2x + 1 加噪声
torch.manual_seed(42)
X = torch.randn(100, 1)
y_true = 2 * X + 1 + 0.1 * torch.randn(100, 1)

# 初始化模型参数（需要追踪梯度）
w = torch.zeros(1, requires_grad=True)   # 权重
b = torch.zeros(1, requires_grad=True)   # 偏置

lr = 0.1    # 学习率
epochs = 50  # 训练轮数

for epoch in range(epochs):
    # 1. 前向传播：计算预测值
    y_pred = X * w + b

    # 2. 计算损失（均方误差）
    loss = ((y_pred - y_true) ** 2).mean()

    # 3. 反向传播：自动计算 d(loss)/dw 和 d(loss)/db
    loss.backward()

    # 4. 手动更新参数（用 no_grad 包裹，避免更新操作被追踪进计算图）
    with torch.no_grad():
        w -= lr * w.grad
        b -= lr * b.grad

    # 5. 清零梯度（下一轮 backward 前必须清零）
    w.grad.zero_()
    b.grad.zero_()

    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1:3d} | Loss: {loss.item():.4f} | w={w.item():.3f}, b={b.item():.3f}")

print(f"\n训练完成：w ≈ {w.item():.3f}（真实值 2.0），b ≈ {b.item():.3f}（真实值 1.0）")
```

以上代码执行结果类似如下：

```
Epoch  10 | Loss: 0.1064 | w=1.587, b=0.805
Epoch  20 | Loss: 0.0281 | w=1.876, b=0.949
Epoch  30 | Loss: 0.0152 | w=1.954, b=0.983
Epoch  40 | Loss: 0.0128 | w=1.978, b=0.993
Epoch  50 | Loss: 0.0122 | w=1.987, b=0.997

训练完成：w ≈ 1.987（真实值 2.0），b ≈ 0.997（真实值 1.0）
```

------

## 常用 API 速查表

| API                                | 作用                         | 常见场景                           |
| :--------------------------------- | :--------------------------- | :--------------------------------- |
| `tensor.requires_grad_(True)`      | 原地开启梯度追踪             | 对已创建的张量启用 Autograd        |
| `loss.backward()`                  | 反向传播，计算所有叶节点梯度 | 训练循环中的每次迭代               |
| `tensor.grad`                      | 访问张量的梯度值             | 查看或手动更新参数                 |
| `tensor.grad.zero_()`              | 原地清零梯度                 | 每次 backward() 之前必须清零       |
| `torch.no_grad()`                  | 上下文管理器，禁用梯度追踪   | 推理阶段、手动更新参数             |
| `tensor.detach()`                  | 返回脱离计算图的新张量       | 转 numpy、记录日志、冻结梯度       |
| `tensor.item()`                    | 将标量张量转为 Python 数值   | 打印损失值、记录指标               |
| `loss.backward(retain_graph=True)` | 保留计算图，允许多次反向传播 | GAN 训练等需要多次 backward 的场景 |

## 常见问题与注意事项

**1、叶节点与非叶节点的区别**

只有**叶节点**（即由用户直接创建、不是运算结果的张量）的梯度才会被保存在 `.grad` 中。中间运算产生的非叶节点默认不保留梯度（节省内存）。如果需要查看中间节点的梯度，需调用 `.retain_grad()`：

```py
import torch

x = torch.tensor(2.0, requires_grad=True)   # 叶节点

# 中间节点（非叶节点）
y = x ** 2      # y 是中间节点
y.retain_grad() # 显式声明要保留 y 的梯度

z = y * 3       # z 是最终输出
z.backward()

print(x.grad)   # tensor(12.)  ← 叶节点，正常保存
print(y.grad)   # tensor(3.)   ← 因为 retain_grad()，所以保存了
# 没有 retain_grad() 的中间节点，.grad 为 None
```

**2、原地操作（in-place）可能破坏计算图**

对需要追踪梯度的张量执行原地操作（如 `+=`、`.add_()`）可能导致 Autograd 无法正确反向传播，应尽量避免：

```py
import torch

x = torch.tensor([1.0, 2.0], requires_grad=True)

# 危险：对叶节点进行原地操作
# x += 1  # 可能报错：a leaf Variable that requires grad has been used in an in-place operation

# 安全：使用非原地操作
y = x + 1   # 创建新张量，不修改 x

# 在 no_grad 上下文中执行原地操作是安全的（如参数更新）
with torch.no_grad():
    x += 0.01   # 用于手动参数更新，这里是安全的
```

**3、只有浮点型张量支持梯度**

整数类型（如 `torch.int64`）的张量不支持 `requires_grad=True`，只有浮点类型（`float32`、`float64`、`float16`）才能参与自动微分。
