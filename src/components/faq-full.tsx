"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { faqGroups } from "@/lib/faq-data";
import { analytics } from "@/lib/analytics/posthog-client";

export function FaqFull() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return faqGroups;
    return faqGroups
      .map((group) => ({ ...group, questions: group.questions.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(needle)) }))
      .filter((group) => group.questions.length);
  }, [query]);

  return (
    <div>
      <label className="flex items-center gap-3 border-b border-black/10 py-4 text-black/45 focus-within:border-black/30">
        <Search className="size-4" aria-hidden="true" />
        <span className="sr-only">Search questions</span>
        <input
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (value.trim().length > 1) analytics.faqSearchUsed({ query_length: value.trim().length });
          }}
          className="w-full bg-transparent text-sm text-[#111] outline-none placeholder:text-black/28"
          placeholder="Search questions"
        />
      </label>

      <div className="mt-14">
        {visibleGroups.map((group) => (
          <div key={group.id} className="mb-14">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[.16em] text-black/35">{group.title}</h2>
            <FaqAccordion
              questions={group.questions}
              openId={openId}
              theme="light"
              idPrefix={`faq-${group.id}`}
              headingLevel="h3"
              onToggle={(id, next) => {
                setOpenId(next ? id : null);
                if (next) analytics.faqOpened(id, "faq_page");
              }}
            />
          </div>
        ))}
      </div>

      {!visibleGroups.length && <p className="border-t border-black/10 py-10 text-black/45">No questions match &ldquo;{query}&rdquo;.</p>}
    </div>
  );
}
