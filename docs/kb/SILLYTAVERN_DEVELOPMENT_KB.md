# SillyTavern 二次开发知识库

> 生成目的：为后续二次开发提供工程地图、关键入口、扩展点、数据流和风险提示。本文基于当前工作区静态分析生成，未运行服务、测试或 Git 操作。

## 1. 工程定位

SillyTavern 是一个 Node.js + Express 后端、浏览器 ESM 前端的单页 Web 应用。后端负责静态资源、用户数据、鉴权、安全中间件、LLM/图像/向量/翻译等外部服务代理；前端负责聊天 UI、角色/群组/世界书状态、生成请求编排、扩展加载与交互。

核心特征：

- 运行时入口：`server.js` -> `src/server-main.js`。
- 前端入口：`public/index.html` + `public/script.js`。
- API 路由：集中在 `src/endpoints/`，由 `src/server-startup.js` 统一挂载。
- 用户数据：默认在 `data/` 下，运行时按用户 handle 划分目录。
- 扩展机制：前端扩展在 `public/scripts/extensions/`，服务端插件在 `plugins/`。
- 构建模式：业务前端大多是浏览器原生 ESM；Webpack 主要打包 `public/lib.js` 为运行时依赖库。

## 2. 技术栈与运行脚本

### 2.1 基础技术

- Node.js ESM：`package.json` 设置 `"type": "module"`。
- Node 版本：`package.json` 要求 `>= 20`。
- Web 后端：Express 4、body-parser、multer、cookie-session、helmet、csrf-sync、cors。
- 前端：原生 ESM、jQuery、Handlebars、Showdown、DOMPurify、FontAwesome、Select2 等。
- 打包：Webpack 5 只负责 `public/lib.js`。
- 测试：根目录没有 `test` 脚本；测试项目在 `tests/`。

### 2.2 常用命令

在项目根目录：

```bash
npm start
npm run lint
npm run lint:fix
npm run plugins:update
npm run plugins:install
```

在 `tests/` 目录：

```bash
npm run test:unit
npm run test:e2e
npm run test
npm run lint
```

## 3. 启动链路

### 3.1 主入口

- `server.js`
  - 解析命令行。
  - 设置 `globalThis.DATA_ROOT`。
  - 设置 `globalThis.COMMAND_LINE_ARGS`。
  - 动态导入 `src/server-main.js`。

- `src/server-main.js`
  - 创建 Express app。
  - 注册全局安全与基础中间件。
  - 初始化用户存储、迁移任务、插件、请求过滤、Webpack 中间件。
  - 挂载公共路由、鉴权边界、私有 API。
  - 启动 HTTP/HTTPS 服务。

- `src/server-startup.js`
  - `setupPrivateEndpoints(app)` 统一挂载私有 API。
  - `redirectDeprecatedEndpoints(app)` 保留旧 API 到新 API 的 308 重定向。
  - `ServerStartup` 负责 IPv4/IPv6、SSL、端口占用提示与监听。

### 3.2 中间件顺序

后端中间件顺序对二开很重要，新增中间件要明确放在鉴权前还是鉴权后。

大致顺序：

1. `helmet({ contentSecurityPolicy: false })`
2. `compression()`
3. `responseTime()`
4. `bodyParser.json/urlencoded`，限制 `500mb`
5. CORS 配置
6. Basic Auth，仅 `listen && basicAuthMode`
7. IP 白名单，仅 `whitelistMode`
8. Host 白名单
9. access log，仅 `listen`
10. `cookieSession`
11. `setUserDataMiddleware`
12. CSRF，中间件可由 `--disableCsrf` 禁用
13. `/`、`/callback/:source?`、`/login`
14. Webpack serve、用户 CSS、`express.static(public)`
15. 公共 `/api/users`
16. `requireLoginMiddleware`
17. `/api/ping`、`/proxy/*`、multer 上传、`/version`
18. 废弃端点重定向与私有 API
19. 404 中间件

## 4. 配置系统

关键文件：

