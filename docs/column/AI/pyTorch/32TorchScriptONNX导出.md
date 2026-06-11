---
date: 2026年06月11日
---

# PyTorch TorchScript / ONNX 导出

模型训练完成后，需要将模型部署到生产环境。PyTorch 提供了多种模型导出方式，其中 **TorchScript** 和 **ONNX** 是最常用的两种格式。

本节详细介绍这两种导出方式的原理、使用方法和最佳实践。

> 模型导出是将 PyTorch 模型转换为可以在不同平台、不同框架上运行的格式的过程。这对于模型部署、移动端推理、跨框架迁移等场景至关重要。

------

## 1. TorchScript 基础

### 1.1 什么是 TorchScript

TorchScript 是 PyTorch 的序列化格式，它可以将 Python 代码转换为可以独立运行的 C++ 虚拟机代码。TorchScript 程序可以在没有 Python 解释器的环境中运行。

TorchScript 的主要特点：

- 将动态图转换为静态图
- 支持 Python 子集的语法
- 可以在 C++ 环境中运行
- 保留模型的结构和参数

### 1.2 两种转换方式

TorchScript 提供两种将模型转换为 TorchScript 的方式：

- **TorchScript 追踪（Tracing）**：通过执行模型记录操作，生成静态计算图
- **TorchScript 脚本（Scripting）**：直接分析 Python 代码，编译为 TorchScript

------

## 2. TorchScript 追踪 (Tracing)

### 2.1 基本追踪方法

```py
import torch
import torch.nn as nn

# ── 定义模型 ──────────────────────────────────────
class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2)
        self.fc = nn.Linear(128 * 8 * 8, 10)

    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))
        x = self.pool(torch.relu(self.conv2(x)))
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x


# 创建模型实例
model = SimpleNet()
model.eval()

# 示例输入
example_input = torch.randn(1, 3, 64, 64)

# ── 方式一：torch.jit.trace 追踪 ───────────────────
# 通过运行模型并记录操作来创建 TorchScript
traced_model = torch.jit.trace(model, example_input)

print("追踪后的模型:")
print(traced_model)

# 保存模型
traced_model.save("simple_net_traced.pt")

# 加载模型
loaded_model = torch.jit.load("simple_net_traced.pt")

# 使用加载的模型进行推理
output = loaded_model(example_input)
print(f"输出形状: {output.shape}")
```

### 2.2 追踪的限制

追踪方法有一些限制：

- 只记录实际执行的操作
- 控制流（如 if、for）会被固定
- 动态大小的输入可能有问题

```py
# 追踪的限制示例

class DynamicModel(nn.Module):
    def __init__(self):
        super().__init__()

    def forward(self, x):
        # 控制流在追踪时被固定
        if x.sum() > 0:
            return x * 2
        else:
            return x / 2


model = DynamicModel()
model.eval()

# 追踪时，if 分支会被固定为追踪时的路径
example_input = torch.tensor([1.0])
traced = torch.jit.trace(model, example_input)

# 即使输入不同，也会执行相同的分支
print(traced(torch.tensor([1.0])))  # 2
print(traced(torch.tensor([-1.0]))) # 仍然是 2，不是 -0.5
```

> 对于包含控制流的模型，应该使用 TorchScript 脚本（Scripting）而不是追踪。

------

## 3. TorchScript 脚本 (Scripting)

### 3.1 基本使用方法

```py
import torch

# ── 使用 @torch.jit.script 装饰器 ───────────────
@torch.jit.script
def scripted_function(x: torch.Tensor) -> torch.Tensor:
    """使用脚本方式转换函数"""
    if x.sum() > 0:
        return x * 2
    else:
        return x / 2


# 测试脚本化的函数
input1 = torch.tensor([1.0, 2.0])
input2 = torch.tensor([-1.0, -2.0])

print(scripted_function(input1))  # [2., 4.]
print(scripted_function(input2))    # [-0.5, -1.]


# ── 脚本化模型 ───────────────────────────────────
class ScriptableModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 10)

    @torch.jit.export
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return torch.relu(self.fc(x))

    @torch.jit.export
    def predict(self, x: torch.Tensor) -> torch.Tensor:
        """额外的导出方法"""
        out = self.forward(x)
        return torch.argmax(out, dim=1)


model = ScriptableModel()

# 脚本化模型
scripted_model = torch.jit.script(model)
print(scripted_model)

# 保存
scripted_model.save("scripted_model.pt")
```

