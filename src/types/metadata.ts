import fileInventoryRaw from '../../data/metadata/file_inventory.json';
import tableProfilesRaw from '../../data/metadata/table_profiles.json';
import columnDictionaryRaw from '../../data/metadata/column_dictionary.json';
import relationshipsRaw from '../../data/metadata/relationships.json';
import dataQualityRaw from '../../data/metadata/data_quality.json';
import analysisCatalogRaw from '../../data/metadata/analysis_catalog.json';

export type EvidenceStatus =
  | 'Officially documented'
  | 'Verified from data'
  | 'Inferred from data'
  | 'Unverified'
  | 'Unknown';

export interface InventoryFile {
  filename: string;
  table_id: string;
  remote_path: string;
  listed_size_bytes: number;
  listed_size_Formatted: string;
  category: string;
  recommended_priority: number;
  purpose: string;
  grain_description: string;
  file_format: string;
  compression: string;
  local_path: string | null;
  local_zip_present: boolean;
  is_downloaded: boolean;
  local_size_bytes: number | null;
  local_size_formatted: string | null;
  size_matches_listing: boolean | null;
  download_status: string;
  inspection_status: string;
  row_count: number | null;
  row_count_verification_status: string;
  evidence_status: EvidenceStatus;
  access_limitations: string | null;
}

export interface NumericDistribution {
  min: number;
  q05: number;
  q25: number;
  median: number;
  mean: number;
  std: number;
  q75: number;
  q95: number;
  max: number;
}

export interface ColumnMetadata {
  table_name: string;
  column_index: number;
  column_name: string;
  physical_type: string;
  semantic_type: string;
  meaning: string;
  evidence_status: EvidenceStatus;
  profiling_scope: string;
  null_count: number | null;
  blank_count: number | null;
  null_proportion: number | null;
  distinct_count: number | null;
  representative_values: string[];
  numeric_distribution: NumericDistribution | null;
  units: string;
  valid_range_or_domain: string;
  key_role: string;
  relationships: string[];
  data_quality_notes: string;
  analytical_uses: string[];
  limitations: string;
  tables_sharing_column_name?: string[];
  cross_table_disambiguation?: string | null;
}

export interface TableProfile {
  filename: string;
  table_id: string;
  source_path: string;
  local_path: string | null;
  is_downloaded: boolean;
  listed_size_bytes: number;
  local_size_bytes: number | null;
  size_formatted: string;
  file_format: string;
  encoding: string;
  delimiter: string;
  compression: string;
  category: string;
  purpose: string;
  grain_description: string;
  evidence_status: EvidenceStatus;
  profiling_mode: string;
  row_count: number | null;
  profiled_row_count: number;
  row_count_verification_status: string;
  column_count: number;
  column_count_verification_status: string;
  header_columns: string[];
  candidate_primary_keys: string[];
  primary_key_is_unique: boolean | null;
  duplicate_key_count: number | null;
  candidate_foreign_keys: string[];
  sampling_or_chunking_limitations: string | null;
  known_limitations: string;
  last_profiled_at_utc: string;
  generator_script: string;
  pipeline_version: string;
}

export interface RelationshipEdge {
  id: string;
  source_table: string;
  target_table: string;
  join_columns: string[];
  cardinality: string;
  relationship_type: string;
  row_multiplication_hazard: string;
  design_explanation: string;
  evidence_status: EvidenceStatus;
  validation_evidence: string;
}

export interface LineageStage {
  stage_id: string;
  stage_name: string;
  description: string;
  inputs: string[];
  outputs: string[];
}

export interface ResearchQuestion {
  id: string;
  title: string;
  category: string;
  position_groups: string[];
  question: string;
  why_it_matters: string;
  relevant_tables: string[];
  exact_columns: string[];
  required_joins: string[];
  proposed_features: string[];
  suggested_visualizations: string[];
  statistical_and_ml_methods: string[];
  confounders_and_leakage_risks: string[];
  sample_size_considerations: string;
  validation_strategy: string;
  supporting_or_weakening_evidence: {
    supports: string;
    weakens: string;
  };
  known_limitations: string;
  feasibility_status: string;
}

export interface EngineeredFeature {
  id: string;
  name: string;
  category: string;
  derivation_type: string;
  formula_latex: string;
  definition: string;
  input_columns: string[];
  source_tables: string[];
  units: string;
  windowing_and_aggregation: string;
  missing_data_handling: string;
  leakage_concerns: string;
  implementation_status: string;
  validation_and_tests: string;
}

export interface OfficialSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  category: string;
  claims_supported: string[];
  verification_status: EvidenceStatus;
  last_verified: string;
}

export interface GlossaryTerm {
  term: string;
  category: string;
  definition: string;
  source_label: string;
}

export const fileInventory = fileInventoryRaw as {
  metadata_schema_version: string;
  pipeline_version: string;
  generated_at_utc: string;
  competition_slug: string;
  competition_url: string;
  official_cli_command: string;
  live_cli_refresh: { succeeded: boolean; message: string };
  auth_environment: {
    authenticated_in_current_shell: boolean;
    detected_auth_mechanism: string;
    kaggle_config_dir_exists: boolean;
    windows_process_scope_note: string;
  };
  summary: {
    total_official_files: number;
    total_listed_size_bytes: number;
    total_listed_size_formatted: string;
    downloaded_files_count: number;
    unverified_files_count: number;
    total_local_size_bytes: number;
    total_local_size_formatted: string;
  };
  files: InventoryFile[];
};

export const tableProfiles = tableProfilesRaw as {
  metadata_schema_version: string;
  pipeline_version: string;
  generated_at_utc: string;
  competition_slug: string;
  tables: TableProfile[];
};

export const columnDictionary = columnDictionaryRaw as {
  metadata_schema_version: string;
  pipeline_version: string;
  generated_at_utc: string;
  total_documented_columns: number;
  unique_column_names: number;
  columns: ColumnMetadata[];
};

export const relationshipsData = relationshipsRaw as {
  metadata_schema_version: string;
  pipeline_version: string;
  generated_at_utc: string;
  relationships: RelationshipEdge[];
  lineage_stages: LineageStage[];
};

export const dataQualityData = dataQualityRaw as {
  metadata_schema_version: string;
  pipeline_version: string;
  generated_at_utc: string;
  summary: {
    total_tables: number;
    locally_profiled_tables: number;
    uninspected_tables: number;
    large_tracking_files_deferred: string[];
    total_findings_and_status_items: number;
  };
  known_structural_hazards: Array<{
    id: string;
    title: string;
    affected_tables: string[];
    evidence_status: EvidenceStatus;
    description: string;
    mitigation: string;
  }>;
  table_findings: Array<{
    table_name: string;
    column_name: string;
    anomaly_type: string;
    severity: string;
    evidence_status: EvidenceStatus;
    description: string;
  }>;
};

export const analysisCatalog = analysisCatalogRaw as {
  metadata_schema_version: string;
  pipeline_version: string;
  generated_at_utc: string;
  competition_overview: {
    official_title: string;
    edition: string;
    kaggle_url: string;
    nfl_ops_url: string;
    research_objective: string;
    problem_paradigm: string;
    target_column_policy: string;
    position_groups: Array<{
      code: string;
      name: string;
      focus: string;
    }>;
  };
  research_questions: ResearchQuestion[];
  feature_engineering: EngineeredFeature[];
  official_sources: OfficialSource[];
  glossary: GlossaryTerm[];
};
