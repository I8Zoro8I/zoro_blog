---
title: Pandas-8-SQL
slug: AI工程师技术架构
date: 2026年05月27日
---

# Pandas 读取 SQL 数据库

Pandas 提供了一组直接与 SQL 数据库交互的函数，可以将查询结果直接读取为 DataFrame，也可以将 DataFrame 写回数据库。这使得数据分析师无需手动处理数据库连接和结果解析，大幅简化了数据库与 Python 的交互流程。

------

## 核心函数概览

| 函数                  | 用途                                                | 返回类型   |
| :-------------------- | :-------------------------------------------------- | :--------- |
| `pd.read_sql()`       | 执行 SQL 查询或读取整张表（兼容两种场景的通用函数） | DataFrame  |
| `pd.read_sql_query()` | 执行 SQL 查询语句，适合复杂查询                     | DataFrame  |
| `pd.read_sql_table()` | 直接读取整张表，仅支持 SQLAlchemy 连接              | DataFrame  |
| `DataFrame.to_sql()`  | 将 DataFrame 写入数据库表                           | None / int |

> 实际工作中推荐使用 `pd.read_sql()`，它会根据传入参数自动判断是执行查询还是读取整表，兼容性最好。`pd.read_sql_table()` 仅支持 SQLAlchemy 引擎连接，不支持原生 `sqlite3` 等 DB-API 连接。

------

## 建立数据库连接

Pandas 本身不直接连接数据库，需要借助第三方库建立连接后传入。主流方式有两种:**SQLAlchemy 引擎**（推荐）和 **DB-API 原生连接**（轻量简单）。

### 方式一:SQLAlchemy（推荐）

SQLAlchemy 是 Python 最主流的数据库工具包，支持所有主流数据库，且与 Pandas 兼容性最好:

```
pip install sqlalchemy
```

```py
from sqlalchemy import create_engine

# SQLAlchemy 连接字符串格式:数据库类型+驱动://用户名:密码@主机:端口/数据库名
# SQLite（文件数据库，无需用户名密码）
engine = create_engine("sqlite:///mydata.db")

# MySQL
engine = create_engine("mysql+pymysql://root:password@localhost:3306/mydb")

# PostgreSQL
engine = create_engine("postgresql+psycopg2://user:password@localhost:5432/mydb")

# SQL Server
engine = create_engine("mssql+pyodbc://user:password@server/mydb?driver=ODBC+Driver+17+for+SQL+Server")

# 验证连接是否成功
with engine.connect() as conn:
    print("连接成功")
```

## pd.read_sql() 读取数据

### 基本语法

```
pd.read_sql(sql, con, index_col=None, coerce_float=True, params=None, parse_dates=None, columns=None, chunksize=None)
```

主要参数说明:

| 参数          | 类型         | 说明                                          |
| :------------ | :----------- | :-------------------------------------------- |
| `sql`         | str          | SQL 查询语句，或表名（与 `con` 类型有关）     |
| `con`         | 连接对象     | SQLAlchemy 引擎或 DB-API 连接对象             |
| `index_col`   | str 或 list  | 将指定列设为 DataFrame 的行索引               |
| `params`      | list 或 dict | SQL 参数化查询的参数值，防止 SQL 注入         |
| `parse_dates` | list 或 dict | 将指定列解析为 datetime 类型                  |
| `chunksize`   | int          | 分块读取，每块返回指定行数的 DataFrame 迭代器 |

### 1、读取整张表

```py
import pandas as pd
from sqlalchemy import create_engine

# 1. 配置你的 PostgreSQL 连接信息
USER = "your_username"      # 你的 PgSQL 用户名
PASSWORD = "your_password"  # 你的 PgSQL 密码
HOST = "localhost"          # 数据库地址（如果在远程，写 IP 地址）
PORT = "5432"               # PgSQL 默认端口是 5432
DB_NAME = "your_database"   # 数据库名称

# 2. 创建 PostgreSQL 的连接引擎
# 格式为: postgresql+psycopg2://user:password@host:port/dbname
engine = create_engine(f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}")

# 3. 读取整张 employees 表
# 注意:PostgreSQL 对表名的大小写很敏感，如果表名有大写，建议用双引号，如 '"Employees"'
df = pd.read_sql("employees", con=engine)

# 4. 查看结果
print(df.head())
print(f"共 {len(df)} 行，{len(df.columns)} 列")
```