### 3.2 复杂模型的脚本化

```py
# 更复杂的脚本化示例：带条件的模型

class ConditionModel(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.num_classes = num_classes
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten()
        )
        self.classifier = nn.Linear(64, num_classes)

    def forward(self, x: torch.Tensor, use_softmax: bool = False) -> torch.Tensor:
        """
        支持动态条件的模型
        """
        features = self.features(x)
        logits = self.classifier(features)

        if use_softmax:
            return torch.softmax(logits, dim=1)
        else:
            return logits

    def get_prediction(self, x: torch.Tensor) -> torch.Tensor:
        """辅助方法"""
        logits = self.forward(x, use_softmax=False)
        return torch.argmax(logits, dim=1)


# 脚本化
model = ConditionModel(num_classes=10)
scripted_model = torch.jit.script(model, example_inputs=(torch.randn(1, 3, 32, 32),))

# 测试
test_input = torch.randn(2, 3, 32, 32)
output1 = scripted_model(test_input, use_softmax=False)
output2 = scripted_model(test_input, use_softmax=True)

print(f"Logits 输出形状: {output1.shape}")
print(f"Softmax 输出形状: {output2.shape}")
```

## 4. ONNX 导出

### 4.1 ONNX 基础

**ONNX（Open Neural Network eXchange）** 是一个开放的神经网络交换格式，支持在不同的深度学习框架之间转换模型。

ONNX 的优势：

- 跨框架：PyTorch、TensorFlow、Caffe2 等都支持
- 跨平台：支持 CPU、GPU、移动端等多种平台
- 硬件优化：可利用 ONNX Runtime 进行高效推理
- 工具丰富：有大量的优化工具和部署方案

### 4.2 基本 ONNX 导出

```py
import torch
import torch.nn as nn
import torchvision

# ── 定义模型 ──────────────────────────────────────
class ImageClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten()
        )
        self.classifier = nn.Linear(64, 10)

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


model = ImageClassifier()
model.eval()

# 示例输入
example_input = torch.randn(1, 3, 32, 32)

# ── 导出为 ONNX ──────────────────────────────────
output_path = "image_classifier.onnx"

torch.onnx.export(
    model,
    example_input,
    output_path,
    export_params=True,        # 导出模型参数
    opset_version=14,          # ONNX 版本
    do_constant_folding=True, # 常量折叠优化
    input_names=['input'],     # 输入张量名称
    output_names=['output'],   # 输出张量名称
    dynamic_axes={
        'input': {0: 'batch_size'},    # 动态批次维度
        'output': {0: 'batch_size'}
    }
)

print(f"模型已导出到: {output_path}")

# 验证导出的模型
import onnx
onnx_model = onnx.load(output_path)
onnx.checker.check_model(onnx_model)
print("ONNX 模型验证通过！")
```

### 4.3 导出复杂模型

```py
# 导出完整的 ResNet 模型

import torchvision.models as models

# 加载预训练模型
model = models.resnet18(pretrained=True)
model.eval()

# 示例输入（ResNet 标准的 224x224）
example_input = torch.randn(1, 3, 224, 224)

# 导出
torch.onnx.export(
    model,
    example_input,
    "resnet18.onnx",
    export_params=True,
    opset_version=14,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size', 2: 'height', 3: 'width'},
        'output': {0: 'batch_size'}
    }
)

print("ResNet18 已导出")

# 导出时处理特殊的层
# 对于需要特殊处理的层，使用 workaround
class ModelWithSpecialOps(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Conv2d(3, 64, 3, padding=1)

    def forward(self, x):
        # 使用 F.interpolate 而不是 nn.functional 的别名
        x = self.conv(x)
        x = torch.nn.functional.interpolate(x, scale_factor=2, mode='bilinear', align_corners=False)
        return x


model = ModelWithSpecialOps()
model.eval()
torch.onnx.export(
    model,
    torch.randn(1, 3, 32, 32),
    "special_ops.onnx",
    input_names=['input'],
    output_names=['output'],
    opset_version=14
)
```

