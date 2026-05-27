---
title: Pandas-10-Parquest/Feather
slug: AI工程师技术架构
date: 2026年05月27日
---

# Pandas 读取 Parquet / Feather 文件

Parquet 和 Feather 是两种高效的列式数据存储格式，专为大数据分析和快速读写场景设计。相比 CSV，它们具有更好的压缩比和查询性能。

------

## 为什么使用 Parquet 和 Feather

列式存储格式的主要优势：

| 特性       | CSV  | Parquet       | Feather  |
| :--------- | :--- | :------------ | :------- |
| 存储格式   | 行式 | 列式          | 列式     |
| 读取速度   | 慢   | 很快          | 极快     |
| 写入速度   | 中   | 快            | 极快     |
| 压缩率     | 低   | 高            | 中       |
| 跨语言支持 | 通用 | Java/Python/R | Python/R |

> Parquet 是 Apache 基金会的项目，被广泛用于大数据生态（Hadoop、Spark、DuckDB 等）。Feather 是 Arrow 项目的原生实现，专注于极致的读写速度。

------

## Parquet 文件操作

### 安装依赖

```
pip install pyarrow fastparquet
```

PyArrow 和 FastParquet 都是 Parquet 的 Python 实现，PyArrow 是默认选项，FastParquet 在某些场景下更快。

### 读取 Parquet 文件

```py
import pandas as pd

# 读取 Parquet 文件（默认使用 pyarrow）
df = pd.read_parquet("data.parquet")

# 指定使用特定的引擎
df = pd.read_parquet("data.parquet", engine="pyarrow")
df = pd.read_parquet("data.parquet", engine="fastparquet")

# 读取远程 Parquet 文件
df = pd.read_parquet("s3://bucket/data.parquet")

# 读取文件的某些列（列裁剪，提升性能）
df = pd.read_parquet("data.parquet", columns=["name", "age", "city"])
print(df.head())
```

### 写入 Parquet 文件

```py
import pandas as pd

# 准备测试数据
df = pd.DataFrame({
    "id": range(1, 10001),
    "name": ["用户" + str(i) for i in range(1, 10001)],
    "age": [20, 25, 30, 35] * 2500,
    "city": ["北京", "上海", "广州", "深圳"] * 2500,
    "score": [round(i * 0.1, 2) for i in range(1, 10001)]
})

# 写入 Parquet 文件（默认使用 pyarrow 引擎）
df.to_parquet("data.parquet", index=False)

# 指定压缩方式（snappy 速度快，gzip 压缩率高）
df.to_parquet("data_snappy.parquet", compression="snappy", index=False)
df.to_parquet("data_gzip.parquet", compression="gzip", index=False)
df.to_parquet("data_none.parquet", compression=None, index=False)  # 不压缩

# 查看文件大小
import os
print("文件大小对比：")
print(f"原始 CSV 预估: {len(df) * 50 / 1024 / 1024:.2f} MB")
print(f"snappy 压缩: {os.path.getsize('data_snappy.parquet') / 1024 / 1024:.2f} MB")
print(f"gzip 压缩: {os.path.getsize('data_gzip.parquet') / 1024 / 1024:.2f} MB")
print(f"无压缩: {os.path.getsize('data_none.parquet') / 1024 / 1024:.2f} MB")
```

### 使用快 Parquet 引擎

```py
import pandas as pd
import time

# 测试不同引擎的写入性能
df = pd.DataFrame({
    "id": range(1, 100001),
    "value": range(1, 100001)
})

# pyarrow 引擎写入
start = time.time()
df.to_parquet("test_pyarrow.parquet", engine="pyarrow", compression="snappy")
print(f"pyarrow 写入时间: {time.time() - start:.3f}s")

# fastparquet 引擎写入
start = time.time()
df.to_parquet("test_fastparquet.parquet", engine="fastparquet", compression="snappy")
print(f"fastparquet 写入时间: {time.time() - start:.3f}s")
```

## Feather 文件操作

Feather 是 Arrow 项目的 Python 实现，专注于极致的内存读写速度。

### 安装依赖

```
pip install pyarrow
```

### 读取 Feather 文件

