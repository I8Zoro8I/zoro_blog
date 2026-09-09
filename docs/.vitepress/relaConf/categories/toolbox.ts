import type {CategoryConfig} from './types';

export const toolboxCategory = {
  "name": "宝藏工具箱",
  "id": "utils",
  "icon": "🧰",
  "children": [
    {
      "name": "常用链接",
      "links": [
        {
          "title": "动漫好站",
          "url": "/column/utils/fanLink",
          "visible": true
        },
        {
          "title": "破解软件 & 游戏资源收藏指南",
          "url": "/column/utils/gameCrack",
          "visible": true
        },
        {
          "title": "高效终端常用工具推荐",
          "url": "/column/utils/terminal",
          "visible": true
        },
        {
          "title": "落雪音乐在线源",
          "url": "/column/utils/lxSource",
          "visible": true
        },
        {
          "title": "开源阅读&笔趣阁书源",
          "url": "/column/utils/bookSource",
          "visible": true
        },
        {
          "title": "自用 VPN / 机场推荐",
          "url": "/column/utils/vpn",
          "visible": true
        }
      ],
      "visible": true
    }
  ],
  "visible": true
} satisfies CategoryConfig;

