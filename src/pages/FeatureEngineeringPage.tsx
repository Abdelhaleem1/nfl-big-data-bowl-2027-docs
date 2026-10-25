import React from 'react';
import { Link } from 'react-router-dom';
import { analysisCatalog } from '../types/metadata';

export const FeatureEngineeringPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Feature Engineering Catalog ({analysisCatalog.feature_engineering.length})
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Derived 10 Hz movement metrics (Δt = 0.1s) with explicit units and source tables.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {analysisCatalog.feature_engineering.map((feat) => (
          <div
            key={feat.id}
            className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  {feat.id}
                </span>
                <h2 className="text-base font-bold text-slate-900">{feat.name}</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700">
                Units: {feat.units}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">{feat.definition}</p>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
              <code>{feat.formula_latex}</code>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div>
                <strong className="text-slate-900">Inputs:</strong>{' '}
                <code className="font-mono text-blue-700">{feat.input_columns.join(', ')}</code>
              </div>
              <div>
                <strong className="text-slate-900">Tables:</strong>{' '}
                <span className="inline-flex flex-wrap gap-1.5 ml-1">
                  {feat.source_tables.map((st) => (
                    <Link
                      key={st}
                      to={`/tables/${st.replace('.csv', '')}`}
                      className="font-mono text-blue-600 hover:underline"
                    >
                      {st}
                    </Link>
                  ))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
