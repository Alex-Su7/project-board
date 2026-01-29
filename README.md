
# 心流 (MarketingFlow) - 部署指南

专为营销专业人士打造的任务与项目跟踪工作台，集成 Google Gemini AI 能力。

## 环境变量配置

本应用依赖于 Google Gemini API。在部署平台上，请务必添加以下环境变量：

| 环境变量名 | 说明 | 获取方式 |
| :--- | :--- | :--- |
| `API_KEY` | Google Gemini API 密钥 | [Google AI Studio](https://aistudio.google.com/app/apikey) |

## 快速部署 (Vercel / Netlify)

1. **关联 GitHub**：将本项目代码推送至您的 GitHub 仓库。
2. **导入项目**：在 Vercel 或 Netlify 仪表盘中选择该仓库。
3. **配置变量**：在 "Environment Variables" 部分添加 `API_KEY`。
4. **开始构建**：构建命令保持默认 `npm run build`，输出目录为 `dist`。

## 本地开发

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件并填入您的 API_KEY

# 安装依赖并启动
npm install
npm run dev
```

## 注意事项

- **免费额度**：Gemini API 提供可观的免费试用额度，请避免短时间内超大规模调用。
- **数据隐私**：您的任务和项目数据目前默认存储在浏览器的 LocalStorage 中，不会上传至第三方数据库。
