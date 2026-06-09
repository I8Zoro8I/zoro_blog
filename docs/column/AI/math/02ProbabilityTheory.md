---
title: 数学基础-1-概率论与数理统计
slug: AI工程师技术架构
date: 2026年04月24日
---

# 概率论与数理统计知识整理

> [!NOTE]
>
> 如果有乱码,那么上下一个是他的另外一种写法(兼容多种公式)
> 都乱码请反馈
> 或者直接复制粘贴到typora等软件进行查看




## 一、概率论的基本概念

### 1. 加法公式
* $$
  P(A_1 \cup A_2) = P(A_1) + P(A_2) - P(A_1 A_2)
  $$

* $$
  P(A_1 \cup A_2 \cup A_3) = P(A_1) + P(A_2) + P(A_3) - P(A_1 A_2) - P(A_1 A_3) - P(A_2 A_3) + P(A_1 A_2 A_3)
  $$

* $$
  P\left(\bigcup_{i=1}^{n} A_i\right) = \sum_{i=1}^{n} P(A_i) - \sum_{1 \le i < j \le n} P(A_i A_j) + \sum_{1 \le i < j < k \le n} P(A_i A_j A_k) + \dots + (-1)^{n-1} P(A_1 A_2 \dots A_n)
  $$

### 2.条件概率

- $$
  P(B|A) = \frac{P(AB)}{P(A)}
  $$

- $$
  P(AB) = P(B)P(A|B) = P(A)P(B|A)
  $$

- $$
  P(A_1 A_2 ··· A_n) = P(A_1)P(A_2|A_1)P(A_3|A_1 A_2) ··· P(A_n|A_1 A_2 ··· A_{n-1})
  $$

### 3.全概率公式

- $$
  P(A) = P(AB) + P(A\bar{B}) = P(B)P(A|B) + P(\bar{B})P(A|\bar{B})
  $$

- $$
  P(A) = \sum_{j=1}^{n} P(B_j)P(A|B_j)
  $$

#### 4.贝叶斯公式

- $$
  P(B|A) = \frac{P(B)P(A|B)}{P(B)P(A|B) + P(\bar{B})P(A|\bar{B})}
  $$

- $$
  P(B_i|A) = \frac{P(AB_i)}{P(A)} = \frac{P(B_i)P(A|B_i)}{\sum_{j=1}^{n} P(B_j)P(A|B_j)}
  $$

### 5.事件运算

- $$
  A(B \cup C) = AB \cup AC
  $$

- $$
   A \cup BC = (A \cup B)(A \cup C)
  $$

- $$
  \overline{A \cup B} = \bar{A} \cap \bar{B}
  $$

- $$
  \overline{A \cap B} = \bar{A} \cup \bar{B}
  $$

- $$
  A - B = A\bar{B}
  $$

## 二.随机变量及其概率分布

### 1.概率密度

- $$
  F(x) = \int_{-\infty}^{x} f(t) \, dt
  $$

- $$
  \int_{-\infty}^{+\infty} f(x) \, dx = 1
  $$

- $$
  对数集 A：P(x \in A) = \int_{A} f(x) \, d
  $$

## 2. 常见分布及期望与方差

### 1. 离散随机变量

#### 0-1 分布

$$
X \sim 0-1(p)
$$

$$
P(X = k) = p^k(1-p)^{1-k} \quad (k=0,1)
$$

$$
E(X) = p, \quad D(X) = p(1-p)
$$

#### 二项分布
$$
X \sim B(n,p)
$$

$$
P(X = k) = C_n^k \cdot p^k \cdot (1-p)^{n-k}
$$

$$
E(X) = np, \quad D(X) = np(1-p)
$$

#### 泊松分布

$$
X \sim P(\lambda)
$$






$$
P(X = k) = \frac{\lambda^k e^{-\lambda}}{k!} \quad (k=0,1,2,···)
$$

$$
E(X) = \lambda, \quad D(X) = \lambda
$$

#### 超几何分布
$$
X \sim H(N,M,n)
$$

$$
P(X = k) = \frac{C_M^k C_{N-M}^{n-k}}{C_N^n}
$$

$$
E(X) = n\frac{M}{N}, \quad D(X) = n\frac{M(N-M)(N-n)}{N^2(N-1)}
$$

#### 几何分布
$$
X \sim G(p)
$$

$$
P(X = k) = (1-p)^{k-1}p
$$

$$
E(X) = \frac{1}{p}, \quad D(X) = \frac{1-p}{p^2}
$$

---

### 2. 连续随机变量

#### 正态分布
$$
X \sim N(\mu, \sigma^2)
$$

$$
f(x) = \frac{1}{\sqrt{2\pi}\sigma} e^{-\frac{(x-\mu)^2}{2\sigma^2}}
$$

$$
E(X) = \mu, \quad D(X) = \sigma^2
$$

化为标准正态分布：
$$
Y = \frac{X-\mu}{\sigma} \sim N(0,1)
$$

#### 指数分布
$$
X \sim E(\lambda)
$$

$$
f(x) = \lambda e^{-\lambda x} \quad (x \ge 0)
$$

$$
F(x) = 1 - e^{-\lambda x} \quad (x \ge 0)
$$

$$
E(X) = \frac{1}{\lambda}, \quad D(X) = \frac{1}{\lambda^2}
$$

#### 威布尔分布
$$
X \sim W(X)
$$

$$
f(x) = \lambda \alpha x^{\alpha-1} e^{-\lambda x^\alpha} \quad (x > 0)
$$

$$
F(x) = 1 - e^{-\lambda x^\alpha} \quad (x > 0)
$$

#### 均匀分布
$$
X \sim U(a,b)
$$

$$
f(x) = \frac{1}{b-a} \quad (a \le x < b)
$$

$$
F(x) = \begin{cases} 
0, & x \le a \\ 
\frac{x-a}{b-a}, & a < x < b \\ 
1, & x \ge b 
\end{cases}
$$
$$
E(X) = \frac{a+b}{2}, \quad D(X) = \frac{(b-a)^2}{12}
$$

#### 伽马分布
$$
\Gamma(\alpha) = \int_{0}^{\infty} x^{\alpha-1} e^{-x} \, dx, \quad \alpha > 0
$$

$$
X \sim \Gamma(\alpha, \beta)
$$

$$
f(x) = \frac{\beta^\alpha}{\Gamma(\alpha)} x^{\alpha-1} e^{-\beta x} \quad (x \ge 0)
$$

$$
E(X) = \frac{\alpha}{\beta}, \quad D(X) = \frac{\alpha}{\beta^2}
$$

#### 对数正态分布
$$
\ln X \sim N(\mu, \sigma)
$$

$$
f(x) = \frac{1}{x\sigma\sqrt{2\pi}} \exp\left\{ -\frac{(\ln x - \mu)^2}{2\sigma^2} \right\}
$$

$$
E(X) = e^{\mu + \frac{\sigma^2}{2}}, \quad D(X) = (e^{\sigma^2} - 1)e^{2\mu + \sigma^2}
$$

---

### 3. 随机变量函数的概率密度

若 $Y = g(x)$，$g'(x) > 0$ 或 $g'(x) < 0$，则有：
$$
f_Y(y) = f_X(h(y)) \cdot |h'(y)| \quad (\alpha < y < \beta)
$$

其中 $h(y)$ 是 $g(x)$ 的反函数，即 $h(y) = g^{-1}(y)$。

---

## 三、随机向量及其概率分布

### 1. 分布函数

#### 1. 联合分布函数
对于随机向量 $(X,Y)$，称 $F(x,y) = P(X \le x, Y \le y)$ 为 $(X,Y)$ 的联合分布函数。
联合分布函数是 $x, y$ 的单调不减函数。

