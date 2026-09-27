"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CodeArea, CodeOutput, Field, OptionsLayout, Segmented, StatusBadge, ToolAlert, ToolPanel, Toggle } from "@/components/tool";
import { xml } from "@/lib/html-escape";

type Freq = "none" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

const SAMPLE = `https://example.com/
https://example.com/about
https://example.com/blog/hello-world?ref=home&lang=en
https://example.com/products/shoes`;

export default function SitemapGenerator() {
  const [input, setInput] = useState("");
  const [base, setBase] = useState("");
  const [lastmod, setLastmod] = useState("");
  const [freq, setFreq] = useState<Freq>("none");
  const [priority, setPriority] = useState(false);
  const [dedupe, setDedupe] = useState(true);

  const { urls, invalid } = useMemo(() => {
    const good: string[] = [];
    const bad: string[] = [];
    for (const raw of input.split(/\s+/).filter(Boolean)) {
      try {
        const u = new URL(raw, base || undefined);
        if (!/^https?:$/.test(u.protocol)) throw new Error();
        u.hash = "";
        good.push(u.href);
      } catch {
        bad.push(raw);
      }
    }
    return { urls: dedupe ? [...new Set(good)] : good, invalid: bad };
  }, [input, base, dedupe]);

  // Priority by depth: home 1.0, then −0.2 per path level (min 0.4).
  const pri = (u: string) => Math.max(0.4, 1 - 0.2 * new URL(u).pathname.split("/").filter(Boolean).length).toFixed(1);
  const out = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => ["  <url>", `    <loc>${xml(u)}</loc>`, lastmod && `    <lastmod>${lastmod}</lastmod>`, freq !== "none" && `    <changefreq>${freq}</changefreq>`, priority && `    <priority>${pri(u)}</priority>`, "  </url>"].filter(Boolean).join("\n"))
    .join("\n")}\n</urlset>`;
  const txt = urls.join("\n");

  const options = (
    <ToolPanel title="Options" bodyClassName="p-3 space-y-3">
      <Field label="Base URL (for relative paths)" htmlFor="base"><Input id="base" value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://example.com" className="font-mono" /></Field>
      <Field label="Last modified (all URLs)" htmlFor="lm"><Input id="lm" type="date" value={lastmod} onChange={(e) => setLastmod(e.target.value)} /></Field>
      <Field label="Change frequency" hint="Google ignores changefreq and priority; lastmod matters if accurate.">
        <Segmented size="sm" value={freq} onChange={setFreq} options={(["none", "daily", "weekly", "monthly", "yearly"] as Freq[]).map((f) => ({ value: f, label: f === "none" ? "Omit" : f }))} className="flex-wrap" />
      </Field>
      <Toggle label="Priority by URL depth" checked={priority} onChange={setPriority} />
      <Toggle label="Remove duplicates & #fragments" checked={dedupe} onChange={setDedupe} />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="sitemap">
      <OptionsLayout options={options}>
        <ToolPanel
          title="URLs (one per line)"
          actions={
            <>
              <StatusBadge>{urls.length} URLs</StatusBadge>
              {!input && <button type="button" onClick={() => setInput(SAMPLE)} className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted">Sample</button>}
            </>
          }
        >
          <CodeArea value={input} onChange={(e) => setInput(e.target.value)} minHeight={200} placeholder={"https://example.com/\n/about   ← relative paths need a base URL"} />
        </ToolPanel>
        {invalid.length > 0 && <ToolAlert tone="warning">{invalid.length} line{invalid.length > 1 ? "s" : ""} skipped (not http/https URLs): {invalid.slice(0, 5).join(", ")}{invalid.length > 5 ? "…" : ""}</ToolAlert>}
        {urls.length > 50000 && <ToolAlert tone="error">A sitemap may contain at most 50,000 URLs — split it and use a sitemap index.</ToolAlert>}
        {urls.length > 0 && <CodeOutput title="Output" tabs={[{ id: "xml", label: "sitemap.xml", code: out }, { id: "txt", label: "sitemap.txt", code: txt }]} />}
        <p className="text-[11px] text-muted-foreground px-0.5">Upload to your site root and reference it from robots.txt (Sitemap: …) and Google Search Console. Special characters such as &amp; are escaped automatically.</p>
      </OptionsLayout>
    </ToolLayout>
  );
}
