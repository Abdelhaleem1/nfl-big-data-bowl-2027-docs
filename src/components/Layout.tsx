import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Cpu,
  Database,
  ExternalLink,
  FileSearch,
  GitBranch,
  HelpCircle,
  Home,
  Layers,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import { tableProfiles } from '../types/metadata';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: Home },
  { to: '/datasets', label: 'Datasets (9)', icon: Database },
  { to: '/dictionary', label: 'Data Dictionary', icon: FileSearch },
  { to: '/data-model', label: 'Data Model & Joins', icon: GitBranch },
  { to: '/research-questions', label: 'Research Questions', icon: HelpCircle },
  { to: '/feature-engineering', label: 'Features', icon: Cpu },
  { to: '/data-quality', label: 'Data Quality', icon: AlertTriangle },
  { to: '/visual-explorer', label: 'Visuals', icon: BarChart3 },
  { to: '/methodology', label: 'Methodology', icon: ShieldCheck },
  { to: '/sources', label: 'Sources', icon: Layers },
  { to: '/glossary', label: 'NFL Beginner Guide & Glossary', icon: BookOpen },
];

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white z-30">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                NFL Docs
              </div>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                Big Data Bowl 2027
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Main Navigation">
          <div>
            <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Documentation
            </div>
            <ul className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              CSV Tables
            </div>
            <ul className="space-y-0.5">
              {tableProfiles.tables.map((t) => {
                const tablePath = `/tables/${t.table_id}`;
                const isActive = location.pathname === tablePath;
                return (
                  <li key={t.table_id}>
                    <NavLink
                      to={tablePath}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{t.filename}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs space-y-1">
          <a
            href="https://www.kaggle.com/competitions/nfl-big-data-bowl-2027"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between text-blue-600 hover:underline font-medium"
          >
            <span>Kaggle Competition</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-sm text-slate-900">NFL Big Data Bowl 2027</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Menu"
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-3">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 px-4 sm:px-8 py-4 text-xs text-slate-500 bg-white">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>NFL Big Data Bowl 2027 — Data Documentation</span>
            <span>Generated from official metadata (`data/metadata/*.json`)</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
