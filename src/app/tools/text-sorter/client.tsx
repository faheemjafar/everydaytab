"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

type By = "alpha" | "natural" | "length" | "numeric" | "random";

const SAMPLE = "Zebra\nApple\nbanana\nitem 10\nCherry\nitem 2\nApple\ndog\n\nElephant\nitem 1\nfox";

/** Deterministic shuffle so re-renders don't reshuffle; the seed changes on click. */
function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TextSorter() {
  const [input, setInput] = useState("");
  const [by, setBy] = useState<By>("natural");
  const [desc, setDesc] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [unique, setUnique] = useState(false);
  const [dropEmpty, setDropEmpty] = useState(true);
  const [trim, setTrim] = useState(true);
  const [seed, setSeed] = useState(1);

  const { output, removed } = useMemo(() => {
    let lines = input.split("\n");
    if (trim) lines = lines.map((l) => l.trim());
    if (dropEmpty) lines = lines.filter((l) => l.trim() !== "");
    const before = lines.length;
    if (unique) {
      const seen = new Set<string>();
      lines = lines.filter((l) => {
        const k = caseSensitive ? l : l.toLowerCase();
        return seen.has(k) ? false : (seen.add(k), true);
      });
    }
    const removed = before - lines.length;
    const coll = new Intl.Collator(undefined, { numeric: by === "natural", sensitivity: caseSensitive ? "variant" : "base" });
    if (by === "random") lines = shuffle(lines, seed);
    else
      lines.sort((a, b) => {
        if (by === "length") return a.length - b.length || coll.compare(a, b);
        if (by === "numeric") return (parseFloat(a.replace(/[^\d.-]/g, "")) || 0) - (parseFloat(b.replace(/[^\d.-]/g, "")) || 0);
        return coll.compare(a, b);
      });
    if (desc && by !== "random") lines.reverse();
    return { output: input ? lines.join("\n") : "", removed };
  }, [input, by, desc, caseSensitive, unique, dropEmpty, trim, seed]);

  return (
    <ToolLayout toolId="text-sorter">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        sample={SAMPLE}
        filename="sorted.txt"
        outputLabel={unique && removed ? `Sorted · ${removed} duplicate${removed === 1 ? "" : "s"} removed` : "Sorted"}
        options={
          <>
            <Field label="Sort by">
              <Segmented
                size="sm"
                value={by}
                onChange={(v) => { setBy(v); if (v === "random") setSeed(Date.now() % 100000); }}
                options={[
                  { value: "natural", label: "Natural (2 < 10)" },
                  { value: "alpha", label: "A–Z" },
                  { value: "length", label: "Length" },
                  { value: "numeric", label: "Number" },
                  { value: "random", label: "Shuffle" },
                ]}
              />
            </Field>
            {by === "random" ? (
              <button type="button" onClick={() => setSeed((s) => s + 7919)} className="h-(--control-h) px-2.5 rounded-md border border-border text-xs hover:bg-muted">
                Reshuffle
              </button>
            ) : (
              <Toggle label="Descending" checked={desc} onChange={setDesc} />
            )}
            <Toggle label="Case-sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
            <Toggle label="Remove duplicates" checked={unique} onChange={setUnique} />
            <Toggle label="Drop empty lines" checked={dropEmpty} onChange={setDropEmpty} />
            <Toggle label="Trim lines" checked={trim} onChange={setTrim} />
          </>
        }
      />
    </ToolLayout>
  );
}
