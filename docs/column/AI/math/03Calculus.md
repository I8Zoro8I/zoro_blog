---
title: 数学基础-1-微积分
slug: AI工程师技术架构
date: 2026年04月26日
---

# 微积分核心知识大纲 (Calculus Syllabus)

---

## 一、 预备知识 (Pre-calculus)
* **函数概念与性质**：定义域、值域、奇偶性、周期性、单调性、反函数。
* **基本初等函数**：幂函数、指数函数、对数函数、三角函数、反三角函数。
* **常见复合与分解**：函数的复合、极坐标系与参数方程基础。

---

## 二、 极限与连续 (Limits and Continuity)
* ### 1. 极限的概念与计算
    * 数列极限与函数极限的定义（$\epsilon-N$ 与 $\epsilon-\delta$ 定义的直观理解）。
    * 左右极限（左极限 $x \to x_0^-$ 与右极限 $x \to x_0^+$）。
    * **两个重要极限**：
        1. $\lim_{x \to 0} \frac{\sin x}{x} = 1$
           
        2. $\lim_{x \to \infty} (1 + \frac{1}{x})^x = e$
           
           
           
        
    * **求极限的核心方法**：夹逼定理、洛必达法则、等价无穷小代换（如 $x \sim \sin x \sim \tan x \sim \ln(1+x)$）。
* ### 2. 函数的连续性与间断点
    * 连续的定义：
      $$
      \lim_{x \to x_0} f(x) = f(x_0)
      $$
      
      
      
    * **间断点分类**：
        * 第一类间断点（左右极限均存在）：可去间断点、跳跃间断点。
        * 第二类间断点（左右极限至少有一个不存在）：无穷间断点、振荡间断点。
    * **闭区间上连续函数的性质**：最值定理、介值定理、零点定理。

---

## 三、 一元函数微分学 (Single-Variable Differentiation)
* ### 1. 导数与微分的概念
    * 导数的几何意义（切线斜率）与物理意义（瞬时变化率）。
    * 导数定义式：
      $$
      f'(x_0) = \lim_{\Delta x \to 0} \frac{f(x_0 + \Delta x) - f(x_0)}{\Delta x}
      $$
      
    * 可导与连续的关系：**可导必连续，连续不一定可导**（例如 y = |x| 在 x=0 处）。
    * 微分的定义：
      $$
      \Delta y = f'(x)\Delta x + o(\Delta x)，即 dy = f'(x)dx
      $$
* ### 2. 求导法则与计算
    * 四则运算求导法则、复合函数求导（链式法则）。
    * 高阶导数、隐函数求导、参数方程求导、幂指函数求导（对数求导法）。
* ### 3. 微分中值定理
    * **罗尔定理 (Rolle)**：条件 $f(a)=f(b) \implies f'(\xi)=0$。
    * **拉格朗日中值定理 (Lagrange)**：
      $$
      f(b) - f(a) = f'(\xi)(b - a)
      $$
      
    * **柯西中值定理 (Cauchy)**：涉及两个函数的中值定理。
    * **泰勒公式 / 麦克劳林公式 (Taylor / Maclaurin)**：用多项式逼近复杂函数，带有皮亚诺余项或拉格朗日余项。
* ### 4. 导数的应用
    * 单调性判定（$f'(x) > 0$ 递增）与极值点（第一、第二充分条件）。
    * 凹凸性判定（$f''(x) > 0$ 为凹/下凸）与拐点。
    * 渐近线（水平、铅直、斜渐近线）。
    * 最优化问题与相关变化率（Related Rates）。

---

## 四、 一元函数积分学 (Single-Variable Integration)
* ### 1. 不定积分 (Indefinite Integral)
    * 原函数的概念。
    * **积分核心方法**：
        * 第一类换元法（凑微分法）。
        * 第二类换元法（三角代换、根式代换）。
        * 分部积分法：$\int u dv = uv - \int v du$（经典口诀：反对幂三指）。
        * 有理函数积分。
* ### 2. 定积分 (Definite Integral)
    * 定积分的黎曼和定义（分割、近似、求和、取极限）。
    * 定积分的几何意义（曲边梯形的净面积）。
    * **微积分基本定理（牛顿-莱布尼茨公式）**：
      $$
      \int_a^b f(x)dx = F(b) - F(a)
      $$
      
    * 变上限积分函数求导（原函数存在定理）。
* ### 3. 反常积分 (Improper Integral)
    * 无穷区间上的反常积分（如 
      $$
      \int_a^{+\infty} f(x)dx
      $$
      ）。
    * 无界函数的反常积分（瑕积分，积分区间内含有使函数趋于无穷的点）。
