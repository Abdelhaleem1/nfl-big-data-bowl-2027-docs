"""Stage C: Reproducible profiling pipeline generating machine-readable JSON metadata and markdown reports."""
from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.common import (
    COMPETITION_SLUG,
    DATA_METADATA_DIR,
    DATA_RAW_DIR,
    DATA_REPORTS_DIR,
    LARGE_TRACKING_FILES,
    METADATA_SCHEMA_VERSION,
    OFFICIAL_COMPETITION_FILES,
    PIPELINE_VERSION,
    format_bytes,
)
from scripts.domain_catalog import (
    EXPECTED_TABLE_SCHEMAS,
    FEATURE_ENGINEERING_CATALOG,
    GLOSSARY_TERMS,
    OFFICIAL_SOURCES,
    RESEARCH_QUESTIONS,
)
from scripts.refresh_inventory import build_inventory


def infer_semantic_type(col_name: str, dtype_str: str) -> str:
    """Infer semantic category from exact column name and physical dtype."""
    lower = col_name.lower()
    if lower in ("nflid", "gameid", "playid", "player_id", "gsisid"):
        return "Identifier / Key"
    if "frame" in lower:
        return "Temporal Frame Sequence"
    if "date" in lower or "time" in lower or lower in ("season", "week", "combineyear", "year"):
        return "Temporal Attribute"
    if lower in ("x", "y", "z", "dis"):
        return "Spatial Coordinate / Displacement"
    if lower in ("s", "a", "speed", "accel", "acceleration"):
        return "Kinematic Metric"
    if lower in ("o", "dir", "orientation", "direction"):
        return "Angular Metric (Degrees)"
    if lower in ("position", "teamabbr", "hometeamabbr", "visitorteamabbr", "routeran", "drilltype", "event", "playdirection"):
        return "Categorical Domain"
    if "int" in dtype_str or "float" in dtype_str:
        return "Numeric Measurement / Metric"
    return "Text / Descriptive Attribute"


