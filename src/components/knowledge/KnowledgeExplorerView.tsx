import { useState } from 'react';
import { KNOWLEDGE_TOPICS } from '../../data/knowledgeBase';
import { KnowledgeTopic } from '../../types';
import { MarkdownView, CodeBlock } from '../../utils/markdownRenderer';
import {
  Compass,
  Search,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Code2,
  CheckCircle,
  FolderGit2,
  BookOpen,
  X,
  Play,
} from 'lucide-react';

interface KnowledgeExplorerViewProps {
  onOpenCodePlayground?: (code: string, language: string) => void;
  onAskNovaAboutTopic?: (topic: KnowledgeTopic) => void;
}

export function KnowledgeExplorerView({
  onOpenCodePlayground,
  onAskNovaAboutTopic,
}: KnowledgeExplorerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTopic, setActiveTopic] = useState<KnowledgeTopic | null>(null);

  // Bookmarks persistence
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nova_knowledge_bookmarks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['build-neural-network', 'build-llm-gpt'];
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (bookmarks.includes(id)) {
      updated = bookmarks.filter((b) => b !== id);
    } else {
      updated = [...bookmarks, id];
    }
    setBookmarks(updated);
    try {
      localStorage.setItem('nova_knowledge_bookmarks', JSON.stringify(updated));
    } catch (e) {}
  };

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'neural-network', label: 'Neural Networks' },
    { id: 'llm', label: 'LLMs & GPT' },
    { id: 'database', label: 'Databases' },
    { id: 'git', label: 'Git & Storage' },
    { id: 'compiler', label: 'Compilers' },
    { id: 'web-server', label: 'Web Servers' },
    { id: 'operating-system', label: 'Operating Systems' },
    { id: 'bookmarked', label: `Saved (${bookmarks.length})` },
  ];

  const filteredTopics = KNOWLEDGE_TOPICS.filter((topic) => {
    if (selectedCategory === 'bookmarked') {
      if (!bookmarks.includes(topic.id)) return false;
    } else if (selectedCategory !== 'all') {
      if (topic.category !== selectedCategory) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = topic.title.toLowerCase().includes(q);
      const matchDesc = topic.description.toLowerCase().includes(q);
      const matchConcepts = topic.keyConcepts.some((c) => c.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchConcepts;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6">
      {/* Header Banner */}
      <div className="mb-6 pb-4 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5" />
                codecrafters-io/build-your-own-x
              </span>
              <span className="text-xs text-slate-500">Official Educational Resource</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-indigo-400" />
              Build-Your-Own-X Knowledge Explorer
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Deep architectural guides and step-by-step blueprints for building real software from scratch.
            </p>
          </div>

          <a
            href="https://github.com/codecrafters-io/build-your-own-x"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-800 transition-colors self-start sm:self-auto"
          >
            <span>Original GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AI models, neural networks, databases, compilers..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTopics.map((topic) => {
          const isBookmarked = bookmarks.includes(topic.id);
          return (
            <div
              key={topic.id}
              onClick={() => setActiveTopic(topic)}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {topic.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">{topic.difficulty}</span>
                    <button
                      onClick={(e) => toggleBookmark(topic.id, e)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                      title={isBookmarked ? 'Remove Bookmark' : 'Save to Bookmarks'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-400 fill-current" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {topic.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 mt-2 leading-relaxed">
                  {topic.description}
                </p>

                {/* Key Concepts Preview */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
                  {topic.keyConcepts.slice(0, 3).map((concept, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                      <CheckCircle className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="truncate">{concept}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                  {topic.languages.join(' • ')}
                </div>
                <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Explore Guide</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Modal */}
      {activeTopic && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-indigo-400 font-semibold">
                  {activeTopic.category} • {activeTopic.difficulty}
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">{activeTopic.title}</h2>
              </div>
              <button
                onClick={() => setActiveTopic(null)}
                aria-label="Close Topic Guide"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <p className="text-sm text-slate-300 leading-relaxed">{activeTopic.description}</p>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Fundamental Architectural Principles:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeTopic.keyConcepts.map((concept, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="text-slate-200">{concept}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Step-by-Step Tutorial & Breakdown:
                </h4>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <MarkdownView
                    content={activeTopic.coreTutorial}
                    onRunInPlayground={onOpenCodePlayground}
                  />
                </div>
              </div>

              {activeTopic.codeSnippet && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Executable Code Implementation:
                    </h4>
                    {onOpenCodePlayground && (
                      <button
                        onClick={() => {
                          onOpenCodePlayground(activeTopic.codeSnippet!, 'python');
                          setActiveTopic(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run in Playground</span>
                      </button>
                    )}
                  </div>
                  <CodeBlock
                    language="python"
                    code={activeTopic.codeSnippet}
                    onRunInPlayground={onOpenCodePlayground}
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <a
                href={activeTopic.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:underline"
              >
                <span>View on codecrafters-io/build-your-own-x</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {onAskNovaAboutTopic && (
                <button
                  onClick={() => {
                    onAskNovaAboutTopic(activeTopic);
                    setActiveTopic(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                >
                  Discuss with NOVA AI in Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
