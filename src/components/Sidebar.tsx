import { useState } from 'react';
import { AppTab, ChatSession } from '../types';
import {
  MessageSquare,
  Brain,
  Terminal,
  Compass,
  Settings,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  Sun,
  Moon,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onTogglePinSession: (id: string) => void;
  onExportHistory: () => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  onOpenMemoryModal: () => void;
  onOpenModelModal: () => void;
  selectedModel: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onTogglePinSession,
  onExportHistory,
  isDarkTheme,
  onToggleTheme,
  onOpenMemoryModal,
  onOpenModelModal,
  selectedModel,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    return s.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const regularSessions = filteredSessions.filter((s) => !s.isPinned);

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Logo & Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight block leading-none">
              NOVA <span className="text-cyan-400">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Personal AI Platform</span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* New Chat Primary Button */}
      <div className="p-3">
        <button
          onClick={() => {
            onNewChat();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-between shadow-md shadow-cyan-500/15 transition-all active:scale-95"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </div>
          <span className="text-[10px] opacity-75 font-mono">Ctrl+K</span>
        </button>
      </div>

      {/* Main Navigation Spaces */}
      <div className="px-3 py-1 space-y-1">
        {[
          { id: 'chat', label: 'AI Chat Assistant', icon: MessageSquare, badge: null },
          { id: 'lab', label: 'AI Learning Lab', icon: Brain, badge: '7 Modules' },
          { id: 'playground', label: 'Code Playground', icon: Terminal, badge: 'Run' },
          { id: 'knowledge', label: 'Knowledge Explorer', icon: Compass, badge: 'GitHub' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id as AppTab);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chat History Section */}
      <div className="flex-1 flex flex-col min-h-0 mt-3 pt-3 border-t border-slate-800/80 px-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Recent Chats
          </span>
          <button
            onClick={onExportHistory}
            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
            title="Export chats as JSON"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>

        {/* History Search */}
        <div className="relative mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
        </div>

        {/* Chat List Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {pinnedSessions.length > 0 && (
            <div className="space-y-1 mb-2">
              <span className="text-[10px] font-mono text-cyan-400/80 uppercase px-2 block">
                Pinned
              </span>
              {pinnedSessions.map((session) => renderSessionItem(session))}
            </div>
          )}

          {regularSessions.length > 0 ? (
            regularSessions.map((session) => renderSessionItem(session))
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              No chat history found.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Profile & Config bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <button
          onClick={onOpenModelModal}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-left flex items-center justify-between text-xs text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="truncate font-mono text-[11px] font-semibold">{selectedModel}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </button>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => onSelectTab('settings')}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
              currentTab === 'settings'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Settings & API Keys"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkTheme ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );

  function renderSessionItem(session: ChatSession) {
    const isActive = session.id === activeSessionId && currentTab === 'chat';
    const isEditing = editingId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => {
          onSelectSession(session.id);
          onSelectTab('chat');
          if (onCloseMobile) onCloseMobile();
        }}
        className={`group px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
          isActive
            ? 'bg-slate-800/90 text-white border border-slate-700/80 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(session.id, e as any);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-cyan-400 w-full"
              autoFocus
            />
          ) : (
            <span className="truncate font-medium">{session.title}</span>
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => handleSaveRename(session.id, e)}
              className="p-1 hover:text-emerald-400"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(null);
              }}
              className="p-1 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="hidden group-hover:flex items-center gap-1 shrink-0 text-slate-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinSession(session.id);
              }}
              className="p-1 hover:text-cyan-300"
              title={session.isPinned ? 'Unpin' : 'Pin chat'}
            >
              <Pin className={`w-3 h-3 ${session.isPinned ? 'text-cyan-400 fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => handleStartRename(session, e)}
              className="p-1 hover:text-white"
              title="Rename"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="p-1 hover:text-rose-400"
              title="Delete chat"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }
}