#### 2. 边缘分布函数
当 $F(x,y)$ 是 $(X,Y)$ 的联合分布函数时，由于 $\{Y \le \infty\}, \{X \le \infty\}$ 是必然事件，所以对于 $X, Y$ 来说，有概率分布：

$$
F_X(x) = P(X \le x, Y \le \infty) = F(x, \infty)
$$

$$
F_Y(y) = P(X \le \infty, Y \le y) = F(\infty, y)
$$

这时称 $F_X(x), F_Y(y)$ 为 $(X,Y)$ 的边缘分布函数。

#### 3. 独立性
$X,Y$ 相互独立的充要条件是对任何 $x,y$ 都有：
$$
F(x,y) = F_X(x)F_Y(y)
$$
该定理可推广至任意多个随机变量。

当 $X_1$, $X_2$,···,$X_n$ 相互独立时，有以下定理成立：
1. $Y_1=g(X_1)$, $Y_2 = g_2(X_2$), ···, $Y_n = g_n(X_n)$ 相互独立；
2. 对于 $k$ 元函数 $g(x_1, x_2$,  ···, $x_k)$，定义 $Z_k = g(X_1, X_2$, ···, $X_k)$，则 $Z_k, X_{k+1}$, ···, $X_n$ 相互独立；

---

### 2. 密度函数

#### 1. 联合密度函数
设 $(X,Y)$ 是随机向量，如果有 $\mathbb{R}^2$ 上的非负函数 $f(x,y)$ 使得对 $\mathbb{R}^2$ 的任何长方形子集：
$$
D = \{ (x,y) \mid a < x \le b, c < y \le d \}
$$

有：
$$
P((X,Y) \in D) = \iint_{D} f(x,y) \, dxdy
$$

则称 $(X,Y)$ 是连续型随机向量，并称 $f(x,y)$ 是 $(X,Y)$ 的联合概率密度或联合密度 (joint density)。

#### 2. 边缘密度函数
如果 $f(x,y)$ 是随机向量 $(X,Y)$ 的联合密度，则称 $X, Y$ 各自的概率密度为 $f_X(x)$ 或 $f_Y(y)$，为 $(X,Y)$ 的边缘密度 (marginal density)。

由定义与随机向量中变量关系可得：
$$
f_X(x) = \int_{-\infty}^{\infty} f(x,y) \, dy
$$

$$
f_Y(y) = \int_{-\infty}^{\infty} f(x,y) \, dx
$$

#### 3. 独立性
设 $X,Y$ 分别有概率密度 $f_X(x), f_Y(y)$，则 $X,Y$ 独立的充分必要条件是随机向量 $(X,Y)$ 有联合密度：
$$
f(x,y) = f_X(x)f_Y(y)
$$

* 若已知 $X,Y$ 独立，则已知 $X = x$ 时，$Y$ 的取值范围与 $x$ 无关；

* 若连续型随机向量 $(X_1, X_2,$ ···$, X_n)$ 的概率密度函数 $f(x_1,$ ···$, x_n)$ 可表示为 $n$ 个函数 $g_1$, ···$, g_n$ 


  之积，其中 $g_i$ 只依赖于 $x_i$，即：

  


$$
f(x_1, ···, x_n) = g_1(x_1) ··· g_n(x_n)
$$

$f(x_1,$ ···$, x_n) = g_1(x_1)$ ··· $g_n(x_n)$



则 $X_1,$ ···$, X_n$ 相互独立，且 $X_i$ 的边缘密度函数 $f_i(x_i)$ 与 $g_i(x_i)$ 只相差一个常数因子。

---

### 3. 随机向量函数的分布函数与概率密度函数

#### 1. 离散型随机向量的函数
1. **泊松分布具有可加性**：如果 $X_1, X_2, ···, X_n$ 相互独立，$X_i \sim P(\lambda_i)$，则：
   $$
   Z_n= X_1 + X_2 + ··· + X_n \sim P(\lambda_1 + \lambda_2 + ··· +\lambda_n)
   $$
   
2. **二项分布具有可加性**：如果 $X_1, X_2, ···, X_n$ 相互独立，$X_i \sim B(m_i, p)$，则：


$$
Z_n = X_1 + X_2 + ··· + X_n \sim B(m_1 + m_2 + ··· + m_n, p)
$$
3. **正态分布具有可加性**：如果 $X_1, X_2, ···, X_n$ 相互独立，$X_i \sim N(\mu_i, \sigma_i^2)$，则：    

$$
Z_n = c_0 \pm c_1 X_1 \pm c_2 X_2 \pm \dots \pm c_n X_n \sim N\left(c_0 \pm c_1\mu_1 \pm c_2\mu_2 \pm \dots \pm c_n\mu_n, \, c_1^2\sigma_1^2 + c_2^2\sigma_2^2 + \dots + c_n^2\sigma_n^2\right)
$$

#### 2. 连续型随机向量的函数

##### 1. 加法
设 $(X,Y)$ 有联合密度 $f(x,y)$，则 $U = X + Y$ 有概率密度：
$$
f_U(u) = \int_{-\infty}^{\infty} f(x, u - x) \, dx = \int_{-\infty}^{\infty} f(u - y, y) \, dy
$$

当 $X,Y$ 独立时（即卷积公式）：
$$
f_U(u) = \int_{-\infty}^{\infty} f_X(x)f_Y(u - x) \, dx = \int_{-\infty}^{\infty} f_X(u - y)f_Y(y) \, dy
$$
##### 2. 减法
设 $(X,Y)$ 有联合密度 $f(x,y)$，则 $V = X - Y$ 有概率密度：
$$
f_V(v) = \int_{-\infty}^{\infty} f(x, x - v) \, dx = \int_{-\infty}^{\infty} f(v + y, y) \, dy
$$

当 $X,Y$ 独立时：
$$
f_V(v) = \int_{-\infty}^{\infty} f_X(x)f_Y(x - v) \, dx = \int_{-\infty}^{\infty} f_X(v + y)f_Y(y) \, dy
$$

##### 3. 最值

###### 1) 最大值
设 $(X,Y)$ 相互独立，其分布函数分别为 $F_X(x)$ 和 $F_Y(y)$，则 $Z = \max(X,Y)$ 的分布函数为：
$$
F_{\max}(z) = F_X(z)F_Y(z)
$$

###### 2) 最小值
设 $(X,Y)$ 相互独立，其分布函数分别为 $F_X(x)$ 和 $F_Y(y)$，则 $Z = \min(X,Y)$ 的分布函数为：
$$
F_{\min}(z) = 1 - (1 - F_X(z))(1 - F_Y(z))
$$

---

#### 3. 随机向量函数的联合概率密度
如果 $x = x(u,v), y = y(u,v)$ 在平面开集 $D$ 中有连续的偏导数，且雅可比 (Jacobian) 行列式为：
$$
J = \frac{\partial(x,y)}{\partial(u,v)} = \begin{vmatrix} \frac{\partial x}{\partial u} & \frac{\partial x}{\partial v} \\ \frac{\partial y}{\partial u} & \frac{\partial y}{\partial v} \end{vmatrix} \neq 0
$$

则有：
$$
dxdy = \left| \frac{\partial(x,y)}{\partial(u,v)} \right| dudv = |J| \, dudv, \quad (u,v) \in D
$$
其中 $|J|$ 是 $J$ 的绝对值。

然后利用：
$$
g(u,v) = f(x(u,v), y(u,v))|J|
$$
得到随机向量 $(U,V)$ 的联合密度。

