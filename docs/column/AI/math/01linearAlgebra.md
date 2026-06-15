---
title: 数学基础-1-线性代数
slug: AI工程师技术架构
date: 2026年04月22日
---

练习题[https://math.fudan.edu.cn/gdsx/34357/list.htm]

# 简介

线性代数是数学的一个分支.线性代数这门学科所做的一件非常了不得的事情是将矩阵（一张表格）看作一个数（符号），对其进行运算，从而可以得出诸多深刻的结果.例如一个方阵的行列式非零，则这个方阵是可逆（或非奇异，或满秩，或非退化）的，反之不可逆（或奇异，或非满秩，或退化）.

矩阵是线性代数的核心，也是强有力的工具.此外，线性代数中几乎所有的定义都可以转化成矩阵的语言.因此，矩阵的重要性不言而喻.对于线性代数的学习，在了解矩阵的多种运算（如加法、乘法）后，可以得到矩阵运算的性质及其关系.接下来，需要深入矩阵的内部，研究其结构——向量组线性相关与线性无关，以及极大线性无关组的求解.

而在矩阵的应用上：一是解线性方程组，即讨论线性方程组解的存在性和结构性问题；二是讨论二次型的标准化和分类的问题.

线性代数并不是孤立存在的，它同微积分学及常微分方程等课程也是密切相关的.微积分学到了多元函数，再如解二阶线性常微分方程需要用到矩阵、行列式、向量、向量的运算、向量的线性相关性、解线性方程组和矩阵的正定性等知识.下面给出各章节的知识点总结.

# 知识点总结

## 第一章 行列式

| 项目 | 内容 | 说明 |
| :--- | :--- | :--- |
| **二元线性方程组：** | $\begin{cases} a_{11}x + a_{12}y = b_1 \\ a_{21}x + a_{22}y = b_2 \end{cases}$<br><br>$D = \begin{vmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{vmatrix}, D_1 = \begin{vmatrix} b_1 & a_{12} \\ b_2 & a_{22} \end{vmatrix}, D_2 = \begin{vmatrix} a_{11} & b_1 \\ a_{21} & b_2 \end{vmatrix}$ | $x = \frac{D_1}{D}, \ y = \frac{D_2}{D}$ |
| **排列的逆序数：** | $t = \sum_{i=1}^{n} t_i$ ($t_i$ 为排列 $p_1 p_2 \cdots p_n$ 中大于 $p_i$ <br />且排于 $p_i$ 前的元素个数) | $t$ 为奇数奇排列，$t$ 为偶数偶排列，$t=0$ 标准排列。 |
| **$n$ 阶行列式：** | $D = \det(a_{ij}) = \begin{vmatrix} a_{11} & a_{12} & \cdots & a_{1n} \\ a_{21} & a_{22} & \cdots & a_{2n} \\ \vdots & \vdots & & \vdots \\ a_{n1} & a_{n2} & \cdots & a_{nn} \end{vmatrix}$ $= \sum (-1)^t a_{1p_1} a_{2p_2} \cdots a_{np_n}$ | $t$ 为列标排列的逆序数。 |
| **定理 1：** | 排列中任意两个元素对换，排列改变奇偶性。 | **推论：** 奇（偶）排列变为标准排列的对换次数为奇（偶）数。 |
| **定理 2：** | $n$ 阶行列式可定义为 $D = \sum (-1)^t a_{1p_1} a_{2p_2} \cdots a_{np_n} = \sum (-1)^t a_{p_1 1} a_{p_2 2} \cdots a_{p_n n}$ | |
| **行列式的性质：** | 1. $D = D^T$，$D^T$ 为 $D$ 转置行列式。（沿副对角线翻转，行列式同样不变） | |
| | 2. 互换行列式的两行（列），行列式变号。<br>记作：$r_i \leftrightarrow r_j \ (c_i \leftrightarrow c_j) \Rightarrow D \rightarrow -D$ | **推论：** 两行（列）完全相同的行列式等于零。<br>记作：$r_i = r_j \ (c_i = c_j) \Rightarrow D = -D = 0$ |
| | 3. 行列式乘以 $k$ 等于某行（列）所有元素都乘以 $k$。<br>记作：$kD = r_i \times k \ (kD = c_i \times k)$ | **推论：** 某一行（列）所有元素公因子可提到行列式的外面。<br>记作：$kD = r_i \div k \ (kD = c_i \div k)$ |
| | 4. 两行（列）元素成比例的行列式为零。记作：$r_j = r_i \times k \ (c_j = c_i \times k) \Rightarrow D = 0$ | |
| | 5. $D = \begin{vmatrix} a_{11} & \cdots & (a_{1i} + a_{1i}') & \cdots & a_{1n} \\ \vdots & & \vdots & & \vdots \\ a_{n1} & \cdots & (a_{ni} + a_{ni}') & \cdots & a_{nn} \end{vmatrix} \Rightarrow$ <br /><br /> $D = \begin{vmatrix} a_{11} & \cdots & a_{1i} & \cdots & a_{1n} \\ \vdots & & \vdots & & \vdots \\ a_{n1} & \cdots & a_{ni} & \cdots & a_{nn} \end{vmatrix}$<br /><br /> $+ \begin{vmatrix} a_{11} & \cdots & a_{1i}' & \cdots & a_{1n} \\ \vdots & & \vdots & & \vdots \\ a_{n1} & \cdots & a_{ni}' & \cdots & a_{nn} \end{vmatrix}$ | |
| | 6. 把行列式的某一行（列）的各元素乘以同一数然后加到另一行（列）对应的元素上去，行列式不变。<br>记作：$c_i \rightarrow c_i + kc_j \ (r_i \rightarrow r_i + kr_j)$，$D$ 不变。 | |

---

### 常用特殊行列式

| 对角行列式 | 上（下）三角形行列式 |
| :--- | :--- |
| $\begin{vmatrix} \lambda_1 & & & 0 \\ & \lambda_2 & & \\ & & \ddots & \\ 0 & & & \lambda_n \end{vmatrix} = \lambda_1 \lambda_2 \cdots \lambda_n$ | $D = \begin{vmatrix} a_{11} & & & 0 \\ a_{21} & a_{22} & & \\ \vdots & \vdots & \ddots & \\ a_{n1} & a_{n2} & \cdots & a_{nn} \end{vmatrix} = a_{11} a_{22} \cdots a_{nn}$ |
| $\begin{vmatrix} 0 & & & \lambda_1 \\ & & \lambda_2 & \\ & \textstyle \cdot^{\cdot^{\cdot}} & & \\ \lambda_n & & & 0 \end{vmatrix} = (-1)^{\frac{n(n-1)}{2}} \lambda_1 \lambda_2 \cdots \lambda_n$ | **注：** 任何 $n$ 阶行列式总能利用行运算化为上（下）三角。 |

---

### 分块行列式与余子式

| 项目 | 内容 |
| :--- | :--- |
| **若对 $D$ 分块：** | $D = \begin{vmatrix} A & 0 \\ C & B \end{vmatrix}$，设 $D_1 = \det(A), D_2 = \det(B)$，则 $D = D_1 D_2$ |
| **$2n$ 阶行列式：** | 若 $D_{2n} = \begin{vmatrix} a & & & b \\ & \ddots & \mathinner{\mkern1mu\raise1muad{\kern7mu\hbox{.}}\mkern2mu\raise4mu\hbox{.}\mkern2mu\raise7mu\hbox{.}\mkern1mu} & \\ & \mathinner{\mkern1mu\raise1mu{\kern7mu\hbox{.}}\mkern2mu\raise4mu\hbox{.}\mkern2mu\raise7mu\hbox{.}\mkern1mu} & bc\ddots  & \\ c & & & d \end{vmatrix}$，则 $D_{2n} = (ad - bc)^n$ |
| **余子式：** | $n$ 阶行列式中把 $a_{ij}$ 所在的第 $i$ 行和第 $j$ 列去掉后，余下的 $n-1$ 阶行列式记为 $M_{ij}$。 |
| **代数余子式：** | $A_{ij} = (-1)^{i+j} M_{ij}$ |
| **引理：** | 若第 $i$ 行除 $a_{ij}$ 外均为零，则 $D = a_{ij} A_{ij}$ |
| **定理 3 (性质)：** | 行列式等于任一行（列）元素与其对应代数余子式乘积之和。 |
| | $\sum_{k=1}^n a_{ki} A_{kj} = D\delta_{ij} = \begin{cases} D, & i=j \\ 0, & i \neq j \end{cases} \quad$ 或 $\quad \sum_{k=1}^n a_{ik} A_{jk} = D\delta_{ij} = \begin{cases} D, & i=j \\ 0, & i \neq j \end{cases}$ |

---

### 范德蒙德行列式与克拉默法则

| 项目 | 内容 |
| :--- | :--- |
| **范德蒙德：** | $D_n = \begin{vmatrix} 1 & 1 & 1 & \cdots & 1 \\ x_1 & x_2 & x_3 & \cdots & x_n \\ x_1^2 & x_2^2 & x_3^2 & \cdots & x_n^2 \\ \vdots & \vdots & \vdots & & \vdots \\ x_1^{n-1} & x_2^{n-1} & x_3^{n-1} & \cdots & x_n^{n-1} \end{vmatrix} = \prod_{n \ge i > j \ge 1} (x_i - x_j)$ |
| **克拉默法则：** | 若方程组 $\begin{cases} a_{11}x_1 + \cdots + a_{1n}x_n = b_1 \\ \vdots \\ a_{n1}x_1 + \cdots + a_{nn}x_n = b_n \end{cases}$ 满足 $D \neq 0$，则方程组有唯一解：$x_j = \frac{D_j}{D}$ |
| **定理 4：** | 若 $D \neq 0$，则方程组一定有唯一解；若无解或有两个不同解，则 $D = 0$。 |
| **定理 5：** | 若齐次方程组 ($b_i=0$) 的 $D \neq 0$，则只有零解；若有非零解，则 $D = 0$。 |

## 第二章 矩阵及其运算


### 1. 特殊矩阵

| 项目 | 内容 | 说明 |
| :--- | :--- | :--- |
| **$n$ 阶单位矩阵 (单位阵)：** | $\mathbf{E} = \begin{pmatrix} 1 & 0 & \cdots & 0 \\ 0 & 1 & \cdots & 0 \\ \vdots & \vdots & & \vdots \\ 0 & 0 & \cdots & 1 \end{pmatrix}$ | $\mathbf{EA} = \mathbf{AE} = \mathbf{A}$ |
| **对角矩阵 (对角阵)：** | $\mathbf{\Lambda} = \begin{pmatrix} \lambda_1 & 0 & \cdots & 0 \\ 0 & \lambda_2 & \cdots & 0 \\ \vdots & \vdots & & \vdots \\ 0 & 0 & \cdots & \lambda_n \end{pmatrix}$ | 另可记作 $\mathbf{\Lambda} = \text{diag}(\lambda_1, \lambda_2, \cdots, \lambda_n)$ |
| **数量阵：** | $\lambda\mathbf{E} = \begin{pmatrix} \lambda & 0 & \cdots & 0 \\ 0 & \lambda & \cdots & 0 \\ \vdots & \vdots & & \vdots \\ 0 & 0 & \cdots & \lambda \end{pmatrix}$ | $(\lambda\mathbf{E})\mathbf{A} = \lambda\mathbf{A}, \ \mathbf{A}(\lambda\mathbf{E}) = \lambda\mathbf{A}$ |

---

### 2. 矩阵基本运算与转置

| 项目 | 内容 | 说明 |
| :--- | :--- | :--- |
| **矩阵与矩阵相乘：** | 若 $\mathbf{A} = (a_{ij})$ 是一个 $m \times s$ 矩阵，$\mathbf{B} = (b_{ij})$ 是一个 $s \times n$ 矩阵，且 $\mathbf{C} = \mathbf{AB}$，则 $\mathbf{C} = (c_{ij})$ 是一个 $m \times n$ 矩阵，且 $c_{ij} = a_{i1}b_{1j} + a_{i2}b_{2j} + \cdots + a_{is}b_{sj} \ (i = 1,2,\cdots,m; \ j = 1,2,\cdots,n)$ | 若 $\mathbf{AB} = \mathbf{BA}$，称 $\mathbf{A}$ 与 $\mathbf{B}$ 是**可交换的**。 |
| **矩阵转置：** | 若 $\mathbf{A} = (a_{ij})$，则 $\mathbf{A}^T = (a_{ji})$ | $(\mathbf{A} + \mathbf{B})^T = \mathbf{A}^T + \mathbf{B}^T$<br>$(\mathbf{AB})^T = \mathbf{B}^T \mathbf{A}^T$<br>若 $\mathbf{A} = \mathbf{A}^T$，则 $\mathbf{A}$ 为**对称阵**。 |

---

### 3. 方阵的行列式与伴随矩阵

| 项目 | 内容 | 说明 |
| :--- | :--- | :--- |
| **方阵的行列式：** | $n$ 阶方阵 $\mathbf{A}$ 元素构成的行列式，记作 $\|\mathbf{A}\|$或者det A ||
| **伴随矩阵：** | $\mathbf{A}^* = \begin{pmatrix} A_{11} & A_{21} & \cdots & A_{n1} \\ A_{12} & A_{22} & \cdots & A_{n2} \\ \vdots & \vdots & & \vdots \\ A_{1n} & A_{2n} & \cdots & A_{nn} \end{pmatrix}$ | $A_{ij}$ 为行列式$\mathbf{A}$中对应元素的代数余子式<br /><br />$\mathbf{A}\mathbf{A}^* =\mathbf{A}^*\mathbf{A}=\|\mathbf{A}\|E$ |
| **运算规律:** | 1.$\|\mathbf{A}^{\mathrm{T}}\| = \|\mathbf{A}\|$; <br />2. $\|\lambda \mathbf{A}\| = \lambda^n \|\mathbf{A}\|$; <br />3.$\|\mathbf{AB}\| = \|\mathbf{A}\|\|\mathbf{B}\|$ , $\|A\|\|A^{-1}\| = 1$ . |  |

---



### 4. 逆矩阵与奇异矩阵

| 项目 | 内容 |
| :--- | :--- |
| **逆矩阵定义：** | 若 $\mathbf{AB} = \mathbf{BA} = \mathbf{E}$，则 $\mathbf{A}$ 可逆，且称 $\mathbf{B}$ 为 $\mathbf{A}$ 的逆矩阵，记作 $\mathbf{B} = \mathbf{A}^{-1}$。$\mathbf{A}$ 的逆阵是唯一的。 |
| **定理 1 与定理 2：** | **定理 1：** 若矩阵 $\mathbf{A}$ 可逆，则$\mathbf{A}$ $\neq 0$。<br />**定理 2：** 若 $\mathbf{A}$ $\neq 0$。则矩阵A可逆，且 $\mathbf{A}^{-1}$ = $\frac{1}{\|\mathbf{A}\|} \mathbf{A}^{*}$ |
| **奇异矩阵：** | 当 \|$\mathbf{A}$\| = 0,$\mathbf{A}$为奇异矩阵 |
| **运算规律：** | 1. $(\mathbf{A}^{-1})^{-1} = \mathbf{A}$ <br> 2. $(\lambda\mathbf{A})^{-1} = \frac{1}{\lambda} \mathbf{A}^{-1}$ <br> 3. $(\mathbf{AB})^{-1} = \mathbf{B}^{-1}\mathbf{A}^{-1}$ <br> 4. $(\mathbf{A}^T)^{-1} = (\mathbf{A}^{-1})^T$ |


---

### 5. 矩阵的多项式与相似变换性质

| 项目 | 内容 |
| :--- | :--- |
| **矩阵 $\mathbf{A}$ 的 $m$ 次多项式：** | $\varphi(\mathbf{A}) = a_0\mathbf{E} + a_1\mathbf{A} + a_2\mathbf{A}^2 + \cdots + a_m\mathbf{A}^m$<br>$\varphi(\mathbf{A})f(\mathbf{A}) = f(\mathbf{A})\varphi(\mathbf{A})$，多项式可相乘或分解因式。 |
| **相似变换与对角化性质：** | 1. 若 $\mathbf{A} = \mathbf{P\Lambda P}^{-1}$，则 $\mathbf{A}^k = \mathbf{P\Lambda}^k \mathbf{P}^{-1}$，$\varphi(\mathbf{A}) = \mathbf{P}\varphi(\mathbf{\Lambda})\mathbf{P}^{-1}$。<br>2. $\mathbf{\Lambda} = \text{diag}(\lambda_1, \lambda_2, \cdots, \lambda_n)$ (对角阵)，则 $\mathbf{\Lambda}^k = \text{diag}(\lambda_1^k, \lambda_2^k, \cdots, \lambda_n^k)$，$\varphi(\mathbf{\Lambda}) = \text{diag}(\varphi(\lambda_1), \varphi(\lambda_2), \cdots, \varphi(\lambda_n))$。 |

---

### 6. 分块矩阵的运算规律

| 项目 | 内容 |
| :--- | :--- |
| **基本性质：** | 加减相乘与矩阵相同。 |
| **转置：** | 若 $\mathbf{A} = \begin{pmatrix} \mathbf{A}_{11} & \cdots & \mathbf{A}_{1r} \\ \vdots & & \vdots \\ \mathbf{A}_{s1} & \cdots & \mathbf{A}_{sr} \end{pmatrix}$，则 <br /><br />$\mathbf{A}^T = \begin{pmatrix} \mathbf{A}_{11}^T & \cdots & \mathbf{A}_{s1}^T \\ \vdots & & \vdots \\ \mathbf{A}_{1r}^T & \cdots & \mathbf{A}_{sr}^T \end{pmatrix}$ |
| **分块对角矩阵：**<br>(其中 $\mathbf{A}$ 以及 $\mathbf{A}_i$ 均为方阵) | $\mathbf{A} = \begin{pmatrix} \mathbf{A}_1 & & & \mathbf{0} \\ & \mathbf{A}_2 & & \\ & & \ddots & \\ \mathbf{0} & & & \mathbf{A}_s \end{pmatrix},$ 若 \|$\mathbf{A}$\| $\neq 0,$ 则  $\mathbf{A}^{-1}$ = $\mathbf{A} = \begin{pmatrix} \mathbf{A}_1^{-1} & & & \mathbf{0} \\ & \mathbf{A}_2^{-1} & & \\ & & \ddots & \\ \mathbf{0} & & & \mathbf{A}_s^{-1} \end{pmatrix},$<br /><br />**性质：** $\|\mathbf{A}\| = \|\mathbf{A}_1\| \|\mathbf{A}_2\|\cdots \|\mathbf{A}_s\|$,且$\|\mathbf{A}_i\|$ $\neq 0,$ (i = 1,2,...,s)，则 $\|\mathbf{A}\|$ $\neq 0,$ |

---

### 7. 行向量与列向量的矩阵表示

* **行向量：**
  $$\mathbf{A}_{m \times n} = \begin{pmatrix} \mathbf{\alpha}_1^T \\ \mathbf{\alpha}_2^T \\ \vdots \\ \mathbf{\alpha}_m^T \end{pmatrix}, \quad \mathbf{\alpha}_i^T = (a_{i1}, a_{i2}, \cdots, a_{in})$$

* **列向量：**
  $$\mathbf{A} = (\mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_n), \quad \mathbf{a}_j = \begin{pmatrix} a_{1j} \\ a_{2j} \\ \vdots \\ a_{mj} \end{pmatrix}$$

* **左乘与右乘对角阵：**
  $$\mathbf{\Lambda}_m \mathbf{A}_{m \times n} = \begin{pmatrix} \lambda_1 \mathbf{\alpha}_1^T \\ \lambda_2 \mathbf{\alpha}_2^T \\ \vdots \\ \lambda_m \mathbf{\alpha}_m^T \end{pmatrix}, \quad \mathbf{A}\mathbf{\Lambda}_n = (\lambda_1 \mathbf{a}_1, \lambda_2 \mathbf{a}_2, \cdots, \lambda_n \mathbf{a}_n)$$

* **特殊性质：**
  若 $\mathbf{A}^T\mathbf{A} = \mathbf{0}$，则 $\mathbf{A} = \mathbf{0}$。

## 第三章 向量组的线性相关性


**注：** 列向量用黑体小写字母 $\mathbf{a}$、$\mathbf{b}$、$\mathbf{\alpha}$、$\mathbf{\beta}$ 等表示，行向量则用 $\mathbf{a}^T$、$\mathbf{b}^T$、$\mathbf{\alpha}^T$、$\mathbf{\beta}^T$ 等表示，若无指明均当列向量。

| 项目 | 内容 | 说明/推论 |
| :--- | :--- | :--- |
| **定义：** | 1. 向量 $\mathbf{b}$ 能由向量组 $\mathbf{A}$ **线性表示**：$\mathbf{b} = \lambda_1 \mathbf{a}_1 + \lambda_2 \mathbf{a}_2 + \cdots + \lambda_m \mathbf{a}_m$ ($\lambda_i$ 为实数) 或可记为 $\mathbf{b} = \mathbf{Ax}$ ($\mathbf{x}$ 为一列向量)。 | |
| | 2. **$n$ 维向量(组)：** 向量(组中每个向量)由 $n$ 个数组成。 | **向量组等价：** 两向量组能相互线性表示。 |
| | 3. **向量组 $\mathbf{A}$ 线性相关：** $k_1 \mathbf{a}_1 + k_2 \mathbf{a}_2 + \cdots + k_m \mathbf{a}_m = \mathbf{0}$ ($k_i$ 不全为 $0$)，反之线性无关。 | |
| | 4. **向量组的秩：** 从向量组 $\mathbf{A}$ 中可选出 $r$ 个向量线性无关，且任意 $r+1$ 个向量都线性相关，$r$ 为秩，记 $R_{\mathbf{A}}$。 | |
| **性质：** | 矩阵 $\mathbf{A}$ 与 $\mathbf{B}$ 行等价 $\Rightarrow \mathbf{A}$ 的行向量组与 $\mathbf{B}$ 的行向量组等价；列等价 $\Rightarrow$ 列向量组等价。 | |
| **定理 1：** | 向量 $\mathbf{b}$ 能由向量组 $\mathbf{A}: \mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_m$ 线性表示的充要条件是 $R(\mathbf{A}) = R(\mathbf{A}, \mathbf{b})$。 | |
| **定理 2：** | 向量组 $\mathbf{B}: \mathbf{b}_1, \mathbf{b}_2, \cdots, \mathbf{b}_l$ 能由向量组 $\mathbf{A}: \mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_m$ 线性表示的充要条件是 $R(\mathbf{A}) = R(\mathbf{A}, \mathbf{B})$。 | |
| **推论：** | 向量组 $\mathbf{A}: \mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_m$ 与向量组 $\mathbf{B}: \mathbf{b}_1, \mathbf{b}_2, \cdots, \mathbf{b}_l$ 等价的充要条件是 $R(\mathbf{A}) = R(\mathbf{B}) = R(\mathbf{A}, \mathbf{B})$。 | |
| **定理 3：** | 若向量组 $\mathbf{B}: \mathbf{b}_1, \mathbf{b}_2, \cdots, \mathbf{b}_l$ 能由向量组 $\mathbf{A}: \mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_m$ 线性表示，则 $R(\mathbf{B}) \le R(\mathbf{A})$。 | |
| **逆阵推广：** | $n$ 维单位坐标向量组 $\mathbf{E}: \mathbf{e}_1, \mathbf{e}_2, \cdots, \mathbf{e}_n$ 能由 $n$ 维向量组 $\mathbf{A}: \mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_m$ 线性表示的充要条件是 $R(\mathbf{A}) = n$。 | |
| **定理 4：** | 向量组 $\mathbf{A}: \mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_m$ 线性相关的充要条件是 $R(\mathbf{A}) < m$；线性无关充要条件是 $R(\mathbf{A}) = m$。 | |
| **定理 5：** | (1) 设向量组 $\mathbf{A}: \mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_m$ 与向量组 $\mathbf{B}: \mathbf{a}_1, \cdots, \mathbf{a}_m, \mathbf{a}_{m+1}$，若 $\mathbf{A}$ 线性相关，则 $\mathbf{B}$ 线性相关；反之，若 $\mathbf{B}$ 线性无关，则 $\mathbf{A}$ 线性无关。<br>(2) $(n+m)$ 个 $n$ 维向量组成的向量组在 $m > 0$ 时一定线性相关。<br>(3) 设向量组 $\mathbf{A}: \mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_m$ 线性无关，而向量组 $\mathbf{B}: \mathbf{a}_1, \cdots, \mathbf{a}_m, \mathbf{b}$ 线性相关，则向量 $\mathbf{b}$ 必能由向量组 $\mathbf{A}$ 线性表示，且表示式是唯一的。 | |
| **定理 6：** | 矩阵的秩等于它的列向量组的秩，也等于它的行向量组的秩。 | |
| **推论：** | 由向量组 $\mathbf{A}$ 中部分向量组成向量组 $\mathbf{A}_0$，若满足 $\mathbf{A}_0$ 线性无关且 $\mathbf{A}$ 中任一向量都能由 $\mathbf{A}_0$ 线性表示，则向量组 $\mathbf{A}_0$ 便是向量组 $\mathbf{A}$ 的一个**最大无关组**。 | |
| **定理 7：** | 设 $m \times n$ 矩阵 $\mathbf{A}$ 的秩 $R(\mathbf{A}) = r$，则 $n$ 元齐次线性方程组 $\mathbf{Ax} = \mathbf{0}$ 的解集 $S$ 的秩 $R_S = n - r$。 | |
| **解的结构：** | 方程 $\mathbf{Ax} = \mathbf{0}$ 通解：$\mathbf{x} = k_1\mathbf{\xi}_1 + k_2\mathbf{\xi}_2 + \cdots + k_t\mathbf{\xi}_t$；<br>方程 $\mathbf{Ax} = \mathbf{b}$ 通解：$\mathbf{x} = k_1\mathbf{\xi}_1 + k_2\mathbf{\xi}_2 + \cdots + k_t\mathbf{\xi}_t + \mathbf{\eta}^*$。 | $\mathbf{\xi}_i$ 基础解系，$t = n - r$。 |
| **向量空间：** | 1. 非空，封闭（加法、数乘运算均在集合内进行）的 $n$ 维向量的集合称**向量空间**。 | |
| | 2. 由**线性无关**向量组 $\mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_r$ (基) 所生成的 $r$ 维 (维数) 向量空间为：$V = \{\mathbf{x} = \lambda_1\mathbf{a}_1 + \lambda_2\mathbf{a}_2 + \cdots + \lambda_r\mathbf{a}_r \mid \lambda_1, \lambda_2, \cdots, \lambda_r \in \mathbb{R}\}$，$\lambda_i$ 称为 $\mathbf{x}$ 在基 $\mathbf{a}_1, \mathbf{a}_2, \cdots, \mathbf{a}_r$ 中的坐标，若基取单位坐标向量组，则该基称**自然基**。 | |
| | 3. 空间向量 $V$ 的基就是向量组的最大无关组，$V$ 的维数就是向量组的秩。 | |
| **变换公式：** | 基变换公式：$\mathbf{B} = \mathbf{AP}$；坐标变换公式：$\mathbf{x}_B = \mathbf{P}^{-1}\mathbf{x}_A$。 | $\mathbf{P} = \mathbf{A}^{-1}\mathbf{B}$, $\mathbf{P}^{-1} = \mathbf{B}^{-1}\mathbf{A}$，其中 $\mathbf{A}$ 为旧基矩阵，$\mathbf{B}$ 为新基矩阵，$\mathbf{x}_A$ 为旧基中的坐标列向量，$\mathbf{x}_B$ 为新基中的坐标列向量。$\mathbf{P} = \mathbf{A}^{-1}\mathbf{B}$ 称为**过渡矩阵**。 |


## 第四章 矩阵的初等变换与线性方程式



### 1. 矩阵的初等变换与等价
| 项目 | 内容描述 |
| :--- | :--- |
| **矩阵的初等变换** | 初等行(列)变换：1. $r_i \leftrightarrow r_j (c_i \leftrightarrow c_j)$；2. $r_i \times k (c_i \times k) (k \neq 0)$；3. $r_i + kr_j (c_i + kc_j)$。 |
| **矩阵间等价** | 行等价：$A \xrightarrow{r} B$；列等价：$A \xrightarrow{c} B$；等价：$A \sim B$（矩阵 $A$ 经有限次初等变换变成矩阵 $B$）。 |
| **行阶梯型矩阵** | 阶梯线下为零，一行一台阶，竖线后非零元。 |
| **行最简形矩阵** | 竖线后非零元为 1，同列其它元为 0。 |
| **标准型** | $F = \begin{pmatrix} E_r & 0 \\ 0 & 0 \end{pmatrix}_{m \times n}$ 或 $F = E_r$。矩阵 $A_{m \times n}$ 经初等变换总能化为标准型 $F$。 |
| **等价类** | 所有等价矩阵组成的集合，标准型为其中形状最简单矩阵。 |

---

### 2. 初等矩阵与定理
*   **初等矩阵定义**：单位矩阵 $E$ 经一次初等变换所得矩阵 $E(f)$（$f$ 为变换规则）。
    1. $E(i, j): r_i \leftrightarrow r_j (c_i \leftrightarrow c_j)$
    2. $E(i(k)): r_i \times k (c_i \times k) (k \neq 0)$
    3. $E(ij(k)): r_i + kr_j (kc_i + c_j)$
*   **定理 1**：矩阵 $A$ 初等行变换，初等矩阵左乘 $E(f)A$；初等列变换，初等矩阵右乘 $AE(f)$。
*   **定理 2**：方阵 $A$ 可逆的充要条件：存在有限个初等矩阵 $E_1(f), E_2(f), \dots, E_k(f)$，使 $A = E_1(f)E_2(f)\dots E_k(f)$。
    *   **推论 1**：方阵 $A$ 可逆 $\iff A \xrightarrow{r} E$。
    *   **推论 2**：$A \sim B \iff$ 存在可逆矩阵 $P$ 与 $Q$，使 $PAQ = B$。
*   **应用推论**：
    *   方阵 $A$ 可逆，则 $(A, E) \xrightarrow{r} (E, A^{-1})$。
    *   $(A, B) \xrightarrow{r} (E, A^{-1}B)$，$Ax=b, x=A^{-1}b \Rightarrow (A, b) \xrightarrow{r} (E, x)$。
*   **重要性质**：
    *   $Y = CA^{-1} \Rightarrow \begin{pmatrix} A \\ C \end{pmatrix} \xrightarrow{r} \begin{pmatrix} E \\ CA^{-1} \end{pmatrix}$ 或 $Y^T = (CA^{-1})^T = (A^T)^{-1}C^T \Rightarrow (A^T, C^T) \xrightarrow{r} (E, (A^T)^{-1}C^T)$。

---

### 3. 矩阵的秩 (Rank)
*   **定义**：
    *   标准型 $F$ 中非零行的行数 $r$，记 $R(A)$。
    *   $r+1$ 阶子式全等于零，$r$ 阶非零子式称 $A$ 的最高阶非零子式。
    *   取 $A$ 中 $k$ 行与 $k$ 列交叉处的 $k^2$ 个元素且不改变对应位置组成的 $k$ 阶行列式称为 **$k$ 阶子式**。
    *   零矩阵的秩为 0；满秩矩阵（可逆矩阵），降秩矩阵（不可逆即奇异矩阵）。
*   **矩阵秩的性质**：
    1. $0 \leq R(A_{m \times n}) \leq \min\{m, n\}$
    2. $R(A^T) = R(A)$
    3. 若 $A \sim B$，则 $R(A) = R(B)$
    4. 若 $P, Q$ 可逆，则 $R(PAQ) = R(A)$
    5. $\max\{R(A), R(B)\} \leq R(A, B) \leq R(A) + R(B)$，特例：当 $B=b$ 为列向量时，$R(A) \leq R(A, b) \leq R(A) + 1$
    6. $R(A+B) \leq R(A) + R(B)$
    7. $R(AB) \leq \min\{R(A), R(B)\}$
    8. 若 $A_{m \times n} B_{n \times l} = 0$，则 $R(A) + R(B) \leq n$

---

### 4. 线性方程组解的判定
*   **定理 4 ($n$ 元线性方程组 $Ax = b$)**：
    1. **无解**的充要条件是 $R(A) < R(A, b)$；
    2. **有唯一解**的充要条件是 $R(A) = R(A, b) = n$；
    3. **有无限多解**的充要条件是 $R(A) = R(A, b) < n$。
*   **定理 5**：线性方程组 $Ax = b$ 有解的充要条件是 $R(A) = R(A, b)$。
*   **定理 6**：$n$ 元齐次线性方程组 $Ax = 0$ 有非零解的充要条件是 $R(A) < n$。
*   **定理 7**：矩阵方程 $AX = B$ 有解的充要条件是 $R(A) = R(A, B)$。
*   **定理 8**：设 $AB = C$，则 $R(C) \leq \min\{R(A), R(B)\}$。
*   **定理 9**：矩阵方程 $A_{m \times n} X_{n \times l} = 0$ 只有零解的充要条件是 $R(A) = n$。

## 第五章 相似矩阵及二次型


### 1. 内积与向量性质
| 项目 | 内容 |
| :--- | :--- |
| **内积性质** | 1. $[x, y] = [y, x]$; 2. $[\lambda x, y] = \lambda [x, y]$; 3. $[x+y, z] = [x, z] + [y, z]$; 4. 当 $x=0$ 时，$[x, x]=0$；当 $x \neq 0$ 时，$[x, x] > 0$。 |
| **施瓦茨不等式** | $[x, y]^2 \leq [x, x][y, y]$ |
| **向量长度** | $n$ 维向量 $x$ 的长度（范数）：$\|x\| = \sqrt{[x, x]} = \sqrt{x_1^2 + x_2^2 + \dots + x_n^2}$ |
| **长度性质** | 1. 非负性：当 $x \neq 0$ 时，$\|x\| > 0$；当 $x = 0$ 时，$\|x\| = 0$；2. 齐次性：$\|\lambda x\| = |\lambda| \|x\|$；3. 三角不等式：$\|x+y\| \leq \|x\| + \|y\|$ |
| **向量夹角** | $\theta = \arccos \frac{[x, y]}{\|x\| \|y\|}$ ($x \neq 0, y \neq 0$)；当 $[x, y] = 0$ 时，称向量 $x$ 与 $y$ **正交**；若 $x=0$，则 $x$ 与任何向量都正交。 |

---

### 2. 正交化与正交矩阵
*   **定理 1**：若 $n$ 维向量 $a_1, a_2, \dots, a_r$ 是一组两两正交的非零向量，则 $a_1, a_2, \dots, a_r$ 线性无关。
*   **定义**：**规范正交基**：基中向量两两正交且都是单位向量；规范正交基中坐标计算公式：$\lambda_i = e_i^T a = [a, e_i]$。
*   **施密特正交化**：
    1. $b_1 = a_1$; $b_2 = a_2 - \frac{[b_1, a_2]}{[b_1, b_1]} b_1$; $\dots$ $b_r = a_r - \sum_{i=1}^{r-1} \frac{[b_i, a_r]}{[b_i, b_i]} b_i$
    2. **单位化**：$e_1 = \frac{1}{\|b_1\|} b_1, e_2 = \frac{1}{\|b_2\|} b_2, \dots, e_r = \frac{1}{\|b_r\|} b_r$
*   **正交矩阵**：$n$ 阶矩阵 $A$ 满足 $A^T A = E$（即 $A^{-1} = A^T$）。
    *   **充要条件**：$A$ 的列（行）向量均是单位向量，且两两正交。
    *   **性质**：1. 若 $A$ 为正交阵，则 $A^{-1}=A^T$ 也为正交阵，且 $|A|=1$ 或 $-1$；2. 若 $A$ 和 $B$ 均为正交阵，则 $AB$ 也是正交阵。
*   **正交变换**：$y = Px$ ($P$ 为正交阵)，且 $\|y\| = \|x\|$。

---

### 3. 特征值与特征向量
*   **定义**：若 $Ax = \lambda x$ 成立，$\lambda$ 称为方阵 $A$ 的**特征值**，非零向量 $x$ 称为 $A$ 的对应于 $\lambda$ 的**特征向量**。
    *   **特征方程**：$|A - \lambda E| = 0$
    *   **特征多项式**：$f(\lambda) = |A - \lambda E|$ 是 $\lambda$ 的 $n$ 次多项式。
*   **特征性质**：
    1. $\sum \lambda_i = \sum a_{ii} = \text{tr}(A)$；$\prod \lambda_i = |A|$。
    2. 若 $p_i$ 是 $A$ 对应 $\lambda_i$ 的特征向量，则 $kp_i$ ($k \neq 0$) 也是。
    3. 若 $\lambda$ 是 $A$ 的特征值，则 $\lambda^k$ 是 $A^k$ 的特征值；$1/\lambda$ 是 $A^{-1}$ 的特征值；$\varphi(\lambda)$ 是 $\varphi(A)$ 的特征值。
*   **定理 2**：设 $\lambda_1, \lambda_2, \dots, \lambda_m$ 是 $A$ 的特征值，$p_1, p_2, \dots, p_m$ 是对应特征向量，若 $\lambda_i$ 各不相同，则 $p_i$ 线性无关。

---

### 4. 相似矩阵与对称阵对角化
*   **定义**：若 $P^{-1}AP = B$，则称 $B$ 是 $A$ 的**相似矩阵**。
*   **定理 3**：若 $A$ 与 $B$ 相似，则其特征多项式相同，特征值亦相同。
*   **定理 4（对角化充要条件）**：$n$ 阶矩阵 $A$ 相似于对角阵 $\Lambda$ $\iff$ $A$ 有 $n$ 个线性无关的特征向量。
    *   **推论**：若 $n$ 阶矩阵 $A$ 的 $n$ 个特征值互不相等，则 $A$ 可对角化。
*   **定理 5**：实对称阵的特征值为实数。
*   **定理 6**：设 $\lambda_1, \lambda_2$ 是对称阵 $A$ 的两个特征值，$p_1, p_2$ 是对应特征向量。若 $\lambda_1 \neq \lambda_2$，则 $p_1$ 与 $p_2$ 正交。
*   **定理 7**：设 $A$ 为 $n$ 阶对称阵，则必有正交阵 $P$，使 $P^{-1}AP = P^T AP = \Lambda$。
*   **实对称阵对角化步骤**：
    1. 求出 $A$ 的全部特征值 $\lambda_i$ 及其重数 $k_i$。
    2. 对每个 $k_i$ 重特征值，求 $(A - \lambda E)x = 0$ 的基础解系，并正交化、单位化。
    3. 将得到的 $n$ 个正交单位向量构成正交阵 $P$。

---

### 5. 二次型
#### 二次型的表示
1. **基本函数式**：$f(x_1, \dots, x_n) = \sum_{i=1}^n a_{ii}x_i^2 + \sum_{i < j} 2a_{ij}x_ix_j$
2. **矩阵表达式**：$f = x^T Ax$，其中 $A$ 为对称阵。
3. **标准形**：$f = \lambda_1 y_1^2 + \lambda_2 y_2^2 + \dots + \lambda_n y_n^2$
4. **规范形**：$f = z_1^2 + \dots + z_p^2 - z_{p+1}^2 - \dots - z_r^2$（系数仅为 $1, -1, 0$）

#### 重要定理与变换
*   **合同**：若存在可逆阵 $C$ 使 $B = C^T AC$，则称 $A$ 与 $B$ 合同。
*   **定理 8**：二次型总有正交变换 $x = Cy$ 化为标准形，其系数为 $A$ 的特征值。
*   **定理 9（惯性定理）**：二次型化为标准形后，正系数的个数 $p$（正惯性指数）和负系数的个数 $q$（负惯性指数）是唯一的。
*   **有理化/配方法**：
    1. 有平方项 $x_i^2$：直接配方。
    2. 无平方项：先通过 $x_i = y_i + y_j, x_j = y_i - y_j$ 创造平方项。

---

### 6. 有理判定（霍尔维茨定理）
*   **正定二次型**：对任意 $x \neq 0$，恒有 $f(x) > 0$。
*   **定理 10**：$f = x^T Ax$ 正定的充要条件是其标准形的 $n$ 个系数全为正（正惯性指数 $p=n$），或 $A$ 的特征值全为正。
*   **定理 11（赫尔维茨判定法）**：
    *   **正定**：$A$ 的各阶顺序主子式都为正：$a_{11} > 0, \begin{vmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{vmatrix} > 0, \dots, |A| > 0$。
    *   **负定**：$A$ 的顺序主子式满足 $(-1)^r D_r > 0$，即奇数阶为负，偶数阶为正。

---

### 7. 补充
*   二元正定二次型 $f(x, y) = c$ ($c>0$) 的图形是以原点为中心的**椭圆**。
*   三元正定二次型 $f(x, y, z) = c$ ($c>0$) 的图形是一族**椭球**。

