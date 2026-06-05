---
date: 2026年06月05日
---



# Pytorch torch 参考手册

PyTorch 软件包包含了用于多维张量的数据结构，并定义了在这些张量上执行的数学运算。此外，它还提供了许多实用工具，用于高效地序列化张量和任意类型的数据，以及其他有用的工具。

它还有一个 CUDA 版本，可以让你在计算能力 >= 3.0 的 NVIDIA GPU 上运行张量计算。

## PyTorch torch API 手册

### **Tensors 类型判断**

| 函数                                         | 描述                                            |
| :------------------------------------------- | :---------------------------------------------- |
| `torch.is_tensor(obj)`                       | 检查 `obj` 是否为 PyTorch 张量。                |
| `torch.is_storage(obj)`                      | 检查 `obj` 是否为 PyTorch 存储对象。            |
| `torch.is_complex(input)`                    | 检查 `input` 数据类型是否为复数数据类型。       |
| `torch.is_conj(input)`                       | 检查 `input` 是否为共轭张量。                   |
| `torch.is_floating_point(input)`             | 检查 `input` 数据类型是否为浮点数据类型。       |
| `torch.is_nonzero(input)`                    | 检查 `input` 是否为非零单一元素张量。           |
| `torch.set_default_dtype(d)`                 | 设置默认浮点数据类型为 `d`。                    |
| `torch.get_default_dtype()`                  | 获取当前默认浮点 `torch.dtype`。                |
| `torch.set_default_device(device)`           | 设置默认 `torch.Tensor` 分配的设备为 `device`。 |
| `torch.get_default_device()`                 | 获取默认 `torch.Tensor` 分配的设备。            |
| `torch.set_default_tensor_type(tensor_type)` | 设置默认张量类型为 `tensor_type`。              |
| `torch.numel(input)`                         | 返回 `input` 张量中的元素总数。                 |
| `torch.set_printoptions(...)`                | 设置张量打印选项。                              |

------

### **Tensor 创建**

| 函数                                                         | 描述                                           |
| :----------------------------------------------------------- | :--------------------------------------------- |
| `torch.tensor(data, dtype, device, requires_grad)`           | 从数据创建张量，复制数据，无自动梯度历史。     |
| `torch.as_tensor(data, dtype, device)`                       | 将数据转换为张量，共享数据并保留自动梯度历史。 |
| `torch.asarray(data, dtype, device)`                         | 将数据转换为张量数组。                         |
| `torch.from_numpy(ndarray)`                                  | 从 NumPy 数组创建张量（共享内存）。            |
| `torch.from_dlpack(ext_tensor)`                              | 从 dlpack 张量创建 PyTorch 张量。              |
| `torch.frombuffer(buffer, dtype, count, offset)`             | 从 buffer 创建一维张量。                       |
| `torch.zeros(*size, dtype, device, requires_grad)`           | 创建全零张量。                                 |
| `torch.zeros_like(input, dtype, device, requires_grad)`      | 创建与输入相同形状的全零张量。                 |
| `torch.ones(*size, dtype, device, requires_grad)`            | 创建全一张量。                                 |
| `torch.ones_like(input, dtype, device, requires_grad)`       | 创建与输入相同形状的全一张量。                 |
| `torch.empty(*size, dtype, device, requires_grad)`           | 创建未初始化的张量。                           |
| `torch.empty_like(input, dtype, device, requires_grad)`      | 创建与输入相同形状的未初始化张量。             |
| `torch.empty_strided(size, stride, dtype, device)`           | 创建具有指定步幅的未初始化张量。               |
| `torch.arange(start, end, step, dtype, device, requires_grad)` | 创建等差序列张量。                             |
| `torch.range(start, end, step, dtype, device, requires_grad)` | 创建包含 end 值的等差序列张量。                |
| `torch.linspace(start, end, steps, dtype, device, requires_grad)` | 创建等间隔序列张量。                           |
| `torch.logspace(start, end, steps, base, dtype, device, requires_grad)` | 创建对数间隔序列张量。                         |
| `torch.eye(n, m, dtype, device, requires_grad)`              | 创建单位矩阵。                                 |
| `torch.full(size, fill_value, dtype, device, requires_grad)` | 创建填充指定值的张量。                         |
| `torch.full_like(input, fill_value, dtype, device, requires_grad)` | 创建与输入相同形状的填充张量。                 |
| `torch.rand(*size, dtype, device, requires_grad)`            | 创建均匀分布随机张量（范围 [0, 1)）。          |
| `torch.rand_like(input, dtype, device, requires_grad)`       | 创建与输入相同形状的均匀分布随机张量。         |
| `torch.randn(*size, dtype, device, requires_grad)`           | 创建标准正态分布随机张量。                     |
| `torch.randn_like(input, dtype, device, requires_grad)`      | 创建与输入相同形状的标准正态分布随机张量。     |
| `torch.randint(low, high, size, dtype, device, requires_grad)` | 创建整数随机张量。                             |
| `torch.randint_like(input, low, high, dtype, device, requires_grad)` | 创建与输入相同形状的整数随机张量。             |
| `torch.randperm(n, dtype, device, requires_grad)`            | 创建 0 到 n-1 的随机排列。                     |
| `torch.sparse_coo_tensor(indices, values, size, dtype, device, requires_grad)` | 在指定的 `indices` 处构造稀疏 COO 张量。       |
| `torch.sparse_csr_tensor(crow_indices, col_indices, values, size, dtype, device)` | 构造稀疏 CSR 张量。                            |
| `torch.sparse_csc_tensor(ccol_indices, row_indices, values, size, dtype, device)` | 构造稀疏 CSC 张量。                            |
| `torch.quantize_per_tensor(input, scale, zero_point, dtype)` | 创建量化张量（per-tensor）。                   |
| `torch.quantize_per_channel(input, scales, zero_points, axis, dtype)` | 创建量化张量（per-channel）。                  |
| `torch.dequantize(input)`                                    | 反量化张量。                                   |
| `torch.complex(real, imag)`                                  | 从实部和虚部创建复数张量。                     |
| `torch.polar(abs, angle)`                                    | 从极坐标创建复数张量。                         |
| `torch.heaviside(input, values)`                             | 计算 Heaviside 阶跃函数。                      |

