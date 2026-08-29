"use client";

import Link from "next/link";
import { useState } from "react";
import { FaqAccordion } from "@/components/faq-accordion";
import { getHomepageFaqQuestions } from "@/lib/faq-data";
import { analytics } from "@/lib/analytics/posthog-client";

const questions = getHomepageFaqQuestions();

export function HomepageFaq() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="faq" className="scroll-mt-0 bg-white px-5 py-24 text-[#111] md:py-36">
      <div className="mx-auto max-w-[850px]">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-black/35">FAQ</p>
        <h2 className="mt-5 text-5xl font-semibold tracking-[-.055em] text-[#111] md:text-7xl">
          Everything worth knowing.
        </h2>

        <div className="mt-16">
          <FaqAccordion
            questions={questions}
            openId={openId}
            theme="light"
            idPrefix="homepage-faq"
            onToggle={(id, next) => {
              setOpenId(next ? id : null);
              if (next) analytics.faqOpened(id, "homepage");
            }}
          />
        </div>

        <div className="mt-12 border-t border-black/8 pt-10">
          <Link
            href="/faq"
            onClick={() => analytics.viewAllFaqClicked()}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#111] transition hover:text-black/60"
          >
            View all questions →
          </Link>
        </div>
      </div>
    </section>
  );
}
