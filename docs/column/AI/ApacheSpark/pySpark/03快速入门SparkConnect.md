---
date: 2026年06月11日
tags:
  - 快速入门
---

Spark Connect 引入了一种用于 Spark 的解耦客户端-服务器架构，允许通过 [DataFrame API](https://spark.apache.ac.cn/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.html?highlight=dataframe#pyspark.sql.DataFrame) 远程连接到 Spark 集群。

本笔记本将通过一个简单的分步示例，向您展示如何使用 Spark Connect 构建任何需要在处理数据时利用 Spark 强大功能的应用程序。

Spark Connect 包含客户端和服务器组件，我们将向您展示如何设置和使用这两者。

## 启动支持 Spark Connect 的 Spark 服务器

要启动支持 Spark Connect 会话的 Spark，请运行 `start-connect-server.sh` 脚本。要先在机器上部署完整的 **Apache Spark 发行版**（即包含 `sbin` 和 `jars` 的完整安装包），因为 Spark Connect Server 需要在 JVM 中运行。

1. 从 [Apache Spark 官网](https://spark.apache.org/downloads.html) 下载并解压 Spark。(确保pySpark跟spark版本一致)

2. 设置 `SPARK_HOME` 环境变量：

   Bash

   ```bash
   export SPARK_HOME=/path/to/your/spark-installation
   export PATH=$SPARK_HOME/bin:$PATH
   #不设置就需要进入到安装目录启动
   ```

 2. ##### 启动 Spark Connect Server

使用 `sbin/start-connect-server.sh` 脚本来启动服务。默认情况下，它会在 `15002` 端口上监听。

Bash

```bash
# 进入 Spark 安装目录
cd $SPARK_HOME

# 启动服务器
./sbin/start-connect-server.sh
#显示
'starting org.apache.spark.sql.connect.service.SparkConnectServer, logging to /Users/solot/Documents/workplace/python/spark/spark-4.0.2-bin-hadoop3/logs/spark-solot-org.apache.spark.sql.connect.service.SparkConnectServer-1-bogon.out
'
```

## 连接到 Spark Connect 服务器

现在 Spark 服务器已在运行，我们可以使用 Spark Connect 远程连接到它。我们通过在运行应用程序的客户端上创建远程 Spark 会话来实现这一点。在此之前，我们需要确保停止现有的常规 Spark 会话，因为它不能与我们要创建的远程 Spark Connect 会话共存。

```py
from pyspark.sql import SparkSession

SparkSession.builder.master("local[*]").getOrCreate().stop()
```

上面用于启动服务器的命令将 Spark 配置为在 `localhost:15002` 上运行。因此，现在我们可以使用以下命令在客户端创建远程 Spark 会话。

```py

#连接到spark服务器
from pyspark.sql import SparkSession

# 连接到本地运行的 Spark Connect Server
spark = SparkSession.builder \
    .remote("sc://localhost:15002") \
    .getOrCreate()

# 打印 Spark 版本号测试连接
print(f"Connected to Spark version: {spark.version}")

# 简单的 DataFrame 测试
df = spark.createDataFrame([(1, "Alice"), (2, "Bob")], ["id", "name"])
df.show()
```

## 创建 DataFrame

一旦远程 Spark 会话成功创建，它的使用方式就与常规 Spark 会话相同。因此，您可以使用以下命令创建 DataFrame。

```py
from datetime import datetime, date
from pyspark.sql import Row

df = spark.createDataFrame([
    Row(a=1, b=2., c='string1', d=date(2000, 1, 1), e=datetime(2000, 1, 1, 12, 0)),
    Row(a=2, b=3., c='string2', d=date(2000, 2, 1), e=datetime(2000, 1, 2, 12, 0)),
    Row(a=4, b=5., c='string3', d=date(2000, 3, 1), e=datetime(2000, 1, 3, 12, 0))
])
df.show()
```

```
+---+---+-------+----------+-------------------+
|  a|  b|      c|         d|                  e|
+---+---+-------+----------+-------------------+
|  1|2.0|string1|2000-01-01|2000-01-01 12:00:00|
|  2|3.0|string2|2000-02-01|2000-01-02 12:00:00|
|  4|5.0|string3|2000-03-01|2000-01-03 12:00:00|
+---+---+-------+----------+-------------------+
```

有关 DataFrame API 的更多详细用法，请参阅[快速入门页面](https://spark.apache.ac.cn/docs/latest/api/python/getting_started/index.html)上的“在线笔记本：DataFrame”。
