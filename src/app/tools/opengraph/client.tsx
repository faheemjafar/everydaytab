"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeArea, CodeOutput, Field, OptionsLayout, Segmented, ToolPanel } from "@/components/tool";
import { attr } from "@/lib/html-escape";
import { cn } from "@/lib/utils";

type OG = { title: string; description: string; image: string; imageAlt: string; url: string; siteName: string; type: string; card: string; twitterSite: string };
const EMPTY: OG = { title: "", description: "", image: "", imageAlt: "", url: "", siteName: "", type: "website", card: "summary_large_image", twitterSite: "" };

function hostOf(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "example.com";
  }
}

/** Extracts og:/twitter: tags from pasted HTML (nothing is fetched). */
function extract(html: string): { og: OG; raw: [string, string][] } {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const raw: [string, string][] = [];
  doc.querySelectorAll("meta[property], meta[name]").forEach((m) => {
    const k = m.getAttribute("property") || m.getAttribute("name") || "";
    if (/^(og:|twitter:|description$)/i.test(k)) raw.push([k, m.getAttribute("content") ?? ""]);
  });
  const get = (...keys: string[]) => keys.map((k) => raw.find(([n]) => n.toLowerCase() === k)?.[1]).find(Boolean) ?? "";
  return {
    raw,
    og: {
      title: get("og:title", "twitter:title") || doc.title,
      description: get("og:description", "twitter:description", "description"),
      image: get("og:image", "og:image:url", "twitter:image"),
      imageAlt: get("og:image:alt", "twitter:image:alt"),
      url: get("og:url") || doc.querySelector("link[rel=canonical]")?.getAttribute("href") || "",
      siteName: get("og:site_name"),
      type: get("og:type") || "website",
      card: get("twitter:card"),
      twitterSite: get("twitter:site"),
    },
  };
}

function Img({ src, className }: { src: string; className: string }) {
  // Only loads the image URL the user typed or pasted themselves.
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="" className={cn("object-cover bg-muted", className)} /> : <div className={cn("bg-muted flex items-center justify-center text-[11px] text-muted-foreground", className)}>No og:image</div>;
}

function Previews({ og }: { og: OG }) {
  const host = hostOf(og.url);
  const title = og.title || "Title of the page";
  const desc = og.description || "A short description of the page shown under the title.";
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 bg-muted/30">
      <figure className="space-y-1">
        <figcaption className="text-[11px] font-medium text-muted-foreground">Facebook</figcaption>
        <div className="border border-border bg-white dark:bg-stone-900 overflow-hidden">
          <Img src={og.image} className="w-full aspect-[1.91/1]" />
          <div className="px-3 py-2 bg-stone-100 dark:bg-stone-800">
            <p className="text-[11px] uppercase text-stone-500">{host}</p>
            <p className="text-[15px] font-semibold leading-snug line-clamp-2 text-stone-900 dark:text-stone-100">{title}</p>
            <p className="text-[13px] text-stone-500 line-clamp-1">{desc}</p>
          </div>
        </div>
      </figure>
      <figure className="space-y-1">
        <figcaption className="text-[11px] font-medium text-muted-foreground">X / Twitter ({og.card || "summary_large_image"})</figcaption>
        {og.card === "summary" ? (
          <div className="flex border border-border rounded-xl overflow-hidden bg-white dark:bg-stone-900">
            <Img src={og.image} className="w-32 h-32 shrink-0" />
            <div className="p-3 min-w-0">
              <p className="text-[13px] text-stone-500">{host}</p>
              <p className="text-[15px] text-stone-900 dark:text-stone-100 line-clamp-1">{title}</p>
              <p className="text-[13px] text-stone-500 line-clamp-2">{desc}</p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-border">
            <Img src={og.image} className="w-full aspect-[1.91/1]" />
            <span className="absolute left-3 bottom-3 max-w-[85%] truncate rounded bg-black/70 px-1.5 py-0.5 text-[12px] text-white">{title}</span>
          </div>
        )}
        <p className="text-[12px] text-stone-500">From {host}</p>
      </figure>
      <figure className="space-y-1">
        <figcaption className="text-[11px] font-medium text-muted-foreground">LinkedIn</figcaption>
        <div className="border border-border rounded-md overflow-hidden bg-white dark:bg-stone-900">
          <Img src={og.image} className="w-full aspect-[1.91/1]" />
          <div className="px-3 py-2">
            <p className="text-[14px] font-semibold line-clamp-2 text-stone-900 dark:text-stone-100">{title}</p>
            <p className="text-[12px] text-stone-500">{host}</p>
          </div>
        </div>
      </figure>
      <figure className="space-y-1">
        <figcaption className="text-[11px] font-medium text-muted-foreground">Slack / Discord</figcaption>
        <div className="border-l-4 border-stone-300 dark:border-stone-600 pl-3 py-1 space-y-1">
          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-300">{og.siteName || host}</p>
          <p className="text-[14px] font-semibold text-sky-700 dark:text-sky-400">{title}</p>
          <p className="text-[13px] text-stone-600 dark:text-stone-400 line-clamp-3">{desc}</p>
          <Img src={og.image} className="w-full max-w-xs aspect-[1.91/1] rounded" />
        </div>
      </figure>
    </div>
  );
}

