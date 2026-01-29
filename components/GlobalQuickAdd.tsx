
import React, { useState } from 'react';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { parseSmartTask } from '../services/llmService';
import { Priority } from '../types';

interface GlobalQuickAddProps {
  onAddTask: (title: string, priority: Priority, description: string, dueDate: string) => void;
}

export const GlobalQuickAdd: React.FC<GlobalQuickAddProps> = ({ onAddTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
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
    } catch (error) {
      console.error(error);
      alert("识别失败，请检查 API 配置。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full text-white shadow-lg transition-all duration-300 hover:scale-105 ${
          isOpen ? 'bg-gray-400 rotate-45' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
        }`}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 transform transition-all animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-purple-600" />
              智能速记任务
            </h3>

            <form onSubmit={handleSubmit}>
              <textarea
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如: '明天下午要交下周的社交媒体排期表，非常紧急'"
                className="w-full p-4 bg-gray-50 border-none rounded-xl resize-none outline-none text-gray-700 text-lg h-32 focus:ring-2 focus:ring-indigo-100"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="mt-4 flex justify-between items-center">
                 <p className="text-xs text-gray-400">AI 将识别时间、内容和优先级</p>
                 <button
                  type="submit"
                  disabled={isProcessing || !input.trim()}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
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
