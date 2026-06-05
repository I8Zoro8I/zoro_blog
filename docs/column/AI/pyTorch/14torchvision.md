---
date: 2026年06月05日
---

# PyTorch torchvision 计算机视觉模块

torchvision 是 PyTorch 生态系统中专门用于计算机视觉任务的扩展库，它提供了以下核心功能：

1. **预训练模型**：包含经典的 CNN 架构实现（如 ResNet、VGG、AlexNet 等）
2. **数据集工具**：内置常用视觉数据集（如 CIFAR10、MNIST、ImageNet 等）
3. **图像变换**：提供各种图像预处理和数据增强方法
4. **实用工具**：包括视频处理、图像操作等辅助功能

```
# 安装 torchvision（通常与 PyTorch 一起安装）
pip install torch torchvision
```

## 核心组件解析

### 1. torchvision.models

提供预训练的计算机视觉模型，可直接用于迁移学习：

```py
import torchvision.models as models

# 加载预训练模型
resnet18 = models.resnet18(pretrained=True)
alexnet = models.alexnet(pretrained=True)
vgg16 = models.vgg16(pretrained=True)
```

#### 常用模型列表：

| 模型名称     | 适用场景     | 参数量  | Top-1 准确率 |
| :----------- | :----------- | :------ | :----------- |
| ResNet       | 通用图像分类 | 11M-60M | 69%-80%      |
| VGG          | 特征提取     | 138M    | 71.3%        |
| MobileNet    | 移动端应用   | 3.4M    | 70.6%        |
| EfficientNet | 高效模型     | 5M-66M  | 77%-84%      |

### 2. torchvision.datasets

内置常用计算机视觉数据集，简化数据加载流程：

```py
from torchvision import datasets

# 加载 CIFAR10 数据集
train_data = datasets.CIFAR10(
    root='data', 
    train=True,
    download=True,
    transform=transforms.ToTensor()
)

# 加载 MNIST 数据集
test_data = datasets.MNIST(
    root='data',
    train=False,
    download=True
)
```

#### 支持的数据集类型：

```
graph TD
  A[torchvision.datasets] --> B[分类数据集]
  A --> C[检测数据集]
  A --> D[分割数据集]
  B --> B1[CIFAR10/100]
  B --> B2[MNIST/FashionMNIST]
  B --> B3[ImageNet]
  C --> C1[COCO]
  C --> C2[VOC]
  D --> D1[Cityscapes]
```

### 3. torchvision.transforms

图像预处理和数据增强的核心工具：

```py
from torchvision import transforms

# 定义图像变换管道
transform = transforms.Compose([
    transforms.Resize(256),          # 调整大小
    transforms.CenterCrop(224),       # 中心裁剪
    transforms.ToTensor(),           # 转为张量
    transforms.Normalize(             # 标准化
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])
```

#### 常用变换方法分类：

| 类别      | 方法示例                          | 作用           |
| :-------- | :-------------------------------- | :------------- |
| 几何变换  | RandomRotation, RandomResizedCrop | 增加位置不变性 |
| 颜色变换  | ColorJitter, Grayscale            | 增强颜色鲁棒性 |
| 模糊/噪声 | GaussianBlur, RandomErasing       | 防止过拟合     |
| 组合变换  | RandomApply, RandomChoice         | 灵活组合策略   |

## 实战示例：图像分类流程

### 1. 数据准备

```py
import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# 定义数据变换
train_transform = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

# 加载数据集
train_set = datasets.CIFAR10(
    root='./data', 
    train=True,
    download=True, 
    transform=train_transform
)

# 创建数据加载器
train_loader = DataLoader(
    train_set, 
    batch_size=32,
    shuffle=True
)
```

### 2. 模型训练

```py
import torch.nn as nn
import torch.optim as optim

# 使用预训练模型
model = models.resnet18(pretrained=True)

# 修改最后一层（适应 CIFAR10 的 10 分类）
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 10)

# 定义损失函数和优化器
criterion = nn.CrossEntropyLoss()
optimizer = optim.SGD(model.parameters(), lr=0.001, momentum=0.9)

# 训练循环
for epoch in range(10):
    for images, labels in train_loader:
        outputs = model(images)
        loss = criterion(outputs, labels)
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
```

## 高级功能

### 1. 自定义数据集

```py
from torchvision.datasets import VisionDataset

class CustomDataset(VisionDataset):
    def __init__(self, root, transform=None):
        super().__init__(root, transform=transform)
        # 实现 __getitem__ 和 __len__
        
    def __getitem__(self, index):
        # 返回 (image, target) 元组
        pass
        
    def __len__(self):
        # 返回数据集大小
        pass
```

### 2. 模型导出与部署

```py
# 导出为 ONNX 格式
dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    input_names=["input"],
    output_names=["output"]
)
```

## 最佳实践建议

**1、数据增强策略**：

- 训练时使用随机变换增强数据
- 验证/测试时只使用确定性变换

**2、迁移学习技巧**：

```py
# 冻结除最后一层外的所有参数
for param in model.parameters():
    param.requires_grad = False
model.fc.requires_grad = True
```

**3、性能优化**：

- 使用 `num_workers` 参数加速数据加载
- 对大数据集考虑使用 `Dataset` 的子集

**4、常见错误**：

- 忘记调用 `zero_grad()`
- 混淆了 `train()` 和 `eval()` 模式
- 图像张量形状不符合模型要求（应为 C×H×W）