------

### **索引、切片、连接、变异操作**

| 函数                                                         | 描述                                          |
| :----------------------------------------------------------- | :-------------------------------------------- |
| `torch.cat(tensors, dim, out)`                               | 沿指定维度连接张量。                          |
| `torch.concat(tensors, dim, out)`                            | 沿指定维度连接张量（同 cat）。                |
| `torch.concatenate(tensors, dim, out)`                       | 沿指定维度连接张量（同 cat）。                |
| `torch.stack(tensors, dim, out)`                             | 沿新维度堆叠张量。                            |
| `torch.split(tensor, split_size, dim)`                       | 将张量沿指定维度分割。                        |
| `torch.chunk(tensor, chunks, dim)`                           | 将张量沿指定维度分块。                        |
| `torch.reshape(input, shape)`                                | 改变张量的形状。                              |
| `torch.transpose(input, dim0, dim1)`                         | 交换张量的两个维度。                          |
| `torch.t(input)`                                             | 转置二维张量。                                |
| `torch.squeeze(input, dim)`                                  | 移除大小为 1 的维度。                         |
| `torch.unsqueeze(input, dim)`                                | 在指定位置插入大小为 1 的维度。               |
| `torch.permute(input, dims)`                                 | 重新排列张量的维度。                          |
| `torch.movedim(input, source, destination)`                  | 移动张量的维度到新位置。                      |
| `torch.moveaxis(input, source, destination)`                 | 移动张量的轴到新位置。                        |
| `torch.narrow(input, dim, start, length)`                    | 返回张量的切片。                              |
| `torch.narrow_copy(input, dim, start, length)`               | 返回张量的切片副本。                          |
| `torch.select(input, dim, index)`                            | 沿指定维度选择索引对应的切片。                |
| `torch.slice_scatter(input, src, dim, start, end)`           | 将 src 散布到 input 的切片中。                |
| `torch.select_scatter(input, src, dim, index)`               | 将 src 散布到指定索引位置。                   |
| `torch.diagonal_scatter(input, src, offset, dim1, dim2)`     | 将值散布到对角线位置。                        |
| `torch.expand(input, size)`                                  | 扩展张量的尺寸（复制视图）。                  |
| `torch.expand_as(input, other)`                              | 将张量扩展到与 other 相同的尺寸。             |
| `torch.masked_select(input, mask)`                           | 根据布尔掩码选择元素。                        |
| `torch.index_select(input, dim, index)`                      | 沿指定维度选择索引对应的元素。                |
| `torch.gather(input, dim, index, sparse_grad)`               | 沿指定维度收集指定索引的元素。                |
| `torch.scatter(input, dim, index, src, reduce)`              | 将 `src` 的值散布到 `input` 的指定位置。      |
| `torch.scatter_add(input, dim, index, src)`                  | 将 src 的值加到指定位置。                     |
| `torch.scatter_reduce(input, dim, index, src, reduce, include_self)` | 将 src 的值按指定方式聚合到指定位置。         |
| `torch.index_add(input, dim, index, source, alpha)`          | 将 source 加到 index 指定的位置。             |
| `torch.index_copy(input, dim, index, source)`                | 将 source 复制到 index 指定的位置。           |
| `torch.index_reduce(input, dim, index, source, reduce, include_self)` | 将 source 按指定方式聚合到 index 指定的位置。 |
| `torch.take(input, index)`                                   | 获取给定索引位置的元素。                      |
| `torch.take_along_dim(input, indices, dim)`                  | 沿指定维度获取索引位置的元素。                |
| `torch.nonzero(input)`                                       | 返回非零元素的索引。                          |
| `torch.argwhere(input)`                                      | 返回满足条件的元素索引。                      |
| `torch.where(condition, input, other)`                       | 根据条件返回元素。                            |
| `torch.unbind(tensor, dim)`                                  | 沿指定维度分割为元组。                        |
| `torch.split_with_sizes(tensor, split_sizes, dim)`           | 按大小分割张量。                              |
| `torch.tensor_split(tensor, indices_or_sections, dim)`       | 按索引或段数分割张量。                        |
| `torch.hsplit(tensor, indices_or_sections)`                  | 水平分割张量。                                |
| `torch.vsplit(tensor, indices_or_sections)`                  | 垂直分割张量。                                |
| `torch.dsplit(tensor, indices_or_sections)`                  | 深度分割张量。                                |
| `torch.hstack(tensors, dim, out)`                            | 水平堆叠张量。                                |
| `torch.vstack(tensors, out)`                                 | 垂直堆叠张量。                                |
| `torch.dstack(tensors, out)`                                 | 深度堆叠张量。                                |
| `torch.column_stack(tensors, out)`                           | 列堆叠张量。                                  |
| `torch.row_stack(tensors, out)`                              | 行堆叠张量（同 vstack）。                     |
| `torch.tile(input, dims)`                                    | 重复张量多次。                                |
| `torch.repeat_interleave(input, repeats, dim)`               | 沿指定维度重复元素。                          |
| `torch.flip(input, dims)`                                    | 沿指定维度翻转张量。                          |
| `torch.fliplr(input)`                                        | 左右翻转张量。                                |
| `torch.flipud(input)`                                        | 上下翻转张量。                                |
| `torch.rot90(input, k, dims)`                                | 旋转张量 90 度。                              |
| `torch.linalg.matrix_transpose(input)`                       | 矩阵转置。                                    |
| `torch.adjoint(input)`                                       | 返回张量的伴随矩阵。                          |
| `torch.resolve_conj(input)`                                  | 解析共轭张量。                                |
| `torch.resolve_neg(input)`                                   | 解析负张量。                                  |
| `torch.view_as_real(input)`                                  | 将复数张量视为实数张量。                      |
| `torch.view_as_complex(input)`                               | 将实数张量视为复数张量。                      |
| `torch.unravel_index(indices, shape)`                        | 将展平索引转换为多维索引。                    |

