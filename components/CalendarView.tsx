
import React, { useState } from 'react';
import { Task, Project, Priority, ProjectStatus } from '../types';
import { ChevronLeft, ChevronRight, Flag, Calendar as CalendarIcon, CheckCircle2, Plus, ListTodo, FolderPlus, X } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  onAddTask: (title: string, priority: Priority, description: string, dueDate: string) => void;
  onAddProject: (project: Project) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, projects, onAddTask, onAddProject }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<{ x: number, y: number, date: string } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const formatDate = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const handleDateClick = (e: React.MouseEvent, dateStr: string) => {
    // Prevent menu if clicking inside the task list of a cell
    if ((e.target as HTMLElement).closest('.custom-scrollbar')) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setShowAddMenu({
      x: e.clientX,
      y: e.clientY,
      date: dateStr
    });
  };

  const handleQuickAddTask = () => {
    if (!showAddMenu) return;
    const title = prompt(`为 ${showAddMenu.date} 添加新任务:`);
    if (title) {
      onAddTask(title, Priority.MEDIUM, '', showAddMenu.date);
    }
    setShowAddMenu(null);
  };

  const handleQuickAddProject = () => {
    if (!showAddMenu) return;
    const name = prompt(`在 ${showAddMenu.date} 截止的新项目名称:`);
    if (name) {
      const newProject: Project = {
        id: Date.now().toString(),
        name,
        description: '从日历快捷创建的项目',
        deadline: showAddMenu.date,
        status: ProjectStatus.PLANNING,
        progress: 0
      };
      onAddProject(newProject);
    }
    setShowAddMenu(null);
  };

  const renderDays = () => {
    const days = [];
    const todayStr = formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/30 border-b border-r border-gray-100"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(year, month, d);
      const isToday = dateStr === todayStr;
      const isSelected = showAddMenu?.date === dateStr;
      
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      const dayProjects = projects.filter(p => p.deadline === dateStr);

      days.push(
        <div 
          key={d} 
          onClick={(e) => handleDateClick(e, dateStr)}
          className={`min-h-[120px] border-b border-r border-gray-100 p-2 transition-all flex flex-col group cursor-pointer relative ${
            isToday ? 'bg-indigo-50/20' : 'bg-white'
          } ${isSelected ? 'ring-2 ring-inset ring-indigo-500 z-10' : 'hover:bg-gray-50'}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all ${
              isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 group-hover:bg-gray-200'
            }`}>
              {d}
            </span>
            <Plus size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {dayProjects.map(p => (
              <div key={p.id} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-1 rounded-md border border-purple-100 truncate flex items-center gap-1.5 font-bold shadow-sm" title={`项目截止: ${p.name}`}>
                 <Flag size={10} className="shrink-0 fill-purple-400 text-purple-600" />
                 <span className="truncate">{p.name}</span>
              </div>
            ))}
            
            {dayTasks.map(t => (
              <div key={t.id} className={`text-[10px] px-1.5 py-1 rounded-md border truncate flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md ${
                t.isCompleted 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-70' 
                  : t.priority === 'Urgent' 
                    ? 'bg-red-50 text-red-700 border-red-100'
                    : 'bg-blue-50 text-blue-700 border-blue-100'
              }`} title={t.title}>
                 {t.isCompleted ? (
                    <CheckCircle2 size={10} className="shrink-0" />
                 ) : (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.priority === 'Urgent' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                 )}
                 <span className="truncate font-medium">{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col animate-fade-in relative">
      <div className="flex justify-between items-center shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <CalendarIcon className="text-indigo-600" /> 日历视图
           </h2>
           <p className="text-gray-500 text-sm">点击日期单元格可快速安排工作。</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
           <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"><ChevronLeft size={20}/></button>
           <span className="text-lg font-bold w-36 text-center text-gray-800 tracking-tight">
             {year}年 {month + 1}月
           </span>
           <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"><ChevronRight size={20}/></button>
           <div className="w-px h-6 bg-gray-200 mx-2"></div>
           <button onClick={goToday} className="text-sm px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-bold transition-all active:scale-95">
             今天
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden relative">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
          {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((d, index) => (
            <div key={d} className={`py-3 text-center text-xs font-bold uppercase tracking-widest ${index === 0 || index === 6 ? 'text-indigo-400' : 'text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 overflow-y-auto auto-rows-fr">
          {renderDays()}
        </div>
      </div>

      {/* Quick Add Context Menu */}
      {showAddMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(null)}></div>
          <div 
            className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 w-48 animate-in zoom-in-95 duration-200"
            style={{ 
              left: Math.min(showAddMenu.x, window.innerWidth - 200), 
              top: Math.min(showAddMenu.y, window.innerHeight - 150) 
            }}
          >
            <div className="px-3 py-2 border-b border-gray-50 mb-1 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">{showAddMenu.date}</span>
              <button onClick={() => setShowAddMenu(null)} className="text-gray-300 hover:text-gray-500"><X size={12}/></button>
            </div>
            <button 
              onClick={handleQuickAddTask}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-left font-medium"
            >
              <ListTodo size={16} className="text-indigo-500" />
              新建待办任务
            </button>
            <button 
              onClick={handleQuickAddProject}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors text-left font-medium"
            >
              <FolderPlus size={16} className="text-purple-500" />
              新建重点项目
            </button>
          </div>
        </>
      )}
      
      <div className="flex gap-6 text-[10px] text-gray-400 px-2 shrink-0 font-bold uppercase tracking-wider">
         <div className="flex items-center gap-1.5">
           <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></span> 日常任务
         </div>
         <div className="flex items-center gap-1.5">
           <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-200"></span> 紧急任务
         </div>
         <div className="flex items-center gap-1.5">
           <div className="bg-purple-100 border border-purple-200 rounded px-1 text-[8px] text-purple-700">FLAG</div> 项目截止
         </div>
         <div className="flex items-center gap-1.5">
           <span className="w-2 h-2 rounded-full bg-gray-300"></span> 已完成
         </div>
      </div>
    </div>
  );
};
