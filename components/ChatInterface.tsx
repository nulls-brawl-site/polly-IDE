import React, { useRef, useEffect, useState } from 'react';
import { Message, ToolCall } from '../types';
import { Bot, User, Cpu, Loader2, CheckCircle2, ChevronRight, Play, Zap, AlertCircle } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  error?: string | null;
  className?: string;
}

const formatText = (text: string) => {
  if (!text) return null;
  
  // Basic Markdown replacement for Bold, Code, Newlines
  // 1. HTML File Tags (from App.tsx replacement)
  if (text.includes('<div class="file-generated"')) {
      const parts = text.split(/(<div class="file-generated".*?<\/div>)/);
      return parts.map((part, i) => {
          if (part.startsWith('<div')) {
              // Extract path
              const match = part.match(/data-path="(.*?)"/);
              const path = match ? match[1] : 'Unknown File';
              return (
                  <div key={i} className="my-2 p-3 bg-gray-900 border border-gray-700 rounded-lg flex items-center gap-2 overflow-hidden max-w-full">
                      <div className="p-1.5 bg-poll-accent/10 rounded flex-shrink-0">
                        <Zap size={14} className="text-poll-accent" />
                      </div>
                      <span className="text-sm font-mono text-gray-300 truncate">{path}</span>
                      <span className="text-xs text-green-500 ml-auto font-bold uppercase tracking-wider flex-shrink-0">Generated</span>
                  </div>
              );
          }
          return formatSimpleMarkdown(part, i);
      });
  }
  
  return formatSimpleMarkdown(text, 0);
};

// Improved parsing logic to handle mixed markdown like `code` inside text or **bold** next to code
const formatSimpleMarkdown = (text: string, keyPrefix: number) => {
    // Split by newlines first
    const lines = text.split('\n');
    return (
        <div key={keyPrefix} className="space-y-1 min-w-0 break-words">
            {lines.map((line, i) => {
                if (line.trim() === '') return <br key={i} />;
                
                // 1. Split by Code Blocks first (`...`)
                const codeSplit = line.split(/(`[^`]+`)/);
                
                return (
                    <div key={i} className="min-h-[1.2em]">
                        {codeSplit.map((part, j) => {
                            // If it is code
                            if (part.startsWith('`') && part.endsWith('`')) {
                                return (
                                    <code key={j} className="bg-gray-800 px-1 py-0.5 rounded text-poll-accent font-mono text-xs break-all">
                                        {part.slice(1, -1)}
                                    </code>
                                );
                            }
                            
                            // If it is normal text, parse for Bold (**...**)
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
  
  // Parse args if they are stringified
  let args = tool.args;
  
  const isFileOp = tool.name === 'create_file' || tool.name === 'edit_file';
  const path = args?.path || 'unknown';

  return (
    <div className="mb-2 ml-2 sm:ml-8 bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden max-w-[95%] sm:max-w-[90%] animate-slide-up origin-left">
      <div 
        className="flex items-center justify-between px-3 py-2 bg-[#252525] border-b border-gray-800 cursor-pointer hover:bg-[#333] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {tool.status === 'pending' ? (
             <Loader2 size={14} className="animate-spin text-poll-accent flex-shrink-0" />
          ) : (
             <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
          )}
          <span className="text-xs font-mono text-gray-400 whitespace-nowrap flex-shrink-0">Fn:</span>
          <span className="text-xs font-mono font-bold text-poll-accent whitespace-nowrap flex-shrink-0">{tool.name}</span>
          {isFileOp && <span className="text-xs font-mono text-gray-500 truncate min-w-0">{path}</span>}
        </div>
        <ChevronRight size={14} className={`text-gray-500 transition-transform flex-shrink-0 duration-200 ${expanded ? 'rotate-90' : ''}`} />
      </div>
      
      {expanded && (
        <div className="px-3 py-2 bg-[#111]">
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className={`flex flex-col h-full bg-[#000] ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 sm:space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-60 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-poll-accent/10 flex items-center justify-center mb-4">
                <Zap size={24} className="text-poll-accent" />
            </div>
            <p className="font-medium text-sm">Start pollinating your code...</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up gpu`} style={{ animationDelay: `${index < 5 ? index * 0.1 : 0}s` }}>
            <div className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ${
                msg.role === 'user' ? 'bg-gray-800' : 'bg-poll-accent text-black'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Zap size={16} fill="currentColor" />}
              </div>

              {/* Content Bubble */}
              <div className="flex flex-col w-full min-w-0">
                {msg.text && (
                   <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm min-w-0 break-words ${
                    msg.role === 'user' 
                      ? 'bg-[#222] text-gray-100 rounded-tr-none border border-gray-700' 
                      : 'bg-[#111] text-gray-300 border border-gray-800 rounded-tl-none'
                  }`}>
                    {formatText(msg.text)}
                  </div>
                )}
                
                {/* Tool Calls rendering */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-2 space-y-1 w-full min-w-0">
                    {msg.toolCalls.map(tool => <ToolCallDisplay key={tool.id} tool={tool} />)}
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

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#0a0a0a] border-t border-gray-800 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
           <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your app logic..."
            className="w-full bg-[#111] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-poll-accent font-sans transition-all focus:bg-[#151515]"
            disabled={isLoading}
           />
           <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-1.5 bg-poll-accent rounded-lg text-black disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 hover:bg-poll-accent-hover transition-all hover:scale-105 shadow-lg shadow-yellow-900/20"
           >
             <Play size={18} className="ml-0.5" fill="currentColor" />
           </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;