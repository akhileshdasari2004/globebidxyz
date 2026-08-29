import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const enabled = Boolean(key) && (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true");

if (enabled) {
  posthog.init(key!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    defaults: "2026-05-30",
    capture_pageview: "history_change",
    capture_pageleave: true,
    capture_exceptions: true,
    autocapture: true,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
      recordCrossOriginIframes: false,
    },
    loaded: (client) => { if (process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true") client.debug(); },
  });
}
