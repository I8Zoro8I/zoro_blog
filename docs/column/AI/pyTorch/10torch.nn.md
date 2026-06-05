---
date: 2026年06月05日
---

# PyTorch torch.nn 参考手册

PyTorch 的 `torch.nn` 模块是构建和训练神经网络的核心模块，它提供了丰富的类和函数来定义和操作神经网络。

以下是 `torch.nn` 模块的一些关键组成部分及其功能：

**1、nn.Module 类**：

- `nn.Module` 是所有自定义神经网络模型的基类。用户通常会从这个类派生自己的模型类，并在其中定义网络层结构以及前向传播函数（forward pass）。

**2、预定义层（Modules）**：

- 包括各种类型的层组件，例如卷积层（`nn.Conv1d`, `nn.Conv2d`, `nn.Conv3d`）、全连接层（`nn.Linear`）、激活函数（`nn.ReLU`, `nn.Sigmoid`, `nn.Tanh`）等。

**3、容器类**：

- `nn.Sequential`：允许将多个层按顺序组合起来，形成简单的线性堆叠网络。
- `nn.ModuleList` 和 `nn.ModuleDict`：可以动态地存储和访问子模块，支持可变长度或命名的模块集合。

**4、损失函数（Loss Functions）**：

- `torch.nn` 包含了一系列用于衡量模型预测与真实标签之间差异的损失函数，例如均方误差损失（`nn.MSELoss`）、交叉熵损失（`nn.CrossEntropyLoss`）等。

**5、实用函数接口（Functional Interface）**：

- `nn.functional`（通常简写为 `F`），包含了许多可以直接作用于张量上的函数，它们实现了与层对象相同的功能，但不具有参数保存和更新的能力。例如，可以使用 `F.relu()` 直接进行 ReLU 操作，或者 `F.conv2d()` 进行卷积操作。

**6、初始化方法**：

- `torch.nn.init` 提供了一些常用的权重初始化策略，比如 Xavier 初始化 (`nn.init.xavier_uniform_()`) 和 Kaiming 初始化 (`nn.init.kaiming_uniform_()`)，这些对于成功训练神经网络至关重要。

**7、Transformer 层**：

- PyTorch 提供了完整的 Transformer 架构组件，包括 `nn.Transformer`, `nn.TransformerEncoder`, `nn.TransformerDecoder` 以及注意力机制 `nn.MultiheadAttention` 等。

**8、归一化层**：

- 包括批归一化（`BatchNorm`）、层归一化（`LayerNorm`）、组归一化（`GroupNorm`）、实例归一化（`InstanceNorm`）和 RMSNorm 等。

------

## PyTorch torch.nn 模块参考手册

### **神经网络容器**

