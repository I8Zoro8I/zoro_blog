# 🧠 运用机器学习进行电子竞技胜负预测：以 VALORANT 比赛 (2025) 为例

在当今数据驱动的电竞世界中，理解战队数据、推演比赛走向是精细化运营、赛事内容产出以及战队战术分析的关键。然而，当一个赛季的合作地区涵盖美洲、欧洲、中东和非洲、太平洋和中国四大赛区，累计比赛长达数百场时，仅凭直觉或人工复盘很难捕捉到全局的战力趋势。

这时，机器学习技术，特别是**有监督学习中的分类算法**与**精细化的特征工程**，就成为了一个强大的工具。

本文将带你一步步完成一个完整的电竞胜负预测实战项目。我们将结合 `vct2025_05_match_results.csv`（比赛结果表）与 `vct2025_06_standings.csv`（积分排名表），通过引入**赛事级别动态权重机制**，构建一个能够输入两支战队名称即可预测胜负概率的逻辑回归模型。

---

## 1. 理解电竞预测与逻辑回归模型

在开始实战之前，我们需要理解业务逻辑与即将使用的核心算法。

### 什么是电竞胜负预测模型？
在机器学习中，预测一场比赛的胜负是一个经典的**二分类（Binary Classification）问题**。我们的目标是给模型输入两支战队的历史特征，让模型输出战队 1 战胜战队 2 的概率。

### 核心痛点：赛事含金量的非对等性
在传统的体育或电竞数据分析中，通常将历史对局一视同仁。但在真实世界中，战队在 **Stage 常规联赛阶段**中输掉一场比赛，与其在 **Champions 全球冠军赛（如巴黎总决赛）**中输掉生死局的性质完全不同。
* **Stage（常规联赛）**：赛程冗长，顶级战队可能保留实力、测试新阵容、演练新战术，爆冷的概率较高。
* **Champions（全球冠军赛）/ Masters（大师赛）**：最高荣誉舞台，战队全力以赴，数据最能反映真实战力上限。



因此，如果不对赛事加以区分，常规赛的“控分或连败噪点”就会严重干扰模型对顶级强队真实战斗力的评估。

### 解决方案：引入数学加权机制
我们根据赛事的级别，为每场比赛和积分榜表现人为定义一个**权重因子 (Event Weight, $W_e$)**：

 | 赛事类别 | 关键词特征 | 权重因子 ($W_e$) | 业务逻辑解释 |
| :--- | :--- | :--- | :--- |
| **全球冠军赛** | Champions | **2.0** | 年度最高荣誉，数据最真实反映上限 |
| **大师赛** | Masters | **1.5** | 顶级国际对抗，具备极高战术价值 |
| **常规联赛** | Stage | **0.8** | 赛程长且频繁，存在练兵与控分干扰 |
| **启动/杯赛** | 其他 (Kickoff) | **1.0** | 基准对局，维持模型整体基线 |

### 逻辑回归（Logistic Regression）分类器工作原理
由于电竞预测的核心特征维度适中（主要是两队的加权战力差值），我们选择**逻辑回归**作为核心模型。它不仅计算高效，而且具备极强的解释性——能直接输出直观的胜率百分比。

逻辑回归通过 **Sigmoid 函数**将输入的两队实力差值映射到 $(0, 1)$ 区间，输出战队 1 获胜的概率：

$$
P(Y=1|X) = \frac{1}{1 + e^{-Z}}
$$

$$
Z = \beta_0 + \beta_1 \cdot \Delta WR_{weighted} + \beta_2 \cdot \Delta SD_{weighted}
$$

* 当 $P > 0.5$ 时，模型预测战队 1 获胜；
* 当 $P \le 0.5$ 时，模型预测战队 2 获胜。

---

## 2. 实战演练：VCT 2025 战队加权胜负预测

现在，让我们将理论付诸实践。我们将使用 Python 及其强大的数据科学库（pandas、numpy、scikit-learn）来完成这个项目。

### 第 1 步：环境准备与数据清洗
首先，确保你的 Python 环境中安装了必要的库。我们对输入的战队名称和赛事名称进行严格的去空格和规范化处理，防止由于格式问题导致特征提取失败。

