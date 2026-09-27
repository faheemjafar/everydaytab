"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeOutput, ColorField, Field, OptionsLayout, Segmented, StatusBadge, ToolPanel, Toggle } from "@/components/tool";
import { attr } from "@/lib/html-escape";
import { cn } from "@/lib/utils";

type Robots = "index,follow" | "noindex,follow" | "index,nofollow" | "noindex,nofollow";

function Counter({ n, min, max }: { n: number; min: number; max: number }) {
  return <span className={cn("tabular-nums", n === 0 ? "text-muted-foreground" : n < min || n > max ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>{n}/{max}</span>;
}

export default function MetaTagGenerator() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [siteName, setSiteName] = useState("");
  const [author, setAuthor] = useState("");
  const [twitter, setTwitter] = useState("");
  const [lang, setLang] = useState("en");
  const [robots, setRobots] = useState<Robots>("index,follow");
  const [theme, setTheme] = useState("#0d9488");
  const [social, setSocial] = useState(true);

  const t = title.trim();
  const d = desc.trim();
  const lines = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    t && `<title>${attr(t)}</title>`,
    d && `<meta name="description" content="${attr(d)}">`,
    url && `<link rel="canonical" href="${attr(url)}">`,
    robots !== "index,follow" && `<meta name="robots" content="${robots}">`,
    author && `<meta name="author" content="${attr(author)}">`,
    theme && `<meta name="theme-color" content="${attr(theme)}">`,
    ...(social
      ? [
          "",
          "<!-- Open Graph -->",
          `<meta property="og:type" content="website">`,
          t && `<meta property="og:title" content="${attr(t)}">`,
          d && `<meta property="og:description" content="${attr(d)}">`,
          url && `<meta property="og:url" content="${attr(url)}">`,
          image && `<meta property="og:image" content="${attr(image)}">`,
          siteName && `<meta property="og:site_name" content="${attr(siteName)}">`,
          lang && `<meta property="og:locale" content="${attr(lang.replace("-", "_"))}">`,
          "",
          "<!-- Twitter / X -->",
          `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
          twitter && `<meta name="twitter:site" content="@${attr(twitter.replace(/^@/, ""))}">`,
          t && `<meta name="twitter:title" content="${attr(t)}">`,
          d && `<meta name="twitter:description" content="${attr(d)}">`,
          image && `<meta name="twitter:image" content="${attr(image)}">`,
        ]
      : []),
  ].filter((l) => l !== false && l !== undefined && l !== "") as string[];
  // Keep intentional blank separators but drop empty trailing groups.
  const html = lines.join("\n").replace(/\n{3,}/g, "\n\n");
  const nextMetadata = `export const metadata = {\n${[t && `  title: ${JSON.stringify(t)},`, d && `  description: ${JSON.stringify(d)},`, url && `  alternates: { canonical: ${JSON.stringify(url)} },`, robots !== "index,follow" && `  robots: { index: ${!robots.startsWith("no")}, follow: ${!robots.endsWith("nofollow")} },`, social && `  openGraph: {${t ? ` title: ${JSON.stringify(t)},` : ""}${d ? ` description: ${JSON.stringify(d)},` : ""}${url ? ` url: ${JSON.stringify(url)},` : ""}${siteName ? ` siteName: ${JSON.stringify(siteName)},` : ""}${image ? ` images: [${JSON.stringify(image)}],` : ""} type: "website" },`, social && `  twitter: { card: ${JSON.stringify(image ? "summary_large_image" : "summary")}${twitter ? `, site: ${JSON.stringify("@" + twitter.replace(/^@/, ""))}` : ""} },`].filter(Boolean).join("\n")}\n};`;

  let host = "example.com";
  let crumbs = "";
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, "");
    crumbs = u.pathname.split("/").filter(Boolean).join(" › ");
  } catch {
    /* no url */
  }

  const options = (
    <ToolPanel title="Page" bodyClassName="p-3 space-y-3">
      <Field label={<span className="flex justify-between w-full">Title <Counter n={t.length} min={30} max={60} /></span>} htmlFor="mt-title">
        <Input id="mt-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title — Brand" />
      </Field>
      <Field label={<span className="flex justify-between w-full">Description <Counter n={d.length} min={70} max={160} /></span>} htmlFor="mt-desc">
        <Textarea id="mt-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="What the page is about, in one or two sentences." />
      </Field>
      <Field label="Canonical URL" htmlFor="mt-url">
        <Input id="mt-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" className="font-mono" />
      </Field>
      <Field label="Search engines">
        <Segmented size="sm" value={robots} onChange={setRobots} options={[{ value: "index,follow", label: "Index" }, { value: "noindex,follow", label: "No index" }, { value: "index,nofollow", label: "No follow" }, { value: "noindex,nofollow", label: "Neither" }]} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Author" htmlFor="mt-author"><Input id="mt-author" value={author} onChange={(e) => setAuthor(e.target.value)} /></Field>
        <Field label="Language" htmlFor="mt-lang"><Input id="mt-lang" value={lang} onChange={(e) => setLang(e.target.value)} placeholder="en" className="font-mono" /></Field>
      </div>
      <ColorField label="Theme colour (mobile browser UI)" value={theme} onChange={setTheme} />
      <Toggle label="Include Open Graph & Twitter tags" checked={social} onChange={setSocial} />
      {social && (
        <>
          <Field label="Share image URL (1200×630)" htmlFor="mt-img"><Input id="mt-img" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/og.png" className="font-mono" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Site name" htmlFor="mt-site"><Input id="mt-site" value={siteName} onChange={(e) => setSiteName(e.target.value)} /></Field>
            <Field label="X / Twitter handle" htmlFor="mt-tw"><Input id="mt-tw" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@brand" /></Field>
          </div>
        </>
      )}
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="meta-tag-generator">
      <OptionsLayout options={options}>
        <ToolPanel title="Google search preview" actions={robots.startsWith("noindex") ? <StatusBadge tone="warning">Won&apos;t appear in search</StatusBadge> : null}>
          <div className="p-4 bg-white dark:bg-stone-900 max-w-[600px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="size-7 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-[11px] font-semibold text-stone-600 dark:text-stone-300">{(siteName || host)[0]?.toUpperCase()}</span>
              <div className="leading-tight">
                <p className="text-[13px] text-stone-800 dark:text-stone-200">{siteName || host}</p>
                <p className="text-[12px] text-stone-500">{host}{crumbs && ` › ${crumbs}`}</p>
              </div>
            </div>
            <p className="text-[19px] leading-snug text-[#1a0dab] dark:text-[#8ab4f8] truncate">{t ? (t.length > 60 ? `${t.slice(0, 58)}…` : t) : "Your page title appears here"}</p>
            <p className="text-[13px] leading-relaxed text-stone-600 dark:text-stone-400 line-clamp-2">{d ? (d.length > 160 ? `${d.slice(0, 157)}…` : d) : "Your meta description appears here. Google may rewrite it if it doesn't match the search."}</p>
          </div>
        </ToolPanel>
        <CodeOutput title="Code" tabs={[{ id: "html", label: "HTML <head>", code: html }, { id: "next", label: "Next.js metadata", code: nextMetadata }]} />
        <p className="text-[11px] text-muted-foreground px-0.5">Titles over ~60 characters and descriptions over ~160 are usually truncated in results. Values are HTML-escaped automatically.</p>
      </OptionsLayout>
    </ToolLayout>
  );
}
