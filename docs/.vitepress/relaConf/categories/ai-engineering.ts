import type {CategoryConfig} from './types';

export const aiEngineeringCategory = {
  "name": "AI工程与智能开发",
  "id": "机器学习",
  "icon": "🧠",
  "children": [
    {
      "name": "机器学习",
      "links": [
        {
          "title": "01. 从零开始：机器学习到底是什么？",
          "items": [
            {
              "title": "机器学习全景简介",
              "url": "/column/AI/MachineLearning/1-机器学习简介",
              "visible": true
            },
            {
              "title": "项目全生命周期演进",
              "url": "/column/AI/MachineLearning/2-机器学习生命周期",
              "visible": true
            }
          ],
          "visible": true
        },
        {
          "title": "02. 避坑前置：逃不掉的数学童子功",
          "items": [
            {
              "title": "线性代数基础演练",
              "url": "/column/AI/math/01linearAlgebra",
              "visible": true
            },
            {
              "title": "概率论与数理统计",
              "url": "/column/AI/math/02ProbabilityTheory",
              "visible": true
            },
            {
              "title": "微积分与最优化原理",
              "url": "/column/AI/math/03Calculus",
              "visible": true
            }
          ],
          "visible": true
        },
        {
          "title": "03. 巧妇难为无米之炊：数据清洗与特征绝活",
          "items": [
            {
              "title": "数据理解",
              "url": "/column/AI/MachineLearning/data/01数据理解",
              "visible": true
            },
            {
              "title": "数据清洗",
              "url": "/column/AI/MachineLearning/data/02数据清洗",
              "visible": true
            },
            {
              "title": "特征工程",
              "url": "/column/AI/MachineLearning/data/03特征工程",
              "visible": true
            },
            {
              "title": "数据可视化",
              "url": "/column/AI/MachineLearning/data/04数据可视化",
              "visible": true
            },
            {
              "title": "数据集划分",
              "url": "/column/AI/MachineLearning/data/05数据集划分",
              "visible": true
            },
            {
              "title": "统计学基础",
              "url": "/column/AI/MachineLearning/data/06统计学基础",
              "visible": true
            },
            {
              "title": "概率思维",
              "url": "/column/AI/MachineLearning/data/07概率思维",
              "visible": true
            },
            {
              "title": "损失函数与梯度",
              "url": "/column/AI/MachineLearning/data/08损失函数与梯度",
              "visible": true
            },
            {
              "title": "过拟合.欠拟合.偏差与方差",
              "url": "/column/AI/MachineLearning/data/09过拟合.欠拟合.偏差与方差",
              "visible": true
            }
          ],
          "visible": true
        },
        {
          "title": "04. 降维打击：经典算法与强化学习大杂烩",
          "remark": "🌟 核心合并：传统经典算法 + 强化学习 完美合体",
          "items": [
            {
              "title": "大纲",
              "url": "/column/AI/MachineLearning/algorithm/01大纲",
              "visible": true
            },
            {
              "title": "线性回归",
              "url": "/column/AI/MachineLearning/algorithm/02线性回归",
              "visible": true
            },
            {
              "title": "多元线性回归",
              "url": "/column/AI/MachineLearning/algorithm/03多元线性回归",
              "visible": true
            },
            {
              "title": "多项式回归",
              "url": "/column/AI/MachineLearning/algorithm/04多项式回归",
              "visible": true
            },
            {
              "title": "逻辑回归",
              "url": "/column/AI/MachineLearning/algorithm/05逻辑回归",
              "visible": true
            },
            {
              "title": "回归模型评估",
              "url": "/column/AI/MachineLearning/algorithm/06回归模型评估",
              "visible": true
            },
            {
              "title": "决策树",
              "url": "/column/AI/MachineLearning/algorithm/07决策树",
              "visible": true
            },
            {
              "title": "支持向量机",
              "url": "/column/AI/MachineLearning/algorithm/08支持向量机",
              "visible": true
            },
            {
              "title": "K近邻算法",
              "url": "/column/AI/MachineLearning/algorithm/09K近邻算法",
              "visible": true
            },
            {
              "title": "集成学习",
              "url": "/column/AI/MachineLearning/algorithm/10集成学习",
              "visible": true
            },
            {
              "title": "朴素贝叶斯",
              "url": "/column/AI/MachineLearning/algorithm/11朴素贝叶斯",
              "visible": true
            },
            {
              "title": "随机森林",
              "url": "/column/AI/MachineLearning/algorithm/12随机森林",
              "visible": true
            },
            {
              "title": "分类指标",
              "url": "/column/AI/MachineLearning/algorithm/13分类指标",
              "visible": true
            },
            {
              "title": "无监督学习-聚类",
              "url": "/column/AI/MachineLearning/algorithm/14无监督学习-聚类",
              "visible": true
            },
            {
              "title": "无监督学习-降维",
              "url": "/column/AI/MachineLearning/algorithm/15无监督学习-降维",
              "visible": true
            },
            {
              "title": "强化学习基本框架",
              "url": "/column/AI/MachineLearning/algorithm/16强化学习基本框架",
              "visible": true
            },
            {
              "title": "强化学习探索VS开采",
              "url": "/column/AI/MachineLearning/algorithm/17强化学习探索VS开采",
              "visible": true
            },
            {
              "title": "强化学习Q-learning与SARSA",
              "url": "/column/AI/MachineLearning/algorithm/18强化学习Q-learning与SARSA",
              "visible": true
            },
            {
              "title": "深度强化学习",
              "url": "/column/AI/MachineLearning/algorithm/19深度强化学习",
              "visible": true
            },
            {
              "title": "神经网络的基本结构",
              "url": "/column/AI/MachineLearning/algorithm/20神经网络的基本结构",
              "visible": true
            },
            {
              "title": "前向传播与反向传播",
              "url": "/column/AI/MachineLearning/algorithm/21前向传播与反向传播",
              "visible": true
            },
            {
              "title": "深度学习VS传统机器学习",
              "url": "/column/AI/MachineLearning/algorithm/22深度学习VS传统机器学习",
              "visible": true
            },
            {
              "title": "常见网络类型",
              "url": "/column/AI/MachineLearning/algorithm/23常见网络类型",
              "visible": true
            }
          ],
          "visible": true
        },
        {
          "title": "05. 临门一脚：模型调优与线上干货",
          "items": [
            {
              "title": "交叉验证",
              "url": "/column/AI/MachineLearning/model/01交叉验证",
              "visible": true
            },
            {
              "title": "正则化",
              "url": "/column/AI/MachineLearning/model/02正则化",
              "visible": true
            },
            {
              "title": "数据泄露",
              "url": "/column/AI/MachineLearning/model/03数据泄露",
              "visible": true
            },
            {
              "title": "集成方法",
              "url": "/column/AI/MachineLearning/model/04集成方法",
              "visible": true
            },
            {
              "title": "超参搜索",
              "url": "/column/AI/MachineLearning/model/05超参搜索",
              "visible": true
            },
            {
              "title": "MLOps概念",
              "url": "/column/AI/MachineLearning/model/06MLOps概念",
              "visible": true
            },
            {
              "title": "常见问题排查",
              "url": "/column/AI/MachineLearning/model/07常见问题排查",
              "visible": true
            }
          ],
          "visible": true
        },
        {
          "title": "06. 爽文剧本：刷爆 Kaggle 的经典实战案例",
          "items": [
            {
              "title": "练手小项目-1-泰坦尼克号生存",
              "url": "/column/AI/MachineLearning/project/01泰坦尼克号",
              "visible": true
            },
            {
              "title": "练手小项目-2-房价预测",
              "url": "/column/AI/MachineLearning/project/02预测房价",
              "visible": true
            },
            {
              "title": "kaggle项目-3-黑神话悟空用户分析",
              "url": "/column/AI/MachineLearning/project/03客户分群",
              "visible": true
            },
            {
              "title": "练手小项目-4-PCA可视化",
              "url": "/column/AI/MachineLearning/project/04PCA可视化",
              "visible": true
            },
            {
              "title": "练手小项目-5-强化学习悬崖寻路",
              "url": "/column/AI/MachineLearning/project/05强化学习-悬崖寻路",
              "visible": true
            },
            {
              "title": "kaggle项目-6-VALORANT比赛预测胜负",
              "url": "/column/AI/MachineLearning/project/06VCT预测胜负",
              "visible": true
            }
          ],
          "visible": true
        }
      ],
      "visible": true
    },
    {
      "name": "Python 基础",
      "links": [
        {
          "title": "01- 简介与环境配置",
          "url": "/column/AI/python/01环境",
          "visible": true
        },
        {
          "title": "02- 核心语法与数据类型",
          "url": "/column/AI/python/02语法&数据",
          "visible": true
        },
        {
          "title": "03- 运算符全解",
          "url": "/column/AI/python/03运算符",
          "visible": true
        },
        {
          "title": "04- 核心推导式",
          "url": "/column/AI/python/04推导式",
          "visible": true
        },
        {
          "title": "05- 迭代器与生成器",
          "url": "/column/AI/python/05迭代器与生成器",
          "visible": true
        },
        {
          "title": "06- With 上下文管理器",
          "url": "/column/AI/python/06With",
          "visible": true
        },
        {
          "title": "07- 函数式编程",
          "url": "/column/AI/python/07函数",
          "visible": true
        },
        {
          "title": "08- 闭包与装饰器",
          "url": "/column/AI/python/08装饰器",
          "visible": true
        },
        {
          "title": "09- File & OS 文件操作",
          "url": "/column/AI/python/09File&OS",
          "visible": true
        },
        {
          "title": "10- 面向对象编程 (OOP)",
          "url": "/column/AI/python/10面对对象",
          "visible": true
        }
      ],
      "visible": true
    },
    {
      "name": "NumPy 科学计算",
      "links": [
        {
          "title": "01- Ndarray 核心对象",
          "url": "/column/AI/Numpy/01Ndarray",
          "visible": true
        },
        {
          "title": "02- 基础数据类型",
          "url": "/column/AI/Numpy/02数据类型",
          "visible": true
        },
        {
          "title": "03- 数组创建与操作",
          "url": "/column/AI/Numpy/03数组",
          "visible": true
        },
        {
          "title": "04- 切片与高级索引",
          "url": "/column/AI/Numpy/04切片和索引",
          "visible": true
        },
        {
          "title": "05- 广播机制原理",
          "url": "/column/AI/Numpy/05广播",
          "visible": true
        },
        {
          "title": "06- 位运算操作",
          "url": "/column/AI/Numpy/06位运算",
          "visible": true
        },
        {
          "title": "07- 常用数学函数",
          "url": "/column/AI/Numpy/07函数",
          "visible": true
        },
        {
          "title": "08- 内存字节交换",
          "url": "/column/AI/Numpy/08字节交换",
          "visible": true
        },
        {
          "title": "09- 数据副本与视图",
          "url": "/column/AI/Numpy/09副本和视图",
          "visible": true
        },
        {
          "title": "10- Matrix 矩阵库",
          "url": "/column/AI/Numpy/10矩阵库",
          "visible": true
        },
        {
          "title": "11- 线性代数模块",
          "url": "/column/AI/Numpy/11线性代数",
          "visible": true
        },
        {
          "title": "12- NumPy 输入与输出",
          "url": "/column/AI/Numpy/12IO",
          "visible": true
        }
      ],
      "visible": true
    },
    {
      "name": "Pandas 数据分析",
      "links": [
        {
          "title": "01- 框架简介与数据科学",
          "url": "/column/AI/pandas/01简介",
          "visible": true
        },
        {
          "title": "02- Series 一维序列",
          "url": "/column/AI/pandas/02Series",
          "visible": true
        },
        {
          "title": "03- DataFrame 二维表格",
          "url": "/column/AI/pandas/03DataFrame",
          "visible": true
        },
        {
          "title": "04- 高效数据读写总览",
          "url": "/column/AI/pandas/04数据读写",
          "visible": true
        },
        {
          "title": "05- CSV 文本数据交互",
          "url": "/column/AI/pandas/05CSV",
          "visible": true
        },
        {
          "title": "06- Excel 报表交互与联动",
          "url": "/column/AI/pandas/06Excel",
          "visible": true
        },
        {
          "title": "07- JSON 半结构化处理",
          "url": "/column/AI/pandas/07JSON",
          "visible": true
        },
        {
          "title": "08- SQL 关系数据库联通",
          "url": "/column/AI/pandas/08SQL",
          "visible": true
        },
        {
          "title": "09- HTML 网页数据爬取",
          "url": "/column/AI/pandas/09html",
          "visible": true
        },
        {
          "title": "10- Parquet & Feather 大数据流",
          "url": "/column/AI/pandas/10ParquestFeather",
          "visible": true
        },
        {
          "title": "11- 数据导出与归档",
          "url": "/column/AI/pandas/11数据导出",
          "visible": true
        },
        {
          "title": "12- 数据清洗与缺失值处理",
          "url": "/column/AI/pandas/12数据清洗",
          "visible": true
        },
        {
          "title": "13- 常用高频内置函数",
          "url": "/column/AI/pandas/13常用函数",
          "visible": true
        },
        {
          "title": "14- 相关性分析",
          "url": "/column/AI/pandas/14相关性分析",
          "visible": true
        },
        {
          "title": "15- 数据排序、分组与聚合",
          "url": "/column/AI/pandas/15数据排序与聚合",
          "visible": true
        },
        {
          "title": "16- 数据可视化",
          "url": "/column/AI/pandas/16数据可视化",
          "visible": true
        },
        {
          "title": "17- 进阶高级功能探秘",
          "url": "/column/AI/pandas/17高级功能",
          "visible": true
        },
        {
          "title": "18- 性能优化",
          "url": "/column/AI/pandas/18性能优化",
          "visible": true
        },
        {
          "title": "19- 数据选取",
          "url": "/column/AI/pandas/19数据选取",
          "visible": true
        },
        {
          "title": "20- 过滤与条件查询",
          "url": "/column/AI/pandas/20过滤与条件查询",
          "visible": true
        },
        {
          "title": "21- 电商数据分析Demo",
          "url": "/column/AI/pandas/21电商数据分析小Demo",
          "visible": true
        }
      ],
      "visible": true
    },
    {
      "name": "pyTorch 深度学习框架",
      "links": [
        {
          "title": "简介",
          "url": "/column/AI/pyTorch/0-简介",
          "visible": true
        },
        {
          "title": "张量",
          "url": "/column/AI/pyTorch/1-张量",
          "visible": true
        },
        {
          "title": "神经网络基础",
          "url": "/column/AI/pyTorch/2-神经网络基础",
          "visible": true
        },
        {
          "title": "数据处理与加载",
          "url": "/column/AI/pyTorch/03数据处理与加载",
          "visible": true
        },
        {
          "title": "线性回归",
          "url": "/column/AI/pyTorch/04线性回归",
          "visible": true
        },
        {
          "title": "卷积神经网络CNN",
          "url": "/column/AI/pyTorch/05卷积神经网络",
          "visible": true
        },
        {
          "title": "循环神经网络RNN",
          "url": "/column/AI/pyTorch/06循环神经网络",
          "visible": true
        },
        {
          "title": "数据集",
          "url": "/column/AI/pyTorch/07数据集",
          "visible": true
        },
        {
          "title": "数据转换",
          "url": "/column/AI/pyTorch/08数据转换",
          "visible": true
        },
        {
          "title": "torch 参考手册",
          "url": "/column/AI/pyTorch/09torch",
          "visible": true
        },
        {
          "title": "torch.nn 参考手册",
          "url": "/column/AI/pyTorch/10torch.nn",
          "visible": true
        },
        {
          "title": "Transformer模型介绍",
          "url": "/column/AI/pyTorch/11Transformer",
          "visible": true
        },
        {
          "title": "Transformer模型构建",
          "url": "/column/AI/pyTorch/12Transformer2",
          "visible": true
        },
        {
          "title": "Transformer模型构建",
          "url": "/column/AI/pyTorch/12Transformer2",
          "visible": true
        },
        {
          "title": "torch.optim优化器",
          "url": "/column/AI/pyTorch/13optim",
          "visible": true
        },
        {
          "title": "torchvision计算机视觉模块",
          "url": "/column/AI/pyTorch/14torchvision",
          "visible": true
        },
        {
          "title": "模型部署",
          "url": "/column/AI/pyTorch/15模型部署",
          "visible": true
        },
        {
          "title": "模型保存和加载",
          "url": "/column/AI/pyTorch/16模型保存和加载",
          "visible": true
        },
        {
          "title": "示例->图像分类",
          "url": "/column/AI/pyTorch/17图像分类",
          "visible": true
        },
        {
          "title": "示例->文本情感分析",
          "url": "/column/AI/pyTorch/18文本情感分析",
          "visible": true
        },
        {
          "title": "Autograd自动微分",
          "url": "/column/AI/pyTorch/19Autograd",
          "visible": true
        },
        {
          "title": "GPU CUDA加速",
          "url": "/column/AI/pyTorch/20GPUCUDA加速",
          "visible": true
        },
        {
          "title": "损失函数",
          "url": "/column/AI/pyTorch/21损失函数",
          "visible": true
        },
        {
          "title": "学习率调度器",
          "url": "/column/AI/pyTorch/22学习率调度器",
          "visible": true
        },
        {
          "title": "迁移学习",
          "url": "/column/AI/pyTorch/23迁移学习",
          "visible": true
        },
        {
          "title": "批归一化与Dropout",
          "url": "/column/AI/pyTorch/24批归一化与dropout",
          "visible": true
        },
        {
          "title": "LSTM / GRU",
          "url": "/column/AI/pyTorch/25LSTMGRU",
          "visible": true
        },
        {
          "title": "词嵌入(Embedding)",
          "url": "/column/AI/pyTorch/26词嵌入",
          "visible": true
        },
        {
          "title": "生成对抗网络(GAN)",
          "url": "/column/AI/pyTorch/27生成对抗网络",
          "visible": true
        },
        {
          "title": "自动编码(Autoencoder)",
          "url": "/column/AI/pyTorch/28自动编码",
          "visible": true
        },
        {
          "title": "模型评估与调试",
          "url": "/column/AI/pyTorch/29模型评估与调试",
          "visible": true
        },
        {
          "title": "torchtext",
          "url": "/column/AI/pyTorch/30torchtext",
          "visible": true
        },
        {
          "title": "混合精度训练",
          "url": "/column/AI/pyTorch/31混合精度训练",
          "visible": true
        },
        {
          "title": "TorchScriptONNX导出",
          "url": "/column/AI/pyTorch/32TorchScriptONNX导出",
          "visible": true
        },
        {
          "title": "分布式训练",
          "url": "/column/AI/pyTorch/33分布式训练",
          "visible": true
        },
        {
          "title": "注意力机制",
          "url": "/column/AI/pyTorch/34注意力机制",
          "visible": true
        },
        {
          "title": "番外-计算机视觉识别烟叶种类与物联网控制",
          "url": "/column/AI/pyTorch/番外-视觉识别烟叶种类",
          "visible": true
        }
      ],
      "visible": true
    },
    {
      "name": "PySpark",
      "links": [
        {
          "title": "简介与安装",
          "url": "/column/AI/ApacheSpark/pySpark/01简介与安装",
          "visible": true
        },
        {
          "title": "快速入门: DataFrame",
          "url": "/column/AI/ApacheSpark/pySpark/02快速入门DataFrame",
          "visible": true
        },
        {
          "title": "快速入门: Spark Connect",
          "url": "/column/AI/ApacheSpark/pySpark/03快速入门SparkConnect",
          "visible": true
        },
        {
          "title": "快速入门: Spark上的Pandas API ",
          "url": "/column/AI/ApacheSpark/pySpark/04快速入门PandasAPI",
          "visible": true
        },
        {
          "title": "实战: PySpark 230万客户数据 ",
          "url": "/column/AI/ApacheSpark/pySpark/05实战客户分析",
          "visible": true
        }
      ],
      "visible": true
    }
  ],
  "visible": true
} satisfies CategoryConfig;

