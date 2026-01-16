export type Framework = 'React' | 'Angular';

export interface GeneratedScript {
  title: string;
  framework: Framework;
  code: string;
  instructions: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string; // Only for files
  path: string;
  parentId?: string | null;
}

export interface ToolCall {
  id: string;
  name: string;
  args: any;
  status: 'pending' | 'success' | 'error';
  result?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text?: string;
  toolCalls?: ToolCall[];
  timestamp: number;
  usage?: TokenUsage;
  cost?: number; // Pollen cost
}

export interface ChatSession {
  id: string;
  title: string;
  framework: Framework;
  messages: Message[];
  files: FileItem[];
  lastModified: number;
  // Cumulative stats
  totalCost?: number;
  totalTokens?: number;
}

export interface AppState {
  view: 'dashboard' | 'explorer' | 'config' | 'chat'; // Mobile views
  currentChatId: string | null;
  sidebarOpen: boolean; // For mobile history
}