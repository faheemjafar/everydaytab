"use client";

import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { CodeArea, CopyButton, StatusBadge, ToolPanel } from "@/components/tool";

const RUN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** Proofpoint URL Defense v3: "*" and "**X" placeholders are filled from the base64 run after "__;". */
function proofpointV3(u: string): string | null {
  const m = u.match(/urldefense(?:\.proofpoint)?\.com\/v3\/__(.+?)__;([^!]*)!!/);
  if (!m) return null;
  const pad = m[2] + "=".repeat((4 - (m[2].length % 4)) % 4);
  let chars: string[];
  try {
    chars = Array.from(new TextDecoder().decode(Uint8Array.from(atob(pad.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))));
  } catch {
    chars = [];
  }
  let i = 0;
  return m[1].replace(/\*(\*.)?/g, (tok) => {
    const n = tok.length === 1 ? 1 : RUN_CHARS.indexOf(tok[2]) + 2;
    const s = chars.slice(i, i + n).join("");
    i += n;
    return s;
  });
}

type Rule = { name: string; test: RegExp; decode: (u: URL, raw: string) => string | null };
const param = (u: URL, ...keys: string[]) => keys.map((k) => u.searchParams.get(k)).find(Boolean) ?? null;

const RULES: Rule[] = [
  { name: "Microsoft Defender Safe Links", test: /safelinks\.protection\.outlook\.com|\.safelinks\.protection\.office365\.us/i, decode: (u) => param(u, "url") },
  { name: "Proofpoint URL Defense v3", test: /urldefense(\.proofpoint)?\.com\/v3\//i, decode: (_, raw) => proofpointV3(raw) },
  { name: "Proofpoint URL Defense v2", test: /urldefense\.proofpoint\.com\/v2\//i, decode: (u) => { const x = param(u, "u"); return x ? decodeURIComponent(x.replace(/-/g, "%").replace(/_/g, "/")) : null; } },
  { name: "Proofpoint URL Defense v1", test: /urldefense\.proofpoint\.com\/v1\//i, decode: (u) => param(u, "u") },
  { name: "Google redirect", test: /(^|\.)google\.[a-z.]+\/url/i, decode: (u) => param(u, "q", "url") },
  { name: "Facebook / Messenger", test: /l\.(facebook|messenger|instagram)\.com\/l\.php/i, decode: (u) => param(u, "u") },
  { name: "Barracuda Link Protection", test: /linkprotect\.cudasvc\.com/i, decode: (u) => param(u, "a") },
  { name: "Slack redirect", test: /slack-redir\.net\/link/i, decode: (u) => param(u, "url") },
  { name: "LinkedIn redirect", test: /linkedin\.com\/redir\/redirect/i, decode: (u) => param(u, "url") },
  { name: "YouTube redirect", test: /youtube\.com\/redirect/i, decode: (u) => param(u, "q") },
  { name: "Generic redirect", test: /[?&](url|u|target|dest|destination|redirect|redirect_uri|q)=https?%3A/i, decode: (u) => param(u, "url", "u", "target", "dest", "destination", "redirect", "redirect_uri", "q") },
];

/** Unwraps repeatedly (links are often double-wrapped, e.g. Proofpoint inside Safe Links). */
function unwrap(raw: string) {
  const layers: string[] = [];
  let cur = raw.trim();
  for (let i = 0; i < 6; i++) {
    let u: URL;
    try { u = new URL(cur); } catch { break; }
    const rule = RULES.find((r) => r.test.test(cur));
    const next = rule?.decode(u, cur);
    if (!rule || !next || next === cur) break;
    layers.push(rule.name);
    cur = next;
  }
  return { url: cur, layers };
}

const SAMPLE = `https://nam02.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com%2Freport%3Fid%3D42&data=05%7C01%7C&sdata=abc&reserved=0
https://urldefense.proofpoint.com/v2/url?u=https-3A__www.example.org_path_page.html-3Fa-3D1&d=DwMF&c=x&r=y
https://www.google.com/url?q=https://example.net/docs&sa=D&ust=1`;

export default function SafelinkDecoder() {
  const [input, setInput] = useState("");
  const rows = useMemo(() => input.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => ({ raw: l, ...unwrap(l) })), [input]);
  const all = rows.map((r) => r.url).join("\n");

  return (
    <ToolLayout toolId="safelink-decoder">
      <div className="space-y-3">
        <ToolPanel
          title="Wrapped links (one per line)"
          actions={!input && <button type="button" onClick={() => setInput(SAMPLE)} className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted">Sample</button>}
          footer={<span className="text-[11px] text-muted-foreground">Supports Microsoft Safe Links, Proofpoint (v1–v3), Google, Facebook, Barracuda, Slack, LinkedIn, YouTube and generic ?url= redirects. Decoding happens locally — the link is never visited.</span>}
        >
          <CodeArea value={input} onChange={(e) => setInput(e.target.value)} minHeight={140} placeholder="https://eur01.safelinks.protection.outlook.com/?url=…" />
        </ToolPanel>
        {rows.length > 0 && (
          <ToolPanel title={`${rows.length} link${rows.length > 1 ? "s" : ""}`} actions={rows.length > 1 && <CopyButton text={all} label="Copy all" />}>
            <ul className="divide-y divide-border">
              {rows.map((r, i) => {
                let host = "";
                try { host = new URL(r.url).hostname; } catch { /* not a URL */ }
                return (
                  <li key={i} className="group px-3.5 py-2.5 space-y-1">
                    <div className="flex items-start gap-2">
                      <code className="flex-1 font-mono text-[13px] break-all">{r.url}</code>
                      <CopyButton text={r.url} iconOnly />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {r.layers.length ? r.layers.map((l, j) => <StatusBadge key={j} tone="info">{l}</StatusBadge>) : <StatusBadge>No wrapper detected</StatusBadge>}
                      {host && <span className="text-[11px] text-muted-foreground">→ {host}</span>}
                      {/^https?:\/\/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd)\//i.test(r.url) && <StatusBadge tone="warning"><TriangleAlert className="w-3 h-3" /> URL shortener — destination unknown</StatusBadge>}
                      {/^http:\/\//i.test(r.url) && <StatusBadge tone="warning">Not HTTPS</StatusBadge>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </ToolPanel>
        )}
      </div>
    </ToolLayout>
  );
}
