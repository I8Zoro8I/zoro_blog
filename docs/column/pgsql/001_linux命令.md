#### 一、PostgreSQL 登录命令

##### 基础登录语法

```bash
# 标准登录格式
psql -U postgres -h 127.0.0.1 -p 5430 -d solot_wy
```

##### 参数说明

| 参数 | 含义         | 示例值         |
| ---- | ------------ | -------------- |
| -U   | 指定登录用户 | postgres       |
| -h   | 数据库IP地址 | 127.0.0.1      |
| -p   | 数据库端口   | 5430/5999      |
| -d   | 目标数据库名 | solot_wy/taxon |

##### 登录后常用操作

```bash
# 只读查看配置/文件内容（view 命令）
view 文件名
```

------

##### 二、终端操作 SQL 文件（创建/编辑/删除）

```bash
# 1. 创建空 SQL 文件（示例路径：/tmp/test.sql）
touch /tmp/test.sql

# 2. 编辑 SQL 文件（常规方式）
vi /tmp/test.sql

# 3. 编辑 SQL 文件（直接进入插入模式，避免字母被吞）
vi +startinsert /tmp/test.sql

# 4. 清空并删除 SQL 文件（强制删除，无提示）
rm -f /tmp/test.sql

# （可选）本地创建/编辑/删除 update.sql
vi update.sql       # 编辑
rm -f update.sql    # 删除
```

##### 备注

- vi +startinsert 可直接进入编辑模式，解决部分终端环境下首次输入字母“被吞”的问题；
- /tmp/ 为临时目录，文件重启服务器后会丢失，重要 SQL 文件建议保存到非临时目录。

------

#### 三、执行 SQL 文件（批量执行命令）

##### 方式1：基础执行（需手动输入密码）

```bash
# 执行 /tmp/test.sql（taxon 库，端口 5999）
psql -h 127.0.0.1 -p 5999 -U postgres -d taxon -f /tmp/test.sql

# 执行 update.sql（taxon 库，默认端口）
psql -U postgres -h 127.0.0.1 -d taxon -f update.sql
```

##### 方式2：带密码执行（免手动输入密码）

```bash
# 执行 /tmp/test.sql（gofishing 库，端口 5999，密码：q1w2e3r4t5）
PGPASSWORD='q1w2e3r4t5' psql -h 127.0.0.1 -p 5999 -U postgres -d gofishing -f /tmp/test.sql
```

------

#### 查看函数定义

```bash
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'species_update'
AND n.nspname = 'pkg_admin';

SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'user_permission'
AND n.nspname = 'pkg_rbac';

SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_species_detail'
AND n.nspname = 'pkg_species';
```

#### 查询函数生成文件

```pgsql
\copy (SELECT id, icon_url, updated
FROM solot_species
WHERE updated >= '2026-01-01'
  AND updated < '2027-01-01'
ORDER BY updated DESC) TO '/tmp/solot_species_2026.csv' CSV HEADER;

--压缩工具压缩成一行
```

注意:
 ​\copy​ 和 (​ 之间必须有空格。

TO 和 '文件路径' 之间必须有空格，CSV 前面也要有空格。