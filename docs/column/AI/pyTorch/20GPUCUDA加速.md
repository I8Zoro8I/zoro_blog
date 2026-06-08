---
date: 2026年06月08日
---

# PyTorch GPU / CUDA 加速

深度学习的核心操作是大规模矩阵乘法与元素运算。CPU 的设计目标是处理复杂的串行逻辑，核心数通常为 8~64 个；而 GPU 拥有数千个简单并行核心，天然适合这类高度并行的数值计算。PyTorch 通过 NVIDIA 的 **CUDA**（Compute Unified Device Architecture）框架调用 GPU，可将训练速度提升数十倍乃至百倍。

------

## 1. CPU 与 GPU 的差异

GPU 训练速度的提升主要来自两方面：其一是并行执行大量相同计算；其二是高带宽显存使得数据搬运速度远快于 CPU 内存。

对于矩阵乘法这类运算密集型操作，加速效果尤为显著。

| 对比项       | CPU            | GPU（NVIDIA）              |
| :----------- | :------------- | :------------------------- |
| 核心数量     | 8~64 个大核心  | 数千个小核心（CUDA Cores） |
| 设计目标     | 低延迟串行处理 | 高吞吐并行计算             |
| 内存带宽     | ~50~100 GB/s   | ~500~3000 GB/s             |
| 矩阵乘法速度 | 基准           | 快 10x~100x                |
| PyTorch 接口 | `"cpu"`        | `"cuda"`                   |

如果使用 Apple Silicon（M1/M2/M3），PyTorch 通过 `mps` 后端支持 Metal GPU 加速，用法与 CUDA 几乎完全相同，只需将设备改为 `"mps"`。

------

## 2. 检测 CUDA 环境

使用 GPU 前，需要先确认当前环境是否安装了支持 CUDA 的 PyTorch。

同时需要检查系统上是否存在可用的 GPU 设备。

```py
import torch

# 是否支持 CUDA
print("CUDA 可用:", torch.cuda.is_available())

# GPU 设备数量
print("GPU 数量:", torch.cuda.device_count())

# 当前默认 GPU 的索引
print("当前 GPU:", torch.cuda.current_device())

# GPU 型号名称
print("GPU 型号:", torch.cuda.get_device_name(0))

# PyTorch 版本与编译时绑定的 CUDA 版本
print("PyTorch 版本:", torch.__version__)
print("CUDA 版本:", torch.version.cuda)


#mac
import torch
import platform

print(f"操作系统: {platform.system()} {platform.release()}")
print(f"PyTorch 版本: {torch.__version__}")

# 1. 检查 NVIDIA CUDA (Mac 必然为 False)
print("-" * 30)
print("CUDA 可用 (NVIDIA GPU):", torch.cuda.is_available())

# 2. 检查 Apple Silicon/Metal 加速 (Mac 用户看这里)
has_mps = torch.backends.mps.is_available()
print("MPS 可用 (Apple GPU):", has_mps)

if has_mps:
    print("设备类型: Apple Silicon (Metal)")
    # MPS 设备不需要索引，直接使用 torch.device("mps")
else:
    print("设备类型: CPU")
    
#动态选择设备（推荐写法）
import torch

# 动态获取设备：优先使用 CUDA，如果没有则使用 MPS，最后才使用 CPU
if torch.cuda.is_available():
    device = torch.device("cuda")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")

print(f"当前使用的设备: {device}")

# 示例：将张量移动到当前设备
x = torch.tensor([1.0, 2.0]).to(device)
print(x)
```

## 3. 张量在设备间移动

PyTorch 中的张量默认在 CPU 上创建。

要使用 GPU 计算，需要显式将张量移动到 GPU，或直接在 GPU 上创建。

### 3.1 基本移动方法

