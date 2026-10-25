import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Database,
  FileSpreadsheet,
  GitBranch,
  HelpCircle,
  Terminal,
} from 'lucide-react';
import {
  analysisCatalog,
  columnDictionary,
  fileInventory,
  relationshipsData,
} from '../types/metadata';
import { SIMPLE_DATASET_EXPLANATIONS } from '../types/simpleExplanations';
import { EvidenceBadge } from '../components/EvidenceBadge';

export const HomePage: React.FC = () => {
  const { competition_overview } = analysisCatalog;

  return (
    <div className="space-y-8">
      {/* Clean Hero Header */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {competition_overview.edition}
          </span>
          <EvidenceBadge status="Officially documented" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          NFL Big Data Bowl 2027 — Data Architecture & Research Documentation
        </h1>

        <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">
          Connecting 10 Hz NFL Scouting Combine tracking data with regular-season NFL game performance across five position groups: <strong>WR, TE, DB, OL, and DL</strong>.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/datasets"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
          >
            <Database className="w-4 h-4" />
            <span>Browse Datasets (9)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/glossary"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-sm border border-emerald-200 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>New to NFL? Read the Beginner Guide</span>
          </Link>
          <Link
            to="/dictionary"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-slate-300 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Data Dictionary ({columnDictionary.total_documented_columns} cols)</span>
          </Link>
          <Link
            to="/data-model"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-slate-300 transition-colors"
          >
            <GitBranch className="w-4 h-4 text-slate-600" />
            <span>ER Diagram</span>
          </Link>
        </div>
      </section>

      {/* What is this data about? (In Simple Words) */}
      <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 space-y-4">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
          <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
          <h2>What is this data about? (In Plain English)</h2>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          Every year, top college football players apply to join the professional league (<strong>the NFL</strong>). Before teams pick players, the players attend a big workout event called the <strong>Scouting Combine</strong>—like a physical job interview where they run sprints, jump, and weave around cones.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-lg bg-white border border-blue-100 shadow-sm space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              1. The Old Way (Stopwatch)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Traditionally, scouts only looked at a player’s final stopwatch time (for example, how many seconds it took to sprint 40 yards).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white border border-blue-100 shadow-sm space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              2. The New Data (Wearable Sensors)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Now, players wear tiny tracking chips that record their exact location, speed, and braking <strong>10 times every second</strong> during both pre-NFL workouts and real NFL games.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white border border-blue-100 shadow-sm space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              3. The Goal of This Project
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compare how players move in their pre-NFL workouts against how they perform in real NFL games—so teams can spot hidden talent that a simple stopwatch misses.
            </p>
          </div>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="text-xs font-medium text-slate-500">Official Files</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {fileInventory.summary.total_official_files}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {fileInventory.summary.total_listed_size_formatted} total
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="text-xs font-medium text-slate-500">Downloaded Locally</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {fileInventory.summary.downloaded_files_count} / {fileInventory.summary.total_official_files}
          </div>
          <div className="mt-1 text-xs text-slate-500">In `data/raw/`</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="text-xs font-medium text-slate-500">Documented Columns</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {columnDictionary.total_documented_columns}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {columnDictionary.unique_column_names} unique names
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="text-xs font-medium text-slate-500">Table Relationships</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {relationshipsData.relationships.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">Join paths mapped</div>
        </div>
      </section>

      {/* Position Groups (Compact Bar) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            The 5 Player Position Groups in This Dataset
          </h2>
          <Link to="/glossary" className="text-xs font-semibold text-blue-600 hover:underline">
            What do these positions do? →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {competition_overview.position_groups.map((pg) => (
            <div
              key={pg.code}
              className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  {pg.code}
                </span>
                <span className="font-semibold text-slate-900 text-xs">{pg.name}</span>
              </div>
              <p className="mt-2 text-xs text-slate-600 line-clamp-3">{pg.focus}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clean Dataset Inventory Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Competition Files (9)</h2>
          <Link to="/datasets" className="text-xs font-semibold text-blue-600 hover:underline">
            View plain-English file guide →
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-4">File</th>
                <th className="py-2.5 px-4">In Simple Words</th>
                <th className="py-2.5 px-4 text-right">Size</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {fileInventory.files.map((f) => (
                <tr key={f.filename} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-semibold whitespace-nowrap">
                    <Link
                      to={`/tables/${f.table_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {f.filename}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-md">
                    {SIMPLE_DATASET_EXPLANATIONS[f.filename] || f.purpose}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                    {f.listed_size_Formatted}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span
                      className={
                        f.is_downloaded
                          ? 'text-emerald-700 font-medium'
                          : 'text-amber-700'
                      }
                    >
                      {f.is_downloaded ? 'Downloaded' : 'Not downloaded'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <EvidenceBadge status={f.evidence_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Concise CLI Quick Reference */}
      <section className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-2.5">
          <Terminal className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900">Download & Profile Data Locally:</span>
            <p className="text-slate-600 mt-0.5">
              Run in an authenticated terminal to download small CSVs (~145 KB) and refresh all stats.
            </p>
          </div>
        </div>
        <code className="px-3 py-2 rounded bg-slate-100 text-slate-800 font-mono border border-slate-200 shrink-0">
          python scripts/acquire_data.py --tier tier1 &amp;&amp; python scripts/profile_datasets.py
        </code>
      </section>
    </div>
  );
};
