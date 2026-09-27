"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ClearButton, CodeArea, CodeOutput, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";
import { parseCurl, toAxios, toFetch, toGo, toPhp, toPython, type CurlRequest } from "@/lib/curl";

type Result = null | { error: string } | { r: CurlRequest; tabs: { id: string; label: string; code: string }[] };

const SAMPLES: [string, string][] = [
  ["JSON POST", `curl 'https://api.example.com/v1/users' \\\n  -H 'Authorization: Bearer <token>' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{"name":"Ada","role":"admin"}'`],
  ["Basic auth + query", `curl -u user:password -G https://api.example.com/search -d q=hello -d limit=10`],
  ["File upload", `curl -X POST https://api.example.com/upload -F "file=@report.pdf" -F "title=Q3 report"`],
];

export default function CurlConverter() {
  const [input, setInput] = useState(SAMPLES[0][1]);

  const result = useMemo((): Result => {
    if (!input.trim()) return null;
    try {
      const r = parseCurl(input);
      return { r, tabs: [
        { id: "fetch", label: "JavaScript (fetch)", code: toFetch(r) },
        { id: "axios", label: "Node (axios)", code: toAxios(r) },
        { id: "python", label: "Python (requests)", code: toPython(r) },
        { id: "go", label: "Go", code: toGo(r) },
        { id: "php", label: "PHP", code: toPhp(r) },
      ] };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [input]);

  return (
    <ToolLayout toolId="curl-converter">
      <div className="space-y-3">
        <ToolPanel
          title="curl command"
          actions={
            <>
              {SAMPLES.map(([label, cmd]) => (
                <button key={label} type="button" onClick={() => setInput(cmd)} className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted">
                  {label}
                </button>
              ))}
              <ClearButton onClick={() => setInput("")} iconOnly disabled={!input} />
            </>
          }
          footer={<span className="text-[11px] text-muted-foreground">Tip: in Chrome/Firefox DevTools → Network, right-click a request → Copy → Copy as cURL (bash).</span>}
        >
          <CodeArea value={input} onChange={(e) => setInput(e.target.value)} minHeight={150} placeholder="curl https://…" />
        </ToolPanel>

        {result && "error" in result && <ToolAlert tone="error">{result.error}</ToolAlert>}
        {result && "r" in result && (
          <>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge tone="info">{result.r.method}</StatusBadge>
              <StatusBadge>{result.r.url.length > 60 ? `${result.r.url.slice(0, 60)}…` : result.r.url}</StatusBadge>
              {result.r.headers.length > 0 && <StatusBadge>{result.r.headers.length} headers</StatusBadge>}
              {result.r.body && <StatusBadge>{result.r.bodyKind} body</StatusBadge>}
              {result.r.form && <StatusBadge>multipart form</StatusBadge>}
              {result.r.auth && <StatusBadge>basic auth</StatusBadge>}
            </div>
            <CodeOutput title="Code" tabs={result.tabs} />
            {result.r.warnings.length > 0 && <ToolAlert tone="warning">{result.r.warnings.join(" · ")}</ToolAlert>}
          </>
        )}
      </div>
    </ToolLayout>
  );
}
