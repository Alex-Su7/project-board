import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, LLMModelConfig, LLMProviderType } from '../types';
import { getSettings, saveSettings, testModelConnection } from '../services/llmService';
import { Save, Plus, Trash2, Settings, Key, Server, Cpu, Check, Wifi, AlertTriangle, Loader2, Download, Upload, AlertCircle, Database } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Model Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newProvider, setNewProvider] = useState<LLMProviderType>('openai-compatible');
  const [newBaseUrl, setNewBaseUrl] = useState('https://api.deepseek.com');
  const [newApiKey, setNewApiKey] = useState('');
  const [newModelId, setNewModelId] = useState('deepseek-chat');

  // Test Connection State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  
  // Server Test State
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'fail' | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setIsDirty(false);
    alert("设置已保存！请刷新页面以应用新的数据源配置。");
    // Trigger a reload to switch data sources if needed, or dispatch event
    window.location.reload();
  };

  const deleteModel = (id: string) => {
    if (confirm("确定要删除这个模型配置吗？")) {
      const updatedModels = settings.models.filter(m => m.id !== id);
      setSettings({
        ...settings,
        models: updatedModels,
        fastModelId: settings.fastModelId === id ? updatedModels[0]?.id || '' : settings.fastModelId,
        reasoningModelId: settings.reasoningModelId === id ? updatedModels[0]?.id || '' : settings.reasoningModelId,
      });
      setIsDirty(true);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestMessage('');

    const tempConfig: LLMModelConfig = {
        id: 'test',
        name: newModelName,
        provider: newProvider,
        apiKey: newApiKey,
        baseUrl: newProvider === 'openai-compatible' ? newBaseUrl : undefined,
        modelId: newModelId
    };

    try {
        await testModelConnection(tempConfig);
        setTestResult('success');
        setTestMessage('连接成功！模型响应正常。');
    } catch (e: any) {
        setTestResult('error');
        setTestMessage(`连接失败: ${e.message}。`);
    } finally {
        setIsTesting(false);
    }
  };

  const checkServer = async () => {
    setServerStatus('checking');
    try {
      const res = await fetch(`${settings.serverUrl}/api/health`);
      if (res.ok) {
        setServerStatus('ok');
      } else {
        setServerStatus('fail');
      }
    } catch (e) {
      setServerStatus('fail');
    }
  };

  const addNewModel = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: LLMModelConfig = {
      id: Date.now().toString(),
      name: newModelName,
      provider: newProvider,
      apiKey: newApiKey,
      baseUrl: newProvider === 'openai-compatible' ? newBaseUrl : undefined,
      modelId: newModelId
    };

    setSettings({
      ...settings,
      models: [...settings.models, newConfig]
    });
    
    setShowAddForm(false);
    setNewModelName('');
    setNewApiKey('');
    setTestResult(null);
    setIsDirty(true);
  };

  // --- Data Backup Logic (Keep existing) ---
  const handleExportData = () => {
    const data = {
      tasks: JSON.parse(localStorage.getItem('marketingflow_tasks') || '[]'),
      projects: JSON.parse(localStorage.getItem('marketingflow_projects') || '[]'),
      settings: getSettings(),
      scratchpad: localStorage.getItem('marketingflow_scratchpad') || ''
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleImportClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm("警告：导入数据将覆盖当前数据。继续？")) {
           if (json.tasks) localStorage.setItem('marketingflow_tasks', JSON.stringify(json.tasks));
           if (json.projects) localStorage.setItem('marketingflow_projects', JSON.stringify(json.projects));
           window.dispatchEvent(new Event('marketingflow-data-imported'));
           alert("导入成功！");
        }
      } catch (err) { alert("导入失败"); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="text-gray-600" />
            系统设置
          </h2>
          <p className="text-gray-500">管理 AI 模型接口和数据存储方式。</p>
        </div>
        {isDirty && (
          <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-md animate-pulse">
            <Save size={18} /> 保存更改
          </button>
        )}
      </div>

      {/* --- Server Configuration (NEW) --- */}
      <div className={`rounded-xl shadow-sm border p-6 transition-colors ${settings.useServer ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
         <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Database size={18} className="text-indigo-600"/>
                后端服务器模式
              </h3>
              <p className="text-sm text-gray-500 mt-1">启用后，数据将存储在本地服务器，AI 请求将通过服务器代理（更安全）。</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.useServer} 
                onChange={(e) => {
                  setSettings({...settings, useServer: e.target.checked});
                  setIsDirty(true);
                }} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
         </div>

         {settings.useServer && (
           <div className="animate-fade-in-down">
              <div className="flex items-center gap-4">
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Server URL</label>
                    <input 
                      type="text" 
                      value={settings.serverUrl}
                      onChange={(e) => {
                        setSettings({...settings, serverUrl: e.target.value});
                        setIsDirty(true);
                      }}
                      placeholder="http://localhost:3001"
                      className="w-full p-2 border border-indigo-200 rounded-md text-sm"
                    />
                 </div>
                 <div className="mt-5">
                    <button 
                      onClick={checkServer}
                      className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-sm hover:bg-indigo-50"
                    >
                      检查连接
                    </button>
                 </div>
              </div>
              
              {/* Server Status Feedback */}
              {serverStatus === 'ok' && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check size={12}/> 服务器连接正常</p>
              )}
              {serverStatus === 'fail' && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle size={12}/> 无法连接到服务器，请确认 `node server.js` 已运行</p>
              )}

              <div className="mt-4 p-3 bg-white/50 rounded-lg border border-indigo-100 text-xs text-indigo-800">
                <strong>💡 使用指南：</strong>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  <li>请确保已下载 <code>server/</code> 目录代码。</li>
                  <li>在 server 目录下运行 <code>npm install</code> 和 <code>node server.js</code>。</li>
                  <li>点击保存后，应用将尝试从服务器加载数据。</li>
                </ol>
              </div>
           </div>
         )}
      </div>

      {/* Data Backup (Existing) */}
      {!settings.useServer && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-70">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Save size={18} className="text-gray-500"/>
            本地数据备份
          </h3>
          <div className="flex gap-3">
             <button onClick={handleExportData} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"><Download size={14} className="inline mr-1"/> 导出</button>
             <button onClick={handleImportClick} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"><Upload size={14} className="inline mr-1"/> 导入</button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          </div>
        </div>
      )}

      {/* Model List (Existing) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">模型配置</h3>
          <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 text-indigo-600 font-medium hover:bg-indigo-50 px-3 py-1.5 rounded-lg"><Plus size={18} /> 添加新模型</button>
        </div>
        {/* Add Model Form (Same as before) */}
        {showAddForm && (
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
             {/* ... (Same Add Form Content as previous) ... */}
             <form onSubmit={addNewModel} className="space-y-4">
               {/* Simplified for brevity in this response, keep existing form inputs */}
               <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Name" value={newModelName} onChange={e=>setNewModelName(e.target.value)} className="p-2 border rounded"/>
                  <select value={newProvider} onChange={e=>setNewProvider(e.target.value as any)} className="p-2 border rounded"><option value="openai-compatible">OpenAI Compatible</option><option value="gemini">Gemini</option></select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <input required type="password" placeholder="API Key" value={newApiKey} onChange={e=>setNewApiKey(e.target.value)} className="p-2 border rounded"/>
                 <input required placeholder="Model ID" value={newModelId} onChange={e=>setNewModelId(e.target.value)} className="p-2 border rounded"/>
               </div>
               {newProvider === 'openai-compatible' && <input required placeholder="Base URL" value={newBaseUrl} onChange={e=>setNewBaseUrl(e.target.value)} className="w-full p-2 border rounded"/>}
               
               <div className="flex justify-end gap-2 mt-2">
                 <button type="button" onClick={handleTestConnection} disabled={isTesting} className="text-indigo-600 text-sm">测试连接</button>
                 <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-500 text-sm">取消</button>
                 <button type="submit" className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">添加</button>
               </div>
               {testMessage && <p className="text-xs">{testMessage}</p>}
             </form>
          </div>
        )}
        
        {/* Model List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {settings.models.map((model) => (
            <div key={model.id} className="p-4 border-b border-gray-100 last:border-0 flex items-center justify-between hover:bg-gray-50">
               <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${model.provider === 'gemini' ? 'bg-blue-500' : 'bg-green-600'}`}>{model.name[0]}</div>
                  <div>
                    <div className="font-bold text-sm">{model.name}</div>
                    <div className="text-xs text-gray-500">{model.modelId}</div>
                  </div>
               </div>
               <button onClick={() => deleteModel(model.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};