- `src/command-line.js`：命令行与配置合并。
- `src/config-init.js`：初始化/补齐 `config.yaml`。
- `src/util.js`：`getConfigValue()` 与配置读取工具。
- `default/config.yaml`：默认配置模板。

优先级：命令行参数优先，其次 `config.yaml`，部分值可被 `SILLYTAVERN_...` 环境变量覆盖。

二开注意：

- 新增配置项应先看 `command-line.js` 和 `default/config.yaml` 的现有模式。
- 安全相关配置不要绕过：`listen`、`enableUserAccounts`、`basicAuthMode`、`whitelistMode`、`hostWhitelist`、`privateAddressWhitelist`、`disableCsrf`。
- 如果新增外部请求能力，要考虑 `private-request-filter` 和 request proxy 的交互。

## 5. 后端模块地图

### 5.1 API 路由挂载

`src/server-startup.js` 的 `setupPrivateEndpoints(app)` 是私有 API 总表。

主要挂载：

- `/api/users`：`users-private.js`、`users-admin.js`
- `/api/characters`：角色卡 CRUD、导入导出、头像/卡片处理
- `/api/chats`：单聊/群聊保存、读取、导入导出
- `/api/groups`：群组管理
- `/api/worldinfo`：世界书
- `/api/settings`：用户设置
- `/api/secrets`：密钥存取
- `/api/openai`、`/api/anthropic`、`/api/google`、`/api/novelai`、`/api/openrouter`、`/api/nanogpt` 等：外部 LLM 服务适配
- `/api/backends/text-completions`、`/api/backends/chat-completions`、`/api/backends/kobold`：兼容后端适配
- `/api/sd`：图像生成
- `/api/vector`：向量/Embedding
- `/api/translate`：翻译
- `/api/speech`：TTS/STT
- `/api/extensions`：前端扩展发现、安装、更新、资源处理
- `/api/plugins/:id`：服务端插件注册后使用

新增后端 API 的推荐路径：

1. 新建或修改 `src/endpoints/<domain>.js`。
2. 使用 `express.Router()` 导出 `router`。
3. 在 `src/server-startup.js` 的 `setupPrivateEndpoints()` 中挂载。
4. 访问用户文件时使用 `request.user.directories`。
5. 对文件名、路径、URL、上传内容做安全校验。

### 5.2 用户与数据目录

关键文件：

- `src/users.js`：用户、会话、目录、中间件、迁移。
- `src/constants.js`：`USER_DIRECTORY_TEMPLATE`、`PUBLIC_DIRECTORIES`。
- `data/`：运行时数据根目录，当前仓库仅保留 `.gitkeep`。
- `default/content/`：默认内容。
- `default/scaffold/README.md`：默认内容 scaffold 说明。

典型用户目录模板：

- `characters`
- `chats`
- `group chats`
- `groups`
- `worlds`
- `themes`
- `backgrounds`
- `extensions`
- `vectors`
- `user/files`
- `user/workflows`
- `backups`
- `secrets`

二开注意：

- 不要把运行时用户数据写入仓库默认文件，除非是默认内容或模板。
- 路径必须基于 `request.user.directories`，不要手拼用户目录。
- 文件端点要使用已有的 sanitize、路径包含检查、危险扩展过滤模式。
- 密钥必须通过 `/api/secrets` 或对应后端机制存放，不应写到前端扩展代码。

### 5.3 安全边界

关键模块：

- `src/middleware/basicAuth.js`
- `src/middleware/whitelist.js`
- `src/middleware/hostWhitelist.js`
- `src/middleware/accessLogWriter.js`
- `src/private-request-filter.js`
- `src/request-proxy.js`
- `src/middleware/corsProxy.js`
- `src/middleware/validateFileName.js`
- `src/middleware/multerMonkeyPatch.js`

重要约束：

- CSRF 默认开启，前端请求应携带 `/csrf-token` 获取的 `x-csrf-token`。
- CORS proxy 默认可禁用，禁用时 `/proxy/*` 返回 404 提示。
- `private-request-filter` 用于防止服务端请求访问私网地址，新增外部抓取/代理类功能必须评估。
- 上传经过 multer，默认临时路径在 `<DATA_ROOT>/_uploads`。