---

#### 4. 条件概率密度
$$
f_{X|Y}(x|y) = \frac{f(x,y)}{f_Y(y)}
$$

因此，$X,Y$ 独立的充要条件为：
$$
f_{X|Y}(x|y) = f_X(x)
$$

---

## 四、随机变量的数字特征

### 1. 期望

#### 1. 定义

##### 1) 离散型
$$
E(X) = \sum_{k=1}^{+\infty} x_k \cdot p_k
$$

##### 2) 连续型
$$
E(X) = \int_{-\infty}^{+\infty} x \cdot f(x) \, dx
$$

---

#### 2. $Y = g(X)$

##### 1) 离散型
$$
E(Y) = E[g(X)] = \sum_{k=1}^{\infty} g(x_k) \cdot p_k
$$

##### 2) 连续型
$$
E(Y) = E[g(X)] = \int_{-\infty}^{+\infty} g(x)f(x) \, dx
$$

---

#### 3. $Z = h(X,Y)$

##### 1) 离散型
$$
E(Z) = E[h(X,Y)] = \sum_{i=1}^{\infty} \sum_{j=1}^{\infty} h(x_i, y_j) \cdot p_{ij}
$$

##### 2) 连续型
$$
E(Z) = E[h(X,Y)] = \int_{-\infty}^{+\infty} \int_{-\infty}^{+\infty} h(x,y)f(x,y) \, dxdy
$$

---

#### 4. 性质
1. 线性组合 $Y = c_0 + c_1 X_1 + c_2 X_2 +$ ··· $+ c_n X_n$ 的期望存在，且：

$$
E(c_0 + c_1 X_1 + c_2 X_2 + \dots + c_n X_n) = c_0 + c_1 E(X_1) + c_2 E(X_2) + \dots + c_n E(X_n)
$$
2. 若 $X_1, X_2,$ ···$, X_n$ 相互独立，那么乘积 $Z = X_1 X_2$ ···$X_n$ 的期望存在，且：

$$
E(X_1 X_2 ··· X_n) = E(X_1)E(X_2) ··· E(X_n)
$$
3. 
   $$
   E(\bar{X}) = \mu
   $$
   

---

### 2. 方差

#### 1. 定义

##### 1) 基本定义
$$
D(X) = E((X - \mu)^2) = E(X^2) - \mu^2 = E(X^2) - (E(X))^2
$$

##### 2) 离散型
$$
D(X) = \sum_{i=1}^{+\infty} [x_i - E(X)]^2 p_i
$$

##### 3) 连续型
$$
D(X) = \int_{-\infty}^{+\infty} [x - E(X)]^2 f(x) \, dx
$$

#### 2. 性质
1. $$
   0 \le Var(X) = E(X^2) - (E(X))^2 \implies Var(X) \le E(X^2)
   $$

   
   
2. $$
   Var(cX) = c^2 Var(X)
   $$

3. $$
   Var(X) \le E(X - c)^2$，其中等号成立当且仅当 $c = E(X)
   $$

   

4. 
   $$
   Var(X + Y) = Var(X) + Var(Y) + 2 \cdot Cov(X,Y)
   $$

5. $$
   Var(X - Y) = Var(X) + Var(Y) - 2 \cdot Cov(X,Y)
   $$

   

6. 若 $X, Y$ 相互独立，$a, b$ 为常数，那么有 
   $$
   Var(aX + bY) = a^2 Var(X) + b^2 Var(Y)
   $$
   
7. $$
   Var(\bar{X}) = \frac{\sigma^2}{n}
   $$

   

8. $$
   Var(XY) = Var(X)Var(Y) + Var(X)(E(Y))^2 + Var(Y)(E(X))^2
   $$

   

#### 3. 标准化
我们称
$$
X^* = \frac{X - E(X)}{\sqrt{Var(X)}}
$$
为 $X$ 的标准化随机变量，易得 
$$
E(X^*) = 0, Var(X^*) = 1
$$
$。

---

### 3. 矩

#### 1. 定义
设 $X$ 为随机变量，$c$ 为常数，$r$ 为正整数，则 $E[(X - c)^r]$ 称为 $X$ 关于 $c$ 点的 $r$ 阶矩。

#### 2. 原点矩与中心矩
* $c = 0$ 时，$\alpha_r = E(X^r)$ 称为 $X$ 的 $r$ 阶原点矩；
* $c = E(X)$ 时，$\mu_r = E[(X - E(X))^r]$ 称为 $X$ 的 $r$ 阶中心矩。

---

### 4. 协方差与相关系数

#### 1. 协方差定义
$$
Cov(X,Y) = E\{[X - E(X)][Y - E(Y)]\}
$$
称为 $X,Y$ 的协方差，其中 Cov 是英文单词 Covariance 的缩写。

#### 2. 协方差性质
1. 
   $$
   Cov(X,Y) = Cov(Y,X)
   $$
   
2. 
   $$
   Cov(X,X) = Var(X)
   $$
   
3. 
   $$
   Cov(X,Y) = E(XY) - E(X)E(Y)
   $$
   ，所以当 $X,Y$ 相互独立时，协方差为 $0$
4. 
   $$
   Cov(X_1 + X_2, Y) = Cov(X_1, Y) + Cov(X_2, Y)
   $$
   
5. 
   $$
   Cov(aX, bY) = ab \cdot Cov(X,Y)
   $$
   

#### 3. 相关系数定义
设 $X,Y$ 是随机变量，则称
$$
\rho_{XY} = \frac{Cov(X,Y)}{\sqrt{Var(X)Var(Y)}}
$$
为 $X,Y$ 的相关系数。
#### 4. 相关系数性质
1. 当 $\rho_{XY} = 0$ 时，称 $X, Y$ 不（线性）相关。
2. $\rho_{XY} = Cov(X^*, Y^*)$，因此可以将相关系数视为标准尺度下的协方差。
3. $|\rho_{XY}| \le 1$，等号成立当且仅当 $X, Y$ 之间存在严格的线性关系，即：
   * $\rho_{XY} = 1$，则存在 $a > 0, b \in \mathbb{R}$ 使得 $X = aY + b$（正相关）
   * $\rho_{XY} = -1$，则存在 $a < 0, b \in \mathbb{R}$ 使得 $X = aY + b$（负相关）

#### 5. 不相关与独立
* **不相关**：$\rho_{XY} = 0$
* **独立**：$P(X = x_i, Y = y_j) = P(X = x_i)P(Y = y_j)$ 且 $f(x,y) = f_X(x)f_Y(y)$

  

  
  $$
  P(X = x_i, Y = y_j) = P(X = x_i)P(Y = y_j) \quad \text{且} \quad f(x,y) = f_X(x)f_Y(y)
  $$
  

因此对随机变量 $X, Y$，如果 $X, Y$ 相互独立，那么它们一定不相关；但如果它们不相关，却未必相互独立。

---

## 五、大数定律与中心极限定理

### 1. 切比雪夫不等式 (Chebyshev's inequality)
$$
P(|X - \mu| \ge \varepsilon) \le \frac{\sigma^2}{\varepsilon^2}, \quad \forall \varepsilon > 0
$$

### 2. 伯努利大数定律
$$
\lim_{n \to +\infty} P\left( \left| \frac{n_A}{n} - p \right| \ge \varepsilon \right) = 0
$$

### 3. 独立同分布的中心极限定理
设 $X_1, X_2,$ ···$, X_n,$ ···· 相互独立且同分布， $E(X_i) = \mu, D(X_i) = \sigma^2, i = 1, 2,$···，



则对于充分大的 $n$ 有：