* ### 4. 定积分的应用
    * 几何应用：平面图形的面积、旋转体体积（磁盘法/外壳法）、曲线弧长。
    * 物理应用：变力做功、液体静压力、引力。

---

## 五、 常微分方程 (Differential Equations)
* ### 1. 一阶微分方程
    * 可分离变量的微分方程。
    * 齐次微分方程。
    * 一阶线性微分方程（常数变易法 / 积分因子法）。
* ### 2. 高阶微分方程
    * 可降阶的高阶微分方程类型。
    * **二阶常系数齐次线性微分方程**：通过特征方程 $r^2 + pr + q = 0$ 求解。
    * 二阶常系数非齐次线性微分方程（待定系数法）。

---

## 六、 多元函数微积分 (Multivariable Calculus)
* ### 1. 空间解析几何基础
    * 向量运算、平面与空间直线方程。
    * 常见二次曲面（椭球面、抛物面、双曲面、圆柱面）。
* ### 2. 多元函数微分学
    * 多元函数的极限与连续性。
    * **偏导数 (Partial Derivatives)** 与 **全微分 (Total Differential)**。
    * 复合函数求导（树状图链式法则）与隐函数求导。
    * **方向导数**与**梯度 ($\nabla$)**：函数增长最快的方向。
    * 多元函数的极值：极值存在的必要条件与充分条件（Hessian 矩阵 / $B^2-AC$ 判别法），拉格朗日乘数法（带约束条件的极值问题）。
* ### 3. 多元函数积分学
    * **二重积分 & 三重积分**：直角坐标系、极坐标系、柱坐标系、球面坐标系下的计算与换元（雅可比行列式 $J$）。
    * **曲线积分 (Line Integrals)**：
        * 第一类曲线积分（对弧长的积分）。
        * 第二类曲线积分（对坐标的积分/做功）。
    * **曲面积分 (Surface Integrals)**：
        * 第一类曲面积分（对面积的积分）。
        * 第二类曲面积分（对坐标的积分/通量）。
