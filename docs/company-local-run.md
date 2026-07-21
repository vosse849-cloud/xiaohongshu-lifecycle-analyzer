# Windows / macOS 本地运行说明

本文档用于把“小红书笔记生命周期分析器”从 GitHub 拉到本地，在 Windows 或公司 MacBook Pro 上运行。

## 1. 当前项目结构确认

当前仓库包含两个版本：

- 根目录：稳定版静态网页工具，入口是 `index.html`，不需要 Node.js，不需要后端，不需要 API Key。
- `xhs-lifecycle-analyzer-ai-lab/`：AI 实验版，本地 Node.js 网页工具，包含前端页面和本地后端。

AI 实验版结构：

```text
xhs-lifecycle-analyzer-ai-lab/
├─ index.html          # 前端入口
├─ script.js           # 前端交互、CSV 分析、多快照对比、图表和 AI 请求
├─ style.css           # 页面样式
├─ server.js           # 本地 Node 后端入口，只在后端读取 AI Key
├─ package.json        # Node 启动脚本
└─ .env.example        # 示例配置，不包含真实 Key
```

根目录还提供 macOS 一键启动脚本：

```text
start-mac.command
```

`package.json` 当前启动命令：

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

所以 AI 实验版启动命令是：

```bash
npm run start
```

## 2. 安全边界

必须遵守：

- 不要提交 `.env`。
- 不要把公司 API Key 写进 README、截图、前端 JS 或任何公开文件。
- 不要上传真实小红书 CSV，除非已经完全脱敏。
- 不要提交日志、缓存、`node_modules/`、`dist/`、`build/`。
- `.env.example` 只能写占位符。

当前 `.gitignore` 已覆盖：

```text
.env
.env.*
node_modules/
logs/
dist/
build/
*.log
小红书每日数据csv/
real-data/
private-data/
exports/
raw-data/
```

AI Key 只由 `xhs-lifecycle-analyzer-ai-lab/server.js` 在本地后端读取。前端只请求本地接口，不直接调用 AI 服务，也不保存 Key。

## 3. macOS 第一次运行步骤

适用环境：公司 MacBook Pro。

### 3.1 安装 Node.js

先安装 Node.js LTS 版本。可以从 Node.js 官网下载安装包，也可以使用公司允许的包管理方式。

安装后打开 Terminal，检查：

```bash
node -v
npm -v
```

能看到版本号即可。

### 3.2 拉取项目

```bash
git clone https://github.com/vosse849-cloud/xiaohongshu-lifecycle-analyzer.git
cd xiaohongshu-lifecycle-analyzer
```

### 3.3 进入 AI 实验版目录

```bash
cd xhs-lifecycle-analyzer-ai-lab
```

### 3.4 安装依赖

```bash
npm install
```

当前项目没有复杂外部依赖，这一步主要用于让 Node 项目在本地环境完成初始化。

### 3.5 创建 `.env`

```bash
cp .env.example .env
```

编辑 `.env`：

```bash
nano .env
```

填写这些变量：

```text
AI_BASE_URL=https://api.deepseek.com/chat/completions
AI_API_KEY=your-company-api-key
AI_MODEL=deepseek-v4-pro
AI_MAX_TOKENS=16000
AI_TEMPERATURE=0.3
AI_AUTO_CONTINUE_LIMIT=3
PORT=8787
```

说明：

- `AI_BASE_URL`：AI 服务接口地址。
- `AI_API_KEY`：你的公司或个人 AI API Key，只保存在本地 `.env`。
- `AI_MODEL`：模型名，当前示例为 `deepseek-v4-pro`。
- `AI_MAX_TOKENS`：单次输出上限。
- `AI_TEMPERATURE`：输出随机性，建议先保持 `0.3`。
- `PORT`：本地端口，默认 `8787`。

保存退出：

- `Ctrl + O` 保存。
- 回车确认文件名。
- `Ctrl + X` 退出。

### 3.6 启动项目

方式一：使用 macOS 一键启动文件。

第一次使用前，在项目根目录执行一次：

```bash
chmod +x start-mac.command
```

之后可以在 Finder 中双击：

