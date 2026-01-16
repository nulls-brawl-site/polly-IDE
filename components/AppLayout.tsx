import React from 'react';
import { 
  LayoutDashboard, 
  Code2, 
  Settings, 
  Menu, 
  Plus, 
  MessageSquare,
  X,
  Zap,
  Trophy,
  Wind,
  Sparkles,
  Key,
  Flower,
  Coins,
  Check,
  Cpu,
  Ghost,
  Brain,
  Box
} from 'lucide-react';
import { Framework, ChatSession, FileItem } from '../types';
import ChatInterface from './ChatInterface';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';

export const MODELS = [
  { id: 'openai-large', name: 'Gemini 5.2 (OpenAI Large)', desc: 'Top 1: Maximum Intelligence.', icon: Brain, color: 'text-purple-400' },
  { id: 'claude-large', name: 'Claude Opus 4.5', desc: 'Top 2: Best coding & text.', icon: Trophy, color: 'text-yellow-400' },
  { id: 'claude', name: 'Claude Sonnet 4.5', desc: 'Top 3: Ideal balance.', icon: Code2, color: 'text-blue-400' },
  { id: 'gemini-large', name: 'Gemini 3.0 Pro', desc: 'Top 4: Excellent reasoning.', icon: Sparkles, color: 'text-pink-400' },
  { id: 'gemini', name: 'Gemini 3.0 Flash', desc: 'Super Fast & Smart.', icon: Zap, color: 'text-orange-400' },
  { id: 'minimax', name: 'MiniMax M2.1', desc: 'Creative & Human-like.', icon: Ghost, color: 'text-red-400' },
  { id: 'claude-fast', name: 'Claude Haiku 4.5', desc: 'Fast & Efficient.', icon: Wind, color: 'text-green-400' },
];

interface AppLayoutProps {
  // State
  sessions: ChatSession[];
  currentSessionId: string | null;
  activeFileId: string | null;
  activeTab: 'dashboard' | 'explorer' | 'config' | 'chat';
  isSidebarOpen: boolean;
  isLoading: boolean;
  error: string | null;
  selectedFramework: Framework;
  selectedModel: string;
  apiKey: string;
  balance: number | null;
  
  // Setters/Actions
  setCurrentSessionId: (id: string | null) => void;
  setActiveFileId: (id: string | null) => void;
  setActiveTab: (tab: 'dashboard' | 'explorer' | 'config' | 'chat') => void;
  setIsSidebarOpen: (open: boolean) => void;
  setSelectedFramework: (fw: Framework) => void;
  setSelectedModel: (model: string) => void;
  handleApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  // Core Actions
  createNewSession: () => void;
  handleSendMessage: (text: string) => void;
  deleteSession: (e: React.MouseEvent, id: string) => void;
  handleDownloadProject: () => void;
  
  // Derived data
  currentSession?: ChatSession;
  activeFile?: FileItem;
}

