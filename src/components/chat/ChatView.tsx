import { useState, useRef, useEffect, useId } from 'react';
import { ChatMessage, LanguageMode } from '../../types';
import { MemoryItem } from '../../utils/memoryManager';
import { MarkdownView } from '../../utils/markdownRenderer';
import {
  Send,
  Square,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Brain,
  RotateCcw,
  Copy,
  Check,
  Bot,
  User,
  X,
  Languages,
  Smartphone,
  Trash2,
  Edit2,
  Radio,
  AlertTriangle,
} from 'lucide-react';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, imageUrl?: string) => Promise<void>;
  onStopGeneration?: () => void;
  isGenerating: boolean;
  selectedModel: string;
  onOpenModelModal: () => void;
  languageMode: LanguageMode;
  onChangeLanguageMode: (mode: LanguageMode) => void;
  memories: MemoryItem[];
  memoryEnabled: boolean;
  onOpenMemoryModal: () => void;
  onOpenCodePlayground: (code: string, language: string) => void;
  onOpenNativeTools?: () => void;
  onEditMessage?: (id: string, newContent: string) => void;
  onDeleteMessage?: (id: string) => void;
  onRegenerateResponse?: (assistantMessageId: string) => void;
}

export function ChatView({
  messages,
  onSendMessage,
  onStopGeneration,
  isGenerating,
  selectedModel,
  onOpenModelModal,
  languageMode,
  onChangeLanguageMode,
  memories,
  memoryEnabled,
  onOpenMemoryModal,
  onOpenCodePlayground,
  onOpenNativeTools,
  onEditMessage,
  onDeleteMessage,
  onRegenerateResponse,
}: ChatViewProps) {
  const fileInputId = useId();

  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechOutputEnabled, setSpeechOutputEnabled] = useState(false);
  const [continuousVoiceMode, setContinuousVoiceMode] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Message Editing State
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);

  // Auto-scroll on new message or stream chunk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Voice synthesis on assistant response completion
  useEffect(() => {
    if ((speechOutputEnabled || continuousVoiceMode) && !isGenerating && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant' && last.content && !last.isStreaming) {
        speakText(last.content, () => {
          // If continuous voice conversation mode is enabled, start listening as soon as speech finishes
          if (continuousVoiceMode) {
            startVoiceRecognition();
          }
        });
      }
    }
  }, [messages, isGenerating, speechOutputEnabled, continuousVoiceMode]);

  const speakText = (text: string, onEndCallback?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEndCallback?.();
      return;
    }
    window.speechSynthesis.cancel();

    // Clean text for speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[`#\*_\[\]\(\)]/g, ' ')
      .slice(0, 400);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();

    if (voiceGender === 'female') {
      const female = voices.find((v) =>
        /female|samantha|zira|victoria|kavya|google uk english female/i.test(v.name)
      );
      if (female) utterance.voice = female;
      utterance.pitch = 1.1;
    } else {
      const male = voices.find((v) =>
        /male|david|george|ravi|google uk english male/i.test(v.name)
      );
      if (male) utterance.voice = male;
      utterance.pitch = 0.9;
    }

    utterance.rate = 1.05;
    isSpeakingRef.current = true;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      onEndCallback?.();
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      onEndCallback?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      setContinuousVoiceMode(false);
      return;
    }

    try {
      recognitionRef.current?.stop();
    } catch (e) {}

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang =
      languageMode === 'hindi'
        ? 'hi-IN'
        : languageMode === 'hinglish'
        ? 'en-IN'
        : 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setInput(transcript);

      // If user finished speech segment
      if (event.results[0]?.isFinal && transcript.trim()) {
        recognition.stop();
        setIsRecording(false);
        onSendMessage(transcript.trim());
        setInput('');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech recognition error:', e.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch (e) {
      setIsRecording(false);
    }
  };

  const handleToggleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    startVoiceRecognition();
  };

  const handleToggleContinuousVoice = () => {
    if (continuousVoiceMode) {
      setContinuousVoiceMode(false);
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      setIsRecording(false);
    } else {
      setContinuousVoiceMode(true);
      setSpeechOutputEnabled(true);
      startVoiceRecognition();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedImage) || isGenerating) return;

    const textToSend = input.trim();
    const imgToSend = attachedImage || undefined;

    setInput('');
    setAttachedImage(null);

    await onSendMessage(textToSend, imgToSend);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditedText(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    if (editedText.trim() && onEditMessage) {
      onEditMessage(msgId, editedText.trim());
    }
    setEditingMsgId(null);
  };

  const activeMemoriesCount = memoryEnabled ? memories.filter((m) => m.enabled).length : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Top Context Subheader */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Model & Language Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenModelModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 font-mono text-[11px] border border-slate-700/60 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="font-semibold uppercase">{selectedModel}</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-800/60 p-0.5 rounded-lg border border-slate-700/60">
            <Languages className="w-3 h-3 text-slate-400 ml-1.5" />
            {(['auto', 'hinglish', 'english', 'hindi'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onChangeLanguageMode(mode)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                  languageMode === mode
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Memory, Voice Mode & Native Tools */}
        <div className="flex items-center gap-2">
          {/* Continuous Voice Loop Button */}
          <button
            onClick={handleToggleContinuousVoice}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
              continuousVoiceMode
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Continuous conversational voice agent mode"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Voice Loop: {continuousVoiceMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Native Android / Device Bridge Button */}
          {onOpenNativeTools && (
            <button
              onClick={onOpenNativeTools}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
              title="Open Device Tools (Camera, Flashlight, Dialer, Notifications)"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Device Tools</span>
            </button>
          )}

          {/* Memory Modal trigger */}
          <button
            onClick={onOpenMemoryModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
              memoryEnabled && activeMemoriesCount > 0
                ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-500'
            }`}
            title="Configure Personal Memory"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Mem: {memoryEnabled ? `${activeMemoriesCount}` : 'Off'}</span>
          </button>

          {/* Single voice synthesis toggle */}
          <button
            onClick={() => setSpeechOutputEnabled(!speechOutputEnabled)}
            className={`p-1.5 rounded-lg transition-colors border ${
              speechOutputEnabled
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title={speechOutputEnabled ? 'Audio responses ON' : 'Audio responses OFF'}
          >
            {speechOutputEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {speechOutputEnabled && (
            <select
              value={voiceGender}
              onChange={(e) => setVoiceGender(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-300"
            >
              <option value="female">Female Voice</option>
              <option value="male">Male Voice</option>
            </select>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty State / Welcome Hero */
          <div className="max-w-2xl mx-auto my-auto text-center py-10 space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/30 shadow-xl shadow-cyan-500/10">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                NOVA AI Assistant & Self-Learning Platform
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                Fluent in English, Hindi & Hinglish. Ready to explain neural networks, guide your codecrafters projects, or build mini LLMs from scratch.
              </p>
            </div>

            {/* Quick Starter Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
              {[
                {
                  label: 'Explain Self-Attention in Hinglish',
                  desc: 'Softmax(QK^T / sqrt(d_k)) with intuitive analogies',
                  prompt: 'Transformer ke self-attention mechanism ko Hinglish mein aasan tareeke se samjhaiye, with formula explanation and Python code.',
                },
                {
                  label: 'Build Neural Net from Scratch',
                  desc: 'Pure Python forward pass & backprop step',
                  prompt: 'How do I build a 2-layer Neural Network from scratch in Python without PyTorch? Show weights, sigmoid, and backpropagation.',
                },
                {
                  label: 'Build Your Own Git from Scratch',
                  desc: 'codecrafters build-your-own-x explanation',
                  prompt: 'Explain how to build your own Git version control system from scratch based on codecrafters build-your-own-x.',
                },
                {
                  label: 'Tokenizers & BPE Explained',
                  desc: 'Byte Pair Encoding in LLMs',
                  prompt: 'What is Byte Pair Encoding (BPE) in LLMs like GPT? Explain how subword tokenization works step by step.',
                },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(chip.prompt)}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all text-left flex flex-col gap-1 group shadow-md"
                >
                  <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                    {chip.label}
                  </span>
                  <span className="text-[11px] text-slate-400">{chip.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Messages */
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isCopied = copiedId === msg.id;
            const isEditing = editingMsgId === msg.id;
            const hasError = msg.content.includes('*(Connection notice:') || msg.content.includes('*(Error:');

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl mx-auto group ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-2 rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed max-w-2xl ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-900/90 border border-slate-800/90 rounded-tl-none shadow-lg text-slate-100 flex-1'
                  }`}
                >
                  {/* Attached user image preview */}
                  {msg.imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/20 max-w-xs">
                      <img src={msg.imageUrl} alt="Uploaded" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  {isUser ? (
                    isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-400 rounded-lg p-2 text-xs text-white focus:outline-none"
                          rows={3}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingMsgId(null)}
                            className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="px-2.5 py-1 rounded bg-white text-indigo-900 font-bold text-xs hover:bg-slate-100"
                          >
                            Save & Regenerate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )
                  ) : (
                    <div>
                      <MarkdownView
                        content={msg.content}
                        onRunInPlayground={onOpenCodePlayground}
                      />
                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1 align-middle rounded-sm"></span>
                      )}
                    </div>
                  )}

                  {/* Message Bottom Toolbar */}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      {!isUser && msg.modelUsed && (
                        <span className="font-mono text-cyan-400/80">{msg.modelUsed}</span>
                      )}
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {isUser ? (
                        <>
                          <button
                            onClick={() => handleStartEdit(msg)}
                            className="p-1 hover:text-cyan-300 transition-colors"
                            title="Edit message"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {onDeleteMessage && (
                            <button
                              onClick={() => onDeleteMessage(msg.id)}
                              className="p-1 hover:text-rose-400 transition-colors"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {hasError && onRegenerateResponse && (
                            <button
                              onClick={() => onRegenerateResponse(msg.id)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-medium hover:bg-rose-500/30"
                              title="Retry failed generation"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                          <button
                            onClick={() => speakText(msg.content)}
                            className="hover:text-cyan-300 transition-colors p-1"
                            title="Read aloud"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="hover:text-cyan-300 transition-colors p-1"
                            title="Copy response"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          {onRegenerateResponse && !msg.isStreaming && !hasError && (
                            <button
                              onClick={() => onRegenerateResponse(msg.id)}
                              className="hover:text-cyan-300 transition-colors p-1"
                              title="Regenerate response"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteMessage && (
                            <button
                              onClick={() => onDeleteMessage(msg.id)}
                              className="hover:text-rose-400 transition-colors p-1"
                              title="Delete response"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview Thumbnail if attached */}
      {attachedImage && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-cyan-500/50">
            <img src={attachedImage} alt="Attachment" className="w-full h-full object-cover" />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute top-0 right-0 bg-slate-950/80 text-white p-0.5 rounded-bl hover:bg-rose-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs text-slate-400 font-mono">Image attached for vision analysis</span>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-end gap-2">
          {/* Action buttons (Image upload, Mic, Native Tools) */}
          <div className="flex items-center gap-1 mb-2">
            <label
              htmlFor={fileInputId}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Upload Image for Vision AI"
            >
              <ImageIcon className="w-4 h-4" />
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {onOpenNativeTools && (
              <button
                type="button"
                onClick={onOpenNativeTools}
                className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                title="Device Camera / Hardware Bridge"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleVoiceInput}
              className={`p-2 rounded-xl transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
              }`}
              title={isRecording ? 'Listening (Click to stop)' : 'Voice Input (Hinglish / English / Hindi)'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Text Area */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-2.5 focus-within:border-cyan-400/80 shadow-inner flex items-center">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                isRecording
                  ? 'Listening to speech...'
                  : languageMode === 'hinglish'
                  ? 'Ask anything in Hinglish or English (e.g. "Neural network kaise kaam karta hai?")...'
                  : 'Ask NOVA AI anything about AI models, math, or coding...'
              }
              className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-32 leading-relaxed"
            />
          </div>

          {/* Send / Stop button */}
          <div className="mb-1.5">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && !attachedImage}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <div className="text-center text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-center gap-2">
          <span>NOVA AI V2</span>
          <span>•</span>
          <span>Gemini 3.8 Flash Core</span>
          <span>•</span>
          <span className="text-cyan-400/80">Hindi, English & Hinglish Ready</span>
        </div>
      </div>
    </div>
  );
}
