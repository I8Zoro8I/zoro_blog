import type {CategoryConfig} from './types';

export const linuxCategory = {
  "name": "Linux&服务器",
  "id": "Linux",
  "icon": "💾",
  "children": [
    {
      "name": "云服务器",
      "links": [
        {
          "title": "第一次部署",
          "url": "/column/cloud/云服务器",
          "visible": true
        }
      ],
      "visible": true
    }
  ],
  "visible": true
} satisfies CategoryConfig;

