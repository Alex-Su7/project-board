
import { GoogleGenAI, Type } from "@google/genai";
import { Priority, Task, Project, AppSettings, LLMModelConfig } from "../types";

// 统一 AI 配置：确保即使 API_KEY 缺失也不会导致应用初始化崩溃
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Missing process.env.API_KEY. AI features will be unavailable.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const FAST_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

interface TaskParsingResult {
  title: string;
  priority: Priority;
  dueDate?: string;
  description?: string;
}

/**
 * 获取应用设置
 * Fix: Added missing getSettings export.
 */
export const getSettings = (): AppSettings => {
  const saved = localStorage.getItem('marketingflow_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse settings", e);
    }
  }
  return {
    models: [],
    fastModelId: '',
    reasoningModelId: '',
    useServer: false,
    serverUrl: 'http://localhost:3001'
  };
};

/**
 * 保存应用设置
 * Fix: Added missing saveSettings export.
 */
export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem('marketingflow_settings', JSON.stringify(settings));
};

/**
 * 测试模型连接
 * Fix: Added missing testModelConnection export.
 */
export const testModelConnection = async (config: LLMModelConfig): Promise<boolean> => {
  if (config.provider === 'gemini') {
    // Guidelines: Always use process.env.API_KEY directly when initializing GoogleGenAI.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: 'Hello',
      });
      return !!response.text;
    } catch (e) {
      console.error("Gemini connection test failed", e);
      throw e;
    }
  } else {
    // OpenAI Compatible test
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [{ role: 'user', content: 'Ping' }]
      })
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Connection test failed: ${err}`);
    }
    return true;
  }
};

/**
 * 智能解析用户自然语言输入
 */
export const parseSmartTask = async (input: string): Promise<TaskParsingResult> => {
  const ai = getAIClient();
  if (!ai) return { title: input, priority: Priority.MEDIUM };

  const today = new Date().toISOString().split('T')[0];
  const systemInstruction = `你是一个智能营销助手。今天是 ${today}。请将用户的口语解析为 JSON。
  JSON 结构: { "title": "...", "priority": "Urgent|High|Medium|Low", "dueDate": "YYYY-MM-DD", "description": "..." }`;

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

    const resultText = response.text || "{}";
    return JSON.parse(resultText);
  } catch (error) {
    console.error("AI Parse Error:", error);
    // 容错处理：解析失败时返回原字符串作为标题
    return { title: input, priority: Priority.MEDIUM };
  }
};

/**
 * AI 项目拆解建议
 */
export const suggestProjectTasks = async (projectInfo: string): Promise<{title: string, priority: Priority}[]> => {
  const ai = getAIClient();
  if (!ai) return [];

  const systemInstruction = `你是一位资深营销经理。根据项目描述拆解 5-8 个具体执行步骤。返回 JSON: { "tasks": [ { "title": "...", "priority": "High" }, ... ] }`;

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
          }
        }
      },
    });

    const data = JSON.parse(response.text || "{}");
    return data.tasks || [];
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
};

/**
 * 拆解子任务
 */
export const suggestSubtasks = async (taskTitle: string, taskDescription?: string): Promise<string[]> => {
  const ai = getAIClient();
  if (!ai) return [];

  const systemInstruction = `将任务拆解为 3-5 个具体的子任务步骤。仅返回一个字符串数组。`;
  const prompt = `任务: ${taskTitle}${taskDescription ? `\n描述: ${taskDescription}` : ''}`;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
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
  const ai = getAIClient();
  if (!ai) return "请在环境变量中配置 API_KEY 以获取 AI 洞察。";

  const context = `项目进度: ${projects.map(p => `${p.name}:${p.progress}%`).join(', ')}. 待办事项: ${tasks.filter(t => !t.isCompleted).map(t => t.title).join(', ')}`;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: context,
      config: { 
        systemInstruction: "你是一个专业的营销工作台助手。请根据当前进度给出 1 条简短的行动建议（中文）。" 
      }
    });
    return response.text || "继续加油！";
  } catch {
    return "保持专注，你正走在正确的轨道上。";
  }
};
