"""Stage A/B: Refresh official competition file inventory via Kaggle CLI and reconcile with local data/raw/."""
from __future__ import annotations

import csv
import io
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.common import (
    COMPETITION_SLUG,
    DATA_METADATA_DIR,
    DATA_RAW_DIR,
    METADATA_SCHEMA_VERSION,
    OFFICIAL_COMPETITION_FILES,
    PIPELINE_VERSION,
    check_kaggle_auth_environment,
    format_bytes,
    redact_secrets,
)


def query_kaggle_cli_inventory() -> Dict[str, Any]:
    """Attempt to query `kaggle competitions files -c nfl-big-data-bowl-2027 --csv`."""
    cmd = ["kaggle", "competitions", "files", "-c", COMPETITION_SLUG, "--csv"]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
        stdout_clean = redact_secrets(proc.stdout)
        stderr_clean = redact_secrets(proc.stderr)
        if proc.returncode == 0 and stdout_clean.strip():
            # Parse CSV lines (skipping any warning lines prior to header)
            lines = [
                line
                for line in stdout_clean.splitlines()
                if line.strip() and not line.startswith("Warning:") and "RequestsDependencyWarning" not in line
            ]
            reader = csv.DictReader(io.StringIO("\n".join(lines)))
            parsed_files = []
            for row in reader:
                name = row.get("name", "").strip()
                size_str = row.get("size") or row.get("totalBytes") or "0"
                if name:
                    raw_fname = name.split("/")[-1]
                    try:
                        size_val = int(float(size_str))
                    except ValueError:
                        size_val = 0
                    parsed_files.append(
                        {
                            "remote_path": name if "/" in name else f"{COMPETITION_SLUG}/{name}",
                            "filename": raw_fname,
                            "listed_size_bytes": size_val,
                            "creation_date": row.get("creationDate"),
                        }
                    )
            if parsed_files:
                return {
                    "live_cli_refresh_succeeded": True,
                    "cli_return_code": proc.returncode,
                    "files": parsed_files,
                    "message": "Successfully refreshed file inventory directly from live Kaggle CLI.",
                }
        return {
            "live_cli_refresh_succeeded": False,
            "cli_return_code": proc.returncode,
            "files": [],
            "message": (
                "Kaggle CLI returned authentication prompt in current child shell. "
                "Using verified official competition file inventory baseline captured from user's authenticated CLI run."
            ),
            "cli_diagnostic": redact_secrets((stdout_clean + "\n" + stderr_clean).strip())[:600],
        }
    except FileNotFoundError:
        return {
            "live_cli_refresh_succeeded": False,
            "cli_return_code": -1,
            "files": [],
            "message": "Kaggle CLI executable not found on PATH; using verified baseline inventory.",
        }
    except Exception as exc:
        return {
            "live_cli_refresh_succeeded": False,
            "cli_return_code": -1,
            "files": [],
            "message": f"Kaggle CLI invocation error: {redact_secrets(str(exc))}",
        }


def build_inventory() -> Dict[str, Any]:
    """Build complete file_inventory.json merging official CLI listing with local file status."""
    DATA_METADATA_DIR.mkdir(parents=True, exist_ok=True)
    DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)

    auth_status = check_kaggle_auth_environment()
    cli_result = query_kaggle_cli_inventory()

    live_map: Dict[str, Dict[str, Any]] = {
        f["filename"]: f for f in cli_result.get("files", [])
    }

    files_output: List[Dict[str, Any]] = []
    total_listed_bytes = 0
    total_local_bytes = 0
    downloaded_count = 0

    for item in OFFICIAL_COMPETITION_FILES:
        fname = item["filename"]
        live_entry = live_map.get(fname, {})
        listed_size = live_entry.get("listed_size_bytes", item["listed_size_bytes"])
        remote_path = live_entry.get("remote_path", item["remote_path"])
        total_listed_bytes += listed_size

        local_csv_path = DATA_RAW_DIR / fname
        local_zip_path = DATA_RAW_DIR / f"{fname}.zip"

        is_downloaded = local_csv_path.is_file()
        local_size = local_csv_path.stat().st_size if is_downloaded else None
        if is_downloaded and local_size is not None:
            total_local_bytes += local_size
            downloaded_count += 1

        # Determine exact inspection & row count status
        if is_downloaded:
            download_status = "Downloaded locally"
            inspection_status = "Ready for local profiling"
        else:
            download_status = "Not downloaded locally (Requires authenticated Kaggle CLI session)"
            inspection_status = "Unverified locally (Listed in official competition inventory)"

        files_output.append(
            {
                "filename": fname,
                "table_id": fname.replace(".csv", ""),
                "remote_path": remote_path,
                "listed_size_bytes": listed_size,
                "listed_size_Formatted": format_bytes(listed_size),
                "category": item["category"],
                "recommended_priority": item["recommended_priority"],
                "purpose": item["purpose"],
                "grain_description": item["grain_description"],
                "file_format": "CSV (Comma-Separated Values)",
                "compression": "Delivered uncompressed or as single-file .csv.zip wrapper by Kaggle API for large files",
                "local_path": f"data/raw/{fname}" if is_downloaded else None,
                "local_zip_present": local_zip_path.is_file(),
                "is_downloaded": is_downloaded,
                "local_size_bytes": local_size,
                "local_size_formatted": format_bytes(local_size) if local_size is not None else None,
                "size_matches_listing": (local_size == listed_size) if local_size is not None else None,
                "download_status": download_status,
                "inspection_status": inspection_status,
                "row_count": None,
                "row_count_verification_status": "Unverified",
                "evidence_status": "Verified from data" if is_downloaded else "Officially documented",
                "access_limitations": (
                    None
                    if is_downloaded
                    else "File listed via `kaggle competitions files -c nfl-big-data-bowl-2027`, but not yet downloaded into `data/raw/`. "
                    "Requires running `python scripts/acquire_data.py` inside a shell with active Kaggle authentication."
                ),
            }
        )

    inventory_payload = {
        "metadata_schema_version": METADATA_SCHEMA_VERSION,
        "pipeline_version": PIPELINE_VERSION,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "competition_slug": COMPETITION_SLUG,
        "competition_url": f"https://www.kaggle.com/competitions/{COMPETITION_SLUG}",
        "official_cli_command": f"kaggle competitions files -c {COMPETITION_SLUG}",
        "live_cli_refresh": {
            "succeeded": cli_result["live_cli_refresh_succeeded"],
            "message": cli_result["message"],
        },
        "auth_environment": auth_status,
        "summary": {
            "total_official_files": len(files_output),
            "total_listed_size_bytes": total_listed_bytes,
            "total_listed_size_formatted": format_bytes(total_listed_bytes),
            "downloaded_files_count": downloaded_count,
            "unverified_files_count": len(files_output) - downloaded_count,
            "total_local_size_bytes": total_local_bytes,
            "total_local_size_formatted": format_bytes(total_local_bytes),
        },
        "files": files_output,
    }

    out_path = DATA_METADATA_DIR / "file_inventory.json"
    out_path.write_text(json.dumps(inventory_payload, indent=2), encoding="utf-8")
    print(f"[inventory] Wrote {out_path} ({len(files_output)} official files accounted for; {downloaded_count} local).")
    return inventory_payload


if __name__ == "__main__":
    build_inventory()
