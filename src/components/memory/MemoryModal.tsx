import { useState } from 'react';
import { MemoryItem } from '../../utils/memoryManager';
import { Brain, Plus, Trash2, Edit3, Check, X, Shield, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  memoryEnabled: boolean;
  onToggleMemoryEnabled: (enabled: boolean) => void;
  onAddMemory: (category: MemoryItem['category'], content: string, importance: MemoryItem['importance']) => void;
  onUpdateMemory: (id: string, content: string, importance: MemoryItem['importance']) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemory: () => void;
}

export function MemoryModal({
  isOpen,
  onClose,
  memories,
  memoryEnabled,
  onToggleMemoryEnabled,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onClearAllMemory,
}: MemoryModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference');
  const [newImportance, setNewImportance] = useState<MemoryItem['importance']>('high');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImportance, setEditImportance] = useState<MemoryItem['importance']>('high');

  if (!isOpen) return null;

  const handleSaveNew = () => {
    if (!newContent.trim()) return;
    onAddMemory(newCategory, newContent.trim(), newImportance);
    setNewContent('');
    setIsAdding(false);
  };

  const handleStartEdit = (item: MemoryItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
    setEditImportance(item.importance);
  };

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) return;
    onUpdateMemory(id, editContent.trim(), editImportance);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                NOVA AI Long-Term Memory
              </h2>
              <p className="text-xs text-slate-400">
                Personal context, language habits, and learning profile injected into chat responses.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Memory Modal"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Toggle & Stats */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">AI Personal Memory:</span>
            <button
              onClick={() => onToggleMemoryEnabled(!memoryEnabled)}
              className="flex items-center gap-1.5 text-xs font-bold font-mono"
            >
              {memoryEnabled ? (
                <>
                  <ToggleRight className="w-6 h-6 text-cyan-400" />
                  <span className="text-cyan-400">ENABLED</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-6 h-6 text-slate-500" />
                  <span className="text-slate-500">DISABLED</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Memory</span>
            </button>
            {memories.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all personal memories?')) {
                    onClearAllMemory();
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-950/30 text-rose-400 hover:bg-rose-900/40 border border-rose-800/40 text-xs transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Add Memory Form */}
        {isAdding && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300">New Memory Entry</span>
              <button
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
            <textarea
              rows={2}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. User prefers explanations in Hinglish with Python code..."
              className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
            />
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="preference">Preference</option>
                  <option value="skill">Skill Level</option>
                  <option value="project">Project Context</option>
                  <option value="custom">Custom</option>
                </select>
                <select
                  value={newImportance}
                  onChange={(e) => setNewImportance(e.target.value as any)}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              <button
                onClick={handleSaveNew}
                className="px-3.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                Save to Memory
              </button>
            </div>
          </div>
        )}

        {/* Memory List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {memories.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-400" />
              No memories saved yet. Click "Add Memory" or chat with NOVA AI to build context.
            </div>
          ) : (
            memories.map((mem) => {
              const isEditing = editingId === mem.id;
              return (
                <div
                  key={mem.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col gap-2"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                      />
                      <div className="flex items-center justify-between">
                        <select
                          value={editImportance}
                          onChange={(e) => setEditImportance(e.target.value as any)}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300"
                        >
                          <option value="high">High Priority</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(mem.id)}
                            className="p-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                            {mem.category}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              mem.importance === 'high'
                                ? 'bg-amber-950/40 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {mem.importance}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(mem)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteMemory(mem.id)}
                            className="p-1 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{mem.content}</p>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Security & Architecture Note */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Memory is stored safely on your client and processed securely on backend endpoints.
          </span>
        </div>
      </div>
    </div>
  );
}
