import React from 'react';
import { CheckCircle2, FileCheck, HelpCircle, Info, ShieldAlert } from 'lucide-react';
import { EvidenceStatus } from '../types/metadata';

interface EvidenceBadgeProps {
  status: EvidenceStatus | string;
  size?: 'sm' | 'md';
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ status, size = 'sm' }) => {
  const styles: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    'Officially documented': {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: <FileCheck className="w-3.5 h-3.5 shrink-0" />,
    },
    'Verified from data': {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
    },
    'Inferred from data': {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: <Info className="w-3.5 h-3.5 shrink-0" />,
    },
    Unverified: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <ShieldAlert className="w-3.5 h-3.5 shrink-0" />,
    },
    Unknown: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: <HelpCircle className="w-3.5 h-3.5 shrink-0" />,
    },
  };

  const config = styles[status] || styles.Unknown;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${padding}`}
      title={`Evidence Status: ${status}`}
    >
      {config.icon}
      <span>{status}</span>
    </span>
  );
};
