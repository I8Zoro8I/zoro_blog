---
title: pm2 list显示端口号
slug: pm2_list显示端口号
date: 2026年05月07日
---



### ecosystem.config.js 中配置

### 第一步：生成配置文件

在您的项目根目录下（即 package.json 所在的目录），运行以下命令生成一个默认配置文件：

Bash

```
pm2 init simple
```

这会在目录下创建一个名为 ecosystem.config.js 的文件。

------

### 第二步：编辑配置文件

打开这个新生成的 ecosystem.config.js，将内容修改为如下格式。



JavaScript

```
// 1. 定义配置变量
const APP_NAME = "angler_status_v2";
const PORT_NUM = 30001;
module.exports = {
    apps: [{
        name: APP_NAME,
        namespace: `${PORT_NUM}`,   // 👈 放这里  端口号显示在namespace
        script: "./app.js",

        env: {
            PORT: PORT_NUM,
            NODE_ENV: "production"
        }
    }]
};
```

------

### 第三步：修改项目代码 (关键)

为了让第二步配置的 PORT: 8080 生效，您必须确保您的 Node.js 代码（通常在 app.js 或 index.js 或 server.js中）能够读取环境变量，而不是把端口写死。

找到您的监听代码：

JavaScript

```
// ❌ 以前可能是写死的：
// app.listen(3000); 

// ✅ 现在改为读取环境变量：
const port = process.env.PORT || 3000; // 如果 PM2 没传端口，默认用 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

------

### 第四步：重新启动

因为您改变了启动方式，需要先删除旧的进程，再用配置文件启动。

1. 清理旧进程：

   ```bash
   pm2 delete all
   ```

2. 用配置文件启动：

   ```bash
   pm2 start ecosystem.config.js
   ```

结果： 现在运行 pm2 list，您将看到：

- Name 列显示：my-api-8080 (一目了然)
- 您的应用实际上也正在监听 8080 端口。

------

### 偷懒办法（不想用配置文件）

如果您实在不想加这个文件，只想在命令行解决，可以修改 package.json 里的启动脚本：

修改 package.json：

JSON

```
"scripts": {
  "pm2-start": "pm2 start app.js --name 'my-app-8080' -- --port 8080"
}
```

注意：这需要您的代码里包含处理命令行参数的逻辑，通常不如用环境变量（上面的方法）通用。

我可以为您做的下一步： 如果您把您现在的启动命令（例如 pm2 start ...）发给我，我可以帮您直接写好对应的 ecosystem.config.js 内容，您复制粘贴即可。