### 2、执行 SQL 查询

```py
import pandas as pd
from sqlalchemy import create_engine, text

# 创建 PgSQL 连接引擎
engine = create_engine("postgresql+psycopg2://user:password@localhost:5432/my_db")

# 编写带参数的复杂多表关联查询
sql = """
    SELECT e.name, e.salary, d.department_name
    FROM employees e
    JOIN departments d ON e.dept_id = d.id
    WHERE e.salary > :min_salary AND d.department_name = :dept_name
    ORDER BY e.salary DESC
"""

# 使用 text() 包装 SQL，并传递 params 字典
# 注意:read_sql 或 read_sql_query 都可以接收 params 参数
df = pd.read_sql(
    text(sql), 
    con=engine, 
    params={"min_salary": 10000, "dept_name": "IT"}
)

print(df.head(10))



# 像查询普通表/视图一样，直接 SELECT 函数名
func_sql = "SELECT * FROM get_high_earners(:min_sal);"

df_func = pd.read_sql(
    text(func_sql), 
    con=engine, 
    params={"min_sal": 15000}
)
print(df_func)
```

### 3、参数化查询（防止 SQL 注入）

查询条件来自用户输入时，**务必使用参数化查询**，不要用字符串拼接 SQL:

```py
import pandas as pd
from sqlalchemy import create_engine, text

# 创建 PostgreSQL 引擎
engine = create_engine("postgresql+psycopg2://user:password@localhost:5432/mydata")

# ✅ 安全写法:使用 :dept 和 :min_salary 命名参数
# 推荐使用 with 语句管理连接，确保资源及时释放
with engine.connect() as conn:
    df = pd.read_sql(
        text("SELECT * FROM employees WHERE department = :dept AND salary > :min_salary"),
        con=conn,
        params={"dept": "IT", "min_salary": 8000}  # params 是字典，按键值对映射
    )

print(df)

import pandas as pd
from sqlalchemy import create_engine

engine = create_engine("postgresql+psycopg2://user:password@localhost:5432/mydata")

# ✅ 安全写法:使用 %s 占位符（PostgreSQL 驱动特有语法）
df = pd.read_sql(
    "SELECT * FROM employees WHERE department = %s AND salary > %s",
    con=engine,
    params=["IT", 8000]   # params 是列表/元组，按位置顺序替换 %s
)

print(df)
```

### 4、设置索引列

```py
import pandas as pd
from sqlalchemy import create_engine

# 连接到 PostgreSQL 数据库
engine = create_engine("postgresql+psycopg2://user:password@localhost:5432/mydata")

# 1. 将数据库中的 id 列设为 DataFrame 的行索引
df = pd.read_sql("SELECT * FROM employees", con=engine, index_col="id")
print("单列索引 (id):")
print(df.head())

# 2. 使用多列作为复合索引（MultiIndex）
df = pd.read_sql(
    "SELECT * FROM orders",
    con=engine,
    index_col=["year", "month"]  # 复合索引
)
print("\n复合索引 (year, month):")
print(df.head())
```

### 5、解析日期列

数据库中存储的日期字段读取后默认是字符串类型，使用 `parse_dates` 参数可以直接解析为 `datetime`:

```py
import pandas as pd
from sqlalchemy import create_engine

# 连接到 PostgreSQL 数据库
engine = create_engine("postgresql+psycopg2://user:password@localhost:5432/mydata")

# 将 created_at 和 updated_at 列解析为 datetime 类型
df = pd.read_sql(
    "SELECT * FROM orders",
    con=engine,
    parse_dates=["created_at", "updated_at"] # 传入列表，自动识别标准 ISO 格式
)

print(df.dtypes)
```

