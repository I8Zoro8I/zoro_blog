---
date: 2026年06月11日
tags:
  - 快速入门
---

# 快速入门：Pandas API on Spark

这是对 Pandas API on Spark 的简要介绍，主要面向新用户。本笔记向您展示了 pandas 和 Pandas API on Spark 之间的一些关键区别。您可以在“快速入门页面”的“实时笔记本：Pandas API on Spark”中亲自运行这些示例：[快速入门页面](https://spark.apache.ac.cn/docs/latest/api/python/getting_started/index.html)。

通常，我们按如下方式导入 Pandas API on Spark

```py
import pandas as pd
import numpy as np
import pyspark.pandas as ps
from pyspark.sql import SparkSession
```

## 对象创建

通过传入值列表来创建 pandas-on-Spark Series，让 Pandas API on Spark 创建默认的整数索引

```py
s = ps.Series([1, 3, 5, np.nan, 6, 8])
```

```
0    1.0
1    3.0
2    5.0
3    NaN
4    6.0
5    8.0
dtype: float64
```

通过传入一个可转换为类似 series 的对象的字典来创建 pandas-on-Spark DataFrame。

```py
psdf = ps.DataFrame(
    {'a': [1, 2, 3, 4, 5, 6],
     'b': [100, 200, 300, 400, 500, 600],
     'c': ["one", "two", "three", "four", "five", "six"]},
    index=[10, 20, 30, 40, 50, 60])
```

```

a	b	c
10	1	100	one
20	2	200	two
30	3	300	three
40	4	400	four
50	5	500	five
60	6	600	six
```

通过传入 numpy 数组、datetime 索引和标签列来创建 pandas DataFrame

```py
dates = pd.date_range('20130101', periods=6)
```

```
DatetimeIndex(['2013-01-01', '2013-01-02', '2013-01-03', '2013-01-04',
               '2013-01-05', '2013-01-06'],
              dtype='datetime64[ns]', freq='D')
```

```py
pdf = pd.DataFrame(np.random.randn(6, 4), index=dates, columns=list('ABCD'))
```

```
	              A	         B	      C	       D
2013-01-01	0.912558	-0.795645	-0.289115	0.187606
2013-01-02	-0.059703	-1.233897	0.316625	-1.226828
2013-01-03	0.332871	-1.262010	-0.434844	-0.579920
2013-01-04	0.924016	-1.022019	-0.405249	-1.036021
2013-01-05	-0.772209	-1.228099	0.068901	0.896679
2013-01-06	1.485582	-0.709306	-0.202637	-0.248766
```

现在，这个 pandas DataFrame 可以转换为 pandas-on-Spark DataFrame

```py
psdf = ps.from_pandas(pdf)
type(psdf)
#pyspark.pandas.frame.DataFrame
```

它看起来和表现得与 pandas DataFrame 相同。

此外，还可以轻松地从 Spark DataFrame 创建 pandas-on-Spark DataFrame。

从 pandas DataFrame 创建 Spark DataFrame

```py
spark = SparkSession.builder.getOrCreate()
sdf = spark.createDataFrame(pdf)
sdf.show()
```

```
+--------------------+-------------------+--------------------+--------------------+
|                   A|                  B|                   C|                   D|
+--------------------+-------------------+--------------------+--------------------+
|    0.91255803205208|-0.7956452608556638|-0.28911463069772175| 0.18760566615081622|
|-0.05970271470242...| -1.233896949308984|  0.3166246451758431| -1.2268284000402265|
| 0.33287106947536615|-1.2620100816441786| -0.4348444277082644| -0.5799199651437185|
|  0.9240158461589916|-1.0220190956326003| -0.4052488880650239| -1.0360212104348547|
| -0.7722090016558953|-1.2280986385313222|  0.0689011451939635|  0.8966790729426755|
|  1.4855822995785612|-0.7093056426018517| -0.2026366848847041|-0.24876619876451092|
+--------------------+-------------------+--------------------+--------------------+
```

从 Spark DataFrame 创建 pandas-on-Spark DataFrame。

```py
psdf = sdf.pandas_api()
```

```
	   A	      B	         C	        D
0	0.912558	-0.795645	-0.289115	0.187606
1	-0.059703	-1.233897	0.316625	-1.226828
2	0.332871	-1.262010	-0.434844	-0.579920
3	0.924016	-1.022019	-0.405249	-1.036021
4	-0.772209	-1.228099	0.068901	0.896679
5	1.485582	-0.709306	-0.202637	-0.248766

```

拥有特定的 [数据类型 (dtypes)](https://pandas.ac.cn/pandas-docs/stable/basics.html#basics-dtypes)。目前支持 Spark 和 pandas 共有的类型。

```py
psdf.dtypes
```

```
A    float64
B    float64
C    float64
D    float64
dtype: object
```

以下是如何显示数据帧顶部的行。

请注意，Spark 数据帧中的数据默认不保留自然顺序。可以通过设置 `compute.ordered_head` 选项来保留自然顺序，但这会因内部排序而导致性能开销。

```
psdf.head()
```

```
	    A	       B	       C	       D
0	0.912558	-0.795645	-0.289115	0.187606
1	-0.059703	-1.233897	0.316625	-1.226828
2	0.332871	-1.262010	-0.434844	-0.579920
3	0.924016	-1.022019	-0.405249	-1.036021
4	-0.772209	-1.228099	0.068901	0.896679
```

显示索引、列以及底层的 numpy 数据。

```py
psdf.index
#Index([0, 1, 2, 3, 4, 5], dtype='int64')
psdf.columns
#Index(['A', 'B', 'C', 'D'], dtype='object')
psdf.to_numpy()
'''
array([[ 0.91255803, -0.79564526, -0.28911463,  0.18760567],
       [-0.05970271, -1.23389695,  0.31662465, -1.2268284 ],
       [ 0.33287107, -1.26201008, -0.43484443, -0.57991997],
       [ 0.92401585, -1.0220191 , -0.40524889, -1.03602121],
       [-0.772209  , -1.22809864,  0.06890115,  0.89667907],
       [ 1.4855823 , -0.70930564, -0.20263668, -0.2487662 ]])
```

显示数据的快速统计摘要

```py
psdf.describe()
'''
         A	       B	       C         	D
count	6.000000	6.000000	6.000000	6.000000
mean	0.470519	-1.041829	-0.157720	-0.334542
std	0.809428	0.241511	0.294520	0.793014
min	-0.772209	-1.262010	-0.434844	-1.226828
25%	-0.059703	-1.233897	-0.405249	-1.036021
50%	0.332871	-1.228099	-0.289115	-0.579920
75%	0.924016	-0.795645	0.068901	0.187606
max	1.485582	-0.709306	0.316625	0.896679
'''
```

转置数据

```py
psdf.T
'''
	   0	       1	      2	       3         4	         5
A	0.912558	-0.059703	0.332871	0.924016	-0.772209	1.485582
B	-0.795645	-1.233897	-1.262010	-1.022019	-1.228099	-0.709306
C	-0.289115	0.316625	-0.434844	-0.405249	0.068901	-0.202637
D	0.187606	-1.226828	-0.579920	-1.036021	0.896679	-0.248766

```

按索引排序

```py
psdf.sort_index(ascending=False)
'''
      A     	B       	C	         D
5	1.485582	-0.709306	-0.202637	-0.248766
4	-0.772209	-1.228099	0.068901	0.896679
3	0.924016	-1.022019	-0.405249	-1.036021
2	0.332871	-1.262010	-0.434844	-0.579920
1	-0.059703	-1.233897	0.316625	-1.226828
0	0.912558	-0.795645	-0.289115	0.187606
```

按值排序

```py
psdf.sort_values(by='B')
'''
      A	        B       	C	         D
2	0.332871	-1.262010	-0.434844	-0.579920
1	-0.059703	-1.233897	0.316625	-1.226828
4	-0.772209	-1.228099	0.068901	0.896679
3	0.924016	-1.022019	-0.405249	-1.036021
0	0.912558	-0.795645	-0.289115	0.187606
5	1.485582	-0.709306	-0.202637	-0.248766

```

## 缺失数据

Pandas API on Spark 主要使用 `np.nan` 值来表示缺失数据。默认情况下，它不包含在计算中。

```py
pdf1 = pdf.reindex(index=dates[0:4], columns=list(pdf.columns) + ['E'])
pdf1.loc[dates[0]:dates[1], 'E'] = 1
psdf1 = ps.from_pandas(pdf1)
'''
                A	        B	       C	       D	     E
2013-01-01	0.912558	-0.795645	-0.289115	0.187606	1.0
2013-01-02	-0.059703	-1.233897	0.316625	-1.226828	1.0
2013-01-03	0.332871	-1.262010	-0.434844	-0.579920	NaN
2013-01-04	0.924016	-1.022019	-0.405249	-1.036021	NaN
'''
```

删除包含缺失数据的任何行。

```py
psdf1.dropna(how='any')
'''
                A          	B	     C        	D      E
2013-01-01	0.912558	-0.795645	-0.289115	0.187606	1.0
2013-01-02	-0.059703	-1.233897	0.316625	-1.226828	1.0

```

填充缺失数据。

```py
psdf1.fillna(value=5)
'''
               A	          B	      C      	D	       E
2013-01-01	0.912558	-0.795645	-0.289115	0.187606	1.0
2013-01-02	-0.059703	-1.233897	0.316625	-1.226828	1.0
2013-01-03	0.332871	-1.262010	-0.434844	-0.579920	5.0
2013-01-04	0.924016	-1.022019	-0.405249	-1.036021	5.0

```

## 操作

### 统计

执行描述性统计

```py
psdf.mean()
```

```
A    0.470519
B   -1.041829
C   -0.157720
D   -0.334542
dtype: float64
```

### Spark 配置

PySpark 中的各种配置可以在 Pandas API on Spark 中内部应用。例如，您可以启用 Arrow 优化，以极大地加快内部 pandas 转换速度。另请参阅 PySpark 文档中“在 PySpark 中将 Pandas 与 Apache Arrow 结合使用”的指南。

```py
prev = spark.conf.get("spark.sql.execution.arrow.pyspark.enabled")  # 保持其默认值。
ps.set_option("compute.default_index_type", "distributed")  # 使用默认索引以避免额外开销。
import warnings
warnings.filterwarnings("ignore")  # 忽略来自 Arrow 优化的警告。.
```

```py
park.conf.set("spark.sql.execution.arrow.pyspark.enabled", True)
%timeit ps.range(300000).to_pandas()
```

```
900 ms ± 186 ms per loop (mean ± std. dev. of 7 runs, 1 loop each)
```

```py
spark.conf.set("spark.sql.execution.arrow.pyspark.enabled", False)
%timeit ps.range(300000).to_pandas()
```

```
3.08 s ± 227 ms per loop (mean ± std. dev. of 7 runs, 1 loop each)
```

```py
ps.reset_option("compute.default_index_type")
spark.conf.set("spark.sql.execution.arrow.pyspark.enabled", prev)  # 将其默认值恢复。
```

## 分组

所谓的“分组”是指涉及以下一个或多个步骤的过程

- 根据某些标准将数据拆分为组
- 独立地将函数应用于每个组
- 将结果组合成数据结构

```py
psdf = ps.DataFrame({'A': ['foo', 'bar', 'foo', 'bar',
                          'foo', 'bar', 'foo', 'foo'],
                    'B': ['one', 'one', 'two', 'three',
                          'two', 'two', 'one', 'three'],
                    'C': np.random.randn(8),
                    'D': np.random.randn(8)})
```

```
	A	B	C	D
0	foo	one	1.039632	-0.571950
1	bar	one	0.972089	1.085353
2	foo	two	-1.931621	-2.579164
3	bar	three	-0.654371	-0.340704
4	foo	two	-0.157080	0.893736
5	bar	two	0.882795	0.024978
6	foo	one	-0.149384	0.201667
7	foo	three	-1.355136	0.693883

```

分组，然后将 [sum()](https://spark.apache.ac.cn/docs/latest/api/python/reference/pyspark.pandas/api/pyspark.pandas.groupby.GroupBy.sum.html) 函数应用于生成的组。

```py
psdf.groupby('A').sum()
```

```
A			 B            C         D 
bar	onethreetwo	1.200513	0.769627
foo	onetwotwoonethree	-2.553589	-1.361828

```

按多列分组会形成分层索引，我们同样可以应用 sum 函数。

```py
psdf.groupby(['A', 'B']).sum()
```

```
A	   B		  C           D
foo	one	0.890248	-0.370283
    two	-2.088701	-1.685428
    
bar	three	-0.654371	-0.340704

foo	three	-1.355136	0.693883

bar	two	0.882795	0.024978
    one	0.972089	1.085353

```

## 绘图

```py
import os
os.environ['PYARROW_IGNORE_TIMEZONE'] = '1'
import pandas as pd
import numpy as np
import pyspark.pandas as ps
from pyspark.sql import SparkSession

# 在创建连接时配置 spark.sql.ansi.enabled 为 False
spark = SparkSession.builder \
    .remote("sc://localhost:15002") \
    .config("spark.sql.ansi.enabled", "false") \
    .getOrCreate()

print(f"Connected to Spark version: {spark.version}")

# Pandas on Spark 测试
pser = pd.Series(np.random.randn(1000),
                 index=pd.date_range('1/1/2000', periods=1000))
psser = ps.Series(pser)
psser = psser.cummax()

# 注意：在无 UI 的终端环境下，psser.plot() 可能无法弹窗显示图形
# 如果绘图报错，尝试添加 psser.to_pandas().plot()
print(psser.head())

import matplotlib.pyplot as plt
psser.to_pandas().plot()
plt.savefig("result.png") # 保存图片查看
```

