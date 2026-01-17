import React from 'react';
import { FileItem } from '../types.ts';
import { Folder, FileCode, FileJson, FileType, File, Download } from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
  onDownloadProject?: () => void;
  className?: string;
}

const getFileIcon = (filename: string) => {
  if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return <FileCode size={16} className="text-blue-400" />;
  if (filename.endsWith('.jsx') || filename.endsWith('.js')) return <FileCode size={16} className="text-yellow-400" />;
  if (filename.endsWith('.json')) return <FileJson size={16} className="text-green-400" />;
  if (filename.endsWith('.css') || filename.endsWith('.html')) return <FileType size={16} className="text-orange-400" />;
  return <File size={16} className="text-gray-400" />;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFileId, onFileSelect, onDownloadProject, className = '' }) => {
  const sortedFiles = [...files].sort((a, b) => {
    // Sort logic: Folders first, then alphabetical
    // This is a flat list but we can approximate "folders first" by type
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  return (
    <div className={`bg-[#050505] text-gray-300 h-full overflow-y-auto custom-scrollbar ${className}`}>
      <div className="p-4 border-b border-gray-800 bg-[#0a0a0a] sticky top-0 z-10 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Project Files</h3>
        {onDownloadProject && (
            <button 
                onClick={(e) => { e.stopPropagation(); onDownloadProject(); }}
                className="text-gray-500 hover:text-poll-accent transition-colors p-1 rounded hover:bg-gray-900" 
                title="Download Project ZIP"
            >
                <Download size={16} />
            </button>
        )}
      </div>
      
      <div className="p-2 space-y-1">
        {sortedFiles.length === 0 && (
          <div className="text-center p-8 text-gray-700 text-sm italic animate-fade-in">
            No files generated yet.
          </div>
        )}

        {sortedFiles.map((file) => (
          <div 
            key={file.id} 
            onClick={() => onFileSelect(file.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-all duration-200 ${
              activeFileId === file.id 
                ? 'bg-[#1a1a1a] text-white border-l-2 border-poll-accent' 
                : 'hover:bg-[#111] hover:pl-4 border-l-2 border-transparent'
            }`}
          >
            {file.type === 'folder' ? (
              <Folder size={16} className="text-blue-400/80 fill-blue-400/10" />
            ) : (
              getFileIcon(file.name)
            )}
            <div className="flex flex-col min-w-0">
               <span className="text-sm font-sans truncate transition-colors group-hover:text-poll-accent">
                {file.name}
              </span>
              <span className="text-[10px] text-gray-600 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {file.path}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;