## 5. 导出的验证与优化

### 5.1 验证导出模型

```py
import numpy as np
import onnx
import onnxruntime as ort

def verify_onnx_model(onnx_path, pytorch_model, test_input):
    """
    验证 ONNX 模型与 PyTorch 模型的输出一致性
    """
    # 1. 检查 ONNX 模型
    onnx_model = onnx.load(onnx_path)
    onnx.checker.check_model(onnx_model)
    print("✓ ONNX 模型结构验证通过")

    # 2. PyTorch 推理
    pytorch_model.eval()
    with torch.no_grad():
        pytorch_output = pytorch_model(test_input)

    # 3. ONNX Runtime 推理
    ort_session = ort.InferenceSession(onnx_path)
    ort_output = ort_session.run(None, {'input': test_input.numpy()})[0]

    # 4. 对比输出
    diff = np.abs(pytorch_output.numpy() - ort_output).max()
    print(f"✓ 最大输出差异: {diff:.6f}")

    if diff < 1e-5:
        print("✓ 输出验证通过")
        return True
    else:
        print("&#x26a0; 输出差异较大")
        return False


# 使用示例
model = ImageClassifier()
model.eval()

# 先导出
torch.onnx.export(
    model,
    torch.randn(1, 3, 32, 32),
    "test_model.onnx",
    input_names=['input'],
    output_names=['output']
)

# 验证
test_input = torch.randn(2, 3, 32, 32)
verify_onnx_model("test_model.onnx", model, test_input)
```

### 5.2 ONNX Runtime 优化

```py
import onnxruntime as ort
from onnxruntime import GraphOptimizationLevel

# 创建推理会话并配置优化
def create_optimized_session(onnx_path, providers=None):
    if providers is None:
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']

    # 配置会话选项
    sess_options = ort.SessionOptions()

    # 开启图优化
    sess_options.graph_optimization_level = GraphOptimizationLevel.ORT_ENABLE_ALL

    # 启用其他优化
    sess_options.intra_op_num_threads = 4
    sess_options.inter_op_num_threads = 4

    # 创建会话
    session = ort.InferenceSession(onnx_path, sess_options, providers=providers)

    return session


# 使用优化的会话进行推理
session = create_optimized_session("resnet18.onnx")

# 获取输入输出名称
input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

# 推理
input_data = np.random.randn(1, 3, 224, 224).astype(np.float32)
output = session.run([output_name], {input_name: input_data})[0]

print(f"推理输出形状: {output.shape}")
```

### 5.3 模型量化

```py
# ONNX 模型量化

import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

def quantize_onnx_model(input_path, output_path):
    """
    动态量化 ONNX 模型
    减少模型大小并加速推理
    """
    # 动态量化（不需要校准数据）
    quantize_dynamic(
        input_path,
        output_path,
        # 指定需要量化的权重类型
        weight_type=QuantType.QInt8
    )

    # 获取文件大小对比
    import os
    original_size = os.path.getsize(input_path) / 1024 / 1024
    quantized_size = os.path.getsize(output_path) / 1024 / 1024

    print(f"原始模型: {original_size:.2f} MB")
    print(f"量化模型: {quantized_size:.2f} MB")
    print(f"压缩比: {original_size/quantized_size:.2f}x")


# 使用
quantize_onnx_model("resnet18.onnx", "resnet18_quantized.onnx")
```

## 6. 移动端部署

### 6.1 导出到移动端格式

```py
# 方式一：TorchScript 移动端部署
# 1. 追踪模型
model = ImageClassifier()
model.eval()
example_input = torch.randn(1, 3, 32, 32)

traced_model = torch.jit.trace(model, example_input)

# 2. 优化模型（移动端优化）
optimized_model = torch.jit.optimize_for_inference(traced_model)

# 3. 保存移动端模型
optimized_model.save("mobile_model.pt")

# 方式二：使用 torchmobile（如果可用）
# torchmobile 用于更轻量的移动端部署
# 请参考官方文档进行交叉编译

# 方式三：导出为 ONNX 并使用移动端运行时
# iOS: 使用 Core ML Tools
# Android: 使用 ONNX Runtime Mobile

print("移动端模型已准备")
```

### 6.2 Core ML 导出（iOS）

