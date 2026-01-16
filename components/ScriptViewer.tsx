import React, { useState } from 'react';
import { GeneratedScript } from '../types';
import { Check, Copy, Code, Terminal } from 'lucide-react';

interface ScriptViewerProps {
  data: GeneratedScript | null;
  loading: boolean;
}

const ScriptViewer: React.FC<ScriptViewerProps> = ({ data, loading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (data?.code) {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/50">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-poll-accent border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-purple-400 border-b-transparent rounded-full animate-spin reverse-spin"></div>
        </div>
        <p className="animate-pulse font-mono">Synthesizing {data?.framework || 'Script'}...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 p-8 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/30">
        <Code size={48} className="mb-4 opacity-50" />
        <p className="text-center max-w-sm">
          Enter a prompt and select a framework to generate your code script using Gemini's Function Calling.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-poll-card rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-b border-gray-700 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-md ${data.framework === 'React' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
            <Terminal size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-200 text-sm">{data.title}</h3>
            <span className="text-xs text-gray-500 font-mono">{data.framework} Component</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          title="Copy Code"
        >
          {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
        </button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-[#0d1117] p-4">
        <pre className="font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
          <code>{data.code}</code>
        </pre>
      </div>

      <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Instructions</h4>
        <p className="text-sm text-gray-300 leading-snug">{data.instructions}</p>
      </div>
    </div>
  );
};

export default ScriptViewer;