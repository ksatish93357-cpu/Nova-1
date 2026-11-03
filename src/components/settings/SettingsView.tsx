import { useState, useEffect } from 'react';
import { LanguageMode } from '../../types';
import { MemoryItem } from '../../utils/memoryManager';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import {
  Settings,
  Key,
  Brain,
  Smartphone,
  Download,
  Upload,
  ExternalLink,
  Languages,
  Trash2,
  Lock,
} from 'lucide-react';

interface KeyStatus {
  hasGemini: boolean;
  hasGroq: boolean;
  hasOpenAI: boolean;
  isEnvGeminiAvailable: boolean;
}

interface SettingsViewProps {
  languageMode: LanguageMode;
  onChangeLanguageMode: (mode: LanguageMode) => void;
  selectedModel: string;
  onOpenModelModal: () => void;
  memories: MemoryItem[];
  memoryEnabled: boolean;
  onOpenMemoryModal: () => void;
  onExportAllData: () => void;
  onImportData: (dataJson: string) => void;
  sessionId: string;
  onOpenNativeTools?: () => void;
}

export function SettingsView({
  languageMode,
  onChangeLanguageMode,
  selectedModel,
  onOpenModelModal,
  memories,
  memoryEnabled,
  onOpenMemoryModal,
  onExportAllData,
  onImportData,
  sessionId,
  onOpenNativeTools,
}: SettingsViewProps) {
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [openaiKeyInput, setOpenaiKeyInput] = useState('');
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const [keyStatus, setKeyStatus] = useState<KeyStatus>({
    hasGemini: false,
    hasGroq: false,
    hasOpenAI: false,
    isEnvGeminiAvailable: false,
  });

  useEffect(() => {
    fetchKeyStatus();
  }, [sessionId]);

  const fetchKeyStatus = async () => {
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

  const handleTestAndSaveKey = async (provider: string, keyVal: string) => {
    if (!keyVal.trim()) return;
    setTestStatus(`Validating ${provider} key on secure backend...`);

    try {
      const testRes = await fetch('/api/models/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ provider, apiKey: keyVal }),
      });
      const testData = await testRes.json();

      if (!testRes.ok || !testData.valid) {
        setTestStatus(`✗ Validation error: ${testData.error || 'Invalid key'}`);
        return;
      }

      // Save in server session vault
      const saveRes = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ provider, apiKey: keyVal }),
      });

      if (saveRes.ok) {
        const saveData = await saveRes.json();
        setKeyStatus(saveData.status);
        setTestStatus(`✓ ${provider.toUpperCase()} key securely vaulted on server!`);
        if (provider === 'groq') setGroqKeyInput('');
        if (provider === 'openai') setOpenaiKeyInput('');
      } else {
        setTestStatus(`✗ Failed to store key in backend vault`);
      }
    } catch (err: any) {
      setTestStatus(`✗ Network error: ${err.message}`);
    }
    setTimeout(() => setTestStatus(null), 5000);
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
        setTestStatus(`✓ ${provider.toUpperCase()} key cleared from session vault.`);
      }
    } catch (err: any) {
      setTestStatus(`✗ Error clearing key: ${err.message}`);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onImportData(text);
        alert('Data imported successfully!');
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-800">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            NOVA AI System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure conversational language, models, backend-vaulted API keys, personal memory, and Android PWA deployment.
          </p>
        </div>

        {/* 1. Conversational Language Preferences */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Languages className="w-4 h-4 text-cyan-400" />
            Default Language Mode
          </h3>
          <p className="text-xs text-slate-400">
            NOVA AI understands and replies fluently in Hindi (Devanagari), English, and natural Indian tech Hinglish.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {(['auto', 'hinglish', 'english', 'hindi'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onChangeLanguageMode(mode)}
                className={`p-3 rounded-xl border text-xs text-left capitalize transition-all ${
                  languageMode === mode
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-950/80'
                }`}
              >
                <div className="font-semibold text-white">{mode}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {mode === 'auto'
                    ? 'Dynamic Match'
                    : mode === 'hinglish'
                    ? 'Conversational Romanized'
                    : mode === 'hindi'
                    ? 'हिंदी लिपि'
                    : 'Standard English'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Model Selection & Backend-Vaulted API Keys */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              AI Model Providers & Backend Session Vault
            </h3>
            <button
              onClick={onOpenModelModal}
              className="text-xs text-cyan-400 hover:underline font-mono"
            >
              Open Model Catalog
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Current Active Model: <strong className="text-white font-mono">{selectedModel}</strong>.
            Session Vault ID: <code className="text-cyan-300 font-mono">{sessionId.slice(0, 14)}...</code>
          </p>

          {testStatus && (
            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
              {testStatus}
            </div>
          )}

          <div className="space-y-3 pt-1">
            {/* Groq Key */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Groq API Key (Llama 3.3 70B)
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {keyStatus.hasGroq ? '✓ Vaulted in Session' : 'Not Configured'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={groqKeyInput}
                  onChange={(e) => setGroqKeyInput(e.target.value)}
                  placeholder="gsk_..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => handleTestAndSaveKey('groq', groqKeyInput)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium whitespace-nowrap"
                >
                  Verify & Vault
                </button>
                {keyStatus.hasGroq && (
                  <button
                    onClick={() => handleDeleteKey('groq')}
                    className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60"
                    title="Remove from vault"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* OpenAI Key */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  OpenAI API Key (GPT-4o & DALL-E 3)
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {keyStatus.hasOpenAI ? '✓ Vaulted in Session' : 'Not Configured'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={openaiKeyInput}
                  onChange={(e) => setOpenaiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => handleTestAndSaveKey('openai', openaiKeyInput)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium whitespace-nowrap"
                >
                  Verify & Vault
                </button>
                {keyStatus.hasOpenAI && (
                  <button
                    onClick={() => handleDeleteKey('openai')}
                    className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60"
                    title="Remove from vault"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Personal AI Memory */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              Personal AI Memory Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Status: {memoryEnabled ? `${memories.filter((m) => m.enabled).length} active memories stored` : 'Disabled'}.
            </p>
          </div>
          <button
            onClick={onOpenMemoryModal}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold transition-colors self-start sm:self-auto"
          >
            Manage Memory
          </button>
        </div>

        {/* 4. Android APK & PWA Readiness */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Android APK & Progressive Web App (PWA) Architecture
            </h3>
            <div className="flex items-center gap-2">
              <PWAInstallButton showAlways={true} />
              {onOpenNativeTools && (
                <button
                  onClick={onOpenNativeTools}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors"
                >
                  Device Hardware Bridge
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            NOVA AI is built with responsive mobile viewports, web manifest configuration (<code className="text-cyan-300 font-mono">/manifest.json</code>), service worker (<code className="text-cyan-300 font-mono">/sw.js</code>), standalone display mode, and Capacitor Android architecture (<code className="text-cyan-300 font-mono">capacitor.config.json</code>).
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              ✓ manifest.json active
            </span>
            <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
              ✓ Service Worker Caching (/sw.js)
            </span>
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono">
              ✓ Capacitor Android Ready
            </span>
          </div>
        </div>

        {/* 5. Data Export & Backup */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Backup & Data Portability</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export all conversation history, code projects, and memory as JSON.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportAllData}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>

            <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Data</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
