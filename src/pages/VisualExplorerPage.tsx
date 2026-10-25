import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { columnDictionary, fileInventory } from '../types/metadata';
import { EvidenceBadge } from '../components/EvidenceBadge';

export const VisualExplorerPage: React.FC = () => {
  const maxBytes = useMemo(
    () => Math.max(...fileInventory.files.map((f) => f.listed_size_bytes), 1),
    []
  );

  const semanticDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of columnDictionary.columns) {
      counts.set(c.semantic_type, (counts.get(c.semantic_type) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Visual Explorer & Coverage Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Verified file sizes and column type distributions across the 9 official competition tables.
        </p>
      </div>

      {/* File Sizes */}
      <section className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              1. Dataset Size Comparison (Log10 Scale)
            </h2>
            <p className="text-xs text-slate-500">
              Total volume: {fileInventory.summary.total_listed_size_formatted} across 9 CSVs.
            </p>
          </div>
          <EvidenceBadge status="Verified from data" />
        </div>

        <div className="space-y-2.5">
          {fileInventory.files
            .slice()
            .sort((a, b) => b.listed_size_bytes - a.listed_size_bytes)
            .map((f) => {
              const logPct =
                (Math.log10(Math.max(10, f.listed_size_bytes)) / Math.log10(maxBytes)) * 100;
              return (
                <div key={f.filename} className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono">
                    <Link
                      to={`/tables/${f.table_id}`}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {f.filename}
                    </Link>
                    <span className="text-slate-600">
                      {f.listed_size_Formatted} ({f.listed_size_bytes.toLocaleString()} B)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${logPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Column Semantic Breakdown */}
      <section className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              2. Column Types ({columnDictionary.total_documented_columns} Total Fields)
            </h2>
          </div>
          <EvidenceBadge status="Officially documented" />
        </div>

        <div className="space-y-2.5">
          {semanticDistribution.map((item) => {
            const pct = (item.count / columnDictionary.total_documented_columns) * 100;
            return (
              <div key={item.type} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-800 font-medium">{item.type}</span>
                  <span className="font-mono text-slate-500">
                    {item.count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
