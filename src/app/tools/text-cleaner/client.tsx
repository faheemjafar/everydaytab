"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { TextTransform, Toggle } from "@/components/tool";

const SAMPLE = `  This   text   has    too    many    spaces.
It also has
unnecessary
line breaks.
And some tabs:\there\tand\there.
“Smart quotes” and em—dashes… from Word.
Also some emojis: 👋 🌍 🚀
Invisible​zero‑width characters!
<p>And some <b>HTML</b> tags</p>
   Trim this line   `;

const RULES = [
  { id: "trim", label: "Trim lines", fn: (s: string) => s.split("\n").map((l) => l.trim()).join("\n") },
  { id: "spaces", label: "Collapse spaces", fn: (s: string) => s.replace(/[ \t\u00a0]+/g, " ") },
  { id: "blank", label: "Remove blank lines", fn: (s: string) => s.replace(/\n\s*\n+/g, "\n") },
  { id: "breaks", label: "Join lines", fn: (s: string) => s.replace(/\s*\n\s*/g, " ") },
  { id: "invisible", label: "Strip invisible chars", fn: (s: string) => s.replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "") },
  { id: "quotes", label: "Straighten quotes & dashes", fn: (s: string) => s.replace(/[\u2018\u2019\u201A\u2032]/g, "'").replace(/[\u201C\u201D\u201E\u2033]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/\u2026/g, "...").replace(/[\u2010\u2011]/g, "-") },
  { id: "html", label: "Strip HTML tags", fn: (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") },
  { id: "emoji", label: "Remove emoji", fn: (s: string) => s.replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu, "").replace(/ {2,}/g, " ") },
  { id: "punct", label: "Remove punctuation", fn: (s: string) => s.replace(/[\p{P}\p{S}]/gu, "") },
  { id: "digits", label: "Remove numbers", fn: (s: string) => s.replace(/\d+/g, "") },
  { id: "ascii", label: "Remove accents", fn: (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "") },
  { id: "tabs", label: "Tabs → spaces", fn: (s: string) => s.replace(/\t/g, "    ") },
] as const;
type RuleId = (typeof RULES)[number]["id"];

export default function TextCleaner() {
  const [input, setInput] = useState("");
  const [on, setOn] = useState<Set<RuleId>>(new Set(["trim", "spaces", "invisible", "quotes"]));

  // Rules apply in the order listed, so e.g. HTML stripping happens before space collapsing where relevant.
  const output = useMemo(() => RULES.reduce((s, r) => (on.has(r.id) ? r.fn(s) : s), input).trim(), [input, on]);
  const toggle = (id: RuleId, v: boolean) => setOn((s) => { const n = new Set(s); if (v) n.add(id); else n.delete(id); return n; });

  return (
    <ToolLayout toolId="text-cleaner">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        sample={SAMPLE}
        filename="cleaned.txt"
        outputLabel={input ? `Cleaned · ${Array.from(input).length - Array.from(output).length} chars removed` : "Cleaned"}
        options={RULES.map((r) => (
          <Toggle key={r.id} label={r.label} checked={on.has(r.id)} onChange={(v) => toggle(r.id, v)} />
        ))}
      />
    </ToolLayout>
  );
}