## 6. 前端模块地图

### 6.1 入口与主状态

关键文件：

- `public/index.html`：单页 HTML 与大量静态 DOM。
- `public/script.js`：前端主入口、主状态和大量业务编排。
- `public/lib.js`：第三方库统一导出入口。
- `public/scripts/st-context.js`：扩展与二开优先使用的上下文接口。

`public/script.js` 维护大量全局运行态，例如：

- `characters`
- `this_chid`
- `chat`
- `chat_metadata`
- `main_api`
- `settings`
- `name1`、`name2`
- 生成状态、流式状态、消息渲染与保存函数

二开原则：

- 尽量不要继续扩大 `public/script.js`。
- 新功能优先放入 `public/scripts/<domain>.js`。
- 需要暴露给扩展的能力优先通过 `st-context.js`。
- 保存设置使用现有的 debounce 保存函数，例如 `saveSettingsDebounced()`、`saveMetadataDebounced()`。

### 6.2 主要前端域

- 聊天：`public/scripts/chats.js`，部分核心仍在 `public/script.js`。
- 角色数据结构：`public/scripts/char-data.js`。
- 群组：`public/scripts/group-chats.js`。
- 世界书：`public/scripts/world-info.js`。
- 高级设置：`public/scripts/power-user.js`。
- 通用 DOM：`public/scripts/dom-handlers.js`。
- OpenAI/Chat Completion：`public/scripts/openai.js`。
- Text Completion：`public/scripts/textgen-settings.js`。
- Kobold：`public/scripts/kai-settings.js`。
- NovelAI：`public/scripts/nai-settings.js`。
- Slash Commands：`public/scripts/slash-commands.js` 与 `public/scripts/slash-commands/`。
- 宏系统：`public/scripts/macros/`，兼容入口为 `public/scripts/macros.js`。
- 工具调用：`public/scripts/tool-calling.js`。

### 6.3 样式与主题

关键文件：

- `public/style.css`：主样式入口，包含大量 CSS 变量。
- `public/css/*.css`：功能域样式。
- `default/content/themes/*.json`：默认主题。
- `default/content/user.css`：用户 CSS 模板。

主题相关变量主要是 `--SmartTheme*` 和尺寸/布局变量。新增 UI 应优先复用变量，避免硬编码颜色破坏主题和移动端适配。

## 7. 扩展与插件

### 7.1 前端扩展

关键文件：

- `public/scripts/extensions.js`：发现、加载、启停、设置保存、模板渲染。
- `public/scripts/extensions/<name>/manifest.json`：内置扩展清单。
- `public/scripts/extensions/third-party/`：全局第三方扩展目录。
- 用户级扩展目录：运行时来自 `request.user.directories.extensions`。
- `src/endpoints/extensions.js`：扩展发现、安装、更新、删除等服务端接口。

内置扩展示例：

- `attachments`
- `assets`
- `caption`
- `connection-manager`
- `expressions`
- `gallery`
- `memory`
- `quick-reply`
- `regex`
- `stable-diffusion`
- `token-counter`
- `translate`
- `tts`
- `vectors`

前端扩展开发建议：

1. 建目录：`public/scripts/extensions/<extension-name>/`。
2. 添加 `manifest.json`，声明 JS、CSS、display name、loading order、hooks 等。
3. JS 以 ES module 加载，使用 `import { getContext } from '../../st-context.js'` 获取能力。
4. UI 模板优先使用 `renderExtensionTemplateAsync()`。
5. Slash Command 使用 `SlashCommandParser.addCommandObject()`。
6. 宏使用 `macros.registry` 或 `macros.register()` 风格的新接口。
7. 持久化扩展设置时使用 `extension_settings` 与已有保存函数。

### 7.2 服务端插件

关键文件：

- `src/plugin-loader.js`
- `plugins/`
- `plugins.js`
- `plugins/package.json`