## 分块读取大数据（chunksize）

当数据库表数据量很大时，一次性全部读入内存会导致 OOM（内存溢出）。使用 `chunksize` 参数可以将数据分批读取，每次只处理一部分:

```py
import pandas as pd
from sqlalchemy import create_engine, text

# 1. 创建 PostgreSQL 引擎
engine = create_engine("postgresql+psycopg2://user:password@localhost:5432/bigdata")

# 2. 使用 with 语句建立连接（对于大数据量流式读取，推荐显式管理连接）
with engine.connect() as conn:
    
    # chunksize=10000 返回一个 TextFileReader 迭代器对象
    # 注意:PgSQL 建议配合 text() 包装 SQL 语句
    chunks = pd.read_sql(
        text("SELECT * FROM large_table"), 
        con=conn, 
        chunksize=10000
    )

    result_list = []
    
    # 3. 逐块处理（内存中始终只有 10000 行）
    for i, chunk in enumerate(chunks):
        # 针对当前分块进行清洗或过滤
        processed = chunk[chunk["status"] == "active"]
        result_list.append(processed)
        
        print(f"已处理第 {i+1} 块，当前块有效行数:{len(processed)}")

# 4. 在循环外部合并最终结果
final_df = pd.concat(result_list, ignore_index=True)
print(f"最终共 {len(final_df)} 行有效数据")
```

### ⚠️ PostgreSQL 大数据量分块的两个核心“巨坑”

虽然上面的代码能跑通，但面对**千万级**甚至更大的数据时，PostgreSQL 底层有两个需要特别注意的机制:

#### 1. 默认驱动不支持真正的“流式游标”（服务器内存可能暴涨）

默认情况下，`psycopg2` 驱动在执行 `SELECT * FROM large_table` 时，**即使你加了 `chunksize`，它也会在底层把整张表的千万条数据先一口气从 PgSQL 服务器下载到你的客户端缓存中**，然后再由 Pandas 分块吐给你。这就失去了减少内存的初衷。

- **终极解决方案**:在 SQLAlchemy 连接中开启 `stream_results=True`（这会在底层启用 PostgreSQL 的 **Named Cursors 服务器端游标**，实现真正的边读边传）。

Python

```py
# 开启服务器端流式结果支持
with engine.connect().execution_options(stream_results=True) as conn:
    chunks = pd.read_sql(
        text("SELECT * FROM large_table"), 
        con=conn, 
        chunksize=10000
    )
    for chunk in chunks:
        # 此时才是绝对安全的、真正的流式分块
        pass
```

#### 2. 事务超时与长连接死锁

当你在 `for chunk in chunks` 循环内部做非常复杂的清洗或计算（比如每块要算 5 分钟），这意味着这个数据库连接会**一直处于未完成的事务状态**。

- **后果**:PostgreSQL 可能会因为连接长时间活跃而触发超时的报错（如 `idle in transaction timeout`），或者占用数据库锁导致其他业务死锁。
- **最佳实践**:如果单块的清洗逻辑很重，建议**不要**在循环里做复杂计算。直接在循环里把每一块 `chunk` 先 `.to_csv()` 或 `.to_parquet()` 暂存到本地硬盘，释放数据库连接后，再慢慢读取本地文件进行处理。

## pd.read_sql_query() 和 pd.read_sql_table()

### pd.read_sql_query():只执行查询

与 `pd.read_sql()` 功能基本相同，但只接受 SQL 查询语句，不接受表名。参数完全一致，适合需要明确区分"查询"和"读表"操作的场景

### pd.read_sql_table():读取整张表（仅 SQLAlchemy）

`pd.read_sql_table()` 专门用于读取整张表，支持通过参数过滤列和行，但**仅支持 SQLAlchemy 引擎连接**，不支持 sqlite3 等原生连接

