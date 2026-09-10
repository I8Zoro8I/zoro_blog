import type {CategoryConfig} from './types';

export const llmApplicationCategory = {
  "name": "大模型应用开发",
  "id": "LLMApplication",
  "icon": "🤖",
  "children": [
    {
      "title": "工具导航与参考资料索引",
      "url": "/column/AIAgent/工具导航与参考资料索引",
      "visible": true
    },
    {
      "name": "大模型基础能力构建",
      "links": [
        {
          "title": "第一章 认知与工程概览",
          "url": "/column/AIAgent/01-大模型基础能力构建/01-认知与工程概览",
          "visible": true
        },
        {
          "title": "第二章 提示词工程基础",
          "url": "/column/AIAgent/01-大模型基础能力构建/02-提示词工程基础",
          "visible": true
        },
        {
          "title": "第三章 RAG、微调、续训与智能体选型",
          "url": "/column/AIAgent/01-大模型基础能力构建/03-RAG、微调、续训与智能体选型",
          "visible": true
        },
        {
          "title": "第四章 RAG搭建企业私有&个人知识库",
          "url": "/column/AIAgent/01-大模型基础能力构建/04-RAG搭建企业私有&个人知识库",
          "visible": true
        }
      ],
      "visible": true
    },
    {
      "name": "企业低代码平台开发与项目实战",
      "links": [
        {
          "title": "第一章 基于Coze&Dify的智能体开发",
          "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/01-基于Coze&Dify的智能体开发",
          "visible": true
        },
        {
          "title": "第二章 工作流智能体案例与源码",
          "items": [
            {
              "title": "第一章 一键生成行业调研PPT(Coze)",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/工作流智能体案例与源码/01-一键生成行业调研PPT(Coze)",
              "visible": true
            },
            {
              "title": "第二章 复刻爆款视频(Coze)",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/工作流智能体案例与源码/02-复刻爆款视频(Coze)",
              "visible": true
            },
            {
              "title": "第三章 产品营销海报生成(Coze)",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/工作流智能体案例与源码/03-产品营销海报生成(Coze)",
              "visible": true
            },
            {
              "title": "第四章 一键生成行业调研报告(Dify)",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/工作流智能体案例与源码/04-一键生成行业调研报告(Dify)",
              "visible": true
            },
            {
              "title": "第五章 客户投诉分类助手(Dify)",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/工作流智能体案例与源码/05-客户投诉分类助手(Dify)",
              "visible": true
            },
            {
              "title": "第六章 客服对话记录分析(Coze)",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/工作流智能体案例与源码/06-客服对话记录分析(Coze)",
              "visible": true
            },
            {
              "title": "第七章 客服对话记录分析(Dify)",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/工作流智能体案例与源码/07-客服对话记录分析(Dify)",
              "visible": true
            },
            {
              "title": "第八章 商品评论分析(Coze)",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/工作流智能体案例与源码/08-商品评论分析(Coze)",
              "visible": true
            },
            {
              "title": "第九章 商品评论分析(Dify)",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/工作流智能体案例与源码/09-商品评论分析(Dify)",
              "visible": true
            },
            {
              "title": "第十章 商品营销卖点提炼(Coze)",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/工作流智能体案例与源码/10-商品营销卖点提炼(Coze)",
              "visible": true
            }
          ],
          "visible": true
        },
        {
          "title": "第三章 智能体的调用与部署",
          "items": [
            {
              "title": "第一章 Python调用Dify平台工作流",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/智能体的调用与部署/02-Python调用Dify平台工作流",
              "visible": true
            },
            {
              "title": "第二章 Python调用Coze平台工作流",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/智能体的调用与部署/03-Python调用Coze平台工作流",
              "visible": true
            },
            {
              "title": "第三章 Coze与Dify的Windows平台部署",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/智能体的调用与部署/04-Coze与Dify的Windows平台部署",
              "visible": true
            },
            {
              "title": "第四章 企业级大模型部署",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/智能体的调用与部署/05-企业级大模型部署",
              "visible": true
            },
            {
              "title": "第五章 Docker快速入门与Dify部署排障",
              "url": "/column/AIAgent/02-企业低代码平台开发与项目实战/智能体的调用与部署/06-Docker快速入门与Dify部署排障",
              "visible": true
            }
          ],
          "visible": true
        }
      ],
      "visible": true
    },
    {
      "name": "大模型核心开发框架",
      "links": [
        {
          "title": "第一章 LangChain概述与架构",
          "url": "/column/AIAgent/03-大模型核心开发框架/01-LangChain概述与架构",
          "visible": true
        },
        {
          "title": "第二章 LangChain快速上手与HelloWorld",
          "url": "/column/AIAgent/03-大模型核心开发框架/02-LangChain快速上手与HelloWorld",
          "visible": true
        },
        {
          "title": "第三章 Model IO与模型接入",
          "url": "/column/AIAgent/03-大模型核心开发框架/03-Model IO与模型接入",
          "visible": true
        },
        {
          "title": "第四章 Ollama本地部署与调用",
          "url": "/column/AIAgent/03-大模型核心开发框架/04-Ollama本地部署与调用",
          "visible": true
        },
        {
          "title": "第五章 提示词与消息模板",
          "url": "/column/AIAgent/03-大模型核心开发框架/05-提示词与消息模板",
          "visible": true
        },
        {
          "title": "第六章 输出解析器",
          "url": "/column/AIAgent/03-大模型核心开发框架/06-输出解析器",
          "visible": true
        },
        {
          "title": "第七章 LCEL与链式调用",
          "url": "/column/AIAgent/03-大模型核心开发框架/07-LCEL与链式调用",
          "visible": true
        },
        {
          "title": "第八章 记忆与对话历史",
          "url": "/column/AIAgent/03-大模型核心开发框架/08-记忆与对话历史",
          "visible": true
        },
        {
          "title": "第九章 Tools工具调用",
          "url": "/column/AIAgent/03-大模型核心开发框架/09-Tools工具调用",
          "visible": true
        },
        {
          "title": "第十章 向量数据库与Embedding实战",
          "url": "/column/AIAgent/03-大模型核心开发框架/10-向量数据库与Embedding实战",
          "visible": true
        },
        {
          "title": "第十一章 RAG检索增强生成",
          "url": "/column/AIAgent/03-大模型核心开发框架/11-RAG检索增强生成",
          "visible": true
        },
        {
          "title": "第十二章 MCP模型上下文协议",
          "url": "/column/AIAgent/03-大模型核心开发框架/12-MCP模型上下文协议",
          "visible": true
        },
        {
          "title": "第十三章 Agent智能体",
          "url": "/column/AIAgent/03-大模型核心开发框架/13-Agent智能体",
          "visible": true
        },
        {
          "title": "第十四章 LangGraph概述与快速入门",
          "url": "/column/AIAgent/03-大模型核心开发框架/14-LangGraph概述与快速入门",
          "visible": true
        },
        {
          "title": "第十五章 LangGraph API:图与状态",
          "url": "/column/AIAgent/03-大模型核心开发框架/15-LangGraph API:图与状态",
          "visible": true
        },
        {
          "title": "第十六章 LangGraphAPI：节点、边与进阶",
          "url": "/column/AIAgent/03-大模型核心开发框架/16-LangGraphAPI：节点、边与进阶",
          "visible": true
        },
        {
          "title": "第十七章 LangGraph高级特性",
          "url": "/column/AIAgent/03-大模型核心开发框架/17-LangGraph高级特性",
          "visible": true
        },
        {
          "title": "第十八章 LangGraph多智能体与A2A",
          "url": "/column/AIAgent/03-大模型核心开发框架/18-LangGraph多智能体与A2A",
          "visible": true
        },
        {
          "title": "第十九章 Skills技能与AI编程工程实践",
          "url": "/column/AIAgent/03-大模型核心开发框架/19-Skills技能与AI编程工程实践",
          "visible": true
        }
      ],
      "visible": true
    },
    {
      "name": "大模型微调实践",
      "links": [
        {
          "title": "第一章 大模型微调概述与整体流程",
          "url": "/column/AIAgent/04-大模型微调实践/01-大模型微调概述与整体流程",
          "visible": true
        }
      ],
      "visible": false
    },
    {
      "name": "企业级项目实战",
      "links": [
        {
          "title": "第一章 电商问数",
          "items": [
            {
              "title": "第一章 前言",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/00-前言",
              "visible": true
            },
            {
              "title": "第二章 项目概述与数仓基础",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/01-项目概述与数仓基础",
              "visible": true
            },
            {
              "title": "第三章 项目整体架构与智能体流程",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/02-项目整体架构与智能体流程",
              "visible": true
            },
            {
              "title": "第四章 开发环境与基础服务准备",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/03-开发环境与基础服务准备",
              "visible": true
            },
            {
              "title": "第五章 项目结构与基础服务配置管理",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/04-项目结构与基础服务配置管理",
              "visible": true
            },
            {
              "title": "第六章 Qdrant与ES快速入门与接入",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/05-Qdrant与ES快速入门与接入",
              "visible": true
            },
            {
              "title": "第七章 MySQL、Embedding 接入与日志管理",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/06-MySQL、Embedding 接入与日志管理",
              "visible": true
            },
            {
              "title": "第八章 元数据知识库总览与构建入口",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/07-元数据知识库总览与构建入口",
              "visible": true
            },
            {
              "title": "第九章 表与字段信息同步到元数据库",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/08-表与字段信息同步到元数据库",
              "visible": true
            },
            {
              "title": "第十章 字段与指标检索能力构建",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/09-字段与指标检索能力构建",
              "visible": true
            },
            {
              "title": "第十一章 问数智能体总览与工作流骨架",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/10-问数智能体总览与工作流骨架",
              "visible": true
            },
            {
              "title": "第十二章 关键词抽取与多路召回",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/11-关键词抽取与多路召回",
              "visible": true
            },
            {
              "title": "第十三章 召回信息合并与上下文构建",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/12-召回信息合并与上下文构建",
              "visible": true
            },
            {
              "title": "第十四章 SQL 生成前的信息过滤与补全",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/13-SQL 生成前的信息过滤与补全",
              "visible": true
            },
            {
              "title": "第十五章 SQL 生成与执行闭环",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/14-SQL 生成与执行闭环",
              "visible": true
            },
            {
              "title": "第十六章 API 接口基础与 FastAPI 入门",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/15-API 接口基础与 FastAPI 入门",
              "visible": true
            },
            {
              "title": "第十七章 查询接口实现与依赖组装",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/16-查询接口实现与依赖组装",
              "visible": true
            },
            {
              "title": "第十八章 前后端联调与日志追踪",
              "url": "/column/AIAgent/05-企业级项目实战/01-电商问数/17-前后端联调与日志追踪",
              "visible": true
            }
          ],
          "visible": true
        },
        {
          "title": "第二章 深度研搜",
          "items": [
            {
              "title": "第一章 前言",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/00-前言",
              "visible": true
            },
            {
              "title": "第二章 DeepAgents 基础与核心概念",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/01-DeepAgents 基础与核心概念",
              "visible": true
            },
            {
              "title": "第三章 DeepAgents 快速入门与流式解析",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/02-DeepAgents 快速入门与流式解析",
              "visible": true
            },
            {
              "title": "第四章 子智能体进阶与异步执行",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/03-子智能体进阶与异步执行",
              "visible": true
            },
            {
              "title": "第五章 接入 LangGraph 与 LangChain",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/04-接入 LangGraph 与 LangChain",
              "visible": true
            },
            {
              "title": "第六章 人机协作与中断恢复",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/05-人机协作与中断恢复",
              "visible": true
            },
            {
              "title": "第七章 长期记忆与 Backend 存储",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/06-长期记忆与 Backend 存储",
              "visible": true
            },
            {
              "title": "第八章 中间件机制与 Skills 配置",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/07-中间件机制与 Skills 配置",
              "visible": true
            },
            {
              "title": "第九章 项目总览与工程初始化",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/08-项目总览与工程初始化",
              "visible": true
            },
            {
              "title": "第十章 基础模块与模型配置",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/09-基础模块与模型配置",
              "visible": true
            },
            {
              "title": "第十一章 网络搜索子智能体与Tavily工具",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/10-网络搜索子智能体与Tavily工具",
              "visible": true
            },
            {
              "title": "第十二章 数据库查询子智能体与MySQL工具",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/11-数据库查询子智能体与MySQL工具",
              "visible": true
            },
            {
              "title": "第十三章 RAGFlow 子智能体与知识库准备",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/12-RAGFlow 子智能体与知识库准备",
              "visible": true
            },
            {
              "title": "第十四章 主智能体搭建与异步执行",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/13-主智能体搭建与异步执行",
              "visible": true
            },
            {
              "title": "第十五章 FastAPI 接口与项目闭环",
              "url": "/column/AIAgent/05-企业级项目实战/02-深度研搜/14-FastAPI 接口与项目闭环",
              "visible": true
            }
          ],
          "visible": true
        }
      ],
      "visible": false
    }
  ],
  "visible": true
} satisfies CategoryConfig;