$$
\sum_{i=1}^n X_i \xrightarrow{d} N(n\mu, n\sigma^2)
$$

即：


$$
\frac{X_1 + \dots + X_n - n\mu}{\sqrt{n}\sigma} \xrightarrow{d} N(0,1)
$$

即：
$$
\lim_{n \to +\infty} P\left( \frac{X_1 + \dots + X_n - n\mu}{\sqrt{n}\sigma} \le x \right) = \Phi(x)
$$

### 4. 德莫弗-拉普拉斯定理
即二项分布可以用正态分布逼近：

$$
n_A \xrightarrow{d} N(np, np(1-p))
$$

即：
$$
\frac{X_1 + \dots + X_n - np}{\sqrt{np(1-p)}} \xrightarrow{d} N(0,1)
$$

即：
$$
\lim_{n \to +\infty} P\left( \frac{X_1 + \dots + X_n - np}{\sqrt{np(1-p)}} \le x \right) = \Phi(x)
$$

## 五、统计三大分布与序分布

### 1. 卡方分布 ($\chi^2$ 分布)

#### 1) 定义
设 $X_1, X_2,$ ···$, X_n$ 是来自标准正态总体 $N(0,1)$ 的一个样本，令：
$$
X = \sum_{i=1}^n X_i^2
$$
则称 $X$ 是自由度为 $n$ 的 $\chi^2$ 变量，其分布称为自由度为 $n$ 的 $\chi^2$ 分布，记为 $X \sim \chi_n^2$。

#### 2) 概率密度
$$
f_n(x) = \begin{cases} 
\frac{1}{2^{\frac{n}{2}} \Gamma(\frac{n}{2})} x^{\frac{n}{2}-1} e^{-\frac{x}{2}}, & x > 0 \\ 
0, & x \le a 
\end{cases}
$$

可以观察到自由度为 $n$ 的 $\chi^2$ 分布与 $\text{Gamma}$ 分布的关系为：
$$
X = \sum_{i=1}^n X_i^2 \sim \Gamma\left(\frac{n}{2}, \frac{1}{2}\right)
$$

密度函数图像

![](/images/AI/math/2-1-1.png)

#### 3) 性质

1. **期望**：$E(\chi_n^2) = n$
2. **方差**：$\operatorname{Var}(\chi_n^2) = 2n$
3. **可加性**：若 $X \sim \chi_{n_1}^2, Y \sim \chi_{n_2}^2$，且 $X, Y$ 相互独立，那么有：
$$
X + Y \sim \chi^2(n_1 + n_2)
$$

#### 4) 上侧 $\alpha$ 分位数
若 $X \sim \chi_n^2$，记 $P(X > c) = \alpha$，则 $c = \chi_n^2(\alpha)$ 称为 $\chi^2$ 分布的上侧 $\alpha$ 分位数。

---

### 2. $t$ 分布

#### 1) 定义
设随机变量 $X \sim N(0,1), Y \sim \chi_n^2$，且 $X, Y$ 独立，则称：



$$
T = \frac{X}{\sqrt{\frac{Y}{n}}}
$$






为自由度为 $n$ 的 $t$ 随机变量，其分布称为自由度为 $n$ 的 $t$ 分布，记为 $T \sim t(n)$。
为自由度为 $n$ 的 $t$ 变量，其分布称为自由度为 $n$ 的 $t$ 分布，记作 $T \sim t_n$。

#### 2) 概率密度
$$
t_n(x) = \frac{\Gamma\left(\frac{n+1}{2}\right)}{\Gamma\left(\frac{n}{2}\right)\sqrt{n\pi}} \left(1 + \frac{x^2}{n}\right)^{-\frac{n+1}{2}}, \quad (x \in \mathbb{R})
$$

易得 $t$ 分布与正态分布的关系：
$$
\lim_{n \to +\infty} t_n(x) = \varphi(x)
$$

概率密度图像
![](/images/AI/math/2-1-2.png)

#### 3) 性质

1. **期望**：当 $n \ge 2$ 时，$E(T) = 0$
2. **方差**：当 $n \ge 3$ 时，$Var(T) = \frac{n}{n-2}$

#### 4) 双侧 $\alpha$ 分位数
若 $T \sim t_n$，记 $P(|T| > c) = \alpha$，则 $c = t_n\left(\frac{\alpha}{2}\right)$ 为自由度为 $n$ 的 $t$ 分布的双侧 $\alpha$ 分位数。

---

### 3. $F$ 分布

#### 1) 定义
设随机变量 $X \sim \chi^2(m), Y \sim \chi^2(n)$，且 $X, Y$ 独立，则称：
$$
F = \frac{\frac{X}{m}}{\frac{Y}{n}}
$$
为自由度分别为 $m, n$ 的 $F$ 变量，其分布称为自由度为 $m, n$ 的 $F$ 分布，记作 $F \sim F(m,n)$。

#### 2) 概率密度
$$
f_{m,n}(x) = \frac{\Gamma\left(\frac{m+n}{2}\right)}{\Gamma\left(\frac{m}{2}\right)\Gamma\left(\frac{n}{2}\right)} m^{\frac{m}{2}} n^{\frac{n}{2}} x^{\frac{m}{2}-1} (n + mx)^{-\frac{m+n}{2}}, \quad (x > 0)
$$

概率密度图像
![](/images/AI/math/2-1-3.png)

#### 3) 性质

1. 若 $Z \sim F(m,n)$，则 $\frac{1}{Z} \sim F(n,m)$
2. 若 $T \sim t_n$，则 $T^2 \sim F(1,n)$
3. $F_{1-\alpha}(m,n) = \frac{1}{F_\alpha(n,m)}$，注意自由度对换

#### 4) 上侧 $\alpha$ 分位数
若 $F \sim F(m,n)$，记 $P(F > c) = \alpha$，则 $c = F_\alpha(m,n)$ 为 $F$ 分布的上侧 $\alpha$ 分位数。

---

### 4. 序分布

#### 1) 定义
设 $X_1, X_2,$ ···,$ X_n$ 是取自总体 $X$ 的样本，$X_{(i)}$ 称为该样本的第 $i$ 个次序统计量。它的取值是将样本观测值由小到大排列后得到的第 $i$ 个观测值。从小到大排序为 $x_{(1)}, x_{(2)},$ ···$, x_{(n)}$，则称 $X_{(1)}, X_{(2)},$ ···$, X_{(n)}$ 为顺序统计量。

#### 2) 密度函数
设总体 $X$ 的密度函数为 $f(x)$，分布函数为 $F(x)$，$X_1, X_2,$ ···$, X_n$ 为样本，则第 $k$ 个次序统计量 $X_{(k)}$ 的密度函数为：
$$
f_k(x) = \frac{n!}{(k-1)!(n-k)!} F(x)^{k-1} (1 - F(x))^{n-k} f(x)
$$

#### 3) 分布函数
当 $k = 1, n$ 时可得：
$$
F_1(x) = 1 - (1 - F(x))^n
$$

$$
F_n(x) = F(x)^n
$$

---

## 五、正态总体的样本均值与样本方差的分布

### 1. 一般总体的样本均值与样本方差
设总体 $X$ 分布未知，但已知 $E(X) = \mu, D(X) = \sigma^2$，$X_1, X_2,$ ···$, X_n$ 是来自总体 $X$ 的样本：

$$
\bar{X} = \frac{1}{n} \sum_{i=1}^n X_i
$$

$$
S^2 = \frac{1}{n-1} \sum_{i=1}^n (X_i - \bar{X})^2
$$

分别为样本均值与样本方差，则有：
$$
E(\bar{X}) = \mu, \quad D(\bar{X}) = \frac{\sigma^2}{n}
$$

