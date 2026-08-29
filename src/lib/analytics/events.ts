export type GlobeInteractionType = "rotate" | "zoom" | "touch";
export type FileSizeBucket = "under_250kb" | "250kb_1mb" | "1mb_2mb";

export interface ClientEventMap {
  globe_interacted: { interaction_type: GlobeInteractionType };
  country_selected: CountryIntent;
  claim_opened: Omit<CountryIntent, "country_name">;
  claim_form_started: { country_code: string; minimum_next_stake: number };
  logo_upload_succeeded: { country_code: string; file_type: string; file_size_bucket: FileSizeBucket };
  logo_upload_failed: { country_code: string; error_type: string };
  claim_form_completed: { country_code: string; amount: number; is_claimed: boolean };
  checkout_clicked: { country_code: string; amount: number; is_claimed: boolean; is_reclaim_attempt: boolean };
  checkout_create_failed: { country_code: string; amount: number; error_code: string };
  payment_returned: { country_code: string; bid_id: string };
  payment_pending_viewed: { country_code: string; bid_id: string };
  payment_success_viewed: { country_code: string; amount: number; became_leader: boolean };
  brand_clicked: { country_code: string };
  external_brand_visit: { country_code: string };
  faq_opened: { question_id: string; source: "homepage" | "faq_page" };
  view_all_faq_clicked: Record<string, never>;
  faq_search_used: { query_length: number };
}

export interface CountryIntent { country_code: string; country_name: string; is_claimed: boolean; current_stake: number; minimum_next_stake: number }

export interface ServerEventMap {
  checkout_created: { country_code: string; bid_id: string; amount: number; was_claimed: boolean; previous_country_stake: number };
  payment_succeeded: { country_code: string; bid_id: string; payment_id: string | null; amount: number };
  bid_applied: { country_code: string; bid_id: string; amount_added: number; brand_total_stake: number; country_leading_stake: number };
  country_claimed: { country_code: string; brand_total_stake: number };
  country_taken_over: { country_code: string; previous_leading_stake: number; new_leading_stake: number };
  country_reclaimed: { country_code: string; amount_added: number; new_total_stake: number };
  paid_but_not_leader: { country_code: string; brand_total_stake: number; leading_stake: number; gap_to_leader: number };
  payment_failed: { country_code: string; bid_id: string; failure_category: string };
}
