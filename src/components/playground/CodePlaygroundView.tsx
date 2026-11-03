import { useState, useEffect } from 'react';
import { Play, Sparkles, Download, Save, Trash2, FolderPlus, Terminal, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { CodeProject } from '../../types';

const STARTER_TEMPLATES: Record<string, { title: string; language: 'python' | 'javascript'; code: string }> = {
  neural_net: {
    title: 'XOR Neural Network (Python)',
    language: 'python',
    code: `import math

# Sigmoid activation and derivative
def sigmoid(x):
    return 1.0 / (1.0 + math.exp(-max(-50, min(50, x))))

def sigmoid_derivative(s):
    return s * (1.0 - s)

# XOR Training Data: X1, X2 -> Y
data = [
    ([0, 0], 0),
    ([0, 1], 1),
    ([1, 0], 1),
    ([1, 1], 0)
]

# Weights initialization
w1 = [0.5, -0.2]
w2 = [-0.3, 0.7]
w_out = [0.6, -0.5]
lr = 0.5

print("Starting 100 training iterations...")
for epoch in range(100):
    for (x1, x2), target in data:
        # Hidden layer forward
        h1 = sigmoid(x1 * w1[0] + x2 * w1[1])
        h2 = sigmoid(x1 * w2[0] + x2 * w2[1])
        
        # Output forward
        y_pred = sigmoid(h1 * w_out[0] + h2 * w_out[1])
        error = target - y_pred
        
        # Backprop
        d_out = error * sigmoid_derivative(y_pred)
        w_out[0] += lr * d_out * h1
        w_out[1] += lr * d_out * h2

print("Training finished successfully! Testing [0, 1] XOR prediction:")
h1 = sigmoid(0 * w1[0] + 1 * w1[1])
h2 = sigmoid(0 * w2[0] + 1 * w2[1])
pred = sigmoid(h1 * w_out[0] + h2 * w_out[1])
print(f"Prediction for [0, 1]: {pred:.4f} (Target is 1.0)")
`,
  },
  attention: {
    title: 'Scaled Dot-Product Attention (JavaScript)',
    language: 'javascript',
    code: `// Scaled Dot-Product Attention in JavaScript
function dotProduct(a, b) {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

// 3 tokens, 2-dimensional embeddings
const tokens = ["NOVA", "Builds", "Intelligence"];
const Q = [[1.2, 0.5], [0.8, 1.4], [1.5, 0.2]];
const K = [[1.0, 0.4], [0.9, 1.2], [1.4, 0.3]];
const V = [[5.0, 1.0], [2.0, 4.0], [6.0, 2.0]];

const d_k = 2;
const scale = Math.sqrt(d_k);

console.log("=== NOVA AI Scaled Dot-Product Attention ===");
tokens.forEach((qToken, i) => {
  const scores = K.map(kVec => dotProduct(Q[i], kVec) / scale);
  const weights = softmax(scores);
  console.log(\`Token "\${qToken}" attention weights:\`, weights.map(w => (w * 100).toFixed(1) + "%"));
});
`,
  },
  bpe: {
    title: 'Byte Pair Tokenizer (Python)',
    language: 'python',
    code: `import collections

# Educational BPE merge count
text = "low lower newest widest lowest"
words = [list(w) + ['</w>'] for w in text.split()]

print("Initial tokenized words:", words[:3])

pairs = collections.defaultdict(int)
for word in words:
    for i in range(len(word) - 1):
        pairs[(word[i], word[i+1])] += 1

best_pair = max(pairs, key=pairs.get)
print(f"Most frequent byte pair to merge: {best_pair} (Count: {pairs[best_pair]})")
`,
  },
};

interface CodePlaygroundViewProps {
  initialCode?: string;
  initialLanguage?: 'python' | 'javascript';
  onAskNova?: (prompt: string) => void;
}

export function CodePlaygroundView({ initialCode, initialLanguage = 'python', onAskNova }: CodePlaygroundViewProps) {
  const [code, setCode] = useState(initialCode || STARTER_TEMPLATES.neural_net.code);
  const [language, setLanguage] = useState<'python' | 'javascript'>(initialLanguage);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('Press "Run Code" to execute in the secure sandbox.');
  const [isError, setIsError] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Projects persistence
  const [projects, setProjects] = useState<CodeProject[]>(() => {
    try {
      const saved = localStorage.getItem('nova_ai_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'proj-1',
        title: 'XOR Neural Network',
        language: 'python',
        code: STARTER_TEMPLATES.neural_net.code,
        description: 'Two-layer Perceptron for XOR logic boundary',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>('proj-1');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      if (initialLanguage) setLanguage(initialLanguage);
    }
  }, [initialCode, initialLanguage]);

  const runCode = async () => {
    setIsRunning(true);
    setIsError(false);
    setOutput('Executing code in secure sandbox...');

    try {
      const response = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setIsError(true);
        setOutput(data.error || data.output || 'Execution failed');
      } else {
        setIsError(false);
        setOutput(data.output || '(No stdout returned)');
      }
      setExecutionTime(data.executionTimeMs ?? 0);
    } catch (err: any) {
      setIsError(true);
      setOutput(`Network/Backend execution error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveProject = () => {
    const existing = projects.find((p) => p.id === activeProjectId);
    let updated: CodeProject[];

    if (existing) {
      updated = projects.map((p) =>
        p.id === activeProjectId ? { ...p, code, language, updatedAt: Date.now() } : p
      );
    } else {
      const newProj: CodeProject = {
        id: 'proj-' + Date.now(),
        title: `Project ${projects.length + 1} (${language})`,
        language,
        code,
        description: 'Custom coding experiment',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updated = [newProj, ...projects];
      setActiveProjectId(newProj.id);
    }

    setProjects(updated);
    try {
      localStorage.setItem('nova_ai_projects', JSON.stringify(updated));
    } catch (e) {}

    setSaveStatus('Project saved!');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleDownload = () => {
    const ext = language === 'python' ? 'py' : 'js';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova_${language}_script.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExplainError = () => {
    if (!onAskNova) return;
    const prompt = `Here is my ${language} code that encountered an error:
\`\`\`${language}
${code}
\`\`\`

The error/output received:
\`\`\`
${output}
\`\`\`

Please explain what caused this error and show the exact corrected code.`;
    onAskNova(prompt);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Playground Top Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white text-sm">NOVA Code Playground</span>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript (ES2024)</option>
          </select>

          {/* Quick template loader */}
          <select
            onChange={(e) => {
              const tmpl = STARTER_TEMPLATES[e.target.value];
              if (tmpl) {
                setCode(tmpl.code);
                setLanguage(tmpl.language);
              }
            }}
            defaultValue=""
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="" disabled>Load AI/ML Template...</option>
            <option value="neural_net">XOR Neural Network (Python)</option>
            <option value="attention">Scaled Dot-Product Attention (JS)</option>
            <option value="bpe">Byte Pair Tokenizer (Python)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          )}

          <button
            onClick={handleSaveProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Save Project"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Download script"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Editor and Output */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left: Code Editor */}
        <div className="flex flex-col border-r border-slate-800 h-full overflow-hidden bg-slate-950">
          <div className="px-4 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Source Code ({language.toUpperCase()})</span>
            <span>UTF-8</span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-cyan-900 selection:text-cyan-200 border-none"
            placeholder="Write or paste your code here..."
          />
        </div>

        {/* Right: Terminal Console Output */}
        <div className="flex flex-col h-full bg-slate-900/40 overflow-hidden">
          <div className="px-4 py-1.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isError ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
              Execution Terminal
            </span>
            {executionTime !== null && <span>Elapsed: {executionTime}ms</span>}
          </div>

          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-slate-950/80 leading-relaxed">
            {isError ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-rose-400 bg-rose-950/30 p-3 rounded-lg border border-rose-500/30">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <pre className="whitespace-pre-wrap font-mono text-xs">{output}</pre>
                </div>

                {onAskNova && (
                  <button
                    onClick={handleExplainError}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Explain Error & Suggest Fix with NOVA AI</span>
                  </button>
                )}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-emerald-300">{output}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
