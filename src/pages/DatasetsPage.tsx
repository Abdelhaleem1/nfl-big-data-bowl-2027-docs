import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageSquareText, Search } from 'lucide-react';
import { fileInventory, tableProfiles } from '../types/metadata';
import { SIMPLE_DATASET_EXPLANATIONS } from '../types/simpleExplanations';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { CopyButton } from '../components/CopyButton';

export const DatasetsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const categories = useMemo(() => {
    const set = new Set(fileInventory.files.map((f) => f.category));
    return ['ALL', ...Array.from(set)];
  }, []);

  const profileMap = useMemo(() => {
    const map = new Map<string, (typeof tableProfiles.tables)[0]>();
    for (const t of tableProfiles.tables) {
      map.set(t.filename, t);
    }
    return map;
  }, []);

  const filteredFiles = useMemo(() => {
    return fileInventory.files.filter((f) => {
      const simpleText = SIMPLE_DATASET_EXPLANATIONS[f.filename] || '';
      const matchesSearch =
        f.filename.toLowerCase().includes(search.toLowerCase()) ||
        f.purpose.toLowerCase().includes(search.toLowerCase()) ||
        simpleText.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || f.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Official Dataset Inventory (9 Competition Files)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Total size: <strong>{fileInventory.summary.total_listed_size_formatted}</strong> ({fileInventory.summary.total_listed_size_bytes.toLocaleString()} bytes). Each dataset below includes a plain-English explanation and technical details.
        </p>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            aria-label="Search datasets"
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'ALL' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Clean Cards with Simple Explanation */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredFiles.map((file) => {
          const prof = profileMap.get(file.filename);
          const simpleExplanation = SIMPLE_DATASET_EXPLANATIONS[file.filename];
          return (
            <div
              key={file.filename}
              className="p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/tables/${file.table_id}`}
                    className="text-base font-mono font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>{file.filename}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <CopyButton text={file.filename} />
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                    {file.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <EvidenceBadge status={file.evidence_status} />
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
                    {file.listed_size_Formatted}
                  </span>
                </div>
              </div>

              {simpleExplanation && (
                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs sm:text-sm text-slate-800 flex items-start gap-2">
                  <MessageSquareText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-900">In Simple Words:</strong> {simpleExplanation}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500">
                <strong className="text-slate-700">Technical Summary:</strong> {file.purpose}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500 border-t border-slate-100">
                <span>
                  <strong className="text-slate-700">Primary Key:</strong>{' '}
                  <code className="font-mono text-blue-700">
                    {prof?.candidate_primary_keys.join(', ') || 'nflId'}
                  </code>
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-700">Documented Columns:</strong>{' '}
                  {prof?.column_count || 0} fields
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-700">Format:</strong> CSV
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