```text
start-mac.command
```

它会自动：

1. 进入脚本所在目录。
2. 进入 `xhs-lifecycle-analyzer-ai-lab/`。
3. 检查 `node` 和 `npm`。
4. 如果 `node_modules` 不存在，执行 `npm install`。
5. 检查 `.env` 是否存在。
6. 如果 `.env` 不存在，提示你先执行 `cp .env.example .env` 并填写 Key，不会自动写入任何真实 Key。
7. 启动 `npm run start`。
8. 自动打开 `http://127.0.0.1:8787`。

方式二：手动启动。

```bash
npm run start
```

看到类似输出即可：

```text
AI lab server running at http://127.0.0.1:8787
```

然后打开浏览器访问：

```text
http://127.0.0.1:8787
```

### 3.7 上传 CSV 测试

可以先使用仓库里的 mock 数据：

```text
demo/mock-xhs-notes.csv
```

如果在 AI 实验版目录里，需要回到上一级找到：

```text
../demo/mock-xhs-notes.csv
```

测试流程：

1. 打开网页。
2. 上传 CSV。
3. 输入或从文件名自动识别观察时间。
4. 点击“开始分析”。
5. 检查核心数据总览、状态分布、明细表格是否出现结果。

### 3.8 AI 复盘测试

前提：`.env` 中的 `AI_API_KEY` 有效，且网络可以访问 `AI_BASE_URL`。

测试流程：

1. 先完成单份 CSV 分析，或完成多快照对比。
2. 点击“生成 DeepSeek AI 复盘结论”。
3. 检查 AI 复盘区域是否显示：
   - 模型名
   - 分析依据
   - token 用量
   - AI 复盘文本

如果 AI 失败，但 CSV 分析仍正常，说明基础分析器没有受影响。优先检查 `.env`、网络、模型名和账号额度。

## 4. macOS 后续启动

以后已经配置好 `.env` 后，只需要：

方式一：双击根目录：

```text
start-mac.command
```

方式二：Terminal 手动启动：

```bash
cd xiaohongshu-lifecycle-analyzer/xhs-lifecycle-analyzer-ai-lab
npm run start
```

然后打开：

```text
http://127.0.0.1:8787
```

停止服务：

```bash
Ctrl + C
```

## 5. Windows 本地运行

Windows 有两种方式。

### 5.1 稳定版

双击根目录：

```text
index.html
```

适合只使用本地 CSV 分析，不使用 AI。

### 5.2 AI 实验版

进入：

```text
xhs-lifecycle-analyzer-ai-lab/
```

可以双击：

```text
启动AI分析器.bat
```

或英文备用：

```text
start-ai-lab.bat
```

关闭后端：

```text
关闭AI分析器.bat
```

或：

```text
stop-ai-lab.bat
```

Windows 启动脚本是 Windows 专用；macOS 请使用 Terminal + `npm run start`。

## 6. 跨平台兼容说明

- 核心网页功能是 HTML / CSS / JavaScript，浏览器可运行。
- AI 实验版本地后端是 Node.js，Windows 和 macOS 都可运行。
- Windows `.bat` 和 PowerShell 脚本只用于 Windows 一键启动。
- macOS 不使用 `.bat` 或 PowerShell，直接使用 `npm run start`。
- 后端使用 Node 的 `path` 模块处理文件路径，没有要求固定 Windows 路径。

## 7. 常见问题

### 页面打不开

检查服务是否启动：

```bash
npm run start
```

确认浏览器访问：

```text
http://127.0.0.1:8787
```

### 端口被占用

修改 `.env`：

```text
PORT=8788
```

然后重新启动，并访问：

```text
http://127.0.0.1:8788
```

### AI 分析失败

检查：

- `.env` 是否存在。
- `AI_API_KEY` 是否填写正确。
- `AI_BASE_URL` 是否可以访问。
- `AI_MODEL` 是否正确。
- 公司网络是否允许访问 AI 服务。
- 账号余额或额度是否正常。

### 不想配置 AI Key

可以不配置 AI Key。单份 CSV 分析、多快照对比、图表看板、选题修正库仍然可以使用，只有 AI 复盘不可用。
