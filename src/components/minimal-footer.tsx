import {
  AtSign,
  BriefcaseBusiness,
  Camera,
  Code2,
  MessageCircle,
  Play,
} from "lucide-react";

const company = [
  { title: "About GlobeBid", href: "#globe" },
  { title: "Marketplace rules", href: "#faq" },
  { title: "Brand assets", href: "#" },
  { title: "Privacy Policy", href: "#" },
  { title: "Terms of Service", href: "#" },
];

const resources = [
  { title: "Explore Earth", href: "#globe" },
  { title: "Live market", href: "#country-market" },
  { title: "How claiming works", href: "#faq" },
  { title: "Help Center", href: "#faq" },
  { title: "Contact Support", href: "mailto:support@globebid.xyz" },
];

const socialLinks = [
  { label: "Facebook", icon: <MessageCircle className="size-4" />, link: "#" },
  { label: "GitHub", icon: <Code2 className="size-4" />, link: "#" },
  { label: "Instagram", icon: <Camera className="size-4" />, link: "#" },
  { label: "LinkedIn", icon: <BriefcaseBusiness className="size-4" />, link: "#" },
  { label: "X", icon: <AtSign className="size-4" />, link: "#" },
  { label: "YouTube", icon: <Play className="size-4" />, link: "#" },
];

export function MinimalFooter() {
  const year = new Date().getFullYear();
  return <footer className="relative border-t border-black/8 bg-surface-recessed">
    <div className="relative mx-auto max-w-5xl border-black/8 bg-[radial-gradient(45%_90%_at_25%_0%,rgba(17,17,17,.08),transparent)] md:border-x">
      <div className="grid grid-cols-6 gap-8 p-6 py-12 md:p-10 md:py-16">
        <div className="col-span-6 flex flex-col gap-5 md:col-span-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain img avoids next/image's URL-keyed cache, which previously kept serving a stale version of this file after it was overwritten */}
          <a href="#globe" aria-label="GlobeBid home" className="w-max opacity-70 transition hover:opacity-100"><img src="/brand/mark-v2.png" alt="" className="size-9" /></a>
          <p className="max-w-sm text-balance font-mono text-sm leading-relaxed text-black/55">A live interactive Earth where brands claim countries and put their identity on the world.</p>
          <div className="flex flex-wrap gap-2">{socialLinks.map((item) => <a key={item.label} aria-label={item.label} className="rounded-md border border-black/8 bg-white/25 p-2 text-black/60 transition hover:bg-white hover:text-ink" href={item.link}>{item.icon}</a>)}</div>
        </div>
        <FooterColumn title="Resources" links={resources} />
        <FooterColumn title="Company" links={company} />
      </div>
      <div className="border-t border-black/8 px-6 py-5"><div className="flex flex-col items-center justify-between gap-2 text-xs text-black/45 md:flex-row"><p>© {year} GlobeBid. All rights reserved.</p><p className="font-mono text-[10px] uppercase tracking-[.13em]">Spin · Pick · Claim · Own</p></div></div>
    </div>
  </footer>;
}

function FooterColumn({ title, links }: { title: string; links: Array<{ title: string; href: string }> }) {
  return <div className="col-span-3 w-full md:col-span-1"><span className="mb-2 block text-xs text-black/40">{title}</span><div className="flex flex-col gap-1">{links.map((item) => <a key={item.title} className="w-max max-w-full py-1 text-sm text-black/75 duration-200 hover:text-ink hover:underline" href={item.href}>{item.title}</a>)}</div></div>;
}
