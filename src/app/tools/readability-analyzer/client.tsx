"use client";

import { useMemo, useState } from "react";
import readability from "text-readability";
import { ToolLayout } from "@/components/tool-layout";
import { ClearButton, CodeArea, Stat, StatGrid, StatusBadge, ToolPanel, Toggle } from "@/components/tool";
import { cn } from "@/lib/utils";

const SAMPLE = `Readability matters. Short sentences help. They are easy to scan and easy to remember.

However, when a writer strings together numerous subordinate clauses, qualifications, and parenthetical observations that, while individually reasonable, collectively obscure the central argument, the reader is forced to hold an unreasonable amount of information in working memory before reaching the point.

Use plain words. Cut what you don't need.`;

function ease(score: number) {
  if (score >= 80) return { label: "Easy", audience: "Age 11–13 · conversational", tone: "success" as const };
  if (score >= 60) return { label: "Plain English", audience: "Age 13–15 · most web copy", tone: "success" as const };
  if (score >= 50) return { label: "Fairly difficult", audience: "High school senior", tone: "warning" as const };
  if (score >= 30) return { label: "Difficult", audience: "University", tone: "warning" as const };
  return { label: "Very difficult", audience: "Graduate / academic", tone: "error" as const };
}

const split = (t: string) => t.match(/[^.!?\n]+[.!?]+["')\]]*|[^.!?\n]+$/gm)?.map((s) => s.trim()).filter(Boolean) ?? [];
const words = (s: string) => s.match(/[\p{L}\p{N}'’-]+/gu) ?? [];

export default function ReadabilityAnalyzer() {
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState(true);

  const r = useMemo(() => {
    const wc = words(input).length;
    if (wc < 3) return null;
    const grades = {
      "Flesch–Kincaid": readability.fleschKincaidGrade(input),
      "Gunning Fog": readability.gunningFog(input),
      SMOG: readability.smogIndex(input),
      "Coleman–Liau": readability.colemanLiauIndex(input),
      ARI: readability.automatedReadabilityIndex(input),
      "Dale–Chall": readability.daleChallReadabilityScore(input),
    };
    return {
      ease: readability.fleschReadingEase(input),
      grades,
      consensus: readability.textStandard(input, false) as string,
      words: wc,
      // The library's sentenceCount undercounts; use our own splitter for counts.
      sentences: split(input).length,
      avgSentence: wc / Math.max(1, split(input).length),
      syllables: readability.averageSyllablePerWord(input),
      difficult: readability.difficultWords(input),
      poly: readability.polySyllableCount(input),
    };
  }, [input]);

  const sentences = useMemo(() => split(input).map((s) => ({ s, n: words(s).length })), [input]);
  const e = r ? ease(r.ease) : null;
  const long = sentences.filter((x) => x.n > 25).length;

  return (
    <ToolLayout toolId="readability-analyzer">
      <div className="space-y-3">
        <ToolPanel title="Text" actions={<><StatusBadge>{r?.words ?? 0} words</StatusBadge>{!input && <button type="button" onClick={() => setInput(SAMPLE)} className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted">Sample</button>}<ClearButton onClick={() => setInput("")} iconOnly disabled={!input} /></>}>
          <CodeArea value={input} onChange={(ev) => setInput(ev.target.value)} minHeight={200} placeholder="Paste an article, email or paragraph…" className="font-sans text-[14px]" />
        </ToolPanel>

        {r && e && (
          <>
            <div className="grid gap-3 md:grid-cols-[260px_1fr]">
              <ToolPanel bodyClassName="p-4 flex flex-col items-center justify-center gap-1 text-center">
                <span className="text-4xl font-semibold tabular-nums">{Math.round(r.ease)}</span>
                <span className="text-xs text-muted-foreground">Flesch reading ease (0–100)</span>
                <StatusBadge tone={e.tone} className="mt-2">{e.label}</StatusBadge>
                <span className="text-[11px] text-muted-foreground">{e.audience}</span>
              </ToolPanel>
              <ToolPanel title={`Grade level · consensus ${r.consensus}`}>
                <ul className="divide-y divide-border">
                  {Object.entries(r.grades).map(([k, v]) => (
                    <li key={k} className="flex items-center gap-3 px-3.5 h-9 text-sm">
                      <span className="w-32 text-xs text-muted-foreground">{k}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", v <= 8 ? "bg-emerald-500" : v <= 12 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${Math.min(100, (v / 18) * 100)}%` }} />
                      </div>
                      <span className="w-10 text-right font-mono text-xs tabular-nums">{v.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              </ToolPanel>
            </div>
            <StatGrid>
              <Stat label="Sentences" value={r.sentences} hint={`${long} over 25 words`} />
              <Stat label="Avg sentence" value={`${r.avgSentence.toFixed(1)} words`} hint="Aim for 15–20" />
              <Stat label="Syllables / word" value={r.syllables.toFixed(2)} />
              <Stat label="Complex words" value={r.poly} hint={`${r.difficult} uncommon`} />
            </StatGrid>
            <ToolPanel title="Sentence length" actions={<Toggle label="Highlight" checked={highlight} onChange={setHighlight} />}>
              <p className="px-4 py-3 text-[14px] leading-7">
                {sentences.map((x, i) => (
                  <span key={i} className={cn(highlight && x.n > 30 && "bg-red-500/20", highlight && x.n > 20 && x.n <= 30 && "bg-amber-500/20", "rounded-[2px]")} title={`${x.n} words`}>
                    {x.s}{" "}
                  </span>
                ))}
              </p>
              {highlight && (
                <div className="flex gap-4 px-4 pb-3 text-[11px] text-muted-foreground">
                  <span><span className="inline-block w-3 h-3 align-middle rounded-sm bg-amber-500/30 mr-1" />21–30 words</span>
                  <span><span className="inline-block w-3 h-3 align-middle rounded-sm bg-red-500/30 mr-1" />over 30 — consider splitting</span>
                </div>
              )}
            </ToolPanel>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