------

### **随机数生成**

| 函数                                                         | 描述                                       |
| :----------------------------------------------------------- | :----------------------------------------- |
| `torch.manual_seed(seed)`                                    | 设置随机种子（CPU）。                      |
| `torch.seed()`                                               | 设置随机种子并返回新的种子值。             |
| `torch.initial_seed()`                                       | 返回当前随机种子。                         |
| `torch.get_rng_state()`                                      | 返回随机数生成器状态。                     |
| `torch.set_rng_state(state)`                                 | 设置随机数生成器状态。                     |
| `torch.rand(*size, dtype, device, requires_grad)`            | 创建均匀分布随机张量（范围 [0, 1)）。      |
| `torch.rand_like(input, dtype, device, requires_grad)`       | 创建与输入相同形状的均匀分布随机张量。     |
| `torch.randn(*size, dtype, device, requires_grad)`           | 创建标准正态分布随机张量。                 |
| `torch.randn_like(input, dtype, device, requires_grad)`      | 创建与输入相同形状的标准正态分布随机张量。 |
| `torch.randint(low, high, size, dtype, device, requires_grad)` | 创建整数随机张量。                         |
| `torch.randint_like(input, low, high, dtype, device, requires_grad)` | 创建与输入相同形状的整数随机张量。         |
| `torch.randperm(n, dtype, device, requires_grad)`            | 创建 0 到 n-1 的随机排列。                 |
| `torch.bernoulli(input, *, generator)`                       | 从伯努利分布生成随机数。                   |
| `torch.multinomial(input, num_samples, replacement, generator)` | 多项式采样。                               |
| `torch.normal(mean, std, out)`                               | 从正态分布生成随机数。                     |
| `torch.poisson(input, generator)`                            | 从泊松分布生成随机数。                     |

------

### **序列化**

| 函数                                                       | 描述             |
| :--------------------------------------------------------- | :--------------- |
| `torch.save(obj, f, pickle_module, pickle_protocol)`       | 保存对象到文件。 |
| `torch.load(f, map_location, pickle_module, weights_only)` | 从文件加载对象。 |

------

### **梯度控制**

| 函数                                | 描述                                            |
| :---------------------------------- | :---------------------------------------------- |
| `torch.no_grad()`                   | 上下文管理器，禁用梯度计算。                    |
| `torch.enable_grad()`               | 上下文管理器，启用梯度计算。                    |
| `torch.set_grad_enabled(grad)`      | 设置是否启用梯度计算。                          |
| `torch.is_grad_enabled()`           | 检查是否启用梯度计算。                          |
| `torch.inference_mode()`            | 上下文管理器，推理模式（禁用梯度和 autograd）。 |
| `torch.is_inference_mode_enabled()` | 检查是否启用推理模式。                          |

------

### **数学运算 - 点操作**

