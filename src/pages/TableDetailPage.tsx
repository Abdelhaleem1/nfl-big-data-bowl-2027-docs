import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Key,
  Search,
  ShieldAlert,
} from 'lucide-react';
import {
  columnDictionary,
  dataQualityData,
  relationshipsData,
  tableProfiles,
} from '../types/metadata';
import { SIMPLE_DATASET_EXPLANATIONS } from '../types/simpleExplanations';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { CopyButton } from '../components/CopyButton';

export const TableDetailPage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [colSearch, setColSearch] = useState('');
  const [expandedCol, setExpandedCol] = useState<string | null>(null);

  const table = useMemo(
    () => tableProfiles.tables.find((t) => t.table_id === tableId || t.filename === tableId),
    [tableId]
  );

  const tableColumns = useMemo(() => {
    if (!table) return [];
    return columnDictionary.columns.filter((c) => c.table_name === table.filename);
  }, [table]);

  const filteredColumns = useMemo(() => {
    return tableColumns.filter(
      (c) =>
        c.column_name.toLowerCase().includes(colSearch.toLowerCase()) ||
        c.meaning.toLowerCase().includes(colSearch.toLowerCase()) ||
        c.semantic_type.toLowerCase().includes(colSearch.toLowerCase())
    );
  }, [tableColumns, colSearch]);

  const tableRelationships = useMemo(() => {
    if (!table) return [];
    return relationshipsData.relationships.filter(
      (r) => r.source_table === table.filename || r.target_table === table.filename
    );
  }, [table]);

  const tableHazards = useMemo(() => {
    if (!table) return [];
    return dataQualityData.known_structural_hazards.filter((h) =>
      h.affected_tables.includes(table.filename)
    );
  }, [table]);

  if (!table) {
    return (
      <div className="p-8 rounded-xl border border-rose-200 bg-rose-50 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
        <h1 className="text-lg font-bold text-slate-900">Table Not Found: {tableId}</h1>
        <Link
          to="/datasets"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Datasets</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-200 pb-5">
        <Link
          to="/datasets"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Datasets</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-mono font-bold text-slate-900">{table.filename}</h1>
            <CopyButton text={table.filename} />
            <EvidenceBadge status={table.evidence_status} />
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            {table.size_formatted} ({table.listed_size_bytes.toLocaleString()} B)
          </span>
        </div>

        {SIMPLE_DATASET_EXPLANATIONS[table.filename] && (
          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs sm:text-sm text-slate-800">
            <strong className="text-blue-900">In Simple Words:</strong>{' '}
            {SIMPLE_DATASET_EXPLANATIONS[table.filename]}
          </div>
        )}
        <p className="text-xs sm:text-sm text-slate-600">{table.purpose}</p>
      </div>

      {/* Section A: Overview Summary */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          A. Table Overview & Verification Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm">
            <span className="text-slate-500 block">Primary Key</span>
            <span className="font-mono font-bold text-blue-700 mt-1 block">
              {table.candidate_primary_keys.join(', ')}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm">
            <span className="text-slate-500 block">Row Count</span>
            <span className="font-mono font-semibold text-slate-900 mt-1 block">
              {table.row_count !== null ? table.row_count.toLocaleString() : 'Unverified'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm">
            <span className="text-slate-500 block">Columns</span>
            <span className="font-mono font-semibold text-slate-900 mt-1 block">
              {table.column_count} fields
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm">
            <span className="text-slate-500 block">Status</span>
            <span className="text-slate-800 font-medium mt-1 block">
              {table.is_downloaded ? 'Downloaded Locally' : 'Schema Reference'}
            </span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600">
          <strong className="text-slate-900">Row Grain:</strong> {table.grain_description}
        </div>
      </section>

      {/* Section B: Columns */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">
            B. Columns ({filteredColumns.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={colSearch}
              onChange={(e) => setColSearch(e.target.value)}
              placeholder="Filter columns..."
              aria-label="Filter table columns"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-8">#</th>
                <th className="py-2.5 px-3">Column</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Units</th>
                <th className="py-2.5 px-3">Evidence</th>
                <th className="py-2.5 px-3 text-right">More</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredColumns.map((col) => {
                const isExpanded = expandedCol === col.column_name;
                return (
                  <React.Fragment key={col.column_name}>
                    <tr
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setExpandedCol(isExpanded ? null : col.column_name)}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400">{col.column_index}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {col.key_role.toLowerCase().includes('key') && (
                            <Key className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{col.column_name}</span>
                          <CopyButton text={col.column_name} />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {col.semantic_type}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-md">{col.meaning}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {col.units}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <EvidenceBadge status={col.evidence_status} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 inline" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 inline" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="p-3.5 text-xs text-slate-600 space-y-1.5 border-l-2 border-blue-600">
                          <div>
                            <strong className="text-slate-900">Physical Type:</strong>{' '}
                            <code>{col.physical_type}</code> •{' '}
                            <strong className="text-slate-900">Valid Range:</strong>{' '}
                            {col.valid_range_or_domain}
                          </div>
                          <div>
                            <strong className="text-slate-900">Analytical Use:</strong>{' '}
                            {col.analytical_uses.join('; ')}
                          </div>
                          <div>
                            <strong className="text-slate-900">Caveat:</strong> {col.limitations}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section C: Joins & Hazards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="space-y-2.5">
          <h2 className="text-base font-bold text-slate-900">
            C. Table Joins ({tableRelationships.length})
          </h2>
          {tableRelationships.map((rel) => {
            const peer =
              rel.source_table === table.filename ? rel.target_table : rel.source_table;
            return (
              <div
                key={rel.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                  <span>
                    {rel.source_table} → {rel.target_table}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {rel.join_columns.join(', ')}
                  </span>
                </div>
                <p className="text-slate-600">{rel.design_explanation}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">{rel.cardinality}</span>
                  <Link
                    to={`/tables/${peer.replace('.csv', '')}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Open {peer} →
                  </Link>
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-2.5">
          <h2 className="text-base font-bold text-slate-900">
            D. Data Quality Notes ({tableHazards.length})
          </h2>
          {tableHazards.length === 0 ? (
            <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-600">
              Standard reference table. Verify key uniqueness after downloading locally.
            </div>
          ) : (
            tableHazards.map((haz) => (
              <div
                key={haz.id}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 text-xs space-y-1"
              >
                <div className="font-bold text-amber-900">{haz.title}</div>
                <p className="text-slate-700">{haz.mitigation}</p>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
};
