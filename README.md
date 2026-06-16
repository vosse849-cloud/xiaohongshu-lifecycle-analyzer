# 小红书笔记生命周期分析器

一个面向小红书内容运营场景的本地 CSV 数据分析工具，用来复盘笔记生命周期、识别内容状态、对比多次快照增长，并通过 AI 辅助生成运营复盘结论。

> 项目定位：AIGC 内容运营数据分析工具 / 本地网页数据分析工具。  
> 适合场景：小红书图文账号、AIGC 食谱内容账号、运营复盘、CSV 数据快照对比、作品集项目展示。

## 项目背景

小红书后台可以导出笔记数据，但原始 CSV 更像一张明细表。运营复盘时，仍然需要人工判断：

- 哪些笔记已经起量？
- 哪些笔记只是普通表现？
- 哪些内容反馈不错但流量不足？
- 哪些作品可能进入低速增长阶段？
- 多个导出时间点之间，账号整体新增了多少观看、收藏、赞藏？

这个工具把这些判断流程产品化：用户上传 CSV 后，系统在本地完成指标清洗、生命周期判断、多快照增长对比和复盘辅助，减少重复手工计算。

## 核心功能

- 上传小红书后台导出的 CSV 数据。
- 自动兼容小红书导出 CSV 的表头、分隔符、中文时间、百分号和千分位数字。
- 解析曝光、观看、点赞、收藏、评论、分享、涨粉等指标。
- 计算总览指标：总曝光、总观看量、总点赞、总收藏、总赞藏和、平均点击率、平均赞藏率等。
- 按规则判断笔记状态，例如爆款、普通、失败、疑似尾流等。
- 支持多份 CSV 快照对比，计算相邻时间段的新增曝光、观看、点赞、收藏、评论、分享、涨粉。
- 支持选题/菜品名自动识别、手动修正和选题修正库导入导出。
- 支持图表看板，展示状态分布、增长趋势、Top 作品等。
- AI 实验版支持通过本地 Node 后端接入 DeepSeek API，生成运营复盘结论。
- AI 只做复盘总结，不参与 CSV 解析、数据计算、状态判断和增长判断。

## 产品亮点

- **真实业务场景**：围绕小红书内容运营复盘，而不是纯展示型页面。
- **本地优先**：基础数据分析在浏览器本地完成，不依赖数据库。
- **快照思维**：支持多次 CSV 导出对比，用新增数据判断作品是否仍在增长。
- **内容生命周期判断**：把发布时间、观看量、赞藏率、收藏率等指标转换为更容易理解的运营状态。
- **选题修正库**：保留人工判断结果，下次导入相同标题时自动复用。
- **AI 辅助复盘**：DeepSeek 只读取页面已经计算出的结构化摘要，用于生成运营建议。
- **产品迭代痕迹清楚**：项目从静态分析器逐步迭代到多快照、图表、AI 复盘和面试展示稳定版。

## 技术栈

根据当前项目文件判断：

- 前端：HTML、CSS、原生 JavaScript。
- 图表：原生 HTML/CSS/SVG/Canvas 风格实现，无 CDN 图表库。
- 后端：Node.js 内置模块，本地服务用于 AI 实验版调用 DeepSeek API。
- 数据存储：浏览器 localStorage，用于保存选题修正库。
- 数据格式：CSV。
- AI 接入：DeepSeek Chat Completions API，本地 `.env` 配置 API Key。

## 项目结构

```text
.
├─ index.html                         # 稳定版静态页面入口
├─ style.css                          # 稳定版样式
├─ script.js                          # 稳定版本地分析逻辑
├─ xhs-lifecycle-analyzer-ai-lab/      # AI 实验版
│  ├─ index.html
│  ├─ style.css
│  ├─ script.js
│  ├─ server.js                       # 本地 Node 后端，负责 DeepSeek API 调用
│  ├─ package.json
│  ├─ .env.example                    # 示例配置，不包含真实 Key
│  ├─ 启动AI分析器.bat
│  ├─ start-ai-lab.bat
│  ├─ start-ai-lab.ps1
│  ├─ 关闭AI分析器.bat
│  ├─ stop-ai-lab.bat
│  └─ diagnose-ai-lab.bat
├─ demo/
│  └─ mock-xhs-notes.csv              # 脱敏 mock 演示数据
├─ docs/
│  ├─ project-summary.md
│  ├─ screenshots-guide.md
│  ├─ demo-plan.md
│  └─ screenshots/
└─ 迭代记录.md
```

## 本地启动方式

### 方式一：稳定版静态页面

适合只展示基础 CSV 分析功能。

1. 双击根目录的 `index.html`。
2. 上传 CSV 文件。
3. 输入或识别观察时间。
4. 查看分析结果。

稳定版不需要 Node.js，不需要后端，不需要 API Key。

