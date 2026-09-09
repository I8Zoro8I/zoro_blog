import type {CategoryConfig} from './types';

export const backendCategory = {
  "name": "后端与数据库",
  "id": "technology",
  "icon": "🗄️",
  "children": [
    {
      "name": "PostgreSQL",
      "links": [
        {
          "title": "pgSQL终端命令",
          "url": "/column/pgsql/001_linux命令",
          "visible": true
        },
        {
          "title": "全文检索 & 表分区",
          "url": "/column/pgsql/002_全文检索&表分区",
          "visible": true
        },
        {
          "title": "分布式数据库架构",
          "url": "/column/pgsql/003_分布式库",
          "visible": true
        },
        {
          "title": "通用 SQL 函数指南",
          "url": "/column/pgsql/004_通用函数sql",
          "visible": true
        }
      ],
      "visible": true
    }
  ],
  "visible": true
} satisfies CategoryConfig;

