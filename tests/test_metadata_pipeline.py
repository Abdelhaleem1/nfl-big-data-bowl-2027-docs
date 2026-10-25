"""Automated data and pipeline unit tests for NFL Big Data Bowl 2027 documentation metadata."""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.common import (
    DATA_METADATA_DIR,
    OFFICIAL_COMPETITION_FILES,
    redact_secrets,
)
from scripts.profile_datasets import profile_local_csv
from scripts.validate_metadata import REQUIRED_METADATA_FILES, validate_all_metadata


class TestMetadataAndPipeline(unittest.TestCase):
    def test_all_required_metadata_files_exist_and_validate(self) -> None:
        errors = validate_all_metadata()
        self.assertEqual(errors, [], f"Metadata validation failed: {errors}")
        for fname in REQUIRED_METADATA_FILES:
            self.assertTrue((DATA_METADATA_DIR / fname).is_file())

    def test_all_nine_official_files_accounted_for(self) -> None:
        inv = json.loads((DATA_METADATA_DIR / "file_inventory.json").read_text(encoding="utf-8"))
        self.assertEqual(inv["summary"]["total_official_files"], 9)
        listed_map = {f["filename"]: f["listed_size_bytes"] for f in inv["files"]}
        expected_map = {
            "combine_results.csv": 41020,
            "combine_tracking.csv": 83788174,
            "game_tracking_2023.csv": 335463637,
            "game_tracking_2024.csv": 717952893,
            "game_tracking_2025.csv": 1022575093,
            "games.csv": 43174,
            "player_career_successes.csv": 13801,
            "player_play.csv": 146879042,
            "players.csv": 47301,
        }
        self.assertEqual(listed_map, expected_map)

    def test_no_fabricated_metrics_on_uninspected_files(self) -> None:
        profiles = json.loads((DATA_METADATA_DIR / "table_profiles.json").read_text(encoding="utf-8"))
        for table in profiles["tables"]:
            if not table["is_downloaded"]:
                self.assertIsNone(table["row_count"])
                self.assertIn("Unverified", table["row_count_verification_status"])

    def test_local_csv_profiler_exact_headers_and_stats(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_path = Path(tmpdir) / "players.csv"
            csv_path.write_text(
                "nflId,displayName,position,height,weight\n"
                "55001,Player One,WR,73,205\n"
                "55002,Player Two,DB,71,192\n"
                "55003,Player Three,OL,77,315\n",
                encoding="utf-8",
            )
            official_info = next(f for f in OFFICIAL_COMPETITION_FILES if f["filename"] == "players.csv")
            t_prof, cols, anoms = profile_local_csv(csv_path, official_info)
            self.assertTrue(t_prof["is_downloaded"])
            self.assertEqual(t_prof["row_count"], 3)
            self.assertEqual(t_prof["header_columns"], ["nflId", "displayName", "position", "height", "weight"])
            self.assertTrue(t_prof["primary_key_is_unique"])
            self.assertEqual(len(cols), 5)
            self.assertEqual(cols[0]["evidence_status"], "Verified from data")
            self.assertEqual(cols[4]["numeric_distribution"]["min"], 192.0)
            self.assertEqual(cols[4]["numeric_distribution"]["max"], 315.0)

    def test_credential_redaction_never_leaks_tokens(self) -> None:
        raw = "export KAGGLE_API_TOKEN=KGAT_secret1234567890abcdef and key=mysecretkey987654321"
        cleaned = redact_secrets(raw)
        self.assertNotIn("KGAT_secret1234567890abcdef", cleaned)
        self.assertNotIn("mysecretkey987654321", cleaned)
        self.assertIn("[REDACTED]", cleaned)


if __name__ == "__main__":
    unittest.main()