```python
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LogisticRegression
import warnings
warnings.filterwarnings('ignore')

# 设置可视化风格
sns.set_style("whitegrid")
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'PingFang SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False
```

### 第 2 步：构建赛事级别动态权重函数

根据业务背景，我们编写一个动态提取权重的函数。赛事名称中带有 `champions` 的赋予最高权重 2.0，带有 

```py
def get_event_weight(event_name):
    """
    根据赛事名称包含的关键词，动态返回权重：
    - Champions (全球冠军赛): 权重最高 (2.0)
    - Masters (大师赛): 权重次高 (1.5)
    - Stage (常规联赛阶段): 权重较低 (0.8)
    - 其他 (如 Kickoff 启动赛等): 默认权重 (1.0)
    """
    event_name_lower = str(event_name).lower()
    if 'champions' in event_name_lower:
        return 2.0
    elif 'masters' in event_name_lower:
        return 1.5
    elif 'stage' in event_name_lower:
        return 0.8
    return 1.0
```

### 第 3 步：双表关联加权特征工程

在此步骤中，我们同时读取 `vct2025_05_match_results.csv`（微观逐场比分）与 `vct2025_06_standings.csv`（宏观积分榜排名），为每支战队精算两个核心特征：

1. **加权历史胜率 (WRweighted)**：将各赛事的胜场乘上权重后归一化。
2. **加权场均净胜局 (SDweighted)**：衡量赢球的统治力（如 2:0 净胜 2 局，统治力高于 2:1 净胜 1 局）。

```py
def load_and_process_weighted_data(matches_path="vct2025_05_match_results.csv", standings_path="vct2025_06_standings.csv"):
    """
    加载比赛结果表与积分排名表，计算引入赛事权重后的战队综合战力
    """
    # 兜底机制：若无本地文件，自动激活演示数据
    if not os.path.exists(matches_path):
        print(f"💡 未找到 {matches_path}，已自动激活内置演示对局数据...")
        mock_matches = {
            'event_name': ['VCT 2025: Americas Stage 2', 'VCT 2025: EMEA Stage 2', 'VALORANT Champions 2025', 'VALORANT Champions 2025'],
            'team_1': ['G2 Esports', 'Fnatic', 'G2 Esports', 'Fnatic'],
            'team_2': ['Cloud9', 'GIANTX', 'Fnatic', 'Cloud9'],
            'score_team_1': [2, 2, 3, 3],
            'score_team_2': [0, 1, 2, 1],
            'winner': ['G2 Esports', 'Fnatic', 'G2 Esports', 'Fnatic']
        }
        df_matches = pd.DataFrame(mock_matches)
    else:
        df_matches = pd.read_csv(matches_path)

    if not os.path.exists(standings_path):
        print(f"💡 未找到 {standings_path}，已自动激活内置演示积分榜数据...")
        mock_standings = {
            'event_name': ['VCT 2025: EMEA Stage 2', 'VCT 2025: EMEA Stage 2', 'VCT 2025: Americas Stage 2', 'VALORANT Champions 2025'],
            'team_name': ['Fnatic', 'GIANTX', 'G2 Esports', 'G2 Esports'],
            'wins': [6, 5, 9, 12],
            'losses': [5, 6, 2, 3],
            'placement': [4, 6, 1, 1]
        }
        df_standings = pd.DataFrame(mock_standings)
    else:
        df_standings = pd.read_csv(standings_path)

    # 数据清洗
    for col in ['team_1', 'team_2', 'winner', 'event_name']:
        if col in df_matches.columns: df_matches[col] = df_matches[col].astype(str).str.strip()
    for col in ['team_name', 'event_name']:
        if col in df_standings.columns: df_standings[col] = df_standings[col].astype(str).str.strip()

    # 提取所有不重复的战队
    all_teams = pd.concat([df_matches['team_1'], df_matches['team_2'], df_standings['team_name']]).unique()
    team_features = {}

    for team in all_teams:
        total_weighted_matches = 0
        weighted_wins = 0
        weighted_score_diff = 0
        
        # 1. 解析逐场对局表 (Matches) 的加权表现
        team_matches = df_matches[(df_matches['team_1'] == team) | (df_matches['team_2'] == team)]
        for _, row in team_matches.iterrows():
            weight = get_event_weight(row['event_name'])
            total_weighted_matches += weight
            
            if row['winner'] == team:
                weighted_wins += weight
                
            if row['team_1'] == team:
                weighted_score_diff += (row['score_team_1'] - row['score_team_2']) * weight
            else:
                weighted_score_diff += (row['score_team_2'] - row['score_team_1']) * weight

        # 2. 融入积分榜 (Standings) 的加权长期表现
        team_standings = df_standings[df_standings['team_name'] == team]
        for _, row in team_standings.iterrows():
            weight = get_event_weight(row['event_name'])
            s_wins = row['wins']
            s_losses = row['losses']
            s_total = s_wins + s_losses
            
            if s_total > 0:
                total_weighted_matches += s_total * weight
                weighted_wins += s_wins * weight

        # 3. 特征计算
        if total_weighted_matches > 0:
            final_weighted_wr = weighted_wins / total_weighted_matches
            final_weighted_score = weighted_score_diff / (len(team_matches) if len(team_matches) > 0 else 1)
        else:
            final_weighted_wr = 0.5
            final_weighted_score = 0.0

        team_features[team] = {
            'weighted_win_rate': final_weighted_wr,
            'weighted_score_diff': final_weighted_score
        }

    return df_matches, team_features
```