```py
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 创建 CPU 张量
cpu_tensor = torch.tensor([1.0, 2.0, 3.0])
print(cpu_tensor.device)   # cpu

# 方式一：.to(device) —— 推荐，通用性最好
gpu_tensor = cpu_tensor.to(device)

# 方式二：.cuda() —— 仅限 CUDA 环境
gpu_tensor = cpu_tensor.cuda()

# 方式三：创建时直接指定设备
gpu_tensor = torch.tensor([1.0, 2.0, 3.0], device=device)
gpu_tensor = torch.randn(3, 4, device=device)

# 移回 CPU（用于打印、numpy 转换、保存等操作）
back_to_cpu = gpu_tensor.cpu()

print(gpu_tensor.device)    # cuda:0
print(back_to_cpu.device)   # cpu
```

GPU 张量转 numpy 时，必须先移回 CPU，且若张量附带梯度还需先 detach：

```py
# 普通 GPU 张量转 numpy
arr = gpu_tensor.cpu().numpy()

# 带梯度的 GPU 张量转 numpy
arr = gpu_tensor.detach().cpu().numpy()
```

### 3.2 设备一致性约束

不同设备上的张量不能直接参与同一运算。

否则会抛出 `RuntimeError`：

```py
a = torch.randn(3).to("cuda")
b = torch.randn(3)           # 在 CPU 上

# c = a + b    # RuntimeError: Expected all tensors to be on the same device

# 正确做法：先统一设备
c = a + b.to("cuda")
```

查看张量所在设备：

```py
x = torch.randn(3, 4).to(device)

print(x.device)           # cuda:0
print(x.is_cuda)          # True
print(x.get_device())     # 0（GPU 索引）
```

### 3.3 速度对比验证

```py
import torch
import time

device = torch.device("cuda")
n = 5000

# CPU 矩阵乘法
a_cpu = torch.randn(n, n)
b_cpu = torch.randn(n, n)
start = time.time()
c_cpu = torch.matmul(a_cpu, b_cpu)
print(f"CPU 耗时: {time.time() - start:.3f}s")

# GPU 矩阵乘法
a_gpu = a_cpu.to(device)
b_gpu = b_cpu.to(device)
torch.cuda.synchronize()    # 确保数据已传输完毕再开始计时
start = time.time()
c_gpu = torch.matmul(a_gpu, b_gpu)
torch.cuda.synchronize()    # 等待 GPU 执行完毕再停止计时
print(f"GPU 耗时: {time.time() - start:.3f}s")
```

*GPU 计算是***异步执行***的——Python 调用返回后，GPU 上的运算可能尚未完成。计时时必须调用* `torch.cuda.synchronize()` *等待 GPU 真正结束，否则测量结果不准确。*

## 4. 模型移动到 GPU

模型的所有参数（`weight`、`bias`）本质上也是张量。

这些参数同样需要移动到 GPU 才能在 GPU 上执行前向传播和反向传播。

对整个模型调用 `.to(device)` 即可，PyTorch 会自动遍历并移动所有内部参数。

```py
import torch
import torch.nn as nn

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(784, 256),
            nn.ReLU(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 10),
        )

    def forward(self, x):
        return self.net(x)

# 模型移动到 GPU，只需调用一次
model = SimpleNet().to(device)

# 验证参数是否都在 GPU 上
for name, param in model.named_parameters():
    print(f"{name}: {param.device}")
# net.0.weight: cuda:0
# net.0.bias:   cuda:0
# ...

# 输入数据也必须在相同设备上
x = torch.randn(32, 784).to(device)
output = model(x)
print(output.shape)   # torch.Size([32, 10])
```

> 模型在 GPU 上，但输入数据仍在 CPU 上时，前向传播会报错。务必在 DataLoader 读取每个 batch 之后，将 `inputs` 和 `labels` 都调用 `.to(device)`。

------

## 5. 完整训练流程

以下是一个包含数据加载、模型训练、验证评估的标准 GPU 训练模板。