$$
E(S^2) = D(X) = \sigma^2
$$

#### 2. 正态变量样本均值与样本方差的性质
设 $X_1, X_2,$ ···$, X_n \sim N(\mu, \sigma^2)$，$\bar{X}, S^2$ 分别为样本均值与样本方差，则有：
1. $\bar{X} \sim N\left(\mu, \frac{\sigma^2}{n}\right)$
2. $\frac{(n-1)S^2}{\sigma^2} \sim \chi^2_{n-1}$
3. $\bar{X}, S^2$ 相互独立

#### 3. 几个重要推论
1. 设 $X_1, X_2,$ ···$, X_n$ 相互独立相同分布 ($i.i.d$) $\sim N(\mu, \sigma^2)$，则有：
$$
T = \frac{\sqrt{n}(\bar{X} - \mu)}{S} \sim t(n - 1)
$$

2. 设 $X_1, X_2,$ ···$, X_n \,\, i.i.d \sim N(\mu_1, \sigma_1^2)$，$Y_1, Y_2,$ ···$, Y_m \,\, i.i.d \sim N(\mu_2, \sigma_2^2)$，且假定 $\sigma_1^2 = \sigma_2^2 = \sigma^2$，样本 $X_1, X_2,$ ···$, X_n, Y_1, Y_2,$ ···$, Y_m$ 独立，则有：
$$
\frac{(\bar{X} - \bar{Y}) - (\mu_1 - \mu_2)}{\sqrt{\frac{\sigma^2}{n_1} + \frac{\sigma^2}{n_2}}} \sim N(0, 1)
$$

因此：
$$
T = \frac{(\bar{X} - \bar{Y}) - (\mu_1 - \mu_2)}{S_w} \cdot \sqrt{\frac{mn}{n+m}} \sim t(n + m - 2)
$$

这里：
$$
S_w = \sqrt{\frac{(m-1)S_1^2 + (n-1)S_2^2}{n + m - 2}}
$$

3. 设 $X_1, X_2,$ ···$, X_m \,\, i.i.d \sim N(\mu_1, \sigma_1^2)$，$Y_1, Y_2,$ ···$, Y_n \,\, i.i.d \sim N(\mu_2, \sigma_2^2)$，样本 $X_1, X_2,$ ···, $X_m, Y_1, Y_2,$ ···$, Y_n$ 独立，则有：
$$
F = \frac{S_1^2}{S_2^2} \cdot \frac{\sigma_2^2}{\sigma_1^2} \sim F(m - 1, n - 1)
$$

---

## 六、参数估计

### 1. 估计

#### 1) 估计的分类
假设 $\hat{\theta}$ 是 $\theta$ 的估计，那么有：
1. 若 $E\hat{\theta} = \theta$，则称 $\hat{\theta}$ 是 $\theta$ 的无偏估计；
2. 当样本量 $n \to \infty$，$\hat{\theta}$ 依概率收敛到 $\theta$，则称 $\hat{\theta}$ 是 $\theta$ 的相合估计；
3. 当样本量 $n \to \infty$，$\hat{\theta}$ 依概率 1 收敛到 $\theta$，则称 $\hat{\theta}$ 是 $\theta$ 的强相合估计；

#### 2) 样本均值与样本方差的估计
1. 样本均值 $\bar{X}$ 是总体均值 $\mu$ 的强相合无偏估计；
2. 样本方差 $S^2$ 是总体方差 $\sigma^2$ 的强相合无偏估计；
3. 样本标准差 $S$ 是总体标准差 $\sigma$ 的强相合估计，但是 $ES < \sigma$。

### 2. 点估计

#### 1) 矩估计

##### 1. 定义
矩估计是基于一种简单的替换的思想建立起来的一种估计方法，其基本思想是用样本矩估计总体矩。由大数定律，如果未知参数和总体的某个或某些矩有关系，那么自然地构造这种样本矩去估计未知参数。

##### 2. 样本矩
样本 $k$ 阶原点矩：
$$
a_k = \frac{1}{n} \sum_{i=1}^n X_i^k
$$

样本 $k$ 阶中心矩：
$$
m_k = \frac{1}{n} \sum_{i=1}^n (X_i - \bar{X})^k
$$

由大数定律保证了：
$$
a_k \xrightarrow{P} \alpha_k
$$
$$
m_k \xrightarrow{P} \mu_k
$$

##### 3. 常用矩估计

1. 在泊松分布 $P(\lambda)$ 中

$$
\lambda = E(X) = \alpha_1
$$
且 $\alpha_1$ 的矩估计是 $a_1$，因此：
$$
\hat{\lambda} = a_1 = \frac{1}{n} \sum_{i=1}^n X_i
$$

2. 在指数分布 $E(\lambda)$ 中

$$
\mu = E(X) = \frac{1}{\lambda} \implies \lambda = \frac{1}{E(X)} = \frac{1}{\alpha_1}
$$
且 $\alpha_1$ 的矩估计是 $a_1$，因此：
$$
\hat{\lambda} = \frac{1}{a_1} = \frac{1}{\frac{1}{n} \sum_{i=1}^n X_i}
$$

3. 在正态总体 $N(\mu, \sigma^2)$ 中

$$
\mu = E(X) = \alpha_1
$$
$$
\sigma^2 = E(X^2) - (E(X))^2 = \alpha_2 - \alpha_1^2
$$
且 $\alpha_1$ 的矩估计是 $a_1$，$\alpha_2$ 的矩估计是 $a_2$，因此分别用：
$$
\hat{\mu} = a_1 = \frac{1}{n} \sum_{i=1}^n X_i
$$
$$
\hat{\sigma}^2 = a_2 - a_1^2 = \frac{1}{n} \sum_{i=1}^n X_i^2 - \left(\frac{1}{n} \sum_{i=1}^n X_i\right)^2
$$
来估计参数 $\mu$ 和 $\sigma^2$。

4. 在均匀总体 $U(a,b)$ 中

$$
\alpha_1 = E(X) = \frac{a + b}{2}
$$
$$
\alpha_2 - \alpha_1^2 = D(X) = \frac{(b - a)^2}{12}
$$

因此解方程组组：
$$
a = \alpha_1 - \sqrt{3(\alpha_2 - \alpha_1^2)}
$$
$$
b = \alpha_1 + \sqrt{3(\alpha_2 - \alpha_1^2)}
$$

所以分别用：
$$
\hat{a} = a_1 - \sqrt{3(a_2 - a_1^2)}
$$
$$
\hat{b} = a_1 + \sqrt{3(a_2 - a_1^2)}
$$
来估计参数 $a, b$。

---

### 2. 极大似然估计

#### 1) 定义
设 $X = (X_1, X_2,$ ···$, X_n)$ 为从具有概率函数 $f$ 的总体抽出的样本，$\theta$ 为未知参数或者未知参数向量。$x = (x_1, x_2,$ ···$, x_n)$ 为样本的观察值。若在给定 $x$ 时，值 $\hat{\theta} = \hat{\theta}(x)$ 满足下式：
$$
L(\hat{\theta}) = \max_{\theta \in \Theta} L(x; \theta)
$$
则称 $\hat{\theta}$ 为参数 $\theta$ 的极大似然估计，而 $\hat{\theta}(X)$ 称为参数 $\theta$ 的极大似然估计量，$L(x; \theta)$ 称为极大似然函数。若待估参数是 $\theta$ 的函数 $g(\theta)$，那么它的极大似然估计就是 $g(\hat{\theta})$。由于 $\ln L(\theta)$ 与 $L(\theta)$ 有着相同的最大值点，因此也可以用 $l(\theta) = \ln L(\theta)$ 进行极大似然估计，通常称 $l(\theta)$ 为对数似然函数。

