
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CheckSquare, FolderKanban, Menu, X, Settings, Kanban, Loader2, Calendar } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TasksView } from './components/TasksView';
import { ProjectsView } from './components/ProjectsView';
import { ProjectKanban } from './components/ProjectKanban';
import { SettingsView } from './components/SettingsView';
import { CalendarView } from './components/CalendarView';
import { GlobalQuickAdd } from './components/GlobalQuickAdd';
import { NavigationItem, Task, Project, Priority, ProjectStatus } from './types';
import { loadAppData, saveAppData } from './services/dataService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Initial Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadAppData();
        if (data) {
          setTasks(data.tasks);
          setProjects(data.projects);
        }
      } catch (err) {
        console.error("Failed to load data", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Listen for manual reload events from SettingsView
    window.addEventListener('marketingflow-data-imported', fetchData);
    return () => window.removeEventListener('marketingflow-data-imported', fetchData);
  }, []);

  // Persistence: Trigger save whenever tasks or projects change
  useEffect(() => {
    if (!isLoading) {
      saveAppData(tasks, projects);
    }
  }, [tasks, projects, isLoading]);


  // Navigation Items
  const navItems: NavigationItem[] = [
    { id: 'dashboard', label: '工作台', icon: <LayoutDashboard size={20} /> },
    { id: 'tasks', label: '日常琐事', icon: <CheckSquare size={20} /> },
    { id: 'calendar', label: '日历视图', icon: <Calendar size={20} /> },
    { id: 'projects', label: '重点项目', icon: <FolderKanban size={20} /> },
    { id: 'kanban', label: '项目看板', icon: <Kanban size={20} /> },
    { id: 'settings', label: '系统设置', icon: <Settings size={20} /> },
  ];

  // Logic Functions
  const calculatedProjects = projects.map(project => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    if (projectTasks.length > 0) {
      const completedCount = projectTasks.filter(t => t.isCompleted).length;
      const progress = Math.round((completedCount / projectTasks.length) * 100);
      return { ...project, progress };
    }
    return project;
  });

  const handleAddTask = (title: string, priority: Priority, description: string, dueDate: string) => {
    const newTask: Task = { id: Date.now().toString(), title, description, isCompleted: false, priority, dueDate: dueDate || undefined };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const handleToggleTask = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  const handleDeleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  const handleBatchDeleteTasks = (ids: string[]) => setTasks(prev => prev.filter(t => !ids.includes(t.id)));
  const handleBatchStatusTasks = (ids: string[], isCompleted: boolean) => setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, isCompleted } : t));
  const handleLinkTask = (taskId: string, projectId: string) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, projectId } : t));
  
  const handleAddProject = (project: Project) => setProjects(prev => [...prev, project]);
  const handleUpdateProject = (id: string, updates: Partial<Project>) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  const handleUpdateProjectProgress = (id: string, progress: number) => setProjects(prev => prev.map(p => p.id === id ? { ...p, progress } : p));
  const handleUpdateProjectStatus = (id: string, status: ProjectStatus) => setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  const handleAddTasksToProject = (projectId: string, newTasks: {title: string, priority: Priority}[]) => {
    const formattedTasks: Task[] = newTasks.map((t, index) => ({
      id: `${Date.now()}-${index}`,
      title: t.title,
      priority: t.priority,
      isCompleted: false,
      projectId: projectId,
      description: '任务',
    }));
    setTasks(prev => [...formattedTasks, ...prev]);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-indigo-600"><Loader2 size={40} className="animate-spin"/></div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      <GlobalQuickAdd onAddTask={handleAddTask} />
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl flex items-center justify-center text-white font-logo text-2xl shadow-lg shadow-indigo-100">
              心
            </div>
            <span className="text-2xl font-logo tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              心流
            </span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <nav className="px-4 space-y-1.5 mt-4">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => { setCurrentView(item.id); setIsSidebarOpen(false); }} 
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                currentView === item.id 
                  ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-100 scale-[1.02]' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`${currentView === item.id ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'} transition-colors`}>
                {item.icon}
              </span>
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-6">
           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">专注度</p>
              <div className="flex gap-1">
                 {[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-indigo-400' : 'bg-gray-200'}`}/>)}
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        <header className="lg:hidden bg-white border-b border-gray-100 p-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-logo text-xl">心</div>
             <span className="font-logo text-xl text-gray-800">心流</span>
          </div>
          <button onClick={toggleSidebar} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl"><Menu size={24} /></button>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full flex flex-col">
          {isError && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-center gap-2 text-sm"><X size={16}/> 无法加载数据。请检查服务器连接。</div>}
          
          <div className="flex-1 animate-fade-in">
            {currentView === 'dashboard' && <Dashboard projects={calculatedProjects} tasks={tasks} />}
            {currentView === 'tasks' && <TasksView tasks={tasks} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} onBatchDelete={handleBatchDeleteTasks} onBatchStatus={handleBatchStatusTasks}/>}
            {currentView === 'calendar' && <CalendarView tasks={tasks} projects={projects} onAddTask={handleAddTask} onAddProject={handleAddProject} />}
            {currentView === 'projects' && <ProjectsView projects={calculatedProjects} tasks={tasks} onAddProject={handleAddProject} onUpdateProject={handleUpdateProject} onUpdateProjectProgress={handleUpdateProjectProgress} onUpdateProjectStatus={handleUpdateProjectStatus} onAddTasksToProject={handleAddTasksToProject} onLinkTask={handleLinkTask}/>}
            {currentView === 'kanban' && <ProjectKanban projects={calculatedProjects} tasks={tasks} onUpdateProjectStatus={handleUpdateProjectStatus}/>}
            {currentView === 'settings' && <SettingsView />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
