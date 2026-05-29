# 0xHerstory · Women 的活动日历

面向社群的活动日历站点：活动组织者用它高效管理与发布活动，社群参与者用它清晰查看近期活动、订阅日历提醒与邮件通知。

整个站点是**纯前端单文件应用**（构建后为单个 `index.html`），不需要服务器与数据库；数据存储与同步全部基于 **GitHub 公开仓库**，免费、低成本、易迁移。

## 核心特性

- 🗓️ 三种视图：年度共创热力图、月视图、活动列表
- 👀 **访客只读 / 管理员可编辑**：未登录为只读，输入 GitHub Token 验证后进入管理员模式
- ☁️ **GitHub 仓库即后端**：管理员把活动数据发布到公开仓库，访客访问站点时自动从 CDN 读取
- 🔔 **日历订阅 (ICS)**：一键下载 `.ics` 导入 Google / Apple / Outlook 日历，活动前 1 天与 1 小时自动提醒
- 📧 **邮箱订阅**：支持配置订阅端点（如 Formspree）或回退到 `mailto` 给组织者
- 📥 **全量导入 / 导出**：本地 JSON 文件导入导出 + GitHub 发布/拉取
- 📤 一键分享：年/月/日/单活动的文案与 JSON

## 数据存储架构（低成本方案）

```
管理员（持 Token）            GitHub 公开仓库                访客（无需 Token）
  编辑活动 ──发布(API PUT)──▶  calendar-data.json  ──raw CDN读取──▶  自动加载展示
                                README.md（人类可读）             订阅日历 / 邮箱
```

- 管理员在站点「管理后台」输入 [GitHub Personal Access Token](https://github.com/settings/tokens/new?scopes=repo)（需 `repo` 权限）即可发布数据。
- 仓库为**公开**仓库，访客通过 `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/calendar-data.json` 直接读取，无 API 限流、无需登录。
- `calendar-data.json` 即全量备份文件（含活动与订阅配置），可随时下载留底或迁移。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 构建为 dist/index.html（单文件）
npm run preview  # 预览构建结果
```

## 部署（推荐 GitHub Pages，全程免费）

1. `npm run build` 生成 `dist/index.html`。
2. 将 `dist/index.html` 推送到一个仓库的 GitHub Pages（或任意静态托管：Vercel / Netlify / Cloudflare Pages）。
3. 首次打开站点 → 点击「管理」→ 填入 Token、用户名、数据仓库名 → 「验证」进入管理员模式。
4. 添加活动后点击「发布到 GitHub」。
5. 把带数据源参数的链接分享给社群：
   ```
   https://妳的站点/?source=用户名/仓库名
   ```
   访客打开即自动加载最新活动，并可订阅提醒。

## 使用说明

### 管理员
- 「管理」按钮 → 验证 Token 进入管理员模式（仅存于本地浏览器）。
- 添加/编辑活动：支持类型、参与人数、时间段、地点、简介、报名链接。
- 「发布到 GitHub」把当前数据同步到公开仓库；「从 GitHub 拉取」覆盖本地为云端数据。
- 「导入文件 / 导出全量」用于本地 JSON 备份与迁移。

### 参与者
- 直接浏览活动，无需登录。
- 「订阅提醒」→ 下载日历文件导入个人日历（获得系统级提醒通知），或填写邮箱订阅。
- 每个活动可单独「加入 Google 日历 / .ics」。

## 邮箱订阅配置（可选）

静态站点无法直接发送邮件，提供两种低成本方式（在管理后台「订阅设置」中配置，随数据发布生效）：

- **订阅端点**：填入一个接收 POST JSON 的地址（如 [Formspree](https://formspree.io/) 免费表单），订阅请求会提交到该端点。
- **组织者邮箱**：未配置端点时，订阅将通过访客本地邮件客户端 `mailto` 发送到该邮箱。

日历订阅 (ICS) 是最可靠的「提醒通知」渠道，建议优先引导参与者使用。

## 技术栈

React 19 · Vite 7 · TypeScript · Tailwind CSS 4 · Zustand · lucide-react · vite-plugin-singlefile