```py
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

# 1. 设备配置
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"训练设备: {device}")

# 2. 数据加载
# pin_memory=True：将数据锁定在内存，加快 CPU -> GPU 传输
# num_workers：多进程预加载，减少数据等待时间
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,)),
])
train_dataset = datasets.MNIST(root="./data", train=True,
                                download=True, transform=transform)
test_dataset  = datasets.MNIST(root="./data", train=False,
                                download=True, transform=transform)

train_loader = DataLoader(train_dataset, batch_size=256, shuffle=True,
                          num_workers=4, pin_memory=True)
test_loader  = DataLoader(test_dataset,  batch_size=256, shuffle=False,
                          num_workers=4, pin_memory=True)

# 3. 定义模型
class CNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 7 * 7, 256), nn.ReLU(), nn.Dropout(0.5),
            nn.Linear(256, 10),
        )

    def forward(self, x):
        return self.classifier(self.features(x))

model     = CNN().to(device)     # 模型移到 GPU
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)

# 4. 训练函数
def train_epoch(model, loader, optimizer, criterion):
    model.train()
    total_loss, correct = 0.0, 0
    for inputs, labels in loader:
        # non_blocking=True：异步传输，CPU 可以继续准备下一批数据
        inputs = inputs.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss    = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item() * inputs.size(0)
        correct    += (outputs.argmax(1) == labels).sum().item()

    n = len(loader.dataset)
    return total_loss / n, correct / n

# 5. 验证函数
def eval_epoch(model, loader, criterion):
    model.eval()
    total_loss, correct = 0.0, 0
    with torch.no_grad():
        for inputs, labels in loader:
            inputs = inputs.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)
            outputs = model(inputs)
            loss    = criterion(outputs, labels)
            total_loss += loss.item() * inputs.size(0)
            correct    += (outputs.argmax(1) == labels).sum().item()
    n = len(loader.dataset)
    return total_loss / n, correct / n

# 6. 主训练循环
for epoch in range(1, 11):
    train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion)
    val_loss,   val_acc   = eval_epoch(model,  test_loader,  criterion)
    print(f"Epoch {epoch:02d} | "
          f"Train Loss: {train_loss:.4f}, Acc: {train_acc:.4f} | "
          f"Val Loss: {val_loss:.4f}, Acc: {val_acc:.4f}")
```

关键要点：

- `device` 变量在代码最顶部声明，全局统一引用，不硬编码 `"cuda"`
- 模型 `.to(device)` 只需调用一次
- 每个 batch 的 `inputs` 和 `labels` 都要 `.to(device)`
- DataLoader 设置 `pin_memory=True` 和 `non_blocking=True` 加速数据传输
- 验证阶段使用 `torch.no_grad()` 关闭梯度，节省显存

------

## 6. 多 GPU 训练

当单卡显存不足时，可以考虑使用多 GPU 并行训练。

此外，多 GPU 还能进一步提升训练速度。PyTorch 提供了两种主要方式。

### 6.1 DataParallel

这是最简单的多卡方式。

它采用单进程，将每个 batch 均分到各 GPU，前向传播并行执行，梯度在主卡上汇总更新。使用方便，但主卡负担重，多卡利用率不均衡，适合快速入门。

```py
import torch
import torch.nn as nn

model = CNN()

if torch.cuda.device_count() > 1:
    print(f"使用 {torch.cuda.device_count()} 个 GPU")
    model = nn.DataParallel(model)

    # 也可以指定使用哪些 GPU
    # model = nn.DataParallel(model, device_ids=[0, 1])

model = model.to("cuda")

# 之后的训练代码与单卡完全一致
# DataParallel 会自动将 batch 均分到各 GPU，并汇总结果
```

如果需要访问原始模型的属性（如自定义方法），需要通过 `.module` 访问：

```py
# model 被 DataParallel 包裹后，原始模型在 model.module 中
print(model.module.classifier)

# 保存模型时建议保存 model.module，方便单卡加载
torch.save(model.module.state_dict(), "model.pth")
```

### 6.2 DistributedDataParallel

这是多进程方式。

每个进程绑定一块 GPU，每张卡持有完整模型，通过 All-Reduce 同步梯度。是生产环境和大规模训练的推荐方案，效率远高于 DataParallel。

