import React, { useState } from 'react';
import { Project, ProjectStatus, Task } from '../types';
import { Calendar, MoreHorizontal, ArrowRight, ArrowLeft } from 'lucide-react';

interface ProjectKanbanProps {
  projects: Project[];
  tasks: Task[];
  onUpdateProjectStatus: (id: string, status: ProjectStatus) => void;
}

export const ProjectKanban: React.FC<ProjectKanbanProps> = ({ projects, tasks, onUpdateProjectStatus }) => {
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

  const columns = [
    { id: ProjectStatus.PLANNING, title: '规划中', color: 'bg-gray-100', border: 'border-gray-200' },
    { id: ProjectStatus.IN_PROGRESS, title: '进行中', color: 'bg-blue-50', border: 'border-blue-200' },
    { id: ProjectStatus.REVIEW, title: '审核/收尾', color: 'bg-purple-50', border: 'border-purple-200' },
    { id: ProjectStatus.COMPLETED, title: '已完成', color: 'bg-green-50', border: 'border-green-200' }
  ];

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId);
    e.dataTransfer.setData('projectId', projectId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent ghost image logic can go here, but default is usually fine
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: ProjectStatus) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    if (projectId && projectId !== '') {
        onUpdateProjectStatus(projectId, status);
    }
    setDraggedProject(null);
  };

  return (
    <div className="h-full overflow-x-auto pb-4">
      <div className="flex gap-6 h-full min-w-[1000px]">
        {columns.map(col => {
          const colProjects = projects.filter(p => p.status === col.id);
          const isDragTarget = draggedProject !== null; // Could add specific highlighting logic here
          
          return (
            <div 
                key={col.id} 
                className={`flex-1 flex flex-col min-w-[280px] transition-colors ${isDragTarget ? 'bg-gray-50/50' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`p-3 rounded-t-xl border-t border-x ${col.border} ${col.color} flex justify-between items-center`}>
                <h3 className="font-bold text-gray-700">{col.title}</h3>
                <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-500 font-medium">
                  {colProjects.length}
                </span>
              </div>
              
              <div className={`flex-1 bg-gray-50/50 p-3 border-x border-b border-gray-200 rounded-b-xl space-y-3 overflow-y-auto`}>
                 {colProjects.length === 0 && (
                   <div className="text-center py-10 text-gray-300 text-sm italic border-2 border-dashed border-gray-200 rounded-lg m-2">
                     {isDragTarget ? "释放卡片到这里" : "暂无项目"}
                   </div>
                 )}
                 {colProjects.map(project => {
                   const projectTasks = tasks.filter(t => t.projectId === project.id);
                   const completed = projectTasks.filter(t => t.isCompleted).length;
                   const total = projectTasks.length;
                   
                   return (
                     <div 
                        key={project.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, project.id)}
                        className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all group cursor-grab active:cursor-grabbing ${draggedProject === project.id ? 'opacity-50 rotate-3' : ''}`}
                     >
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-gray-800 text-sm line-clamp-2">{project.name}</h4>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">{project.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="mb-3">
                           <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                              <span>进度 {project.progress}%</span>
                              <span>{completed}/{total} 任务</span>
                           </div>
                           <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${project.progress}%` }}></div>
                           </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                           <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Calendar size={10} />
                              <span>{project.deadline || '无截止'}</span>
                           </div>
                           
                           {/* Hint for drag */}
                           <div className="opacity-0 group-hover:opacity-100 text-xs text-gray-300">
                              ⋮⋮ 拖拽移动
                           </div>
                        </div>
                     </div>
                   );
                 })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};