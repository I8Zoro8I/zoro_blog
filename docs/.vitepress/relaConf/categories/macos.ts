import type {CategoryConfig} from './types';

export const macosCategory = {
  "name": "macOS",
  "id": "computer",
  "icon": "💻",
  "children": [
    {
      "name": "macOS 平台",
      "links": [
        {
          "title": "Win 转 Mac 必备硬核效率小工具",
          "url": "/column/mac/001_app",
          "visible": true
        }
      ],
      "visible": true
    }
  ],
  "visible": true
} satisfies CategoryConfig;