```py
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler

def main(rank, world_size):
    # 初始化进程组，nccl 后端专为 NVIDIA GPU 优化
    dist.init_process_group(backend="nccl", rank=rank, world_size=world_size)

    # 每个进程绑定对应的 GPU
    torch.cuda.set_device(rank)
    device = torch.device(f"cuda:{rank}")

    # 模型移到对应 GPU 后包装 DDP
    model = CNN().to(device)
    model = DDP(model, device_ids=[rank])

    # DataLoader 使用 DistributedSampler，保证各卡数据不重叠
    sampler = DistributedSampler(train_dataset,
                                  num_replicas=world_size, rank=rank)
    loader  = DataLoader(train_dataset, batch_size=64,
                         sampler=sampler, pin_memory=True)

    # 训练逻辑与单卡完全一致
    # ...

    dist.destroy_process_group()

# 启动方式（推荐使用 torchrun）：
# torchrun --nproc_per_node=4 train_ddp.py
```

| 对比项   | DataParallel    | DistributedDataParallel |
| :------- | :-------------- | :---------------------- |
| 进程数量 | 单进程          | 多进程（每卡一个）      |
| 通信后端 | Python GIL 限制 | NCCL（高效）            |
| 主卡负担 | 重（汇总梯度）  | 均衡（All-Reduce）      |
| 代码改动 | 极少            | 中等                    |
| 适用场景 | 快速实验        | 生产训练                |

------

## 7. 混合精度训练 AMP

默认训练使用 float32（FP32）精度。

**自动混合精度（Automatic Mixed Precision，AMP）**让部分计算使用 float16（FP16）或 bfloat16（BF16），在几乎不损失精度的情况下获得显著收益：

- 显存占用减少约 50%
- 训练速度提升 2x~3x（Tensor Core 硬件加速）
- 代码改动极少，只需三处修改

```py
from torch.cuda.amp import autocast, GradScaler

model     = CNN().to(device)
optimizer = optim.Adam(model.parameters(), lr=1e-3)
scaler    = GradScaler()    # FP16 梯度缩放器，防止梯度下溢出为零

for epoch in range(num_epochs):
    model.train()
    for inputs, labels in train_loader:
        inputs = inputs.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)

        optimizer.zero_grad()

        # 修改一：autocast 区域内自动选择 FP16/FP32
        with autocast(device_type="cuda"):
            outputs = model(inputs)
            loss    = criterion(outputs, labels)

        # 修改二：用 scaler 缩放 loss 再反向传播
        scaler.scale(loss).backward()

        # 修改三：scaler 更新参数，内部自动处理梯度缩放
        scaler.step(optimizer)
        scaler.update()
```

### 7.1 FP16 与 BF16 的选择

| 格式     | 精度位 | 数值范围位 | 适合硬件               | 特点                         |
| :------- | :----- | :--------- | :--------------------- | :--------------------------- |
| float16  | 10 位  | 5 位       | RTX 20/30/40 系        | 需要 GradScaler 防溢出       |
| bfloat16 | 7 位   | 8 位       | A100 / H100 / RTX 4090 | 范围与 FP32 相同，训练更稳定 |

如果 GPU 支持 BF16，优先使用，无需 GradScaler：

```py
# BF16 写法（PyTorch 2.0+）
with torch.autocast(device_type="cuda", dtype=torch.bfloat16):
    outputs = model(inputs)
    loss    = criterion(outputs, labels)

loss.backward()
optimizer.step()
```

## 8. 性能优化技巧

本节介绍多种优化显存和训练速度的技巧。

### 8.1 显存管理

```py
# 查看当前显存使用情况
print(f"已分配: {torch.cuda.memory_allocated() / 1024**2:.1f} MB")
print(f"已缓存: {torch.cuda.memory_reserved()  / 1024**2:.1f} MB")

# 打印详细显存报告
print(torch.cuda.memory_summary())

# 释放缓存池（不释放已分配的显存）
torch.cuda.empty_cache()

# 推理时使用 inference_mode（比 no_grad 更快，彻底禁用梯度引擎）
with torch.inference_mode():
    output = model(x)

# 梯度检查点：以重新计算换显存（大模型训练常用）
from torch.utils.checkpoint import checkpoint
output = checkpoint(model_block, x)
```

