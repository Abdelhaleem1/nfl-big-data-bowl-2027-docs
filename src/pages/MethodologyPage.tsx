import React from 'react';
import { EvidenceBadge } from '../components/EvidenceBadge';

export const MethodologyPage: React.FC = () => {
  const cards = [
    {
      title: '1. Survivorship & Draft-Selection Bias',
      body: 'Only prospects who are drafted and earn regular-season snaps appear in NFL game tracking. Because teams draft players using traditional Combine stopwatch times, evaluate sensor traits conditional on stopwatch baselines.',
    },
    {
      title: '2. Temporal Alignment & Right-Censoring',
      body: '2023 rookies have up to three NFL seasons (2023–2025) of observation, whereas 2025 rookies have one season. Normalize outcomes per snap or per season within matching career years.',
    },
    {
      title: '3. Snap-Volume Bias in Max Speed',
      body: 'Sample maximum speed grows with the number of snaps played. Compare players using 90th/95th percentile speed or equal-play subsamples rather than raw maxima.',
    },
    {
      title: '4. Observational Scope',
      body: 'All Combine and game tracking datasets are observational. Present findings as predictive scouting indicators and movement profiles rather than unconfounded causal claims.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Research Methodology, Bias Mitigation & Limitations
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Key statistical guidelines when linking pre-draft Combine sensor data to NFL game performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div
            key={c.title}
            className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">{c.title}</h2>
              <EvidenceBadge status="Officially documented" />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
