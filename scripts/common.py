"""Shared constants, official inventory baseline, and credential redaction utilities."""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, Dict, List

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_RAW_DIR = PROJECT_ROOT / "data" / "raw"
DATA_METADATA_DIR = PROJECT_ROOT / "data" / "metadata"
DATA_REPORTS_DIR = PROJECT_ROOT / "data" / "reports"
DOCS_DIR = PROJECT_ROOT / "docs"

COMPETITION_SLUG = "nfl-big-data-bowl-2027"
METADATA_SCHEMA_VERSION = "1.0.0"
PIPELINE_VERSION = "1.0.0"

# Official baseline returned by `kaggle competitions files -c nfl-big-data-bowl-2027`
OFFICIAL_COMPETITION_FILES: List[Dict[str, Any]] = [
    {
        "filename": "combine_results.csv",
        "remote_path": "nfl-big-data-bowl-2027/combine_results.csv",
        "listed_size_bytes": 41020,
        "category": "Combine Standardized Testing",
        "recommended_priority": 1,
        "purpose": "Standardized NFL Scouting Combine physical measurements and drill scores (e.g., 40-yard dash, vertical jump, broad jump, short shuttle, 3-cone drill) for prospect cohorts.",
        "grain_description": "One row per prospect Combine participation record (Inferred from competition structure; exact primary key verified upon local CSV profiling).",
    },
    {
        "filename": "combine_tracking.csv",
        "remote_path": "nfl-big-data-bowl-2027/combine_tracking.csv",
        "listed_size_bytes": 83788174,
        "category": "Combine Sensor Tracking (10 Hz)",
        "recommended_priority": 2,
        "purpose": "10 Hz wearable RFID sensor tracking data captured during NFL Scouting Combine drills, recording continuous spatial coordinates, speed, acceleration, deceleration, and orientation.",
        "grain_description": "One row per prospect per drill per 0.1-second (10 Hz) tracking frame (Officially documented 10 Hz sampling rate; exact frame/drill composite key verified upon local CSV profiling).",
    },
    {
        "filename": "game_tracking_2023.csv",
        "remote_path": "nfl-big-data-bowl-2027/game_tracking_2023.csv",
        "listed_size_bytes": 335463637,
        "category": "Regular-Season Tracking (10 Hz)",
        "recommended_priority": 3,
        "purpose": "10 Hz Next Gen Stats regular-season on-field player tracking observations for the 2023 NFL season.",
        "grain_description": "One row per tracked entity (player/ball) per play per 10 Hz frame in the 2023 season (Inferred from NFL Next Gen Stats tracking architecture; unverified locally).",
    },
    {
        "filename": "game_tracking_2024.csv",
        "remote_path": "nfl-big-data-bowl-2027/game_tracking_2024.csv",
        "listed_size_bytes": 717952893,
        "category": "Regular-Season Tracking (10 Hz)",
        "recommended_priority": 3,
        "purpose": "10 Hz Next Gen Stats regular-season on-field player tracking observations for the 2024 NFL season.",
        "grain_description": "One row per tracked entity (player/ball) per play per 10 Hz frame in the 2024 season (Inferred from NFL Next Gen Stats tracking architecture; unverified locally).",
    },
    {
        "filename": "game_tracking_2025.csv",
        "remote_path": "nfl-big-data-bowl-2027/game_tracking_2025.csv",
        "listed_size_bytes": 1022575093,
        "category": "Regular-Season Tracking (10 Hz)",
        "recommended_priority": 3,
        "purpose": "10 Hz Next Gen Stats regular-season on-field player tracking observations for the 2025 NFL season.",
        "grain_description": "One row per tracked entity (player/ball) per play per 10 Hz frame in the 2025 season (Inferred from NFL Next Gen Stats tracking architecture; unverified locally).",
    },
    {
        "filename": "games.csv",
        "remote_path": "nfl-big-data-bowl-2027/games.csv",
        "listed_size_bytes": 43174,
        "category": "Game Context & Schedule",
        "recommended_priority": 1,
        "purpose": "Contextual metadata for regular-season NFL games included in the tracking and play datasets (season, week, kickoff date/time, participating teams, scores).",
        "grain_description": "One row per NFL game (Inferred from standard NFL Big Data Bowl relational schema; verified upon local CSV profiling).",
    },
    {
        "filename": "player_career_successes.csv",
        "remote_path": "nfl-big-data-bowl-2027/player_career_successes.csv",
        "listed_size_bytes": 13801,
        "category": "Career Outcomes & Benchmarks",
        "recommended_priority": 1,
        "purpose": "Post-draft NFL regular-season career outcome benchmarks, performance summaries, or achievement indicators used to evaluate how Combine traits translate to NFL success.",
        "grain_description": "One row per player or player-season career outcome summary (Exact grain and outcome column definitions require local CSV inspection).",
    },
    {
        "filename": "player_play.csv",
        "remote_path": "nfl-big-data-bowl-2027/player_play.csv",
        "listed_size_bytes": 146879042,
        "category": "Player-Play Participation & Charting",
        "recommended_priority": 2,
        "purpose": "Play-level player participation, alignment, route/assignment details, and on-play statistical outcomes bridging game context and frame-level tracking.",
        "grain_description": "One row per player per play (`gameId`, `playId`, `nflId`) (Inferred from NFL Big Data Bowl structure; verified upon local CSV profiling).",
    },
    {
        "filename": "players.csv",
        "remote_path": "nfl-big-data-bowl-2027/players.csv",
        "listed_size_bytes": 47301,
        "category": "Player Master & Demographics",
        "recommended_priority": 1,
        "purpose": "Biographical, physical, and positional reference table for players across Combine and NFL regular-season datasets (focusing on WR, TE, DB, OL, and DL position groups).",
        "grain_description": "One row per unique player (`nflId`) (Inferred from standard NFL Big Data Bowl schema; verified upon local CSV profiling).",
    },
]

