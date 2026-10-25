import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { relationshipsData, tableProfiles } from '../types/metadata';
import { EvidenceBadge } from '../components/EvidenceBadge';

interface NodePosition {
  filename: string;
  x: number;
  y: number;
}

const NODE_POSITIONS: NodePosition[] = [
  { filename: 'players.csv', x: 400, y: 60 },
  { filename: 'combine_results.csv', x: 90, y: 170 },
  { filename: 'combine_tracking.csv', x: 90, y: 310 },
  { filename: 'player_career_successes.csv', x: 90, y: 450 },
  { filename: 'games.csv', x: 730, y: 60 },
  { filename: 'player_play.csv', x: 420, y: 240 },
  { filename: 'game_tracking_2023.csv', x: 730, y: 200 },
  { filename: 'game_tracking_2024.csv', x: 730, y: 325 },
  { filename: 'game_tracking_2025.csv', x: 730, y: 450 },
];

export const DataModelPage: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>('players.csv');
  const [zoom, setZoom] = useState<number>(1);

  const posMap = useMemo(() => {
    const map = new Map<string, NodePosition>();
    for (const np of NODE_POSITIONS) map.set(np.filename, np);
    return map;
  }, []);

  const tableMap = useMemo(() => {
    const map = new Map<string, (typeof tableProfiles.tables)[0]>();
    for (const t of tableProfiles.tables) map.set(t.filename, t);
    return map;
  }, []);

  const relatedTables = useMemo(() => {
    if (!selectedTable) return new Set<string>();
    const set = new Set<string>([selectedTable]);
    for (const edge of relationshipsData.relationships) {
      if (edge.source_table === selectedTable) set.add(edge.target_table);
      if (edge.target_table === selectedTable) set.add(edge.source_table);
    }
    return set;
  }, [selectedTable]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Interactive Entity-Relationship Model
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Click any table node to highlight its relationships and join keys.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-300 shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.15).toFixed(2))))}
            aria-label="Zoom In"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            aria-label="Zoom Out"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            aria-label="Fit to screen"
            className="px-2 py-1 rounded hover:bg-slate-100 text-xs font-mono text-slate-700 flex items-center gap-1"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{Math.round(zoom * 100)}%</span>
          </button>
        </div>
      </div>

      {/* Clean Light SVG Diagram */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span>
            Selected: <strong className="font-mono text-blue-700">{selectedTable || 'All tables'}</strong>
          </span>
          {selectedTable && (
            <button
              type="button"
              onClick={() => setSelectedTable(null)}
              className="text-blue-600 hover:underline font-medium"
            >
              Show all
            </button>
          )}
        </div>

        <div className="w-full overflow-x-auto p-4 bg-slate-50/50">
          <svg
            viewBox="0 0 1000 560"
            className="w-full h-auto min-w-[720px] select-none"
            role="img"
            aria-label="Entity Relationship Diagram"
          >
            <g transform={`scale(${zoom})`}>
              {relationshipsData.relationships.map((edge) => {
                const src = posMap.get(edge.source_table);
                const tgt = posMap.get(edge.target_table);
                if (!src || !tgt) return null;

                const x1 = src.x + 105;
                const y1 = src.y + 36;
                const x2 = tgt.x + 105;
                const y2 = tgt.y + 36;
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                const active =
                  !selectedTable ||
                  edge.source_table === selectedTable ||
                  edge.target_table === selectedTable;

                return (
                  <g key={edge.id} opacity={active ? 1 : 0.2}>
                    <path
                      d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={active ? '#2563eb' : '#94a3b8'}
                      strokeWidth={active ? 2 : 1.2}
                    />
                    <rect
                      x={midX - 52}
                      y={midY - 10}
                      width={104}
                      height={20}
                      rx={4}
                      fill="#ffffff"
                      stroke="#cbd5e1"
                    />
                    <text
                      x={midX}
                      y={midY + 3}
                      textAnchor="middle"
                      className="fill-blue-700 font-mono text-[10px] font-semibold"
                    >
                      {edge.join_columns.join(', ')}
                    </text>
                  </g>
                );
              })}

              {NODE_POSITIONS.map((node) => {
                const prof = tableMap.get(node.filename);
                const isSelected = selectedTable === node.filename;
                const isConnected = !selectedTable || relatedTables.has(node.filename);

                return (
                  <g
                    key={node.filename}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedTable(node.filename)}
                    className="cursor-pointer"
                    opacity={isConnected ? 1 : 0.35}
                  >
                    <rect
                      width={210}
                      height={72}
                      rx={8}
                      fill="#ffffff"
                      stroke={isSelected ? '#2563eb' : '#cbd5e1'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text x={12} y={24} className="fill-slate-900 font-mono font-bold text-[12px]">
                      {node.filename}
                    </text>
                    <text x={12} y={44} className="fill-blue-700 font-mono text-[10px]">
                      PK: {prof?.candidate_primary_keys.join(', ') || 'nflId'}
                    </text>
                    <text x={12} y={60} className="fill-slate-500 text-[10px]">
                      {prof?.size_formatted} • {prof?.column_count} cols
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </section>

      {/* Simple Join Reference Table */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          Join Keys & Cardinality ({relationshipsData.relationships.length})
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Source → Target</th>
                <th className="py-2.5 px-4">Join Columns</th>
                <th className="py-2.5 px-4">Cardinality</th>
                <th className="py-2.5 px-4">Notes</th>
                <th className="py-2.5 px-4">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {relationshipsData.relationships.map((edge) => (
                <tr key={edge.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-semibold">
                    <Link
                      to={`/tables/${edge.source_table.replace('.csv', '')}`}
                      className="text-blue-600 hover:underline"
                    >
                      {edge.source_table}
                    </Link>
                    <span className="text-slate-400 mx-1.5">→</span>
                    <Link
                      to={`/tables/${edge.target_table.replace('.csv', '')}`}
                      className="text-slate-800 hover:text-blue-600 hover:underline"
                    >
                      {edge.target_table}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-blue-700">
                    {edge.join_columns.join(', ')}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{edge.cardinality}</td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-md">
                    {edge.row_multiplication_hazard}
                  </td>
                  <td className="py-2.5 px-4">
                    <EvidenceBadge status={edge.evidence_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
