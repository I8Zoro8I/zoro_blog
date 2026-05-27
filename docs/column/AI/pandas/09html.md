---
title: Pandas-9-html
slug: AI工程师技术架构
date: 2026年05月27日
---

# Pandas 读取 HTML 表格

Pandas 的 `pd.read_html()` 函数可以自动解析网页中的 HTML 表格数据，将其转换为 DataFrame。这在抓取网页数据、分析股价、获取金融信息等场景下非常有用。

------

## 基本用法

`read_html()` 函数会查找并读取网页中所有的 HTML 表格元素，返回一个 DataFrame 列表。

### 读取单个表格

```py
import pandas as pd

# 读取网页上的所有表格
# 注意：需要 lxml 和 beautifulsoup4 库支持
# pip install lxml beautifulsoup4

# 从 URL 读取
tables = pd.read_html("https://example.com/table.html")

# 查看找到的表格数量
print(f"找到 {len(tables)} 个表格")

# 获取第一个表格
df = tables[0]
print(df.head())
```

### 读取多个表格

一个网页可能包含多个表格，`read_html()` 返回一个列表，可以通过索引选择

```py
import pandas as pd

# 假设网页有多个表格
tables = pd.read_html("https://example.com/data.html")

# 遍历所有表格
for i, table in enumerate(tables):
    print(f"\n=== 表格 {i+1} ===")
    print(f"形状: {table.shape}")
    print(table.head(3))
```

## 常用参数详解

| 参数        | 说明                                 | 示例                     |
| :---------- | :----------------------------------- | :----------------------- |
| `io`        | 输入源，可以是 URL、文件路径或字符串 | `"page.html"`            |
| `match`     | 正则匹配，筛选包含特定文本的表格     | `match="销售额"`         |
| `header`    | 指定表头行索引                       | `header=0`               |
| `attrs`     | 通过 HTML 属性筛选表格               | `attrs={"id": "table1"}` |
| `skiprows`  | 跳过指定行                           | `skiprows=[0, 1]`        |
| `na_values` | 指定视为缺失值的字符串               | `na_values=["N/A"]`      |

### 使用 match 参数筛选表格

```py
import pandas as pd

# 使用 match 参数只返回包含特定文本的表格
# 例如：只读取包含"股票"二字的表格
tables = pd.read_html(
    "https://example.com/finance.html",
    match="股票"
)

if tables:
    df = tables[0]
    print(df)
```

### 使用 attrs 参数精确定位表格

```py
import pandas as pd

# 通过 HTML 属性定位表格
# 例如：获取 id="stock-table" 的表格
tables = pd.read_html(
    "https://example.com/data.html",
    attrs={"id": "stock-table"}  # 查找 id="stock-table" 的 table 元素
)

# 或者通过 class 定位
tables = pd.read_html(
    "https://example.com/data.html",
    attrs={"class": "data-table"}
)

df = tables[0]
print(df)
```

## 实战示例：从网页抓取股票数据

下面示例演示如何从财经网站抓取股票列表数据：

```py
import pandas as pd
from io import StringIO


# 创建一个模拟的 HTML 内容用于演示
# 实际使用时替换为真实的 URL
html_content = '''
<table border="1">
    <tr>
        <th>股票代码</th>
        <th>股票名称</th>
        <th>收盘价</th>
        <th>涨跌幅</th>
    </tr>
    <tr>
        <td>600519</td>
        <td>贵州茅台</td>
        <td>1850.00</td>
        <td>2.35%</td>
    </tr>
    <tr>
        <td>000858</td>
        <td>五粮液</td>
        <td>185.50</td>
        <td>-1.20%</td>
    </tr>
    <tr>
        <td>601318</td>
        <td>中国平安</td>
        <td>52.30</td>
        <td>0.85%</td>
    </tr>
</table>
'''

# 从字符串读取表格

tables = pd.read_html(StringIO(html_content))

df = tables[0]

print("原始表格：")
print(df)
print()

# 数据清洗：处理涨跌幅列
df["涨跌幅"] = df["涨跌幅"].str.replace("%", "").astype(float)
df["收盘价"] = df["收盘价"].astype(float)

print("清洗后的数据：")
print(df)
```

> StringIO 的作用是：把字符串伪装成文件对象，这样 pandas 会按读取文件流的逻辑处理，而不是误判为路径或 URL。

输出：

```
原始表格：
     股票代码  股票名称     收盘价     涨跌幅
0  600519  贵州茅台  1850.0   2.35%
1     858   五粮液   185.5  -1.20%
2  601318  中国平安    52.3   0.85%

清洗后的数据：
     股票代码  股票名称     收盘价   涨跌幅
0  600519  贵州茅台  1850.0  2.35
1     858   五粮液   185.5 -1.20
2  601318  中国平安    52.3  0.85
```

## 数据清洗与处理

从网页读取的表格通常需要进一步清洗才能用于分析。

### 常见清洗操作

```py
import pandas as pd
from io import StringIO

# 模拟一个包含各种脏数据的表格
html_content = '''
<table>
    <tr><th>日期</th><th>产品</th><th>销量</th><th>备注</th></tr>
    <tr><td>2024-01-01</td><td>产品A</td><td>1,234</td><td>N/A</td></tr>
    <tr><td>2024-01-02</td><td>产品B</td><td>567</td><td>缺货</td></tr>
    <tr><td>2024-01-03</td><td>产品C</td><td>--</td><td>未统计</td></tr>
</table>
'''

df = pd.read_html(StringIO(html_content))[0]
print("原始数据：")
print(df)
print()

# 清洗步骤
# 1. 重命名列
df.columns = ["日期", "产品", "销量", "备注"]

# 2. 处理缺失值
df = df.replace(["N/A", "--", "未统计", "缺货"], pd.NA)

# 3. 清理数值列（去除逗号）
df["销量"] = df["销量"].str.replace(",", "").replace(pd.NA, None)
df["销量"] = pd.to_numeric(df["销量"], errors="coerce")

# 4. 转换日期
df["日期"] = pd.to_datetime(df["日期"])

print("清洗后：")
print(df)
print("\n数据类型：")
print(df.dtypes)
```

## 注意事项与常见问题

**1、安装依赖库**

`read_html()` 需要 `lxml` 和 `beautifulsoup4` 库：

```
pip install lxml beautifulsoup4
```

**2、网络问题**

读取网络 URL 时可能遇到网络延迟或访问限制，建议添加适当的超时设置或使用本地缓存。

**3、表格结构复杂**

某些网页的表格使用合并单元格、嵌套表格等复杂结构，可能导致解析失败。此时可以尝试使用 BeautifulSoup 直接解析 HTML。

**4、数据完整性**

网页数据可能随时变化，建议在读取后验证数据完整性，并与原始数据源进行比对。

------

## 小结

`pd.read_html()` 是抓取网页表格数据的利器，它能快速将 HTML 表格转换为 DataFrame。在实际使用中，需要注意安装依赖库、处理网络问题、清洗脏数据等问题。抓取的数据通常需要进一步处理才能用于分析，建议结合 Pandas 的数据清洗功能一起使用。