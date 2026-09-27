"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";

const SAMPLE = "https://user:pass@shop.example.co.uk:8443/products/shoes/running?color=red&size=42&utm_source=newsletter&utm_campaign=spring%20sale#reviews";
const TRACKING = /^(utm_\w+|fbclid|gclid|dclid|msclkid|mc_eid|mc_cid|_ga|igshid|ref_src|yclid)$/i;

function parse(raw: string): URL | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    return new URL(t);
  } catch {
    try {
      return /^[\w.-]+\.[a-z]{2,}(\/|$|:|\?)/i.test(t) ? new URL(`https://${t}`) : null;
    } catch {
      return null;
    }
  }
}

export default function URLParser() {
  const [input, setInput] = useState(SAMPLE);
  const url = useMemo(() => parse(input), [input]);
  const params = url ? Array.from(url.searchParams.entries()) : [];

  // Editing a param rebuilds the URL text, so input stays the single source of truth.
  const setParams = (next: [string, string][]) => {
    if (!url) return;
    const u = new URL(url.href);
    u.search = new URLSearchParams(next).toString();
    setInput(u.href);
  };

  const rows: [string, string][] = url
    ? [
        ["Protocol", url.protocol],
        ["Origin", url.origin],
        ["Host", url.host],
        ["Hostname", url.hostname],
        ["Port", url.port || `${url.protocol === "https:" ? 443 : url.protocol === "http:" ? 80 : "—"} (default)`],
        ["Path", decodeURIComponent(url.pathname)],
        ["Path segments", url.pathname.split("/").filter(Boolean).map(decodeURIComponent).join("  ›  ") || "—"],
        ["Query string", url.search || "—"],
        ["Fragment", url.hash ? decodeURIComponent(url.hash) : "—"],
        ...(url.username ? ([["Username", url.username], ["Password", url.password ? "•".repeat(url.password.length) : "—"]] as [string, string][]) : []),
      ]
    : [];

  const tracking = params.filter(([k]) => TRACKING.test(k));

  return (
    <ToolLayout toolId="url-parser">
      <div className="space-y-3">
        <ToolPanel bodyClassName="p-3.5 space-y-2" actions={undefined}>
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://example.com/path?query=value#hash" spellCheck={false} className="h-11 font-mono" autoFocus />
            <CopyButton text={url?.href ?? ""} className="h-11" />
          </div>
          {input.trim() && !url && <p className="text-xs text-destructive">Not a valid URL.</p>}
          {url && tracking.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <StatusBadge tone="warning">{tracking.length} tracking parameter{tracking.length > 1 ? "s" : ""}</StatusBadge>
              <button type="button" onClick={() => setParams(params.filter(([k]) => !TRACKING.test(k)))} className="text-primary hover:underline">
                Remove them
              </button>
            </div>
          )}
        </ToolPanel>

        {url && (
          <div className="grid gap-3 lg:grid-cols-2">
            <ToolPanel title="Components">
              <dl className="divide-y divide-border">
                {rows.map(([k, v]) => (
                  <div key={k} className="group flex items-center gap-3 px-3.5 h-10">
                    <dt className="w-28 shrink-0 text-xs text-muted-foreground">{k}</dt>
                    <dd className="flex-1 font-mono text-[13px] truncate" title={v}>{v}</dd>
                    <CopyButton text={v} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                  </div>
                ))}
              </dl>
            </ToolPanel>
            <ToolPanel
              title={`Query parameters · ${params.length}`}
              actions={
                <Button variant="ghost" size="sm" onClick={() => setParams([...params, ["", ""]])}>
                  <Plus /> Add
                </Button>
              }
            >
              {params.length ? (
                <ul className="divide-y divide-border">
                  {params.map(([k, v], i) => (
                    <li key={i} className="flex items-center gap-1.5 px-2.5 py-1.5">
                      <Input value={k} onChange={(e) => setParams(params.map((p, j) => (j === i ? [e.target.value, p[1]] : p)))} placeholder="key" className="w-1/3 font-mono" aria-label="Parameter name" />
                      <span className="text-muted-foreground">=</span>
                      <Input value={v} onChange={(e) => setParams(params.map((p, j) => (j === i ? [p[0], e.target.value] : p)))} placeholder="value" className="flex-1 font-mono" aria-label="Parameter value" />
                      <Button variant="ghost" size="icon-sm" onClick={() => setParams(params.filter((_, j) => j !== i))} aria-label="Remove parameter" className="text-muted-foreground hover:text-destructive">
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3.5 py-6 text-center text-xs text-muted-foreground">No query parameters. Add one to build the URL.</p>
              )}
              {params.length > 0 && (
                <div className="px-3.5 py-2 border-t border-border flex justify-end">
                  <CopyButton text={JSON.stringify(Object.fromEntries(params), null, 2)} label="Copy as JSON" />
                </div>
              )}
            </ToolPanel>
          </div>
        )}
        {input.trim() && !url && <ToolAlert tone="info">Include the scheme (https://) or a domain like example.com/path.</ToolAlert>}
      </div>
    </ToolLayout>
  );
}
