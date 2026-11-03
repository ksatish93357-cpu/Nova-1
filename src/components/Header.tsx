import { AppTab } from '../types';
import { Menu, Sparkles, Brain, Terminal, Compass, Settings, MessageSquare } from 'lucide-react';
import { PWAInstallButton } from './pwa/PWAInstallButton';

interface HeaderProps {
  currentTab: AppTab;
  onOpenMobileMenu: () => void;
  selectedModel: string;
  onOpenModelModal: () => void;
  onOpenMemoryModal: () => void;
  memoryEnabled: boolean;
  activeMemoriesCount: number;
}

export function Header({
  currentTab,
  onOpenMobileMenu,
  selectedModel,
  onOpenModelModal,
  onOpenMemoryModal,
  memoryEnabled,
  activeMemoriesCount,
}: HeaderProps) {
  const getTabInfo = () => {
    switch (currentTab) {
      case 'chat':
        return { title: 'AI Chat Assistant', icon: MessageSquare, desc: 'Conversational Intelligence & Coding' };
      case 'lab':
        return { title: 'AI Learning Lab', icon: Brain, desc: 'Interactive Neural Networks & Mini LLMs' };
      case 'playground':
        return { title: 'Code Playground', icon: Terminal, desc: 'Sandboxed Python & JavaScript Runner' };
      case 'knowledge':
        return { title: 'Knowledge Explorer', icon: Compass, desc: 'codecrafters-io/build-your-own-x' };
      case 'settings':
        return { title: 'Settings & Security', icon: Settings, desc: 'Models, API Keys & Preferences' };
    }
  };

  const tabInfo = getTabInfo();
  const Icon = tabInfo.icon;

  return (
    <header className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hidden sm:block">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              {tabInfo.title}
              <span className="hidden md:inline-block text-[11px] font-normal text-slate-400">
                — {tabInfo.desc}
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <PWAInstallButton />

        <button
          onClick={onOpenModelModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 font-mono text-[11px] border border-slate-700/60 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="truncate max-w-[120px] font-semibold">{selectedModel}</span>
        </button>

        <button
          onClick={onOpenMemoryModal}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
            memoryEnabled && activeMemoriesCount > 0
              ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400'
          }`}
        >
          <Brain className="w-3 h-3" />
          <span>{memoryEnabled ? `${activeMemoriesCount} Mem` : 'Memory Off'}</span>
        </button>
      </div>
    </header>
  );
}
