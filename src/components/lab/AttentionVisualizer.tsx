import { useState, useMemo } from 'react';
import { computeAttentionScores } from '../../utils/aiMath';
import { Cpu, RefreshCw, Info } from 'lucide-react';

export function AttentionVisualizer() {
  const [tokensInput, setTokensInput] = useState('NOVA AI understands attention');
  const [selectedCell, setSelectedCell] = useState<{ i: number; j: number } | null>(null);

  const tokens = useMemo(() => {
    const list = tokensInput.trim().split(/\s+/).filter(Boolean);
    return list.slice(0, 6); // Max 6 tokens for clean matrix rendering
  }, [tokensInput]);

  // Generate deterministic pseudo-embeddings for Query and Key based on token characters
  const { Q, K, V } = useMemo(() => {
    const d_k = 4; // 4-dimensional embedding
    const qMat: number[][] = [];
    const kMat: number[][] = [];
    const vMat: number[][] = [];

    tokens.forEach((token, idx) => {
      // Deterministic hash based on characters
      const seed1 = token.charCodeAt(0) || 1;
      const seed2 = token.charCodeAt(token.length - 1) || 2;
      
      qMat.push([
        Math.sin(seed1 * 0.7 + idx) * 1.5,
        Math.cos(seed2 * 0.5 + idx) * 1.5,
        Math.sin((seed1 + seed2) * 0.3) * 1.5,
        Math.cos(seed1 * 0.2) * 1.5,
      ]);

      kMat.push([
        Math.sin(seed1 * 0.6 + idx) * 1.5,
        Math.cos(seed2 * 0.6 + idx) * 1.5,
        Math.sin((seed1 + seed2) * 0.4) * 1.5,
        Math.cos(seed1 * 0.3) * 1.5,
      ]);

      vMat.push([
        Math.abs(Math.sin(seed1)) * 2,
        Math.abs(Math.cos(seed2)) * 2,
        Math.abs(Math.sin(idx)) * 2,
        Math.abs(Math.cos(idx)) * 2,
      ]);
    });

    return { Q: qMat, K: kMat, V: vMat };
  }, [tokens]);

  const attentionMatrix = useMemo(() => {
    return computeAttentionScores(Q, K);
  }, [Q, K]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Transformer Scaled Dot-Product Attention Heatmap
          </h3>
          <p className="text-xs text-slate-400">
            Formula: Attention(Q, K, V) = Softmax( (Q · Kᵀ) / √dₖ ) · V
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tokensInput}
            onChange={(e) => setTokensInput(e.target.value)}
            placeholder="Enter 3-5 words..."
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-56"
          />
          <button
            onClick={() => setTokensInput('NOVA AI understands attention')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            title="Reset Tokens"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="flex flex-col items-center my-4 overflow-x-auto">
        <div className="inline-block p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-center text-xs font-mono text-indigo-300 font-semibold mb-3">
            Keys (K) → Tokens being attended to
          </div>

          <div className="grid" style={{ gridTemplateColumns: `auto repeat(${tokens.length}, minmax(64px, 1fr))` }}>
            {/* Top row header: Keys */}
            <div className="p-2 text-xs font-mono text-slate-400 text-right pr-3 font-semibold">
              Query (Q) ↓
            </div>
            {tokens.map((token, j) => (
              <div
                key={`col-${j}`}
                className="p-2 text-center font-mono text-xs font-bold text-cyan-300 truncate"
                title={token}
              >
                {token}
              </div>
            ))}

            {/* Rows: Queries */}
            {tokens.map((qToken, i) => (
              <div key={`row-${i}`} className="contents">
                <div className="p-2 font-mono text-xs font-bold text-indigo-300 flex items-center justify-end pr-3 truncate">
                  {qToken}
                </div>
                {tokens.map((_kToken, j) => {
                  const score = attentionMatrix[i]?.[j] ?? 0;
                  const isSelected = selectedCell?.i === i && selectedCell?.j === j;
                  // Color intensity based on score (0 to 1)
                  const alpha = Math.min(1, Math.max(0.08, score));

                  return (
                    <button
                      key={`cell-${i}-${j}`}
                      onClick={() => setSelectedCell({ i, j })}
                      style={{
                        backgroundColor: `rgba(99, 102, 241, ${alpha})`,
                      }}
                      className={`m-1 p-3 rounded-lg border transition-all text-center flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105 z-10'
                          : 'border-slate-800/80 hover:border-indigo-400/60'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold text-white drop-shadow">
                        {score.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-cyan-200/80 font-mono">
                        {(score * 100).toFixed(0)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Cell Inspection */}
      {selectedCell && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-indigo-500/30 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">
              Attention Detail ({tokens[selectedCell.i]} attends to {tokens[selectedCell.j]}):
            </span>
            <p className="mt-1">
              Query vector for <code className="text-cyan-300">"{tokens[selectedCell.i]}"</code> dot-producted with Key vector for <code className="text-indigo-300">"{tokens[selectedCell.j]}"</code> divided by √dₖ (√4 = 2.0).
              After Softmax normalization across row {selectedCell.i + 1}, this token receives{' '}
              <strong className="text-emerald-400">
                {((attentionMatrix[selectedCell.i]?.[selectedCell.j] ?? 0) * 100).toFixed(1)}%
              </strong>{' '}
              of the attention weight.
            </p>
          </div>
        </div>
      )}

      {/* Legend & Concept Note */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Attention Intensity:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-indigo-950 border border-slate-700"></span>
            <span className="text-[11px]">0.0</span>
            <span className="w-8 h-2 rounded bg-gradient-to-r from-indigo-950 via-indigo-600 to-indigo-400 mx-1"></span>
            <span className="w-3 h-3 rounded bg-indigo-500"></span>
            <span className="text-[11px]">1.0</span>
          </div>
        </div>
        <div className="text-slate-500 font-mono text-[11px]">
          Multi-Head Attention: In full GPT-4, 32 or 96 heads run this in parallel.
        </div>
      </div>
    </div>
  );
}