### 8.2 DataLoader 优化

```py
loader = DataLoader(
    dataset,
    batch_size=256,
    num_workers=4,              # 多进程预加载，建议设为 CPU 核数的 50%
    pin_memory=True,            # 锁页内存，加快 CPU -> GPU 传输
    persistent_workers=True,    # 进程常驻，避免每个 epoch 重新创建进程
    prefetch_factor=2,          # 每个 worker 预取的 batch 数量
)
```

### 8.3 torch.compile 模型编译（PyTorch 2.0+）

一行代码，对计算图进行编译优化，速度提升 30%~200%（取决于模型结构）：

```py
# 编译模型，第一次运行时有编译开销，之后的迭代速度显著提升
model = torch.compile(model)

# 不同编译模式的权衡
model = torch.compile(model, mode="default")          # 均衡，适合大多数场景
model = torch.compile(model, mode="reduce-overhead")  # 降低调度开销
model = torch.compile(model, mode="max-autotune")     # 最大优化，编译时间较长
```

### 8.4 梯度累积（模拟大 batch）

显存不足时，可以通过梯度累积模拟更大的 batch size，而无需实际增大显存占用：

```py
accumulation_steps = 8    # 每 8 个 batch 更新一次参数，等效 batch_size × 8

for i, (inputs, labels) in enumerate(train_loader):
    inputs = inputs.to(device)
    labels = labels.to(device)

    outputs = model(inputs)
    loss    = criterion(outputs, labels) / accumulation_steps   # 均分 loss
    loss.backward()    # 梯度累积，不清零

    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()    # 只在参数更新后清零
```

### 8.5 显存不足时的应对策略

| 策略            | 方法                     | 效果                       |
| :-------------- | :----------------------- | :------------------------- |
| 减小 batch size | 256 -> 64                | 线性减少显存               |
| 混合精度        | AMP + FP16/BF16          | 显存减少约 50%             |
| 梯度累积        | 每 N 步更新一次          | 模拟大 batch，不增加显存   |
| 梯度检查点      | `torch.utils.checkpoint` | 大幅减少显存，训练速度降低 |
| 冻结部分参数    | 迁移学习冻结主干         | 减少反向传播的显存占用     |

## 9. 常见错误与排查

本节汇总了 GPU 训练中最常见的错误及其解决方案。

### 9.1 RuntimeError: Expected all tensors to be on the same device

原因：参与运算的张量分布在不同设备上（一个在 CPU，一个在 GPU）。

```py
# 排查方式：打印各张量的 device
print(inputs.device, labels.device, next(model.parameters()).device)

# 解决：确保每个 batch 都执行了 .to(device)
inputs = inputs.to(device)
labels = labels.to(device)
```

### 9.2 RuntimeError: CUDA out of memory

原因：显存不足，常见于 batch size 过大、模型过大，或计算图意外积累。

```py
# 常见隐患：循环中 loss 没有调用 .item()，导致计算图不断堆积
# 错误写法
total_loss += loss           # loss 是张量，持有整个计算图

# 正确写法
total_loss += loss.item()    # .item() 取出 Python 标量，释放计算图

# 其他排查步骤：
# 1. 减小 batch_size
# 2. 确认验证循环使用了 torch.no_grad()
# 3. 调用 torch.cuda.empty_cache() 清理缓存
# 4. 使用 torch.cuda.memory_summary() 定位显存占用来源
```

### 9.3 Can't call numpy() on Tensor that requires grad

原因：带梯度的张量不能直接转为 numpy 数组。

```py
# 错误写法
arr = gpu_tensor.numpy()

# 正确写法
arr = gpu_tensor.detach().cpu().numpy()
```

### 9.4 CUDA error: device-side assert triggered