对于 iOS 平台，可以使用 Core ML Tools 将模型转换为 Core ML 格式。需要先转换为 ONNX 格式，再通过 Core ML Tools 转换。

```py
# 需要安装 coremltools
# pip install coremltools

# Core ML 导出步骤
# 注意：这只在 macOS 上可用

# 步骤 1: 先将 PyTorch 模型导出为 ONNX
# from pytorch_example import your_model
# model = your_model()
# model.eval()
# example_input = torch.randn(1, 3, 224, 224)
# torch.onnx.export(
#     model,
#     example_input,
#     "model.onnx",
#     input_names=['input'],
#     output_names=['output']
# )

# 步骤 2: 使用 Core ML Tools 转换为 Core ML 格式
# from coremltools.converters import onnx as onnx_coreml
# coreml_model = onnx_coreml.convert(
#     model="model.onnx",
#     minimum_deployment_target='13',
#     image_input_names=['input']
# )
# coreml_model.save("model.mlmodel")

# 使用示例
print("iOS 部署需要 macOS 环境")
print("详细步骤：1. pip install coremltools  2. 导出 ONNX  3. 使用 coremltools 转换")
```

## 7. 最佳实践与常见问题

### 7.1 导出问题排查

| 问题              | 原因         | 解决方案                                  |
| :---------------- | :----------- | :---------------------------------------- |
| 导出失败          | 不支持的操作 | 使用 opset_version 更高的版本，或替换操作 |
| 输出不一致        | 动态控制流   | 使用脚本化而非追踪，或固定输入尺寸        |
| ONNX Runtime 错误 | 算子不支持   | 检查 ONNX 支持的操作列表                  |

### 7.2 导出格式对比

| 格式              | 优点             | 缺点           | 适用场景        |
| :---------------- | :--------------- | :------------- | :-------------- |
| TorchScript (.pt) | PyTorch 原生支持 | 跨框架支持差   | 桌面/服务器部署 |
| ONNX (.onnx)      | 跨框架、跨平台   | 有些操作不支持 | 通用部署        |

### 7.3 导出检查清单

```py
# 导出前检查清单

def export_checklist(model, example_input):
    """导出前的检查"""
    model.eval()

    # 1. 确保模型在推理模式下
    print(f"模型模式: {'eval' if not model.training else 'train'}")

    # 2. 检查输入尺寸
    print(f"示例输入形状: {example_input.shape}")

    # 3. 验证前向传播
    with torch.no_grad():
        output = model(example_input)
    print(f"输出形状: {output.shape}")

    # 4. 检查是否有不可序列化的操作
    # 例如：lambda 函数
    for name, module in model.named_modules():
        if hasattr(module, '__call__'):
            pass  # 检查自定义模块

    print("✓ 导出检查完成")


# 使用示例
model = ImageClassifier()
example_input = torch.randn(1, 3, 32, 32)
export_checklist(model, example_input)
```

### 7.4 完整导出流程

```py
# 完整的模型导出流程示例

class ProductionModel(nn.Module):
    """生产级模型"""
    def __init__(self):
        super().__init__()
        self.backbone = nn.Sequential(
            nn.Conv2d(3, 64, 7, stride=2, padding=3),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(3, stride=2, padding=1),
            # ... 更多层
        )
        self.head = nn.Linear(512, 10)

    def forward(self, x, return_features=False):
        features = self.backbone(x)
        features = torch.nn.functional.adaptive_avg_pool2d(features, 1).flatten(1)

        if return_features:
            return features

        return self.head(features)


# 完整导出流程
model = ProductionModel()
model.load_state_dict(torch.load("weights.pth"))  # 加载权重
model.eval()

# 准备示例输入
example_input = torch.randn(1, 3, 224, 224)

# 1. 追踪 TorchScript
traced = torch.jit.trace(model, example_input)
traced.save("model_traced.pt")

# 2. 导出 ONNX
torch.onnx.export(
    traced,
    example_input,
    "model.onnx",
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch'}, 'output': {0: 'batch'}},
    opset_version=14
)

# 3. 优化 ONNX
# 使用 onnx-simplifier 去除冗余操作
# onnxsim model.onnx model_simplified.onnx

print("所有格式导出完成！")
```

