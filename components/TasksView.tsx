import React, { useState } from 'react';
import { Task, Priority, Subtask, Link } from '../types';
import { Plus, Trash2, Check, AlertCircle, Calendar, ChevronDown, ChevronUp, Pencil, X, Save, Search, Filter, CheckSquare, Square, Tag, ListTodo, Link as LinkIcon, ExternalLink, Zap, FileText, CheckCircle2, ChevronRight, LayoutList, Sparkles, Loader2 } from 'lucide-react';
import { suggestSubtasks } from '../services/llmService';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (title: string, priority: Priority, description: string, dueDate: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchStatus: (ids: string[], isCompleted: boolean) => void;
}

const TASK_TEMPLATES = [
  {
    name: '公众号推文发布',
    title: '发布公众号推文: [主题]',
    priority: Priority.HIGH,
    tags: ['Social', 'WeChat'],
    subtasks: ['确定选题与大纲', '撰写初稿', '设计封面与配图', '排版与预览', '设置定时发送']
  },
  {
    name: 'KOL 投放合作',
    title: 'KOL 投放执行: [博主名]',
    priority: Priority.MEDIUM,
    tags: ['PR', 'Outreach'],
    subtasks: ['筛选意向博主', '询价与Brief沟通', '确认排期', '审核脚本/内容', '发布监控', '数据回收']
  },
  {
    name: '线下活动筹备',
    title: '活动筹备: [活动名]',
    priority: Priority.URGENT,
    tags: ['Event', 'Offline'],
    subtasks: ['场地确认', '物料设计与制作', '人员分工安排', '流程彩排', '摄影摄像安排']
  }
];

export const TasksView: React.FC<TasksViewProps> = ({ 
  tasks, 
  onAddTask, 
  onUpdateTask, 
  onToggleTask, 
  onDeleteTask,
  onBatchDelete,
  onBatchStatus
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle, newTaskPriority, newTaskDesc, newTaskDate);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskDate('');
    setNewTaskPriority(Priority.MEDIUM);
  };

  const applyTemplate = (template: typeof TASK_TEMPLATES[0]) => {
    setNewTaskTitle(template.title);
    setNewTaskPriority(template.priority);
    setNewTaskDesc(`[模板预设]\n标签: ${template.tags.join(', ')}\n子任务:\n${template.subtasks.map(s => `- [ ] ${s}`).join('\n')}`);
    setShowTemplates(false);
  };

  const handleAIDecompose = async (task: Task) => {
    setIsDecomposing(task.id);
    try {
      const suggestions = await suggestSubtasks(task.title, task.description);
      const newSubtasks: Subtask[] = [
        ...(task.subtasks || []),
        ...suggestions.map(s => ({ id: Date.now() + Math.random().toString(), title: s, isCompleted: false }))
      ];
      onUpdateTask(task.id, { subtasks: newSubtasks });
    } catch (e) {
      alert("AI 拆解失败，请重试。");
    } finally {
      setIsDecomposing(null);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (statusFilter === 'active' && t.isCompleted) return false;
    if (statusFilter === 'completed' && !t.isCompleted) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = t.title.toLowerCase().includes(query);
      const matchesDesc = t.description?.toLowerCase().includes(query);
      const matchesTags = t.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesTitle && !matchesDesc && !matchesTags) return false;
    }
    return true;
  });

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.URGENT: return 'text-red-600 bg-red-100';
      case Priority.HIGH: return 'text-orange-600 bg-orange-100';
      case Priority.MEDIUM: return 'text-blue-600 bg-blue-100';
      case Priority.LOW: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (p: Priority) => {
    switch (p) {
      case Priority.URGENT: return '紧急';
      case Priority.HIGH: return '高';
      case Priority.MEDIUM: return '中';
      case Priority.LOW: return '低';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-w-[1400px] mx-auto animate-fade-in">
      <aside className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-6 sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
               <LayoutList size={22} className="text-indigo-600"/>
               任务工作台
            </h2>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="记录新任务..." className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"/>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 text-sm">添加</button>
              <button type="button" onClick={() => setShowTemplates(!showTemplates)} className="p-2 border rounded-xl"><Zap size={18} /></button>
            </div>
          </form>
          <div className="pt-4 border-t border-gray-50 space-y-4">
             <input type="text" placeholder="搜索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-3 pr-3 py-2 bg-gray-50 border-none rounded-xl text-xs outline-none"/>
             <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs outline-none appearance-none">
                <option value="all">所有优先级</option>
                {Object.values(Priority).map(p => <option key={p} value={p}>{getPriorityLabel(p)}</option>)}
             </select>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex items-center justify-between">
           <div className="flex bg-gray-50 rounded-xl p-1">
              {['all', 'active', 'completed'].map((f) => (
                <button key={f} onClick={() => setStatusFilter(f as any)} className={`px-6 py-1.5 text-xs font-bold rounded-lg ${statusFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>
                  {f === 'all' ? '全部' : f === 'active' ? '待处理' : '已完成'}
                </button>
              ))}
           </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredTasks.map(task => {
            const isExpanded = expandedTask === task.id;
            const isSelected = selectedTasks.has(task.id);
            const totalSub = task.subtasks?.length || 0;
            const completedSub = task.subtasks?.filter(s => s.isCompleted).length || 0;
            const progress = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

            return (
              <div key={task.id} className={`border-b last:border-0 ${task.isCompleted ? 'bg-gray-50/50' : ''}`}>
                 <div className="flex items-center p-4 gap-4">
                    <button onClick={() => onToggleTask(task.id)} className={`w-5 h-5 rounded-md border-2 ${task.isCompleted ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-200'}`}>
                      {task.isCompleted && <Check size={12}/>}
                    </button>
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                       <h4 className={`text-sm font-semibold ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</h4>
                       <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                          <span className={`px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>{getPriorityLabel(task.priority)}</span>
                          {task.dueDate && <span>{task.dueDate}</span>}
                          {totalSub > 0 && <span>{completedSub}/{totalSub} 子任务</span>}
                       </div>
                    </div>
                 </div>
                 {isExpanded && (
                    <div className="px-14 pb-4 animate-in slide-in-from-top-1">
                       <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                          {task.description && <p className="text-xs text-gray-500">{task.description}</p>}
                          <div className="flex justify-between items-center">
                             <h5 className="text-[10px] font-bold text-gray-400 uppercase">子任务</h5>
                             <button 
                                onClick={() => handleAIDecompose(task)}
                                disabled={isDecomposing === task.id}
                                className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold bg-white px-2 py-1 rounded-md border border-indigo-100 hover:bg-indigo-50 shadow-sm"
                             >
                               {isDecomposing === task.id ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                               AI 拆解步骤
                             </button>
                          </div>
                          {task.subtasks?.map(s => (
                             <div key={s.id} className="flex items-center gap-2 py-1">
                                <input type="checkbox" checked={s.isCompleted} onChange={() => {
                                   const news = task.subtasks?.map(it => it.id === s.id ? {...it, isCompleted: !it.isCompleted} : it);
                                   onUpdateTask(task.id, { subtasks: news });
                                }} className="rounded text-indigo-600"/>
                                <span className={`text-xs ${s.isCompleted ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{s.title}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};