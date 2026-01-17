import React, { useRef, useEffect, useState } from 'react';
import { Message, ToolCall } from '../types.ts';
import { User, Zap, Cpu, Loader2, CheckCircle2, ChevronRight, Play, AlertCircle, Coins, Flower } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  error?: string | null;
  className?: string;
}

const formatText = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
      <div className="space-y-1 min-w-0 break-words">
          {lines.map((line, i) => {
              if (line.trim() === '') return <br key={i} />;
              const codeSplit = line.split(/(`[^`]+`)/);
              return (
                  <div key={i} className="min-h-[1.2em]">
                      {codeSplit.map((part, j) => {
                          if (part.startsWith('`') && part.endsWith('`')) {
                              return (
                                  <code key={j} className="bg-gray-800 px-1 py-0.5 rounded text-poll-accent font-mono text-xs break-all">
                                      {part.slice(1, -1)}
                                  </code>
                              );
                          }
                          const boldSplit = part.split(/(\*\*[^*]+\*\*)/);
                          return (
                              <span key={j}>
                                  {boldSplit.map((subPart, k) => {
                                      if (subPart.startsWith('**') && subPart.endsWith('**')) {
                                          return <strong key={k} className="text-white font-bold">{subPart.slice(2, -2)}</strong>;
                                      }
                                      return subPart;
                                  })}
                              </span>
                          );
                      })}
                  </div>
              );
          })}
      </div>
  );
};

const ToolCallDisplay: React.FC<{ tool: ToolCall }> = ({ tool }) => {
  const [expanded, setExpanded] = useState(false);
  let args = tool.args;
  const isFileOp = tool.name === 'create_file' || tool.name === 'update_file' || tool.name === 'edit_file';
  const path = args?.path || 'unknown';

  return (
    <div className="mb-2 ml-0 sm:ml-2 bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden max-w-full animate-slide-up origin-left">
      <div 
        className="flex items-center justify-between px-3 py-2.5 bg-[#202020] cursor-pointer hover:bg-[#2a2a2a] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {tool.status === 'pending' ? (
             <div className="relative flex items-center justify-center w-4 h-4">
                <Loader2 size={16} className="animate-spin text-poll-accent absolute" />
             </div>
          ) : (
             <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
          )}
          <div className="flex flex-col leading-tight min-w-0">
             <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-gray-300 whitespace-nowrap">{tool.name.replace('_', ' ')}</span>
                 {tool.status === 'pending' && <span className="text-[10px] text-poll-accent animate-pulse">Running...</span>}
             </div>
             {isFileOp && <span className="text-xs font-mono text-gray-500 truncate">{path}</span>}
          </div>
        </div>
        <ChevronRight size={14} className={`text-gray-600 transition-transform flex-shrink-0 duration-300 ease-ios ${expanded ? 'rotate-90' : ''}`} />
      </div>
      
      {expanded && (
        <div className="px-3 py-2 bg-[#111] border-t border-gray-800">
          <pre className="font-mono text-[10px] text-gray-400 overflow-x-auto whitespace-pre-wrap break-all leading-tight">
             {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage, error, className = '' }) => {
  const [input, setInput] = React.useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 50);
    }
  }, [messages, isLoading, error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className={`flex flex-col h-full bg-[#000] relative ${className}`}>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-4 sm:space-y-6 custom-scrollbar scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-60 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-poll-accent/10 flex items-center justify-center mb-4">
                <Zap size={24} className="text-poll-accent" />
            </div>
            <p className="font-medium text-sm">Start pollinating your code...</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up gpu`} style={{ animationDelay: `${index < 5 ? index * 0.05 : 0}s` }}>
            <div className={`flex gap-2 sm:gap-3 max-w-[98%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-lg transform transition-transform duration-300 hover:scale-110 ${
                msg.role === 'user' ? 'bg-gray-800' : 'bg-poll-accent text-black'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Zap size={16} fill="currentColor" />}
              </div>

              <div className="flex flex-col w-full min-w-0 gap-2">
                {msg.text && (
                   <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm min-w-0 break-words ${
                    msg.role === 'user' 
                      ? 'bg-[#222] text-gray-100 rounded-tr-none border border-gray-700' 
                      : 'bg-[#111] text-gray-300 border border-gray-800 rounded-tl-none'
                  }`}>
                    {formatText(msg.text)}
                  </div>
                )}
                
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="flex flex-col gap-1 w-full min-w-0">
                    {msg.toolCalls.map(tool => <ToolCallDisplay key={tool.id} tool={tool} />)}
                  </div>
                )}

                {msg.role === 'model' && (
                    <div className="ml-1 flex items-center gap-3 opacity-60">
                        {msg.usage && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono" title="Total tokens used">
                                <Coins size={10} /> {msg.usage.totalTokens}
                            </div>
                        )}
                        {(msg.cost !== undefined) && (
                            <div className="flex items-center gap-1 text-[10px] text-pink-400 font-mono font-bold" title="Pollen cost">
                                <Flower size={10} /> -{msg.cost}
                            </div>
                        )}
                    </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-xs ml-12 animate-pulse">
            <Cpu size={14} className="text-poll-accent" />
            <span>Pollinating...</span>
          </div>
        )}

        {error && (
            <div className="mx-2 sm:mx-12 mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg flex items-center gap-3 animate-slide-up min-w-0">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-200 break-words">{error}</span>
            </div>
        )}

        <div ref={bottomRef} className="h-4 w-full flex-shrink-0" />
      </div>

      <div className="p-3 bg-[#0a0a0a] border-t border-gray-800 shrink-0 z-10">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
           <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your app logic..."
            className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-poll-accent font-sans transition-all duration-200 focus:bg-[#151515]"
            disabled={isLoading}
           />
           <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-1.5 bg-poll-accent rounded-lg text-black disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 hover:bg-poll-accent-hover transition-all duration-200 hover:scale-105 shadow-lg shadow-yellow-900/20"
           >
             <Play size={18} className="ml-0.5" fill="currentColor" />
           </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;