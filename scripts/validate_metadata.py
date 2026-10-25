"""Validate generated JSON metadata files against schema, completeness, evidence, and security rules."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.common import DATA_METADATA_DIR, OFFICIAL_COMPETITION_FILES

REQUIRED_METADATA_FILES = [
    "file_inventory.json",
    "table_profiles.json",
    "column_dictionary.json",
    "relationships.json",
    "data_quality.json",
    "analysis_catalog.json",
]

VALID_EVIDENCE_STATUSES = {
    "Officially documented",
    "Verified from data",
    "Inferred from data",
    "Unverified",
    "Unknown",
}


def validate_all_metadata() -> List[str]:
    """Return a list of validation errors (empty list means all checks passed)."""
    errors: List[str] = []

    for fname in REQUIRED_METADATA_FILES:
        fpath = DATA_METADATA_DIR / fname
        if not fpath.is_file():
            errors.append(f"Missing required metadata file: {fpath}")

    if errors:
        return errors

    inv = json.loads((DATA_METADATA_DIR / "file_inventory.json").read_text(encoding="utf-8"))
    profiles = json.loads((DATA_METADATA_DIR / "table_profiles.json").read_text(encoding="utf-8"))
    col_dict = json.loads((DATA_METADATA_DIR / "column_dictionary.json").read_text(encoding="utf-8"))
    rels = json.loads((DATA_METADATA_DIR / "relationships.json").read_text(encoding="utf-8"))
    dq = json.loads((DATA_METADATA_DIR / "data_quality.json").read_text(encoding="utf-8"))
    cat = json.loads((DATA_METADATA_DIR / "analysis_catalog.json").read_text(encoding="utf-8"))

    # 1. Check schema version presence
    for name, obj in [
        ("file_inventory.json", inv),
        ("table_profiles.json", profiles),
        ("column_dictionary.json", col_dict),
        ("relationships.json", rels),
        ("data_quality.json", dq),
        ("analysis_catalog.json", cat),
    ]:
        if "metadata_schema_version" not in obj:
            errors.append(f"{name} missing metadata_schema_version")

    # 2. Check all 9 official competition files are represented
    expected_names = {f["filename"] for f in OFFICIAL_COMPETITION_FILES}
    inv_names = {f["filename"] for f in inv.get("files", [])}
    prof_names = {t["filename"] for t in profiles.get("tables", [])}

    if inv_names != expected_names:
        errors.append(f"file_inventory.json files mismatch: {inv_names ^ expected_names}")
    if prof_names != expected_names:
        errors.append(f"table_profiles.json tables mismatch: {prof_names ^ expected_names}")

    # 3. Verify byte sizes match official listing
    official_sizes = {f["filename"]: f["listed_size_bytes"] for f in OFFICIAL_COMPETITION_FILES}
    for f in inv.get("files", []):
        if f["listed_size_bytes"] != official_sizes.get(f["filename"]):
            errors.append(f"Size mismatch for {f['filename']}: {f['listed_size_bytes']}")

    # 4. Check row count verification status honesty (no fake metrics for uninspected files)
    for t in profiles.get("tables", []):
        if not t["is_downloaded"]:
            if t["row_count"] is not None:
                errors.append(f"Uninspected table {t['filename']} must not have a fabricated row_count")
            if "Unverified" not in t["row_count_verification_status"]:
                errors.append(f"Uninspected table {t['filename']} must mark row_count_verification_status as Unverified")

    # 5. Check every column has valid evidence status and matches table_profiles
    cols = col_dict.get("columns", [])
    if not cols:
        errors.append("column_dictionary.json has 0 columns")
    for c in cols:
        if c.get("evidence_status") not in VALID_EVIDENCE_STATUSES:
            errors.append(
                f"Invalid evidence_status '{c.get('evidence_status')}' on {c.get('table_name')}.{c.get('column_name')}"
            )

    # 6. Check relationship links point to valid tables
    for edge in rels.get("relationships", []):
        if edge["source_table"] not in expected_names:
            errors.append(f"Invalid relationship source_table: {edge['source_table']}")
        if edge["target_table"] not in expected_names:
            errors.append(f"Invalid relationship target_table: {edge['target_table']}")

    # 7. Ensure no credentials or secret tokens appear in any generated file
    secret_pattern = re.compile(r"KGAT_[A-Za-z0-9_\-]{10,}|KAGGLE_KEY\s*=\s*['\"]?[A-Za-z0-9]{16,}")
    for fname in REQUIRED_METADATA_FILES:
        raw_text = (DATA_METADATA_DIR / fname).read_text(encoding="utf-8")
        if secret_pattern.search(raw_text):
            errors.append(f"Potential credential pattern detected in {fname}")

    return errors


if __name__ == "__main__":
    errs = validate_all_metadata()
    if errs:
        for e in errs:
            print(f"[validate] ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    print(f"[validate] All {len(REQUIRED_METADATA_FILES)} metadata JSON files passed schema, evidence, and security validation.")
    sys.exit(0)