### 第 4 步：模型训练

将训练集中每场历史对阵双方的【加权胜率差】与【加权小局比分差】作为特征矩阵 X，将该场比赛实际获胜方作为标签 y，训练逻辑回归分类器。

```py
def train_weighted_model(df_matches, team_features):
    """
    基于历史对局差值特征，训练逻辑回归模型
    """
    X = []
    y = []
    
    for _, row in df_matches.iterrows():
        t1, t2 = row['team_1'], row['team_2']
        
        feat_1 = team_features.get(t1, {'weighted_win_rate': 0.5, 'weighted_score_diff': 0.0})
        feat_2 = team_features.get(t2, {'weighted_win_rate': 0.5, 'weighted_score_diff': 0.0})
        
        # 构造核心差值特征
        wr_diff = feat_1['weighted_win_rate'] - feat_2['weighted_win_rate']
        score_diff = feat_1['weighted_score_diff'] - feat_2['weighted_score_diff']
        
        X.append([wr_diff, score_diff])
        y.append(1 if row['winner'] == t1 else 0)
        
    model = LogisticRegression()
    if len(X) > 0:
        model.fit(X, y)
    return model
```

### 第 5 步：一键胜负预测与数据可视化看板

最后，提供一个交互接口。只要输入两支战队的名字，代码就能自动提取各自在 2025 赛季经过权重修正后的战力数据，并输出胜负指数。

