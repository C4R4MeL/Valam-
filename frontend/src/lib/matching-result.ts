export interface MatchingResult {
  id: string;
  batch_code: string;
  supplier_name: string;
  supplier_id: string;
  available_volume_kg: number | null;
  pa_percentage: number | null;
  moisture: number | null;
  price_per_kg: number | null;
  match_score: number | null;
  is_eligible: boolean;
  met_requirements: string[];
  unmet_requirements: string[];
  explanation: string;
  is_demo?: boolean;
  origin_district?: string;
  origin_village?: string;
}
