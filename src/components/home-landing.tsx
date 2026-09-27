import Link from "next/link";
import { ArrowRight, ChevronDown, TrendingUp } from "lucide-react";
import { tools, categories, categoryStyle, getToolsByCategory, getToolById, type Tool } from "@/lib/tools";
import { getCategoryContent } from "@/content/categories";
import { LucideIcon } from "@/components/lucide-icon";
import { SearchHero } from "@/components/home/search-hero";
import { HomeUserSections } from "@/components/home/home-user-sections";
import { SectionHeader } from "@/components/home/section-header";

// Tools with the strongest search demand (from Search Console) — surfaced on
// the homepage so they receive direct internal links from the highest-authority URL.
const POPULAR_TOOL_IDS = [
  "iban-validator",
  "color-name-finder",
  "video-speed-changer",
  "barcode-generator",
  "word-counter",
  "audio-converter",
  "aspect-ratio",
  "markdown-editor",
  "image-cropper",
  "video-trimmer",
  "json-formatter",
  "qr-generator",
];

const HOME_FAQS = [
  {
    question: "Are the tools really free?",
    answer:
      "Yes. Every tool on EverydayTab is free to use with no account, no trial period, no watermarks and no usage caps.",
  },
  {
    question: "Are my files uploaded to a server?",
    answer:
      "No. Files and text are processed inside your browser with JavaScript and WebAssembly. Nothing is transmitted to EverydayTab or any third party, which is why there are no file-size limits and nothing to delete afterwards.",
  },
  {
    question: "Do the tools work offline?",
    answer:
      "Once a tool page has loaded it keeps working without a connection. Audio and video tools download the FFmpeg engine the first time they run and cache it for later use.",
  },
  {
    question: "Which browsers are supported?",
    answer:
      "Current versions of Chrome, Edge, Firefox and Safari on desktop and mobile. Heavier audio, video and PDF tasks run fastest on a desktop computer.",
  },
];

export function HomeLanding() {
  const popular = POPULAR_TOOL_IDS.map((id) => getToolById(id)).filter((t): t is Tool => !!t);

  return (
    <div className="px-4 md:px-6 py-6 md:py-8 max-w-[1400px] mx-auto space-y-8">
      <SearchHero />

      <HomeUserSections />

      {/* Categories */}
      <section className="space-y-2" aria-labelledby="categories-heading">
        <SectionHeader id="categories-heading" title="Browse by category" count={categories.length} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          {categories.map((c) => {
            const count = getToolsByCategory(c.id).length;
            const tagline = getCategoryContent(c.id)?.tagline;
            return (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="group flex flex-col gap-2.5 rounded-md border border-border bg-card p-3 transition-colors hover:border-ring/50 hover:bg-muted/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span style={categoryStyle(c)} className="cat-chip w-8 h-8 rounded-md flex items-center justify-center">
                  <LucideIcon name={c.icon} className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium truncate">{c.name}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{count}</span>
                  </span>
                  {tagline && <span className="block text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">{tagline}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular */}
      <section className="space-y-2" aria-labelledby="popular-heading">
        <SectionHeader id="popular-heading" icon={<TrendingUp className="w-3.5 h-3.5" />} title="Most popular" />
        <ul className="flex flex-wrap gap-1.5">
          {popular.map((t) => (
            <li key={t.id}>
              <Link
                href={t.path}
                className="inline-flex items-center gap-1.5 h-8 pl-1.5 pr-3 rounded-md border border-border bg-card text-xs font-medium hover:border-ring/50 hover:bg-muted/40 transition-colors"
              >
                <span style={categoryStyle(t.category)} className="cat-chip w-5 h-5 rounded-sm flex items-center justify-center">
                  <LucideIcon name={t.icon} className="w-3 h-3" />
                </span>
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Full index — crawlable, compact, collapsed per category */}
      <section className="space-y-2" aria-labelledby="all-heading">
        <SectionHeader id="all-heading" title="All tools" count={tools.length} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {categories.map((c) => {
            const catTools = getToolsByCategory(c.id);
            return (
              <details key={c.id} className="group rounded-md border border-border bg-card open:bg-card">
                <summary className="flex items-center gap-2.5 h-10 px-3 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                  <span style={categoryStyle(c)} className="cat-chip w-6 h-6 rounded-sm flex items-center justify-center shrink-0">
                    <LucideIcon name={c.icon} className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[13px] font-medium flex-1 truncate">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{catTools.length}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-border px-1.5 py-1.5">
                  <ul className="columns-1 sm:columns-2 gap-x-2">
                    {catTools.map((t) => (
                      <li key={t.id} className="break-inside-avoid">
                        <Link
                          href={t.path}
                          className="flex items-center gap-2 h-7 px-1.5 rounded-sm text-xs text-foreground/85 hover:bg-muted hover:text-foreground truncate"
                        >
                          <LucideIcon name={t.icon} className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{t.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/category/${c.id}`}
                    className="flex items-center gap-1 h-7 px-1.5 mt-0.5 text-xs font-medium text-primary hover:underline"
                  >
                    Open {c.name} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* SEO prose — below the fold */}
      <section className="pt-6 border-t border-border grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3 max-w-2xl">
          <h2 className="text-base font-semibold tracking-tight">Free online tools that run in your browser</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            EverydayTab is a collection of {tools.length} free utilities for developers, designers, students and everyday
            work — PDF, image, audio and video editors, converters, calculators, generators, text and SEO tools —
            organised into {categories.length} categories. Everything runs locally on your device: no sign-up, no
            uploads, no watermarks and no file-size limits.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Most online tools upload your file to a server, process it there, and hand back a link — which means
            waiting in a queue, hitting size limits, and trusting a stranger with your documents. EverydayTab takes the
            opposite approach. Every tool is built with browser technologies (JavaScript, WebAssembly, the Canvas and
            Web Audio APIs, FFmpeg and pdf-lib compiled to run client-side) so the work happens on your own machine.
            Your PDFs, photos, recordings and pasted text never leave your device.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Frequently asked questions</h2>
          <dl className="divide-y divide-border rounded-md border border-border bg-card">
            {HOME_FAQS.map((faq) => (
              <div key={faq.question} className="p-3">
                <dt className="text-[13px] font-medium">{faq.question}</dt>
                <dd className="mt-1 text-xs text-muted-foreground leading-relaxed">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}

export { HOME_FAQS };