### 方式二：AI 实验版

适合展示多快照、图表、选题修正库和 DeepSeek AI 复盘。

1. 进入 `xhs-lifecycle-analyzer-ai-lab/`。
2. 第一次使用时，复制 `.env.example` 为 `.env`，或直接双击 `启动AI分析器.bat` 按提示输入 DeepSeek API Key。
3. 双击 `启动AI分析器.bat` 或 `start-ai-lab.bat`。
4. 浏览器会打开 `http://127.0.0.1:8787`。
5. 使用结束后，可双击 `关闭AI分析器.bat` 或 `stop-ai-lab.bat` 关闭本地后端。

也可以在 AI 实验版目录中运行：

```bash
npm start
```

当前 `package.json` 没有外部依赖，通常不需要 `npm install`。

## DeepSeek API 配置

AI 功能需要本地 `.env`：

```text
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-v4-pro
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MAX_TOKENS=16000
DEEPSEEK_AUTO_CONTINUE_LIMIT=3
PORT=8787
```

注意：

- `.env` 不应提交到 GitHub。
- API Key 不应写进前端 `script.js`。
- 没有 API Key 时，CSV 分析、多快照对比、图表和选题修正库仍可使用，只有 DeepSeek AI 复盘不可用。
- DeepSeek 只读取页面已计算好的摘要数据，不重新计算 CSV。

## 使用流程

1. 准备从小红书后台导出的 CSV。
2. 推荐使用文件名表示观察时间，例如 `0610 19点45.csv`。
3. 上传单份 CSV，查看当前笔记状态、总览数据和明细表格。
4. 上传多份不同时间点的 CSV，查看相邻快照之间的新增数据。
5. 检查图表看板，快速定位新增观看、赞藏和增长状态。
6. 修正识别不准的选题/菜品名，并导出选题修正库备份。
7. 如已配置 DeepSeek API Key，可生成 AI 复盘结论。

## Mock 演示数据

项目提供一份脱敏 mock 数据：

```text
demo/mock-xhs-notes.csv
```

这份数据用于 GitHub 展示和面试演示，不包含真实账号数据、手机号、邮箱、Cookie、Session 或 API Key。

当前项目没有完整的“AI mock 模式”。如果未来要做在线演示，建议增加一个 mock AI 返回模式，让页面在不调用真实 DeepSeek API 的情况下展示 AI 复盘流程。

## 截图展示

截图建议放在：

```text
docs/screenshots/
```

建议预留截图：

- `01-home-upload.png`：首页和 CSV 上传区。
- `02-overview-status.png`：核心数据总览和状态分布。
- `03-table-detail.png`：明细表格和筛选排序。
- `04-snapshot-compare.png`：多快照对比结果。
- `05-dashboard-charts.png`：数据报表看板。
- `06-topic-correction.png`：选题修正库。
- `07-ai-recap.png`：AI 复盘结果区域。

详细截图清单见 [docs/screenshots-guide.md](docs/screenshots-guide.md)。

## 安全说明

上传 GitHub 前请确认：

- 不提交 `.env`。
- 不提交真实 API Key、token、账号密码、Cookie、Session。
- 不提交真实小红书后台 CSV，除非已经完全脱敏。
- 不提交包含真实手机号、邮箱、地址、身份证等个人信息的文件。
- 真实数据目录应保留在本地，并通过 `.gitignore` 忽略。
- 公开展示时优先使用 `demo/mock-xhs-notes.csv`。

## 在线部署判断

- 根目录稳定版是纯前端静态工具，理论上可以部署到 GitHub Pages。
- AI 实验版依赖本地 Node 后端和 `.env`，不建议直接部署成公开在线服务。
- 如果要做在线预览，建议先做 mock 演示版，不暴露真实 API Key，不把真实 AI 服务直接开放到公网。
- 不要把 DeepSeek API Key 放到前端。

## 项目价值

这个项目展示的不是单一页面效果，而是一个从真实运营问题出发的工具化产品：

- 把内容运营复盘流程结构化。
- 把 CSV 明细转成可判断的生命周期状态。
- 把多次导出的快照变成可比较的增长数据。
- 把人工选题判断沉淀成修正库。
- 把 AI 放在复盘总结层，和本地规则分析协同。
- 体现了需求拆解、前端实现、数据清洗、产品迭代和安全意识。

## 后续规划

- 增加完整 mock 演示模式，便于公开在线展示。
- 支持导入更多平台或不同字段格式。
- 增加规则配置面板，让阈值可视化调整。
- 支持更多图表，例如作品生命周期曲线、连续低增长识别。
- 增加真实多快照趋势视图，而不只是相邻区间对比。
- 做成更正式的本地桌面 App。
- 提供脱敏数据模板和一键生成演示数据功能。
