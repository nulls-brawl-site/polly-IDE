import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { 
  LayoutDashboard, 
  Code2, 
  Settings, 
  Menu, 
  Plus, 
  MessageSquare,
  X,
  Play,
  Check,
  Zap,
  Trophy,
  Wind,
  Brain,
  Sparkles,
  Key
} from 'lucide-react';

import ChatInterface from './components/ChatInterface';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';

import { Framework, ChatSession, Message, ToolCall, FileItem } from './types';
import { streamPollinations } from './services/pollinationsService';
import { GET_SYSTEM_INSTRUCTION } from './constants';

const MODELS = [
  { id: 'claude-large', name: 'Claude Opus 4.5', desc: 'Top 1: Best coding & text. Slow.', icon: Trophy, color: 'text-yellow-400' },
  { id: 'claude', name: 'Claude Sonnet 4.5', desc: 'Top 2: Ideal balance for coding.', icon: Code2, color: 'text-blue-400' },
  { id: 'gemini-large', name: 'Gemini 3.0 Pro', desc: 'Top 3: Excellent reasoning.', icon: Sparkles, color: 'text-purple-400' },
  { id: 'claude-fast', name: 'Claude Haiku 4.5', desc: 'Top 4: Fast & efficient.', icon: Wind, color: 'text-green-400' },
];

