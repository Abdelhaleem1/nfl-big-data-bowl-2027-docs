import React from 'react';
import { ExternalLink } from 'lucide-react';
import { analysisCatalog, fileInventory } from '../types/metadata';
import { EvidenceBadge } from '../components/EvidenceBadge';

export const SourcesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Official Sources, Citations & Provenance
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          All competition claims are backed strictly by official Kaggle and NFL Football Operations sources.
        </p>
      </div>

      <div className="space-y-3">
        {analysisCatalog.official_sources.map((src) => (
          <div
            key={src.id}
            className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  {src.id}
                </span>
                <h2 className="font-bold text-slate-900 text-sm">{src.title}</h2>
              </div>
              <EvidenceBadge status={src.verification_status} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>{src.publisher}</span>
              <span>•</span>
              <a
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-mono"
              >
                <span>{src.url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="text-slate-900">Metadata Schema:</strong> v{fileInventory.metadata_schema_version}
        </span>
        <span>
          <strong className="text-slate-900">Generator:</strong>{' '}
          <code className="font-mono">scripts/profile_datasets.py</code>
        </span>
        <span>
          <strong className="text-slate-900">Last Updated:</strong> {fileInventory.generated_at_utc}
        </span>
      </div>
    </div>
  );
};
