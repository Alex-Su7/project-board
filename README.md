
# 心流 (MarketingFlow) - 部署与使用指南

专为营销专业人士打造的高效任务与项目跟踪工作台，集成了最新的 Google Gemini AI 能力。

## 🚀 部署到 Vercel (推荐)

本项目已针对 Vercel 进行了优化，确保部署即运行，告别白屏。

1. **推送代码**：将代码推送至您的 GitHub 仓库。
2. **导入项目**：在 [Vercel 控制台](https://vercel.com/new) 中选择该仓库。
3. **配置环境变量**：
   - 核心变量名：`API_KEY`
   - 获取方式：访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 免费创建。
4. **环境变量设置**：在 Vercel 项目设置 -> Environment Variables 中，添加 `API_KEY`。
5. **部署**：点击 Deploy。

## 🛠 开发环境配置

1. 安装依赖：`npm install`
2. 创建 `.env` 文件：`API_KEY=您的密钥`
3. 运行：`npm run dev`

## 💎 关键技术栈

- **前端**：React 19 + TypeScript + TailwindCSS
- **AI**：`@google/genai` (Gemini 3 系列模型)
- **图表**：Recharts
- **图标**：Lucide-React

## ⚠️ 隐私与安全

- **API Key**：请勿将 API Key 硬编码在代码中。在 Vercel 部署时必须通过环境变量注入。
- **数据存储**：默认使用浏览器 `LocalStorage` 存储。如果需要多端同步，请启用“系统设置”中的服务器模式。

## 💡 AI 使用小贴士

- **智能速记**：直接输入“明天下午三点跟李总开会，很重要”，AI 会自动设置时间、优先级和标题。
- **项目拆解**：新建项目时勾选 AI，它可以帮你将复杂的营销活动自动拆分为具体的执行清单。