| **类/函数**                                                  | **描述**                               |
| :----------------------------------------------------------- | :------------------------------------- |
| [`torch.nn.Module`](https://www.runoob.com/pytorch/pytorch-torch-nn-module.html) | 所有神经网络模块的基类。               |
| [`torch.nn.Sequential(*args)`](https://www.runoob.com/pytorch/pytorch-torch-nn-sequential.html) | 按顺序组合多个模块。                   |
| [`torch.nn.ModuleList(modules)`](https://www.runoob.com/pytorch/pytorch-torch-nn-modulelist.html) | 将子模块存储在列表中。                 |
| `torch.nn.ModuleDict(modules)`                               | 将子模块存储在字典中。                 |
| `torch.nn.ParameterList(parameters)`                         | 将参数存储在列表中。                   |
| `torch.nn.ParameterDict(parameters)`                         | 将参数存储在字典中。                   |
| [`torch.nn.Parameter(data)`](https://www.runoob.com/pytorch/pytorch-torch-nn-parameter.html) | 创建一个可学习的参数张量。             |
| `torch.nn.Buffer(data)`                                      | 创建一个持久化的缓冲区（非学习参数）。 |
| `torch.nn.Identity(*args, **kwargs)`                         | 恒等变换层，输入直接输出。             |

### **全局钩子（Global Hooks）**

| **函数**                                       | **描述**               |
| :--------------------------------------------- | :--------------------- |
| `register_module_forward_pre_hook(hook)`       | 注册前向预钩子。       |
| `register_module_forward_hook(hook)`           | 注册前向钩子。         |
| `register_module_backward_hook(hook)`          | 注册反向钩子。         |
| `register_module_full_backward_pre_hook(hook)` | 注册完整的反向预钩子。 |
| `register_module_full_backward_hook(hook)`     | 注册完整的反向钩子。   |

------

### **线性层**

| **类/函数**                                                  | **描述**                                               |
| :----------------------------------------------------------- | :----------------------------------------------------- |
| [`torch.nn.Linear(in_features, out_features, bias)`](https://www.runoob.com/pytorch/pytorch-torch-nn-linear.html) | 全连接层（线性变换）。                                 |
| [`torch.nn.Bilinear(in1_features, in2_features, out_features, bias)`](https://www.runoob.com/pytorch/pytorch-torch-nn-bilinear.html) | 双线性层。                                             |
| `torch.nn.LazyLinear(out_features, bias)`                    | 延迟初始化的线性层，第一次前向传播时自动推断输入维度。 |

------

### **卷积层**

| **类/函数**                                                  | **描述**                             |
| :----------------------------------------------------------- | :----------------------------------- |
| [`torch.nn.Conv1d(in_channels, out_channels, kernel_size, stride, padding, dilation, groups, bias, padding_mode)`](https://www.runoob.com/pytorch/pytorch-torch-nn-conv1d.html) | 一维卷积层，常用于文本和音频。       |
| [`torch.nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding, dilation, groups, bias, padding_mode)`](https://www.runoob.com/pytorch/pytorch-torch-nn-conv2d.html) | 二维卷积层，常用于图像。             |
| [`torch.nn.Conv3d(in_channels, out_channels, kernel_size, stride, padding, dilation, groups, bias, padding_mode)`](https://www.runoob.com/pytorch/pytorch-torch-nn-conv3d.html) | 三维卷积层，常用于视频和体数据。     |
| `torch.nn.ConvTranspose1d(in_channels, out_channels, kernel_size, stride, padding, output_padding, groups, bias, dilation, padding_mode)` | 一维转置卷积（反卷积），用于上采样。 |
| [`torch.nn.ConvTranspose2d(in_channels, out_channels, kernel_size, stride, padding, output_padding, groups, bias, dilation, padding_mode)`](https://www.runoob.com/pytorch/pytorch-torch-nn-convtranspose2d.html) | 二维转置卷积（反卷积），用于上采样。 |
| `torch.nn.ConvTranspose3d(in_channels, out_channels, kernel_size, stride, padding, output_padding, groups, bias, dilation, padding_mode)` | 三维转置卷积（反卷积），用于上采样。 |
| `torch.nn.Unfold(kernel_size, dilation, padding, stride)`    | 将输入张量展开为滑动窗口块。         |
| `torch.nn.Fold(output_size, kernel_size, dilation, padding, stride)` | 将展开的块重新组合为张量。           |

------

### **池化层**

| **类/函数**                                                  | **描述**                           |
| :----------------------------------------------------------- | :--------------------------------- |
| `torch.nn.MaxPool1d(kernel_size, stride, padding, dilation, return_indices)` | 一维最大池化层。                   |
| [`torch.nn.MaxPool2d(kernel_size, stride, padding, dilation, return_indices, ceil_mode)`](https://www.runoob.com/pytorch/pytorch-torch-nn-maxpool2d.html) | 二维最大池化层。                   |
| `torch.nn.MaxPool3d(kernel_size, stride, padding, dilation, return_indices, ceil_mode)` | 三维最大池化层。                   |
| `torch.nn.MaxUnpool1d(kernel_size, stride, padding)`         | 一维最大反池化层。                 |
| `torch.nn.MaxUnpool2d(kernel_size, stride, padding)`         | 二维最大反池化层。                 |
| `torch.nn.MaxUnpool3d(kernel_size, stride, padding)`         | 三维最大反池化层。                 |
| `torch.nn.AvgPool1d(kernel_size, stride, padding)`           | 一维平均池化层。                   |
| [`torch.nn.AvgPool2d(kernel_size, stride, padding, ceil_mode, count_include_pad)`](https://www.runoob.com/pytorch/pytorch-torch-nn-avgpool2d.html) | 二维平均池化层。                   |
| `torch.nn.AvgPool3d(kernel_size, stride, padding, ceil_mode, count_include_pad)` | 三维平均池化层。                   |
| `torch.nn.AdaptiveMaxPool1d(output_size, return_indices)`    | 一维自适应最大池化，输出尺寸固定。 |
| [`torch.nn.AdaptiveMaxPool2d(output_size, return_indices)`](https://www.runoob.com/pytorch/pytorch-torch-nn-adaptivemaxpool2d.html) | 二维自适应最大池化，输出尺寸固定。 |
| `torch.nn.AdaptiveMaxPool3d(output_size, return_indices)`    | 三维自适应最大池化，输出尺寸固定。 |
| `torch.nn.AdaptiveAvgPool1d(output_size)`                    | 一维自适应平均池化，输出尺寸固定。 |
| `torch.nn.AdaptiveAvgPool2d(output_size)`                    | 二维自适应平均池化，输出尺寸固定。 |
| `torch.nn.AdaptiveAvgPool3d(output_size)`                    | 三维自适应平均池化，输出尺寸固定。 |
| `torch.nn.LPPool1d(norm_type, kernel_size, stride, padding)` | 一维 Lp 池化层。                   |
| `torch.nn.LPPool2d(norm_type, kernel_size, stride, padding)` | 二维 Lp 池化层。                   |
| `torch.nn.FractionalMaxPool2d(kernel_size, output_size, output_ratio, return_indices)` | 二维分数最大池化，使用随机步长。   |
| `torch.nn.FractionalMaxPool3d(kernel_size, output_size, output_ratio, return_indices)` | 三维分数最大池化，使用随机步长。   |

------

### **填充层（Padding Layers）**

| **类/函数**                              | **描述**                         |
| :--------------------------------------- | :------------------------------- |
| `torch.nn.ReflectionPad1d(padding)`      | 一维反射填充，沿边界反射复制。   |
| `torch.nn.ReflectionPad2d(padding)`      | 二维反射填充，沿边界反射复制。   |
| `torch.nn.ReflectionPad3d(padding)`      | 三维反射填充，沿边界反射复制。   |
| `torch.nn.ReplicationPad1d(padding)`     | 一维复制填充，沿边界复制边缘值。 |
| `torch.nn.ReplicationPad2d(padding)`     | 二维复制填充，沿边界复制边缘值。 |
| `torch.nn.ReplicationPad3d(padding)`     | 三维复制填充，沿边界复制边缘值。 |
| `torch.nn.ZeroPad1d(padding)`            | 一维零填充。                     |
| `torch.nn.ZeroPad2d(padding)`            | 二维零填充。                     |
| `torch.nn.ZeroPad3d(padding)`            | 三维零填充。                     |
| `torch.nn.ConstantPad1d(padding, value)` | 一维常量填充，用指定值填充。     |
| `torch.nn.ConstantPad2d(padding, value)` | 二维常量填充，用指定值填充。     |
| `torch.nn.ConstantPad3d(padding, value)` | 三维常量填充，用指定值填充。     |
| `torch.nn.CircularPad1d(padding)`        | 一维循环填充。                   |
| `torch.nn.CircularPad2d(padding)`        | 二维循环填充。                   |
| `torch.nn.CircularPad3d(padding)`        | 三维循环填充。                   |

------

### **激活函数（非线性激活 - 加权求和类）**

| **类/函数**                                                  | **描述**                                                     |
| :----------------------------------------------------------- | :----------------------------------------------------------- |
| [`torch.nn.ReLU(inplace)`](https://www.runoob.com/pytorch/pytorch-torch-nn-relu.html) | ReLU 激活函数，f(x) = max(0, x)。                            |
| `torch.nn.ReLU6(inplace)`                                    | ReLU6 激活函数，f(x) = min(max(0, x), 6)。                   |
| [`torch.nn.Sigmoid()`](https://www.runoob.com/pytorch/pytorch-torch-nn-sigmoid.html) | Sigmoid 激活函数，f(x) = 1 / (1 + exp(-x))。                 |
| [`torch.nn.Tanh()`](https://www.runoob.com/pytorch/pytorch-torch-nn-tanh.html) | Tanh 激活函数，f(x) = (exp(x) - exp(-x)) / (exp(x) + exp(-x))。 |
| [`torch.nn.LeakyReLU(negative_slope, inplace)`](https://www.runoob.com/pytorch/pytorch-torch-nn-leakyrelu.html) | LeakyReLU，允许负值有小的梯度。                              |
| `torch.nn.PReLU(num_parameters, init)`                       | 参数化 ReLU，可学习的负斜率参数。                            |
| [`torch.nn.ELU(alpha, inplace)`](https://www.runoob.com/pytorch/pytorch-torch-nn-elu.html) | 指数线性单元，负值使用指数函数。                             |
| `torch.nn.CELU(alpha, inplace)`                              | 连续可微指数线性单元。                                       |
| `torch.nn.SELU(inplace)`                                     | 自归一化指数线性单元。                                       |
| [`torch.nn.GELU()`](https://www.runoob.com/pytorch/pytorch-torch-nn-gelu.html) | 高斯误差线性单元，Transformer 中常用。                       |
| [`torch.nn.SiLU(inplace)`](https://www.runoob.com/pytorch/pytorch-torch-nn-silu.html) | Sigmoid 线性单元（Swish），f(x) = x * sigmoid(x)。           |
| `torch.nn.Mish(inplace)`                                     | Mish 激活函数，f(x) = x * tanh(softplus(x))。                |
| `torch.nn.Hardtanh(min_value, max_value, inplace)`           | 硬双曲正切，限制输出范围。                                   |
| `torch.nn.Hardswish(inplace)`                                | Hard Swish，ReLU6 的平滑版本。                               |
| `torch.nn.Hardsigmoid(inplace)`                              | Hard Sigmoid，分段线性近似。                                 |
| `torch.nn.RReLU(lower, upper, inplace)`                      | 随机 LeakyReLU，训练时随机选择负斜率。                       |
| `torch.nn.Softplus(beta, threshold)`                         | Softplus，ReLU 的平滑近似。                                  |
| `torch.nn.Softshrink(lambda)`                                | Softshrink 激活函数。                                        |
| `torch.nn.Hardshrink(lambda)`                                | Hardshrink 激活函数。                                        |
| `torch.nn.Softsign()`                                        | Softsign 激活函数，f(x) = x / (1 + \|x\|)。                  |
| `torch.nn.Tanhshrink()`                                      | Tanhshrink，f(x) = x - tanh(x)。                             |
| `torch.nn.LogSigmoid()`                                      | Log Sigmoid，f(x) = log(sigmoid(x))。                        |
| `torch.nn.Threshold(threshold, value, inplace)`              | 阈值激活函数。                                               |
| `torch.nn.GLU(dim)`                                          | 门控线性单元，将输入沿指定维度分成两部分并逐元素相乘。       |

### **激活函数（非线性激活 - 其他）**

| **类/函数**                                                  | **描述**                                 |
| :----------------------------------------------------------- | :--------------------------------------- |
| [`torch.nn.Softmax(dim)`](https://www.runoob.com/pytorch/pytorch-torch-nn-softmax.html) | Softmax 激活函数，将数值转换为概率分布。 |
| `torch.nn.Softmax2d()`                                       | 对空间维度的 Softmax，用于图像。         |
| [`torch.nn.LogSoftmax(dim)`](https://www.runoob.com/pytorch/pytorch-torch-nn-logsoftmax.html) | Log Softmax，数值稳定版本的 Softmax。    |
| `torch.nn.Softmin(dim)`                                      | Softmin，与 Softmax 相反。               |
| `torch.nn.AdaptiveLogSoftmaxWithLoss(in_features, n_classes, cutoffs, div_value, head_bias)` | 自适应 Log Softmax，用于大词汇量分类。   |

------

### **归一化层**

| **类/函数**                                                  | **描述**                                     |
| :----------------------------------------------------------- | :------------------------------------------- |
| `torch.nn.BatchNorm1d(num_features, eps, momentum, affine, track_running_stats)` | 一维批归一化层，对小批量数据进行归一化。     |
| [`torch.nn.BatchNorm2d(num_features, eps, momentum, affine, track_running_stats)`](https://www.runoob.com/pytorch/pytorch-torch-nn-batchnorm2d.html) | 二维批归一化层，常用于卷积网络。             |
| `torch.nn.BatchNorm3d(num_features, eps, momentum, affine, track_running_stats)` | 三维批归一化层，用于视频等三维数据。         |
| `torch.nn.LazyBatchNorm1d()`                                 | 延迟初始化的一维批归一化。                   |
| `torch.nn.LazyBatchNorm2d()`                                 | 延迟初始化的二维批归一化。                   |
| `torch.nn.LazyBatchNorm3d()`                                 | 延迟初始化的三维批归一化。                   |
| [`torch.nn.LayerNorm(normalized_shape, eps, elementwise_affine)`](https://www.runoob.com/pytorch/pytorch-torch-nn-layernorm.html) | 层归一化，Transformer 中常用。               |
| [`torch.nn.GroupNorm(num_groups, num_channels, eps, affine)`](https://www.runoob.com/pytorch/pytorch-torch-nn-groupnorm.html) | 组归一化，将通道分组后归一化。               |
| `torch.nn.InstanceNorm1d(num_features, eps, momentum, affine, track_running_stats)` | 一维实例归一化，用于风格迁移。               |
| [`torch.nn.InstanceNorm2d(num_features, eps, momentum, affine, track_running_stats)`](https://www.runoob.com/pytorch/pytorch-torch-nn-instancenorm2d.html) | 二维实例归一化，用于风格迁移。               |
| `torch.nn.InstanceNorm3d(num_features, eps, momentum, affine, track_running_stats)` | 三维实例归一化，用于风格迁移。               |
| `torch.nn.SyncBatchNorm(num_features, eps, momentum, affine, track_running_stats, process_group)` | 同步批归一化，用于多 GPU 分布式训练。        |
| `torch.nn.LocalResponseNorm(k, alpha, beta, size)`           | 局部响应归一化，卷积神经网络中用于横向抑制。 |
| `torch.nn.RMSNorm(normalized_shape, eps, elementwise_affine)` | RMS 归一化，Transformer 中常用。             |

------

### **循环神经网络层**

| **类/函数**                                                  | **描述**                |
| :----------------------------------------------------------- | :---------------------- |
| [`torch.nn.RNN(input_size, hidden_size, num_layers, nonlinearity, bias, batch_first, dropout, bidirectional)`](https://www.runoob.com/pytorch/pytorch-torch-nn-rnn.html) | 简单 RNN 层。           |
| [`torch.nn.LSTM(input_size, hidden_size, num_layers, bias, batch_first, dropout, bidirectional, proj_size)`](https://www.runoob.com/pytorch/pytorch-torch-nn-lstm.html) | LSTM（长短期记忆）层。  |
| [`torch.nn.GRU(input_size, hidden_size, num_layers, bias, batch_first, dropout, bidirectional, proj_size)`](https://www.runoob.com/pytorch/pytorch-torch-nn-gru.html) | GRU（门控循环单元）层。 |
| `torch.nn.RNNCell(input_size, hidden_size, bias, nonlinearity)` | RNN 单元（单层）。      |
| `torch.nn.LSTMCell(input_size, hidden_size, bias)`           | LSTM 单元（单层）。     |
| `torch.nn.GRUCell(input_size, hidden_size, bias)`            | GRU 单元（单层）。      |

------

### **Transformer 层**

| **类/函数**                                                  | **描述**                  |
| :----------------------------------------------------------- | :------------------------ |
| [`torch.nn.Transformer(d_model, nhead, num_encoder_layers, num_decoder_layers, dim_feedforward, dropout, activation, custom_encoder, custom_decoder, layer_norm_eps, normalize_before, need_src_mask, need_tgt_mask, need_memory_mask, batch_first, norm_first, bias)`](https://www.runoob.com/pytorch/pytorch-torch-nn-transformer.html) | 完整的 Transformer 模型。 |
| [`torch.nn.TransformerEncoder(encoder_layer, num_layers, norm)`](https://www.runoob.com/pytorch/pytorch-torch-nn-transformerencoder.html) | Transformer 编码器。      |
| `torch.nn.TransformerDecoder(decoder_layer, num_layers, norm)` | Transformer 解码器。      |
| [`torch.nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward, dropout, activation, layer_norm_eps, batch_first, norm_first, bias)`](https://www.runoob.com/pytorch/pytorch-torch-nn-transformerencoderlayer.html) | Transformer 编码器层。    |
| `torch.nn.TransformerDecoderLayer(d_model, nhead, dim_feedforward, dropout, activation, layer_norm_eps, batch_first, norm_first, bias)` | Transformer 解码器层。    |
| [`torch.nn.MultiheadAttention(embed_dim, num_heads, dropout, bias, add_bias_kv, add_zero_attn, kdim, vdim, batch_first)`](https://www.runoob.com/pytorch/pytorch-torch-nn-multiheadattention.html) | 多头注意力机制。          |

------

### **注意力机制（Attention）**

| **函数**                                                     | **描述**                                   |
| :----------------------------------------------------------- | :----------------------------------------- |
| `torch.nn.functional.scaled_dot_product_attention(query, key, value, attn_mask, dropout_p, is_causal)` | 缩放点积注意力，PyTorch 优化的注意力实现。 |
| `torch.nn.attention.sdpa_kernel(backends)`                   | 设置 SDP（缩放点积注意力）后端。           |

------

### **嵌入层（稀疏层）**

| **类/函数**                                                  | **描述**                           |
| :----------------------------------------------------------- | :--------------------------------- |
| [`torch.nn.Embedding(num_embeddings, embedding_dim, padding_idx, max_norm, norm_type, scale_grad_by_freq, sparse)`](https://www.runoob.com/pytorch/pytorch-torch-nn-embedding.html) | 嵌入层，将离散索引映射到密集向量。 |
| [`torch.nn.EmbeddingBag(num_embeddings, embedding_dim, max_norm, norm_type, scale_grad_by_freq, mode, sparse, per_sample_weights, include_last_offset, padding_idx)`](https://www.runoob.com/pytorch/pytorch-torch-nn-embeddingbag.html) | 嵌入袋，对多个嵌入进行聚合。       |

------

### **Dropout 层**

| **类/函数**                                                  | **描述**                          |
| :----------------------------------------------------------- | :-------------------------------- |
| [`torch.nn.Dropout(p, inplace)`](https://www.runoob.com/pytorch/pytorch-torch-nn-dropout.html) | Dropout 层，随机置零输入元素。    |
| `torch.nn.Dropout1d(p, inplace)`                             | 一维 Dropout，用于一维输入。      |
| [`torch.nn.Dropout2d(p, inplace)`](https://www.runoob.com/pytorch/pytorch-torch-nn-dropout2d.html) | 二维 Dropout，用于二维特征图。    |
| `torch.nn.Dropout3d(p, inplace)`                             | 三维 Dropout，用于三维特征体。    |
| `torch.nn.AlphaDropout(p, inplace)`                          | Alpha Dropout，保持自归一化特性。 |
| `torch.nn.FeatureAlphaDropout(p, inplace)`                   | 特征 Alpha Dropout。              |

------

### **视觉层（Vision Layers）**

| **类/函数**                                                  | **描述**                                               |
| :----------------------------------------------------------- | :----------------------------------------------------- |
| `torch.nn.PixelShuffle(upscale_factor)`                      | 像素重排列，将通道维度转换为空间维度（上采样）。       |
| `torch.nn.PixelUnshuffle(downscale_factor)`                  | 像素重排列逆操作，将空间维度转换为通道维度（下采样）。 |
| `torch.nn.Upsample(size, scale_factor, mode, align_corners, recompute_scale_factor)` | 上采样层。                                             |
| `torch.nn.UpsamplingNearest2d(size, scale_factor)`           | 二维最近邻上采样。                                     |
| `torch.nn.UpsamplingBilinear2d(size, scale_factor, align_corners)` | 二维双线性上采样。                                     |
| `torch.nn.ChannelShuffle(groups)`                            | 通道混排，用于 ChannelShuffle 网络。                   |

------

### **损失函数**

| **类/函数**                                                  | **描述**                                      |
| :----------------------------------------------------------- | :-------------------------------------------- |
| [`torch.nn.MSELoss(size_average, reduce, reduction)`](https://www.runoob.com/pytorch/pytorch-torch-nn-mseloss.html) | 均方误差损失（Mean Squared Error）。          |
| [`torch.nn.L1Loss(size_average, reduce, reduction)`](https://www.runoob.com/pytorch/pytorch-torch-nn-l1loss.html) | L1 损失（Mean Absolute Error）。              |
| [`torch.nn.CrossEntropyLoss(weight, size_average, ignore_index, reduce, reduction, label_smoothing)`](https://www.runoob.com/pytorch/pytorch-torch-nn-crossentropyloss.html) | 交叉熵损失，用于多分类任务。                  |
| `torch.nn.NLLLoss(weight, size_average, ignore_index, reduce, reduction)` | 负对数似然损失。                              |
| `torch.nn.BCELoss(weight, size_average, reduce, reduction)`  | 二元交叉熵损失（二分类）。                    |
| [`torch.nn.BCEWithLogitsLoss(weight, pos_weight, size_average, reduce, reduction, label_smoothing)`](https://www.runoob.com/pytorch/pytorch-torch-nn-bcewithlogitsloss.html) | 带 Sigmoid 的二元交叉熵损失，数值更稳定。     |
| `torch.nn.KLDivLoss(size_average, reduce, reduction, log_target)` | KL 散度损失，用于分布匹配。                   |
| [`torch.nn.HuberLoss(delta, size_average, reduce, reduction)`](https://www.runoob.com/pytorch/pytorch-torch-nn-huberloss.html) | Huber 损失，L1 和 L2 的组合，对异常值更鲁棒。 |
| `torch.nn.SmoothL1Loss(beta, size_average, reduce, reduction)` | 平滑 L1 损失（Huber 损失的变体）。            |
| `torch.nn.CTCLoss(blank, reduction, zero_infinity)`          | 连接时序分类损失，用于语音识别等序列任务。    |
| `torch.nn.PoissonNLLLoss(log_input, full, size_average, reduce, reduction)` | 泊松负对数似然损失。                          |
| `torch.nn.GaussianNLLLoss(full, size_average, reduce, reduction)` | 高斯负对数似然损失。                          |
| `torch.nn.MarginRankingLoss(margin, size_average, reduce, reduction)` | 间隔排序损失，用于学习排序。                  |
| `torch.nn.HingeEmbeddingLoss(margin, size_average, reduce, reduction)` | 铰链嵌入损失，用于度量学习。                  |
| `torch.nn.MultiLabelMarginLoss(size_average, reduce, reduction)` | 多标签间隔损失。                              |
| `torch.nn.SoftMarginLoss(size_average, reduce, reduction)`   | 软间隔损失。                                  |
| `torch.nn.MultiLabelSoftMarginLoss(weight, size_average, reduce, reduction)` | 多标签软间隔损失。                            |
| `torch.nn.CosineEmbeddingLoss(margin, size_average, reduce, reduction)` | 余弦嵌入损失，用于度量学习。                  |
| `torch.nn.MultiMarginLoss(p, margin, weight, size_average, reduce, reduction)` | 多分类间隔损失。                              |
| `torch.nn.TripletMarginLoss(margin, p, eps, swap, size_average, reduce, reduction)` | 三元组损失，用于度量学习和对比学习。          |
| `torch.nn.TripletMarginWithDistanceLoss(distance_function, margin, swap, size_average, reduce, reduction)` | 带距离函数的三元组损失。                      |

------

### **距离函数**

| **类/函数**                                  | **描述**         |
| :------------------------------------------- | :--------------- |
| `torch.nn.PairwiseDistance(p, eps, keepdim)` | 成对距离计算。   |
| `torch.nn.CosineSimilarity(dim, eps)`        | 余弦相似度计算。 |

------

### **并行层（DataParallel）**

| **类/函数**                                                  | **描述**                               |
| :----------------------------------------------------------- | :------------------------------------- |
| `torch.nn.DataParallel(module, device_ids, output_device, dim)` | 数据并行，在多个 GPU 上并行运行模型。  |
| `torch.nn.parallel.DistributedDataParallel(module, device_ids, broadcast_buffers, bucket_cap_mb, find_unused_parameters, gradient_as_bucket_view, static_graph)` | 分布式数据并行，用于多节点分布式训练。 |

------

### **实用函数（nn.functional）**

| **函数**                                                     | **描述**                               |
| :----------------------------------------------------------- | :------------------------------------- |
| `torch.nn.functional.relu(input, inplace)`                   | 应用 ReLU 激活函数。                   |
| `torch.nn.functional.sigmoid(input)`                         | 应用 Sigmoid 激活函数。                |
| `torch.nn.functional.tanh(input)`                            | 应用 Tanh 激活函数。                   |
| `torch.nn.functional.softmax(input, dim, dtype)`             | 应用 Softmax 激活函数。                |
| `torch.nn.functional.log_softmax(input, dim, dtype)`         | 应用 Log Softmax 激活函数。            |
| `torch.nn.functional.gelu(input)`                            | 应用 GELU 激活函数。                   |
| `torch.nn.functional.silu(input)`                            | 应用 SiLU（Swish）激活函数。           |
| `torch.nn.functional.mish(input)`                            | 应用 Mish 激活函数。                   |
| `torch.nn.functional.hardswish(input)`                       | 应用 Hardswish 激活函数。              |
| `torch.nn.functional.leaky_relu(input, negative_slope, inplace)` | 应用 LeakyReLU 激活函数。              |
| `torch.nn.functional.elu(input, alpha, inplace)`             | 应用 ELU 激活函数。                    |
| `torch.nn.functional.dropout(input, p, training, inplace)`   | 应用 Dropout。                         |
| `torch.nn.functional.conv1d(input, weight, bias, stride, padding, dilation, groups)` | 一维卷积操作。                         |
| `torch.nn.functional.conv2d(input, weight, bias, stride, padding, dilation, groups)` | 二维卷积操作。                         |
| `torch.nn.functional.conv3d(input, weight, bias, stride, padding, dilation, groups)` | 三维卷积操作。                         |
| `torch.nn.functional.max_pool1d(input, kernel_size, stride, padding, dilation, return_indices)` | 一维最大池化。                         |
| `torch.nn.functional.max_pool2d(input, kernel_size, stride, padding, dilation, return_indices, ceil_mode)` | 二维最大池化。                         |
| `torch.nn.functional.avg_pool1d(input, kernel_size, stride, padding, ceil_mode, count_include_pad)` | 一维平均池化。                         |
| `torch.nn.functional.avg_pool2d(input, kernel_size, stride, padding, ceil_mode, count_include_pad)` | 二维平均池化。                         |
| `torch.nn.functional.linear(input, weight, bias)`            | 线性变换（矩阵乘法）。                 |
| `torch.nn.functional.cross_entropy(input, target, weight, size_average, ignore_index, reduce, reduction, label_smoothing)` | 计算交叉熵损失。                       |
| `torch.nn.functional.mse_loss(input, target, size_average, reduce, reduction)` | 计算均方误差损失。                     |
| `torch.nn.functional.l1_loss(input, target, size_average, reduce, reduction)` | 计算 L1 损失。                         |
| `torch.nn.functional.binary_cross_entropy(input, target, weight, size_average, reduce, reduction)` | 计算二元交叉熵损失。                   |
| `torch.nn.functional.nll_loss(input, target, weight, size_average, ignore_index, reduce, reduction)` | 计算负对数似然损失。                   |
| `torch.nn.functional.huber_loss(input, target, delta, size_average, reduce, reduction)` | 计算 Huber 损失。                      |
| `torch.nn.functional.batch_norm(input, running_mean, running_var, weight, bias, training, momentum, eps, track_running_stats)` | 批归一化操作。                         |
| `torch.nn.functional.layer_norm(input, normalized_shape, weight, bias, eps)` | 层归一化操作。                         |
| `torch.nn.functional.group_norm(input, num_groups, weight, bias, eps)` | 组归一化操作。                         |
| `torch.nn.functional.interpolate(input, size, scale_factor, mode, align_corners, recompute_scale_factor)` | 插值（上/下采样）。                    |
| `torch.nn.functional.grid_sample(input, grid, mode, padding_mode, align_corners)` | 网格采样，用于图像配准和空间变换网络。 |
| `torch.nn.functional.affine_grid(theta, size, align_corners)` | 仿射网格生成，用于空间变换网络。       |
| `torch.nn.functional.pixel_shuffle(input, upscale_factor)`   | 像素重排列。                           |
| `torch.nn.functional.pixel_unshuffle(input, downscale_factor)` | 像素重排列逆操作。                     |
| `torch.nn.functional.pad(input, pad, mode, value)`           | 填充操作。                             |
| `torch.nn.functional.one_hot(tensor, num_classes)`           | 将整数转换为独热编码。                 |
| `torch.nn.functional.embedding(input, weight, padding_idx, max_norm, norm_type, scale_grad_by_freq, sparse)` | 嵌入操作。                             |
| `torch.nn.functional.cosine_similarity(x1, x2, dim, eps)`    | 余弦相似度计算。                       |
| `torch.nn.functional.pairwise_distance(x1, x2, p, eps, keepdim)` | 成对距离计算。                         |

------

### **工具函数（nn.utils）**

| **函数**                                                     | **描述**                             |
| :----------------------------------------------------------- | :----------------------------------- |
| `torch.nn.utils.clip_grad_norm_(parameters, max_norm, norm_type, error_if_nonfinite)` | 裁剪梯度范数（原地操作）。           |
| `torch.nn.utils.clip_grad_norm(parameters, max_norm, norm_type)` | 裁剪梯度范数（非原地）。             |
| `torch.nn.utils.clip_grad_value_(parameters, clip_value)`    | 裁剪梯度值范围。                     |
| `torch.nn.utils.get_total_norm(parameters, norm_type)`       | 计算总梯度范数。                     |
| `torch.nn.utils.weight_norm(module, name, dim)`              | 对模块参数应用权重归一化。           |
| `torch.nn.utils.remove_weight_norm(module, name)`            | 移除权重归一化。                     |
| `torch.nn.utils.spectral_norm(module, name, n_power_iterations, eps, bias)` | 对模块参数应用谱归一化。             |
| `torch.nn.utils.remove_spectral_norm(module, name)`          | 移除谱归一化。                       |
| `torch.nn.utils.fuse_conv_bn_eval(conv, bn)`                 | 融合卷积层和批归一化层（推理模式）。 |
| `torch.nn.utils.fuse_linear_bn_eval(linear, bn)`             | 融合线性层和批归一化层（推理模式）。 |
| `torch.nn.utils.skip_init(module_class, *args, **kwargs)`    | 跳过参数初始化。                     |
| `torch.nn.utils.parameters_to_vector(parameters)`            | 将参数列表展平为向量。               |
| `torch.nn.utils.vector_to_parameters(vector, parameters)`    | 将向量重塑为参数列表。               |

------

### **参数初始化（nn.init）**

| **函数**                                                     | **描述**                                 |
| :----------------------------------------------------------- | :--------------------------------------- |
| `torch.nn.init.zeros_(tensor)`                               | 用零初始化张量。                         |
| `torch.nn.init.ones_(tensor)`                                | 用一初始化张量。                         |
| `torch.nn.init.uniform_(tensor, a, b)`                       | 均匀分布初始化。                         |
| `torch.nn.init.normal_(tensor, mean, std)`                   | 正态分布初始化。                         |
| `torch.nn.init.constant_(tensor, val)`                       | 常量值初始化。                           |
| `torch.nn.init.eye_(tensor)`                                 | 单位矩阵初始化（仅适用于 2D 方阵）。     |
| `torch.nn.init.dirac_(tensor)`                               | Dirac delta 初始化（保留输入通道数）。   |
| `torch.nn.init.xavier_uniform_(tensor, gain)`                | Xavier 均匀分布初始化。                  |
| `torch.nn.init.xavier_normal_(tensor, gain)`                 | Xavier 正态分布初始化。                  |
| `torch.nn.init.kaiming_uniform_(tensor, a, mode, nonlinearity)` | Kaiming 均匀分布初始化，适合 ReLU 激活。 |
| `torch.nn.init.kaiming_normal_(tensor, a, mode, nonlinearity)` | Kaiming 正态分布初始化，适合 ReLU 激活。 |
| `torch.nn.init.trunc_normal_(tensor, mean, std, a, b)`       | 截断正态分布初始化。                     |
| `torch.nn.init.orthogonal_(tensor, gain)`                    | 正交初始化。                             |
| `torch.nn.init.sparse_(tensor, sparsity, std)`               | 稀疏初始化（大部分置零）。               |
| `torch.nn.init.calculate_gain(nonlinearity, param)`          | 计算初始化增益值。                       |

------

### **RNN 工具函数**

| **函数**                                                     | **描述**                     |
| :----------------------------------------------------------- | :--------------------------- |
| `torch.nn.utils.rnn.PackedSequence`                          | 打包序列，用于处理变长序列。 |
| `torch.nn.utils.rnn.pack_padded_sequence(input, lengths, batch_first, enforce_sorted)` | 打包填充序列。               |
| `torch.nn.utils.rnn.pad_packed_sequence(input, batch_first, padding_value, total_length)` | 解包序列。                   |
| `torch.nn.utils.rnn.pad_sequence(sequences, batch_first, padding_value)` | 填充序列到相同长度。         |
| `torch.nn.utils.rnn.pack_sequence(sequences, enforce_sorted)` | 直接打包序列列表。           |

------

### **剪枝函数（Pruning）**

| **函数**                                                     | **描述**             |
| :----------------------------------------------------------- | :------------------- |
| `torch.nn.utils.prune.random_unstructured(module, name, amount)` | 随机非结构化剪枝。   |
| `torch.nn.utils.prune.l1_unstructured(module, name, amount)` | L1 非结构化剪枝。    |
| `torch.nn.utils.prune.global_unstructured(parameters, pruning_method, amount)` | 全局非结构化剪枝。   |
| `torch.nn.utils.prune.remove(module, name)`                  | 移除剪枝。           |
| `torch.nn.utils.prune.is_pruned(module)`                     | 检查模块是否已剪枝。 |

------

### **Flatten 层**

| **类/函数**                                                  | **描述**                           |
| :----------------------------------------------------------- | :--------------------------------- |
| [`torch.nn.Flatten(start_dim, end_dim)`](https://www.runoob.com/pytorch/pytorch-torch-nn-flatten.html) | 展平张量，将多维张量展平为二维。   |
| `torch.nn.Unflatten(dim, unflattened_size)`                  | 解展平，将一维张量重新整形为多维。 |