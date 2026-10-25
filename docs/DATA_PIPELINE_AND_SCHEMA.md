# Metadata Schema & Reproducible Profiling Pipeline Documentation

## 1. Architecture Overview

The documentation portal strictly separates:
1. **Kaggle Data Acquisition** (`scripts/acquire_data.py`)
2. **Raw-Data Storage** (`data/raw/` — Git-ignored)
3. **Data Profiling & Validation** (`scripts/profile_datasets.py`, `scripts/validate_metadata.py`)
4. **Generated Machine-Readable Metadata** (`data/metadata/*.json`)
5. **Frontend Presentation** (`src/`)

## 2. Generated JSON Artifacts (`data/metadata/`)

All generated JSON files carry `"metadata_schema_version": "1.0.0"` and `"pipeline_version": "1.0.0"`:

1. **`file_inventory.json`**:
   - Official competition slug, CLI command, authentication environment diagnostic, summary totals, and per-file metadata (`filename`, `remote_path`, `listed_size_bytes`, `is_downloaded`, `row_count`, `row_count_verification_status`, `evidence_status`).
2. **`table_profiles.json`**:
   - Table-level grain, candidate primary keys, duplicate key checks, foreign keys, profiling mode (`Full-table exact profiling`, `Exact line-count + bounded sample profiling`, or `Uninspected locally`), and known limitations.
3. **`column_dictionary.json`**:
   - Complete column catalog across all 9 tables (`table_name`, `column_index`, `column_name`, `physical_type`, `semantic_type`, `meaning`, `evidence_status`, `null_count`, `null_proportion`, `distinct_count`, `numeric_distribution`, `units`, `key_role`, `relationships`, `cross_table_disambiguation`).
4. **`relationships.json`**:
   - Verified and architecturally documented entity-relationship edges (`REL-01` through `REL-12`) with exact `join_columns`, `cardinality`, `row_multiplication_hazard`, and 4-stage analytical lineage (`STAGE-1` through `STAGE-4`).
5. **`data_quality.json`**:
   - Profiling coverage summary, 5 verified structural hazards (`DQ-HAZ-01` through `DQ-HAZ-05`), and table-level findings.
6. **`analysis_catalog.json`**:
   - Competition overview, 5 position-group profiles (`WR`, `TE`, `DB`, `OL`, `DL`), 5 detailed research questions (`RQ-01` through `RQ-05`), 8 mathematical feature specifications (`FE-01` through `FE-08`), official source registry (`SRC-01` through `SRC-05`), and domain glossary.

## 3. Evidence Status Taxonomy

Every claim, table, relationship, and column uses one of five explicit evidence labels:
- **`Officially documented`**: Stated in official Kaggle competition or NFL Football Operations documentation.
- **`Verified from data`**: Directly observed and measured from competition files or CLI inventory.
- **`Inferred from data`**: Plausible architectural or domain interpretation requiring qualification.
- **`Unverified`**: Not yet independently checked on local CSV rows.
- **`Unknown`**: Insufficient evidence prior to local file inspection.
