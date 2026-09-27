"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { CodeArea, CopyButton, Segmented, StatusBadge, ToolPanel } from "@/components/tool";

const hex = (n: number, pad = 4) => n.toString(16).toUpperCase().padStart(pad, "0");

// JS/JSON \u escapes are UTF-16 code units (surrogate pairs for emoji);
// HTML, CSS and U+ notation use whole code points.
const ENCODERS: { id: string; label: string; enc: (s: string) => string }[] = [
  { id: "uplus", label: "U+ code points", enc: (s) => Array.from(s).map((c) => `U+${hex(c.codePointAt(0)!)}`).join(" ") },
  { id: "js", label: "JavaScript / JSON (\\u)", enc: (s) => Array.from({ length: s.length }, (_, i) => `\\u${hex(s.charCodeAt(i))}`).join("") },
  { id: "es6", label: "ES6 (\\u{…})", enc: (s) => Array.from(s).map((c) => `\\u{${c.codePointAt(0)!.toString(16)}}`).join("") },
  { id: "html-dec", label: "HTML decimal", enc: (s) => Array.from(s).map((c) => `&#${c.codePointAt(0)};`).join("") },
  { id: "html-hex", label: "HTML hex", enc: (s) => Array.from(s).map((c) => `&#x${c.codePointAt(0)!.toString(16)};`).join("") },
  { id: "css", label: "CSS", enc: (s) => Array.from(s).map((c) => `\\${c.codePointAt(0)!.toString(16)} `).join("").trimEnd() },
  { id: "python", label: "Python", enc: (s) => Array.from(s).map((c) => { const cp = c.codePointAt(0)!; return cp > 0xffff ? `\\U${hex(cp, 8)}` : `\\u${hex(cp)}`; }).join("") },
  { id: "utf8", label: "UTF-8 bytes", enc: (s) => Array.from(new TextEncoder().encode(s)).map((b) => hex(b, 2)).join(" ") },
  { id: "url", label: "Percent-encoded", enc: (s) => encodeURIComponent(s) },
];

/** Decodes any of the escape styles above back to text. */
function decode(s: string) {
  return s
    .replace(/\\u\{([0-9a-f]+)\}/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\U([0-9a-f]{8})/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/U\+([0-9a-f]{4,6})\s?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

export default function TextUnicodeConverter() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("Café 🚀 日本");

  const chars = useMemo(() => Array.from(input).slice(0, 200), [input]);
  const decoded = useMemo(() => {
    try {
      return decode(input);
    } catch {
      return "";
    }
  }, [input]);

  return (
    <ToolLayout toolId="text-unicode">
      <div className="space-y-3">
        <ToolPanel
          title={mode === "encode" ? "Text" : "Escaped input"}
          actions={
            <>
              <StatusBadge>{Array.from(input).length} chars · {new TextEncoder().encode(input).length} bytes</StatusBadge>
              <Segmented
                size="sm"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "encode", label: "Text → escapes" },
                  { value: "decode", label: "Escapes → text" },
                ]}
              />
            </>
          }
        >
          <CodeArea value={input} onChange={(e) => setInput(e.target.value)} minHeight={110} placeholder={mode === "encode" ? "Type or paste text…" : "Paste \\u00e9, &#233;, U+00E9…"} />
        </ToolPanel>

        {mode === "encode" ? (
          <div className="grid gap-3 md:grid-cols-2">
            {ENCODERS.map((e) => {
              const v = e.enc(input);
              return (
                <ToolPanel key={e.id} title={e.label} actions={<CopyButton text={v} iconOnly />}>
                  <pre className="px-3.5 py-2.5 font-mono text-[12.5px] whitespace-pre-wrap break-all max-h-32 overflow-y-auto custom-scrollbar">{v || <span className="text-muted-foreground">—</span>}</pre>
                </ToolPanel>
              );
            })}
          </div>
        ) : (
          <ToolPanel title="Decoded text" actions={<CopyButton text={decoded} />}>
            <pre className="px-3.5 py-3 text-base whitespace-pre-wrap break-all min-h-20">{decoded}</pre>
          </ToolPanel>
        )}

        {mode === "encode" && chars.length > 0 && (
          <ToolPanel title="Characters">
            <div className="p-3 grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1.5">
              {chars.map((c, i) => (
                <div key={i} className="rounded-md border border-border p-1.5 text-center">
                  <div className="text-xl leading-7">{c === " " ? "␠" : c}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">U+{hex(c.codePointAt(0)!)}</div>
                </div>
              ))}
            </div>
          </ToolPanel>
        )}
      </div>
    </ToolLayout>
  );
}
