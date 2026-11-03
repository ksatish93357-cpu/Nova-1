/**
 * NOVA AI Personal Memory Engine
 * Manages persistent context, preferences, skills, and relevance injection
 */

export interface MemoryItem {
  id: string;
  category: 'preference' | 'skill' | 'project' | 'custom';
  content: string;
  createdAt: number;
  updatedAt: number;
  importance: 'high' | 'medium' | 'low';
  enabled: boolean;
}

export const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'preference',
    content: 'User understands Hindi, English, and Hinglish. Prefers clear, structured explanations with real code examples.',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    importance: 'high',
    enabled: true,
  },
  {
    id: 'mem-2',
    category: 'skill',
    content: 'Learning AI/ML engineering, neural network backprop, transformer self-attention, and building mini LLMs from scratch.',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    importance: 'high',
    enabled: true,
  },
  {
    id: 'mem-3',
    category: 'project',
    content: 'Working on NOVA AI and studying codecrafters build-your-own-x tutorials.',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    importance: 'medium',
    enabled: true,
  },
];

/**
 * Filter memories relevant to a given prompt query
 */
export function getRelevantMemories(
  memories: MemoryItem[],
  query: string,
  memoryEnabled: boolean = true
): MemoryItem[] {
  if (!memoryEnabled || !memories || memories.length === 0) {
    return [];
  }

  const active = memories.filter((m) => m.enabled);
  if (!query || query.trim() === '') {
    // Return high importance memories by default
    return active.filter((m) => m.importance === 'high');
  }

  const qLower = query.toLowerCase();
  const queryTokens = qLower.match(/\w+/g) || [];

  return active.filter((mem) => {
    if (mem.importance === 'high') return true;
    const memLower = mem.content.toLowerCase();
    return queryTokens.some((token) => token.length > 2 && memLower.includes(token));
  });
}

/**
 * Builds formatted system prompt context injection from memories
 */
export function formatMemoryContext(memories: MemoryItem[]): string {
  if (memories.length === 0) return '';
  const lines = memories.map((m) => `- [${m.category.toUpperCase()}]: ${m.content}`);
  return `\n[NOVA AI Long-Term Personal Memory]:\n${lines.join('\n')}\n(Use this user context naturally without explicitly reciting it unless relevant).\n`;
}
