export type FaqQuestion = { id: string; question: string; answer: string };
export type FaqGroup = { id: string; title: string; questions: FaqQuestion[] };

export const faqGroups: FaqGroup[] = [
  {
    id: "how_it_works",
    title: "How it works",
    questions: [
      { id: "what_is_this", question: "What exactly is this?", answer: "This is an interactive advertising marketplace built on a 3D globe. Brands compete for the primary advertising position associated with each country." },
      { id: "what_buying", question: "What am I actually buying?", answer: "You're purchasing digital advertising placement on the globe. If your brand has the highest total stake for a country, your logo gets the primary placement." },
      { id: "buying_country", question: "Am I actually buying a country?", answer: "No. Countries are visual advertising locations inside the product. There is no ownership, government affiliation, or real-world territorial right involved." },
      { id: "claim_country", question: "How do I claim a country?", answer: "Choose a country, add your brand and logo, then pay enough to take the lead. Once payment is confirmed, your stake is applied." },
      { id: "placement_duration", question: "How long does my logo stay there?", answer: "There is no fixed expiry. Your logo stays in the primary position while your total stake remains higher than everyone else's." },
      { id: "multiple_countries", question: "Can I claim multiple countries?", answer: "Yes. One brand can hold advertising placements across multiple countries." },
    ],
  },
  {
    id: "pricing",
    title: "Pricing & stake",
    questions: [
      { id: "country_cost", question: "How much does a country cost?", answer: "Unclaimed countries start at $5. Once advertisers compete for a country, the amount required to take the lead increases according to the current stake." },
      { id: "stake_meaning", question: "What does “stake” mean?", answer: "Stake means how much your brand has spent advertising on that country. It is not an investment, bet, deposit, or financial asset." },
      { id: "previous_stake", question: "Does my previous stake disappear if I'm outbid?", answer: "No. Your previous contribution remains attached to your brand for that country and is included when future payments are applied." },
    ],
  },
  {
    id: "outbidding",
    title: "Outbidding & reclaiming",
    questions: [
      { id: "someone_passes", question: "What happens if someone passes me?", answer: "Their brand takes the primary position, but your previous stake stays attached to your brand so you can top it up later." },
      { id: "take_back", question: "Can I take the country back?", answer: "Yes. Add enough to your existing stake to move above the current leader." },
      { id: "lead_while_paying", question: "What if someone takes the lead while I'm paying?", answer: "Your successful payment still adds to your stake. If another brand already has a higher total, it remains the leader and the globe reflects the latest ranking." },
      { id: "simultaneous_payments", question: "What if two people pay at the same time?", answer: "Successful payments are applied inside a locked database transaction, then the leader is recalculated from the resulting total stakes." },
      { id: "immediate_takeover", question: "Can someone take my country immediately?", answer: "Yes. There is currently no guaranteed protection period after a claim." },
    ],
  },
  {
    id: "payments",
    title: "Payments & refunds",
    questions: [
      { id: "payment_processor", question: "How are payments processed?", answer: "Payments are processed securely through Dodo Payments using its hosted checkout." },
      { id: "purchase_confirmed", question: "When is my purchase confirmed?", answer: "Only after Dodo Payments confirms the payment and the backend successfully applies your stake." },
      { id: "payment_fails", question: "What if payment fails?", answer: "Your stake does not change and the country is not updated." },
      { id: "refund_if_outbid", question: "Do I get a refund if I'm outbid?", answer: "No. Your payment purchases advertising placement and contributes to your total stake. Being outbid does not automatically create a refund." },
      { id: "duplicate_payment", question: "What if I accidentally pay twice?", answer: "Contact support with the transaction references so the payments can be reviewed. Never send card details." },
      { id: "payment_not_applied", question: "What if payment succeeds but my stake doesn't update?", answer: "Contact support with the transaction reference. Payment and bid records can be reconciled without sharing card information." },
    ],
  },
  {
    id: "brand",
    title: "Your brand",
    questions: [
      { id: "claim_requirements", question: "What do I need to claim a country?", answer: "A brand name, website or X profile, a PNG, JPG, or WebP logo under 2MB, and a supported payment method." },
      { id: "best_logo", question: "What logo works best?", answer: "Use a simple square logo with strong contrast and minimal small text so it remains readable on the globe." },
      { id: "edit_brand", question: "Can I change my logo or website later?", answer: "Self-service editing is limited in the MVP. Contact support if a published brand destination or logo needs review." },
      { id: "logo_click", question: "What happens when someone clicks my logo?", answer: "The country panel opens with your brand information and a link to visit your submitted destination." },
      { id: "results_guarantee", question: "Do you guarantee clicks or sales?", answer: "No. Placement provides visibility but does not guarantee impressions, clicks, customers, or revenue." },
    ],
  },
  {
    id: "rules",
    title: "Rules",
    questions: [
      { id: "allowed_brands", question: "What brands are allowed?", answer: "Legitimate companies, creators, products, communities, and projects that follow the platform rules." },
      { id: "prohibited_content", question: "What content is prohibited?", answer: "Scams, malware, phishing, impersonation, illegal content, hateful or extremist imagery, explicit content, and other harmful material are prohibited." },
      { id: "brand_removed", question: "Can my brand be removed after paying?", answer: "Yes. Payment does not override moderation or safety rules." },
      { id: "competitors", question: "Can competitors take each other's countries?", answer: "Yes. Placements remain open to other advertisers unless a brand violates platform rules." },
    ],
  },
  {
    id: "geography",
    title: "Countries & geography",
    questions: [
      { id: "country_endorsement", question: "Does claiming a country mean it endorses my brand?", answer: "No. Placements have no connection to any government, population, institution, or territory represented on the globe." },
      { id: "disputed_territories", question: "How are disputed territories handled?", answer: "The globe uses geographic data for visualization only. Borders and names do not represent political positions, recognition, or legal determinations." },
      { id: "small_countries", question: "What about very small countries?", answer: "Brand identity is displayed as a marker above the country's geographic location so it can remain readable at globe scale." },
    ],
  },
  {
    id: "gambling",
    title: "Is this gambling?",
    questions: [
      { id: "is_gambling", question: "Is this gambling?", answer: "No. Payments purchase digital advertising placement. There are no random outcomes, prizes, odds, or financial returns." },
      { id: "make_money", question: "Can I make money from controlling a country?", answer: "No. Country placement is advertising inventory, not an investment." },
      { id: "withdraw_stake", question: "Can I withdraw my stake?", answer: "No. Stake represents completed advertising spend, not a withdrawable balance." },
    ],
  },
  {
    id: "privacy_technical",
    title: "Privacy & technical",
    questions: [
      { id: "account_required", question: "Do I need an account?", answer: "No account is required for the MVP. Necessary brand and payment information is still processed to complete the purchase." },
      { id: "card_storage", question: "Do you store my card details?", answer: "No. Raw card details are handled by Dodo Payments and are not stored by the globe application." },
      { id: "analytics", question: "Do you use analytics?", answer: "Yes. PostHog is used to understand product usage, conversion, and usability without sending payment card data or uploaded image contents as analytics properties." },
      { id: "session_replay", question: "Do you record sessions?", answer: "Session Replay may be used for usability and debugging. Claim inputs are masked, and the hosted payment form is outside the recording surface." },
      { id: "logo_timing", question: "When will my logo appear?", answer: "Usually shortly after the payment provider confirms the transaction and the backend applies your stake." },
      { id: "refresh_required", question: "Do I need to refresh?", answer: "Normally no. Country ownership changes are subscribed to through live database updates." },
      { id: "globe_not_loading", question: "What if the globe doesn't load?", answer: "Use a modern browser with WebGL enabled. Disabling aggressive graphics or script blockers may also help." },
    ],
  },
];

export const homepageFaqIds = [
  "what_buying",
  "claim_country",
  "someone_passes",
  "take_back",
  "refund_if_outbid",
  "is_gambling",
  "logo_timing",
] as const;

export function getHomepageFaqQuestions(): FaqQuestion[] {
  const byId = new Map(faqGroups.flatMap((group) => group.questions.map((q) => [q.id, q] as const)));
  return homepageFaqIds.map((id) => byId.get(id)).filter((q): q is FaqQuestion => Boolean(q));
}