| 函数                                                         | 描述                                        |
| :----------------------------------------------------------- | :------------------------------------------ |
| `torch.abs(input, out)`                                      | 逐元素绝对值。                              |
| `torch.absolute(input, out)`                                 | 逐元素绝对值（同 abs）。                    |
| `torch.acos(input, out)`                                     | 逐元素反余弦。                              |
| `torch.arccos(input, out)`                                   | 逐元素反余弦（同 acos）。                   |
| `torch.acosh(input, out)`                                    | 逐元素反双曲余弦。                          |
| `torch.arccosh(input, out)`                                  | 逐元素反双曲余弦（同 acosh）。              |
| `torch.add(input, other, alpha, out)`                        | 逐元素加法（可指定 alpha 缩放）。           |
| `torch.addcdiv(input, tensor1, tensor2, value, out)`         | 执行 input + value * (tensor1 / tensor2)。  |
| `torch.addcmul(input, tensor1, tensor2, value, out)`         | 执行 input + value * (tensor1 * tensor2)。  |
| `torch.angle(input, out)`                                    | 返回复数张量的相位角。                      |
| `torch.asin(input, out)`                                     | 逐元素反正弦。                              |
| `torch.arcsin(input, out)`                                   | 逐元素反正弦（同 asin）。                   |
| `torch.asinh(input, out)`                                    | 逐元素反双曲正弦。                          |
| `torch.arcsinh(input, out)`                                  | 逐元素反双曲正弦（同 asinh）。              |
| `torch.atan(input, out)`                                     | 逐元素反正切。                              |
| `torch.arctan(input, out)`                                   | 逐元素反正切（同 atan）。                   |
| `torch.atan2(input, other, out)`                             | 逐元素二维反正切。                          |
| `torch.arctan2(input, other, out)`                           | 逐元素二维反正切（同 atan2）。              |
| `torch.atanh(input, out)`                                    | 逐元素反双曲正切。                          |
| `torch.arctanh(input, out)`                                  | 逐元素反双曲正切（同 atanh）。              |
| `torch.bitwise_not(input, out)`                              | 逐元素按位取反。                            |
| `torch.bitwise_and(input, other, out)`                       | 逐元素按位与。                              |
| `torch.bitwise_or(input, other, out)`                        | 逐元素按位或。                              |
| `torch.bitwise_xor(input, other, out)`                       | 逐元素按位异或。                            |
| `torch.bitwise_left_shift(input, other, out)`                | 逐元素左移位。                              |
| `torch.bitwise_right_shift(input, other, out)`               | 逐元素右移位。                              |
| `torch.ceil(input, out)`                                     | 逐元素向上取整。                            |
| `torch.clamp(input, min, max, out)`                          | 将张量值限制在指定范围内。                  |
| `torch.clip(input, min, max, out)`                           | 将张量值限制在指定范围内（同 clamp）。      |
| `torch.conj_physical(input, out)`                            | 逐元素计算物理共轭。                        |
| `torch.copysign(input, other, out)`                          | 逐元素复制符号。                            |
| `torch.cos(input, out)`                                      | 逐元素余弦。                                |
| `torch.cosh(input, out)`                                     | 逐元素双曲余弦。                            |
| `torch.deg2rad(input, out)`                                  | 将角度转换为弧度。                          |
| `torch.div(input, other, rounding_mode, out)`                | 逐元素除法。                                |
| `torch.divide(input, other, rounding_mode, out)`             | 逐元素除法（同 div）。                      |
| `torch.digamma(input, out)`                                  | 逐元素计算 psi 函数（对数导数）。           |
| `torch.erf(input, out)`                                      | 逐元素误差函数。                            |
| `torch.erfc(input, out)`                                     | 逐元素互补误差函数。                        |
| `torch.erfinv(input, out)`                                   | 逐元素误差函数逆。                          |
| `torch.exp(input, out)`                                      | 逐元素指数函数。                            |
| `torch.exp2(input, out)`                                     | 逐元素 2 的幂。                             |
| `torch.expm1(input, out)`                                    | 逐元素 exp(x) - 1。                         |
| `torch.fake_quantize_per_channel_affine(input, scale, zero_point, axis, quant_min, quant_max)` | 模拟每通道量化。                            |
| `torch.fake_quantize_per_tensor_affine(input, scale, zero_point, quant_min, quant_max)` | 模拟每张量量化。                            |
| `torch.fix(input, out)`                                      | 逐元素取整数部分（向零取整）。              |
| `torch.float_power(input, exponent, out)`                    | 逐元素浮点幂运算。                          |
| `torch.floor(input, out)`                                    | 逐元素向下取整。                            |
| `torch.floor_divide(input, other, out)`                      | 逐元素整除。                                |
| `torch.fmod(input, other, out)`                              | 逐元素取模（余数）。                        |
| `torch.frac(input, out)`                                     | 逐元素取小数部分。                          |
| `torch.frexp(input, out)`                                    | 将浮点数分解为尾数和指数。                  |
| `torch.gradient(input, dim, spacing, edge_order)`            | 计算张量的梯度。                            |
| `torch.imag(input, out)`                                     | 返回复数张量的虚部。                        |
| `torch.ldexp(input, other, out)`                             | 逐元素计算 input * 2**other。               |
| `torch.lerp(input, end, weight, out)`                        | 逐元素线性插值。                            |
| `torch.lgamma(input, out)`                                   | 逐元素 gamma 函数的对数。                   |
| `torch.log(input, out)`                                      | 逐元素自然对数。                            |
| `torch.log10(input, out)`                                    | 逐元素以 10 为底的对数。                    |
| `torch.log1p(input, out)`                                    | 逐元素 log(1 + x)。                         |
| `torch.log2(input, out)`                                     | 逐元素以 2 为底的对数。                     |
| `torch.logaddexp(input, other, out)`                         | 逐元素 log(exp(input) + exp(other))。       |
| `torch.logaddexp2(input, other, out)`                        | 逐元素 log2(2**input + 2**other)。          |
| `torch.logical_and(input, other, out)`                       | 逐元素逻辑与。                              |
| `torch.logical_not(input, out)`                              | 逐元素逻辑非。                              |
| `torch.logical_or(input, other, out)`                        | 逐元素逻辑或。                              |
| `torch.logical_xor(input, other, out)`                       | 逐元素逻辑异或。                            |
| `torch.logit(input, eps, out)`                               | 逐元素 logit 函数。                         |
| `torch.hypot(input, other, out)`                             | 逐元素 hypot 函数 sqrt(input^2 + other^2)。 |
| `torch.i0(input, out)`                                       | 逐元素修正贝塞尔函数（第一类，0 阶）。      |
| `torch.igamma(input, other, out)`                            | 逐元素不完全 gamma 函数。                   |
| `torch.igammac(input, other, out)`                           | 逐元素互补不完全 gamma 函数。               |
| `torch.mul(input, other, out)`                               | 逐元素乘法。                                |
| `torch.multiply(input, other, out)`                          | 逐元素乘法（同 mul）。                      |
| `torch.mvlgamma(input, p, out)`                              | 逐元素多元 gamma 函数的对数。               |
| `torch.nan_to_num(input, nan, posinf, neginf, out)`          | 将 NaN 替换为指定值。                       |
| `torch.neg(input, out)`                                      | 逐元素取负。                                |
| `torch.negative(input, out)`                                 | 逐元素取负（同 neg）。                      |
| `torch.nextafter(input, other, out)`                         | 逐元素返回下一个可表示的浮点数。            |
| `torch.polygamma(input, n, out)`                             | 逐元素 polygamma 函数。                     |
| `torch.positive(input, out)`                                 | 逐元素取正。                                |
| `torch.pow(input, exponent, out)`                            | 逐元素幂运算。                              |
| `torch.quantized_batch_norm(input, weight, bias, mean, var, eps, output_scale, output_zero_point)` | 量化批归一化。                              |
| `torch.quantized_max_pool1d(input, kernel_size, stride, padding, dilation, ceil_mode)` | 量化最大池化（1D）。                        |
| `torch.quantized_max_pool2d(input, kernel_size, stride, padding, dilation, ceil_mode)` | 量化最大池化（2D）。                        |
| `torch.rad2deg(input, out)`                                  | 将弧度转换为角度。                          |
| `torch.real(input, out)`                                     | 返回复数张量的实部。                        |
| `torch.reciprocal(input, out)`                               | 逐元素倒数。                                |
| `torch.remainder(input, other, out)`                         | 逐元素取余。                                |
| `torch.round(input, decimals, out)`                          | 逐元素四舍五入。                            |
| `torch.rsqrt(input, out)`                                    | 逐元素平方根倒数。                          |
| `torch.sigmoid(input, out)`                                  | 逐元素 sigmoid 函数。                       |
| `torch.sign(input, out)`                                     | 逐元素返回符号（-1, 0, 1）。                |
| `torch.sgn(input, out)`                                      | 逐元素返回符号向量。                        |
| `torch.signbit(input, out)`                                  | 逐元素检查符号位。                          |
| `torch.sin(input, out)`                                      | 逐元素正弦。                                |
| `torch.sinc(input, out)`                                     | 逐元素 sinc 函数 sin(pi*x)/(pi*x)。         |
| `torch.sinh(input, out)`                                     | 逐元素双曲正弦。                            |
| `torch.softmax(input, dim, dtype)`                           | 逐元素 softmax 函数。                       |
| `torch.sqrt(input, out)`                                     | 逐元素平方根。                              |
| `torch.square(input, out)`                                   | 逐元素平方。                                |
| `torch.sub(input, other, alpha, out)`                        | 逐元素减法。                                |
| `torch.subtract(input, other, alpha, out)`                   | 逐元素减法（同 sub）。                      |
| `torch.tan(input, out)`                                      | 逐元素正切。                                |
| `torch.tanh(input, out)`                                     | 逐元素双曲正切。                            |
| `torch.true_divide(input, other, out)`                       | 逐元素真除法。                              |
| `torch.trunc(input, out)`                                    | 逐元素截断（取整数部分）。                  |
| `torch.xlogy(input, other, out)`                             | 逐元素计算 input * log(other)。             |

