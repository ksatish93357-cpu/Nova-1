import { useState, useMemo } from 'react';
import { Tag, Search, Sparkles } from 'lucide-react';
import { simpleBpeTokenize, cosineSimilarity } from '../../utils/aiMath';

const DEMO_VOCAB = new Map<string, number>([
  ['nova', 1001],
  ['ai', 1002],
  ['neural', 1003],
  ['network', 1004],
  ['machine', 1005],
  ['learning', 1006],
  ['transformer', 1007],
  ['attention', 1008],
  ['model', 1009],
  ['token', 1010],
  ['embedding', 1011],
  ['aur', 1012],
  ['hai', 1013],
  ['hain', 1014],
  ['bahut', 1015],
  ['karna', 1016],
  ['python', 1017],
]);

const SAMPLE_VECTOR_SPACE: { word: string; vector: number[]; category: string }[] = [
  { word: 'Transformer', vector: [0.9, 0.85, 0.1], category: 'AI Architecture' },
  { word: 'Attention', vector: [0.85, 0.9, 0.15], category: 'AI Architecture' },
  { word: 'Neural Net', vector: [0.88, 0.82, 0.12], category: 'AI Architecture' },
  { word: 'Backpropagation', vector: [0.82, 0.78, 0.2], category: 'Optimization' },
  { word: 'Gradient Descent', vector: [0.8, 0.75, 0.25], category: 'Optimization' },
  { word: 'Banana', vector: [0.05, 0.1, 0.92], category: 'Fruit' },
  { word: 'Apple', vector: [0.08, 0.12, 0.95], category: 'Fruit' },
];

export function TokenizerVisualizer() {
  const [inputText, setInputText] = useState(
    'NOVA AI transformer attention model aur neural network bahut powerful hain'
  );
  const [compareWordA, setCompareWordA] = useState('Transformer');
  const [compareWordB, setCompareWordB] = useState('Attention');

  const { tokens, tokenIds } = useMemo(() => {
    return simpleBpeTokenize(inputText, DEMO_VOCAB);
  }, [inputText]);

  // Cosine similarity comparison between two concepts in vector space
  const similarity = useMemo(() => {
    const itemA = SAMPLE_VECTOR_SPACE.find((w) => w.word === compareWordA);
    const itemB = SAMPLE_VECTOR_SPACE.find((w) => w.word === compareWordB);
    if (!itemA || !itemB) return 0;
    return cosineSimilarity(itemA.vector, itemB.vector);
  }, [compareWordA, compareWordB]);

  // Color generator for token pills
  const colors = [
    'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    'bg-purple-500/20 text-purple-300 border-purple-500/40',
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'bg-rose-500/20 text-rose-300 border-rose-500/40',
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            Byte Pair Encoding (BPE) & Vector Embedding Space
          </h3>
          <p className="text-xs text-slate-400">
            Interactive subword tokenization breakdown and high-dimensional semantic cosine similarity.
          </p>
        </div>
      </div>

      {/* Tokenizer Input & Pills */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-300 block">
          Enter Sentence to Tokenize (English, Hindi, or Hinglish):
        </label>
        <textarea
          rows={2}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
        />

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Resulting Tokens ({tokens.length} total tokens):</span>
            <span>Vocabulary Size: ~50,000 in GPT</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {tokens.map((token, i) => {
              const colorClass = colors[i % colors.length];
              return (
                <div
                  key={i}
                  className={`inline-flex flex-col items-center px-2.5 py-1 rounded-lg border text-xs font-mono shadow-sm ${colorClass}`}
                >
                  <span className="font-bold text-white">"{token}"</span>
                  <span className="text-[10px] opacity-75">ID: {tokenIds[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Semantic Cosine Similarity Visualizer */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Semantic Vector Space Cosine Similarity
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Concept A:</label>
            <select
              value={compareWordA}
              onChange={(e) => setCompareWordA(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
            >
              {SAMPLE_VECTOR_SPACE.map((item) => (
                <option key={item.word} value={item.word}>
                  {item.word} ({item.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Concept B:</label>
            <select
              value={compareWordB}
              onChange={(e) => setCompareWordB(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
            >
              {SAMPLE_VECTOR_SPACE.map((item) => (
                <option key={item.word} value={item.word}>
                  {item.word} ({item.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400">Cosine Similarity:</span>
            <span
              className={`text-xl font-bold font-mono my-0.5 ${
                similarity > 0.8
                  ? 'text-emerald-400'
                  : similarity > 0.4
                  ? 'text-cyan-400'
                  : 'text-amber-400'
              }`}
            >
              {similarity.toFixed(4)}
            </span>
            <span className="text-[10px] text-slate-400">
              {similarity > 0.8
                ? 'Strong Semantic Cluster'
                : similarity > 0.4
                ? 'Moderate Association'
                : 'Orthogonal / Unrelated'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
