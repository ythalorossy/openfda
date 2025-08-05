/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

interface OpenFDAResponse {
  meta: Meta;
  results: Result[];
}

interface Meta {
  disclaimer: string;
  terms: string;
  license: string;
  last_updated: string;
  results: Results;
}

interface Results {
  skip: number;
  limit: number;
  total: number;
}

interface Result {
  dosage_form: never[];
  precautions: string[];
  adverse_reactions: string[];
  overdosage: string[];
  drug_interactions: string[];
  contraindications: string[];
  spl_product_data_elements: string[];
  spl_unclassified_section: string[];
  active_ingredient: string[];
  purpose: string[];
  indications_and_usage: string[];
  warnings: string[];
  do_not_use: string[];
  ask_doctor: string[];
  ask_doctor_or_pharmacist: string[];
  stop_use: string[];
  pregnancy_or_breast_feeding: string[];
  keep_out_of_reach_of_children: string[];
  dosage_and_administration: string[];
  dosage_and_administration_table: string[];
  storage_and_handling: string[];
  inactive_ingredient: string[];
  questions: string[];
  package_label_principal_display_panel: string[];
  set_id: string;
  id: string;
  effective_time: string;
  version: string;
  openfda: Openfda;
}

interface Openfda {
  strength: never[];
  application_number: string[];
  brand_name: string[];
  generic_name: string[];
  manufacturer_name: string[];
  product_ndc: string[];
  product_type: string[];
  route: string[];
  substance_name: string[];
  rxcui: string[];
  spl_id: string[];
  spl_set_id: string[];
  package_ndc: string[];
  is_original_packager: boolean[];
  unii: string[];
}

export { OpenFDAResponse };
