import type {CategoryConfig} from './types';

export const windowsCategory = {
  "name": "Windows",
  "id": "computer",
  "icon": "💻",
  "children": [
    {
      "name": "Windows 平台",
      "links": [
        {
          "title": "Windows 装机必备利器推荐",
          "url": "/column/window/001_app",
          "visible": true
        },
        {
          "title": "Immich 私人相册服务器本地部署",
          "url": "/column/window/002Immich",
          "visible": true
        }
      ],
      "visible": true
    }
  ],
  "visible": true
} satisfies CategoryConfig;

