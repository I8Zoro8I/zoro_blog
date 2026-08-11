---
date: 2026年05月28日
---

```bash
# 创建虚拟环境（会多出一个 .venv 文件夹）；推荐使用 Python 3.10
python3.10 -m venv .venv
# 激活虚拟环境
# Windows（CMD）：
.venv\Scripts\activate
# Windows（PowerShell）：
.venv\Scripts\Activate.ps1
# macOS / Linux：
source .venv/bin/activate

```

mac:第一步：确认 Conda 是否存在

执行：

```
ls /Users/solot/miniconda3/bin/conda
```

如果输出类似：

```
/Users/solot/miniconda3/bin/conda
```

说明 Conda 本体是存在的。

------

## 第二步：直接使用 Conda

先不用管 PATH，直接执行：

```
/Users/solot/miniconda3/bin/conda --version
```

如果能看到：

```
conda 25.x.x
```

说明安装完全正常。

------

## 第三步：初始化 zsh（推荐）

执行：

```
/Users/solot/miniconda3/bin/conda init zsh
```

然后：

```
exec zsh
```

或者直接关闭终端重新打开。

再执行：

```
conda --version
```

一般就正常了。

------

## 如果 `conda init` 也不能用

手动把 Miniconda 加到 PATH：

编辑：

```
nano ~/.zshrc
```

最后添加一行：

```
export PATH="/Users/solot/miniconda3/bin:$PATH"
```

保存退出（`Ctrl + O`、回车、`Ctrl + X`），然后执行：

```
source ~/.zshrc
```

再测试：

```
conda --version
```

------

## 然后创建 Python 3.12 环境

```
conda create -n ai-agents python=3.12
conda activate ai-agents
python --version
```

应该就是：

```
Python 3.12.x
```

之后再：

```
pip install -r requirements.txt
```

你现在**同时激活了两个环境**：

```
(ai-agents) (.venv)
```

正常情况下应该只有一个，例如：

```
(ai-agents)
```

`.venv` 把 Conda 的 Python 覆盖掉了，所以 `python` 仍然指向：

```
Python 3.14.2
```

## 先确认一下

执行下面三个命令：

```
which python
which pip
echo $CONDA_PREFIX
```

我预计会看到类似：

```
which python
/Users/solot/.../.venv/bin/python
```

而不是：

```
/Users/solot/miniconda3/envs/ai-agents/bin/python
```

------

## 解决方法一（推荐）

退出 `.venv`：

```
deactivate
```

如果还有 `.venv`，再执行一次：

```
deactivate
```

直到终端前面只剩：

```
(base)
```

或者什么都没有。

然后重新：

```
conda activate ai-agents
```

此时应该变成：

```
(ai-agents)
```

再检查：

```
python --version
```

应该就是：

```
Python 3.10.20
```

------

## 解决方法二（如果 deactivate 不行）

直接关闭当前 Terminal 标签，新开一个 Terminal。

进入项目：

```
cd ai-agents-from-zero
```

然后：

```
conda activate ai-agents
python --version
which python
```

------

## 解决方法三（PyCharm）

如果你是在 **PyCharm 自带 Terminal** 里操作，很可能 IDE 自动激活了 `.venv`。

进入：

> **Settings → Tools → Terminal**

看看是否勾选了：

```
Activate virtualenv
```

或者项目解释器仍然是：

```
.venv/bin/python
```

如果是，就会出现 `(ai-agents) (.venv)` 这种情况。

把项目解释器改成：

```
/Users/solot/miniconda3/envs/ai-agents/bin/python
```

即可。

------

### 
