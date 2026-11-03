import React, { useState } from 'react';
import { Check, Copy, Play } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
  onRunInPlayground?: (code: string, language: string) => void;
}

export function CodeBlock({ language, code, onRunInPlayground }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/90 shadow-lg text-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-xs text-slate-300 font-mono">
        <span className="uppercase tracking-wider font-semibold text-cyan-400">
          {language || 'text'}
        </span>
        <div className="flex items-center gap-2">
          {onRunInPlayground && (
            <button
              onClick={() => onRunInPlayground(code, language)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-xs"
              title="Open and run in Code Playground"
            >
              <Play className="w-3 h-3" />
              <span>Run in Playground</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 transition-colors text-xs"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="p-3.5 overflow-x-auto text-slate-100 font-mono text-xs leading-relaxed selection:bg-cyan-900 selection:text-cyan-200">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

interface MarkdownViewProps {
  content: string;
  onRunInPlayground?: (code: string, language: string) => void;
}

/**
 * Lightweight, robust, streaming-safe Markdown parser without bulky runtime dependencies
 */
export function MarkdownView({ content, onRunInPlayground }: MarkdownViewProps) {
  if (!content) return null;

  // Split code blocks from regular markdown
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.substring(lastIndex, match.index);
      parts.push(
        <div key={`text-${lastIndex}`} className="space-y-2">
          {renderFormattedText(textChunk)}
        </div>
      );
    }

    const language = match[1]?.trim() || 'python';
    const code = match[2]?.trimEnd() || '';
    parts.push(
      <CodeBlock
        key={`code-${match.index}`}
        language={language}
        code={code}
        onRunInPlayground={onRunInPlayground}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.substring(lastIndex);
    parts.push(
      <div key={`text-end`} className="space-y-2">
        {renderFormattedText(remaining)}
      </div>
    );
  }

  return <div className="markdown-body leading-relaxed text-slate-200">{parts}</div>;
}

function renderFormattedText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={i} className="text-base font-bold text-white mt-3 mb-1 tracking-tight flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          {renderInlineStyles(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2 tracking-tight border-b border-slate-700/40 pb-1">
          {renderInlineStyles(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={i} className="text-xl font-extrabold text-white mt-4 mb-2 tracking-tight">
          {renderInlineStyles(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Bullet points
    if (line.match(/^[\*\-]\s+/)) {
      nodes.push(
        <div key={i} className="flex items-start gap-2 text-sm text-slate-300 ml-1.5 my-1">
          <span className="text-cyan-400 mt-1 select-none">•</span>
          <span className="flex-1">{renderInlineStyles(line.replace(/^[\*\-]\s+/, ''))}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      nodes.push(
        <div key={i} className="flex items-start gap-2 text-sm text-slate-300 ml-1.5 my-1">
          <span className="font-mono text-cyan-400 text-xs font-semibold mt-0.5">{numMatch[1]}.</span>
          <span className="flex-1">{renderInlineStyles(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push(
        <blockquote key={i} className="border-l-2 border-cyan-500/70 pl-3 py-1 my-2 text-sm text-cyan-200/90 bg-cyan-950/20 rounded-r">
          {renderInlineStyles(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Standard paragraph
    nodes.push(
      <p key={i} className="text-sm text-slate-200 leading-relaxed my-1">
        {renderInlineStyles(line)}
      </p>
    );
  }

  return nodes;
}

function renderInlineStyles(text: string): React.ReactNode {
  // Bold **text**
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((bPart, bIdx) => {
    if (bPart.startsWith('**') && bPart.endsWith('**')) {
      return (
        <strong key={bIdx} className="font-semibold text-white">
          {renderInlineCode(bPart.slice(2, -2))}
        </strong>
      );
    }
    return <span key={bIdx}>{renderInlineCode(bPart)}</span>;
  });
}

function renderInlineCode(text: string): React.ReactNode {
  const codeParts = text.split(/(`.*?`)/g);
  return codeParts.map((cPart, cIdx) => {
    if (cPart.startsWith('`') && cPart.endsWith('`')) {
      return (
        <code
          key={cIdx}
          className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700/60 font-mono text-xs mx-0.5"
        >
          {cPart.slice(1, -1)}
        </code>
      );
    }
    return cPart;
  });
}