#### 2) 具体操作方法
求极大似然估计相当于求似然函数的最大值，在简单样本的情况下：
$$
L(x; \theta) = \prod_{i=1}^n f(x_i; \theta)
$$

* **当似然函数对变量 $\theta$ 单调时**，直接利用单调性得到最大值点；
* **当似然函数为非单调函数且对变量 $\theta$ 可微时**，我们可以求其驻点：令
$$
\frac{dL(\theta)}{d\theta} = 0
$$
或者：
$$
\frac{dl(\theta)}{d\theta} = 0
$$

当 $\theta$ 为多维时，令
$$
\frac{\partial L(\theta)}{\partial \theta_i} = 0
$$
或者：
$$
\frac{\partial l(\theta)}{\partial \theta_i} = 0
$$

然后判断此驻点是否是最大值。

### 3. 区间估计

#### 1) 定义
设总体分布 $F(x, \theta)$ 含有一个或多个未知参数 $\theta, \theta \in \Theta$。对给定的值 $\alpha, (0 < \alpha < 1)$，若由样本 $X_1, X_2,$ ···$, X_n$ 确定的两个统计量 $\underline{\theta} = \underline{\theta}(X_1, X_2,$ ···$, X_n)$ 和 $\overline{\theta} = \overline{\theta}(X_1, X_2,$ ···$, X_n)$ 满足：
$$
P_\theta(\underline{\theta} \le \theta \le \overline{\theta}) = 1 - \alpha \quad \forall \theta \in \Theta
$$
称 $1 - \alpha$ 为置信水平，称 $[\underline{\theta}, \overline{\theta}]$ 为 $\theta$ 的置信水平为 $1 - \alpha$ 的置信区间。

#### 2) 枢轴变量法
1. 枢轴变量法：设待估参数为 $g(\theta)$。
   * **第一步**：找一个与待估参数 $g(\theta)$ 有关的统计量 $T$，一般是其一个良好的点估计（多数是通过极大似然估计构造）；
   * **第二步**：设法找出 $T$ 与 $g(\theta)$ 的某一函数 $S(T, g(\theta))$ 的分布，其分布 $F$ 要与参数 $\theta$ 无关（$S$ 即为枢轴变量）；
   * **第三步**：对任何常数 $a < b$，不等式 $a \le S(T, g(\theta)) \le b$ 要能表示成等价的形式 $A \le g(\theta) \le B$，其中 $A, B$ 只与 $T, a, b$ 有关而与参数无关；
   * **第四步**：取分布 $F$ 的上 $\alpha/2$ 分位数 $\omega_{\alpha/2}$ 和上 $(1 - \alpha/2)$ 分位数 $\omega_{1-\alpha/2}$，有 $F(\omega_{\alpha/2}) - F(\omega_{1-\alpha/2}) = 1 - \alpha$。因此：
$$
P(\omega_{1-\alpha/2} \le S(T, g(\theta)) \le \omega_{\alpha/2}) = 1 - \alpha
$$

#### 3) 常见的枢轴变量法进行正态总体的区间估计

##### 1. $\sigma$ 已知，求 $\mu$ 的置信水平为 $1 - \alpha$ 的双侧置信区间
枢轴量：
$$
Z = \frac{\bar{X}_n - \mu}{\frac{\sigma}{\sqrt{n}}} \sim N(0, 1)
$$

于是得到 $\mu$ 的双侧置信区间为：
$$
\left[ \bar{X} - \frac{z_{\frac{\alpha}{2}}\sigma}{\sqrt{n}}, \,\, \bar{X} + \frac{z_{\frac{\alpha}{2}}\sigma}{\sqrt{n}} \right]
$$
其中 $z_{\frac{\alpha}{2}}$ 是正态分布函数的上侧 $\alpha$ 分位数。

单侧置信上限：
$$
\bar{X} + \frac{z_{\alpha}\sigma}{\sqrt{n}}
$$

单侧置信下限：
$$
\bar{X} - \frac{z_{\alpha}\sigma}{\sqrt{n}}
$$

置信区间的长度是：
$$
\frac{2z_{\frac{\alpha}{2}}\sigma}{\sqrt{n}}
$$

##### 2. $\sigma$ 未知，求 $\mu$ 的置信水平为 $1 - \alpha$ 的双侧置信区间
枢轴量：
$$
T = \frac{\bar{X} - \mu}{\frac{S}{\sqrt{n}}} \sim t(n - 1)
$$

于是得到 $\mu$ 的双侧置信区间为：
$$
\left[ \bar{X} - \frac{t_{\frac{\alpha}{2}}(n - 1)S}{\sqrt{n}}, \,\, \bar{X} + \frac{t_{\frac{\alpha}{2}}(n - 1)S}{\sqrt{n}} \right]
$$

单侧置信上限：
$$
\bar{X} + \frac{t_{\alpha}(n - 1)S}{\sqrt{n}}
$$

单侧置信下限：
$$
\bar{X} - \frac{t_{\alpha}(n - 1)S}{\sqrt{n}}
$$

置信区间长度为：
$$
2 \cdot \frac{t_{\frac{\alpha}{2}}(n - 1)S}{\sqrt{n}}
$$

##### 3. $\mu$ 未知，求 $\sigma^2$ 的置信水平为 $1 - \alpha$ 的双侧置信区间
枢轴量：
$$
\chi^2_{n-1} = \frac{(n - 1)S^2}{\sigma^2} = \frac{1}{\sigma^2} \sum_{i=1}^n (X_i - \bar{X}_n)^2 \sim \chi^2(n - 1)
$$

所以 $\sigma^2$ 的双侧置信区间为：
$$
\left[ \frac{(n - 1)S^2}{\chi^2_{\frac{\alpha}{2}}(n - 1)}, \,\, \frac{(n - 1)S^2}{\chi^2_{1 - \frac{\alpha}{2}}(n - 1)} \right]
$$

单侧置信上限：
$$
\frac{(n - 1)S^2}{\chi^2_{1 - \alpha}(n - 1)}
$$

单侧置信下限：
$$
\frac{(n - 1)S^2}{\chi^2_{\alpha}(n - 1)}
$$

---

#### 3) 两个正态总体的区间估计
设 $\bar{X}_n$ 和 $\bar{Y}_m$ 分别表示 $\{X_i\}$ 和 $\{Y_j\}$ 的样本均值，用 $S_1^2$ 和 $S_2^2$ 分别表示样本方差。

$$
\bar{X}_n \sim N\left(\mu_1, \frac{\sigma_1^2}{n}\right)
$$
$$
\bar{Y}_m \sim N\left(\mu_2, \frac{\sigma_2^2}{m}\right)
$$
$$
\implies \bar{X}_n - \bar{Y}_m \sim N\left(\mu_1 - \mu_2, \,\, \frac{\sigma_1^2}{n} + \frac{\sigma_2^2}{m}\right)
$$

##### 1. 已知 $\sigma_1^2, \sigma_2^2$，求均值差 $\mu_1 - \mu_2$ 的置信区间
枢轴量：
$$
Z = \frac{(\bar{X}_n - \bar{Y}_m) - (\mu_1 - \mu_2)}{\sqrt{\frac{\sigma_1^2}{n} + \frac{\sigma_2^2}{m}}} \sim N(0, 1)
$$

