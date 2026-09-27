"use client";

import { useState } from "react";
import mime from "mime-types";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, Segmented, StatusBadge, ToolPanel } from "@/components/tool";

const ALL = Object.entries(mime.extensions as Record<string, string[]>)
  .map(([type, exts]) => ({ type, exts, group: type.split("/")[0] }))
  .sort((a, b) => a.type.localeCompare(b.type));

const COMMON = new Set(["application/json", "application/pdf", "application/zip", "application/xml", "application/octet-stream", "application/javascript", "application/wasm", "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml", "text/html", "text/css", "text/plain", "text/csv", "text/markdown", "audio/mpeg", "audio/wav", "video/mp4", "video/webm", "font/woff2", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);

const GROUPS = ["all", "application", "image", "text", "audio", "video", "font", "model"] as const;
type Group = (typeof GROUPS)[number];

export default function MIMETypes() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<Group>("all");
  const [commonOnly, setCommonOnly] = useState(false);

  const t = q.trim().toLowerCase().replace(/^\*?\./, "");
  // Exact answer for a filename/extension or a MIME type.
  const exact = t ? (t.includes("/") ? { type: t, exts: mime.extensions[t] ?? [] } : mime.lookup(t) ? { type: mime.lookup(t) as string, exts: mime.extensions[mime.lookup(t) as string] ?? [] } : null) : null;

  const list = ALL.filter((m) => (group === "all" || m.group === group) && (!commonOnly || COMMON.has(m.type)) && (!t || m.type.includes(t) || m.exts.some((e) => e.startsWith(t)))).slice(0, 400);

  return (
    <ToolLayout toolId="mime-types">
      <div className="space-y-3">
        <ToolPanel bodyClassName="p-3 space-y-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Extension, filename or MIME type — e.g. .webp, report.docx, application/json" className="h-11 font-mono" autoFocus />
          <div className="flex flex-wrap items-center gap-3">
            <Segmented size="sm" value={group} onChange={setGroup} options={GROUPS.map((g) => ({ value: g, label: g === "all" ? "All" : g }))} />
            <label className="inline-flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={commonOnly} onChange={(e) => setCommonOnly(e.target.checked)} className="size-3.5 accent-primary" />
              Common only
            </label>
          </div>
        </ToolPanel>

        {exact && (
          <ToolPanel bodyClassName="p-3.5 flex flex-wrap items-center gap-3">
            <code className="font-mono text-lg">{exact.type}</code>
            <CopyButton text={exact.type} iconOnly />
            <span className="text-muted-foreground">·</span>
            {exact.exts.length ? exact.exts.map((e) => <StatusBadge key={e}>.{e}</StatusBadge>) : <span className="text-xs text-muted-foreground">No registered extension</span>}
            {mime.charset(exact.type) && <span className="text-xs text-muted-foreground">charset: {mime.charset(exact.type)}</span>}
            <CopyButton text={`Content-Type: ${mime.contentType(exact.type) || exact.type}`} label="Copy header" className="ml-auto" />
          </ToolPanel>
        )}

        <ToolPanel title={`${list.length === 400 ? "400+" : list.length} of ${ALL.length} types`}>
          <ul className="divide-y divide-border max-h-[560px] overflow-y-auto custom-scrollbar">
            {list.map((m) => (
              <li key={m.type} className="group flex items-center gap-3 px-3.5 h-9 text-[13px]">
                <code className="font-mono flex-1 truncate">{m.type}</code>
                {COMMON.has(m.type) && <StatusBadge tone="info">common</StatusBadge>}
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[35%]">{m.exts.map((e) => `.${e}`).join(" ")}</span>
                <CopyButton text={m.type} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
              </li>
            ))}
          </ul>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