const App: React.FC = () => {
  // Initialize sessions from localStorage
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('pollinations_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load sessions", e);
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explorer' | 'config' | 'chat'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedFramework, setSelectedFramework] = useState<Framework>('React');
  const [selectedModel, setSelectedModel] = useState<string>('claude');
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const savedKey = localStorage.getItem('pollinations_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pollinations_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save sessions", e);
    }
  }, [sessions]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('pollinations_api_key', key);
    if (key.trim().length > 0) setError(null);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const activeFile = currentSession?.files.find(f => f.id === activeFileId);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Project',
      framework: selectedFramework,
      messages: [],
      files: [],
      lastModified: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setActiveTab('chat');
    setActiveFileId(null);
    setIsSidebarOpen(false);
    setError(null);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const handleDownloadProject = async () => {
    if (!currentSession) return;
    
    const zip = new JSZip();
    let hasFiles = false;
    
    currentSession.files.forEach(f => {
        if (f.type === 'file' && f.content) {
            const path = f.path.startsWith('/') ? f.path.slice(1) : f.path;
            zip.file(path, f.content);
            hasFiles = true;
        }
    });

    if (!hasFiles) {
        // Maybe toast "No files to zip"?
        return;
    }
    
    try {
        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentSession.title.replace(/\s+/g, '_')}_project.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (e) {
        console.error("Zip generation failed", e);
        setError("Failed to generate project ZIP file.");
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!currentSessionId) return;

    // MANDATORY API KEY CHECK
    if (!apiKey || apiKey.trim() === '') {
        const msg = "A Pollinations API Key is REQUIRED to use these models.";
        setError(msg);
        
        // On mobile, switch to config tab to help user find the input
        if (window.innerWidth < 1024) {
            setActiveTab('config');
        }
        return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: Date.now()
    };

    let updatedSession = { ...currentSession! };
    updatedSession.messages = [...updatedSession.messages, userMsg];
    
    setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));

    setIsLoading(true);
    setError(null);

    try {
      await processPollinationsResponse(updatedSession);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const processPollinationsResponse = async (session: ChatSession) => {
    const modelMsgId = crypto.randomUUID();
    const modelMsg: Message = {
      id: modelMsgId,
      role: 'model',
      text: '',
      toolCalls: [],
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return { ...s, messages: [...s.messages, modelMsg] };
      }
      return s;
    }));

    let fullText = '';

    // Pass session.files to GET_SYSTEM_INSTRUCTION to give the model context
    const systemPrompt = GET_SYSTEM_INSTRUCTION(session.framework, session.files);

    await streamPollinations(
      session.messages,
      systemPrompt, 
      selectedModel,
      (chunk) => {
        fullText += chunk;

        const fileBlockRegex = /:::FILE\s+([^\s:]+)\s*:::([\s\S]*?):::END_FILE:::/g;
        
        const toolRegex = /:::TOOL_CALL ({[\s\S]*?}) :::/g;

        const markdownRegex = /```(?:tsx|ts|jsx|js|html|css)?\s*([\s\S]*?)```/g;

        let cleanText = fullText;
        const currentTools: ToolCall[] = [];
        const detectedFiles: Array<{path: string, content: string}> = [];

        const blockMatches = [...fullText.matchAll(fileBlockRegex)];
        blockMatches.forEach((m, index) => {
             cleanText = cleanText.replace(m[0], `<div class="file-generated" data-path="${m[1].trim()}">File: ${m[1].trim()}</div>`);
             detectedFiles.push({
                 path: m[1].trim(),
                 content: m[2].trim()
             });
             currentTools.push({
                 id: `block-${index}`,
                 name: 'create_file', // This handles edits too because it overwrites by path
                 args: { path: m[1].trim() },
                 status: 'success',
                 result: 'Generated'
             });
        });

        const toolMatches = [...fullText.matchAll(toolRegex)];
        toolMatches.forEach((m, index) => {
             cleanText = cleanText.replace(m[0], '');
             try {
                const json = JSON.parse(m[1]);
                currentTools.push({
                    id: `tool-${index}`,
                    name: json.name,
                    args: json.args,
                    status: 'success'
                });
             } catch (e) { }
        });

        if (detectedFiles.length === 0) {
            const mdMatches = [...fullText.matchAll(markdownRegex)];
            mdMatches.forEach((m, index) => {
                 const content = m[1];
                 const firstLine = content.split('\n')[0].trim();
                 let path = `src/file_${index}.tsx`;
                 
                 if (firstLine.startsWith('//') || firstLine.startsWith('/*')) {
                     const possiblePath = firstLine.replace(/[\/\*]/g, '').trim();
                     if (possiblePath.includes('/') || possiblePath.includes('.')) {
                         path = possiblePath;
                     }
                 }

                 if (content.length > 20) {
                     detectedFiles.push({ path, content });
                     currentTools.push({
                         id: `md-${index}`,
                         name: 'create_file',
                         args: { path },
                         status: 'success',
                         result: 'Extracted from Markdown'
                     });
                 }
            });
        }

        setSessions(prev => prev.map(s => {
            if (s.id === session.id) {
                const msgs = s.messages.map(m => {
                   if (m.id === modelMsgId) {
                       return { ...m, text: cleanText.trim(), toolCalls: currentTools };
                   }
                   return m;
                });
                
                let updatedFiles = [...s.files];
                let title = s.title;

                detectedFiles.forEach(f => {
                     const name = f.path.split('/').pop() || f.path;
                     const existingIdx = updatedFiles.findIndex(file => file.path === f.path);
                     
                     if (existingIdx >= 0) {
                         if (updatedFiles[existingIdx].content !== f.content) {
                             updatedFiles[existingIdx] = { ...updatedFiles[existingIdx], content: f.content };
                         }
                     } else {
                         const deterministicId = `${s.id}-${f.path}`;
                         updatedFiles.push({
                             id: deterministicId, 
                             name,
                             path: f.path,
                             type: 'file',
                             content: f.content,
                             parentId: null
                         });
                     }
                });
                
                toolMatches.forEach(m => {
                    try {
                        const json = JSON.parse(m[1]);
                        if (json.name === 'rename_chat' && json.args.title) {
                            title = json.args.title;
                        }
                    } catch (e) {}
                });

                return { ...s, messages: msgs, files: updatedFiles, title };
            }
            return s;
        }));
      },
      apiKey
    );
  };

  const renderMobileContent = () => {
     if (activeTab === 'config') {
        return (
            <div className="p-6 text-white h-full overflow-y-auto animate-fade-in pb-24">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <Settings className="text-poll-accent" /> Settings
                </h2>
                
                <div className="space-y-8">
                     <div>
                        <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Pollinations API Key <span className="text-red-500">*</span></label>
                        <div className={`bg-[#161b22] border rounded-xl p-4 ${!apiKey ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <Key size={16} className={!apiKey ? 'text-red-400' : 'text-poll-accent'} />
                                <span className={`text-sm font-semibold ${!apiKey ? 'text-red-200' : 'text-gray-200'}`}>Enter Key (Required)</span>
                            </div>
                            <input 
                                type="password" 
                                value={apiKey}
                                onChange={handleApiKeyChange}
                                placeholder="sk-..." 
                                className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-poll-accent transition-colors font-mono"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                <span className="text-red-400 font-bold block mb-1">Required: These models will not work without a valid Pollinations API Key.</span>
                                <a href="https://pollinations.ai" target="_blank" rel="noreferrer" className="text-poll-accent hover:underline">Get a key here</a>
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Project Framework</label>
                        <div className="grid grid-cols-1 gap-3">
                             <button 
                                onClick={() => setSelectedFramework('React')}
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-200 active:scale-95 ${selectedFramework === 'React' ? 'border-poll-accent bg-poll-accent/10' : 'border-gray-700 bg-[#161b22]'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Code2 size={16} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className={`font-bold ${selectedFramework === 'React' ? 'text-white' : 'text-gray-400'}`}>React</span>
                                        <span className="text-xs text-gray-500">Hooks & Functional Components</span>
                                    </div>
                                </div>
                                {selectedFramework === 'React' && <Check size={20} className="text-poll-accent" />}
                            </button>
                            
                            <button 
                                onClick={() => setSelectedFramework('Angular')}
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-200 active:scale-95 ${selectedFramework === 'Angular' ? 'border-poll-accent bg-poll-accent/10' : 'border-gray-700 bg-[#161b22]'}`}
                            >
                                <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                                        <Code2 size={16} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className={`font-bold ${selectedFramework === 'Angular' ? 'text-white' : 'text-gray-400'}`}>Angular</span>
                                        <span className="text-xs text-gray-500">Standalone Components</span>
                                    </div>
                                </div>
                                {selectedFramework === 'Angular' && <Check size={20} className="text-poll-accent" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">AI Model</label>
                        <div className="grid grid-cols-1 gap-3">
                            {MODELS.map((model) => (
                                <button 
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-200 active:scale-95 ${selectedModel === model.id ? 'border-poll-accent bg-poll-accent/10' : 'border-gray-700 bg-[#161b22]'}`}
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
                     <Zap size={40} className="text-poll-accent" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">Pollinations.ai</h2>
                 <p className="mb-8 text-sm max-w-xs text-gray-400">
                     Free, unlimited AI code generation. Powered by the hive mind.
                 </p>
                 <button onClick={createNewSession} className="w-full max-w-[200px] py-4 bg-poll-accent text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2">
                    <Plus size={20} /> Start Coding
                 </button>
             </div>
         );
     }

     if (activeTab === 'dashboard') {
        return (
            <div className="p-4 space-y-4 animate-fade-in pb-24">
                <h2 className="text-xl font-bold text-white mb-6">Your Projects</h2>
                <button onClick={createNewSession} className="w-full py-6 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 flex flex-col items-center gap-2 hover:border-poll-accent hover:text-poll-accent transition-colors bg-[#161b22]/50 active:scale-[0.98]">
                    <Plus size={28} /> <span className="font-semibold">New Project</span>
                </button>
                <div className="space-y-3 mt-4">
                    {sessions.map((s, i) => (
                        <div 
                            key={s.id} 
                            onClick={() => { setCurrentSessionId(s.id); setActiveTab('chat'); }} 
                            className="bg-[#1e232a] p-4 rounded-xl border border-gray-800 flex justify-between items-center active:scale-[0.98] transition-all animate-slide-up shadow-sm"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-2 h-2 rounded-full bg-poll-accent shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
                                <div>
                                    <h3 className="text-white font-medium">{s.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] uppercase font-bold tracking-wider bg-gray-900 text-gray-500 px-1.5 py-0.5 rounded border border-gray-800">{s.framework}</span>
                                        <span className="text-xs text-gray-600 font-mono">{s.files.length} files</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={(e) => deleteSession(e, s.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors"><X size={18} /></button>
                        </div>
                    ))}
                </div>
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
      
      <div className="hidden lg:flex h-full">
         <div className="w-72 bg-[#050505] border-r border-gray-800 flex flex-col">
             <div className="p-5 border-b border-gray-800 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-poll-accent flex items-center justify-center text-black shadow-lg shadow-yellow-500/20">
                    <Zap size={20} fill="currentColor" />
                 </div>
                 <h1 className="font-bold text-lg tracking-tight text-white">Pollinations.ai</h1>
             </div>
             <div className="p-3 overflow-y-auto flex-1 space-y-1 custom-scrollbar">
                 <button onClick={createNewSession} className="w-full p-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg mb-6 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] border border-white/5">
                     <Plus size={16} /> New Project
                 </button>
                 <div className="px-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Recent</div>
                 {sessions.map(s => (
                     <button key={s.id} onClick={() => setCurrentSessionId(s.id)} className={`w-full text-left p-3 rounded-lg text-sm truncate transition-all duration-200 group relative ${currentSessionId === s.id ? 'bg-[#1a1a1a] text-poll-accent font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-[#111]'}`}>
                         <span className="relative z-10">{s.title}</span>
                         {currentSessionId === s.id && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-poll-accent rounded-l-lg"></div>}
                     </button>
                 ))}
             </div>
             
             <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] space-y-3">
                <div className="flex flex-col gap-1.5 text-xs mb-2">
                    <span className="font-medium text-gray-500 uppercase tracking-wider flex justify-between">
                        API Key <span className="text-red-400 text-[10px]">*Required</span>
                    </span>
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
                    <select 
                        value={selectedFramework} 
                        onChange={(e) => setSelectedFramework(e.target.value as Framework)}
                        className="bg-[#161b22] border border-gray-700 rounded px-2 py-2 focus:outline-none focus:border-poll-accent text-gray-300 transition-colors w-full"
                    >
                        <option value="React">React</option>
                        <option value="Angular">Angular</option>
                    </select>
                </div>
                
                <div className="flex flex-col gap-1.5 text-xs">
                    <span className="font-medium text-gray-500 uppercase tracking-wider">Model</span>
                    <select 
                        value={selectedModel} 
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-[#161b22] border border-gray-700 rounded px-2 py-2 focus:outline-none focus:border-poll-accent text-gray-300 transition-colors w-full"
                    >
                        {MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <div className="text-[10px] text-gray-500 px-1">
                        {MODELS.find(m => m.id === selectedModel)?.desc}
                    </div>
                </div>
             </div>
         </div>

         <div className="flex-1 border-r border-gray-800 flex flex-col min-w-0 bg-[#000]">
             {!currentSessionId ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-6 animate-scale-in">
                    <div className="w-24 h-24 rounded-full bg-[#111] flex items-center justify-center border border-gray-800 shadow-2xl">
                        <Zap size={48} className="text-poll-accent opacity-80" />
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

         <div className="w-[500px] bg-[#050505] flex flex-col border-l border-gray-800 shadow-2xl z-10">
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
                           <div className="p-4 border-t border-gray-800 bg-[#0a0a0a]">
                                <button className="w-full py-3 bg-green-600/90 hover:bg-green-500 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] text-white shadow-lg shadow-green-900/20">
                                    <Play size={16} /> Run Preview
                                </button>
                           </div>
                       </div>
                   )}
                 </>
             )}
         </div>
      </div>

      <div className="lg:hidden flex flex-col h-full relative">
        <header className="h-14 bg-[#0a0a0a] border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-20">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-400 hover:text-white active:scale-95 transition-transform"><Menu size={24} /></button>
            <div className="flex items-center gap-2">
                 <Zap size={16} className="text-poll-accent fill-poll-accent" />
                 <span className="font-bold text-sm truncate max-w-[200px] text-gray-200">{currentSession?.title || 'Pollinations.ai'}</span>
            </div>
            <div className="w-8"></div>
        </header>

        <div 
            className={`fixed inset-0 z-50 flex pointer-events-none sidebar-backdrop ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}
        >
             <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
                onClick={() => setIsSidebarOpen(false)}
             />
             
             <div 
                className={`w-[85%] max-w-xs bg-[#050505] h-full shadow-2xl p-4 flex flex-col border-r border-gray-800 sidebar-panel transform gpu ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                onClick={e => e.stopPropagation()}
             >
                <div className="flex justify-between items-center mb-8 pt-2">
                    <h2 className="font-bold text-xl text-white flex items-center gap-2">
                        <Zap className="text-poll-accent" size={24} /> Projects
                    </h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                
                <button 
                    onClick={createNewSession} 
                    className="w-full py-3.5 bg-poll-accent rounded-xl font-bold mb-6 flex items-center justify-center gap-2 text-black shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
                >
                    <Plus size={18} /> New Project
                </button>
                
                <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                    {sessions.map(s => (
                        <button 
                            key={s.id} 
                            onClick={() => { setCurrentSessionId(s.id); setActiveTab('chat'); setIsSidebarOpen(false); }} 
                            className={`w-full text-left p-3.5 rounded-xl text-sm flex justify-between items-center transition-all duration-200 active:scale-98 ${currentSessionId === s.id ? 'bg-[#1a1a1a] text-poll-accent shadow-md border border-gray-800' : 'text-gray-400 hover:bg-[#111]'}`}
                        >
                            <span className="truncate font-medium">{s.title}</span>
                            <span className="text-[10px] bg-gray-900 px-2 py-0.5 rounded text-gray-500 border border-gray-800 font-mono">{s.framework.slice(0,3)}</span>
                        </button>
                    ))}
                </div>
             </div>
        </div>

        <div className="flex-1 overflow-hidden relative bg-[#000]">
             {renderMobileContent()}
        </div>

        <nav className="h-[70px] bg-[#0a0a0a] border-t border-gray-800 flex items-center justify-around shrink-0 pb-safe z-20 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.5)]">
            <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 w-16 ${activeTab === 'dashboard' ? 'text-poll-accent bg-poll-accent/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <LayoutDashboard size={24} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} /> 
            </button>
            <button 
                onClick={() => setActiveTab('chat')} 
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 w-16 ${activeTab === 'chat' ? 'text-poll-accent bg-poll-accent/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Code2 size={24} strokeWidth={activeTab === 'chat' ? 2.5 : 2} /> 
            </button>
            {currentSessionId && (
                 <button 
                    onClick={() => setActiveTab('explorer')} 
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 w-16 ${activeTab === 'explorer' ? 'text-poll-accent bg-poll-accent/10' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                    <MessageSquare size={24} className="rotate-90" strokeWidth={activeTab === 'explorer' ? 2.5 : 2} /> 
                </button>
            )}
            <button 
                onClick={() => setActiveTab('config')} 
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 w-16 ${activeTab === 'config' ? 'text-poll-accent bg-poll-accent/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Settings size={24} strokeWidth={activeTab === 'config' ? 2.5 : 2} /> 
            </button>
        </nav>
      </div>
    </div>
  );
};

export default App;