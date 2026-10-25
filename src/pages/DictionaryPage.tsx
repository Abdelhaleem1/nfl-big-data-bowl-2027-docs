import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import { columnDictionary, fileInventory } from '../types/metadata';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { CopyButton } from '../components/CopyButton';

export const DictionaryPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [tableFilter, setTableFilter] = useState('ALL');

  const filteredColumns = useMemo(() => {
    return columnDictionary.columns.filter((c) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        c.column_name.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        c.table_name.toLowerCase().includes(q) ||
        c.semantic_type.toLowerCase().includes(q);
      const matchesTable = tableFilter === 'ALL' || c.table_name === tableFilter;
      return matchesQuery && matchesTable;
    });
  }, [query, tableFilter]);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(filteredColumns, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nfl_bdb_2027_dictionary.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Global Data Dictionary ({columnDictionary.total_documented_columns} Columns)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Search fields across all 9 competition tables.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportJson}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300 shadow-sm shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Export JSON ({filteredColumns.length})</span>
        </button>
      </div>

      {/* Search & Table Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search column name (e.g., nflId, fortyYardDash, s, a, o, dir)..."
            aria-label="Search global dictionary"
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900"
          />
        </div>

        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          aria-label="Filter dictionary by dataset"
          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700"
        >
          <option value="ALL">All 9 Tables</option>
          {fileInventory.files.map((f) => (
            <option key={f.filename} value={f.filename}>
              {f.filename}
            </option>
          ))}
        </select>
      </div>

      {/* Dictionary Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
              <th className="py-2.5 px-4">Column</th>
              <th className="py-2.5 px-4">Table</th>
              <th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4">Description</th>
              <th className="py-2.5 px-4">Units</th>
              <th className="py-2.5 px-4">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredColumns.map((col) => (
              <tr
                key={`${col.table_name}-${col.column_name}`}
                className="hover:bg-slate-50 align-top"
              >
                <td className="py-2.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>{col.column_name}</span>
                    <CopyButton text={col.column_name} />
                  </div>
                </td>
                <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                  <Link
                    to={`/tables/${col.table_name.replace('.csv', '')}`}
                    className="text-slate-800 hover:text-blue-600 hover:underline font-medium"
                  >
                    {col.table_name}
                  </Link>
                </td>
                <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                  {col.semantic_type}
                </td>
                <td className="py-2.5 px-4 text-slate-700 max-w-md">{col.meaning}</td>
                <td className="py-2.5 px-4 font-mono text-slate-600">{col.units}</td>
                <td className="py-2.5 px-4 whitespace-nowrap">
                  <EvidenceBadge status={col.evidence_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
