# NFL Big Data Bowl 2027 — Data Architecture & Research Documentation Portal

Comprehensive, evidence-labeled data documentation website and reproducible profiling pipeline for the **NFL Big Data Bowl 2027 Kaggle Competition** (`nfl-big-data-bowl-2027`).

## 1. Official Competition & Research Context

- **Official Competition**: [https://www.kaggle.com/competitions/nfl-big-data-bowl-2027](https://www.kaggle.com/competitions/nfl-big-data-bowl-2027)
- **NFL Football Operations Big Data Bowl**: [https://operations.nfl.com/programs-initiatives/innovation/big-data-bowl](https://operations.nfl.com/programs-initiatives/innovation/big-data-bowl)
- **Core Objective**: Uncover non-obvious, actionable linkages between **10 Hz NFL Scouting Combine wearable sensor tracking data** (`combine_tracking.csv`, `combine_results.csv`) and **future regular-season NFL game performance** (`player_play.csv`, `game_tracking_2023/2024/2025.csv`, `player_career_successes.csv`) across five target position groups: **WR, TE, DB, OL, and DL**.

---

## 2. Official Competition Dataset Inventory

The following 9 official competition CSV files were verified via `kaggle competitions files -c nfl-big-data-bowl-2027`:

| Official File | Remote Kaggle Path | Listed Size (Bytes) | Formatted Size | Acquisition Tier |
|---|---|---:|---:|---|
| `player_career_successes.csv` | `nfl-big-data-bowl-2027/player_career_successes.csv` | 13,801 | 13.5 KB | Tier 1 (First Download) |
| `combine_results.csv` | `nfl-big-data-bowl-2027/combine_results.csv` | 41,020 | 40.1 KB | Tier 1 (First Download) |
| `games.csv` | `nfl-big-data-bowl-2027/games.csv` | 43,174 | 42.2 KB | Tier 1 (First Download) |
| `players.csv` | `nfl-big-data-bowl-2027/players.csv` | 47,301 | 46.2 KB | Tier 1 (First Download) |
| `combine_tracking.csv` | `nfl-big-data-bowl-2027/combine_tracking.csv` | 83,788,174 | 79.91 MB | Tier 2 (Selective Medium) |
| `player_play.csv` | `nfl-big-data-bowl-2027/player_play.csv` | 146,879,042 | 140.07 MB | Tier 2 (Selective Medium) |
| `game_tracking_2023.csv` | `nfl-big-data-bowl-2027/game_tracking_2023.csv` | 335,463,637 | 319.92 MB | Tier 3 (Large Tracking) |
| `game_tracking_2024.csv` | `nfl-big-data-bowl-2027/game_tracking_2024.csv` | 717,952,893 | 684.69 MB | Tier 3 (Large Tracking) |
| `game_tracking_2025.csv` | `nfl-big-data-bowl-2027/game_tracking_2025.csv` | 1,022,575,093 | 975.20 MB | Tier 3 (Large Tracking) |

---

## 3. Project Structure

```text
e:\projects\NFL\
├── scripts/
│   ├── common.py                 # Shared constants, official file baseline, credential redaction
│   ├── refresh_inventory.py      # Queries Kaggle CLI & reconciles local data/raw/ status
│   ├── acquire_data.py           # Selective Tier-1 / Tier-2 downloader with safe zip extraction
│   ├── domain_catalog.py         # Evidence-labeled schemas, RQs, features, sources, glossary
│   ├── profile_datasets.py       # Reproducible profiling pipeline generating data/metadata/*.json
│   └── validate_metadata.py      # Schema, completeness, and zero-secret validation checks
├── data/
│   ├── raw/                      # Git-ignored local competition CSVs (.gitkeep only)
│   ├── metadata/                 # Versioned JSON metadata consumed by the React frontend
│   │   ├── file_inventory.json
│   │   ├── table_profiles.json
│   │   ├── column_dictionary.json
│   │   ├── relationships.json
│   │   ├── data_quality.json
│   │   └── analysis_catalog.json
│   └── reports/
│       └── profiling_summary.md  # Human-readable profiling & verification summary
├── src/                          # TypeScript + React + Tailwind documentation website
│   ├── components/               # Layout, EvidenceBadge, CopyButton
│   ├── pages/                    # 12 required routes (Home, Datasets, TableDetail, Dictionary, etc.)
│   ├── types/                    # Strongly typed interfaces bound to data/metadata/*.json
│   └── test/                     # Vitest + React Testing Library route & component tests
├── tests/
│   └── test_metadata_pipeline.py # Python unittest suite for profiling & security rules
└── docs/
    ├── DATA_PIPELINE_AND_SCHEMA.md
    └── WINDOWS_KAGGLE_AUTH_GUIDE.md
```

---

## 4. Quick Start (Windows PowerShell or Command Prompt)

### A. Start the Documentation Website (Development Server)

```powershell
npm install
npm run dev
```

### B. Build for Production & Run All Tests

```powershell
# Run Python metadata & security tests
npm run test:data

# Run Frontend Vitest suite
npm test

# Build production static bundle into dist/
npm run build
```

### C. Selectively Download Competition Data & Regenerate Metadata

> **Windows Authentication Note**: If you authenticated via `set KAGGLE_API_TOKEN=...` inside a specific Command Prompt (`cmd.exe`) window, that environment variable is scoped to that `cmd.exe` process. Run the commands below inside that authenticated Command Prompt window (or run `kaggle auth login` once to cache OAuth credentials locally):

```powershell
# 1. Download Tier-1 small reference & outcome files (~145 KB total):
#    players.csv, games.csv, combine_results.csv, player_career_successes.csv
python scripts/acquire_data.py --tier tier1

# 2. (Optional) Download Tier-2 Combine tracking & player-play files (~220 MB):
python scripts/acquire_data.py --tier tier2

# 3. Re-run the profiling pipeline to update all JSON metadata & reports from local CSVs:
python scripts/profile_datasets.py

# 4. Validate generated metadata schema and security rules:
python scripts/validate_metadata.py
```

---

## 5. Security & Git Safety Guarantees

- **Zero Runtime Credentials**: The frontend application reads only static generated metadata under `data/metadata/*.json` and never touches `~/.kaggle` or environment variables.
- **Automatic Secret Redaction**: `scripts/common.py` strips any token patterns (`KGAT_...`, `KAGGLE_API_TOKEN`, `KAGGLE_KEY`) from CLI diagnostic outputs.
- **Strict `.gitignore`**: Raw CSVs (`data/raw/*`), `.zip` archives, `.kaggle/`, `kaggle.json`, `access_token`, and `.env` files are excluded from Git version control.