## 将 DataFrame 写入数据库（to_sql）

使用 `DataFrame.to_sql()` 可以将 DataFrame 写入数据库，支持新建表、追加数据或覆盖原表:

### 基本语法

```
DataFrame.to_sql(name, con, schema=None, if_exists='fail', index=True, index_label=None, chunksize=None, dtype=None, method=None)
```

`if_exists` 参数决定目标表已存在时的行为:

| if_exists 值     | 行为                           | 适用场景             |
| :--------------- | :----------------------------- | :------------------- |
| `'fail'`（默认） | 表已存在时报错                 | 防止意外覆盖已有数据 |
| `'replace'`      | 先删除原表，再重新建表写入     | 全量刷新数据         |
| `'append'`       | 向已有表追加数据，不改变表结构 | 增量写入新数据       |

```py
import pandas as pd
from sqlalchemy import create_engine

# 1. 连接到 PostgreSQL 数据库
engine = create_engine("postgresql+psycopg2://user:password@localhost:5432/mydata")

# 2. 准备示例数据
df = pd.DataFrame({
    "name": ["张三", "李四", "王五"],
    "department": ["IT", "HR", "IT"],
    "salary": [12000, 8000, 15000]
})

# 3. 将 DataFrame 写入 employees 表（如果已存在则替换）
df.to_sql(
    "employees",
    con=engine,
    if_exists="replace",  # 覆盖原有数据
    index=False           # 不写入 DataFrame 索引
)

# 4. 追加新数据
new_employees = pd.DataFrame({
    "name": ["赵六"],
    "department": ["Finance"],
    "salary": [11000]
})
new_employees.to_sql("employees", con=engine, if_exists="append", index=False)
```

### 指定列的数据类型

写入时可以通过 `dtype` 参数显式指定每列在数据库中的类型

```py
df.to_sql(
    "students",
    con=engine,
    if_exists="replace",
    index=False,
    dtype={
        "id":    Integer(),   # 整数类型
        "name":  String(50),  # 变长字符串，最大 50 字符
        "score": Float()      # 浮点数
    }
)
```

## 常见问题与注意事项

**1、连接用完后需要关闭**

使用 DB-API 原生连接时（如 sqlite3），操作完成后需手动关闭连接。推荐用 `with` 语句自动管理:

```py
import sqlite3
import pandas as pd

# 使用 with 语句，退出时自动关闭连接，即使发生异常也不会泄漏连接
with sqlite3.connect("mydata.db") as conn:
    df = pd.read_sql("SELECT * FROM employees", con=conn)

print(df)  # 连接已自动关闭，但 df 数据仍然可用
```

**2、大表不要直接读取全部数据**

对于几百万行以上的大表，直接 `SELECT *` 读取全量数据会耗尽内存。应优先在 SQL 层面过滤数据（WHERE、LIMIT），或使用 `chunksize` 分块读取。

**3、read_sql_table 仅支持 SQLAlchemy**

若使用 sqlite3 等 DB-API 原生连接调用 `pd.read_sql_table()`，会报 `NotImplementedError`。请改用 `pd.read_sql()` 或换用 SQLAlchemy 引擎。

**4、to_sql 的 index 参数默认为 True**

默认情况下 `to_sql` 会把 DataFrame 的行索引（0, 1, 2...）也写入数据库，形成一个名为 `index` 的列，通常这是多余的。建议明确传入 `index=False`。

**5、数据库驱动需单独安装**

SQLAlchemy 连接不同数据库时，还需安装对应的驱动包:

| 数据库     | 驱动包    | 安装命令                      |
| :--------- | :-------- | :---------------------------- |
| MySQL      | PyMySQL   | `pip install pymysql`         |
| PostgreSQL | psycopg2  | `pip install psycopg2-binary` |
| SQL Server | pyodbc    | `pip install pyodbc`          |
| Oracle     | cx_Oracle | `pip install cx_Oracle`       |
| SQLite     | 内置      | 无需安装                      |