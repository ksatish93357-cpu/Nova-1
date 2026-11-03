import { useState, useMemo } from 'react';
import { Database, Search, ArrowRight, FileText, CheckCircle } from 'lucide-react';
import { cosineSimilarity } from '../../utils/aiMath';

const KNOWLEDGE_DOCS = [
  {
    id: 'doc-1',
    title: 'NOVA Self-Attention Architecture',
    text: 'Self-attention calculates token interactions using Q, K, and V projections with Softmax(QK^T / sqrt(d_k)). It allows every token in a sentence to attend to all other tokens in parallel.',
    vector: [0.95, 0.88, 0.2, 0.1],
  },
  {
    id: 'doc-2',
    title: 'Backpropagation Calculus',
    text: 'Backpropagation computes the gradient of the loss function with respect to every weight using the chain rule. Weights are then updated via gradient descent: W = W - lr * grad.',
    vector: [0.85, 0.4, 0.9, 0.25],
  },
  {
    id: 'doc-3',
    title: 'Codecrafters Build Your Own Git',
    text: 'Git is a content-addressable storage engine where blobs, trees, and commits are hashed with SHA-1 and stored under .git/objects.',
    vector: [0.1, 0.15, 0.2, 0.95],
  },
  {
    id: 'doc-4',
    title: 'BPE Tokenizer Algorithm',
    text: 'Byte Pair Encoding begins with single characters and iteratively merges the most frequent adjacent byte pairs until a fixed vocabulary size is reached.',
    vector: [0.75, 0.9, 0.3, 0.1],
  },
];

export function RagVisualizer() {
  const [query, setQuery] = useState('How does self-attention work in transformers?');

  // Pseudo-embedding for the query
  const queryVector = useMemo(() => {
    const qLower = query.toLowerCase();
    return [
      qLower.includes('attention') || qLower.includes('transformer') ? 0.9 : 0.2,
      qLower.includes('token') || qLower.includes('model') ? 0.85 : 0.2,
      qLower.includes('backprop') || qLower.includes('loss') ? 0.85 : 0.1,
      qLower.includes('git') || qLower.includes('database') ? 0.9 : 0.1,
    ];
  }, [query]);

  // Ranked documents
  const rankedDocs = useMemo(() => {
    return KNOWLEDGE_DOCS.map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryVector, doc.vector),
    })).sort((a, b) => b.score - a.score);
  }, [queryVector]);

  const topMatch = rankedDocs[0];

  const augmentedPrompt = `[System Instructions]: Answer using ONLY the retrieved context below:

[Retrieved Context #1 - Similarity: ${(topMatch.score * 100).toFixed(1)}%]:
${topMatch.text}

[User Query]:
${query}

[NOVA Grounded Response]:
Based on the retrieved context, ${topMatch.text}`;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            RAG Pipeline: Chunking, Vector Search & Context Injection
          </h3>
          <p className="text-xs text-slate-400">
            Learn how models retrieve factual context from vector databases to eliminate hallucinations.
          </p>
        </div>
      </div>

      {/* Query Bar */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1">
          User Query / Search Term:
        </label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
            placeholder="Search knowledge documents..."
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Document Chunks Matching */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Knowledge Base Chunks (Ranked by Cosine Similarity):</span>
          <span className="text-cyan-400 font-mono text-[11px]">Top-1 Retained</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rankedDocs.map((doc, idx) => {
            const isTop = idx === 0;
            return (
              <div
                key={doc.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isTop
                    ? 'bg-cyan-950/30 border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-bold flex items-center gap-1.5 ${isTop ? 'text-cyan-300' : 'text-slate-300'}`}>
                    <FileText className="w-3.5 h-3.5" />
                    {doc.title}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                      isTop ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {(doc.score * 100).toFixed(1)}% match
                  </span>
                </div>
                <p className="line-clamp-2 text-slate-300 text-[11px] leading-relaxed">
                  {doc.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Augmented Prompt Generation */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
          <ArrowRight className="w-4 h-4 text-indigo-400" />
          <span>Final Augmented Prompt Injected into NOVA AI:</span>
        </div>
        <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {augmentedPrompt}
        </pre>
      </div>
    </div>
  );
}