------

### **数学运算 - 归约操作**

| 函数                                                         | 描述                             |
| :----------------------------------------------------------- | :------------------------------- |
| `torch.argmax(input, dim, keepdim)`                          | 返回沿维度最大值的索引。         |
| `torch.argmin(input, dim, keepdim)`                          | 返回沿维度最小值的索引。         |
| `torch.amax(input, dim, keepdim, out)`                       | 返回沿维度的最大值。             |
| `torch.amin(input, dim, keepdim, out)`                       | 返回沿维度的最小值。             |
| `torch.aminmax(input, dim, keepdim, out)`                    | 返回沿维度的最小值和最大值。     |
| `torch.all(input, dim, keepdim, out)`                        | 判断是否所有元素都为 True。      |
| `torch.any(input, dim, keepdim, out)`                        | 判断是否有元素为 True。          |
| `torch.max(input, dim, keepdim, out)`                        | 沿指定维度求最大值。             |
| `torch.min(input, dim, keepdim, out)`                        | 沿指定维度求最小值。             |
| `torch.dist(input, other, p)`                                | 计算两个张量之间的 p 范数距离。  |
| `torch.logsumexp(input, dim, keepdim, out)`                  | 计算 log-sum-exp。               |
| `torch.mean(input, dim, keepdim, out)`                       | 沿指定维度求均值。               |
| `torch.nanmean(input, dim, keepdim, out)`                    | 沿指定维度求均值（忽略 NaN）。   |
| `torch.median(input, dim, keepdim, out)`                     | 沿指定维度求中位数。             |
| `torch.nanmedian(input, dim, keepdim, out)`                  | 沿指定维度求中位数（忽略 NaN）。 |
| `torch.mode(input, dim, keepdim, out)`                       | 沿指定维度求众数。               |
| `torch.norm(input, p, dim, keepdim, out)`                    | 计算 p 范数。                    |
| `torch.nansum(input, dim, keepdim, out)`                     | 沿指定维度求和（忽略 NaN）。     |
| `torch.prod(input, dim, keepdim, dtype, out)`                | 沿指定维度求积。                 |
| `torch.quantile(input, q, dim, keepdim, out, method)`        | 计算分位数。                     |
| `torch.nanquantile(input, q, dim, keepdim, out, method)`     | 计算分位数（忽略 NaN）。         |
| `torch.std(input, dim, unbiased, keepdim, out)`              | 计算标准差。                     |
| `torch.std_mean(input, dim, unbiased, keepdim)`              | 计算标准差和均值。               |
| `torch.sum(input, dim, keepdim, dtype, out)`                 | 沿指定维度求和。                 |
| `torch.unique(input, sorted, return_inverse, return_counts, dim)` | 返回唯一元素。                   |
| `torch.unique_consecutive(input, sorted, return_inverse, return_counts, dim)` | 返回连续唯一元素。               |
| `torch.var(input, dim, unbiased, keepdim, out)`              | 计算方差。                       |
| `torch.var_mean(input, dim, unbiased, keepdim)`              | 计算方差和均值。                 |
| `torch.count_nonzero(input, dim)`                            | 统计非零元素数量。               |
| `torch.hash_tensor(input)`                                   | 计算张量的哈希值。               |