$\mu_1 - \mu_2$ 的双侧置信区间为：
$$
\left[ (\bar{X}_n - \bar{Y}_m) - z_{\frac{\alpha}{2}}\sqrt{\frac{\sigma_1^2}{n} + \frac{\sigma_2^2}{m}}, \,\, (\bar{X}_n - \bar{Y}_m) + z_{\frac{\alpha}{2}}\sqrt{\frac{\sigma_1^2}{n} + \frac{\sigma_2^2}{m}} \right]
$$

单侧置信上限：
$$
(\bar{X}_n - \bar{Y}_m) + z_{\alpha}\sqrt{\frac{\sigma_1^2}{n} + \frac{\sigma_2^2}{m}}
$$

单侧置信下限：
$$
(\bar{X}_n - \bar{Y}_m) - z_{\alpha}\sqrt{\frac{\sigma_1^2}{n} + \frac{\sigma_2^2}{m}}
$$

##### 2. 未知 $\sigma_1^2, \sigma_2^2$，但已知 $\sigma_1^2 = \sigma_2^2 = \sigma^2$ 时均值差 $\mu_1 - \mu_2$ 的置信区间
令：
$$
S_w^2 = \frac{(n - 1)S_1^2 + (m - 1)S_2^2}{n + m - 2}
$$

使用 $S_w^2$ 代替 1 中的 $\sigma_1^2, \sigma_2^2$，得到新的枢轴变量为：
$$
T = \frac{(\bar{X}_n - \bar{Y}_m) - (\mu_1 - \mu_2)}{S_w \sqrt{\frac{1}{n} + \frac{1}{m}}} \sim t(n + m - 2)
$$

$\mu_1 - \mu_2$ 的双侧置信区间为：
$$
\left[ (\bar{X}_n - \bar{Y}_m) - t_{\frac{\alpha}{2}}(n + m - 2) S_w \sqrt{\frac{1}{n} + \frac{1}{m}}, \,\, (\bar{X}_n - \bar{Y}_m) + t_{\frac{\alpha}{2}}(n + m - 2) S_w \sqrt{\frac{1}{n} + \frac{1}{m}} \right]
$$

##### 3. 未知 $\sigma_1^2, \sigma_2^2$，但已知 $\frac{\sigma_1^2}{\sigma_2^2} = b^2$ 时均值差 $\mu_1 - \mu_2$ 的置信区间
令：
$$
S_c^2 = \frac{\frac{(n - 1)S_1^2}{b^2} + (m - 1)S_2^2}{n + m - 2}
$$

使用 $S_c^2$ 代替 1 中的 $\sigma_2^2$，得到新的枢轴变量为：

$$
T = \frac{(\bar{X}_n - \bar{Y}_m) - (\mu_1 - \mu_2)}{S_c \sqrt{\frac{b^2}{n} + \frac{1}{m}}} \sim t(n + m - 2)
$$

$\mu_1 - \mu_2$ 的双侧置信区间为：
$$
\left[ (\bar{X}_n - \bar{Y}_m) - t_{\frac{\alpha}{2}}(n + m - 2) S_c \sqrt{\frac{b^2}{n} + \frac{1}{m}}, \,\, (\bar{X}_n - \bar{Y}_m) + t_{\frac{\alpha}{2}}(n + m - 2) S_c \sqrt{\frac{b^2}{n} + \frac{1}{m}} \right]
$$

##### 4. 方差比 $\frac{\sigma_1^2}{\sigma_2^2}$ 的置信区间
枢轴量：
$$
F = \frac{S_1^2 / S_2^2}{\sigma_1^2 / \sigma_2^2} \sim F(n - 1, m - 1)
$$

方差比的双侧置信区间为：
$$
\left[ \frac{S_1^2 / S_2^2}{F_{\frac{\alpha}{2}}(n - 1, m - 1)}, \,\, \frac{S_1^2 / S_2^2}{F_{1 - \frac{\alpha}{2}}(n - 1, m - 1)} \right]
$$

---

## 七、假设检验

### 1. 单样本正态总体均值和方差的检验

#### 1) 方差已知时均值的检验

##### 1. 双侧检验
检验：
$$
H_0: \mu = \mu_0 \longleftrightarrow H_1: \mu \neq \mu_0
$$

检验统计量：
$$
U = \frac{\bar{X}_n - \mu_0}{\sigma / \sqrt{n}} \sim N(0, 1)
$$

由于要求显著性水平为 $\alpha$，即 $P_{H_0}(|U| > u_{\frac{\alpha}{2}}) = \alpha$。
于是检验的拒绝域为：
$$
\left\{ |U| > u_{\frac{\alpha}{2}} \right\}
$$

即当观测值满足不等式：
$$
\frac{\sqrt{n}|\bar{x} - \mu_0|}{\sigma} > u_{\frac{\alpha}{2}}
$$
时拒绝 $H_0$。

##### 2. 单侧检验
检验：
$$
H_0: \mu = \mu_0 \longleftrightarrow H_1: \mu > \mu_0 \quad \text{或者} \quad H_0: \mu \le \mu_0 \longleftrightarrow H_1: \mu > \mu_0
$$

仍使用检验统计量：

$$
U = \frac{\bar{X}_n - \mu_0}{\sigma / \sqrt{n}}
$$

检验拒绝域：
$$
\{ U > u_{\alpha} \}
$$

类似的另一侧检验为：
$$
H_0: \mu = \mu_0 \longleftrightarrow H_1: \mu < \mu_0 \quad \text{或者} \quad H_0: \mu \ge \mu_0 \longleftrightarrow H_1: \mu < \mu_0
$$

则检验拒绝域：
$$
\{ U < -u_{\alpha} \}
$$

##### 2. 方差未知时均值的检验

1. 双侧检验
考虑检验：
$$
H_0: \mu = \mu_0 \longleftrightarrow H_1: \mu \neq \mu_0
$$

由于方差未知，在标准化的过程中可以用样本方差代替总体方差，得检验统计量：
$$
T = \frac{\bar{X}_n - \mu_0}{S / \sqrt{n}} \sim t(n - 1)
$$

检验拒绝域：
$$
\left\{ |T| > t_{\frac{\alpha}{2}}(n - 1) \right\}
$$

2. 单侧检验
检验：
$$
H_0: \mu = \mu_0 \longleftrightarrow H_1: \mu > \mu_0 \quad \text{或者} \quad H_0: \mu \le \mu_0 \longleftrightarrow H_1: \mu > \mu_0
$$

仍使用检验统计量：
$$
T = \frac{\bar{X}_n - \mu_0}{S / \sqrt{n}}
$$

检验拒绝域：
$$
\{ T > t_{\alpha}(n - 1) \}
$$

类似的另一侧检验为：
$$
H_0: \mu = \mu_0 \longleftrightarrow H_1: \mu < \mu_0 \quad \text{或者} \quad H_0: \mu \ge \mu_0 \longleftrightarrow H_1: \mu < \mu_0
$$

则检验拒绝域：
$$
\{ T < -t_{\alpha}(n - 1) \}
$$

##### 3. 均值已知时，对方差的检验

##### 1. 双侧检验
检验：
$$
H_0: \sigma^2 = \sigma_0^2 \longleftrightarrow H_1: \sigma^2 \neq \sigma_0^2
$$

由 $\sigma^2$ 的极大似然估计：
$$
\hat{\sigma}^2 = \frac{1}{n} \sum_{i=1}^n (X_i - \mu)^2
$$

构造检验统计量：
$$
\chi^2 = \frac{1}{\sigma_0^2} \sum_{i=1}^n (X_i - \mu)^2 = \frac{n\hat{\sigma}^2}{\sigma_0^2} \sim \chi^2(n)
$$