```py
def predict_match(team_a, team_b, matches_csv="vct2025_05_match_results.csv", standings_csv="vct2025_06_standings.csv"):
    """
    核心输入接口：填入两个战队名称，获取胜负预测
    """
    df_matches, team_features = load_and_process_weighted_data(matches_csv, standings_csv)
    model = train_weighted_model(df_matches, team_features)
    
    team_a = team_a.strip()
    team_b = team_b.strip()
    
    if team_a not in team_features or team_b not in team_features:
        print(f"⚠️ 提示: 战队库中未完全匹配到 【{team_a}】 或 【{team_b}】，将基于基础参数预测。")
        
    feat_a = team_features.get(team_a, {'weighted_win_rate': 0.5, 'weighted_score_diff': 0.0})
    feat_b = team_features.get(team_b, {'weighted_win_rate': 0.5, 'weighted_score_diff': 0.0})
    
    # 计算差异特征
    wr_diff = feat_a['weighted_win_rate'] - feat_b['weighted_win_rate']
    score_diff = feat_a['weighted_score_diff'] - feat_b['weighted_score_diff']
    
    try:
        prob_a_wins = model.predict_proba([[wr_diff, score_diff]])[0][1]
    except Exception:
        # 当样本极少或模型未充分拟合时的 Sigmoid 兜底数学推演
        prob_a_wins = 1 / (1 + np.exp(-(wr_diff * 4.0 + score_diff * 0.5)))
        
    prob_b_wins = 1 - prob_a_wins
    
    # ==========================================
    # 打印精美可视化控制台看板
    # ==========================================
    print("\n" + "="*60)
    print(f"      🏆 VCT 2025 赛事权重优化版机器学习预测 🏆")
    print("="*60)
    print(f" ⚔️  对阵双方:  【 {team_a} 】  VS  【 {team_b} 】")
    print("-"*60)
    print(f" 📊 调整后的加权战力数据 (Champions 权重 2.0 / Stage 权重 0.8):")
    print(f"    - {team_a:<15} 加权胜率: {feat_a['weighted_win_rate']:.1%} | 加权场均净胜局: {feat_a['weighted_score_diff']:.2f}")
    print(f"    - {team_b:<15} 加权胜率: {feat_b['weighted_win_rate']:.1%} | 加权场均净胜局: {feat_b['weighted_score_diff']:.2f}")
    print("-"*60)
    
    if prob_a_wins > prob_b_wins:
        print(f" 👑 模型推演赢家: ✨【 {team_a} 】✨ 🟢")
    elif prob_b_wins > prob_a_wins:
        print(f" 👑 模型推演赢家: ✨【 {team_b} 】✨ 🟢")
    else:
        print(f" ⚖️ 经过权重精算，两队胜率完全对等 ⚖️")
        
    print(f"\n 📈 最终独赢期望概率:")
    print(f"    👉 {team_a}: {prob_a_wins:.2%}")
    print(f"    👉 {team_b}: {prob_b_wins:.2%}")
    print("="*60 + "\n")

# ========================================================
# 模块测试运行
# ========================================================
if __name__ == "__main__":
    # 示例预测：对阵双方 Fnatic vs G2 Esports
    predict_match(team_a="Fnatic", team_b="G2 Esports")
```

## 3. 模型评估与应用建议

### 模型效果评估

除了基础的胜率对阵输出，在实际应用中，可以通过将 `vct2025_05_match_results.csv` 划分为训练集和验证集，来计算模型的 **准确率（Accuracy）** 以及 **ROC-AUC 得分**。由于引入了赛事加权，模型在高级别全球赛事（Champions）上的预测准确率通常会显著高于普通的未加权模型。

### 商业及运营应用建议

1. **精细化电竞赛事运营**：在赛事直播或社群互动中，利用该模型实时生成“大数据胜率预测面板”，作为官方推演或观众竞猜的内容支撑，提升观众黏性。
2. **战队备战与策略分析**：战队教练组可以通过调整特征矩阵（如只锁定近期的对局数据），来评估下一轮对手的实时战力浮动。
3. **媒体与彩池模拟**：在季后赛或全球冠军赛分组揭晓时，利用该模型一键运行“锦标赛分组模拟”，预测各战队晋级四强或夺冠的概率，产出极具洞察力的预测报告。

## 4. 总结与扩展

通过这个实战案例，你完整体验了利用机器学习进行电子竞技胜负预测的工业级流程：**数据清洗 -> 跨表加权特征工程 -> 逻辑回归模型训练 -> 一键交互预测**。

### 🚀 进一步微观扩展探索

正如客户分群项目可以根据业务下钻一样，如果你想让胜负预测更加微观精准，可以考虑在特征矩阵中加入以下两个维度：

- **核心选手名册加成**：动态关联 `vct2025_03_players_rosters.csv`，如果输入的战队包含特定的明星决斗者或明星控场者，为该战队赋予额外的阵容战力修正系数。
- **时间衰减因子**：引入比赛日期 `match_date`，使得越临近当前日期的对局表现权重越高，从而使模型具备识别战队近期“连胜冲劲”或“低迷期”的能力。

完整代码