------

### **数学运算 - 比较操作**

| 函数                                                         | 描述                                     |
| :----------------------------------------------------------- | :--------------------------------------- |
| `torch.allclose(input, other, rtol, atol, equal_nan)`        | 检查两个张量是否接近（所有元素）。       |
| `torch.argsort(input, dim, descending, stable)`              | 返回排序后的索引。                       |
| `torch.eq(input, other, out)`                                | 逐元素相等比较。                         |
| `torch.equal(input, other)`                                  | 检查两个张量是否完全相等。               |
| `torch.ge(input, other, out)`                                | 逐元素大于等于比较。                     |
| `torch.greater_equal(input, other, out)`                     | 逐元素大于等于比较（同 ge）。            |
| `torch.gt(input, other, out)`                                | 逐元素大于比较。                         |
| `torch.greater(input, other, out)`                           | 逐元素大于比较（同 gt）。                |
| `torch.isclose(input, other, rtol, atol, equal_nan)`         | 检查两个张量是否接近（逐元素）。         |
| `torch.isfinite(input, out)`                                 | 检查是否为有限值。                       |
| `torch.isin(elements, test_elements, assume_unique, invert)` | 检查元素是否在集合中。                   |
| `torch.isinf(input, out)`                                    | 检查是否为无穷值。                       |
| `torch.isposinf(input, out)`                                 | 检查是否为正无穷。                       |
| `torch.isneginf(input, out)`                                 | 检查是否为负无穷。                       |
| `torch.isnan(input, out)`                                    | 检查是否为 NaN。                         |
| `torch.isreal(input, out)`                                   | 检查是否为实数。                         |
| `torch.kthvalue(input, k, dim, keepdim, out)`                | 返回第 k 小的元素和索引。                |
| `torch.le(input, other, out)`                                | 逐元素小于等于比较。                     |
| `torch.less_equal(input, other, out)`                        | 逐元素小于等于比较（同 le）。            |
| `torch.lt(input, other, out)`                                | 逐元素小于比较。                         |
| `torch.less(input, other, out)`                              | 逐元素小于比较（同 lt）。                |
| `torch.maximum(input, other, out)`                           | 逐元素取最大值。                         |
| `torch.minimum(input, other, out)`                           | 逐元素取最小值。                         |
| `torch.fmax(input, other, out)`                              | 逐元素取最大值（忽略 NaN）。             |
| `torch.fmin(input, other, out)`                              | 逐元素取最小值（忽略 NaN）。             |
| `torch.ne(input, other, out)`                                | 逐元素不等比较。                         |
| `torch.not_equal(input, other, out)`                         | 逐元素不等比较（同 ne）。                |
| `torch.sort(input, dim, descending, stable, out)`            | 沿指定维度排序。                         |
| `torch.topk(input, k, dim, largest, sorted, out)`            | 返回最大的 k 个元素和索引。              |
| `torch.msort(input, out)`                                    | 沿最后一个维度排序（返回排序后的张量）。 |

------

### **数学运算 - 谱操作**

| 函数                                                         | 描述               |
| :----------------------------------------------------------- | :----------------- |
| `torch.stft(input, n_fft, hop_length, win_length, window, center, normalized, onesided, return_complex)` | 短时傅里叶变换。   |
| `torch.istft(input, n_fft, hop_length, win_length, window, center, normalized, onesided, length, return_complex)` | 短时傅里叶变换逆。 |
| `torch.bartlett_window(window_length, periodic, dtype, device)` | Bartlett 窗口。    |
| `torch.blackman_window(window_length, periodic, dtype, device)` | Blackman 窗口。    |
| `torch.hamming_window(window_length, periodic, alpha, beta, dtype, device)` | Hamming 窗口。     |
| `torch.hann_window(window_length, periodic, dtype, device)`  | Hann 窗口。        |
| `torch.kaiser_window(window_length, periodic, beta, dtype, device)` | Kaiser 窗口。      |

------

### **数学运算 - 其他操作**