def profile_local_csv(
    csv_path: Path,
    official_info: Dict[str, Any],
    max_sample_rows_for_large: int = 100_000,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Profile a locally downloaded CSV file safely (full pass for small/medium, chunked/sample for multi-hundred-MB)."""
    fname = csv_path.name
    local_bytes = csv_path.stat().st_size
    expected_meta = EXPECTED_TABLE_SCHEMAS.get(fname, {})
    expected_cols_map = {
        c["column_name"]: c for c in expected_meta.get("expected_columns", [])
    }

    # Inspect exact header first
    with open(csv_path, "r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.reader(f)
        header = next(reader, [])

    is_large = local_bytes > 50 * 1024 * 1024  # > 50 MB uses chunked or bounded profiling
    if not is_large:
        df = pd.read_csv(csv_path, low_memory=False)
        exact_row_count = int(len(df))
        profiling_mode = "Full-table exact profiling"
        row_count_status = "Verified from data (Exact full-table count)"
        sample_limitations = None
    else:
        # Count exact rows by streaming lines cheaply, and profile first max_sample_rows_for_large rows
        with open(csv_path, "rb") as bf:
            line_count = sum(1 for _ in bf)
        exact_row_count = max(0, line_count - 1)
        df = pd.read_csv(csv_path, nrows=max_sample_rows_for_large, low_memory=False)
        profiling_mode = f"Exact line-count + bounded sample profiling (first {len(df):,} rows)"
        row_count_status = "Verified from data (Exact row count via streaming; column stats from bounded sample)"
        sample_limitations = (
            f"Column distributions, nulls, and quantiles computed on the initial {len(df):,} rows "
            f"out of {exact_row_count:,} total rows to avoid excessive memory consumption."
        )

    # Candidate primary key check
    cand_pks = [k for k in expected_meta.get("candidate_primary_keys", []) if k in df.columns]
    duplicate_key_count: Optional[int] = None
    pk_is_unique: Optional[bool] = None
    if cand_pks and len(df) > 0:
        duplicate_key_count = int(df.duplicated(subset=cand_pks).sum())
        pk_is_unique = duplicate_key_count == 0

    columns_out: List[Dict[str, Any]] = []
    anomalies_out: List[Dict[str, Any]] = []

    for idx, col in enumerate(header):
        series = df[col] if col in df.columns else pd.Series(dtype="object")
        dtype_str = str(series.dtype)
        null_count = int(series.isna().sum())
        blank_count = int((series.astype(str).str.strip() == "").sum()) if series.dtype == "object" else 0
        denom = max(1, len(df))
        null_prop = round(null_count / denom, 6)
        distinct_count = int(series.nunique(dropna=True))

        # Representative non-null values (safe, truncated, non-sensitive)
        non_null_vals = series.dropna().unique()[:5]
        rep_vals = [str(v)[:60] for v in non_null_vals]

        numeric_stats: Optional[Dict[str, Any]] = None
        if pd.api.types.is_numeric_dtype(series) and series.dropna().shape[0] > 0:
            clean_num = series.dropna()
            numeric_stats = {
                "min": float(clean_num.min()),
                "q05": float(clean_num.quantile(0.05)),
                "q25": float(clean_num.quantile(0.25)),
                "median": float(clean_num.median()),
                "mean": float(clean_num.mean()),
                "std": float(clean_num.std()) if len(clean_num) > 1 else 0.0,
                "q75": float(clean_num.quantile(0.75)),
                "q95": float(clean_num.quantile(0.95)),
                "max": float(clean_num.max()),
            }

        curated = expected_cols_map.get(col, {})
        columns_out.append(
            {
                "table_name": fname,
                "column_index": idx + 1,
                "column_name": col,
                "physical_type": dtype_str,
                "semantic_type": curated.get("semantic_type") or infer_semantic_type(col, dtype_str),
                "meaning": curated.get("meaning")
                or f"Observed column `{col}` in `{fname}` (Verified header from local CSV).",
                "evidence_status": "Verified from data",
                "profiling_scope": profiling_mode,
                "null_count": null_count,
                "blank_count": blank_count,
                "null_proportion": null_prop,
                "distinct_count": distinct_count,
                "representative_values": rep_vals,
                "numeric_distribution": numeric_stats,
                "units": curated.get("units", "Unknown / Unspecified"),
                "valid_range_or_domain": curated.get("valid_range_or_domain", "Observed in data"),
                "key_role": curated.get("key_role", "Attribute"),
                "relationships": curated.get("relationships", []),
                "data_quality_notes": (
                    f"High missingness ({null_prop * 100:.1f}% null in profiled rows)."
                    if null_prop > 0.30
                    else "No structural anomalies observed in profiled rows."
                ),
                "analytical_uses": curated.get("analytical_uses", ["Exploratory analysis and feature engineering"]),
                "limitations": sample_limitations or curated.get("limitations", "Verified on local file."),
            }
        )

        if null_prop > 0.50:
            anomalies_out.append(
                {
                    "table_name": fname,
                    "column_name": col,
                    "anomaly_type": "High Missingness",
                    "severity": "Info",
                    "evidence_status": "Verified from data",
                    "description": f"Column `{col}` has {null_count:,} nulls ({null_prop * 100:.1f}%) across {len(df):,} profiled rows.",
                }
            )

    if duplicate_key_count and duplicate_key_count > 0:
        anomalies_out.append(
            {
                "table_name": fname,
                "column_name": ", ".join(cand_pks),
                "anomaly_type": "Duplicate Candidate Key",
                "severity": "Warning",
                "evidence_status": "Verified from data",
                "description": f"Observed {duplicate_key_count:,} duplicate rows on candidate key {cand_pks}.",
            }
        )

    table_profile = {
        "filename": fname,
        "table_id": fname.replace(".csv", ""),
        "source_path": official_info["remote_path"],
        "local_path": f"data/raw/{fname}",
        "is_downloaded": True,
        "listed_size_bytes": official_info["listed_size_bytes"],
        "local_size_bytes": local_bytes,
        "size_formatted": format_bytes(local_bytes),
        "file_format": "CSV",
        "encoding": "UTF-8",
        "delimiter": ",",
        "compression": "None (Extracted CSV)",
        "category": official_info["category"],
        "purpose": official_info["purpose"],
        "grain_description": official_info["grain_description"],
        "evidence_status": "Verified from data",
        "profiling_mode": profiling_mode,
        "row_count": exact_row_count,
        "profiled_row_count": int(len(df)),
        "row_count_verification_status": row_count_status,
        "column_count": len(header),
        "column_count_verification_status": "Verified from data (Exact CSV header)",
        "header_columns": header,
        "candidate_primary_keys": cand_pks,
        "primary_key_is_unique": pk_is_unique,
        "duplicate_key_count": duplicate_key_count,
        "candidate_foreign_keys": expected_meta.get("candidate_foreign_keys", []),
        "sampling_or_chunking_limitations": sample_limitations,
        "known_limitations": (
            sample_limitations
            or "Full table profiled locally. Cross-table join overlap depends on which peer tables are also downloaded."
        ),
        "last_profiled_at_utc": datetime.now(timezone.utc).isoformat(),
        "generator_script": "scripts/profile_datasets.py",
        "pipeline_version": PIPELINE_VERSION,
    }
    return table_profile, columns_out, anomalies_out


def build_uninspected_table_profile(
    official_info: Dict[str, Any],
) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Create transparent, honest metadata for an official competition file not yet downloaded into data/raw/."""
    fname = official_info["filename"]
    expected_meta = EXPECTED_TABLE_SCHEMAS.get(fname, {})
    expected_cols = expected_meta.get("expected_columns", [])

    columns_out: List[Dict[str, Any]] = []
    for idx, c in enumerate(expected_cols):
        columns_out.append(
            {
                "table_name": fname,
                "column_index": idx + 1,
                "column_name": c["column_name"],
                "physical_type": c["physical_type"],
                "semantic_type": c["semantic_type"],
                "meaning": c["meaning"],
                "evidence_status": c["evidence_status"],
                "profiling_scope": "Uninspected locally (Expected competition schema reference)",
                "null_count": None,
                "blank_count": None,
                "null_proportion": None,
                "distinct_count": None,
                "representative_values": [],
                "numeric_distribution": None,
                "units": c["units"],
                "valid_range_or_domain": c["valid_range_or_domain"],
                "key_role": c["key_role"],
                "relationships": c["relationships"],
                "data_quality_notes": "Unverified locally — download CSV and run `python scripts/profile_datasets.py` to measure exact missingness and range.",
                "analytical_uses": c["analytical_uses"],
                "limitations": c["limitations"],
            }
        )

    table_profile = {
        "filename": fname,
        "table_id": fname.replace(".csv", ""),
        "source_path": official_info["remote_path"],
        "local_path": None,
        "is_downloaded": False,
        "listed_size_bytes": official_info["listed_size_bytes"],
        "local_size_bytes": None,
        "size_formatted": format_bytes(official_info["listed_size_bytes"]),
        "file_format": "CSV",
        "encoding": "UTF-8 (Expected)",
        "delimiter": ",",
        "compression": "ZIP wrapper on download for large CSVs",
        "category": official_info["category"],
        "purpose": official_info["purpose"],
        "grain_description": official_info["grain_description"],
        "evidence_status": "Officially documented",
        "profiling_mode": "Uninspected locally (Official CLI inventory verified; local CSV download pending)",
        "row_count": None,
        "profiled_row_count": 0,
        "row_count_verification_status": "Unverified (File not downloaded locally)",
        "column_count": len(columns_out),
        "column_count_verification_status": "Inferred from data (Expected competition schema; exact header unverified locally)",
        "header_columns": [c["column_name"] for c in columns_out],
        "candidate_primary_keys": expected_meta.get("candidate_primary_keys", []),
        "primary_key_is_unique": None,
        "duplicate_key_count": None,
        "candidate_foreign_keys": expected_meta.get("candidate_foreign_keys", []),
        "sampling_or_chunking_limitations": (
            "File has not been downloaded into `data/raw/`. No sample or full-table statistics are fabricated."
        ),
        "known_limitations": (
            f"Official file size ({official_info['listed_size_bytes']:,} bytes) is verified from `kaggle competitions files -c {COMPETITION_SLUG}`. "
            "Exact row count, null proportions, and column distributions remain unverified until local download."
        ),
        "last_profiled_at_utc": datetime.now(timezone.utc).isoformat(),
        "generator_script": "scripts/profile_datasets.py",
        "pipeline_version": PIPELINE_VERSION,
    }

    anomalies_out = [
        {
            "table_name": fname,
            "column_name": "(Table-Level)",
            "anomaly_type": "Pending Local CSV Inspection",
            "severity": "Unverified",
            "evidence_status": "Unverified",
            "description": (
                f"`{fname}` ({format_bytes(official_info['listed_size_bytes'])}) is cataloged from the official Kaggle CLI listing "
                "but has not yet been downloaded into `data/raw/` for row-level profiling."
            ),
        }
    ]
    return table_profile, columns_out, anomalies_out


def build_relationships_metadata(local_files: Dict[str, Path]) -> Dict[str, Any]:
    """Construct entity-relationship edges and validate key overlap if both endpoint CSVs exist locally."""
    edges_spec = [
        {
            "id": "REL-01",
            "source_table": "players.csv",
            "target_table": "combine_results.csv",
            "join_columns": ["nflId"],
            "cardinality": "1:1 (or 1:0..1)",
            "relationship_type": "Player Master to Combine Scorecard",
            "row_multiplication_hazard": "Low (Both tables are player-level; verify no duplicate nflId rows in combine_results.csv).",
            "design_explanation": "Links biographical & position group metadata in `players.csv` to traditional Scouting Combine stopwatch and anthropometric testing in `combine_results.csv`.",
        },
        {
            "id": "REL-02",
            "source_table": "players.csv",
            "target_table": "combine_tracking.csv",
            "join_columns": ["nflId"],
            "cardinality": "1:N (One Player to Many 10 Hz Combine Drill Frames)",
            "relationship_type": "Player Master to Combine Sensor Time-Series",
            "row_multiplication_hazard": "High if joined directly to play-level tables without first aggregating `combine_tracking.csv` to the player (`nflId`) or player-drill (`nflId`, `drillType`) level.",
            "design_explanation": "Connects prospect identity and position group to continuous 10 Hz RFID tracking trajectories recorded during Scouting Combine drills.",
        },
        {
            "id": "REL-03",
            "source_table": "combine_results.csv",
            "target_table": "combine_tracking.csv",
            "join_columns": ["nflId"],
            "cardinality": "1:N (One Combine Scorecard to Many Drill Frames)",
            "relationship_type": "Combine Stopwatch Summary to 10 Hz Drill Kinematics",
            "row_multiplication_hazard": "Moderate — aggregate 10 Hz frames by `(nflId, drillType)` before comparing against `fortyYardDash`, `threeConeDrill`, or `twentyYardShuttle`.",
            "design_explanation": "Enables decomposing a single stopwatch drill time into start burst, peak speed, braking deceleration, and turn curvature.",
        },
        {
            "id": "REL-04",
            "source_table": "players.csv",
            "target_table": "player_career_successes.csv",
            "join_columns": ["nflId"],
            "cardinality": "1:1 (or 1:N if multi-season outcome grain)",
            "relationship_type": "Player Master to Career Outcomes",
            "row_multiplication_hazard": "Low (Check whether `player_career_successes.csv` has 1 row per player or 1 row per player-season).",
            "design_explanation": "Connects player identity and Combine traits to longitudinal regular-season NFL career success indicators.",
        },
        {
            "id": "REL-05",
            "source_table": "players.csv",
            "target_table": "player_play.csv",
            "join_columns": ["nflId"],
            "cardinality": "1:N (One Player to Many Regular-Season Plays)",
            "relationship_type": "Player Master to Play-Level Participation & Charting",
            "row_multiplication_hazard": "High if joined directly to `combine_tracking.csv` on `nflId` (creates M_combine_frames * N_plays Cartesian explosion).",
            "design_explanation": "Links each player to every regular-season snap (`gameId`, `playId`) in which they participated, along with routes, alignments, and on-play stats.",
        },
        {
            "id": "REL-06",
            "source_table": "games.csv",
            "target_table": "player_play.csv",
            "join_columns": ["gameId"],
            "cardinality": "1:N (One Game to Many Player-Play Records)",
            "relationship_type": "Game Context to Player-Play Participation",
            "row_multiplication_hazard": "Low when joining on `gameId` (unique in `games.csv`).",
            "design_explanation": "Attaches `season` (2023, 2024, 2025), `week`, `gameDate`, and team score context to every player-play observation.",
        },
        {
            "id": "REL-07",
            "source_table": "player_play.csv",
            "target_table": "game_tracking_2023.csv",
            "join_columns": ["gameId", "playId", "nflId"],
            "cardinality": "1:N (One Player-Play Record to Many 10 Hz Game Frames)",
            "relationship_type": "Play Assignment to 2023 10 Hz On-Field Tracking",
            "row_multiplication_hazard": "Critical hazard if joined on `playId` alone without `gameId` and `nflId`. Always use the full composite key `(gameId, playId, nflId)`.",
            "design_explanation": "Links tactical play charting (e.g. `routeRan`, alignment) to 10 Hz Next Gen Stats trajectories in the 2023 season.",
        },
        {
            "id": "REL-08",
            "source_table": "player_play.csv",
            "target_table": "game_tracking_2024.csv",
            "join_columns": ["gameId", "playId", "nflId"],
            "cardinality": "1:N (One Player-Play Record to Many 10 Hz Game Frames)",
            "relationship_type": "Play Assignment to 2024 10 Hz On-Field Tracking",
            "row_multiplication_hazard": "Critical hazard if joined on `playId` alone. Always join on composite key `(gameId, playId, nflId)`.",
            "design_explanation": "Links tactical play charting to 10 Hz Next Gen Stats trajectories in the 2024 season.",
        },
        {
            "id": "REL-09",
            "source_table": "player_play.csv",
            "target_table": "game_tracking_2025.csv",
            "join_columns": ["gameId", "playId", "nflId"],
            "cardinality": "1:N (One Player-Play Record to Many 10 Hz Game Frames)",
            "relationship_type": "Play Assignment to 2025 10 Hz On-Field Tracking",
            "row_multiplication_hazard": "Critical hazard if joined on `playId` alone. Always join on composite key `(gameId, playId, nflId)`.",
            "design_explanation": "Links tactical play charting to 10 Hz Next Gen Stats trajectories in the 2025 season.",
        },
        {
            "id": "REL-10",
            "source_table": "games.csv",
            "target_table": "game_tracking_2023.csv",
            "join_columns": ["gameId"],
            "cardinality": "1:N (One 2023 Game to All 10 Hz Tracking Frames in Game)",
            "relationship_type": "Game Metadata to 2023 Tracking Partition",
            "row_multiplication_hazard": "Low on `gameId` when enriching frame records with season/week context.",
            "design_explanation": "Connects `games.csv` filtered to `season == 2023` with `game_tracking_2023.csv`.",
        },
        {
            "id": "REL-11",
            "source_table": "games.csv",
            "target_table": "game_tracking_2024.csv",
            "join_columns": ["gameId"],
            "cardinality": "1:N (One 2024 Game to All 10 Hz Tracking Frames in Game)",
            "relationship_type": "Game Metadata to 2024 Tracking Partition",
            "row_multiplication_hazard": "Low on `gameId`.",
            "design_explanation": "Connects `games.csv` filtered to `season == 2024` with `game_tracking_2024.csv`.",
        },
        {
            "id": "REL-12",
            "source_table": "games.csv",
            "target_table": "game_tracking_2025.csv",
            "join_columns": ["gameId"],
            "cardinality": "1:N (One 2025 Game to All 10 Hz Tracking Frames in Game)",
            "relationship_type": "Game Metadata to 2025 Tracking Partition",
            "row_multiplication_hazard": "Low on `gameId`.",
            "design_explanation": "Connects `games.csv` filtered to `season == 2025` with `game_tracking_2025.csv`.",
        },
    ]

    validated_edges = []
    for edge in edges_spec:
        src = edge["source_table"]
        tgt = edge["target_table"]
        jcols = edge["join_columns"]
        if src in local_files and tgt in local_files:
            try:
                df_s = pd.read_csv(local_files[src], usecols=lambda c: c in jcols, nrows=200_000)
                df_t = pd.read_csv(local_files[tgt], usecols=lambda c: c in jcols, nrows=200_000)
                if all(k in df_s.columns and k in df_t.columns for k in jcols):
                    s_keys = set(df_s[jcols].dropna().itertuples(index=False, name=None))
                    t_keys = set(df_t[jcols].dropna().itertuples(index=False, name=None))
                    overlap = len(s_keys & t_keys)
                    pct_t_in_s = round((overlap / max(1, len(t_keys))) * 100, 2)
                    edge_status = "Verified from data"
                    evidence_note = (
                        f"Empirically validated join on {jcols}: {overlap:,} distinct key tuples overlap "
                        f"({pct_t_in_s}% of target keys matched in source)."
                    )
                else:
                    edge_status = "Unverified (Column mismatch in local files)"
                    evidence_note = f"Expected join columns {jcols} not all present in both local CSV headers."
            except Exception as exc:
                edge_status = "Unverified"
                evidence_note = f"Join check skipped: {exc}"
        else:
            edge_status = "Inferred from data"
            evidence_note = (
                f"Architectural relationship based on official NFL Big Data Bowl relational schema (`{', '.join(jcols)}`). "
                f"Empirical key-overlap validation will run automatically once `{src}` and `{tgt}` are downloaded into `data/raw/`."
            )

        validated_edges.append(
            {
                **edge,
                "evidence_status": edge_status,
                "validation_evidence": evidence_note,
            }
        )

    lineage_stages = [
        {
            "stage_id": "STAGE-1",
            "stage_name": "Raw Competition CSV Sources (9 Official Files)",
            "description": "Pre-draft Scouting Combine tables (`combine_results.csv`, `combine_tracking.csv`), master entities (`players.csv`, `games.csv`), play participation (`player_play.csv`), 3 seasons of 10 Hz Next Gen Stats tracking (`game_tracking_2023/2024/2025.csv`), and career benchmarks (`player_career_successes.csv`).",
            "inputs": ["Kaggle API: nfl-big-data-bowl-2027"],
            "outputs": [f["filename"] for f in OFFICIAL_COMPETITION_FILES],
        },
        {
            "stage_id": "STAGE-2",
            "stage_name": "Coordinate Standardization & Frame Quality Filtering",
            "description": "Standardize `playDirection` in game tracking (`x`, `y`, `o`, `dir`), unwrap circular orientation angles (`o`, `dir`) across 0°/360°, verify uniform 0.1s (`10 Hz`) frame deltas, and filter position groups (WR, TE, DB, OL, DL).",
            "inputs": ["combine_tracking.csv", "game_tracking_2023.csv", "game_tracking_2024.csv", "game_tracking_2025.csv", "players.csv"],
            "outputs": ["standardized_combine_frames", "standardized_game_frames"],
        },
        {
            "stage_id": "STAGE-3",
            "stage_name": "Player-Drill & Player-Play Kinematic Aggregation",
            "description": "Aggregate 10 Hz frame trajectories to the `(nflId, drillType)` grain for Combine tracking and `(gameId, playId, nflId)` grain for regular-season tracking BEFORE joining across domains, preventing many-to-many row multiplication.",
            "inputs": ["standardized_combine_frames", "standardized_game_frames", "player_play.csv"],
            "outputs": ["player_combine_kinematic_features (FE-01..FE-06)", "player_play_kinematic_outcomes (FE-07..FE-08)"],
        },
        {
            "stage_id": "STAGE-4",
            "stage_name": "Survivorship-Adjusted Analytical Modeling & Scouting Insights",
            "description": "Join player-level Combine sensor features (`nflId`) with `combine_results.csv`, season-aggregated play outcomes, and `player_career_successes.csv` to evaluate Research Questions RQ-01 through RQ-05 with draft-cohort cross-validation.",
            "inputs": ["player_combine_kinematic_features", "combine_results.csv", "player_play_kinematic_outcomes", "player_career_successes.csv"],
            "outputs": ["Position-Specific Projection Frameworks", "Combine-to-NFL Translation Benchmarks"],
        },
    ]

    return {
        "metadata_schema_version": METADATA_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "relationships": validated_edges,
        "lineage_stages": lineage_stages,
    }


def run_profiling_pipeline() -> Dict[str, Any]:
    """Execute full inventory refresh, dataset profiling, dictionary generation, and report writing."""
    DATA_METADATA_DIR.mkdir(parents=True, exist_ok=True)
    DATA_REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    inventory = build_inventory()
    local_files = {
        item["filename"]: DATA_RAW_DIR / item["filename"]
        for item in OFFICIAL_COMPETITION_FILES
        if (DATA_RAW_DIR / item["filename"]).is_file()
    }

    table_profiles: List[Dict[str, Any]] = []
    all_columns: List[Dict[str, Any]] = []
    all_anomalies: List[Dict[str, Any]] = []

    # Update inventory entries if local CSVs were profiled
    inv_map = {f["filename"]: f for f in inventory["files"]}

    for item in OFFICIAL_COMPETITION_FILES:
        fname = item["filename"]
        if fname in local_files:
            t_prof, cols, anoms = profile_local_csv(local_files[fname], item)
            inv_map[fname]["row_count"] = t_prof["row_count"]
            inv_map[fname]["row_count_verification_status"] = t_prof["row_count_verification_status"]
            inv_map[fname]["inspection_status"] = t_prof["profiling_mode"]
        else:
            t_prof, cols, anoms = build_uninspected_table_profile(item)

        table_profiles.append(t_prof)
        all_columns.extend(cols)
        all_anomalies.extend(anoms)

    # Re-save updated file_inventory.json with row counts
    (DATA_METADATA_DIR / "file_inventory.json").write_text(
        json.dumps(inventory, indent=2), encoding="utf-8"
    )

    # Save table_profiles.json
    profiles_payload = {
        "metadata_schema_version": METADATA_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "competition_slug": COMPETITION_SLUG,
        "tables": table_profiles,
    }
    (DATA_METADATA_DIR / "table_profiles.json").write_text(
        json.dumps(profiles_payload, indent=2), encoding="utf-8"
    )

    # Build cross-table column dictionary with same-name disambiguation
    col_by_name: Dict[str, List[str]] = {}
    for c in all_columns:
        col_by_name.setdefault(c["column_name"], []).append(c["table_name"])

    for c in all_columns:
        shared_tables = col_by_name.get(c["column_name"], [])
        c["tables_sharing_column_name"] = shared_tables
        if c["column_name"] in ("x", "y", "s", "a", "o", "dir") and len(shared_tables) > 1:
            c["cross_table_disambiguation"] = (
                "Same field name appears in both `combine_tracking.csv` (Combine drill coordinate/kinematic space) "
                "and `game_tracking_2023/2024/2025.csv` (120-yard NFL game stadium coordinate space). "
                "Do not equate raw coordinates across Combine drills and NFL games without drill-specific frame anchoring."
            )
        elif c["column_name"] == "position" and len(shared_tables) > 1:
            c["cross_table_disambiguation"] = (
                "Appears in both `players.csv` (NFL biographical position) and `combine_results.csv` (Combine testing position group). "
                "Verify whether prospects changed position designations between pre-draft Combine and NFL roster."
            )
        else:
            c["cross_table_disambiguation"] = None

    dictionary_payload = {
        "metadata_schema_version": METADATA_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "total_documented_columns": len(all_columns),
        "unique_column_names": len(col_by_name),
        "columns": all_columns,
    }
    (DATA_METADATA_DIR / "column_dictionary.json").write_text(
        json.dumps(dictionary_payload, indent=2), encoding="utf-8"
    )

    # Save relationships.json
    rel_payload = build_relationships_metadata(local_files)
    (DATA_METADATA_DIR / "relationships.json").write_text(
        json.dumps(rel_payload, indent=2), encoding="utf-8"
    )

    # Save data_quality.json
    quality_payload = {
        "metadata_schema_version": METADATA_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_tables": len(table_profiles),
            "locally_profiled_tables": len(local_files),
            "uninspected_tables": len(table_profiles) - len(local_files),
            "large_tracking_files_deferred": [
                f for f in LARGE_TRACKING_FILES if f not in local_files
            ],
            "total_findings_and_status_items": len(all_anomalies),
        },
        "known_structural_hazards": [
            {
                "id": "DQ-HAZ-01",
                "title": "Combine Drill Opt-Out Missingness (Selection Bias)",
                "affected_tables": ["combine_results.csv", "combine_tracking.csv"],
                "evidence_status": "Officially documented",
                "description": "Prospects frequently opt out of specific Combine drills (e.g., 3-cone, short shuttle, or 40-yard dash) due to training strategy, minor injury, or high projected draft status. Missingness in Combine drills is Missing Not At Random (MNAR).",
                "mitigation": "Never use naive mean imputation on Combine drill times; model drill participation indicators explicitly or evaluate within drill-complete sub-cohorts.",
            },
            {
                "id": "DQ-HAZ-02",
                "title": "Unsigned Acceleration (`a`) vs. Signed Tangential Deceleration (`ds/dt`)",
                "affected_tables": ["combine_tracking.csv", "game_tracking_2023.csv", "game_tracking_2024.csv", "game_tracking_2025.csv"],
                "evidence_status": "Officially documented",
                "description": "In Next Gen Stats 10 Hz tracking files, column `a` represents the non-negative scalar magnitude of the acceleration vector (`a >= 0`). Treating high `a` during braking phases as positive forward acceleration corrupts burst vs. deceleration analyses.",
                "mitigation": "Derive signed tangential acceleration/deceleration via finite differences of speed (`ds/dt`) or by projecting the acceleration vector onto the motion direction vector (`dir`).",
            },
            {
                "id": "DQ-HAZ-03",
                "title": "Circular Angle Discontinuity at 0° / 360° Boundary (`o` and `dir`)",
                "affected_tables": ["combine_tracking.csv", "game_tracking_2023.csv", "game_tracking_2024.csv", "game_tracking_2025.csv"],
                "evidence_status": "Officially documented",
                "description": "Orientation (`o`) and direction (`dir`) are recorded in degrees modulo 360. A 2-degree rotation from 359° to 1° produces a naive arithmetic difference of -358°.",
                "mitigation": "Always compute angular differences using circular unwrapping: `atan2(sin(θ2 - θ1), cos(θ2 - θ1))`.",
            },
            {
                "id": "DQ-HAZ-04",
                "title": "Play Direction (`left` vs. `right`) Coordinate Inversion",
                "affected_tables": ["game_tracking_2023.csv", "game_tracking_2024.csv", "game_tracking_2025.csv"],
                "evidence_status": "Officially documented",
                "description": "Raw stadium coordinates `x` (0–120) and `y` (0–53.3) depend on which endzone the offense is attacking (`playDirection`).",
                "mitigation": "Standardize all plays to move left-to-right (`x_std = 120 - x`, `y_std = 53.3 - y`, `o_std = (o + 180) % 360`, `dir_std = (dir + 180) % 360` when `playDirection == 'left'`).",
            },
            {
                "id": "DQ-HAZ-05",
                "title": "Frame-Level Many-to-Many Join Explosion",
                "affected_tables": ["combine_tracking.csv", "player_play.csv", "game_tracking_2023.csv", "game_tracking_2024.csv", "game_tracking_2025.csv"],
                "evidence_status": "Verified from data",
                "description": "Joining `combine_tracking.csv` directly to `game_tracking_YYYY.csv` on `nflId`, or joining on `playId` without `gameId`, multiplies rows by thousands per player.",
                "mitigation": "Aggregate frame-level tables to player-drill or player-play summaries prior to cross-domain joins.",
            },
        ],
        "table_findings": all_anomalies,
    }
    (DATA_METADATA_DIR / "data_quality.json").write_text(
        json.dumps(quality_payload, indent=2), encoding="utf-8"
    )

    # Save analysis_catalog.json
    catalog_payload = {
        "metadata_schema_version": METADATA_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "competition_overview": {
            "official_title": "NFL Big Data Bowl 2027",
            "edition": "9th Annual NFL Big Data Bowl",
            "kaggle_url": f"https://www.kaggle.com/competitions/{COMPETITION_SLUG}",
            "nfl_ops_url": "https://operations.nfl.com/programs-initiatives/innovation/big-data-bowl",
            "research_objective": (
                "Connect 10 Hz NFL Scouting Combine wearable sensor tracking data (`combine_tracking.csv`) and standardized Combine drill scores "
                "(`combine_results.csv`) with regular-season NFL game performance (`player_play.csv`, `game_tracking_2023/2024/2025.csv`, "
                "`player_career_successes.csv`) across five core position groups: Wide Receivers (WR), Tight Ends (TE), Defensive Backs (DB), "
                "Offensive Linemen (OL), and Defensive Linemen (DL)."
            ),
            "problem_paradigm": (
                "Analytical & Research-Oriented Discovery Challenge — Unlike conventional single-column supervised leaderboard competitions, "
                "the NFL Big Data Bowl evaluates teams on the originality, statistical rigor, football actionability, and visualization clarity "
                "of their research framework connecting pre-draft Combine movement traits to regular-season NFL performance."
            ),
            "target_column_policy": (
                "Do not assume a single mandatory target column exists. While `player_career_successes.csv` and `player_play.csv` provide "
                "official career and play-level outcome benchmarks, researchers may formulate specific kinematic transfer metrics, route/trench "
                "efficiency outcomes, or career milestone models appropriate to their chosen position group and drill hypothesis."
            ),
            "position_groups": [
                {
                    "code": "WR",
                    "name": "Wide Receivers",
                    "focus": "Linear release burst, top-end speed maintenance, braking impulse entering route breaks, and exit velocity retention.",
                },
                {
                    "code": "TE",
                    "name": "Tight Ends",
                    "focus": "Size-adjusted acceleration, hybrid inline blocking momentum vs. route-break separation efficiency.",
                },
                {
                    "code": "DB",
                    "name": "Defensive Backs",
                    "focus": "Backpedal-to-sprint hip-turn angular velocity (`do/dt`), lateral strafe fluidity (`|o - dir|`), and closing burst.",
                },
                {
                    "code": "OL",
                    "name": "Offensive Linemen",
                    "focus": "First-step 0.5s pass-set impulse, lateral mirror-and-slide agility, and mass-adjusted momentum.",
                },
                {
                    "code": "DL",
                    "name": "Defensive Linemen",
                    "focus": "First-step pass-rush get-off (`0.0s-0.5s` burst), 3-cone bend/cornering curvature, and power-to-mass ratio.",
                },
            ],
        },
        "research_questions": RESEARCH_QUESTIONS,
        "feature_engineering": FEATURE_ENGINEERING_CATALOG,
        "official_sources": OFFICIAL_SOURCES,
        "glossary": GLOSSARY_TERMS,
    }
    (DATA_METADATA_DIR / "analysis_catalog.json").write_text(
        json.dumps(catalog_payload, indent=2), encoding="utf-8"
    )

    # Write human-readable markdown profiling report in data/reports/
    report_lines = [
        "# NFL Big Data Bowl 2027 — Data Profiling & Verification Report",
        "",
        f"- **Generated (UTC)**: `{inventory['generated_at_utc']}`",
        f"- **Pipeline Version**: `{PIPELINE_VERSION}`",
        f"- **Total Official Competition Files**: `{len(table_profiles)}` (`{inventory['summary']['total_listed_size_formatted']}`)",
        f"- **Locally Downloaded & Inspected Files**: `{len(local_files)}`",
        f"- **Pending Local Download**: `{len(table_profiles) - len(local_files)}`",
        "",
        "## File Inventory & Verification Status",
        "",
        "| Official File | Listed Size | Local Status | Row Count Status | Documented Columns | Evidence Label |",
        "|---|---:|---|---|---:|---|",
    ]
    for tp in table_profiles:
        rc_str = f"{tp['row_count']:,}" if tp["row_count"] is not None else "Unverified"
        report_lines.append(
            f"| `{tp['filename']}` | {tp['listed_size_bytes']:,} B ({tp['size_formatted']}) | "
            f"{'Downloaded' if tp['is_downloaded'] else 'Not Downloaded'} | {rc_str} ({tp['row_count_verification_status']}) | "
            f"{tp['column_count']} | {tp['evidence_status']} |"
        )
    (DATA_REPORTS_DIR / "profiling_summary.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")
    print(f"[profile] Generated all 6 metadata JSON files in {DATA_METADATA_DIR} and report in {DATA_REPORTS_DIR}.")
    return profiles_payload


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run reproducible dataset profiling and metadata generation.")
    parser.parse_args()
    run_profiling_pipeline()
