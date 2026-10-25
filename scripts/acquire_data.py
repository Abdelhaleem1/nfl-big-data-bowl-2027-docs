"""Stage B: Selective acquisition of NFL Big Data Bowl 2027 competition CSVs via Kaggle CLI."""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from typing import Any, Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.common import (
    COMPETITION_SLUG,
    DATA_RAW_DIR,
    LARGE_TRACKING_FILES,
    OFFICIAL_COMPETITION_FILES,
    RECOMMENDED_FIRST_DOWNLOADS,
    SECONDARY_SELECTIVE_DOWNLOADS,
    check_kaggle_auth_environment,
    redact_secrets,
)


def safe_extract_zip(zip_path: Path, dest_dir: Path, expected_csv_name: str) -> Path:
    """Safely extract a single-file or multi-file zip archive into dest_dir without path traversal."""
    base_resolved = dest_dir.resolve()
    with zipfile.ZipFile(zip_path, "r") as zf:
        members = zf.namelist()
        for member in members:
            target_path = (dest_dir / Path(member).name).resolve()
            if base_resolved not in target_path.parents and target_path != base_resolved:
                raise ValueError(f"Unsafe zip member path detected: {member}")
        if len(members) == 1:
            target_csv = dest_dir / expected_csv_name
            with zf.open(members[0]) as src, open(target_csv, "wb") as dst:
                shutil.copyfileobj(src, dst)
        else:
            for member in members:
                if member.endswith("/"):
                    continue
                target_file = dest_dir / Path(member).name
                with zf.open(member) as src, open(target_file, "wb") as dst:
                    shutil.copyfileobj(src, dst)
    zip_path.unlink(missing_ok=True)
    return dest_dir / expected_csv_name


def download_competition_file(filename: str, force: bool = False) -> Dict[str, Any]:
    """Download a single competition file into data/raw/ using Kaggle CLI."""
    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    valid_map = {item["filename"]: item for item in OFFICIAL_COMPETITION_FILES}
    if filename not in valid_map:
        raise ValueError(
            f"Unknown file '{filename}'. Official files: {', '.join(sorted(valid_map.keys()))}"
        )

    target_csv = DATA_RAW_DIR / filename
    if target_csv.is_file() and not force:
        return {
            "filename": filename,
            "status": "already_exists",
            "local_path": str(target_csv),
            "size_bytes": target_csv.stat().st_size,
        }

    remote_path = valid_map[filename]["remote_path"]
    # Try both remote_path and filename depending on Kaggle CLI version
    for file_arg in (remote_path, filename):
        cmd = [
            "kaggle",
            "competitions",
            "download",
            "-c",
            COMPETITION_SLUG,
            "-f",
            file_arg,
            "-p",
            str(DATA_RAW_DIR),
        ]
        if force:
            cmd.append("--force")

        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600, check=False)
        out_clean = redact_secrets((proc.stdout or "") + "\n" + (proc.stderr or "")).strip()

        # Check if either the CSV or a .zip archive arrived
        zip_candidate_1 = DATA_RAW_DIR / f"{filename}.zip"
        zip_candidate_2 = DATA_RAW_DIR / "nfl-big-data-bowl-2027" / f"{filename}.zip"
        csv_candidate_nested = DATA_RAW_DIR / "nfl-big-data-bowl-2027" / filename

        if zip_candidate_2.is_file():
            safe_extract_zip(zip_candidate_2, DATA_RAW_DIR, filename)
        elif zip_candidate_1.is_file():
            safe_extract_zip(zip_candidate_1, DATA_RAW_DIR, filename)
        elif csv_candidate_nested.is_file():
            shutil.move(str(csv_candidate_nested), str(target_csv))

        # Clean up empty nested folder if created by CLI 2.2.5
        nested_dir = DATA_RAW_DIR / "nfl-big-data-bowl-2027"
        if nested_dir.is_dir() and not any(nested_dir.iterdir()):
            nested_dir.rmdir()

        if target_csv.is_file():
            return {
                "filename": filename,
                "status": "downloaded",
                "local_path": str(target_csv),
                "size_bytes": target_csv.stat().st_size,
            }

        if "Authentication required" in out_clean or "401" in out_clean or "403" in out_clean:
            return {
                "filename": filename,
                "status": "blocked_auth",
                "error": (
                    "Kaggle CLI authentication is required in this shell session, or competition rules "
                    "have not been accepted. Run `kaggle auth login` or execute this script from your "
                    "authenticated Command Prompt session."
                ),
                "diagnostic": out_clean[:400],
            }

    return {
        "filename": filename,
        "status": "failed",
        "error": f"Failed to download {filename}.",
    }


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Selectively download NFL Big Data Bowl 2027 CSV files into data/raw/."
    )
    parser.add_argument(
        "--tier",
        choices=["tier1", "tier2", "all-small-and-medium"],
        default="tier1",
        help="tier1: players, games, combine_results, player_career_successes (~145 KB total). "
        "tier2: player_play, combine_tracking (~230 MB total).",
    )
    parser.add_argument(
        "--files",
        nargs="*",
        help="Explicit filenames to download (e.g., players.csv games.csv).",
    )
    parser.add_argument(
        "--allow-large-tracking",
        action="store_true",
        help="Explicitly permit downloading 2023/2024/2025 game_tracking CSVs (335 MB - 1.02 GB).",
    )
    parser.add_argument("--force", action="store_true", help="Overwrite existing local files.")
    args = parser.parse_args(argv)

    auth_info = check_kaggle_auth_environment()
    if not auth_info["authenticated_in_current_shell"]:
        print(f"[acquire] Notice: {auth_info['windows_process_scope_note']}", file=sys.stderr)

    if args.files:
        targets = args.files
    elif args.tier == "tier1":
        targets = RECOMMENDED_FIRST_DOWNLOADS
    elif args.tier == "tier2":
        targets = SECONDARY_SELECTIVE_DOWNLOADS
    else:
        targets = RECOMMENDED_FIRST_DOWNLOADS + SECONDARY_SELECTIVE_DOWNLOADS

    results = []
    for fname in targets:
        if fname in LARGE_TRACKING_FILES and not args.allow_large_tracking:
            print(
                f"[acquire] Skipping large tracking file '{fname}' (pass --allow-large-tracking to override)."
            )
            continue
        res = download_competition_file(fname, force=args.force)
        results.append(res)
        print(f"[acquire] {fname}: {res['status']}")
        if res["status"] == "blocked_auth":
            print(f"[acquire] Actionable step: {res['error']}", file=sys.stderr)
            break

    return 0 if all(r["status"] in ("downloaded", "already_exists") for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