| 函数                                                         | 描述                          |
| :----------------------------------------------------------- | :---------------------------- |
| `torch.atleast_1d(*tensors)`                                 | 将输入转换为至少 1 维的张量。 |
| `torch.atleast_2d(*tensors)`                                 | 将输入转换为至少 2 维的张量。 |
| `torch.atleast_3d(*tensors)`                                 | 将输入转换为至少 3 维的张量。 |
| `torch.bincount(input, weights, minlength)`                  | 计算非负整数的出现次数。      |
| `torch.block_diag(*tensors)`                                 | 从输入张量构建块对角矩阵。    |
| `torch.broadcast_tensors(*tensors)`                          | 将输入广播到相同形状。        |
| `torch.broadcast_to(input, shape)`                           | 将张量广播到指定形状。        |
| `torch.broadcast_shapes(*shapes)`                            | 广播形状以兼容操作。          |
| `torch.bucketize(input, boundaries, right)`                  | 将输入映射到桶索引。          |
| `torch.cartesian_prod(*tensors)`                             | 计算笛卡尔积。                |
| `torch.cdist(x1, x2, p, compute_mode)`                       | 计算成对距离。                |
| `torch.clone(input, memory_format)`                          | 返回张量的副本。              |
| `torch.combinations(input, r, with_replacement)`             | 计算组合。                    |
| `torch.corrcoef(input)`                                      | 计算相关系数矩阵。            |
| `torch.cov(input, correction, fweights, aweights)`           | 计算协方差矩阵。              |
| `torch.cross(input, dim, out)`                               | 计算叉积。                    |
| `torch.cummax(input, dim, out)`                              | 沿维度累积最大值。            |
| `torch.cummin(input, dim, out)`                              | 沿维度累积最小值。            |
| `torch.cumprod(input, dim, out)`                             | 沿维度累积乘积。              |
| `torch.cumsum(input, dim, out, dtype)`                       | 沿维度累积和。                |
| `torch.diag(input, diagonal, out)`                           | 创建对角矩阵或提取对角线。    |
| `torch.diag_embed(input, offset, dim1, dim2, out)`           | 将输入作为对角线嵌入。        |
| `torch.diagflat(input, offset, out)`                         | 创建对角矩阵（扁平输入）。    |
| `torch.diagonal(input, offset, dim1, dim2, out)`             | 提取对角线元素。              |
| `torch.diff(input, n, dim, prepend, append, out)`            | 计算差分。                    |
| `torch.einsum(equation, *operands)`                          | 爱因斯坦求和约定。            |
| `torch.flatten(input, start_dim, end_dim, out)`              | 展平张量。                    |
| `torch.ravel(input, out)`                                    | 展平为一维张量。              |
| `torch.kron(input, other, out)`                              | 计算 Kronecker 积。           |
| `torch.meshgrid(*tensors, indexing)`                         | 创建网格。                    |
| `torch.lcm(input, other, out)`                               | 逐元素最小公倍数。            |
| `torch.logcumsumexp(input, dim, out)`                        | 沿维度累积 log-sum-exp。      |
| `torch.renorm(input, p, dim, maxnorm, out)`                  | 重归一化到指定范数。          |
| `torch.roll(input, shifts, dims)`                            | 滚动张量元素。                |
| `torch.searchsorted(sorted_sequence, values, side, sorter)`  | 在排序序列中搜索位置。        |
| `torch.tensordot(a, b, dims)`                                | 计算张量点积。                |
| `torch.trace(input, out)`                                    | 计算矩阵迹。                  |
| `torch.tril(input, diagonal, out)`                           | 提取下三角矩阵。              |
| `torch.tril_indices(row, column, offset, dtype, device, layout)` | 生成下三角索引。              |
| `torch.triu(input, diagonal, out)`                           | 提取上三角矩阵。              |
| `torch.triu_indices(row, column, offset, dtype, device, layout)` | 生成上三角索引。              |
| `torch.unflatten(input, dim, sizes)`                         | 展开张量。                    |
| `torch.vander(x, N, increasing, out)`                        | 创建 Vandermonde 矩阵。       |

------

### **线性代数 (BLAS 和 LAPACK)**

