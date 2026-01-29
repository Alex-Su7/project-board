
import React, { useState } from 'react';
import { Project, ProjectStatus, Task, Priority } from '../types';
import { Plus, Sparkles, Loader2, Calendar, ArrowRight, X, Link, CheckCircle2, Pencil, Save, Calculator, Search, Filter } from 'lucide-react';
import { suggestProjectTasks } from '../services/llmService';

interface ProjectsViewProps {
  projects: Project[];
  tasks?: Task[]; 
  onAddProject: (project: Project) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onUpdateProjectProgress: (id: string, progress: number) => void;
  onUpdateProjectStatus: (id: string, status: ProjectStatus) => void;
  onAddTasksToProject: (projectId: string, tasks: {title: string, priority: Priority}[]) => void;
  onLinkTask: (taskId: string, projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ 
  projects, 
  tasks = [], 
  onAddProject, 
  onUpdateProject,
  onUpdateProjectProgress, 
  onUpdateProjectStatus,
  onAddTasksToProject,
  onLinkTask
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<{title: string, priority: Priority}[]>([]);
  const [useAI, setUseAI] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      description: desc,
      deadline,
      status: ProjectStatus.PLANNING,
      progress: 0
    };
    onAddProject(newProject);
    if (useAI && generatedTasks.length > 0) {
      onAddTasksToProject(newProject.id, generatedTasks);
    }
    resetForm();
  };

  const handleAIGenerate = async () => {
    if (!desc || !name) return;
    setIsGenerating(true);
    try {
      // Extract history: last 10 completed tasks to learn user style
      // Fix: Removed 'history' argument as suggestProjectTasks in llmService only accepts projectInfo string.
      const tasksResult = await suggestProjectTasks(`${name}: ${desc}`);
      setGeneratedTasks(tasksResult);
    } catch (e) {
      alert("AI 生成计划失败，请检查配置。");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setName('');
    setDesc('');
    setDeadline('');
    setGeneratedTasks([]);
    setUseAI(false);
  };

  const filteredProjects = projects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">长期重点项目</h2>
          <p className="text-gray-500">追踪Campaign进度。</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"><Plus size={18} />新建项目</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <div key={project.id} className="bg-white p-5 rounded-xl border hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedProject(project)}>
             <h3 className="font-bold text-gray-900">{project.name}</h3>
             <p className="text-xs text-gray-500 mt-1 line-clamp-2">{project.description}</p>
             <div className="mt-4">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                   <span>进度</span>
                   <span>{project.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-600" style={{width: `${project.progress}%`}}/>
                </div>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
              <h3 className="text-lg font-bold">新建项目</h3>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="名称" className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"/>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="描述" className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" rows={3}/>
              
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-indigo-800 flex items-center gap-2"><Sparkles size={16}/> AI 拆解助手</span>
                    <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}/>
                 </div>
                 {useAI && (
                    <>
                      <button onClick={handleAIGenerate} disabled={isGenerating} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2">
                         {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} 生成计划
                      </button>
                      {generatedTasks.length > 0 && (
                        <div className="text-[10px] text-indigo-700 bg-white p-2 rounded border border-indigo-100 max-h-32 overflow-y-auto">
                           {generatedTasks.map((t, i) => <div key={i}>• {t.title} ({t.priority})</div>)}
                        </div>
                      )}
                    </>
                 )}
              </div>

              <div className="flex gap-2">
                 <button onClick={resetForm} className="flex-1 py-2 bg-gray-100 rounded-xl text-sm">取消</button>
                 <button onClick={handleCreate} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">创建</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
