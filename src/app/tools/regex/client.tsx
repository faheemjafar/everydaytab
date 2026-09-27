"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CodeArea, CopyButton, Field, OptionsLayout, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

interface RegexPattern { name: string; pattern: string; description: string; }

const commonPatterns: RegexPattern[] = [
  { name: "Email address", pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b", description: "Standard email formats" },
  { name: "Phone (US)", pattern: "(?:\\+?1[-.\\s]?)?\\(?(?:\\d{3})\\)?[-.\\s]?(?:\\d{3})[-.\\s]?(?:\\d{4})", description: "US phone number variants" },
  { name: "URL", pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)", description: "HTTP/HTTPS links" },
  { name: "IPv4 address", pattern: "(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)", description: "Dotted-quad IPv4" },
  { name: "Hex color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", description: "CSS hex colors" },
  { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", description: "ISO 8601 dates" },
];

const FLAGS = [
  { key: "g", label: "Global", hint: "Find all matches" },
  { key: "i", label: "Ignore case" },
  { key: "m", label: "Multiline", hint: "^ and $ match line boundaries" },
  { key: "s", label: "Dot all", hint: ". matches newlines" },
] as const;

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const [flags, setFlags] = useState<Set<string>>(new Set(["g"]));

  const flagStr = FLAGS.map((f) => f.key).filter((k) => flags.has(k)).join("");

  const result = useMemo(() => {
    if (!pattern) return { matches: [] as RegExpMatchArray[], error: "" };
    try {
      const re = new RegExp(pattern, flagStr.includes("g") ? flagStr : flagStr + "g");
      const matches = Array.from(text.matchAll(re)).filter((m) => m[0] !== "" || true);
      return { matches: flagStr.includes("g") ? matches : matches.slice(0, 1), error: "" };
    } catch (e) {
      return { matches: [], error: (e as Error).message.replace(/^Invalid regular expression: /, "") };
    }
  }, [pattern, text, flagStr]);

  // Highlighted preview of the test string.
  const highlighted = useMemo(() => {
    if (!text || result.matches.length === 0) return null;
    const parts: React.ReactNode[] = [];
    let last = 0;
    result.matches.forEach((m, i) => {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (start < last) return;
      parts.push(text.slice(last, start));
      parts.push(
        <mark key={i} className="bg-primary/20 text-foreground rounded-xs px-px">
          {m[0] || "∅"}
        </mark>
      );
      last = end;
    });
    parts.push(text.slice(last));
    return parts;
  }, [text, result.matches]);

  const toggleFlag = (k: string) =>
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const options = (
    <>
      <ToolPanel title="Flags" bodyClassName="p-3 space-y-3">
        {FLAGS.map((f) => (
          <Field key={f.key} label={<span>{f.label} <code className="text-muted-foreground">/{f.key}</code></span>} hint={"hint" in f ? f.hint : undefined} inline>
            <Switch checked={flags.has(f.key)} onCheckedChange={() => toggleFlag(f.key)} />
          </Field>
        ))}
      </ToolPanel>
      <ToolPanel title="Common patterns">
        <ul className="divide-y divide-border">
          {commonPatterns.map((p) => (
            <li key={p.name}>
              <button
                type="button"
                onClick={() => setPattern(p.pattern)}
                className={cn("w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors", pattern === p.pattern && "bg-accent/50")}
              >
                <p className="text-[13px] font-medium">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.description}</p>
              </button>
            </li>
          ))}
        </ul>
      </ToolPanel>
    </>
  );

  return (
    <ToolLayout toolId="regex">
      <OptionsLayout options={options}>
        <ToolPanel
          title="Pattern"
          actions={
            result.error ? (
              <StatusBadge tone="error">Invalid</StatusBadge>
            ) : pattern ? (
              <StatusBadge tone={result.matches.length ? "success" : "neutral"}>
                {result.matches.length} match{result.matches.length === 1 ? "" : "es"}
              </StatusBadge>
            ) : null
          }
          bodyClassName="p-2"
        >
          <div className="flex items-center gap-1 font-mono text-sm">
            <span className="text-muted-foreground pl-1.5">/</span>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="[a-z]+"
              spellCheck={false}
              className="font-mono text-sm h-9 border-0 bg-transparent px-1 focus-visible:ring-0 dark:bg-transparent"
            />
            <span className="text-muted-foreground pr-1.5">/{flagStr}</span>
            <CopyButton text={pattern ? `/${pattern}/${flagStr}` : ""} iconOnly />
          </div>
        </ToolPanel>

        {result.error && <ToolAlert tone="error">{result.error}</ToolAlert>}

        <ToolPanel title="Test string">
          <CodeArea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste text to test against…" minHeight={200} />
        </ToolPanel>

        {highlighted && (
          <ToolPanel title="Highlighted">
            <pre className="px-3.5 py-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words">{highlighted}</pre>
          </ToolPanel>
        )}

        {result.matches.length > 0 && (
          <ToolPanel title={`Matches · ${result.matches.length}`} actions={<CopyButton getText={() => result.matches.map((m) => m[0]).join("\n")} label="Copy all" />}>
            <ul className="divide-y divide-border max-h-80 overflow-y-auto custom-scrollbar">
              {result.matches.slice(0, 500).map((m, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-1.5 text-[13px] font-mono group">
                  <span className="w-6 text-[11px] text-muted-foreground tabular-nums text-right">{i + 1}</span>
                  <span className="flex-1 truncate">{m[0] || <span className="text-muted-foreground">(empty)</span>}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">@{m.index}</span>
                  {m.length > 1 && <span className="text-[11px] text-muted-foreground">{m.length - 1} group{m.length > 2 ? "s" : ""}</span>}
                  <CopyButton text={m[0]} iconOnly className="opacity-0 group-hover:opacity-100" />
                </li>
              ))}
            </ul>
          </ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