原因：通常是标签值越界（如 10 分类但 label 值等于 10），或数组索引越界。报错信息在 GPU 上产生，默认显示位置不准确。

```py
# 设置环境变量，让错误在准确的代码行处抛出（会变为同步执行，速度变慢）
import os
os.environ["CUDA_LAUNCH_BLOCKING"] = "1"
```

### 9.5 训练速度没有提升（GPU 利用率低）

原因：数据加载成为瓶颈，GPU 大部分时间在等待 CPU 准备数据。

排查步骤：

1. 运行

    

   ```
   nvidia-smi
   ```

    

   或

    

   ```
   watch -n 1 nvidia-smi
   ```

    

   观察 GPU 利用率

   - 利用率持续低于 80% 说明存在数据瓶颈

2. 增大 DataLoader 的 num_workers

3. 开启 pin_memory=True

4. 将数据预处理移到 GPU（torchvision.transforms 支持 GPU 操作）

5. 将小文件数据集预先加载到内存

### 9.6 使用 PyTorch Profiler 精确定位瓶颈

```py
from torch.profiler import profile, ProfilerActivity

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    record_shapes=True,
) as prof:
    for i, (inputs, labels) in enumerate(train_loader):
        if i >= 10:
            break
        inputs = inputs.to(device)
        labels = labels.to(device)
        loss   = criterion(model(inputs), labels)
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

# 按 CUDA 耗时排序，打印前 15 项
print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=15))
```

## 10. API 快速参考

以下是常用 PyTorch GPU 相关 API 的速查表。

### 10.1 设备管理

| 操作           | 代码                                     |
| :------------- | :--------------------------------------- |
| 检测 CUDA 可用 | `torch.cuda.is_available()`              |
| 选择设备       | `torch.device("cuda" if ... else "cpu")` |
| GPU 数量       | `torch.cuda.device_count()`              |
| GPU 名称       | `torch.cuda.get_device_name(0)`          |
| 设置当前 GPU   | `torch.cuda.set_device(0)`               |
| 等待 GPU 完成  | `torch.cuda.synchronize()`               |

### 10.2 张量操作

| 操作             | 代码                                   |
| :--------------- | :------------------------------------- |
| 张量移到 GPU     | `tensor.to(device)` 或 `tensor.cuda()` |
| 张量移到 CPU     | `tensor.cpu()`                         |
| 查看所在设备     | `tensor.device`                        |
| 是否在 GPU       | `tensor.is_cuda`                       |
| GPU 张量转 numpy | `tensor.detach().cpu().numpy()`        |
| 异步传输         | `tensor.to(device, non_blocking=True)` |

### 10.3 模型操作

| 操作         | 代码                           |
| :----------- | :----------------------------- |
| 模型移到 GPU | `model.to(device)`             |
| 开启训练模式 | `model.train()`                |
| 开启推理模式 | `model.eval()`                 |
| 编译加速     | `torch.compile(model)`         |
| 关闭梯度     | `with torch.no_grad():`        |
| 推理模式     | `with torch.inference_mode():` |

### 10.4 显存管理

| 操作       | 代码                            |
| :--------- | :------------------------------ |
| 已分配显存 | `torch.cuda.memory_allocated()` |
| 已缓存显存 | `torch.cuda.memory_reserved()`  |
| 显存报告   | `torch.cuda.memory_summary()`   |
| 清理缓存   | `torch.cuda.empty_cache()`      |

### 10.5 核心原则速记

```
1. 用 device 变量统一管理，不要硬编码 "cuda"
2. 模型和数据必须在同一设备上，每个 batch 都要 .to(device)
3. 验证和推理时一定使用 torch.no_grad() 或 torch.inference_mode()
4. 生产训练推荐开启 AMP 混合精度，几乎免费获得 2x 加速
5. DataLoader 设置 pin_memory=True 和 num_workers >= 4 减少数据瓶颈
6. PyTorch 2.0+ 可以用 torch.compile(model) 一行提速 30%+
7. GPU 计算是异步的，精确计时需要调用 torch.cuda.synchronize()
```