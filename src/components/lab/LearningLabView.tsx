import { useState } from 'react';
import { LEARNING_MODULES } from '../../data/learningModules';
import { NeuralNetVisualizer } from './NeuralNetVisualizer';
import { AttentionVisualizer } from './AttentionVisualizer';
import { TokenizerVisualizer } from './TokenizerVisualizer';
import { TrainingLab } from './TrainingLab';
import { RagVisualizer } from './RagVisualizer';
import { CodeBlock } from '../../utils/markdownRenderer';
import {
  BookOpen,
  CheckCircle,
  Play,
  Layers,
  Cpu,
  Brain,
  Sparkles,
  Database,
  ArrowRight,
  Code2,
} from 'lucide-react';

interface LearningLabViewProps {
  onOpenCodePlayground?: (code: string, language: string) => void;
}

export function LearningLabView({ onOpenCodePlayground }: LearningLabViewProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('neural-networks-backprop');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'foundations' | 'neural_nets' | 'llm' | 'advanced'>('all');

  const selectedModule = LEARNING_MODULES.find((m) => m.id === selectedModuleId) || LEARNING_MODULES[0];

  const filteredModules = LEARNING_MODULES.filter((m) => {
    if (activeTabFilter === 'all') return true;
    return m.category === activeTabFilter;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-950 p-4 sm:p-6 text-slate-100">
      {/* Header Banner */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Self-Learning AI Platform
              </span>
              <span className="text-xs text-slate-500">• Inspired by codecrafters-io/build-your-own-x</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Brain className="w-6 h-6 text-cyan-400" />
              NOVA AI Development & Learning Lab
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Hands-on interactive simulators, mathematical calculus graphs, and real small-model training loops.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'foundations', 'neural_nets', 'llm', 'advanced'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTabFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  activeTabFilter === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat === 'all' ? 'All Modules' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Modules Directory Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Modules ({filteredModules.length})</span>
            <span className="text-[11px] text-cyan-400 font-mono">Interactive</span>
          </div>

          <div className="space-y-2.5">
            {filteredModules.map((module) => {
              const isSelected = module.id === selectedModuleId;
              return (
                <button
                  key={module.id}
                  onClick={() => setSelectedModuleId(module.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/60 ring-1 ring-cyan-500/30 shadow-lg'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                        module.difficulty === 'Beginner'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : module.difficulty === 'Intermediate'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {module.difficulty}
                    </span>
                    <span className="text-[11px] text-slate-500">{module.duration}</span>
                  </div>

                  <h3
                    className={`text-sm font-bold ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {module.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1">{module.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Module Detail & Interactive Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {/* Module Banner */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-cyan-400">
                MODULE #{LEARNING_MODULES.findIndex((m) => m.id === selectedModule.id) + 1}
              </span>
              <span className="text-xs text-slate-400">Duration: {selectedModule.duration}</span>
            </div>

            <h2 className="text-xl font-black text-white">{selectedModule.title}</h2>
            <p className="text-xs font-medium text-cyan-300/90 mt-0.5">{selectedModule.subtitle}</p>

            <p className="text-xs text-slate-300 leading-relaxed mt-3 pt-3 border-t border-slate-800/80">
              {selectedModule.description}
            </p>

            {/* Key Concepts Checklist */}
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Core Architectural Concepts:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedModule.keyConcepts.map((concept, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{concept}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Simulator Section based on selected module */}
          {selectedModule.id === 'neural-networks-backprop' && <NeuralNetVisualizer />}
          {selectedModule.id === 'transformers-self-attention' && <AttentionVisualizer />}
          {selectedModule.id === 'tokenizers-embeddings' && <TokenizerVisualizer />}
          {selectedModule.id === 'model-training-testing-lab' && <TrainingLab />}
          {selectedModule.id === 'rag-knowledge-bases' && <RagVisualizer />}
          {selectedModule.id === 'python-ml-basics' && <NeuralNetVisualizer />}
          {selectedModule.id === 'mini-llm-scratch' && <AttentionVisualizer />}

          {/* Code Implementation Snippet */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Python Implementation Reference
              </h3>
              {onOpenCodePlayground && (
                <button
                  onClick={() => onOpenCodePlayground(selectedModule.codeSnippet, 'python')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Open in Playground</span>
                </button>
              )}
            </div>

            <CodeBlock
              language="python"
              code={selectedModule.codeSnippet}
              onRunInPlayground={onOpenCodePlayground}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
