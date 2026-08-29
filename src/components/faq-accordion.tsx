"use client";

import { Minus, Plus } from "lucide-react";
import type { FaqQuestion } from "@/lib/faq-data";

type FaqSource = "homepage" | "faq_page";

type FaqAccordionProps = {
  questions: FaqQuestion[];
  openId: string | null;
  onToggle: (id: string, next: boolean) => void;
  theme: "light" | "dark";
  idPrefix?: string;
  headingLevel?: "h2" | "h3";
};

const themes = {
  light: {
    border: "border-black/8",
    question: "text-[#111] hover:text-black/65 focus-visible:ring-black/20",
    answer: "text-black/48",
    icon: "text-black/35",
  },
  dark: {
    border: "border-white/14",
    question: "text-white hover:text-white/72 focus-visible:ring-white/60",
    answer: "text-white/48",
    icon: "text-white/38",
  },
} as const;

export function FaqAccordion({
  questions,
  openId,
  onToggle,
  theme,
  idPrefix = "faq",
  headingLevel = "h3",
}: FaqAccordionProps) {
  const styles = themes[theme];
  const Heading = headingLevel;

  return (
    <div className={`border-t ${styles.border}`}>
      {questions.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id} className={`border-b ${styles.border}`}>
            <Heading className="sr-only">{item.question}</Heading>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`${idPrefix}-answer-${item.id}`}
              onClick={() => onToggle(item.id, !open)}
              className={`flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium outline-none transition focus-visible:ring-2 md:text-xl ${styles.question}`}
            >
              <span aria-hidden="true">{item.question}</span>
              {open ? (
                <Minus className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <Plus className={`size-4 shrink-0 ${styles.icon}`} aria-hidden="true" />
              )}
            </button>
            <div
              id={`${idPrefix}-answer-${item.id}`}
              role="region"
              aria-hidden={!open}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ${open ? "grid-rows-[1fr] pb-7 opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <p className={`max-w-2xl pr-8 text-[15px] leading-7 ${styles.answer}`}>{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type { FaqSource };
