# lesson-26 项目阅读指南

> TypeScript 改造领课后台

---

## 一、这是什么项目

本项目是「领课后台」——一个用 Express 搭建的课程管理后台，包含登录、用户管理、课程管理、通知管理、操作日志等功能。

它是一个**前后端一体**的项目：服务端用 TypeScript 写在 `src` 目录，前端用 TypeScript 写在 `client` 目录，编译后由同一个 Express 服务托管，只跑在 3000 端口。

> ⚠️ 核心理解点：**这个项目只有一个 HTTP 服务，前端不是独立进程。**

---

## 二、先跑起来

### 第一次运行

```bash
npm install      # 安装依赖
npm run dev      # 编译并启动服务
# 浏览器打开 http://localhost:3000
```

### 常用命令（package.json 的 scripts）

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 编译全部 + `node --watch` 启动，改代码自动重启 |
| `npm start` | 编译全部 + `node` 启动（生产方式，无 watch） |
| `npm run build` | 只编译，不启动 |
| `npm run build:server` | 只编译服务端 |
| `npm run build:client` | 只编译前端 |

---

## 三、推荐阅读顺序

建议按「**配置 → 入口 → 路由 → 中间件 → 前端**」的顺序读，由外向内、由静到动。

| 顺序 | 文件 | 看什么 |
| --- | --- | --- |
| 1 | `package.json` | scripts 三条线：build / dev / start |
| 2 | `esbuild.server.mjs` | 服务端怎么打包、`@` 别名怎么解析 |
| 3 | `tsconfig.server.json` / `tsconfig.client.json` | 两个 tsconfig 各管谁 |
| 4 | `src/app.ts` | 服务端入口：中间件、路由挂载、错误处理 |
| 5 | `src/routes/auth.ts` | 第一个路由，看懂登录接口长什么样 |
| 6 | `src/middleware/require-auth.ts` | 鉴权中间件，`request.user` 从哪来 |
| 7 | `src/routes/*.ts` 其余 | 各业务接口：用户、课程、通知、日志、仪表盘 |
| 8 | `client/admin.ts` / `login.ts` | 前端入口，看它怎么调 `/api/*` |

---

## 四、文件层级结构

```
lesson-26-项目演练-TypeScript改造领课后台/
├── package.json              # 项目配置与 scripts
├── tsconfig.json             # 根配置，extends server
├── tsconfig.server.json      # 服务端 TS 配置（只查类型）
├── tsconfig.client.json      # 前端 TS 配置（编译到 public/js）
├── esbuild.server.mjs        # 服务端打包脚本
├── src/                      # 服务端源码（TS）
│   ├── app.ts                # 服务端入口，挂路由
│   ├── paths.ts              # 目录常量
│   ├── http-error.ts         # 带状态码的错误类
│   ├── types.ts              # 共享类型
│   ├── query.ts              # 读取 JSON 数据
│   ├── save-cover.ts         # 保存课程封面
│   ├── express.d.ts          # Express 类型扩展（request.user 等）
│   ├── middleware/           # 中间件
│   │   └── require-auth.ts   # 鉴权中间件
│   ├── routes/               # 各业务路由
│   │   ├── auth.ts           # 登录/登出/当前用户
│   │   ├── users.ts          # 用户管理
│   │   ├── courses.ts        # 课程管理
│   │   ├── notices.ts        # 通知管理
│   │   ├── logs.ts           # 操作日志
│   │   ├── menus.ts          # 菜单
│   │   └── dashboard.ts      # 仪表盘统计
│   ├── repositories/         # 数据访问层
│   │   ├── user-repository.ts
│   │   ├── course-repository.ts
│   │   ├── notice-repository.ts
│   │   └── log-repository.ts
│   ├── stores/               # 会话存储（内存）
│   │   └── sessions.ts
│   └── data/                 # mock 数据
│       ├── mock-users.ts
│       ├── mock-courses.ts
│       ├── mock-notices.ts
│       ├── mock-logs.ts
│       └── menus.ts
├── client/                   # 前端源码（TS）
│   ├── admin.ts              # 后台页入口
│   ├── login.ts              # 登录页入口
│   ├── api.ts                # fetch 封装
│   ├── dom.ts                # DOM 工具
│   └── types.ts              # 前端类型
├── public/                   # 静态资源（直接被 Express 托管）
│   ├── index.html
│   ├── login.html
│   ├── admin.html
│   ├── js/                   # ← client 编译产物（tsc 生成）
│   └── uploads/covers/       # 课程封面图
└── dist/                     # 服务端编译产物（esbuild 生成）
    └── app.js                # ← 真正被 node 运行的文件
```

