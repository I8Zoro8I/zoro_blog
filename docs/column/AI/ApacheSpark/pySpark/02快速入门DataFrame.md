---
date: 2026年06月11日
tags:
  - 快速入门
---

# 快速入门：DataFrame

这是 PySpark DataFrame API 的简短介绍和快速入门。PySpark DataFrame 是惰性求值的，它们是在 [RDD](https://spark.apache.ac.cn/docs/latest/rdd-programming-guide.html#overview) 之上实现的。当 Spark [转换](https://spark.apache.ac.cn/docs/latest/rdd-programming-guide.html#transformations) 数据时，它不会立即计算转换结果，而是计划如何进行后续计算。当显式调用 `collect()` 等 [动作](https://spark.apache.ac.cn/docs/latest/rdd-programming-guide.html#actions) 时，计算才会开始。本笔记展示了 DataFrame 的基本用法，主要面向新用户。您可以在 [快速入门页面](https://spark.apache.ac.cn/docs/latest/api/python/getting_started/index.html) 的“在线笔记：DataFrame”中自行运行这些示例的最新版本。

Apache Spark 文档站点中还有其他有用的信息，请参阅最新版本的 [Spark SQL 和 DataFrame 指南](https://spark.apache.ac.cn/docs/latest/sql-programming-guide.html)、[RDD 编程指南](https://spark.apache.ac.cn/docs/latest/rdd-programming-guide.html)、[结构化流编程指南](https://spark.apache.ac.cn/docs/latest/structured-streaming-programming-guide.html)、[Spark 流编程指南](https://spark.apache.ac.cn/docs/latest/streaming-programming-guide.html) 以及 [机器学习库 (MLlib) 指南](https://spark.apache.ac.cn/docs/latest/ml-guide.html)。

PySpark 应用程序从初始化 `SparkSession` 开始，这是 PySpark 的入口点，如下所示。如果通过 pyspark 可执行文件在 PySpark shell 中运行，shell 会自动为用户在变量 spark 中创建会话。

```py
from pyspark.sql import SparkSession

spark = SparkSession.builder.getOrCreate()
```

## 创建 DataFrame

PySpark DataFrame 可以通过 `pyspark.sql.SparkSession.createDataFrame` 创建，通常通过传递列表、元组、字典和 `pyspark.sql.Row` 的列表、一个 [pandas DataFrame](https://pandas.ac.cn/docs/reference/api/pandas.DataFrame.html) 以及由这些组成的 RDD 来实现。`pyspark.sql.SparkSession.createDataFrame` 接受 `schema` 参数来指定 DataFrame 的模式。如果省略该参数，PySpark 会通过对数据进行采样来推断相应的模式。

首先，您可以从行列表创建 PySpark DataFrame

```py
from datetime import datetime, date
import pandas as pd
from pyspark.sql import Row

df = spark.createDataFrame([
    Row(a=1, b=2., c='string1', d=date(2000, 1, 1), e=datetime(2000, 1, 1, 12, 0)),
    Row(a=2, b=3., c='string2', d=date(2000, 2, 1), e=datetime(2000, 1, 2, 12, 0)),
    Row(a=4, b=5., c='string3', d=date(2000, 3, 1), e=datetime(2000, 1, 3, 12, 0))
])
#DataFrame[a: bigint, b: double, c: string, d: date, e: timestamp]
```

使用显式模式创建 PySpark DataFrame。

```py
df = spark.createDataFrame([
    (1, 2., 'string1', date(2000, 1, 1), datetime(2000, 1, 1, 12, 0)),
    (2, 3., 'string2', date(2000, 2, 1), datetime(2000, 1, 2, 12, 0)),
    (3, 4., 'string3', date(2000, 3, 1), datetime(2000, 1, 3, 12, 0))
], schema='a long, b double, c string, d date, e timestamp')

```

从 pandas DataFrame 创建 PySpark DataFrame

```py
pandas_df = pd.DataFrame({
    'a': [1, 2, 3],
    'b': [2., 3., 4.],
    'c': ['string1', 'string2', 'string3'],
    'd': [date(2000, 1, 1), date(2000, 2, 1), date(2000, 3, 1)],
    'e': [datetime(2000, 1, 1, 12, 0), datetime(2000, 1, 2, 12, 0), datetime(2000, 1, 3, 12, 0)]
})
df = spark.createDataFrame(pandas_df)
```

上述创建的 DataFrame 具有相同的结果和模式。

```py
# All DataFrames above result same.
df.show()
df.printSchema()
```

```
+---+---+-------+----------+-------------------+
|  a|  b|      c|         d|                  e|
+---+---+-------+----------+-------------------+
|  1|2.0|string1|2000-01-01|2000-01-01 12:00:00|
|  2|3.0|string2|2000-02-01|2000-01-02 12:00:00|
|  3|4.0|string3|2000-03-01|2000-01-03 12:00:00|
+---+---+-------+----------+-------------------+

root
 |-- a: long (nullable = true)
 |-- b: double (nullable = true)
 |-- c: string (nullable = true)
 |-- d: date (nullable = true)
 |-- e: timestamp (nullable = true)
```

## 查看数据

可以使用 `DataFrame.show()` 显示 DataFrame 的顶部行。

```py
df.show(1)

'''
+---+---+-------+----------+-------------------+
|  a|  b|      c|         d|                  e|
+---+---+-------+----------+-------------------+
|  1|2.0|string1|2000-01-01|2000-01-01 12:00:00|
+---+---+-------+----------+-------------------+
only showing top 1 row
'''
```

或者，您可以启用 `spark.sql.repl.eagerEval.enabled` 配置，以便在 Jupyter 等笔记中对 PySpark DataFrame 进行即时求值。显示的行数可以通过 `spark.sql.repl.eagerEval.maxNumRows` 配置进行控制。

```py
spark.conf.set('spark.sql.repl.eagerEval.enabled', True)
'''
a	b	c	d	e
1	2.0	string1	2000-01-01	2000-01-01 12:00:00
2	3.0	string2	2000-02-01	2000-01-02 12:00:00
3	4.0	string3	2000-03-01	2000-01-03 12:00:00

'''
```

行也可以垂直显示。当行太长而无法水平显示时，这很有用。

```py
df.show(1, vertical=True)

'''
-RECORD 0------------------
 a   | 1
 b   | 2.0
 c   | string1
 d   | 2000-01-01
 e   | 2000-01-01 12:00:00
only showing top 1 row
'''
```

您可以按如下方式查看 DataFrame 的模式和列名

```py
df.columns
'''
['a', 'b', 'c', 'd', 'e']
'''

df.printSchema()
'''
root
 |-- a: long (nullable = true)
 |-- b: double (nullable = true)
 |-- c: string (nullable = true)
 |-- d: date (nullable = true)
 |-- e: timestamp (nullable = true)
```

显示 DataFrame 的摘要

```py
df.select("a", "b", "c").describe().show()
'''
+-------+---+---+-------+
|summary|  a|  b|      c|
+-------+---+---+-------+
|  count|  3|  3|      3|
|   mean|2.0|3.0|   null|
| stddev|1.0|1.0|   null|
|    min|  1|2.0|string1|
|    max|  3|4.0|string3|
+-------+---+---+-------+
'''
```

`DataFrame.collect()` 将分布式数据收集到驱动程序端，作为 Python 中的本地数据。请注意，当数据集太大无法放入驱动程序端时，这可能会引发内存溢出错误，因为它会从执行程序（executor）收集所有数据到驱动程序端。

```py
df.collect()
'''
[Row(a=1, b=2.0, c='string1', d=datetime.date(2000, 1, 1), e=datetime.datetime(2000, 1, 1, 12, 0)),
 Row(a=2, b=3.0, c='string2', d=datetime.date(2000, 2, 1), e=datetime.datetime(2000, 1, 2, 12, 0)),
 Row(a=3, b=4.0, c='string3', d=datetime.date(2000, 3, 1), e=datetime.datetime(2000, 1, 3, 12, 0))]
'''
```

为了避免抛出内存溢出异常，请使用 `DataFrame.take()` 或 `DataFrame.tail()`。

```py
df.take(1)
'''
[Row(a=1, b=2.0, c='string1', d=datetime.date(2000, 1, 1), e=datetime.datetime(2000, 1, 1, 12, 0))]
```

PySpark DataFrame 还提供了转换回 [pandas DataFrame](https://pandas.ac.cn/docs/reference/api/pandas.DataFrame.html) 的功能，以利用 pandas API。请注意，`toPandas` 也会将所有数据收集到驱动程序端，当数据太大无法放入驱动程序端时，很容易导致内存溢出错误。

```py
df.toPandas()
'''
	a	b	c	d	e
0	1	2.0	string1	2000-01-01	2000-01-01 12:00:00
1	2	3.0	string2	2000-02-01	2000-01-02 12:00:00
2	3	4.0	string3	2000-03-01	2000-01-03 12:00:00
'''
```

## 选择和访问数据

PySpark DataFrame 是惰性求值的，仅选择列不会触发计算，而是返回一个 `Column` 实例。

```py
df.a
'''
Column<b'a'>
```

实际上，大多数列式操作都会返回 `Column`。

```py
from pyspark.sql import Column
from pyspark.sql.functions import upper

type(df.c) == type(upper(df.c)) == type(df.c.isNull())#True
```

这些 `Column` 可用于从 DataFrame 中选择列。例如，`DataFrame.select()` 接受返回另一个 DataFrame 的 `Column` 实例。

```py
df.select(df.c).show()
'''
+-------+
|      c|
+-------+
|string1|
|string2|
|string3|
+-------+
'''
```

分配新的 `Column` 实例。

```py
df.withColumn('upper_c', upper(df.c)).show()
'''
+---+---+-------+----------+-------------------+-------+
|  a|  b|      c|         d|                  e|upper_c|
+---+---+-------+----------+-------------------+-------+
|  1|2.0|string1|2000-01-01|2000-01-01 12:00:00|STRING1|
|  2|3.0|string2|2000-02-01|2000-01-02 12:00:00|STRING2|
|  3|4.0|string3|2000-03-01|2000-01-03 12:00:00|STRING3|
+---+---+-------+----------+-------------------+-------+
'''
```

要选择行的子集，请使用 `DataFrame.filter()`。

```py
df.filter(df.a == 1).show()

'''
+---+---+-------+----------+-------------------+
|  a|  b|      c|         d|                  e|
+---+---+-------+----------+-------------------+
|  1|2.0|string1|2000-01-01|2000-01-01 12:00:00|
+---+---+-------+----------+-------------------+
'''
```

## 应用函数

PySpark 支持各种 UDF 和 API，允许用户执行 Python 本地函数。另请参阅最新的 [Pandas UDF](https://spark.apache.ac.cn/docs/latest/sql-pyspark-pandas-with-arrow.html#pandas-udfs-aka-vectorized-udfs) 和 [Pandas 函数 API](https://spark.apache.ac.cn/docs/latest/sql-pyspark-pandas-with-arrow.html#pandas-function-apis)。例如，下面的示例允许用户在 Python 本地函数中直接使用 [pandas Series](https://pandas.ac.cn/pandas-docs/stable/reference/api/pandas.Series.html) 中的 API。

```py
import pandas as pd
from pyspark.sql.functions import pandas_udf

@pandas_udf('long')
def pandas_plus_one(series: pd.Series) -> pd.Series:
    # Simply plus one by using pandas Series.
    return series + 1

df.select(pandas_plus_one(df.a)).show()
'''
+------------------+
|pandas_plus_one(a)|
+------------------+
|                 2|
|                 3|
|                 4|
+------------------+
'''
```

另一个示例是 `DataFrame.mapInPandas`，它允许用户直接在 [pandas DataFrame](https://pandas.ac.cn/docs/reference/api/pandas.DataFrame.html) 中使用 API，而没有任何诸如结果长度之类的限制。

```py
def pandas_filter_func(iterator):
    for pandas_df in iterator:
        yield pandas_df[pandas_df.a == 1]

df.mapInPandas(pandas_filter_func, schema=df.schema).show()
'''
+---+---+-------+----------+-------------------+
|  a|  b|      c|         d|                  e|
+---+---+-------+----------+-------------------+
|  1|2.0|string1|2000-01-01|2000-01-01 12:00:00|
+---+---+-------+----------+-------------------+
'''
```

## 分组数据

PySpark DataFrame 还提供了一种通过使用常用方法（拆分-应用-合并策略）来处理分组数据的方法。它根据特定条件对数据进行分组，将函数应用于每个组，然后将它们合并回 DataFrame。

```py
df = spark.createDataFrame([
    ['red', 'banana', 1, 10], ['blue', 'banana', 2, 20], ['red', 'carrot', 3, 30],
    ['blue', 'grape', 4, 40], ['red', 'carrot', 5, 50], ['black', 'carrot', 6, 60],
    ['red', 'banana', 7, 70], ['red', 'grape', 8, 80]], schema=['color', 'fruit', 'v1', 'v2'])
df.show()
'''
+-----+------+---+---+
|color| fruit| v1| v2|
+-----+------+---+---+
|  red|banana|  1| 10|
| blue|banana|  2| 20|
|  red|carrot|  3| 30|
| blue| grape|  4| 40|
|  red|carrot|  5| 50|
|black|carrot|  6| 60|
|  red|banana|  7| 70|
|  red| grape|  8| 80|
+-----+------+---+---+

```

分组并将 `avg()` 函数应用于结果组。

```py
df.groupby('color').avg().show()
```

```
+-----+-------+-------+
|color|avg(v1)|avg(v2)|
+-----+-------+-------+
|  red|    4.8|   48.0|
|black|    6.0|   60.0|
| blue|    3.0|   30.0|
+-----+-------+-------+
```

您还可以通过使用 pandas API 对每个组应用 Python 本地函数。

```py
def plus_mean(pandas_df):
    return pandas_df.assign(v1=pandas_df.v1 - pandas_df.v1.mean())

df.groupby('color').applyInPandas(plus_mean, schema=df.schema).show()
```

```
+-----+------+---+---+
|color| fruit| v1| v2|
+-----+------+---+---+
|  red|banana| -3| 10|
|  red|carrot| -1| 30|
|  red|carrot|  0| 50|
|  red|banana|  2| 70|
|  red| grape|  3| 80|
|black|carrot|  0| 60|
| blue|banana| -1| 20|
| blue| grape|  1| 40|
+-----+------+---+---+
```

协同分组（Co-grouping）并应用函数。

```py
df1 = spark.createDataFrame(
    [(20000101, 1, 1.0), (20000101, 2, 2.0), (20000102, 1, 3.0), (20000102, 2, 4.0)],
    ('time', 'id', 'v1'))

df2 = spark.createDataFrame(
    [(20000101, 1, 'x'), (20000101, 2, 'y')],
    ('time', 'id', 'v2'))

def merge_ordered(l, r):
    return pd.merge_ordered(l, r)

df1.groupby('id').cogroup(df2.groupby('id')).applyInPandas(
    merge_ordered, schema='time int, id int, v1 double, v2 string').show()
```

```
+--------+---+---+---+
|    time| id| v1| v2|
+--------+---+---+---+
|20000101|  1|1.0|  x|
|20000102|  1|3.0|  x|
|20000101|  2|2.0|  y|
|20000102|  2|4.0|  y|
+--------+---+---+---+
```

## 获取数据输入/输出

CSV 简单直观且易于使用。Parquet 和 ORC 是高效且紧凑的文件格式，可实现更快的读写。

PySpark 中还有许多其他可用的数据源，例如 JDBC、文本、binaryFile、Avro 等。另请参阅 Apache Spark 文档中的最新 [Spark SQL、DataFrame 和 Dataset 指南](https://spark.apache.ac.cn/docs/latest/sql-programming-guide.html)。

### CSV

```py
df.write.csv('foo.csv', header=True)
spark.read.csv('foo.csv', header=True).show()
```

```
+-----+------+---+---+
|color| fruit| v1| v2|
+-----+------+---+---+
|  red|banana|  1| 10|
| blue|banana|  2| 20|
|  red|carrot|  3| 30|
| blue| grape|  4| 40|
|  red|carrot|  5| 50|
|black|carrot|  6| 60|
|  red|banana|  7| 70|
|  red| grape|  8| 80|
+-----+------+---+---+
```

### Parquet

```py
df.write.parquet('bar.parquet')
spark.read.parquet('bar.parquet').show()
```

```
+-----+------+---+---+
|color| fruit| v1| v2|
+-----+------+---+---+
|  red|banana|  1| 10|
| blue|banana|  2| 20|
|  red|carrot|  3| 30|
| blue| grape|  4| 40|
|  red|carrot|  5| 50|
|black|carrot|  6| 60|
|  red|banana|  7| 70|
|  red| grape|  8| 80|
+-----+------+---+---+
```

### ORC

```py
df.write.orc('zoo.orc')
spark.read.orc('zoo.orc').show()
```

```
+-----+------+---+---+
|color| fruit| v1| v2|
+-----+------+---+---+
|  red|banana|  1| 10|
| blue|banana|  2| 20|
|  red|carrot|  3| 30|
| blue| grape|  4| 40|
|  red|carrot|  5| 50|
|black|carrot|  6| 60|
|  red|banana|  7| 70|
|  red| grape|  8| 80|
+-----+------+---+---+
```

## 使用 SQL

DataFrame 和 Spark SQL 共享同一个执行引擎，因此它们可以无缝地互换使用。例如，您可以将 DataFrame 注册为表并轻松运行 SQL，如下所示

```py
df.createOrReplaceTempView("tableA")
spark.sql("SELECT count(*) from tableA").show()
```

```
+--------+
|count(1)|
+--------+
|       8|
+--------+
```

此外，UDF 可以直接在 SQL 中注册和调用

```py
@pandas_udf("integer")
def add_one(s: pd.Series) -> pd.Series:
    return s + 1

spark.udf.register("add_one", add_one)
spark.sql("SELECT add_one(v1) FROM tableA").show()
```

```
+-----------+
|add_one(v1)|
+-----------+
|          2|
|          3|
|          4|
|          5|
|          6|
|          7|
|          8|
|          9|
+-----------+
```

这些 SQL 表达式可以直接混合并用作 PySpark 列。

```py
from pyspark.sql.functions import expr

df.selectExpr('add_one(v1)').show()
df.select(expr('count(*)') > 0).show()
```

```
+-----------+
|add_one(v1)|
+-----------+
|          2|
|          3|
|          4|
|          5|
|          6|
|          7|
|          8|
|          9|
+-----------+

+--------------+
|(count(1) > 0)|
+--------------+
|          true|
+--------------+
```
