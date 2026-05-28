---
title: Pandas-21-电商数据分析demo
slug: AI工程师技术架构
date: 2026年05月28日
---

## 案例概述

分析电商平台的订单数据，包括销售趋势、产品表现、客户分析等维度。

### 数据准备

```py
import pandas as pd
import numpy as np

# 模拟电商订单数据
np.random.seed(42)
n_orders = 1000

orders = pd.DataFrame({
    "订单ID": range(1, n_orders + 1),
    "客户ID": np.random.randint(100, 200, n_orders),
    "商品ID": np.random.randint(1, 20, n_orders),
    "下单日期": pd.date_range("2024-01-01", periods=n_orders, freq="30min"),
    "数量": np.random.randint(1, 5, n_orders),
    "单价": np.random.uniform(10, 500, n_orders).round(2)
})

# 计算订单金额
orders["订单金额"] = (orders["数量"] * orders["单价"]).round(2)

print("订单数据概览：")
print(orders.head(10))
print(f"\n数据量: {len(orders)} 条")
```

### 数据预处理

```py
# 提取日期特征
orders["日期"] = orders["下单日期"].dt.date
orders["小时"] = orders["下单日期"].dt.hour
orders["星期"] = orders["下单日期"].dt.day_name()
orders["月份"] = orders["下单日期"].dt.month

print("添加时间特征后：")
print(orders.head())
print()

# 缺失值检查
print("缺失值检查：")
print(orders.isnull().sum())
```

## 销售分析

### 整体销售情况

```py
# 整体销售指标
print("=== 整体销售情况 ===\n")
print(f"总订单数: {len(orders):,}")
print(f"总销售额: ¥{orders['订单金额'].sum():,.2f}")
print(f"平均订单金额: ¥{orders['订单金额'].mean():,.2f}")
print(f"中位数订单金额: ¥{orders['订单金额'].median():,.2f}")
print()

# 按月统计
monthly = orders.groupby("月份").agg({
    "订单ID": "count",
    "订单金额": "sum",
    "客户ID": "nunique"
}).rename(columns={
    "订单ID": "订单数",
    "订单金额": "销售额",
    "客户ID": "客户数"
})

print("月度销售趋势：")
print(monthly)
```

### 产品分析

```py
# 产品销售排名
product_sales = orders.groupby("商品ID").agg({
    "订单ID": "count",
    "数量": "sum",
    "订单金额": "sum"
}).rename(columns={
    "订单ID": "订单数",
    "数量": "销量",
    "订单金额": "销售额"
}).sort_values("销售额", ascending=False)

print("=== 产品销售排名 Top 10 ===\n")
print(product_sales.head(10))
print()

# 热销产品
print(f"热销产品: 商品 {product_sales.index[0]}")
print(f"销售额: ¥{product_sales.iloc[0]['销售额']:,.2f}")
```

### 客户分析

```py
# 客户消费分析
customer_sales = orders.groupby("客户ID").agg({
    "订单ID": "count",
    "订单金额": "sum"
}).rename(columns={
    "订单ID": "订单数",
    "订单金额": "总消费"
})

print("=== 客户分析 ===\n")
print(f"活跃客户数: {len(customer_sales)}")
print(f"客户平均订单数: {customer_sales['订单数'].mean():.1f}")
print(f"客户平均消费: ¥{customer_sales['总消费'].mean():,.2f}")
print()

# 客户分层
customer_sales["分层"] = pd.cut(
    customer_sales["总消费"],
    bins=[0, 1000, 5000, 10000, float("inf")],
    labels=["普通", "银卡", "金卡", "VIP"]
)

print("客户分层统计：")
print(customer_sales["分层"].value_counts())
```

### 时间分析

```py
# 按时段分析
hourly = orders.groupby("小时")["订单金额"].sum()

print("=== 时段销售分析 ===\n")
print(f"销售高峰时段: {hourly.idxmax()} 点")
print(f"该时段销售额: ¥{hourly.max():,.2f}")
print()

# 按星期分析
weekday = orders.groupby("星期")["订单金额"].sum().reindex([
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
])

print("星期销售：")
for day, amount in weekday.items():
    print(f"{day}: ¥{amount:,.2f}")
```

## 分析总结

```py
print("""
=== 电商数据分析总结 ===

1. 销售概况
   - 总订单数: {0}
   - 总销售额: ¥{1:,.2f}
   - 平均客单价: ¥{2:.2f}

2. 产品表现
   - 热销产品: 商品 {3}
   - 产品销售额分布不均，头部产品贡献大量收入

3. 客户洞察
   - 活跃客户: {4} 人
   - 建议重点维护高价值客户

4. 时间规律
   - 销售高峰在 {5} 点左右
   - 可根据高峰时段调整营销策略

5. 优化建议
   - 1) 针对热销产品加大库存和推广
   - 2) 对高价值客户提供个性化服务
   - 3) 在销售高峰时段增加客服配置
""".format(
    len(orders),
    orders["订单金额"].sum(),
    orders["订单金额"].mean(),
    product_sales.index[0],
    len(customer_sales),
    hourly.idxmax()
))
```

