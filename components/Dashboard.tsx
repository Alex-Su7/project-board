
import React, { useState, useEffect, useCallback } from 'react';
import { Project, Task, ProjectStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2, Clock, Activity, AlertCircle, Sparkles, Loader2, StickyNote } from 'lucide-react';
import { getSmartInsights } from '../services/llmService';

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, tasks }) => {
  const [noteContent, setNoteContent] = useState('');
  const [insight, setInsight] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsight = useCallback(async () => {
    if (projects.length === 0 && tasks.length === 0) {
      setInsight("开始添加您的第一个项目或任务吧！");
      return;
    }
    
    setIsInsightLoading(true);
    setError(null);
    try {
      const res = await getSmartInsights(tasks, projects);
      setInsight(res);
    } catch (err) {
      setError("AI 暂时无法连接，请检查配置。");
      setInsight("无法获取实时建议。");
    } finally {
      setIsInsightLoading(false);
    }
  }, [projects, tasks]);

  useEffect(() => {
    const savedNote = localStorage.getItem('marketingflow_scratchpad');
    if (savedNote) setNoteContent(savedNote);
    generateInsight();
  }, [generateInsight]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setNoteContent(newVal);
    localStorage.setItem('marketingflow_scratchpad', newVal);
  };

  const pendingCount = tasks.filter(t => !t?.isCompleted).length;
  const activeCount = projects.filter(p => p?.status === ProjectStatus.IN_PROGRESS).length;
  const doneCount = tasks.filter(t => t?.isCompleted).length;
  const criticalCount = tasks.filter(t => !t?.isCompleted && t?.priority === 'Urgent').length;

  const chartData = projects.map(p => ({
    name: p.name?.length > 8 ? p.name.substring(0, 8) + '...' : p.name,
    progress: p.progress || 0
  }));

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className={`bg-gradient-to-r ${error ? 'from-red-50 to-orange-50 border-red-100' : 'from-indigo-50 to-purple-50 border-indigo-100'} border rounded-2xl p-5 flex items-center gap-4`}>
           <div className="bg-white p-3 rounded-xl shadow-sm text-indigo-600">
             {isInsightLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className={error ? "text-red-400" : ""} />}
           </div>
           <div className="flex-1">
              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${error ? "text-red-400" : "text-indigo-400"}`}>
                心流 AI 洞察
              </h4>
              <p className="text-sm text-gray-700 italic">
                {isInsightLoading ? "正在扫描你的日程..." : insight}
              </p>
           </div>
           {!isInsightLoading && (
             <button onClick={generateInsight} className="text-xs text-indigo-600 font-medium hover:underline">刷新</button>
           )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="待办任务" value={pendingCount} icon={<Clock size={20} className="text-blue-500" />} color="bg-blue-50" />
        <StatCard title="在进项目" value={activeCount} icon={<Activity size={20} className="text-purple-500" />} color="bg-purple-50" />
        <StatCard title="已完结" value={doneCount} icon={<CheckCircle2 size={20} className="text-green-500" />} color="bg-green-50" />
        <StatCard title="紧急事项" value={criticalCount} icon={<AlertCircle size={20} className="text-red-500" />} color="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">核心项目进度</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-yellow-50/50 p-6 rounded-2xl border border-yellow-100 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-yellow-700">
             <StickyNote size={20} />
             <h3 className="font-semibold">工作碎片记录</h3>
          </div>
          <textarea 
            value={noteContent}
            onChange={handleNoteChange}
            className="flex-1 w-full bg-transparent border-none focus:ring-0 text-gray-700 placeholder-yellow-400/50 resize-none outline-none text-sm leading-loose"
            placeholder="有些突发奇想？随手记在这里..."
          />
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{title: string; value: number; icon: React.ReactNode; color: string}> = ({ title, value, icon, color }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
  </div>
);
