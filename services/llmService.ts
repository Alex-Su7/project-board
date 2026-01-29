
import { GoogleGenAI, Type } from "@google/genai";
import { Priority, Task, Project, AppSettings, LLMModelConfig } from "../types";

// Always use process.env.API_KEY for security
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FAST_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

const SETTINGS_KEY = 'marketingflow_settings';

const DEFAULT_SETTINGS: AppSettings = {
  models: [
    {
      id: 'default-flash',
      name: 'Gemini Flash',
      provider: 'gemini',
      apiKey: '',
      modelId: 'gemini-3-flash-preview'
    },
    {
      id: 'default-pro',
      name: 'Gemini Pro',
      provider: 'gemini',
      apiKey: '',
      modelId: 'gemini-3-pro-preview'
    }
  ],
  fastModelId: 'default-flash',
  reasoningModelId: 'default-pro',
  useServer: false,
  serverUrl: 'http://localhost:3001'
};

// Fix: Implement getSettings to provide stored or default configuration
export const getSettings = (): AppSettings => {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (!saved) return DEFAULT_SETTINGS;
  try {
    return JSON.parse(saved);
  } catch {
    return DEFAULT_SETTINGS;
  }
};

// Fix: Implement saveSettings to persist configuration changes
export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Fix: Implement testModelConnection to verify LLM configuration for different providers
export const testModelConnection = async (config: LLMModelConfig): Promise<void> => {
  if (config.provider === 'gemini') {
    // For Gemini, we must use process.env.API_KEY as per the global guidelines
    const testAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await testAi.models.generateContent({
      model: config.modelId,
      contents: "ping",
    });
    if (!response.text) throw new Error("No response from Gemini");
  } else {
     // For OpenAI-compatible providers, we use the custom key provided in the config
     const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
     const response = await fetch(`${baseUrl}/chat/completions`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${config.apiKey}`
       },
       body: JSON.stringify({
         model: config.modelId,
         messages: [{ role: "user", content: "ping" }],
         max_tokens: 5
       })
     });
     if (!response.ok) {
       const err = await response.text();
       throw new Error(`OpenAI-compatible test failed: ${err}`);
     }
  }
};

interface TaskParsingResult {
  title: string;
  priority: Priority;
  dueDate?: string;
  description?: string;
}

interface ProjectTaskResult {
  title: string;
  priority: Priority;
}

/**
 * AI 自然语言识别任务
 */
export const parseSmartTask = async (input: string): Promise<TaskParsingResult> => {
  const today = new Date().toISOString().split('T')[0];
  const systemInstruction = `你是一个智能营销助手。今天是 ${today}。请将用户的口语解析为 JSON。
  JSON 结构: { "title": "...", "priority": "Urgent|High|Medium|Low", "dueDate": "YYYY-MM-DD", "description": "..." }
  - title: 核心任务（中文）。
  - priority: 识别语气的紧迫度。
  - dueDate: 识别相对日期并转为具体日期。`;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: input,
      config: {
        responseMimeType: "application/json",
        systemInstruction,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ['Urgent', 'High', 'Medium', 'Low'] },
            dueDate: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['title', 'priority']
        }
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Parse Error:", error);
    return { title: input, priority: Priority.MEDIUM };
  }
};

/**
 * AI 项目拆解建议
 */
export const suggestProjectTasks = async (projectInfo: string, history?: string[]): Promise<ProjectTaskResult[]> => {
  const historyContext = history?.length ? `用户以往偏好: ${history.join(', ')}` : '';
  const systemInstruction = `你是一位资深营销项目经理。请根据项目描述拆解 5-8 个具体步骤。
  ${historyContext}
  返回 JSON: { "tasks": [ { "title": "...", "priority": "High" }, ... ] }`;

  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: projectInfo,
      config: {
        responseMimeType: "application/json",
        systemInstruction,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
                },
                required: ['title', 'priority']
              }
            }
          },
          required: ['tasks']
        }
      },
    });

    const data = JSON.parse(response.text || "{}");
    return data.tasks || [];
  } catch (error) {
    console.error("AI Project Suggest Error:", error);
    return [];
  }
};

// Fix: Update suggestSubtasks to accept optional taskDescription to match call in TasksView.tsx
export const suggestSubtasks = async (taskTitle: string, taskDescription?: string): Promise<string[]> => {
  const systemInstruction = `请将以下任务拆解为 3-5 个具体的子任务步骤。仅返回一个 JSON 数组。
  任务: ${taskTitle}
  ${taskDescription ? `详细描述: ${taskDescription}` : ''}`;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: taskTitle,
      config: {
        responseMimeType: "application/json",
        systemInstruction,
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

/**
 * 工作台 AI 洞察
 */
export const getSmartInsights = async (tasks: Task[], projects: Project[]): Promise<string> => {
  const context = `
    项目现状: ${projects.map(p => `${p.name}(进度${p.progress}%)`).join('; ')}
    待办: ${tasks.filter(t => !t.isCompleted).slice(0, 5).map(t => t.title).join('; ')}
  `;

  const systemInstruction = `你是一个营销助理教练。根据现状给 1-2 条极其简短的中文建议。`;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: context,
      config: { systemInstruction }
    });
    return response.text || "继续保持！";
  } catch {
    return "保持专注，你正走在正确的轨道上。";
  }
};
