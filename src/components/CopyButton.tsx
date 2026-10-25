import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${text}`}
      title={`Copy "${text}"`}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono text-slate-500 hover:text-blue-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
};
