import { useState, useEffect } from 'react';
import { Cpu, Key, Check, ShieldCheck, AlertCircle, X, Sparkles, ExternalLink, Trash2, Lock } from 'lucide-react';

interface KeyStatus {
  hasGemini: boolean;
  hasGroq: boolean;
  hasOpenAI: boolean;
  isEnvGeminiAvailable: boolean;
}

interface ModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  sessionId: string;
}

export function ModelManagerModal({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
  sessionId,
}: ModelManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'models' | 'keys'>('models');
  const [keyStatus, setKeyStatus] = useState<KeyStatus>({
    hasGemini: false,
    hasGroq: false,
    hasOpenAI: false,
    isEnvGeminiAvailable: false,
  });

  const [geminiInput, setGeminiInput] = useState('');
  const [groqInput, setGroqInput] = useState('');
  const [openaiInput, setOpenaiInput] = useState('');

  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen, sessionId]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/keys/status', {
        headers: { 'x-session-id': sessionId },
      });
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data);
      }
    } catch (e) {}
  };

  if (!isOpen) return null;

  const handleTestAndSaveKey = async (provider: string, rawKey: string) => {
    if (!rawKey.trim()) return;
    setTestingProvider(provider);
    setTestResult(null);

    try {
      // 1. Verify key on provider
      const testRes = await fetch('/api/models/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ provider, apiKey: rawKey }),
      });
      const testData = await testRes.json();

      if (!testRes.ok || !testData.valid) {
        setTestResult({
          provider,
          success: false,
          msg: testData.error || 'Provider key validation failed.',
        });
        return;
      }

      // 2. Save directly into backend session vault
      const saveRes = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ provider, apiKey: rawKey }),
      });

      if (saveRes.ok) {
        const saveData = await saveRes.json();
        setKeyStatus(saveData.status);
        setTestResult({
          provider,
          success: true,
          msg: `${provider.toUpperCase()} key verified & securely stored in server session vault!`,
        });
        // Clear input to prevent holding raw keys in memory
        if (provider === 'gemini') setGeminiInput('');
        if (provider === 'groq') setGroqInput('');
        if (provider === 'openai') setOpenaiInput('');
      } else {
        const saveErr = await saveRes.json();
        setTestResult({ provider, success: false, msg: saveErr.error || 'Failed to save key' });
      }
    } catch (err: any) {
      setTestResult({ provider, success: false, msg: err.message });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleDeleteKey = async (provider: string) => {
    try {
      const res = await fetch(`/api/keys/${provider}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sessionId },
      });
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data.status);
        setTestResult({
          provider,
          success: true,
          msg: `${provider.toUpperCase()} key removed from server vault.`,
        });
      }
    } catch (err: any) {
      setTestResult({ provider, success: false, msg: err.message });
    }
  };

  const MODELS_CATALOG = [
    {
      id: 'auto',
      name: 'NOVA Auto-Routing (Smart Intent)',
      provider: 'nova',
      description: 'Dynamically selects the optimal model depending on whether you are querying code, deep math, or rapid conversational responses.',
      context: '1M Tokens',
      tag: 'Recommended',
      badgeClass: 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border-cyan-500/40',
      active: true,
    },
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      provider: 'gemini',
      description: 'Built-in flagship model with advanced reasoning, coding capabilities, and multimodal vision.',
      context: '1M Tokens',
      tag: keyStatus.hasGemini || keyStatus.isEnvGeminiAvailable ? 'Ready' : 'Requires Key',
      badgeClass: keyStatus.hasGemini || keyStatus.isEnvGeminiAvailable
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        : 'bg-slate-800 text-slate-400 border-slate-700',
      active: keyStatus.hasGemini || keyStatus.isEnvGeminiAvailable,
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite',
      provider: 'gemini',
      description: 'High-speed, low-latency intelligence for instant answers and quick explanations.',
      context: '1M Tokens',
      tag: 'Ultra Fast',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      active: keyStatus.hasGemini || keyStatus.isEnvGeminiAvailable,
    },
    {
      id: 'gemini-4-argon',
      name: 'Gemini 4 Argon',
      provider: 'gemini',
      description: 'Frontier reasoning powerhouse for deep calculus, machine learning architecture, and research.',
      context: '2M Tokens',
      tag: 'Advanced STEM',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      active: keyStatus.hasGemini || keyStatus.isEnvGeminiAvailable,
    },
    {
      id: 'groq-llama-3.3-70b',
      name: 'Groq Llama 3.3 70B',
      provider: 'groq',
      description: 'Open-weights frontier LLM running at 500+ tokens/sec on specialized LPUs.',
      context: '128K Tokens',
      tag: keyStatus.hasGroq ? 'Active' : 'Key Required',
      badgeClass: keyStatus.hasGroq
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        : 'bg-slate-800 text-slate-500 border-slate-700',
      active: keyStatus.hasGroq,
    },
    {
      id: 'openai-gpt-4o',
      name: 'OpenAI GPT-4o',
      provider: 'openai',
      description: 'Multimodal omni model from OpenAI with broad reasoning skills.',
      context: '128K Tokens',
      tag: keyStatus.hasOpenAI ? 'Active' : 'Key Required',
      badgeClass: keyStatus.hasOpenAI
        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
        : 'bg-slate-800 text-slate-500 border-slate-700',
      active: keyStatus.hasOpenAI,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Model & API Key Manager
              </h2>
              <p className="text-xs text-slate-400">
                Configure models, auto-routing, and backend-secured provider credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Model Manager Modal"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('models')}
            className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
              activeTab === 'models'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Active Models Catalog
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`text-xs font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'keys'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Backend Key Vault</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'models' ? (
            <div className="space-y-3">
              {MODELS_CATALOG.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectModel(m.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-500/80 ring-1 ring-cyan-500/40 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{m.name}</span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${m.badgeClass}`}
                        >
                          {m.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">{m.context}</span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                            <Check className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-200/90 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Zero-Client-Storage Security Policy</strong>
                  API keys are stored exclusively in the backend server vault associated with your session ID (<code className="font-mono text-cyan-300">{sessionId.slice(0, 12)}...</code>). Raw keys are never stored in browser localStorage or sent to client-side scripts.
                </div>
              </div>

              {/* Gemini Custom Key */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">Google Gemini API Key</label>
                  {keyStatus.hasGemini ? (
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Key Stored in Vault
                    </span>
                  ) : keyStatus.isEnvGeminiAvailable ? (
                    <span className="text-[11px] text-cyan-400 font-mono">Server Environment Key Active</span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">Not Configured</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={geminiInput}
                    onChange={(e) => setGeminiInput(e.target.value)}
                    placeholder="Enter AI Studio key (AIzaSy...)..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => handleTestAndSaveKey('gemini', geminiInput)}
                    disabled={testingProvider === 'gemini' || !geminiInput}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs whitespace-nowrap"
                  >
                    {testingProvider === 'gemini' ? 'Testing...' : 'Verify & Vault'}
                  </button>
                  {keyStatus.hasGemini && (
                    <button
                      onClick={() => handleDeleteKey('gemini')}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60"
                      title="Remove key from vault"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Groq Custom Key */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">Groq API Key (Llama 3.3 / Mixtral)</label>
                  <div className="flex items-center gap-2">
                    {keyStatus.hasGroq ? (
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Key Stored in Vault
                      </span>
                    ) : (
                      <a
                        href="https://console.groq.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <span>Get Free Key</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={groqInput}
                    onChange={(e) => setGroqInput(e.target.value)}
                    placeholder="gsk_..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => handleTestAndSaveKey('groq', groqInput)}
                    disabled={testingProvider === 'groq' || !groqInput}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs whitespace-nowrap"
                  >
                    {testingProvider === 'groq' ? 'Testing...' : 'Verify & Vault'}
                  </button>
                  {keyStatus.hasGroq && (
                    <button
                      onClick={() => handleDeleteKey('groq')}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60"
                      title="Remove key from vault"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* OpenAI Custom Key */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">OpenAI API Key (GPT-4o / DALL-E 3)</label>
                  <div className="flex items-center gap-2">
                    {keyStatus.hasOpenAI ? (
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Key Stored in Vault
                      </span>
                    ) : (
                      <a
                        href="https://platform.openai.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <span>Get Key</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={openaiInput}
                    onChange={(e) => setOpenaiInput(e.target.value)}
                    placeholder="sk-proj-..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => handleTestAndSaveKey('openai', openaiInput)}
                    disabled={testingProvider === 'openai' || !openaiInput}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs whitespace-nowrap"
                  >
                    {testingProvider === 'openai' ? 'Testing...' : 'Verify & Vault'}
                  </button>
                  {keyStatus.hasOpenAI && (
                    <button
                      onClick={() => handleDeleteKey('openai')}
                      className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60"
                      title="Remove key from vault"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{testResult.msg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