服务端插件默认受 `enableServerPlugins` 控制。插件可以动态导入并注册 Express 路由，典型路径是 `/api/plugins/:id`。

二开注意：

- 服务端插件权限高，等同执行本机 Node 代码，只应加载可信代码。
- 插件 API 适合需要服务端密钥、文件系统、外部服务代理的能力。
- 若只是 UI 或前端状态能力，优先做前端扩展，降低服务端风险。

## 8. LLM、图像、向量与翻译适配

### 8.1 LLM 来源

后端来源常量在 `src/constants.js`：

- `CHAT_COMPLETION_SOURCES`
- `TEXTGEN_TYPES`

相关前端设置模块：

- `public/scripts/openai.js`
- `public/scripts/textgen-settings.js`
- `public/scripts/kai-settings.js`
- `public/scripts/nai-settings.js`

相关后端端点：

- `src/endpoints/openai.js`
- `src/endpoints/anthropic.js`
- `src/endpoints/google.js`
- `src/endpoints/novelai.js`
- `src/endpoints/openrouter.js`
- `src/endpoints/nanogpt.js`
- `src/endpoints/azure.js`
- `src/endpoints/minimax.js`
- `src/endpoints/volcengine.js`
- `src/endpoints/backends/*.js`

新增模型源通常要同时处理：

1. 常量枚举。
2. 前端设置 UI 与保存。
3. 请求构造。
4. 后端代理端点。
5. Secrets 管理。
6. token 计算或上下文限制。
7. 流式响应格式。

### 8.2 图像、向量、翻译、语音

- 图像生成：`src/endpoints/stable-diffusion.js` 与 `public/scripts/extensions/stable-diffusion/`。
- 向量：`src/endpoints/vectors.js`、`src/vectors/*.js` 与 `public/scripts/extensions/vectors/`。
- 翻译：`src/endpoints/translate.js` 与 `public/scripts/extensions/translate/`。
- 语音：`src/endpoints/speech.js` 与 `public/scripts/extensions/tts/`。
- 图片理解/Caption：`src/endpoints/caption.js` 与 `public/scripts/extensions/caption/`。

## 9. 构建与资源加载

Webpack 配置在 `webpack.config.js`：

- 入口是 `public/lib.js`。
- 输出是 `lib.js`，以 module library 形式提供。
- 非 Docker 环境输出到 `<DATA_ROOT>/_webpack/<cacheVersion>/output/lib.js`。
- Docker 或 `forceDist` 输出到 `dist/_webpack/`。
- `src/middleware/webpack-serve.js` 在服务端运行时编译并提供该文件。

业务前端模块一般不经 Webpack 打包，而是由浏览器直接加载 ESM。新增业务模块时不要默认引入复杂构建流程。

## 10. 二次开发常见路径

### 10.1 新增后端 API

1. 在 `src/endpoints/<domain>.js` 创建 `express.Router()`。
2. 在 `src/server-startup.js` 挂载到 `/api/<domain>`。
3. 如果涉及用户文件，使用 `request.user.directories`。
4. 如果涉及上传，复用 multer 与现有文件校验模式。
5. 如果涉及外部 URL，请评估 SSRF、防代理、超时和错误透传。
6. 给前端请求加 `getRequestHeaders()`，确保 CSRF header。

### 10.2 新增前端功能模块

1. 在 `public/scripts/<domain>.js` 实现模块。
2. 从 `public/script.js` 或相关域模块导入。
3. UI 节点若很大，优先使用模板目录或局部 HTML 片段，不要塞入更多全局字符串。
4. 状态持久化接入现有 settings、metadata 或用户数据 API。
5. 样式放入 `public/css/<domain>.css`，再由 `public/style.css` 引入。

### 10.3 新增前端扩展

1. 建 `public/scripts/extensions/<name>/manifest.json`。
2. 添加入口 JS 与可选 CSS、模板、i18n。
3. 使用 `getContext()` 获取聊天、角色、生成、Slash Command、宏等能力。
4. 设置写入 `extension_settings[<name>]`。
5. 如需后端能力，新增 `/api/<domain>` 或服务端插件路由。