---

## 五、各文件作用说明

### 5.1 根目录配置文件

| 文件 | 作用 |
| --- | --- |
| `package.json` | 声明依赖（express、typescript、esbuild）和 scripts 命令 |
| `tsconfig.json` | 根 tsconfig，只 extends `tsconfig.server.json`，给 IDE 默认用 |
| `tsconfig.server.json` | 服务端 TS 配置：`rootDir=src`，`paths` 别名 `@→src`，`noEmit` 只查类型 |
| `tsconfig.client.json` | 前端 TS 配置：`rootDir=client`，`outDir=public/js`，真编译产出 |
| `esbuild.server.mjs` | esbuild 打包脚本：把 `src/app.ts` 打成 `dist/app.js`，处理 `@` 别名 |

### 5.2 src 服务端

| 文件/目录 | 作用 |
| --- | --- |
| `src/app.ts` | 服务端入口。挂 json 解析、static 静态托管、各路由、404、错误处理中间件，listen 3000 |
| `src/paths.ts` | 导出 `publicDirectory`、`coversDirectory` 两个绝对路径 |
| `src/http-error.ts` | `HttpError` 类（带 status）和 `isParseError` 判断函数 |
| `src/types.ts` | 服务端用的类型定义 |
| `src/query.ts` | 读取 data 目录下的 JSON mock 数据 |
| `src/save-cover.ts` | 处理课程封面上传保存 |
| `src/express.d.ts` | 扩展 Express 的 Request 类型，加上 `user`、`token` 字段 |
| `src/middleware/require-auth.ts` | 鉴权中间件：从 Authorization 头取 token，查 session，挂 `request.user` |
| `src/routes/*.ts` | 各业务路由，处理 HTTP 请求并返回 JSON |
| `src/repositories/*.ts` | 数据访问层，封装对 mock 数据的增删改查 |
| `src/stores/sessions.ts` | 会话存储（内存 Map），token → userId |
| `src/data/*.ts` | mock 数据（用户、课程、通知、日志、菜单） |

### 5.3 client 前端

| 文件 | 作用 |
| --- | --- |
| `client/admin.ts` | 后台管理页入口：渲染菜单、各业务页面、表单弹窗 |
| `client/login.ts` | 登录页入口 |
| `client/api.ts` | fetch 封装：自动带 token、统一错误处理 |
| `client/dom.ts` | DOM 工具函数 |
| `client/types.ts` | 前端用的类型定义 |

### 5.4 public 与 dist

| 目录 | 作用 |
| --- | --- |
| `public/` | 静态资源目录，被 `express.static` 直接托管，浏览器可直接访问 |
| `public/js/` | client 编译产物（tsc 生成），浏览器加载执行 |
| `public/uploads/covers/` | 课程封面图片存储目录 |
| `dist/` | 服务端编译产物（esbuild 生成） |
| `dist/app.js` | 真正被 node 运行的服务端文件 |

---

## 六、启动流程详解（`npm run dev` 全过程）

`"dev": "npm run build && node --watch dist/app.js"`，分两步：

### 第一步：`npm run build`（编译）

- `build:server` → `tsc -p tsconfig.server.json`：服务端**类型检查**（`noEmit`，不产出文件，只查错）
- `build:server` → `node esbuild.server.mjs`：**esbuild 打包** `src/app.ts` → `dist/app.js`，处理 `@` 别名
- `build:client` → `tsc -p tsconfig.client.json`：编译 `client/*.ts` → `public/js/*.js`

