
import { GoogleGenAI, Type } from "@google/genai";
import { Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 定义不同场景使用的模型
// Fix: Use gemini-3-flash-preview for basic text tasks as per guidelines
const FAST_MODEL = "gemini-3-flash-preview";
// Pro: 推理能力强，适合复杂规划 (Complex reasoning)
const REASONING_MODEL = "gemini-3-pro-preview";

const taskListSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "任务标题（中文）",
      },
      priority: {
        type: Type.STRING,
        enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT],
        description: "建议的优先级",
      },
    },
    required: ["title", "priority"],
  },
};

const smartTaskSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "任务的具体内容" },
    priority: { 
      type: Type.STRING, 
      enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT],
      description: "根据语气判断的优先级" 
    },
    dueDate: { type: Type.STRING, description: "YYYY-MM-DD 格式的日期，如果未提及则为空" },
    description: { type: Type.STRING, description: "从输入中提取的额外细节或备注" }
  },
  required: ["title", "priority"]
};

/**
 * 复杂任务：项目拆解
 * 使用推理能力更强的 Pro 模型
 */
export const suggestProjectTasks = async (projectDescription: string): Promise<{ title: string; priority: Priority }[]> => {
  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL, // 切换至 Pro 模型
      contents: `我是一个市场营销助理，正在规划一个项目: "${projectDescription}"。
      请将其拆解为 5-8 个具体的、可执行的任务步骤。
      请使用简体中文回复。任务标题要简练且专业。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: taskListSchema,
        // Pro 模型通常支持更复杂的系统指令
        systemInstruction: "你是一位资深市场营销项目经理。你的目标是将宏大的营销目标拆解为助理可以具体执行的操作步骤（例如：'起草文案'、'联系KOL'、'审核物料'）。确保逻辑连贯，覆盖项目全周期。",
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const tasks = JSON.parse(jsonText);
    return tasks;
  } catch (error) {
    console.error("Error generating tasks:", error);
    throw new Error("AI 生成项目拆解失败");
  }
};

/**
 * 简单任务：自然语言解析
 * 使用速度最快的 Flash 模型
 */
export const parseSmartTask = async (input: string): Promise<{ title: string; priority: Priority; dueDate?: string; description?: string }> => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL, // 保持使用 Flash 模型
      contents: `用户输入: "${input}"。今天是 ${today}。请分析这句话，提取任务信息。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: smartTaskSchema,
        systemInstruction: `你是一个智能任务助手。请 from 用户的自然语言输入中提取任务要素。
        1. 识别相对时间（如“下周五”、“明天”）并转换为具体的 YYYY-MM-DD 日期。
        2. 根据语气词（如“紧急”、“立刻”、“重要”）判断优先级。默认是 Medium。
        3. 提取核心动作作为标题。`,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response");
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Smart parse failed", error);
    // Fallback if AI fails
    return {
      title: input,
      priority: Priority.MEDIUM,
      description: "AI 自动解析失败，仅保留原始内容"
    };
  }
};