| 函数                                                         | 描述                                 |
| :----------------------------------------------------------- | :----------------------------------- |
| `torch.addbmm(input, batch1, batch2, beta, alpha, out)`      | 批量矩阵乘加。                       |
| `torch.addmm(input, mat1, mat2, beta, alpha, out)`           | 矩阵乘加。                           |
| `torch.addmv(input, mat, vec, beta, alpha, out)`             | 矩阵向量乘加。                       |
| `torch.addr(input, vec1, vec2, beta, alpha, out)`            | 向量外积加。                         |
| `torch.baddbmm(input, batch1, batch2, beta, alpha, out)`     | 批量矩阵乘加（bmm + add）。          |
| `torch.bmm(input, mat2, out)`                                | 批量矩阵乘法。                       |
| `torch.chain_matmul(*matrices)`                              | 链式矩阵乘法。                       |
| `torch.cholesky(input, upper, out)`                          | Cholesky 分解。                      |
| `torch.cholesky_inverse(input, upper, out)`                  | Cholesky 分解求逆。                  |
| `torch.cholesky_solve(input, input2, upper, out)`            | Cholesky 分解求解线性方程。          |
| `torch.dot(input, other, out)`                               | 计算两个向量的点积。                 |
| `torch.geqrf(input, out)`                                    | QR 分解（geqrf）。                   |
| `torch.ger(input, other, out)`                               | 计算向量外积。                       |
| `torch.inner(input, other, out)`                             | 计算内积。                           |
| `torch.inverse(input, out)`                                  | 计算矩阵的逆。                       |
| `torch.det(input, out)`                                      | 计算矩阵的行列式。                   |
| `torch.logdet(input, out)`                                   | 计算行列式的对数。                   |
| `torch.slogdet(input, out)`                                  | 计算行列式的符号和对数绝对值。       |
| `torch.lu(input, pivot, get_infos, out)`                     | LU 分解。                            |
| `torch.lu_solve(input, LU_data, LU_pivots, out)`             | LU 分解求解。                        |
| `torch.lu_unpack(LU_data, LU_pivots, unpack_data, unpack_pivots)` | 解包 LU 分解结果。                   |
| `torch.matmul(input, other, out)`                            | 矩阵乘法（支持不同维度）。           |
| `torch.matrix_power(input, n, out)`                          | 矩阵幂运算。                         |
| `torch.matrix_exp(input, out)`                               | 矩阵指数。                           |
| `torch.mm(input, mat2, out)`                                 | 矩阵乘法（二维）。                   |
| `torch.mv(input, vec, out)`                                  | 矩阵向量乘法。                       |
| `torch.orgqr(input, q, out)`                                 | 从 QR 分解重构 Q。                   |
| `torch.ormqr(input, mat, vec, left, transpose, out)`         | ormqr 操作。                         |
| `torch.outer(input, other, out)`                             | 计算向量外积。                       |
| `torch.pinverse(input, rcond, out)`                          | 计算Moore-Penrose 伪逆。             |
| `torch.qr(input, out)`                                       | QR 分解。                            |
| `torch.svd(input, some, compute_uv, out)`                    | 奇异值分解。                         |
| `torch.svd_lowrank(input, q, niter, M)`                      | 低秩 SVD 近似。                      |
| `torch.pca_lowrank(input, q, center, niter)`                 | 低秩 PCA 近似。                      |
| `torch.lobpcg(input, K, B, X, M, P, max_iter, tol, debug, ortho_iparams, fpfloor)` | LOBPCG 特征值求解器。                |
| `torch.trapz(y, x, dim, out)`                                | 梯形积分（已废弃，使用 trapezoid）。 |
| `torch.trapezoid(y, x, dim, out)`                            | 梯形积分。                           |
| `torch.cumulative_trapezoid(y, x, dim, out)`                 | 累积梯形积分。                       |
| `torch.triangular_solve(input, A, upper, transpose, unitriangular, out)` | 三角矩阵求解。                       |
| `torch.vdot(input, other, out)`                              | 计算向量点积（复数感知）。           |

------

### **设备管理**

| 函数                                   | 描述                                           |
| :------------------------------------- | :--------------------------------------------- |
| `torch.cuda.is_available()`            | 检查 CUDA 是否可用。                           |
| `torch.cuda.device_count()`            | 返回 CUDA 设备数量。                           |
| `torch.cuda.current_device()`          | 返回当前 CUDA 设备索引。                       |
| `torch.cuda.device(name)`              | 创建一个设备对象。                             |
| `torch.cuda.device_context(device)`    | 创建设备上下文。                               |
| `torch.device(device)`                 | 创建一个设备对象（如 `'cpu'` 或 `'cuda:0'`）。 |
| `torch.Tensor.to(device)`              | 将张量移动到指定设备。                         |
| `torch.get_device_module(device_type)` | 获取设备模块（如 cuda, mps）。                 |

------

### **并行计算**

| 函数                                 | 描述                          |
| :----------------------------------- | :---------------------------- |
| `torch.get_num_threads()`            | 获取用于 CPU 操作的总线程数。 |
| `torch.set_num_threads(int)`         | 设置用于 CPU 操作的线程数。   |
| `torch.get_num_interop_threads()`    | 获取 inter-op 并行线程数。    |
| `torch.set_num_interop_threads(int)` | 设置 inter-op 并行线程数。    |

------

### **工具函数**

| 函数                                                        | 描述                           |
| :---------------------------------------------------------- | :----------------------------- |
| `torch.compiled_with_cxx11_abi()`                           | 检查是否使用 C++11 ABI 编译。  |
| `torch.result_type(tensor, other)`                          | 返回操作结果的 dtype。         |
| `torch.can_cast(from_dtype, to_dtype)`                      | 检查是否可以转换数据类型。     |
| `torch.promote_types(type1, type2)`                         | 返回提升后的数据类型。         |
| `torch.use_deterministic_algorithms(mode, warn_only)`       | 启用/禁用确定性算法。          |
| `torch.are_deterministic_algorithms_enabled()`              | 检查是否启用确定性算法。       |
| `torch.is_deterministic_algorithms_warn_only_enabled()`     | 检查确定性算法是否为警告模式。 |
| `torch.set_deterministic_debug_mode(debug_mode)`            | 设置确定性调试模式。           |
| `torch.get_deterministic_debug_mode()`                      | 获取确定性调试模式。           |
| `torch.set_float32_matmul_precision(precision)`             | 设置 float32 矩阵乘法的精度。  |
| `torch.get_float32_matmul_precision()`                      | 获取 float32 矩阵乘法的精度。  |
| `torch.set_warn_always(enabled)`                            | 设置是否始终显示警告。         |
| `torch.is_warn_always_enabled()`                            | 检查是否始终显示警告。         |
| `torch.vmap(fn, in_dims, out_dims, randomness, chunk_size)` | 向量化映射。                   |
| `torch._assert(condition, message)`                         | 断言检查（内部使用）。         |
| `torch.typename(t)`                                         | 返回类型的字符串表示。         |

------

### **编译优化**

| 函数                                              | 描述                        |
| :------------------------------------------------ | :-------------------------- |
| `torch.compile(model, backend, options, dynamic)` | 编译 PyTorch 模型进行优化。 |