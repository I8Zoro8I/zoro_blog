import type {CategoryConfig} from './types';

export const troubleshootingCategory = {
  "name": "技术踩坑",
  "id": "question",
  "icon": "🛠️",
  "children": [
    {
      "name": "PM2 进程管理",
      "links": [
        {
          "title": "PM2 跟随 NVM 切换 Node 版本",
          "url": "/column/question/pm2/001_nvm跟随版本",
          "visible": true
        },
        {
          "title": "PM2 List 列表显示端口号技巧",
          "url": "/column/question/pm2/002_list显示端口号",
          "visible": true
        }
      ],
      "visible": true
    },
    {
      "name": "python相关",
      "links": [
        {
          "title": "终端命令-miniconda虚拟环境创建并且激活",
          "url": "/column/question/python/终端命令miniconda虚拟环境创建并且激活",
          "visible": true
        }
      ],
      "visible": true
    }
  ],
  "visible": true
} satisfies CategoryConfig;

