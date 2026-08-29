import type { Metadata } from "next";
import Link from "next/link";
import { FaqFull } from "@/components/faq-full";

export const metadata: Metadata = {
  title: "FAQ — GlobeBid",
  description: "Answers about claiming countries, advertising placement, payments, outbidding, refunds, and how the globe works.",
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-white text-ink">
      <div className="mx-auto max-w-[950px] px-5 py-16 md:py-24">
        {/* eslint-disable-next-line @next/next/no-img-element -- plain img avoids next/image's URL-keyed cache, which previously kept serving a stale version of this file after it was overwritten */}
        <Link href="/" aria-label="GlobeBid home"><img src="/brand/lockup-v2.png" alt="GlobeBid" className="h-7 w-auto" /></Link>
        <Link href="/" className="mt-10 block text-sm font-medium text-black/45 transition hover:text-ink">← Back to globe</Link>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[.22em] text-black/35">FAQ</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-.055em] text-ink md:text-7xl">Everything worth knowing.</h1>
        <p className="mt-5 max-w-lg text-base text-black/48 md:text-lg">The world is simple. The rules should be too.</p>
        <div className="mt-12">
          <FaqFull />
        </div>
      </div>
    </main>
  );
}
