import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';

import AppLayout from './components/AppLayout';

import { Framework, ChatSession, Message, ToolCall, TokenUsage } from './types';
import { streamPollinations, getUserBalance } from './services/pollinationsService';
import { GET_SYSTEM_INSTRUCTION } from './constants';

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
  const [balance, setBalance] = useState<number | null>(null);
  
  useEffect(() => {
    const savedKey = localStorage.getItem('pollinations_api_key');
    if (savedKey) {
        setApiKey(savedKey);
        refreshBalance(savedKey);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('pollinations_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save sessions", e);
    }
  }, [sessions]);

  const refreshBalance = async (key: string) => {
      const b = await getUserBalance(key);
      setBalance(b);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('pollinations_api_key', key);
    if (key.trim().length > 0) {
        setError(null);
        refreshBalance(key);
    } else {
        setBalance(null);
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const activeFile = currentSession?.files.find(f => f.id === activeFileId);

  // Wrapper to sync state when switching sessions
  const handleSetCurrentSessionId = (id: string | null) => {
      setCurrentSessionId(id);
      if (id) {
          const session = sessions.find(s => s.id === id);
          if (session) {
              setSelectedFramework(session.framework);
          }
      }
  };

  // Wrapper to update session when changing framework in settings
  const handleFrameworkChange = (fw: Framework) => {
      setSelectedFramework(fw);
      if (currentSessionId) {
          setSessions(prev => prev.map(s => 
              s.id === currentSessionId ? { ...s, framework: fw } : s
          ));
      }
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Project',
      framework: selectedFramework,
      messages: [],
      files: [],
      lastModified: Date.now(),
      totalCost: 0,
      totalTokens: 0
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

    if (!hasFiles) return;
    
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

    if (!apiKey || apiKey.trim() === '') {
        const msg = "A Pollinations API Key is REQUIRED.";
        setError(msg);
        if (window.innerWidth < 1024) setActiveTab('config');
        return;
    }

    const startBalance = balance;

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
      await processPollinationsResponse(updatedSession, startBalance);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      refreshBalance(apiKey);
    }
  };

  const processPollinationsResponse = async (session: ChatSession, startBalance: number | null) => {
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
    let tokens: TokenUsage | undefined = undefined;

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

        // Handle :::FILE::: blocks
        const blockMatches = [...fullText.matchAll(fileBlockRegex)];
        blockMatches.forEach((m, index) => {
             const path = m[1].trim();
             let content = m[2].trim();
             
             // CLEANUP: Remove Markdown code fences if the model wrapped the content in them
             // This prevents "```javascript" from ending up in the actual file content
             const lines = content.split('\n');
             if (lines.length > 0 && lines[0].trim().startsWith('```')) {
                 lines.shift(); // Remove first line with backticks
                 if (lines.length > 0 && lines[lines.length - 1].trim().startsWith('```')) {
                     lines.pop(); // Remove last line with backticks
                 }
                 content = lines.join('\n');
             }
             
             cleanText = cleanText.replace(m[0], `<div class="file-generated" data-path="${path}">File: ${path}</div>`);
             detectedFiles.push({ path, content });
             
             const isUpdate = session.files.some(f => f.path === path);
             
             currentTools.push({
                 id: `block-${index}`,
                 name: isUpdate ? 'update_file' : 'create_file', 
                 args: { path },
                 status: 'success',
                 result: 'Generated'
             });
        });

        // Handle JSON tools
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

        // Fallback Markdown extraction
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
                     const isUpdate = session.files.some(f => f.path === path);
                     
                     currentTools.push({
                         id: `md-${index}`,
                         name: isUpdate ? 'update_file' : 'create_file',
                         args: { path },
                         status: 'success'
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

                // Process File Updates
                detectedFiles.forEach(f => {
                     const existingIdx = updatedFiles.findIndex(file => file.path === f.path);
                     if (existingIdx >= 0) {
                         updatedFiles[existingIdx] = { ...updatedFiles[existingIdx], content: f.content };
                     } else {
                         updatedFiles.push({
                             id: `${s.id}-${f.path}`, 
                             name: f.path.split('/').pop() || f.path,
                             path: f.path,
                             type: 'file',
                             content: f.content,
                             parentId: null
                         });
                     }
                });
                
                // Process JSON Tools
                toolMatches.forEach(m => {
                    try {
                        const json = JSON.parse(m[1]);
                        const args = json.args;
                        
                        if (json.name === 'rename_chat' && args.title) {
                            title = args.title;
                        } else if (json.name === 'rename_file' && args.oldPath && args.newPath) {
                            const idx = updatedFiles.findIndex(f => f.path === args.oldPath);
                            if (idx >= 0) {
                                updatedFiles[idx] = { ...updatedFiles[idx], path: args.newPath, name: args.newPath.split('/').pop() || '' };
                            }
                        } else if (json.name === 'rename_folder' && args.oldPath && args.newPath) {
                            updatedFiles = updatedFiles.map(f => {
                                if (f.path.startsWith(args.oldPath)) {
                                    return { ...f, path: f.path.replace(args.oldPath, args.newPath) };
                                }
                                return f;
                            });
                        } else if (json.name === 'delete_file' && args.path) {
                            updatedFiles = updatedFiles.filter(f => f.path !== args.path);
                        }
                    } catch (e) {}
                });

                return { ...s, messages: msgs, files: updatedFiles, title };
            }
            return s;
        }));
      },
      apiKey,
      (usage) => {
          tokens = usage;
      }
    );

    if (apiKey) {
        const endBalance = await getUserBalance(apiKey);
        setBalance(endBalance);
        
        let cost = 0;
        if (startBalance !== null && endBalance !== null) {
            cost = Math.max(0, Math.round((startBalance - endBalance) * 10000) / 10000);
        }

        setSessions(prev => prev.map(s => {
            if (s.id === session.id) {
                // Update stats
                const newTotalCost = (s.totalCost || 0) + cost;
                const newTotalTokens = (s.totalTokens || 0) + (tokens?.totalTokens || 0);
                
                return {
                    ...s,
                    totalCost: newTotalCost,
                    totalTokens: newTotalTokens,
                    messages: s.messages.map(m => {
                        if (m.id === modelMsgId) {
                            return { ...m, usage: tokens, cost };
                        }
                        return m;
                    })
                };
            }
            return s;
        }));
    }
  };

  return (
    <AppLayout 
        sessions={sessions}
        currentSessionId={currentSessionId}
        activeFileId={activeFileId}
        activeTab={activeTab}
        isSidebarOpen={isSidebarOpen}
        isLoading={isLoading}
        error={error}
        selectedFramework={selectedFramework}
        selectedModel={selectedModel}
        apiKey={apiKey}
        balance={balance}
        setCurrentSessionId={handleSetCurrentSessionId}
        setActiveFileId={setActiveFileId}
        setActiveTab={setActiveTab}
        setIsSidebarOpen={setIsSidebarOpen}
        setSelectedFramework={handleFrameworkChange}
        setSelectedModel={setSelectedModel}
        handleApiKeyChange={handleApiKeyChange}
        createNewSession={createNewSession}
        handleSendMessage={handleSendMessage}
        deleteSession={deleteSession}
        handleDownloadProject={handleDownloadProject}
        currentSession={currentSession}
        activeFile={activeFile}
    />
  );
};

export default App;
