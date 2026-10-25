import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppRoutes } from '../App';
import { fileInventory, tableProfiles } from '../types/metadata';

describe('NFL Big Data Bowl 2027 Documentation Portal', () => {
  it('renders Home page with all 9 official competition files and position groups', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/NFL Big Data Bowl 2027 — Data Architecture & Research Documentation/i)
    ).toBeInTheDocument();

    for (const file of fileInventory.files) {
      expect(screen.getAllByText(file.filename).length).toBeGreaterThan(0);
    }

    for (const pg of ['WR', 'TE', 'DB', 'OL', 'DL']) {
      expect(screen.getAllByText(pg).length).toBeGreaterThan(0);
    }
  });

  it('renders Datasets inventory page and filters by search query', () => {
    render(
      <MemoryRouter initialEntries={['/datasets']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Official Dataset Inventory \(9 Competition Files\)/i)
    ).toBeInTheDocument();

    const searchInput = screen.getByLabelText(/Search datasets/i);
    fireEvent.change(searchInput, { target: { value: 'player_career_successes' } });
    expect(screen.getAllByText('player_career_successes.csv').length).toBeGreaterThan(0);
  });

  it('renders individual Table Detail pages for every discovered competition dataset', () => {
    for (const table of tableProfiles.tables) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[`/tables/${table.table_id}`]}>
          <AppRoutes />
        </MemoryRouter>
      );
      expect(screen.getAllByText(table.filename).length).toBeGreaterThan(0);
      expect(
        screen.getByText(/A. Table Overview & Verification Status/i)
      ).toBeInTheDocument();
      unmount();
    }
  });

  it('renders Global Data Dictionary and supports cross-table search', () => {
    render(
      <MemoryRouter initialEntries={['/dictionary']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Global Data Dictionary/i).length).toBeGreaterThan(0);
    const input = screen.getByLabelText(/Search global dictionary/i);
    fireEvent.change(input, { target: { value: 'fortyYardDash' } });
    expect(screen.getAllByText('fortyYardDash').length).toBeGreaterThan(0);
  });

  it('renders ER Data Model, Research Questions, Feature Engineering, Data Quality, Visual Explorer, Methodology, Sources, and Glossary routes', () => {
    const routes = [
      { path: '/data-model', heading: /Interactive Entity-Relationship Model/i },
      { path: '/research-questions', heading: /Combine-to-NFL Research Hypotheses/i },
      { path: '/feature-engineering', heading: /Feature Engineering Catalog/i },
      { path: '/data-quality', heading: /Data Quality Audit & Structural Tracking Hazards/i },
      { path: '/visual-explorer', heading: /Visual Explorer & Coverage Analytics/i },
      { path: '/methodology', heading: /Research Methodology, Bias Mitigation/i },
      { path: '/sources', heading: /Official Sources, Citations/i },
      { path: '/glossary', heading: /Domain & Technical Glossary/i },
    ];

    for (const r of routes) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[r.path]}>
          <AppRoutes />
        </MemoryRouter>
      );
      expect(screen.getByText(r.heading)).toBeInTheDocument();
      unmount();
    }
  });
});
