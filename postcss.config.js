@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=JetBrains+Mono:wght@400;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom Styles from original file */
body, input, textarea, select, button {
  font-family: 'Roboto', sans-serif;
  background-color: #000000;
  color: #f8fafc;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #333; 
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555; 
}

.gpu {
  transform: translate3d(0,0,0);
  backface-visibility: hidden;
  perspective: 1000px;
  will-change: transform, opacity;
}

.glass-panel {
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}