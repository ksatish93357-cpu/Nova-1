export type AppTab = 'chat' | 'lab' | 'playground' | 'knowledge' | 'settings';

export type LanguageMode = 'auto' | 'english' | 'hindi' | 'hinglish';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  imageUrl?: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  languageMode?: LanguageMode;
  selectedModel?: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  provider: 'gemini' | 'groq' | 'openai' | 'anthropic';
  description: string;
  contextWindow: string;
  isDefault?: boolean;
  isCustom?: boolean;
  status: 'active' | 'requires_key' | 'ready';
  tag: string;
}

export interface LearningModule {
  id: string;
  title: string;
  subtitle: string;
  category: 'foundations' | 'neural_nets' | 'llm' | 'advanced';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  description: string;
  keyConcepts: string[];
  codeSnippet: string;
  hasInteractiveDemo: boolean;
}

export interface CodeProject {
  id: string;
  title: string;
  language: 'python' | 'javascript' | 'typescript' | 'json';
  code: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeTopic {
  id: string;
  title: string;
  category: 'neural-network' | 'llm' | 'database' | 'git' | 'compiler' | 'web-server' | 'operating-system';
  description: string;
  difficulty: string;
  languages: string[];
  repoUrl: string;
  keyConcepts: string[];
  coreTutorial: string;
  codeSnippet?: string;
}