### 10.4 新增 LLM/服务商适配

1. 确认是 Chat Completion、Text Completion 还是独立 API。
2. 增加常量枚举和前端选择项。
3. 增加设置 UI、模型列表、连接测试。
4. 增加后端代理端点或扩展现有端点。
5. 通过 secrets 保存 key。
6. 支持非流式和流式，或明确只支持一种。
7. 补齐错误提示、限流、超时和私网请求防护。

## 11. 测试策略

测试目录是独立 Node 项目：`tests/`。

- Jest 单元测试：`tests/*.test.js`。
- Playwright E2E：`tests/*.e2e.js` 与 `tests/frontend/*.e2e.js`。
- Jest 配置：`tests/jest.config.json`。
- Playwright 配置：`tests/playwright.config.js`，默认 base URL 是 `http://127.0.0.1:8000`。

建议：

- 后端纯函数或端点辅助逻辑优先加 Jest。
- 前端宏、Slash Commands、状态解析类功能可参考 `tests/frontend/`。
- 端到端 UI 改动用 Playwright，但不要为小型内部函数强行加 E2E。
- 文档/KB 修改无需运行测试；代码修改至少运行相关单元测试或 lint。

## 12. 高风险修改清单

以下修改需要额外谨慎：

- 改 `public/script.js` 主状态变量或生成流程。
- 改 `src/server-main.js` 中间件顺序。
- 改 `src/server-startup.js` 的 API 挂载路径。
- 改 `src/users.js` 用户目录、会话、认证逻辑。
- 改 `src/private-request-filter.js`、`request-proxy.js`、CORS proxy。
- 改 secrets 存储或把 key 暴露给前端。
- 改 `data/` 运行时内容或默认内容迁移逻辑。
- 改扩展加载顺序、manifest 解析、第三方扩展安装/更新逻辑。
- 改 Webpack 输出路径，会影响运行时 `/lib.js` 加载。

## 13. 快速文件索引

后端入口：

- `server.js`
- `src/server-main.js`
- `src/server-startup.js`
- `src/command-line.js`
- `src/config-init.js`
- `src/util.js`

后端核心：

- `src/users.js`
- `src/constants.js`
- `src/server-events.js`
- `src/plugin-loader.js`
- `src/private-request-filter.js`
- `src/request-proxy.js`
- `src/endpoints/`
- `src/vectors/`
- `src/middleware/`

前端核心：

- `public/index.html`
- `public/script.js`
- `public/lib.js`
- `public/style.css`
- `public/scripts/st-context.js`
- `public/scripts/extensions.js`
- `public/scripts/group-chats.js`
- `public/scripts/world-info.js`
- `public/scripts/openai.js`
- `public/scripts/textgen-settings.js`
- `public/scripts/slash-commands.js`
- `public/scripts/macros/`

扩展/插件：

- `public/scripts/extensions/`
- `public/scripts/extensions/third-party/`
- `src/endpoints/extensions.js`
- `plugins/`
- `plugins.js`

数据与默认内容：

- `data/`
- `default/config.yaml`
- `default/content/`
- `default/scaffold/README.md`

测试：

- `tests/package.json`
- `tests/jest.config.json`
- `tests/playwright.config.js`
- `tests/*.test.js`
- `tests/frontend/*.e2e.js`

## 14. 后续开发建议

进行具体二开前，先明确改动类型：

- 只加 UI/前端能力：优先前端扩展。
- 需要访问用户文件或密钥：后端 API 或服务端插件。
- 需要改核心聊天/生成流程：先画清 `public/script.js`、模型设置模块、端点之间的数据流。
- 需要新增服务商：同时规划前端设置、secrets、后端代理、流式处理和测试。
- 需要改安全/认证/目录：先单独做风险审计，不要混在功能 PR 中。

最小化原则：先通过扩展或独立模块接入；只有在确实需要核心状态或核心流程时，再修改 `public/script.js`、`src/server-main.js`、`src/users.js` 等高风险文件。
