"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

type Sep = "-" | "_" | ".";

// Letters that NFD doesn't decompose into base + accent.
const TRANSLIT: Record<string, string> = { ß: "ss", æ: "ae", Æ: "AE", ø: "o", Ø: "O", œ: "oe", Œ: "OE", ł: "l", Ł: "L", đ: "d", Đ: "D", þ: "th", Þ: "TH", ð: "d", "&": " and ", "@": " at ", "%": " percent " };
const STOP = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "at", "by", "is"]);

function slugify(s: string, o: { sep: Sep; lower: boolean; stop: boolean; max: number }) {
  let t = Array.from(s).map((c) => TRANSLIT[c] ?? c).join("").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  if (o.lower) t = t.toLowerCase();
  let words = t.replace(/['’]/g, "").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (o.stop && words.length > 2) words = words.filter((w) => !STOP.has(w.toLowerCase()));
  let out = words.join(o.sep);
  if (o.max && out.length > o.max) out = out.slice(0, o.max).replace(new RegExp(`\\${o.sep}[^\\${o.sep}]*$`), "") || out.slice(0, o.max);
  return out;
}

export default function SlugifyString() {
  const [input, setInput] = useState("");
  const [sep, setSep] = useState<Sep>("-");
  const [lower, setLower] = useState(true);
  const [stop, setStop] = useState(false);
  const [max, setMax] = useState(0);

  // One slug per line, so a list of titles can be converted at once.
  const output = useMemo(() => input.split("\n").map((l) => (l.trim() ? slugify(l, { sep, lower, stop, max }) : "")).join("\n"), [input, sep, lower, stop, max]);

  return (
    <ToolLayout toolId="slugify">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        minHeight={200}
        inputLabel="Titles (one per line)"
        outputLabel="Slugs"
        filename="slugs.txt"
        sample={"10 Tips & Tricks for Café Owners in 2026!\nÜber die Straße — ein Leitfaden\nWhat's New in Next.js?"}
        options={
          <>
            <Field label="Separator">
              <Segmented size="sm" value={sep} onChange={setSep} options={[{ value: "-", label: "hyphen-case" }, { value: "_", label: "snake_case" }, { value: ".", label: "dot.case" }]} />
            </Field>
            <Field label="Max length" htmlFor="max">
              <Input id="max" type="number" min={0} value={max || ""} placeholder="none" onChange={(e) => setMax(Math.max(0, Number(e.target.value) || 0))} className="w-24" />
            </Field>
            <Toggle label="Lowercase" checked={lower} onChange={setLower} />
            <Toggle label="Remove stop words" checked={stop} onChange={setStop} hint="a, the, and, of…" />
          </>
        }
      />
    </ToolLayout>
  );
}