function audit(og: OG) {
  return [
    { ok: !!og.title, label: "og:title present" },
    { ok: og.title.length > 0 && og.title.length <= 70, label: `og:title ≤ 70 characters (${og.title.length})` },
    { ok: !!og.description, label: "og:description present" },
    { ok: og.description.length === 0 || og.description.length <= 200, label: `og:description ≤ 200 characters (${og.description.length})` },
    { ok: !!og.image, label: "og:image present" },
    { ok: !og.image || /^https:\/\//.test(og.image), label: "og:image is an absolute https:// URL" },
    { ok: !!og.url, label: "og:url / canonical present" },
    { ok: !!og.card, label: "twitter:card present" },
    { ok: !!og.imageAlt, label: "Image alt text (accessibility)" },
  ];
}

export default function OpenGraphGenerator() {
  const [mode, setMode] = useState<"build" | "audit">("build");
  const [og, setOg] = useState<OG>(EMPTY);
  const [html, setHtml] = useState("");
  const set = (k: keyof OG) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setOg((o) => ({ ...o, [k]: e.target.value }));

  const extracted = useMemo(() => (mode === "audit" && html.trim() && typeof DOMParser !== "undefined" ? extract(html) : null), [mode, html]);
  const shown = mode === "audit" ? extracted?.og ?? EMPTY : og;

  const tags = [
    `<meta property="og:type" content="${attr(og.type)}">`,
    og.title && `<meta property="og:title" content="${attr(og.title)}">`,
    og.description && `<meta property="og:description" content="${attr(og.description)}">`,
    og.url && `<meta property="og:url" content="${attr(og.url)}">`,
    og.siteName && `<meta property="og:site_name" content="${attr(og.siteName)}">`,
    og.image && `<meta property="og:image" content="${attr(og.image)}">`,
    og.image && `<meta property="og:image:width" content="1200">`,
    og.image && `<meta property="og:image:height" content="630">`,
    og.imageAlt && `<meta property="og:image:alt" content="${attr(og.imageAlt)}">`,
    `<meta name="twitter:card" content="${attr(og.card)}">`,
    og.twitterSite && `<meta name="twitter:site" content="@${attr(og.twitterSite.replace(/^@/, ""))}">`,
    og.title && `<meta name="twitter:title" content="${attr(og.title)}">`,
    og.description && `<meta name="twitter:description" content="${attr(og.description)}">`,
    og.image && `<meta name="twitter:image" content="${attr(og.image)}">`,
  ].filter(Boolean).join("\n");

  const options =
    mode === "build" ? (
      <ToolPanel title="Tags" bodyClassName="p-3 space-y-3">
        <Field label={`Title (${og.title.length}/70)`} htmlFor="og-t"><Input id="og-t" value={og.title} onChange={set("title")} /></Field>
        <Field label={`Description (${og.description.length}/200)`} htmlFor="og-d"><Textarea id="og-d" value={og.description} onChange={set("description")} rows={3} /></Field>
        <Field label="Image URL (1200×630 recommended)" htmlFor="og-i"><Input id="og-i" value={og.image} onChange={set("image")} placeholder="https://…/og.png" className="font-mono" /></Field>
        <Field label="Image alt text" htmlFor="og-a"><Input id="og-a" value={og.imageAlt} onChange={set("imageAlt")} /></Field>
        <Field label="Page URL" htmlFor="og-u"><Input id="og-u" value={og.url} onChange={set("url")} placeholder="https://example.com/page" className="font-mono" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Site name" htmlFor="og-s"><Input id="og-s" value={og.siteName} onChange={set("siteName")} /></Field>
          <Field label="X handle" htmlFor="og-x"><Input id="og-x" value={og.twitterSite} onChange={set("twitterSite")} placeholder="@brand" /></Field>
        </div>
        <Field label="Type">
          <Segmented size="sm" value={og.type} onChange={(v) => setOg((o) => ({ ...o, type: v }))} options={["website", "article", "product", "profile", "video.other"].map((v) => ({ value: v, label: v.replace(".other", "") }))} />
        </Field>
        <Field label="X card">
          <Segmented size="sm" value={og.card} onChange={(v) => setOg((o) => ({ ...o, card: v }))} options={[{ value: "summary_large_image", label: "Large image" }, { value: "summary", label: "Summary" }]} />
        </Field>
      </ToolPanel>
    ) : (
      <ToolPanel title="Page HTML">
        <CodeArea value={html} onChange={(e) => setHtml(e.target.value)} minHeight={360} placeholder={"Paste the page source (View Source → copy the <head>)…"} />
      </ToolPanel>
    );

  return (
    <ToolLayout toolId="opengraph">
      <div className="space-y-3">
        <Segmented value={mode} onChange={setMode} options={[{ value: "build", label: "Generate tags" }, { value: "audit", label: "Audit existing page" }]} />
        <OptionsLayout options={options}>
          <ToolPanel title="Previews">
            <Previews og={shown} />
          </ToolPanel>
          {mode === "build" ? (
            <CodeOutput title="Tags for <head>" tabs={[{ id: "html", label: "HTML", code: tags }]} />
          ) : extracted ? (
            <div className="grid gap-3 md:grid-cols-2">
              <ToolPanel title="Checks">
                <ul className="divide-y divide-border">
                  {audit(extracted.og).map((c) => (
                    <li key={c.label} className="flex items-center gap-2 px-3.5 h-9 text-[13px]">
                      {c.ok ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-destructive" />} {c.label}
                    </li>
                  ))}
                </ul>
              </ToolPanel>
              <ToolPanel title={`Found ${extracted.raw.length} tags`}>
                <ul className="divide-y divide-border max-h-80 overflow-auto custom-scrollbar font-mono text-[12px]">
                  {extracted.raw.map(([k, v], i) => (
                    <li key={i} className="px-3.5 py-1.5"><span className="text-muted-foreground">{k}</span> <span className="break-all">{v}</span></li>
                  ))}
                </ul>
              </ToolPanel>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-0.5">Paste a page&apos;s HTML to see how it will look when shared. Nothing is fetched or uploaded — for a live URL, open it, choose View Source and copy the &lt;head&gt;.</p>
          )}
        </OptionsLayout>
      </div>
    </ToolLayout>
  );
}
