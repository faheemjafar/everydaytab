"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { CopyButton, DownloadButton, Field, OptionsLayout, Segmented, SliderField, StatusBadge, ToolPanel, Toggle } from "@/components/tool";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
  "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
  "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla",
  "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
  "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"
];
const CLASSIC = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

type Unit = "paragraphs" | "sentences" | "words" | "list";
type Out = "text" | "html" | "markdown";

const pick = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
function sentence() {
  const n = 6 + Math.floor(Math.random() * 10);
  const w = Array.from({ length: n }, pick);
  // Occasional comma for natural rhythm.
  if (n > 8) w[3 + Math.floor(Math.random() * (n - 6))] += ",";
  return cap(w.join(" ")) + ".";
}
const paragraph = () => Array.from({ length: 4 + Math.floor(Math.random() * 4) }, sentence).join(" ");

function generate(unit: Unit, n: number, classic: boolean): string[] {
  let items: string[];
  if (unit === "words") items = [cap(Array.from({ length: n }, pick).join(" ")) + "."];
  else if (unit === "sentences") items = [Array.from({ length: n }, sentence).join(" ")];
  else if (unit === "list") items = Array.from({ length: n }, () => cap(Array.from({ length: 3 + Math.floor(Math.random() * 5) }, pick).join(" ")));
  else items = Array.from({ length: n }, paragraph);
  if (classic && items.length) {
    if (unit === "words") items[0] = cap(["lorem", "ipsum", "dolor", "sit", "amet", ...items[0].toLowerCase().replace(/\.$/, "").split(" ").slice(5)].slice(0, Math.max(n, 1)).join(" ")) + ".";
    else if (unit === "list") items[0] = "Lorem ipsum dolor sit amet";
    else items[0] = CLASSIC + " " + items[0].split(". ").slice(1).join(". ");
  }
  return items.map((s) => s.trim());
}

export default function LoremIpsumGenerator() {
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [out, setOut] = useState<Out>("text");
  const [items, setItems] = useState<string[]>([]);

  const regen = (u = unit, n = count, c = classic) => setItems(generate(u, n, c));
  useEffect(() => {
    const t = setTimeout(() => regen(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const text =
    unit === "list"
      ? out === "html" ? `<ul>\n${items.map((i) => `  <li>${i}</li>`).join("\n")}\n</ul>` : items.map((i) => (out === "markdown" ? `- ${i}` : i)).join("\n")
      : out === "html" ? items.map((p) => `<p>${p}</p>`).join("\n\n") : items.join("\n\n");
  const words = items.join(" ").split(/\s+/).filter(Boolean).length;
  const max = unit === "words" ? 1000 : unit === "sentences" ? 50 : 20;

  const options = (
    <ToolPanel title="Options" bodyClassName="p-3 space-y-4" footer={<Button size="lg" onClick={() => regen()} className="w-full"><RefreshCw /> Generate</Button>}>
      <Field label="Generate">
        <Segmented size="sm" value={unit} onChange={(u) => { const n = Math.min(count, u === "words" ? 1000 : u === "sentences" ? 50 : 20); setUnit(u); setCount(n); regen(u, n); }} options={[{ value: "paragraphs", label: "Paragraphs" }, { value: "sentences", label: "Sentences" }, { value: "words", label: "Words" }, { value: "list", label: "List items" }]} className="flex-wrap" />
      </Field>
      <SliderField label="Amount" value={count} onChange={(n) => { setCount(n); regen(unit, n); }} min={1} max={max} />
      <Toggle label="Start with “Lorem ipsum dolor sit amet…”" checked={classic} onChange={(c) => { setClassic(c); regen(unit, count, c); }} />
      <Field label="Output"><Segmented size="sm" value={out} onChange={setOut} options={[{ value: "text", label: "Plain text" }, { value: "html", label: "HTML" }, { value: "markdown", label: "Markdown" }]} /></Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="lorem-ipsum">
      <OptionsLayout options={options}>
        <ToolPanel title="Placeholder text" actions={<><StatusBadge>{words} words</StatusBadge><CopyButton text={text} label="Copy" /><DownloadButton content={text} filename={out === "html" ? "lorem.html" : "lorem.txt"} iconOnly /></>}>
          {out === "text" ? (
            <div className="p-4 space-y-3 text-[14px] leading-relaxed max-h-[600px] overflow-y-auto custom-scrollbar">
              {unit === "list" ? <ul className="list-disc pl-5 space-y-1">{items.map((i, k) => <li key={k}>{i}</li>)}</ul> : items.map((p, k) => <p key={k}>{p}</p>)}
            </div>
          ) : (
            <pre className="p-4 font-mono text-[12.5px] whitespace-pre-wrap max-h-[600px] overflow-y-auto custom-scrollbar">{text}</pre>
          )}
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