* ### 4. 四大核心积分定理
    * **格林公式 (Green's Theorem)**：平面区域上二重积分与边界曲线积分的关系。
    * **高斯公式 (Divergence Theorem)**：空间区域上三重积分与闭合曲面积分（通量）的关系。
    * **斯托克斯公式 (Stokes' Theorem)**：曲面积分与边界曲线积分的关系。
    * **曲线积分与路径无关的条件**（保守场、全微分方程）。

---

## 七、 无穷级数 (Infinite Series)
* ### 1. 常数项级数
    * 级数收敛与发散的定义，级数收敛的必要条件（$\lim a_n = 0$）。
    * **正项级数审敛法**：比较审敛法、比值审敛法（达朗贝尔）、根值审敛法（柯西）、积分审敛法。
    * **交错级数**：莱布尼茨判别法。
    * 绝对收敛与条件收敛。
* ### 2. 幂级数 (Power Series)
    * 阿贝尔定理、收敛半径 $R$、收敛区间与收敛域。
    * 幂级数的求导与积分（逐项求导、逐项积分）。
    * 函数的泰勒展开与麦克劳林展开（$e^x, \sin x, \cos x, \ln(1+x)$ 等标准展开式）。
* ### 3. 傅里叶级数 (Fourier Series)
    * 正交函数系。
    * 周期为 $2\pi$ 和 $2l$ 的周期函数的傅里叶级数展开（狄利克雷收敛定理）。

# 微积分核心知识详解与公式大全 (Comprehensive Calculus Guide)

---

## 一、 极限与连续 (Limits and Continuity)

### 1. 核心极限公式
* **两个重要极限**：
  
  1. 夹逼定理推导出的三角极限：
     $$
     \lim_{x \to 0} \frac{\sin x}{x} = 1
     $$
     
  2. 自然对数底数 $e$ 的定义：
     $$
     \lim_{x \to \infty} \left(1 + \frac{1}{x}\right)^x = e \quad \text{或} \quad \lim_{x \to 0} (1 + x)^{\frac{1}{x}} = e
     $$
     

### 2. 等价无穷小代换 (当 $x \to 0$ 时)
在求乘除法极限时，等价无穷小代换能极大简化计算：
* $\sin x \sim x$

  
  
* $\tan x \sim x$

* $\arcsin x \sim x$

* $\arctan x \sim x$

* $1 - \cos x \sim \frac{1}{2}x^2$

  
  
* $e^x - 1 \sim x$

  
  
* $\ln(1 + x) \sim x$

  
  
* $(1 + x)^\alpha - 1 \sim \alpha x$

  
  

### 3. 洛必达法则 (L'Hôpital's Rule)
用于处理 $\frac{0}{0}$ 或 $\frac{\infty}{\infty}$ 型不定式：
如果 $\lim_{x \to a} \frac{f(x)}{g(x)}$ 属于上述不定式，且 $f'(x)$ 和 $g'(x)$ 存在，$g'(x) \neq 0$，则：
$$
\lim_{x \to a} \frac{f(x)}{g(x)} = \lim_{x \to a} \frac{f'(x)}{g'(x)}
$$

> **注意**：使用前必须验证是否为 $\frac{0}{0}$ 或 $\frac{\infty}{\infty}$ 型。$0 \cdot \infty$、$1^\infty$ 等类型需先进行代数变形。

---

## 二、 一元函数微分学 (Single-Variable Differentiation)

### 1. 基本求导公式
* $(x^\alpha)' = \alpha x^{\alpha-1}$

  
  
* $(e^x)' = e^x \quad ; \quad (a^x)' = a^x \ln a$

  
  
* $(\ln x)' = \frac{1}{x} \quad ; \quad (\log_a x)' = \frac{1}{x \ln a}$

  
  
* $(\sin x)' = \cos x \quad ; \quad (\cos x)' = -\sin x$

  
  
* $(\tan x)' = \sec^2 x \quad ; \quad (\cot x)' = -\csc^2 x$

  
  
* $(\sec x)' = \sec x \tan x \quad ; \quad (\csc x)' = -\csc x \cot x$

  
  
* $(\arcsin x)' = \frac{1}{\sqrt{1-x^2}} \quad ; \quad (\arccos x)' = -\frac{1}{\sqrt{1-x^2}}$

  
  
* $(\arctan x)' = \frac{1}{1+x^2}$

  
  

### 2. 求导法则
* **乘法法则 (Product Rule)**：$(uv)' = u'v + uv'$
* **除法法则 (Quotient Rule)**：$\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^2}$
* **链式法则 (Chain Rule)**：$[f(g(x))]' = f'(g(x)) \cdot g'(x)$

### 3. 微分中值定理
* **拉格朗日中值定理 (Lagrange Mean Value Theorem)**：
  如果 $f(x)$ 在 $[a, b]$ 上连续，在 $(a, b)$ 内可导，则至少存在一点 $\xi \in (a, b)$ 使得：
  $$
  f'(\xi) = \frac{f(b) - f(a)}{b - a}$$
  $$
* **泰勒公式 (Taylor's Formula)**：
  用于多项式逼近，在 $x=x_0$ 处的展开：
  $$
  f(x) = f(x_0) + f'(x_0)(x - x_0) + \frac{f''(x_0)}{2!}(x - x_0)^2 + \cdots + \frac{f^{(n)}(x_0)}{n!}(x - x_0)^n + R_n(x)
  $$
  
  其中 $R_n(x)$ 为余项。

---

## 三、 一元函数积分学 (Single-Variable Integration)

### 1. 微积分基本定理 (Newton-Leibniz Formula)
连接了微分与积分的核心定理：
$$
\int_a^b f(x) dx = F(b) - F(a)
$$

其中 $F(x)$ 是 $f(x)$ 的任意一个原函数（即 $F'(x) = f(x)$）。

### 2. 积分计算核心法则
* **换元积分法 (Substitution Rule)**：$\int f(g(x))g'(x) dx = \int f(u) du \quad \text{(令 } u = g(x)\text{)}$
* **分部积分法 (Integration by Parts)**：$\int u \, dv = uv - \int v \, du$
  
  > **技巧**：选择 $u$ 的顺序通常为：反三角函数 $\to$ 对数函数 $\to$ 幂函数 $\to$ 三角函数 $\to$ 指数函数（反对幂三指）。

### 3. 常见积分公式
* $\int x^\alpha dx = \frac{x^{\alpha+1}}{\alpha+1} + C \quad (\alpha \neq -1)$

  
  
* $\int \frac{1}{x} dx = \ln|x| + C$

  
  
* $\int e^x dx = e^x + C$

  
  
* $\int \sin x dx = -\cos x + C \quad ; \quad \int \cos x dx = \sin x + C$

  
  
* $\int \tan x dx = -\ln|\cos x| + C$

  
  
* $\int \frac{1}{a^2+x^2} dx = \frac{1}{a}\arctan\left(\frac{x}{a}\right) + C$

  

  
  
* $\int \frac{1}{\sqrt{a^2-x^2}} dx = \arcsin\left(\frac{x}{a}\right) + C$

  
  

---

## 四、 常微分方程 (Differential Equations)

### 1. 一阶线性微分方程
标准形式：$$y' + P(x)y = Q(x)$$
**通解公式 (利用积分因子法)**：
$$
y = e^{-\int P(x) dx} \left( \int Q(x) e^{\int P(x) dx} dx + C \right)
$$


### 2. 二阶常系数齐次线性微分方程
标准形式：$y'' + py' + qy = 0$
写出特征方程：$r^2 + pr + q = 0$
根据判别式 $\Delta = p^2 - 4q$ 分类：

1. **$\Delta > 0$** (两个不相等的实根 $r_1, r_2$)：$y = C_1 e^{r_1 x} + C_2 e^{r_2 x}$

   
   
2. **$\Delta = 0$** (两个相等的实根 $r_1 = r_2 = r$)：$y = (C_1 + C_2 x) e^{r x}$

   
   
3. **$\Delta < 0$** (一对共轭复根 $\alpha \pm i\beta$)：$y = e^{\alpha x} (C_1 \cos \beta x + C_2 \sin \beta x)$

   
   

---

## 五、 多元函数微积分 (Multivariable Calculus)

### 1. 偏导数与全微分
* **偏导数 (Partial Derivative)**：例如对 $x$ 求偏导 $\frac{\partial f}{\partial x}$ 时，将 $y$ 视为常数。
* **全微分 (Total Differential)**：$dz = \frac{\partial f}{\partial x} dx + \frac{\partial f}{\partial y} dy$
* **梯度 (Gradient)**：指向函数增加最快的方向：
  $$
  \nabla f = \left( \frac{\partial f}{\partial x}, \frac{\partial f}{\partial y}, \frac{\partial f}{\partial z} \right)
  $$
  

### 2. 多重积分换元公式
* **极坐标下的二重积分** (令 $x = r\cos\theta$, $y = r\sin\theta$)，面积元素 $dx dy = r \, dr d\theta$：
  $$\iint_D f(x,y) dx dy = \iint_{D'} f(r\cos\theta, r\sin\theta) r \, dr d\theta$$

### 3. 三大核心向量积分定理
这些定理将高维积分转化为低维积分（或其边界的积分）：
* **格林公式 (Green's Theorem)** (平面区域与环路积分)：
  $$
  \iint_D \left( \frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y} \right) dx dy = \oint_L P \, dx + Q \, dy
  $$
  
* **高斯公式 (Divergence Theorem / Gauss's Theorem)** (空间体积分与闭合曲面积分)：
  $$
  \iiint_\Omega \left( \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y} + \frac{\partial R}{\partial z} \right) dv = \iint_\Sigma P \, dy dz + Q \, dz dx + R \, dx dy
  $$
  
* **斯托克斯公式 (Stokes' Theorem)** (空间曲面积分与空间环路积分)：将旋度的曲面积分转化为边界曲线积分。

---

## 六、 无穷级数 (Infinite Series)

### 1. 泰勒/麦克劳林级数常用展开式
在 $x=0$ 处的展开（Maclaurin Series：



* 
  $$
  e^x= 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots = \sum_{n=0}^{\infty} \frac{x^n}{n!} \quad (x \in \mathbb{R})
  $$
  
  
  
  
  
* 
  $$
  \sin x= x - \frac{x^3}{3!} + \frac{x^5}{5!} - \cdots = \sum_{n=0}^{\infty} \frac{(-1)^n x^{2n+1}}{(2n+1)!} \quad (x \in \mathbb{R})
  $$
  
  
  
  
  
* 
  $$
  \cos x= 1 - \frac{x^2}{2!} + \frac{x^4}{4!} - \cdots = \sum_{n=0}^{\infty} \frac{(-1)^n x^{2n}}{(2n)!} \quad (x \in \mathbb{R})
  $$
  
  
  
  
  
* 
  $$
  \frac{1}{1-x}= 1 + x + x^2 + x^3 + \cdots = \sum_{n=0}^{\infty} x^n \quad (|x| < 1)
  $$
  
  
  
  
  
* $$
  \ln(1+x)= x - \frac{x^2}{2} + \frac{x^3}{3} - \cdots = \sum_{n=1}^{\infty} \frac{(-1)^{n-1} x^n}{n} \quad (-1 < x \le 1)
  $$

  

  
  
  
  

### 2. 级数收敛判别法 (正项级数)
* **比值审敛法 (d'Alembert's Test)**：
  计算 $\rho = \lim_{n \to \infty} \frac{u_{n+1}}{u_n}$。如果 $\rho < 1$ 则绝对收敛，$\rho > 1$ 则发散，$\rho = 1$ 则失效。
* **根值审敛法 (Cauchy's Root Test)**：
  计算 $\rho = \lim_{n \to \infty} \sqrt[n]{u_n}$。判别标准同比值审敛法。