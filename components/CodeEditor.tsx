import React from 'react';
import { FileItem } from '../types';

interface CodeEditorProps {
  file: FileItem | undefined;
  onClose: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file, onClose }) => {
  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-600 bg-[#050505] animate-fade-in">
        <p>Select a file to view code</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050505] animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-gray-800">
        <div className="flex items-center gap-2">
           <span className="text-sm font-mono text-gray-300">{file.path}</span>
        </div>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-900 border border-gray-800 rounded transition-colors">
          Close
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <pre className="font-mono text-sm text-gray-300 leading-relaxed whitespace-pre">
          {file.content || '// No content'}
        </pre>
      </div>
    </div>
  );
};

export default CodeEditor;