```py
import pandas as pd

# 读取 Feather 文件
df = pd.read_feather("data.feather")

# 读取 v2 版本的 Feather 文件（更通用）
df = pd.read_feather("data.feather", version="2.0")

# 读取某些列
df = pd.read_feather("data.feather", columns=["name", "age"])
print(df.head())
```

### 写入 Feather 文件

```py
import pandas as pd

# 准备测试数据
df = pd.DataFrame({
    "id": range(1, 10001),
    "name": ["用户" + str(i) for i in range(1, 10001)],
    "value": [round(i * 0.1, 2) for i in range(1, 10001)]
})

# 写入 Feather 文件
df.to_feather("data.feather")

# LZ4 压缩（更快）
df.to_feather("data_lz4.feather", compression="lz4")

# ZSTD 压缩（压缩率更高）
df.to_feather("data_zstd.feather", compression="zstd")

# 查看文件大小
import os
print(f"无压缩: {os.path.getsize('data.feather') / 1024:.2f} KB")
print(f"LZ4: {os.path.getsize('data_lz4.feather') / 1024:.2f} KB")
print(f"ZSTD: {os.path.getsize('data_zstd.feather') / 1024:.2f} KB")
```

## 性能对比测试

```py
import pandas as pd
import numpy as np
import time
import os
import tempfile

# 创建测试数据
np.random.seed(42)
n_rows = 1000000
df = pd.DataFrame({
    "id": range(n_rows),
    "category": np.random.choice(["A", "B", "C", "D"], n_rows),
    "value": np.random.randn(n_rows),
    "flag": np.random.choice([True, False], n_rows),
    "date": pd.date_range("2020-01-01", periods=n_rows, freq="1min")
})

# 创建临时目录
with tempfile.TemporaryDirectory() as tmpdir:
    # CSV 写入
    start = time.time()
    df.to_csv(f"{tmpdir}/data.csv", index=False)
    csv_write = time.time() - start

    start = time.time()
    df_csv = pd.read_csv(f"{tmpdir}/data.csv")
    csv_read = time.time() - start

    # Parquet 写入
    start = time.time()
    df.to_parquet(f"{tmpdir}/data.parquet", index=False)
    pq_write = time.time() - start

    start = time.time()
    df_pq = pd.read_parquet(f"{tmpdir}/data.parquet")
    pq_read = time.time() - start

    # Feather 写入
    start = time.time()
    df.to_feather(f"{tmpdir}/data.feather")
    feather_write = time.time() - start

    start = time.time()
    df_feather = pd.read_feather(f"{tmpdir}/data.feather")
    feather_read = time.time() - start

    # 输出结果
    print(f"{'格式':<10} {'写入时间':<12} {'读取时间':<12} {'文件大小':<12}")
    print("-" * 50)
    print(f"{'CSV':<10} {csv_write:.3f}s{'':<5} {csv_read:.3f}s{'':<5} {os.path.getsize(f'{tmpdir}/data.csv')/1024/1024:.2f}MB")
    print(f"{'Parquet':<10} {pq_write:.3f}s{'':<5} {pq_read:.3f}s{'':<5} {os.path.getsize(f'{tmpdir}/data.parquet')/1024/1024:.2f}MB")
    print(f"{'Feather':<10} {feather_write:.3f}s{'':<5} {feather_read:.3f}s{'':<5} {os.path.getsize(f'{tmpdir}/data.feather')/1024/1024:.2f}MB")
```

## 使用场景与选择建议

| 场景              | 推荐格式 | 原因                           |
| :---------------- | :------- | :----------------------------- |
| 大数据分析        | Parquet  | 高压缩比，列式查询快，生态广泛 |
| Python/R 数据传递 | Feather  | 极快读写，Arrow 原生支持       |
| Spark/Hadoop 集成 | Parquet  | 大数据生态标准格式             |
| 数据备份/归档     | Parquet  | 压缩率高，支持schema演进       |
| 临时数据缓存      | Feather  | 读写最快                       |

------

## 常见问题

**1、读取 Parquet 报错**

确保安装了 pyarrow 或 fastparquet：`pip install pyarrow`

**2、文件损坏**

写入时确保数据完整写入磁盘，建议写入后验证文件可读性。

**3、版本兼容**

不同版本的 Parquet 可能存在兼容性问题，建议在项目中使用固定版本。