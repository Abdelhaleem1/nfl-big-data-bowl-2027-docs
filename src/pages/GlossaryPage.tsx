import React, { useMemo, useState } from 'react';
import { BookOpen, Lightbulb, Search } from 'lucide-react';
import { analysisCatalog } from '../types/metadata';
import { BEGINNER_NFL_GUIDE } from '../types/simpleExplanations';

export const GlossaryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'beginner' | 'technical'>('beginner');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  const filteredBeginner = useMemo(() => {
    return BEGINNER_NFL_GUIDE.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.simple_explanation.toLowerCase().includes(q) ||
        item.real_world_analogy.toLowerCase().includes(q);
      const matchesGroup = groupFilter === 'ALL' || item.group === groupFilter;
      return matchesSearch && matchesGroup;
    });
  }, [search, groupFilter]);

  const filteredTechnical = useMemo(() => {
    return analysisCatalog.glossary.filter((g) => {
      const q = search.toLowerCase();
      return (
        !q ||
        g.term.toLowerCase().includes(q) ||
        g.definition.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
      );
    });
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Domain & Technical Glossary ({BEGINNER_NFL_GUIDE.length + analysisCatalog.glossary.length} Terms)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          No football background needed! Start with the <strong>Beginner&apos;s Guide to NFL Words</strong>, or switch to the <strong>Technical Reference</strong> tab.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('beginner')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'beginner'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Beginner&apos;s Guide to NFL Words ({BEGINNER_NFL_GUIDE.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('technical')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'technical'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Technical & Data Engineering Reference ({analysisCatalog.glossary.length})</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words (e.g., Combine, Wide Receiver, Play, 10 Hz)..."
            aria-label="Search glossary"
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900"
          />
        </div>

        {activeTab === 'beginner' && (
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'Football Basics', 'Player Positions', 'Workout Drills', 'Sensor & Data Terms'].map(
              (grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setGroupFilter(grp)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    groupFilter === grp
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {grp === 'ALL' ? 'All Topics' : grp}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Tab 1: Beginner's Guide */}
      {activeTab === 'beginner' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBeginner.map((item) => (
            <div
              key={item.term}
              className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900">{item.term}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    {item.group}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {item.simple_explanation}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
                <strong>Everyday Analogy:</strong> {item.real_world_analogy}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Tab 2: Technical Reference */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTechnical.map((item) => (
            <div
              key={item.term}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900">{item.term}</h2>
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.definition}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