### 第二步：`node --watch dist/app.js`（运行）

- 启动 Express，监听 3000 端口
- `--watch` 监听 `dist/app.js` 变化，自动重启

### 运行时请求链路

```
浏览器 → http://localhost:3000
        │
        ▼
   Express (dist/app.js)
        ├── /api/*      → src/routes/* 路由处理
        └── 其他        → express.static(public) 返回静态文件
                       ├── public/*.html
                       └── public/js/*.js  ← client 编译产物
```

> ✅ 关键结论：**前端不是独立服务，是被服务端托管的静态文件。整个项目只有一个 3000 端口。**

---

## 七、为什么用 esbuild 而不是 Vite

前面的课程里我们用过 Vite（lesson-23）。这个项目不用 Vite，不是因为 Vite 不好，而是因为**场景完全不同**。

### 7.1 两者的本质区别

| 对比项 | esbuild | Vite |
| --- | --- | --- |
| 本质 | 打包器（bundler），只做一件事：把 TS 打成 JS | 构建工具（build tool），一整套方案 |
| 内部 | 自己一个 | 开发时用 esbuild 转译，打包时用 Rollup |
| 能力 | 打包 + 转译 + 压缩 | 打包 + 转译 + 开发服务器 + HMR + 插件生态 |
| 典型场景 | 后端、CLI、库的打包 | 前端网页项目 |

> 💡 一句话：**Vite 里面就嵌着 esbuild。**

### 7.2 这个后端项目不需要 Vite 的能力

- 没有浏览器要加载页面 → 不需要开发服务器
- 后端改了重启 node 就行 → 不需要 HMR 热更新
- 没有 CSS、图片、Vue 单文件组件 → 不需要资源处理插件

后端只需要一件事：**把 `src/app.ts` 打成一个 `dist/app.js` 让 Node 跑**。esbuild 干这个又快又简单，用 Vite 反而是杀鸡用牛刀。

### 7.3 esbuild 配置里的后端专属选项

```js
await build({
  entryPoints: ["src/app.ts"],
  bundle: true,
  platform: "node",      // 目标是 Node，不 polyfill fs/path 等内置模块
  format: "esm",         // 输出 ESM 格式
  packages: "external",  // express 等第三方包不打进 bundle，运行时由 Node 加载
  outfile: "dist/app.js",
  alias: { "@": "./src" },
});
```

其中 `packages: "external"` 是关键：Vite 面向浏览器，默认把第三方包打包进产物（因为浏览器没有 node_modules）；而后端项目运行环境是 Node，直接用 node_modules 即可，不需要打包进来。

### 7.4 `@` 别名为什么要配两处

| 位置 | 谁用 | 管什么 |
| --- | --- | --- |
| `tsconfig.server.json` 的 `paths` | TypeScript、IDE | 类型检查时 `@/xxx` 能找到文件 |
| `esbuild.server.mjs` 的 `alias` | esbuild | 打包时把 `@/xxx` 替换成真实路径 |

和 lesson-23 的 Vite 项目一样：**tsconfig 只管类型检查，不管运行时；真正打包的工具（这里是 esbuild，lesson-23 是 Vite）必须也认识同一个别名。** 缺任何一个都会出问题。

---

## 八、关键概念速记

- 这个项目只有一个服务，跑在 3000 端口，前后端一体
- 服务端：`src` 用 esbuild 打成 `dist/app.js`；前端：`client` 用 tsc 编到 `public/js`
- tsc 只查类型不打包（server 配置 `noEmit`），打包交给 esbuild
- tsc 不会改写 `@` 别名，所以 esbuild 要再配一次 `alias`
- `public` 目录被 `express.static` 托管，浏览器直接访问
- esbuild 是打包器，Vite 是全家桶（内部用 esbuild）；后端项目用 esbuild 就够
