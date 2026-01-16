import React, { useEffect, useRef, useState } from 'react';
import { FileItem } from '../types';
import { X, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';

interface PreviewWindowProps {
  files: FileItem[];
  onClose: () => void;
}

const PreviewWindow: React.FC<PreviewWindowProps> = ({ files, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0); // To force iframe refresh
  const [isLoading, setIsLoading] = useState(true);

  // Auto-refresh when files change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
        setKey(prev => prev + 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [files]);

  useEffect(() => {
    const generatePreview = async () => {
      setIsLoading(true);
      if (!iframeRef.current) return;

      const jsFiles = files.filter(f => /\.(js|jsx|ts|tsx)$/.test(f.name));
      const cssFiles = files.filter(f => f.name.endsWith('.css'));
      const assetFiles = files.filter(f => !/\.(js|jsx|ts|tsx|css|html)$/.test(f.name));

      // 1. Handle CSS
      const cssContent = cssFiles.map(f => f.content).join('\n');

      // 2. Handle Assets (Images, etc.)
      // Create Blobs for assets and map paths to Blob URLs
      const assetMap: Record<string, string> = {};
      assetFiles.forEach(f => {
          // Detect mime type roughly
          let type = 'application/octet-stream';
          if (f.name.endsWith('.png')) type = 'image/png';
          else if (f.name.endsWith('.jpg') || f.name.endsWith('.jpeg')) type = 'image/jpeg';
          else if (f.name.endsWith('.svg')) type = 'image/svg+xml';
          else if (f.name.endsWith('.json')) type = 'application/json';

          // Assuming content is string (base64 or raw). For text-based IDE, images might be 
          // problematic unless they are generated SVGs or explicitly base64 strings in the content.
          // If content is base64 string without header:
          const blob = new Blob([f.content || ''], { type });
          assetMap[f.path] = URL.createObjectURL(blob);
          assetMap[`./${f.path}`] = assetMap[f.path]; // Relative path variant
      });

      // 3. Create Import Map and Blobs for Code
      const imports: Record<string, string> = {
        "react": "https://esm.sh/react@18.2.0",
        "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
        "lucide-react": "https://esm.sh/lucide-react@0.263.1",
        // Add more default libs if needed
      };

      const blobUrls: string[] = [];
      
      jsFiles.forEach(file => {
        let content = file.content || '';

        // REPLACEMENT LOGIC FOR ASSETS
        // If code has `src="./assets/image.png"`, replace with blob URL
        Object.keys(assetMap).forEach(path => {
             // Simple string replace - beware of collisions but efficient for this usecase
             content = content.split(`"${path}"`).join(`"${assetMap[path]}"`);
             content = content.split(`'${path}'`).join(`'${assetMap[path]}'`);
        });

        const blob = new Blob([content], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        blobUrls.push(url);

        const cleanPath = file.path.startsWith('/') ? '.' + file.path : './' + file.path;
        imports[cleanPath] = url;
        const noExt = cleanPath.replace(/\.(tsx|ts|jsx|js)$/, '');
        imports[noExt] = url;
      });

      // 4. Construct HTML
      const customHtml = files.find(f => f.name === 'index.html');
      
      let htmlContent = '';

      if (customHtml && customHtml.content) {
          htmlContent = customHtml.content;
          // Inject logic
          if (!htmlContent.includes('importmap')) {
              htmlContent = htmlContent.replace('<head>', `
                <head>
                <script type="importmap">
                    ${JSON.stringify({ imports }, null, 2)}
                </script>
                <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                <style>${cssContent}</style>
              `);
          }
      } else {
          htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Pollinations Preview</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                <style>
                  ${cssContent}
                  body { background-color: white; color: black; }
                  /* Scrollbar styling for iframe */
                  ::-webkit-scrollbar { width: 6px; }
                  ::-webkit-scrollbar-track { background: transparent; }
                  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                </style>
                <script type="importmap">
                  ${JSON.stringify({ imports }, null, 2)}
                </script>
              </head>
              <body>
                <div id="root"></div>
                <script type="text/babel" data-type="module">
                  import React from 'react';
                  import { createRoot } from 'react-dom/client';
                  
                  // Entry Point Logic
                  ${files.some(f => f.path.includes('index.tsx') || f.path.includes('main.tsx')) 
                    ? `import './${files.find(f => f.path.includes('index.tsx') || f.path.includes('main.tsx'))!.path}';` 
                    : `
                        // Fallback auto-render App
                        import App from './src/App'; 
                        const root = createRoot(document.getElementById('root'));
                        root.render(<App />);
                      `
                  }
                </script>
              </body>
            </html>
          `;
      }

      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }

      setIsLoading(false);

      return () => {
        blobUrls.forEach(url => URL.revokeObjectURL(url));
        Object.values(assetMap).forEach(url => URL.revokeObjectURL(url));
      };
    };

    setTimeout(generatePreview, 50);
  }, [key]); // Rely on key to refresh which is triggered by files change debounce

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0a0a0a] w-full max-w-7xl h-[95vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#111]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors"></span>
            </div>
            <div className="h-4 w-[1px] bg-gray-700 mx-2"></div>
            <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                Live Preview
                {isLoading && <Loader2 size={12} className="animate-spin text-poll-accent" />}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => setKey(k => k + 1)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Reload"
            >
                <RefreshCw size={18} />
            </button>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
            >
                <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-white">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10 bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
                    <div className="flex flex-col items-center gap-4 bg-black/80 p-6 rounded-2xl border border-gray-800 shadow-2xl">
                        <Loader2 size={40} className="text-poll-accent animate-spin" />
                        <span className="text-gray-300 font-mono text-sm tracking-wide">Compiling modules...</span>
                    </div>
                </div>
            )}
            <iframe 
                ref={iframeRef}
                key={key}
                title="Preview"
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
        </div>
      </div>
    </div>
  );
};

export default PreviewWindow;