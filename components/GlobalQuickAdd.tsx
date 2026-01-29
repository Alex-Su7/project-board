
import React, { useState } from 'react';
import { Sparkles, Send, X, Loader2, AlertCircle } from 'lucide-react';
import { parseSmartTask } from '../services/llmService';
import { Priority } from '../types';

interface GlobalQuickAddProps {
  onAddTask: (title: string, priority: Priority, description: string, dueDate: string) => void;
}

export const GlobalQuickAdd: React.FC<GlobalQuickAddProps> = ({ onAddTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    try {
      const result = await parseSmartTask(input);
      onAddTask(
        result.title || input,
        result.priority || Priority.MEDIUM,
        result.description || '',
        result.dueDate || ''
      );
      setInput('');
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      // 容错：如果 AI 出错，直接把输入作为标题添加
      onAddTask(input, Priority.MEDIUM, '', '');
      setInput('');
      setIsOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setError(null); }}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full text-white shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-gray-400 rotate-45' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
        }`}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sparkles size={20} className="text-purple-600" />
                智能速记任务
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <textarea
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如: '明天下午要交下周的社交媒体排期表，非常紧急'"
                className="w-full p-5 bg-gray-50 border-none rounded-2xl resize-none outline-none text-gray-700 text-lg h-40 focus:ring-2 focus:ring-indigo-100 placeholder-gray-400 shadow-inner"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              
              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-between items-center">
                 <p className="text-xs text-gray-400 flex items-center gap-1">
                   <AlertCircle size={12} />
                   AI 将智能提取时间、内容和优先级
                 </p>
                 <button
                  type="submit"
                  disabled={isProcessing || !input.trim()}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 transition-all active:scale-95"
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
