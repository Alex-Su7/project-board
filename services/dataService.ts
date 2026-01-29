import { Task, Project, AppSettings } from '../types';
import { getSettings } from './llmService';

const STORAGE_KEYS = {
  TASKS: 'marketingflow_tasks',
  PROJECTS: 'marketingflow_projects',
  SCRATCHPAD: 'marketingflow_scratchpad'
};

export interface AppData {
  tasks: Task[];
  projects: Project[];
}

/**
 * Loads data from either LocalStorage or the Backend Server
 */
export const loadAppData = async (): Promise<AppData | null> => {
  const settings = getSettings();

  if (settings.useServer && settings.serverUrl) {
    try {
      const response = await fetch(`${settings.serverUrl}/api/data`);
      if (!response.ok) throw new Error('Failed to fetch from server');
      const data = await response.json();
      return {
        tasks: data.tasks || [],
        projects: data.projects || []
      };
    } catch (error) {
      console.error("Server Load Error:", error);
      // Fallback or throw? For now, let's warn and return null to indicate failure
      // Or maybe fallback to local? No, that causes sync issues.
      throw error;
    }
  } else {
    // Local Mode
    const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return {
      tasks: tasks ? JSON.parse(tasks) : [],
      projects: projects ? JSON.parse(projects) : []
    };
  }
};

/**
 * Saves data to either LocalStorage or the Backend Server
 */
export const saveAppData = async (tasks: Task[], projects: Project[]) => {
  const settings = getSettings();

  if (settings.useServer && settings.serverUrl) {
    // Server Mode: Debounce could be handled by caller, but we'll do a direct save here
    try {
      await fetch(`${settings.serverUrl}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, projects })
      });
    } catch (error) {
      console.error("Server Save Error:", error);
      // We might want to show a toast here in a real app
    }
  } else {
    // Local Mode
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }
};