RECOMMENDED_FIRST_DOWNLOADS = [
    "players.csv",
    "games.csv",
    "combine_results.csv",
    "player_career_successes.csv",
]

SECONDARY_SELECTIVE_DOWNLOADS = [
    "player_play.csv",
    "combine_tracking.csv",
]

LARGE_TRACKING_FILES = [
    "game_tracking_2023.csv",
    "game_tracking_2024.csv",
    "game_tracking_2025.csv",
]


def redact_secrets(text: str) -> str:
    """Redact any potential API tokens, keys, or credential strings from logs and outputs."""
    if not text:
        return ""
    redacted = text
    # Redact KAGGLE_API_TOKEN or KAGGLE_KEY values if present in environment
    for env_var in ("KAGGLE_API_TOKEN", "KAGGLE_KEY"):
        val = os.environ.get(env_var)
        if val and len(val) > 4:
            redacted = redacted.replace(val, "[REDACTED_CREDENTIAL]")
    # Redact token-like hex or bearer patterns
    redacted = re.sub(
        r"(KAGGLE_API_TOKEN|KAGGLE_KEY|access_token|token|key)\s*[:=]\s*['\"]?[A-Za-z0-9_\-\.]{8,}['\"]?",
        r"\1=[REDACTED]",
        redacted,
        flags=re.IGNORECASE,
    )
    redacted = re.sub(r"KGAT_[A-Za-z0-9_\-]{10,}", "KGAT_[REDACTED]", redacted)
    return redacted


def format_bytes(num_bytes: int) -> str:
    """Return human-readable byte size string."""
    if num_bytes < 1024:
        return f"{num_bytes} B"
    if num_bytes < 1024**2:
        return f"{num_bytes / 1024:.1f} KB"
    if num_bytes < 1024**3:
        return f"{num_bytes / (1024**2):.2f} MB"
    return f"{num_bytes / (1024**3):.2f} GB"


def check_kaggle_auth_environment() -> Dict[str, Any]:
    """Inspect whether Kaggle CLI credentials are configured without reading or exposing secret values."""
    kaggle_dir = Path.home() / ".kaggle"
    has_kaggle_json = (kaggle_dir / "kaggle.json").is_file()
    has_access_token_file = (kaggle_dir / "access_token").is_file() or (kaggle_dir / "access_token.txt").is_file()
    has_oauth_creds = (kaggle_dir / "credentials.json").is_file()
    has_env_token = bool(os.environ.get("KAGGLE_API_TOKEN"))
    has_env_key = bool(os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY"))

    any_configured = any([
        has_kaggle_json,
        has_access_token_file,
        has_oauth_creds,
        has_env_token,
        has_env_key,
    ])

    active_method = "none"
    if has_env_token:
        active_method = "KAGGLE_API_TOKEN environment variable"
    elif has_access_token_file:
        active_method = "~/.kaggle/access_token file"
    elif has_kaggle_json:
        active_method = "~/.kaggle/kaggle.json file"
    elif has_env_key:
        active_method = "KAGGLE_USERNAME/KAGGLE_KEY environment variables"
    elif has_oauth_creds:
        active_method = "~/.kaggle/credentials.json (OAuth)"

    diagnostic = (
        "Kaggle authentication is configured in the current process."
        if any_configured
        else (
            "No persistent Kaggle credentials detected in ~/.kaggle/ or current process environment variables. "
            "On Windows, if KAGGLE_API_TOKEN was set via `set KAGGLE_API_TOKEN=...` in an earlier Command Prompt "
            "(cmd.exe) session, that variable is process-scoped to that specific cmd.exe window and is not inherited "
            "by new shells. Run scripts from that authenticated Command Prompt or run `kaggle auth login`."
        )
    )

    return {
        "authenticated_in_current_shell": any_configured,
        "detected_auth_mechanism": active_method,
        "kaggle_config_dir_exists": kaggle_dir.is_dir(),
        "has_kaggle_json": has_kaggle_json,
        "has_access_token_file": has_access_token_file,
        "has_oauth_credentials": has_oauth_creds,
        "has_env_kaggle_api_token": has_env_token,
        "has_env_legacy_key": has_env_key,
        "windows_process_scope_note": diagnostic,
    }
