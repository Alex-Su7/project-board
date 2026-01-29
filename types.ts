import React from 'react';

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum ProjectStatus {
  PLANNING = 'Planning',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  COMPLETED = 'Completed'
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Link {
  id: string;
  title: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string; 
  isCompleted: boolean;
  priority: Priority;
  projectId?: string; 
  dueDate?: string;
  tags?: string[]; // Categorization
  subtasks?: Subtask[]; // Granular tracking
  links?: Link[]; // New: Structured External links
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  deadline: string;
  progress: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// LLM Configuration Types
export type LLMProviderType = 'gemini' | 'openai-compatible';

export interface LLMModelConfig {
  id: string; // Unique ID for internal reference
  name: string; // Display Name (e.g., "My DeepSeek")
  provider: LLMProviderType;
  apiKey: string;
  baseUrl?: string; // Required for OpenAI compatible (e.g., https://api.deepseek.com/v1)
  modelId: string; // The model string (e.g., "deepseek-chat", "gpt-4")
}

export interface AppSettings {
  models: LLMModelConfig[];
  fastModelId: string; // ID of the model used for parsing
  reasoningModelId: string; // ID of the model used for planning
  
  // Backend Configuration
  useServer: boolean;
  serverUrl: string; // e.g., http://localhost:3001
}