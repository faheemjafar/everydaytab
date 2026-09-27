"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { ClearButton, CodeArea, DownloadButton, Segmented, Stat, StatGrid, StatusBadge, ToolPanel, Toggle } from "@/components/tool";
import { cn } from "@/lib/utils";

const STOP = new Set("a an and are as at be but by for from has have he her his i in is it its of on or our she that the their them they this to was we were will with you your not no so if then than there what which who when where how all any can do does did just about into over out up more most some such only also very been being would could should may might must our us".split(" "));
const tokenize = (t: string) => (t.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).map((w) => w.replace(/’/g, "'"));

function density(pct: number) {
  if (pct === 0) return { tone: "error" as const, label: "missing" };
  if (pct < 0.5) return { tone: "warning" as const, label: "low" };
  if (pct <= 2.5) return { tone: "success" as const, label: "good" };
  if (pct <= 4) return { tone: "warning" as const, label: "high" };
  return { tone: "error" as const, label: "stuffing" };
}

export default function KeywordAnalyzer() {
  const [text, setText] = useState("");
  const [targets, setTargets] = useState("");
  const [n, setN] = useState<"1" | "2" | "3">("1");
  const [skipStop, setSkipStop] = useState(true);

  const a = useMemo(() => {
    const words = tokenize(text);
    if (!words.length) return null;
    const size = Number(n);
    const counts = new Map<string, number>();
    for (let i = 0; i + size <= words.length; i++) {
      const g = words.slice(i, i + size);
      if (skipStop && (STOP.has(g[0]) || STOP.has(g[size - 1]))) continue;
      if (g.every((w) => /^\d+$/.test(w))) continue;
      const k = g.join(" ");
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const top = [...counts].filter(([, c]) => c > 1 || size === 1).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 30);
    const firstPara = tokenize(text.split(/\n\s*\n/)[0] ?? "").join(" ");
    const heading = tokenize(text.split("\n")[0] ?? "").join(" ");
    // Whole-word phrase matching on token sequences — no regex built from user input.
    const tgt = targets
      .split(/[,\n]/)
      .map((t) => tokenize(t))
      .filter((t) => t.length)
      .map((phrase) => {
        let count = 0;
        for (let i = 0; i + phrase.length <= words.length; i++) if (phrase.every((w, j) => words[i + j] === w)) count++;
        const p = phrase.join(" ");
        return { phrase: p, count, pct: (count * phrase.length * 100) / words.length, inFirst: ` ${firstPara} `.includes(` ${p} `), inHeading: ` ${heading} `.includes(` ${p} `) };
      });
    return { words: words.length, unique: new Set(words).size, top, max: top[0]?.[1] ?? 1, tgt, sentences: (text.match(/[.!?]+(\s|$)/g) ?? []).length || 1 };
  }, [text, targets, n, skipStop]);

  const csv = a ? ["phrase,count,density_percent", ...a.top.map(([k, c]) => `"${k}",${c},${((c * Number(n) * 100) / a.words).toFixed(2)}`)].join("\n") : "";

  return (
    <ToolLayout toolId="keywords">
      <div className="space-y-3">
        <ToolPanel title="Content" actions={<><StatusBadge>{a?.words ?? 0} words</StatusBadge><ClearButton onClick={() => setText("")} iconOnly disabled={!text} /></>}>
          <CodeArea value={text} onChange={(e) => setText(e.target.value)} minHeight={200} placeholder="Paste your article or page copy. The first line is treated as the heading." className="font-sans text-[14px]" />
        </ToolPanel>
        <ToolPanel bodyClassName="p-3">
          <Input value={targets} onChange={(e) => setTargets(e.target.value)} placeholder="Target keywords, comma-separated — e.g. pdf compressor, reduce pdf size" />
        </ToolPanel>

        {a && (
          <>
            {a.tgt.length > 0 && (
              <ToolPanel title="Target keywords">
                <ul className="divide-y divide-border">
                  {a.tgt.map((t) => {
                    const d = density(t.pct);
                    return (
                      <li key={t.phrase} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-2 text-[13px]">
                        <span className="font-medium flex-1 min-w-40">{t.phrase}</span>
                        <span className="tabular-nums">{t.count}×</span>
                        <span className="tabular-nums w-14 text-right">{t.pct.toFixed(2)}%</span>
                        <StatusBadge tone={d.tone}>{d.label}</StatusBadge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">{t.inHeading ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-muted-foreground" />} heading</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">{t.inFirst ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-muted-foreground" />} first paragraph</span>
                      </li>
                    );
                  })}
                </ul>
              </ToolPanel>
            )}
            <StatGrid>
              <Stat label="Words" value={a.words.toLocaleString()} />
              <Stat label="Unique words" value={a.unique.toLocaleString()} hint={`${Math.round((a.unique / a.words) * 100)}% diversity`} />
              <Stat label="Avg sentence" value={`${(a.words / a.sentences).toFixed(1)} words`} />
              <Stat label="Reading time" value={`${Math.max(1, Math.round(a.words / 238))} min`} />
            </StatGrid>
            <ToolPanel
              title="Most used"
              actions={
                <>
                  <Segmented size="sm" value={n} onChange={setN} options={[{ value: "1", label: "Words" }, { value: "2", label: "2-word phrases" }, { value: "3", label: "3-word phrases" }]} />
                  <Toggle label="Skip stop words" checked={skipStop} onChange={setSkipStop} />
                  <DownloadButton content={csv} filename="keyword-density.csv" mime="text/csv" iconOnly />
                </>
              }
            >
              <ol className="grid md:grid-cols-2 md:[&>li:nth-child(odd)]:border-r divide-y divide-border">
                {a.top.map(([k, c], i) => (
                  <li key={k} className="relative flex items-center gap-3 px-3.5 h-8 text-[13px] border-border">
                    <span className="absolute inset-y-1 left-0 bg-accent/60 rounded-r-sm" style={{ width: `${(c / a.max) * 100}%` }} />
                    <span className="relative w-5 text-right text-[11px] text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="relative flex-1 truncate">{k}</span>
                    <span className="relative font-mono text-xs tabular-nums">{c}</span>
                    <span className={cn("relative w-12 text-right text-[11px] tabular-nums", (c * Number(n) * 100) / a.words > 4 ? "text-destructive" : "text-muted-foreground")}>{((c * Number(n) * 100) / a.words).toFixed(1)}%</span>
                  </li>
                ))}
              </ol>
              {!a.top.length && <p className="px-3.5 py-6 text-center text-xs text-muted-foreground">No repeated {n}-word phrases yet.</p>}
            </ToolPanel>
            <p className="text-[11px] text-muted-foreground px-0.5">Density is a rough signal, not a ranking factor on its own — write for readers, cover the topic thoroughly, and use the main phrase naturally in the heading and opening.</p>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
