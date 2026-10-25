import React from 'react';
import { Link } from 'react-router-dom';
import { dataQualityData, tableProfiles } from '../types/metadata';
import { EvidenceBadge } from '../components/EvidenceBadge';

export const DataQualityPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Data Quality Audit & Structural Tracking Hazards
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Known structural nuances in 10 Hz Combine & Next Gen Stats tracking and current profiling status.
        </p>
      </div>

      {/* Hazards */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          Key Tracking & Modeling Hazards ({dataQualityData.known_structural_hazards.length})
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {dataQualityData.known_structural_hazards.map((haz) => (
            <div
              key={haz.id}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-slate-900">
                  {haz.id}: {haz.title}
                </span>
                <EvidenceBadge status={haz.evidence_status} />
              </div>
              <p className="text-slate-600">{haz.description}</p>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                <strong>Fix:</strong> {haz.mitigation}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coverage Matrix */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Table Verification Status</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Table</th>
                <th className="py-2.5 px-4">Listed Size</th>
                <th className="py-2.5 px-4">Rows</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tableProfiles.tables.map((t) => (
                <tr key={t.filename} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-semibold">
                    <Link
                      to={`/tables/${t.table_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {t.filename}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{t.size_formatted}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-700">
                    {t.row_count !== null ? t.row_count.toLocaleString() : 'Unverified'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{t.profiling_mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
