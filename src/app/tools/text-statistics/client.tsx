"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ClearButton, CodeArea, DownloadButton, Segmented, Stat, StatGrid, StatusBadge, ToolPanel, Toggle } from "@/components/tool";

const STOP = new Set(
  "a an and are as at be but by for from has have he her his i in is it its of on or our she that the their them they this to was we were will with you your not no so if then than there what which who when where how all any can do does did just about into over out up more most some such only also very been being would could should may might must shall".split(" ")
);

const seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "word" }) : null;
const tokenize = (t: string) => (seg ? Array.from(seg.segment(t)).filter((s) => s.isWordLike).map((s) => s.segment) : t.match(/[\p{L}\p{N}'’]+/gu) ?? []);
const sentencesOf = (t: string) => t.match(/[^.!?\n]+[.!?]+["')\]]*|[^.!?\n]+$/gm)?.map((s) => s.trim()).filter(Boolean) ?? [];
const fmtTime = (min: number) => (min < 1 ? `${Math.max(1, Math.round(min * 60))} sec` : `${Math.floor(min)} min${min % 1 >= 0.5 ? " 30 s" : ""}`);

export default function TextStatistics() {
  const [input, setInput] = useState("");
  const [ignoreStop, setIgnoreStop] = useState(true);
  const [gram, setGram] = useState<"1" | "2" | "3">("1");

  const s = useMemo(() => {
    if (!input.trim()) return null;
    const words = tokenize(input);
    const lower = words.map((w) => w.toLowerCase().replace(/’/g, "'"));
    const sentences = sentencesOf(input);
    const paragraphs = input.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const unique = new Set(lower);
    const n = Number(gram);
    const counts = new Map<string, number>();
    for (let i = 0; i + n <= lower.length; i++) {
      const slice = lower.slice(i, i + n);
      if (ignoreStop && (n === 1 ? STOP.has(slice[0]) : STOP.has(slice[0]) || STOP.has(slice[n - 1]))) continue;
      if (n === 1 && /^\d+$/.test(slice[0])) continue;
      const k = slice.join(" ");
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const top = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 25);
    const sentLens = sentences.map((x) => tokenize(x).length);
    const longestWords = [...unique].sort((a, b) => b.length - a.length).slice(0, 8);
    const chars = Array.from(input).length;
    return {
      words: words.length,
      unique: unique.size,
      chars,
      charsNoSpace: Array.from(input.replace(/\s/g, "")).length,
      letters: (input.match(/\p{L}/gu) ?? []).length,
      sentences: sentences.length,
      paragraphs,
      lines: input.split("\n").length,
      avgWord: words.length ? words.join("").length / words.length : 0,
      avgSentence: sentences.length ? words.length / sentences.length : 0,
      diversity: words.length ? unique.size / words.length : 0,
      top,
      maxCount: top[0]?.[1] ?? 1,
      longestSentence: sentences[sentLens.indexOf(Math.max(0, ...sentLens))] ?? "",
      longestSentenceLen: Math.max(0, ...sentLens),
      longestWords,
      reading: words.length / 238,
      speaking: words.length / 150,
    };
  }, [input, ignoreStop, gram]);

  const csv = s ? ["term,count,percent", ...s.top.map(([k, v]) => `"${k}",${v},${((v / s.words) * 100).toFixed(2)}`)].join("\n") : "";

  return (
    <ToolLayout toolId="text-statistics">
      <div className="space-y-3">
        <ToolPanel title="Text" actions={<><StatusBadge>{s?.words ?? 0} words</StatusBadge><ClearButton onClick={() => setInput("")} iconOnly disabled={!input} /></>}>
          <CodeArea value={input} onChange={(e) => setInput(e.target.value)} minHeight={200} placeholder="Paste an article, essay or transcript…" className="font-sans text-[14px]" />
        </ToolPanel>

        {s && (
          <>
            <StatGrid>
              <Stat label="Words" value={s.words.toLocaleString()} hint={`${s.unique.toLocaleString()} unique`} />
              <Stat label="Characters" value={s.chars.toLocaleString()} hint={`${s.charsNoSpace.toLocaleString()} without spaces`} />
              <Stat label="Sentences" value={s.sentences} hint={`${s.paragraphs} paragraphs · ${s.lines} lines`} />
              <Stat label="Reading time" value={fmtTime(s.reading)} hint={`Speaking ${fmtTime(s.speaking)}`} />
              <Stat label="Avg word length" value={`${s.avgWord.toFixed(1)} chars`} />
              <Stat label="Avg sentence" value={`${s.avgSentence.toFixed(1)} words`} />
              <Stat label="Lexical diversity" value={`${Math.round(s.diversity * 100)}%`} hint="Unique ÷ total words" />
              <Stat label="Longest sentence" value={`${s.longestSentenceLen} words`} />
            </StatGrid>

            <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
              <ToolPanel
                title="Most frequent"
                actions={
                  <>
                    <Segmented size="sm" value={gram} onChange={setGram} options={[{ value: "1", label: "Words" }, { value: "2", label: "2-word" }, { value: "3", label: "3-word" }]} />
                    <Toggle label="Skip common words" checked={ignoreStop} onChange={setIgnoreStop} />
                    <DownloadButton content={csv} filename="word-frequency.csv" mime="text/csv" iconOnly />
                  </>
                }
              >
                {s.top.length ? (
                  <ol className="divide-y divide-border">
                    {s.top.map(([k, v], i) => (
                      <li key={k} className="relative flex items-center gap-3 px-3.5 h-8 text-[13px]">
                        <span className="absolute inset-y-1 left-0 bg-accent/60 rounded-r-sm" style={{ width: `${(v / s.maxCount) * 100}%` }} />
                        <span className="relative w-5 text-right text-[11px] text-muted-foreground tabular-nums">{i + 1}</span>
                        <span className="relative flex-1 truncate">{k}</span>
                        <span className="relative font-mono text-xs tabular-nums">{v}</span>
                        <span className="relative w-12 text-right text-[11px] text-muted-foreground tabular-nums">{((v / s.words) * 100).toFixed(1)}%</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="px-3.5 py-6 text-center text-xs text-muted-foreground">Not enough text for {gram}-word phrases.</p>
                )}
              </ToolPanel>
              <div className="space-y-3">
                <ToolPanel title="Longest words" bodyClassName="p-3 flex flex-wrap gap-1.5">
                  {s.longestWords.map((w) => (
                    <span key={w} className="inline-flex items-center h-6 px-2 rounded-sm border border-border text-xs">
                      {w} <span className="ml-1.5 text-muted-foreground tabular-nums">{Array.from(w).length}</span>
                    </span>
                  ))}
                </ToolPanel>
                <ToolPanel title="Longest sentence">
                  <p className="px-3.5 py-2.5 text-[13px] leading-relaxed">{s.longestSentence}</p>
                </ToolPanel>
              </div>
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
