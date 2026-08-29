"use client";

import posthog from "posthog-js";
import type { ClientEventMap, FileSizeBucket, GlobeInteractionType } from "./events";

const enabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) && (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true");
const once = new Set<string>();

function capture<K extends keyof ClientEventMap>(event: K, properties: ClientEventMap[K]) {
  if (!enabled) return;
  try { posthog.capture(event, properties); } catch (error) { console.warn("Analytics capture failed", event, error); }
}
function captureOnce<K extends keyof ClientEventMap>(key: string, event: K, properties: ClientEventMap[K]) { const storageKey = `globebid_analytics:${key}`; try { if (sessionStorage.getItem(storageKey)) return; sessionStorage.setItem(storageKey, "1"); } catch { if (once.has(key)) return; once.add(key); } capture(event, properties); }

export const analytics = {
  capture,
  getDistinctId: () => { if (!enabled) return null; try { return posthog.get_distinct_id(); } catch { return null; } },
  globeInteracted: (interaction_type: GlobeInteractionType) => captureOnce("globe_interacted", "globe_interacted", { interaction_type }),
  countrySelected: (properties: ClientEventMap["country_selected"]) => capture("country_selected", properties),
  claimOpened: (properties: ClientEventMap["claim_opened"]) => capture("claim_opened", properties),
  claimFormStarted: (properties: ClientEventMap["claim_form_started"]) => captureOnce(`claim_form_started:${properties.country_code}`, "claim_form_started", properties),
  logoUploadSucceeded: (properties: ClientEventMap["logo_upload_succeeded"]) => capture("logo_upload_succeeded", properties),
  logoUploadFailed: (properties: ClientEventMap["logo_upload_failed"]) => capture("logo_upload_failed", properties),
  claimFormCompleted: (properties: ClientEventMap["claim_form_completed"]) => capture("claim_form_completed", properties),
  checkoutClicked: (properties: ClientEventMap["checkout_clicked"]) => capture("checkout_clicked", properties),
  checkoutCreateFailed: (properties: ClientEventMap["checkout_create_failed"]) => capture("checkout_create_failed", properties),
  paymentReturned: (properties: ClientEventMap["payment_returned"]) => captureOnce(`payment_returned:${properties.bid_id}`, "payment_returned", properties),
  paymentPendingViewed: (properties: ClientEventMap["payment_pending_viewed"]) => captureOnce(`payment_pending:${properties.bid_id}`, "payment_pending_viewed", properties),
  paymentSuccessViewed: (properties: ClientEventMap["payment_success_viewed"] & { bid_id: string }) => { const { bid_id, ...event } = properties; captureOnce(`payment_success:${bid_id}`, "payment_success_viewed", event); },
  brandClicked: (country_code: string) => capture("brand_clicked", { country_code }),
  externalBrandVisit: (country_code: string) => capture("external_brand_visit", { country_code }),
  faqOpened: (question_id: string, source: "homepage" | "faq_page") => capture("faq_opened", { question_id, source }),
  viewAllFaqClicked: () => capture("view_all_faq_clicked", {}),
  faqSearchUsed: (properties: ClientEventMap["faq_search_used"]) => captureOnce("faq_search_used", "faq_search_used", properties),
};

export function fileSizeBucket(bytes: number): FileSizeBucket { if (bytes < 250 * 1024) return "under_250kb"; if (bytes < 1024 * 1024) return "250kb_1mb"; return "1mb_2mb"; }
