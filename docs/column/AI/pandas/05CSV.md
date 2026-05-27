---
title: Pandas-5-CSV
slug: AI工程师技术架构
date: 2026年05月27日
---



# Pandas CSV 文件

CSV（Comma-Separated Values，逗号分隔值，有时也称为字符分隔值，因为分隔字符也可以不是逗号），其文件以纯文本形式存储表格数据（数字和文本）。

CSV 是一种通用的、相对简单的文件格式，被用户、商业和科学广泛应用。

Pandas 可以很方便的处理 CSV 文件，常用方法有：

| **方法名称**         | **功能描述**                          | **常用参数**                                                 |
| :------------------- | :------------------------------------ | :----------------------------------------------------------- |
| `pd.read_csv()`      | 从 CSV 文件读取数据并加载为 DataFrame | `filepath_or_buffer` (路径或文件对象)，`sep` (分隔符)，`header` (行标题)，`names` (自定义列名)，`dtype` (数据类型)，`index_col` (索引列) |
| `DataFrame.to_csv()` | 将 DataFrame 写入到 CSV 文件          | `path_or_buffer` (目标路径或文件对象)，`sep` (分隔符)，`index` (是否写入索引)，`columns` (指定列)，`header` (是否写入列名)，`mode` (写入模式) |

本文可以使用 [nba.csv](https://static.jyshare.com/download/nba.csv) 作为练手例子。

### pd.read_csv() - 读取 CSV 文件

read_csv() 是从 CSV 文件中读取数据的主要方法，将数据加载为一个 DataFrame。

```
import pandas as pd

# 读取 CSV 文件，并自定义列名和分隔符
df = pd.read_csv('data.csv', sep=';', header=0, names=['A', 'B', 'C'], dtype={'A': int, 'B': float})
print(df)
```

read_csv 常用参数:

| **参数**             | **说明**                                                     | **默认值** |
| :------------------- | :----------------------------------------------------------- | :--------- |
| `filepath_or_buffer` | CSV 文件的路径或文件对象（支持 URL、文件路径、文件对象等）   | 必需参数   |
| `sep`                | 定义字段分隔符，默认是逗号（`,`），可以改为其他字符，如制表符（`\t`） | `','`      |
| `header`             | 指定行号作为列标题，默认为 0（表示第一行），或者设置为 `None` 没有标题 | `0`        |
| `names`              | 自定义列名，传入列名列表                                     | `None`     |
| `index_col`          | 用作行索引的列的列号或列名                                   | `None`     |
| `usecols`            | 读取指定的列，可以是列的名称或列的索引                       | `None`     |
| `dtype`              | 强制将列转换为指定的数据类型                                 | `None`     |
| `skiprows`           | 跳过文件开头的指定行数，或者传入一个行号的列表               | `None`     |
| `nrows`              | 读取前 N 行数据                                              | `None`     |
| `na_values`          | 指定哪些值应视为缺失值（NaN）                                | `None`     |
| `skipfooter`         | 跳过文件结尾的指定行数                                       | `0`        |
| `encoding`           | 文件的编码格式（如 `utf-8`，`latin1` 等）                    | `None`     |

### df.to_csv() - 将 DataFrame 写入 CSV 文件

to_csv() 是将 DataFrame 写入 CSV 文件的方法，支持自定义分隔符、列名、是否包含索引等设置。

```
import pandas as pd

# 假设 df 是一个已有的 DataFrame
df.to_csv('output.csv', index=False, header=True, columns=['A', 'B'])
```

to_csv 常用参数:

| **参数**          | **说明**                                                     | **默认值** |
| :---------------- | :----------------------------------------------------------- | :--------- |
| `path_or_buffer`  | CSV 文件的路径或文件对象（支持文件路径、文件对象）           | 必需参数   |
| `sep`             | 定义字段分隔符，默认是逗号（`,`），可以改为其他字符，如制表符（`\t`） | `','`      |
| `index`           | 是否写入行索引，默认 `True` 表示写入索引                     | `True`     |
| `columns`         | 指定写入的列，可以是列的名称列表                             | `None`     |
| `header`          | 是否写入列名，默认 `True` 表示写入列名，设置为 `False` 表示不写列名 | `True`     |
| `mode`            | 写入文件的模式，默认是 `w`（写模式），可以设置为 `a`（追加模式） | `'w'`      |
| `encoding`        | 文件的编码格式，如 `utf-8`，`latin1` 等                      | `None`     |
| `line_terminator` | 定义行结束符，默认为 `\n`                                    | `None`     |
| `quoting`         | 设置如何对文件中的数据进行引号处理（0-3，具体引用方式可查文档） | `None`     |
| `quotechar`       | 设置用于引用的字符，默认为双引号 `"`                         | `'"'`      |
| `date_format`     | 自定义日期格式，如果列包含日期数据，则可以使用此参数指定日期格式 | `None`     |
| `doublequote`     | 如果为 `True`，则在写入时会将包含引号的文本使用双引号括起来  | `True`     |

## 数据处理

### head()

**head( \*n\* )** 方法用于读取前面的 n 行，如果不填参数 n ，默认返回 5 行。

### tail()

**tail( \*n\* )** 方法用于读取尾部的 n 行，如果不填参数 n ，默认返回 5 行，空行各个字段的值返回 **NaN**。

### info()

info() 方法返回表格的一些基本信息