```py
# -*- coding: utf-8 -*-
"""
🧠 VCT 2025 电子竞技胜负预测模型（赛事动态权重优化版）
功能：融合微观比分表与宏观积分榜，进行动态降权/提权特征工程，并基于逻辑回归预测对局独赢概率。
"""

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LogisticRegression
import warnings

warnings.filterwarnings('ignore')  # 忽略非关键性警告

# =========================================================================
# 1. 环境与可视化风格配置（支持中文字体显示）
# =========================================================================
sns.set_style("whitegrid")
plt.rcParams['font.sans-serif'] = [
    'SimHei', 'Microsoft YaHei',  # Windows 优先
    'PingFang SC', 'Heiti TC',  # macOS 优先
    'WenQuanYi Micro Hei', 'DejaVu Sans'  # Linux & 兜底
]
plt.rcParams['axes.unicode_minus'] = False  # 修复负号显示为方块的问题


# =========================================================================
# 2. 核心特征工程：赛事级别动态权重机制
# =========================================================================
def get_event_weight(event_name):
    """
    根据赛事名称包含的关键词，动态返回数学权重：
    - 包含 'Champions' (全球冠军赛): 权重最高 (2.0)
    - 包含 'Masters' (大师赛): 权重次高 (1.5)
    - 包含 'Stage' (常规联赛阶段): 权重较低 (0.8)
    - 其他 (如 Kickoff 启动赛等): 默认基础权重 (1.0)
    """
    event_name_lower = str(event_name).lower()
    if 'champions' in event_name_lower:
        return 2.0
    elif 'masters' in event_name_lower:
        return 1.5
    elif 'stage' in event_name_lower:
        return 0.8
    return 1.0


# =========================================================================
# 3. 双表关联数据加载与特征精算
# =========================================================================
def load_and_process_weighted_data(matches_path="vct2025_05_match_results.csv",
                                   standings_path="vct2025_06_standings.csv"):
    """
    同时加载对局结果表与积分排名表，计算引入赛事权重后各战队的综合战力特征
    """
    # ---- 3.1 健壮性防线：若找不到本地真实文件，自动激活演示数据集保证代码立即可运行 ----
    if not os.path.exists(matches_path):
        print(f"💡 [提示] 未在当前目录下找到 {matches_path}，已自动激活内置演示对局数据...")
        mock_matches = {
            'event_name': ['VCT 2025: Americas Stage 2', 'VCT 2025: EMEA Stage 2', 'VALORANT Champions 2025',
                           'VALORANT Champions 2025'],
            'team_1': ['G2 Esports', 'Fnatic', 'G2 Esports', 'Fnatic'],
            'team_2': ['Cloud9', 'GIANTX', 'Fnatic', 'Cloud9'],
            'score_team_1': [2, 2, 3, 3],
            'score_team_2': [0, 1, 2, 1],
            'winner': ['G2 Esports', 'Fnatic', 'G2 Esports', 'Fnatic']
        }
        df_matches = pd.DataFrame(mock_matches)
    else:
        df_matches = pd.read_csv(matches_path)

    if not os.path.exists(standings_path):
        print(f"💡 [提示] 未在当前目录下找到 {standings_path}，已自动激活内置演示积分榜数据...")
        mock_standings = {
            'event_name': ['VCT 2025: EMEA Stage 2', 'VCT 2025: EMEA Stage 2', 'VCT 2025: Americas Stage 2',
                           'VALORANT Champions 2025'],
            'team_name': ['Fnatic', 'GIANTX', 'G2 Esports', 'G2 Esports'],
            'wins': [6, 5, 9, 12],
            'losses': [5, 6, 2, 3],
            'placement': [4, 6, 1, 1]
        }
        df_standings = pd.DataFrame(mock_standings)
    else:
        df_standings = pd.read_csv(standings_path)

    # ---- 3.2 字符串级深度数据清洗（去除潜在的前后空格） ----
    for col in ['team_1', 'team_2', 'winner', 'event_name']:
        if col in df_matches.columns:
            df_matches[col] = df_matches[col].astype(str).str.strip()
    for col in ['team_name', 'event_name']:
        if col in df_standings.columns:
            df_standings[col] = df_standings[col].astype(str).str.strip()

    # ---- 3.3 跨表提取全局唯一战队集合 ----
    all_teams = pd.concat([df_matches['team_1'], df_matches['team_2'], df_standings['team_name']]).unique()
    team_features = {}

    # ---- 3.4 核心特征精算循环 ----
    for team in all_teams:
        total_weighted_matches = 0
        weighted_wins = 0
        weighted_score_diff = 0

        # A. 解析微观逐场对局表 (Matches) 的加权表现
        team_matches = df_matches[(df_matches['team_1'] == team) | (df_matches['team_2'] == team)]
        for _, row in team_matches.iterrows():
            weight = get_event_weight(row['event_name'])
            total_weighted_matches += weight

            if row['winner'] == team:
                weighted_wins += weight

            if row['team_1'] == team:
                weighted_score_diff += (row['score_team_1'] - row['score_team_2']) * weight
            else:
                weighted_score_diff += (row['score_team_2'] - row['score_team_1']) * weight

        # B. 融入宏观积分榜 (Standings) 的加权历史胜负表现
        team_standings = df_standings[df_standings['team_name'] == team]
        for _, row in team_standings.iterrows():
            weight = get_event_weight(row['event_name'])
            s_wins = row['wins']
            s_losses = row['losses']
            s_total = s_wins + s_losses

            if s_total > 0:
                total_weighted_matches += s_total * weight
                weighted_wins += s_wins * weight

        # C. 特征数学归一化与归纳
        if total_weighted_matches > 0:
            final_weighted_wr = weighted_wins / total_weighted_matches
            # 场均加权净胜局
            final_weighted_score = weighted_score_diff / (len(team_matches) if len(team_matches) > 0 else 1)
        else:
            final_weighted_wr = 0.5
            final_weighted_score = 0.0

        team_features[team] = {
            'weighted_win_rate': final_weighted_wr,
            'weighted_score_diff': final_weighted_score
        }

    return df_matches, team_features


# =========================================================================
# 4. 有监督学习：逻辑回归模型训练
# =========================================================================
def train_weighted_model(df_matches, team_features):
    """
    构建特征矩阵 X (实力差值) 与标签 y (胜负结果)，训练Logistic回归模型
    """
    X = []
    y = []

    for _, row in df_matches.iterrows():
        t1, t2 = row['team_1'], row['team_2']

        feat_1 = team_features.get(t1, {'weighted_win_rate': 0.5, 'weighted_score_diff': 0.0})
        feat_2 = team_features.get(t2, {'weighted_win_rate': 0.5, 'weighted_score_diff': 0.0})

        # 特征：对阵双方在历史加权胜率、加权场均净胜小局上的【差值特征】
        wr_diff = feat_1['weighted_win_rate'] - feat_2['weighted_win_rate']
        score_diff = feat_1['weighted_score_diff'] - feat_2['weighted_score_diff']

        X.append([wr_diff, score_diff])
        y.append(1 if row['winner'] == t1 else 0)  # 1代表team_1获胜，0代表team_2获胜

    model = LogisticRegression()
    if len(X) > 0:
        model.fit(X, y)
    return model


# =========================================================================
# 5. 高级交互与可视化预测接口
# =========================================================================
def predict_match(team_a, team_b, matches_csv="vct2025_05_match_results.csv", standings_csv="vct2025_06_standings.csv"):
    """
    一键推演接口：输入任意两支战队，自动提取加权特征，输出推演概率和战力看板
    """
    # 5.1 数据流处理与模型构建
    df_matches, team_features = load_and_process_weighted_data(matches_csv, standings_csv)
    model = train_weighted_model(df_matches, team_features)

    team_a = team_a.strip()
    team_b = team_b.strip()

    # 5.2 安全检查
    if team_a not in team_features or team_b not in team_features:
        print(f"⚠️  [警告] 战队库中未完全匹配到 【{team_a}】 或 【{team_b}】，将启用兜底基准分进行推演。")

    feat_a = team_features.get(team_a, {'weighted_win_rate': 0.5, 'weighted_score_diff': 0.0})
    feat_b = team_features.get(team_b, {'weighted_win_rate': 0.5, 'weighted_score_diff': 0.0})

    # 5.3 差值特征输入提取
    wr_diff = feat_a['weighted_win_rate'] - feat_b['weighted_win_rate']
    score_diff = feat_a['weighted_score_diff'] - feat_b['weighted_score_diff']

    # 5.4 概率映射 (Sigmoid)
    try:
        prob_a_wins = model.predict_proba([[wr_diff, score_diff]])[0][1]
    except Exception:
        # 当样本极少或模型未完全训练完毕时的数学 Sigmoid 函数兜底
        prob_a_wins = 1 / (1 + np.exp(-(wr_diff * 4.0 + score_diff * 0.5)))

    prob_b_wins = 1 - prob_a_wins

    # =========================================================================
    # 6. 控制台精美数据看板输出
    # =========================================================================
    print("\n" + "=" * 65)
    print(f"       🏆  VALORANT VCT 2025 权重深度精算预测看板  🏆")
    print("=" * 65)
    print(f" ⚔️  对阵赛序:   【 {team_a} 】   VS   【 {team_b} 】")
    print("-" * 65)
    print(f" 📊 修正后的机器学习加权特征 (Champions 权重 2.0 / Stage 权重 0.8):")
    print(
        f"    - {team_a:<15} 加权综合胜率: {feat_a['weighted_win_rate']:.1%} | 加权场均净胜局: {feat_a['weighted_score_diff']:.2f}")
    print(
        f"    - {team_b:<15} 加权综合胜率: {feat_b['weighted_win_rate']:.1%} | 加权场均净胜局: {feat_b['weighted_score_diff']:.2f}")
    print("-" * 65)

    if prob_a_wins > prob_b_wins:
        print(f" 👑 模型推演期望胜者: ✨【 {team_a} 】✨ 🟢")
    elif prob_b_wins > prob_a_wins:
        print(f" 👑 模型推演期望胜者: ✨【 {team_b} 】✨ 🟢")
    else:
        print(f" ⚖️ 经过多赛道特征精算，两队胜率完全持平 ⚖️")

    print(f"\n 📈 各队获胜概率精算结果:")
    print(f"    👉 {team_a}: {prob_a_wins:.2%}")
    print(f"    👉 {team_b}: {prob_b_wins:.2%}")
    print("=" * 65 + "\n")

    # =========================================================================
    # 7. 动态生成战力对比柱状图
    # =========================================================================
    try:
        plot_data = pd.DataFrame({
            '战队': [team_a, team_b],
            '独赢期望概率 (%)': [prob_a_wins * 100, prob_b_wins * 100],
            '加权胜率 (%)': [feat_a['weighted_win_rate'] * 100, feat_b['weighted_win_rate'] * 100]
        })

        fig, axes = plt.subplots(1, 2, figsize=(12, 5))

        # 图1: 胜率预测概率柱状图
        sns.barplot(x='战队', y='独赢期望概率 (%)', data=plot_data, palette=['#1f77b4', '#ff7f0e'], ax=axes[0])
        axes[0].set_title('🏆 机器学习模型 - 胜负独赢概率预测', fontsize=12, fontweight='bold')
        axes[0].set_ylim(0, 100)
        for p in axes[0].patches:
            axes[0].annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2., p.get_height() - 8),
                             ha='center', va='center', color='white', fontweight='bold', xytext=(0, 0),
                             textcoords='offset points')

        # 图2: 基础加权胜率特征对比
        sns.barplot(x='战队', y='加权胜率 (%)', data=plot_data, palette=['#2ca02c', '#d62728'], ax=axes[1])
        axes[1].set_title('📊 特征层 - 各战队多赛事加权胜率对比', fontsize=12, fontweight='bold')
        axes[1].set_ylim(0, 100)
        for p in axes[1].patches:
            axes[1].annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2., p.get_height() - 8),
                             ha='center', va='center', color='white', fontweight='bold', xytext=(0, 0),
                             textcoords='offset points')

        plt.tight_layout()
        plt.show()
    except Exception as e:
        print(f"💡 [提示] 可视化图表渲染略过 (可在本地独立环境查看): {e}")


# =========================================================================
# 8. 生产入口测试运行
# =========================================================================
if __name__ == "__main__":
    # 执行单场对局胜负推演（示例：Fnatic 对阵 G2 Esports）
    # 在本地环境下，确保 csv 数据集放入同级目录，脚本会自动加载真实数据进行训练
    predict_match(team_a="Fnatic", team_b="G2 Esports")
```