拒绝域：
$$
\left\{ \chi^2 < \chi^2_{1 - \frac{\alpha}{2}}(n) \right\} \cup \left\{ \chi^2 > \chi^2_{\frac{\alpha}{2}}(n) \right\}
$$

##### 2. 单侧检验
检验：
$$
H_0: \sigma^2 = \sigma_0^2 \longleftrightarrow H_1: \sigma^2 > \sigma_0^2 \quad \text{或者} \quad H_0: \sigma^2 \le \sigma_0^2 \longleftrightarrow H_1: \sigma^2 > \sigma_0^2
$$

拒绝域：
$$
\left\{ \chi^2 > \chi^2_{\alpha}(n) \right\}
$$

另一个检验：
$$
H_0: \sigma^2 = \sigma_0^2 \longleftrightarrow H_1: \sigma^2 < \sigma_0^2 \quad \text{或者} \quad H_0: \sigma^2 \ge \sigma_0^2 \longleftrightarrow H_1: \sigma^2 < \sigma_0^2
$$

拒绝域：
$$
\left\{ \chi^2 < \chi^2_{1 - \alpha}(n) \right\}
$$

---

#### 4) 均值未知时，方差的检验
检验统计量：
$$
\chi^2 = \frac{(n - 1)S^2}{\sigma_0^2} \sim \chi^2(n - 1)
$$

拒绝域：
$$
\left\{ \chi^2 < \chi^2_{1 - \frac{\alpha}{2}}(n - 1) \right\} \cup \left\{ \chi^2 > \chi^2_{\frac{\alpha}{2}}(n - 1) \right\}
$$

单侧检验类似千均值已知时的检验。

---

### 2. 两样本正态总体的检验

#### 1) 均值比较的检验

##### 1. 已知 $\sigma_1^2, \sigma_2^2$ 时，$\mu_1 - \mu_2$ 的检验

1. 双侧检验
检验：
$$
H_0: \mu_1 = \mu_2 \longleftrightarrow H_1: \mu_1 \neq \mu_2
$$

检验统计量：
$$
Z = \frac{\bar{X}_n - \bar{Y}_m}{\sqrt{\frac{\sigma_1^2}{n} + \frac{\sigma_2^2}{m}}} \sim N(0, 1)
$$

拒绝域：
$$
\left\{ |Z| > z_{\frac{\alpha}{2}} \right\}
$$

2. 单侧检验
检验：
$$
H_0: \mu_1 = \mu_2 \longleftrightarrow H_1: \mu_1 > \mu_2 \quad \text{或者} \quad H_0: \mu_1 \le \mu_2 \longleftrightarrow H_1: \mu_1 > \mu_2
$$

拒绝域：
$$
\{ Z > z_{\alpha} \}
$$

3. 另一侧检验
检验：
$$
H_0: \mu_1 = \mu_2 \longleftrightarrow H_1: \mu_1 < \mu_2 \quad \text{或者} \quad H_0: \mu_1 \ge \mu_2 \longleftrightarrow H_1: \mu_1 < \mu_2
$$

拒绝域：
$$
\{ Z < -z_{\alpha} \}
$$

##### 2. 未知 $\sigma_1^2, \sigma_2^2$，但知道 $\sigma_1^2 = \sigma_2^2 = \sigma^2$ 时，$\mu_1 - \mu_2$ 的检验
引入 $S_w^2$：
$$
S_w^2 = \frac{(n - 1)S_1^2 + (m - 1)S_2^2}{n + m - 2}
$$

检验统计量：
$$
T = \frac{\bar{X}_n - \bar{Y}_m}{S_w \sqrt{\frac{1}{n} + \frac{1}{m}}} \sim t(n + m - 2)
$$

拒绝域：
$$
\left\{ |T| > t_{\frac{\alpha}{2}}(m + n - 2) \right\}
$$

---

#### 2) 成对数据的假设检验
引入 $Z_i = X_i - Y_i$，则 $Z \sim N(\mu, \sigma^2)$。
检验有关联这一问题转换成检验：
$$
H_0: \mu = 0 \longleftrightarrow H_1: \mu \neq 0
$$

检验统计量：
$$
T = \frac{\bar{Z}_n}{S_z / \sqrt{n}} \sim t(n - 1)
$$

拒绝域：
$$
\left\{ |T| > t_{\frac{\alpha}{2}}(n - 1) \right\}
$$

##### 3. 方差比较的检验

1. 均值已知，对方差比 $\frac{\sigma_1^2}{\sigma_2^2}$ 的检验

**检验**：
$$
H_0: \sigma_1^2 = \sigma_2^2 \longleftrightarrow H_1: \sigma_1^2 \neq \sigma_2^2
$$

**检验统计量**：
$$
F = \frac{\frac{\sum_{i=1}^n (X_i - \mu_1)^2}{m}}{\frac{\sum_{j=1}^m (Y_j - \mu_2)^2}{n}} \sim F(m, n)
$$

**拒绝域**：
$$
\left\{ F > F_{\frac{\alpha}{2}}(m, n) \right\} \cup \left\{ F < \frac{1}{F_{\frac{\alpha}{2}}(n, m)} \right\}
$$

**单侧检验**：
$$
H_0: \sigma_1^2 = \sigma_2^2 \longleftrightarrow H_1: \sigma_1^2 > \sigma_2^2 \quad \text{或者} \quad H_0: \sigma_1^2 \le \sigma_2^2 \longleftrightarrow H_1: \sigma_1^2 > \sigma_2^2
$$

**拒绝域**：
$$
\left\{ F > F_{\alpha}(m, n) \right\}
$$

**另一个单侧检验**：
$$
H_0: \sigma_1^2 = \sigma_2^2 \longleftrightarrow H_1: \sigma_1^2 < \sigma_2^2 \quad \text{或者} \quad H_0: \sigma_1^2 \ge \sigma_2^2 \longleftrightarrow H_1: \sigma_1^2 < \sigma_2^2
$$

**拒绝域**：
$$
\left\{ F < \frac{1}{F_{\alpha}(n, m)} \right\}
$$

2. 均值未知时，对方差比较的检验

**检验统计量**：
$$
F = \frac{S_1^2}{S_2^2} \sim F(m - 1, n - 1)
$$

**双侧拒绝域**：
$$
\left\{ F > F_{\frac{\alpha}{2}}(m - 1, n - 1) \right\} \cup \left\{ F < \frac{1}{F_{\frac{\alpha}{2}}(n - 1, m - 1)} \right\}
$$

**单侧拒绝域**：
$$
\left\{ F > F_{\alpha}(m, n) \right\}
$$
$$
\left\{ F < \frac{1}{F_{\alpha}(n, m)} \right\}
$$

---

### 3. 拟合优度检验

一般来说检验一个样本是否符合某种总体分布，需要收集观测值 $\{X_1, X_2,$ ···$, X_n\}$ 进行检验，通常使用 Karl Pearson 提出的 $\chi^2$ 拟合优度检验。

#### 1) 离散总体

##### 1. 理论总体不含未知参数的情形
**检验统计量**：
$$
\chi^2 = \sum_{i=1}^k \frac{(n_i - n p_i)^2}{n p_i} \sim \chi^2(k - 1)
$$

##### 2. 理论分布含有若干未知参数的情形
**检验统计量**：
$$
\chi^2 = \sum_{i=1}^k \frac{(n_i - n \hat{p}_i)^2}{n \hat{p}_i} \sim \chi^2(k - 1 - r)
$$

其中 $r$ 为未知参数的个数，$\hat{p}_i$ 是 $p_i$ 的极大似然估计，通常来说极大似然估计有几种，未知参数就有几个。