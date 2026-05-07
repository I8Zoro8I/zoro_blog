---
title: nginx(待完善)
slug: ngnix
date: 2026年05月07日
---



路径

etc/nginx

```nginx
sudo nginx -t     # 测试配置是否有语法错误
sudo nginx -s reload   # 重载 Nginx

```

```nginx
--域名
server {
  listen 443 ssl http2;
  listen 1443 ssl http2;
  server_name species-admin.solot.co;
  ssl_certificate /etc/nginx/*.solot.co.fullchain.cer;
    ssl_certificate_key /etc/nginx/*.solot.co.key;
    access_log  /var/log/nginx/solot.co.log;

    location / {
    root /web/species_admin/dist;
    index index.html;
    try_files $uri $uri/ /index.html;
    gzip_static on;
    gzip_http_version 1.0;
}

    location /mp {
    proxy_pass http://192.168.1.33:50002/mp;
    proxy_set_header Host $http_host;
    proxy_set_header X-REAL-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
}

    location /v1 {
    proxy_pass http://192.168.1.33:50002/v1;
    proxy_set_header Host $http_host;
    proxy_set_header X-REAL-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

    location /interaction {
    proxy_pass http://192.168.1.33:50002/interaction;
    proxy_set_header Host $http_host;
    proxy_set_header X-REAL-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

    # 自定义地图服务代理
    location /_AMapService/v4/map/styles {
    set $args "$args&jscode=c44d7dab42936c455c4d37a06f628db7";
    proxy_pass https://webapi.amap.com/v4/map/styles;
}
    # 海外地图服务代理
    location /_AMapService/v3/vectormap {
    set $args "$args&jscode=c44d7dab42936c455c4d37a06f628db7";
    proxy_pass https://fmap01.amap.com/v3/vectormap;
}
    # Web服务API 代理
    location /_AMapService/ {
    set $args "$args&jscode=c44d7dab42936c455c4d37a06f628db7";
    proxy_pass https://restapi.amap.com/;
}

}


    --ip
    server {
    listen 8080;                # HTTP 端口
    server_name _;              # 用 IP 访问时可以用 _

    access_log /var/log/nginx/ip_access.log;

    # 静态网页根目录
    location / {
    root web/gofishing/merchant/dist;
    index index.html;
    try_files $uri $uri/ /index.html;
}

    # API 路径 /v1
    location /v1 {
    proxy_pass http://192.168.1.113:3200/v1;
    proxy_set_header Host $host;
    proxy_set_header X-REAL-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

    # API 路径 /api
    location /api {
    proxy_pass http://192.168.1.113:3200/v1;
    proxy_set_header Host $host;
    proxy_set_header X-REAL-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

    # WebSocket 路径 /ws
    location /ws {
    proxy_pass http://192.168.1.113:3200/ws;
    proxy_set_header Host $host;
    proxy_set_header X-REAL-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
}

```







解析

```markdown

---

### 1️⃣ Server 块基本信息

```nginx
server {
  listen 443 ssl http2;
  listen 1443 ssl http2;
  server_name species-admin.solot.co;
  ssl_certificate /etc/nginx/*.solot.co.fullchain.cer;
  ssl_certificate_key /etc/nginx/*.solot.co.key;
  access_log  /var/log/nginx/solot.co.log;
```

* `listen 443 ssl http2;`：监听 443 端口，开启 HTTPS 和 HTTP/2（注意新版 Nginx 写法应该分开）。
* `listen 1443 ssl http2;`：监听 1443 端口，也开启 HTTPS。
* `server_name species-admin.solot.co;`：匹配域名为 `species-admin.solot.co` 的请求。
* `ssl_certificate` / `ssl_certificate_key`：指定 SSL 证书和私钥文件，用于 HTTPS。
* `access_log`：访问日志路径。

⚠️ **注意**：新版 Nginx 报告 `"listen ... http2" directive is deprecated`，应该改为：

```nginx
listen 443 ssl;
listen 1443 ssl;
http2;
```

---

### 2️⃣ 静态网页

```nginx
location / {
    root /web/species_admin/dist;
    index index.html;
    try_files $uri $uri/ /index.html;
    gzip_static on;
    gzip_http_version 1.0;
}
```

* `/`：匹配根路径。
* `root /web/species_admin/dist;`：静态文件根目录。
* `index index.html;`：默认首页文件。
* `try_files $uri $uri/ /index.html;`：如果请求的文件不存在，返回 `index.html`，常用于前端 SPA。
* `gzip_static on;`：启用预压缩文件 `.gz`。
* `gzip_http_version 1.0;`：HTTP 1.0 也允许 gzip。

---

### 3️⃣ 后端代理

#### /mp

```nginx
location /mp {
    proxy_pass http://192.168.1.33:50002/mp;
    proxy_set_header Host $http_host;
    proxy_set_header X-REAL-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

* 将 `/mp` 请求转发到内网 `192.168.1.33:50002/mp`。
* 设置请求头：

  * `Host`：保持原请求域名。
  * `X-REAL-IP`：客户端真实 IP。
  * `X-Forwarded-For`：经过代理的客户端 IP 链。

#### /v1

```nginx
location /v1 {
    proxy_pass http://192.168.1.33:50002/v1;
    proxy_set_header Host $http_host;
    proxy_set_header X-REAL-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

* `/v1` 请求转发到 `192.168.1.33:50002/v1`。
* `X-Forwarded-Proto`：记录协议（http/https），用于后端知道客户端访问协议。

#### /interaction

```nginx
location /interaction {
    proxy_pass http://192.168.1.33:50002/interaction;
    proxy_set_header Host $http_host;
    proxy_set_header X-REAL-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

* `/interaction` 请求转发到内网服务 `192.168.1.33:50002/interaction`，同样设置了代理头。

---

### 4️⃣ 高德地图相关代理

#### 自定义地图样式

```nginx
location /_AMapService/v4/map/styles {
    set $args "$args&jscode=c44d7dab42936c455c4d37a06f628db7";
    proxy_pass https://webapi.amap.com/v4/map/styles;
}
```

* 将 `/ _AMapService/v4/map/styles` 请求代理到高德 API。
* 自动在请求参数中加上 `jscode`。

#### 海外地图

```nginx
location /_AMapService/v3/vectormap {
    set $args "$args&jscode=c44d7dab42936c455c4d37a06f628db7";
    proxy_pass https://fmap01.amap.com/v3/vectormap;
}
```

* 代理海外地图数据接口。

#### Web API 代理

```nginx
location /_AMapService/ {
    set $args "$args&jscode=c44d7dab42936c455c4d37a06f628db7";
    proxy_pass https://restapi.amap.com/;
}
```

* 代理高德 REST API，统一加上 `jscode`。

---

### 🔹 总结效果

1. 支持 **HTTPS + HTTP/2**。
2. 根路径 `/` 提供前端静态页面（SPA）。
3. `/mp`、`/v1`、`/interaction` 转发到内网服务。
4. `_AMapService` 下的请求代理到高德地图服务并自动加 `jscode`。
5. 日志记录在 `/var/log/nginx/solot.co.log`。

---

如果你希望，我可以帮你改成 **IP 访问 + 无 SSL** 的版本，直接用 `192.168.1.113` 就能访问网页和 API。

你希望我帮你改吗？

```