const AppLayout: React.FC<AppLayoutProps> = (props) => {
  const {
    sessions, currentSessionId, activeFileId, activeTab, isSidebarOpen,
    isLoading, error, selectedFramework, selectedModel, apiKey, balance,
    setCurrentSessionId, setActiveFileId, setActiveTab, setIsSidebarOpen,
    setSelectedFramework, setSelectedModel, handleApiKeyChange,
    createNewSession, handleSendMessage, deleteSession, handleDownloadProject,
    currentSession, activeFile
  } = props;

  // --- Render Helpers ---

  const renderProjectList = () => (
    <div className="space-y-3 mt-4">
        {sessions.map((s, i) => (
            <div 
                key={s.id} 
                onClick={() => { setCurrentSessionId(s.id); setActiveTab('chat'); setIsSidebarOpen(false); }} 
                className={`bg-[#1e232a] p-4 rounded-xl border border-gray-800 flex justify-between items-center active:scale-[0.98] transition-all duration-300 ease-ios animate-slide-in-right shadow-sm cursor-pointer hover:border-poll-accent group relative overflow-hidden`}
                style={{ animationDelay: `${i * 0.05}s` }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_1s_infinite]"></div>
                <div className="flex items-start gap-3 relative z-10">
                    <div className="mt-1 w-2 h-2 rounded-full bg-poll-accent shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-pulse"></div>
                    <div>
                        <h3 className="text-white font-medium truncate max-w-[150px]">{s.title}</h3>
                        <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider bg-gray-900 text-gray-500 px-1.5 py-0.5 rounded border border-gray-800">{s.framework}</span>
                                <span className="text-xs text-gray-600 font-mono">{s.files.length} files</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                                <span className="flex items-center gap-0.5"><Flower size={10} className="text-pink-500/70" /> {s.totalCost?.toFixed(4) || '0.000'}</span>
                                <span className="flex items-center gap-0.5"><Coins size={10} className="text-yellow-500/70" /> {s.totalTokens?.toLocaleString() || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={(e) => deleteSession(e, s.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors relative z-10"><X size={18} /></button>
            </div>
        ))}
    </div>
  );

  const renderMobileContent = () => {
     if (activeTab === 'config') {
        return (
            <div className="p-6 text-white h-full overflow-y-auto animate-fade-in pb-24 custom-scrollbar">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <Settings className="text-poll-accent" /> Settings
                </h2>
                
                <div className="space-y-8">
                     <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                        <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Pollinations API Key <span className="text-red-500">*</span></label>
                        <div className={`bg-[#161b22] border rounded-xl p-4 ${!apiKey ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Key size={16} className={!apiKey ? 'text-red-400' : 'text-poll-accent'} />
                                    <span className={`text-sm font-semibold ${!apiKey ? 'text-red-200' : 'text-gray-200'}`}>API Key</span>
                                </div>
                                {balance !== null && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-full border border-gray-700">
                                        <Flower size={12} className="text-pink-400" />
                                        <span className="text-xs font-mono font-bold text-pink-100">{balance.toFixed(2)} Pollen</span>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="password" 
                                value={apiKey}
                                onChange={handleApiKeyChange}
                                placeholder="sk-..." 
                                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-poll-accent transition-colors font-mono"
                            />
                        </div>
                    </div>

                    <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
                        <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Framework</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['React', 'Angular'] as Framework[]).map((fw) => (
                                <button
                                    key={fw}
                                    onClick={() => setSelectedFramework(fw)}
                                    className={`p-3 rounded-xl border font-bold transition-all duration-200 flex items-center justify-center gap-2 ${selectedFramework === fw ? 'bg-poll-accent text-black border-poll-accent' : 'bg-[#161b22] border-gray-700 text-gray-400 hover:text-white'}`}
                                >
                                    <Box size={16} />
                                    {fw}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
                        <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">AI Model</label>
                        <div className="grid grid-cols-1 gap-3">
                            {MODELS.map((model) => (
                                <button 
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ease-ios active:scale-95 ${selectedModel === model.id ? 'border-poll-accent bg-poll-accent/10' : 'border-gray-700 bg-[#161b22]'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center ${model.color}`}>
                                            <model.icon size={16} />
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className={`font-bold ${selectedModel === model.id ? 'text-white' : 'text-gray-400'}`}>{model.name}</span>
                                            <span className="text-xs text-gray-500">{model.desc}</span>
                                        </div>
                                    </div>
                                    {selectedModel === model.id && <Check size={20} className="text-poll-accent" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
     }

     if (!currentSessionId && activeTab !== 'dashboard') {
         return (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-fade-in p-6 text-center">
                 <div className="w-20 h-20 rounded-3xl bg-poll-accent/10 flex items-center justify-center mb-6 animate-scale-in">
                     <Zap size={40} className="text-poll-accent animate-pulse" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">Pollinations.ai</h2>
                 <button onClick={createNewSession} className="w-full max-w-[200px] py-4 bg-poll-accent text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2">
                    <Plus size={20} /> Start Coding
                 </button>
             </div>
         );
     }

     if (activeTab === 'dashboard') {
        return (
            <div className="p-4 space-y-4 animate-fade-in pb-24 custom-scrollbar h-full overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-6">Your Projects</h2>
                <button onClick={createNewSession} className="w-full py-6 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 flex flex-col items-center gap-2 hover:border-poll-accent hover:text-poll-accent transition-colors bg-[#161b22]/50 active:scale-[0.98]">
                    <Plus size={28} /> <span className="font-semibold">New Project</span>
                </button>
                {renderProjectList()}
            </div>
        );
     }
     if (activeTab === 'explorer') {
         if (activeFileId) {
             return <CodeEditor file={activeFile} onClose={() => setActiveFileId(null)} />;
         }
         return (
             <FileExplorer 
                files={currentSession?.files || []} 
                activeFileId={activeFileId} 
                onFileSelect={setActiveFileId} 
                onDownloadProject={handleDownloadProject}
                className="h-full animate-fade-in" 
             />
         );
     }
     
     return <ChatInterface messages={currentSession?.messages || []} isLoading={isLoading} onSendMessage={handleSendMessage} error={error} className="h-full animate-fade-in" />;
  };

  return (
    <div className="h-screen w-full bg-[#000000] text-white flex flex-col overflow-hidden font-sans">
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full">
         <div className="w-80 bg-[#050505] border-r border-gray-800 flex flex-col glass-panel relative z-10 animate-slide-in-right">
             <div className="p-5 border-b border-gray-800 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-poll-accent flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 animate-bounce-subtle">
                    <Zap size={20} fill="currentColor" />
                 </div>
                 <h1 className="font-bold text-lg tracking-tight text-white">Pollinations.ai</h1>
             </div>
             
             <div className="p-3 overflow-y-auto flex-1 space-y-1 custom-scrollbar">
                 <button onClick={createNewSession} className="w-full p-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg mb-6 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] border border-white/5 shadow-inner">
                     <Plus size={16} /> New Project
                 </button>
                 <div className="px-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Recent</div>
                 
                 {sessions.map(s => (
                     <div key={s.id} onClick={() => setCurrentSessionId(s.id)} className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-300 ease-ios group relative cursor-pointer border ${currentSessionId === s.id ? 'bg-[#1a1a1a] text-poll-accent font-medium border-poll-accent/30' : 'text-gray-400 hover:text-gray-200 hover:bg-[#111] border-transparent'}`}>
                         <div className="flex justify-between items-start">
                             <span className="truncate max-w-[160px] block">{s.title}</span>
                             {currentSessionId === s.id && <div className="w-1.5 h-1.5 rounded-full bg-poll-accent animate-pulse shadow-[0_0_5px_#eab308]"></div>}
                         </div>
                         <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="flex items-center gap-0.5"><Flower size={8} />{s.totalCost?.toFixed(3) || 0}</span>
                            <span className="flex items-center gap-0.5"><Coins size={8} />{s.totalTokens ? (s.totalTokens/1000).toFixed(1) + 'k' : 0}</span>
                         </div>
                     </div>
                 ))}
             </div>
             
             {/* Configuration Panel in Sidebar */}
             <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] space-y-3">
                <div className="flex flex-col gap-1.5 text-xs mb-2">
                    <div className="flex justify-between items-center">
                         <span className="font-medium text-gray-500 uppercase tracking-wider">API Key</span>
                         {balance !== null && (
                             <div className="flex items-center gap-1 text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-gray-800 animate-fade-in">
                                 <Flower size={10} className="text-pink-400"/>
                                 <span className="text-pink-100 font-mono">{balance.toFixed(2)}</span>
                             </div>
                         )}
                    </div>
                    
                    <input 
                        type="password"
                        value={apiKey}
                        onChange={handleApiKeyChange}
                        placeholder="sk-..."
                        className={`bg-[#161b22] border rounded px-2 py-2 focus:outline-none focus:border-poll-accent text-gray-300 transition-colors w-full font-mono ${!apiKey ? 'border-red-900/50' : 'border-gray-700'}`}
                    />
                </div>

                <div className="flex flex-col gap-1.5 text-xs">
                    <span className="font-medium text-gray-500 uppercase tracking-wider">Framework</span>
                    <div className="flex bg-[#161b22] rounded border border-gray-700 p-1">
                        {(['React', 'Angular'] as Framework[]).map((fw) => (
                            <button
                                key={fw}
                                onClick={() => setSelectedFramework(fw)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${selectedFramework === fw ? 'bg-poll-accent text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                {fw}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 text-xs">
                    <span className="font-medium text-gray-500 uppercase tracking-wider">Model</span>
                    <select 
                        value={selectedModel} 
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-[#161b22] border border-gray-700 rounded px-2 py-2 focus:outline-none focus:border-poll-accent text-gray-300 transition-colors w-full appearance-none"
                    >
                        {MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>
             </div>
         </div>

         {/* Main Content Area */}
         <div className="flex-1 border-r border-gray-800 flex flex-col min-w-0 bg-[#000]">
             {!currentSessionId ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-6 animate-scale-in">
                    <div className="w-24 h-24 rounded-full bg-[#111] flex items-center justify-center border border-gray-800 shadow-2xl relative">
                        <div className="absolute inset-0 bg-poll-accent/20 blur-xl rounded-full animate-pulse-glow"></div>
                        <Zap size={48} className="text-poll-accent opacity-90 relative z-10" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white mb-2">Welcome to Pollinations IDE</h2>
                        <p className="text-gray-500 font-mono text-sm">Select a project to start generating code.</p>
                    </div>
                </div>
             ) : (
                <ChatInterface messages={currentSession?.messages || []} isLoading={isLoading} onSendMessage={handleSendMessage} error={error} className="h-full" />
             )}
         </div>

         {/* Right Sidebar */}
         <div className="w-[450px] bg-[#050505] flex flex-col border-l border-gray-800 shadow-2xl z-10 animate-slide-in-right">
             {currentSessionId && (
                 <>
                   {activeFileId ? (
                       <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
                           <CodeEditor file={activeFile} onClose={() => setActiveFileId(null)} />
                       </div>
                   ) : (
                       <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
                           <FileExplorer 
                              files={currentSession?.files || []} 
                              activeFileId={activeFileId} 
                              onFileSelect={setActiveFileId} 
                              onDownloadProject={handleDownloadProject}
                              className="flex-1" 
                           />
                       </div>
                   )}
                 </>
             )}
         </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-full relative">
        <header className="h-14 bg-[#0a0a0a] border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-20">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-400 hover:text-white active:scale-95 transition-transform"><Menu size={24} /></button>
            <div className="flex items-center gap-2">
                 <Zap size={16} className="text-poll-accent fill-poll-accent" />
                 <span className="font-bold text-sm truncate max-w-[200px] text-gray-200">{currentSession?.title || 'Pollinations.ai'}</span>
            </div>
            <div className="w-8"></div>
        </header>

        {/* Backdrop */}
        <div 
          className={`fixed inset-0 z-50 flex pointer-events-none transition-all duration-500 ease-ios ${isSidebarOpen ? 'opacity-100 backdrop-blur-sm pointer-events-auto' : 'opacity-0 backdrop-blur-none'}`}
        >
             <div 
                className="absolute inset-0 bg-black/60" 
                onClick={() => setIsSidebarOpen(false)} 
             />
             
             {/* Sidebar Panel with GPU acceleration */}
             <div 
                className={`w-[85%] max-w-xs bg-[#050505] h-full shadow-2xl p-4 flex flex-col border-r border-gray-800 gpu transition-transform duration-500 ease-ios ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                onClick={e => e.stopPropagation()}
             >
                <h2 className="font-bold text-xl text-white flex items-center gap-2 mb-8"><Zap className="text-poll-accent" size={24} /> Projects</h2>
                <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                    {sessions.map(s => (
                        <button key={s.id} onClick={() => { setCurrentSessionId(s.id); setActiveTab('chat'); setIsSidebarOpen(false); }} className={`w-full text-left p-3.5 rounded-xl text-sm flex flex-col gap-1 transition-all duration-200 active:scale-98 ${currentSessionId === s.id ? 'bg-[#1a1a1a] text-poll-accent shadow-md border border-gray-800' : 'text-gray-400 hover:bg-[#111]'}`}>
                            <span className="truncate font-medium">{s.title}</span>
                            <div className="flex justify-between items-center w-full">
                                <span className="text-[10px] bg-gray-900 px-2 py-0.5 rounded text-gray-500 border border-gray-800 font-mono">{s.framework.slice(0,3)}</span>
                                <div className="flex items-center gap-2 text-[10px] opacity-70">
                                    <span className="flex gap-0.5"><Flower size={8}/>{s.totalCost?.toFixed(2)||0}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
             </div>
        </div>

        {/* Content Container - using relative/absolute to prevent layout jumps */}
        <div className="flex-1 overflow-hidden relative bg-[#000]">
             <div className="absolute inset-0 w-full h-full">
                {renderMobileContent()}
             </div>
        </div>

        <nav className="h-[70px] bg-[#0a0a0a] border-t border-gray-800 flex items-center justify-around shrink-0 pb-safe z-20 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.5)]">
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 w-16 ${activeTab === 'dashboard' ? 'text-poll-accent bg-poll-accent/10' : 'text-gray-500 hover:text-gray-300'}`}><LayoutDashboard size={24} /></button>
            <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 w-16 ${activeTab === 'chat' ? 'text-poll-accent bg-poll-accent/10' : 'text-gray-500 hover:text-gray-300'}`}><Code2 size={24} /></button>
            {currentSessionId && <button onClick={() => setActiveTab('explorer')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 w-16 ${activeTab === 'explorer' ? 'text-poll-accent bg-poll-accent/10' : 'text-gray-500 hover:text-gray-300'}`}><MessageSquare size={24} className="rotate-90" /></button>}
            <button onClick={() => setActiveTab('config')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 w-16 ${activeTab === 'config' ? 'text-poll-accent bg-poll-accent/10' : 'text-gray-500 hover:text-gray-300'}`}><Settings size={24} /></button>
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;