import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { analysisCatalog } from '../types/metadata';

export const ResearchQuestionsPage: React.FC = () => {
  const [posFilter, setPosFilter] = useState('ALL');

  const filteredQuestions = useMemo(() => {
    return analysisCatalog.research_questions.filter(
      (rq) => posFilter === 'ALL' || rq.position_groups.includes(posFilter)
    );
  }, [posFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Combine-to-NFL Research Hypotheses ({filteredQuestions.length})
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Analytical questions linking 10 Hz Scouting Combine tracking to regular-season NFL performance.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {['ALL', 'WR', 'TE', 'DB', 'OL', 'DL'].map((pg) => (
            <button
              key={pg}
              type="button"
              onClick={() => setPosFilter(pg)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                posFilter === pg
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {pg}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredQuestions.map((rq) => (
          <article
            key={rq.id}
            className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  {rq.id}
                </span>
                <h2 className="text-base font-bold text-slate-900">{rq.title}</h2>
              </div>
              <div className="flex items-center gap-1">
                {rq.position_groups.map((pg) => (
                  <span
                    key={pg}
                    className="px-2 py-0.5 rounded font-mono text-xs bg-slate-100 text-slate-700"
                  >
                    {pg}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {rq.question}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
              <div>
                <strong className="text-slate-900">Tables Used:</strong>{' '}
                <span className="inline-flex flex-wrap gap-1 ml-1">
                  {rq.relevant_tables.map((tb) => (
                    <Link
                      key={tb}
                      to={`/tables/${tb.replace('.csv', '')}`}
                      className="font-mono text-blue-600 hover:underline"
                    >
                      {tb}
                    </Link>
                  ))}
                </span>
              </div>
              <div>
                <strong className="text-slate-900">Key Confounder:</strong>{' '}
                {rq.confounders_and_leakage_risks[0]}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
