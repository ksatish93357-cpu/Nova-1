import { useState, useEffect, useRef } from 'react';
import { AppTab, ChatSession, ChatMessage, LanguageMode, KnowledgeTopic } from './types';
import { MemoryItem, DEFAULT_MEMORIES, getRelevantMemories, formatMemoryContext } from './utils/memoryManager';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatView } from './components/chat/ChatView';
import { LearningLabView } from './components/lab/LearningLabView';
import { CodePlaygroundView } from './components/playground/CodePlaygroundView';
import { KnowledgeExplorerView } from './components/knowledge/KnowledgeExplorerView';
import { SettingsView } from './components/settings/SettingsView';
import { MemoryModal } from './components/memory/MemoryModal';
import { ModelManagerModal } from './components/models/ModelManagerModal';
import { NativeToolsModal } from './components/native/NativeToolsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('chat');
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Modals
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [isNativeToolsOpen, setIsNativeToolsOpen] = useState<boolean>(false);

  // Stable Client Session ID for backend vault isolation
  const [sessionId] = useState<string>(() => {
    let id = localStorage.getItem('nova_session_id');
    if (!id) {
      id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      try {
        localStorage.setItem('nova_session_id', id);
      } catch (e) {}
    }
    return id;
  });

  // Chat Sessions & Active Session
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('nova_ai_sessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const initialSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'Neural Networks & Deep Learning',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'msg-welcome',
          role: 'assistant',
          content: `Welcome to **NOVA AI**! I am your personal AI assistant and self-learning AI platform engineer.

### How I can help you:
- **AI Chat Assistant**: Ask me coding, architectural, or mathematical questions in **English**, **Hindi (हिंदी)**, or **Hinglish**.
- **Self-Learning AI Lab**: Explore 7 interactive modules covering backpropagation, tokenizers, transformers, self-attention, and small-model training loops.
- **Code Playground**: Write and run Python or JavaScript code with isolated sandbox execution.
- **Knowledge Explorer**: Study curated architectural blueprints inspired by \`codecrafters-io/build-your-own-x\`.
- **Android Device Bridge**: Test Camera, Flashlight, Notifications, and Dialer integration.

What would you like to build or understand today?`,
          timestamp: Date.now(),
          modelUsed: 'Gemini 3.8 Flash',
        },
      ],
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'default-session';
  });

  // Long-term Memory State
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nova_ai_memories');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MEMORIES;
  });

  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('nova_ai_memory_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // AI Model Selection
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('nova_ai_selected_model') || 'gemini-3.8-flash';
  });

  // Conversational Language Mode
  const [languageMode, setLanguageMode] = useState<LanguageMode>(() => {
    return (localStorage.getItem('nova_ai_language_mode') as LanguageMode) || 'auto';
  });

  // Code Playground Jump Bridge
  const [playgroundCode, setPlaygroundCode] = useState<string | undefined>(undefined);
  const [playgroundLang, setPlaygroundLang] = useState<'python' | 'javascript'>('python');

  // Streaming Controller
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync state to local storage & server database
  useEffect(() => {
    try {
      localStorage.setItem('nova_ai_sessions', JSON.stringify(sessions));
      localStorage.setItem('nova_ai_memories', JSON.stringify(memories));
      localStorage.setItem('nova_ai_memory_enabled', String(memoryEnabled));
      localStorage.setItem('nova_ai_selected_model', selectedModel);
      localStorage.setItem('nova_ai_language_mode', languageMode);
    } catch (e) {}
  }, [sessions, memories, memoryEnabled, selectedModel, languageMode]);

  // Initial sync with server database
  useEffect(() => {
    fetch('/api/storage')
      .then((res) => (res.ok ? res.json() : null))
      .then((db) => {
        if (db && db.sessions && db.sessions.length > 0 && sessions.length <= 1) {
          // If server has saved sessions, hydrate them
          setSessions(db.sessions);
          if (db.sessions[0]) setActiveSessionId(db.sessions[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Chat Actions
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setCurrentTab('chat');
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(
      sessions.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      handleNewChat();
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const handleTogglePinSession = (id: string) => {
    setSessions(
      sessions.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  const handleExportHistory = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `nova_ai_chats_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleExportAllData = () => {
    const fullBackup = {
      version: '2.0',
      exportedAt: Date.now(),
      sessions,
      memories,
      selectedModel,
      languageMode,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `nova_ai_complete_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportData = (jsonStr: string) => {
    const parsed = JSON.parse(jsonStr);
    if (parsed.sessions && Array.isArray(parsed.sessions)) {
      setSessions(parsed.sessions);
      if (parsed.sessions[0]) setActiveSessionId(parsed.sessions[0].id);
    }
    if (parsed.memories && Array.isArray(parsed.memories)) {
      setMemories(parsed.memories);
    }
  };

  // Memory Handlers
  const handleAddMemory = (
    category: MemoryItem['category'],
    content: string,
    importance: MemoryItem['importance']
  ) => {
    const newMem: MemoryItem = {
      id: 'mem-' + Date.now(),
      category,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      importance,
      enabled: true,
    };
    setMemories([newMem, ...memories]);
  };

  const handleUpdateMemory = (
    id: string,
    content: string,
    importance: MemoryItem['importance']
  ) => {
    setMemories(
      memories.map((m) =>
        m.id === id ? { ...m, content, importance, updatedAt: Date.now() } : m
      )
    );
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(memories.filter((m) => m.id !== id));
  };

  const handleClearAllMemory = () => {
    setMemories([]);
  };

  // Streaming AI Chat Message Handler
  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if (isGenerating) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      imageUrl,
      timestamp: Date.now(),
    };

    const assistantMsgId = 'assistant-' + Date.now();
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: selectedModel,
      isStreaming: true,
    };

    // Auto-generate title from first message if title is default
    const shouldUpdateTitle =
      activeSession.messages.length === 0 || activeSession.title === 'New Conversation';
    const newTitle = shouldUpdateTitle ? text.slice(0, 36) || 'New Conversation' : activeSession.title;

    const updatedMessages = [...activeSession.messages, userMsg, initialAssistantMsg];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, title: newTitle, messages: updatedMessages, updatedAt: Date.now() }
          : s
      )
    );

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Filter relevant memories for the prompt
    const relevantMemories = getRelevantMemories(memories, text, memoryEnabled);
    const memoryContext = formatMemoryContext(relevantMemories);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          messages: [...activeSession.messages, userMsg],
          model: selectedModel,
          languageMode,
          memoryContext,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let resolvedModelName = selectedModel;

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.chunk) {
                    accumulatedText += data.chunk;
                    if (data.modelUsed) resolvedModelName = data.modelUsed;

                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === activeSession.id
                          ? {
                              ...s,
                              messages: s.messages.map((m) =>
                                m.id === assistantMsgId
                                  ? {
                                      ...m,
                                      content: accumulatedText,
                                      modelUsed: resolvedModelName,
                                      isStreaming: true,
                                    }
                                  : m
                              ),
                            }
                          : s
                      )
                    );
                  } else if (data.done) {
                    done = true;
                  } else if (data.error) {
                    accumulatedText += `\n\n*(Error: ${data.error})*`;
                  }
                } catch (e) {
                  // Ignore parse error on partial chunks
                }
              }
            }
          }
        }
      }

      // Finalize streaming
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: accumulatedText || '*(No response received)*',
                        isStreaming: false,
                        modelUsed: resolvedModelName,
                      }
                    : m
                ),
              }
            : s
        )
      );

      // Async sync to server database
      fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions }),
      }).catch(() => {});
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User stopped generation manually
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content:
                            m.content +
                            `\n\n*(Connection notice: ${err.message}. Please verify server connection.)*`,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : s
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Message Editing & Regeneration
  const handleEditMessage = (msgId: string, newContent: string) => {
    const msgIndex = activeSession.messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    // Truncate conversation to this message
    const trimmed = activeSession.messages.slice(0, msgIndex);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, messages: trimmed }
          : s
      )
    );

    // Resend edited query
    handleSendMessage(newContent);
  };

  const handleDeleteMessage = (msgId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, messages: s.messages.filter((m) => m.id !== msgId) }
          : s
      )
    );
  };

  const handleRegenerateResponse = (assistantMsgId: string) => {
    const msgIndex = activeSession.messages.findIndex((m) => m.id === assistantMsgId);
    if (msgIndex <= 0) return;

    const priorUserMsg = activeSession.messages[msgIndex - 1];
    if (!priorUserMsg || priorUserMsg.role !== 'user') return;

    // Truncate from the assistant message
    const trimmed = activeSession.messages.slice(0, msgIndex);
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, messages: trimmed }
          : s
      )
    );

    // Re-run with prior user prompt
    handleSendMessage(priorUserMsg.content, priorUserMsg.imageUrl);
  };

  // Jump from learning lab or explorer into code playground
  const handleOpenCodePlayground = (code: string, language: string) => {
    setPlaygroundCode(code);
    setPlaygroundLang(language === 'javascript' ? 'javascript' : 'python');
    setCurrentTab('playground');
  };

  // Jump from topic into chat
  const handleAskNovaAboutTopic = (topic: KnowledgeTopic) => {
    const prompt = `Let's discuss "${topic.title}" from codecrafters build-your-own-x.
Key concepts: ${topic.keyConcepts.join(', ')}.
Can you explain the architecture in detail and show how we should begin implementing it?`;
    handleSendMessage(prompt);
    setCurrentTab('chat');
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${isDarkTheme ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        sessions={sessions}
        activeSessionId={activeSession.id}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onExportHistory={handleExportHistory}
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
        onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        selectedModel={selectedModel}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          selectedModel={selectedModel}
          onOpenModelModal={() => setIsModelModalOpen(true)}
          onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
          memoryEnabled={memoryEnabled}
          activeMemoriesCount={memoryEnabled ? memories.filter((m) => m.enabled).length : 0}
        />

        {/* Space Views */}
        {currentTab === 'chat' && (
          <ChatView
            messages={activeSession.messages}
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            isGenerating={isGenerating}
            selectedModel={selectedModel}
            onOpenModelModal={() => setIsModelModalOpen(true)}
            languageMode={languageMode}
            onChangeLanguageMode={setLanguageMode}
            memories={memories}
            memoryEnabled={memoryEnabled}
            onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
            onOpenCodePlayground={handleOpenCodePlayground}
            onOpenNativeTools={() => setIsNativeToolsOpen(true)}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onRegenerateResponse={handleRegenerateResponse}
          />
        )}

        {currentTab === 'lab' && (
          <LearningLabView onOpenCodePlayground={handleOpenCodePlayground} />
        )}

        {currentTab === 'playground' && (
          <CodePlaygroundView
            initialCode={playgroundCode}
            initialLanguage={playgroundLang}
            onAskNova={(prompt) => {
              handleSendMessage(prompt);
              setCurrentTab('chat');
            }}
          />
        )}

        {currentTab === 'knowledge' && (
          <KnowledgeExplorerView
            onOpenCodePlayground={handleOpenCodePlayground}
            onAskNovaAboutTopic={handleAskNovaAboutTopic}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            languageMode={languageMode}
            onChangeLanguageMode={setLanguageMode}
            selectedModel={selectedModel}
            onOpenModelModal={() => setIsModelModalOpen(true)}
            memories={memories}
            memoryEnabled={memoryEnabled}
            onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
            onExportAllData={handleExportAllData}
            onImportData={handleImportData}
            sessionId={sessionId}
            onOpenNativeTools={() => setIsNativeToolsOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        memoryEnabled={memoryEnabled}
        onToggleMemoryEnabled={setMemoryEnabled}
        onAddMemory={handleAddMemory}
        onUpdateMemory={handleUpdateMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearAllMemory={handleClearAllMemory}
      />

      <ModelManagerModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={(m) => {
          setSelectedModel(m);
          setIsModelModalOpen(false);
        }}
        sessionId={sessionId}
      />

      <NativeToolsModal
        isOpen={isNativeToolsOpen}
        onClose={() => setIsNativeToolsOpen(false)}
        onSendPhotoToChat={(photoUrl) => {
          handleSendMessage('Please analyze this photo captured directly from device camera in detail.', photoUrl);
          setCurrentTab('chat');
        }}
      />
    </div>
  );
}
