"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

type Split = "auto" | "newline" | "comma" | "semicolon" | "tab" | "space";
type Join = "newline" | "comma" | "comma-space" | "semicolon" | "tab" | "space" | "pipe" | "custom";
type Wrap = "none" | "single" | "double" | "backtick";
type Format = "plain" | "bullets" | "numbered" | "markdown" | "html" | "json" | "sql";

const SPLIT: Record<Exclude<Split, "auto">, RegExp> = { newline: /\r?\n/, comma: /,/, semicolon: /;/, tab: /\t/, space: /\s+/ };
const JOIN: Record<Exclude<Join, "custom">, string> = { newline: "\n", comma: ",", "comma-space": ", ", semicolon: ";", tab: "\t", space: " ", pipe: " | " };
const Q: Record<Wrap, string> = { none: "", single: "'", double: '"', backtick: "`" };

export default function ListConverter() {
  const [input, setInput] = useState("");
  const [split, setSplit] = useState<Split>("auto");
  const [format, setFormat] = useState<Format>("plain");
  const [join, setJoin] = useState<Join>("comma-space");
  const [custom, setCustom] = useState(" / ");
  const [wrap, setWrap] = useState<Wrap>("none");
  const [trim, setTrim] = useState(true);
  const [dropEmpty, setDropEmpty] = useState(true);
  const [unique, setUnique] = useState(false);
  const [sort, setSort] = useState(false);

  const { output, count } = useMemo(() => {
    // Auto: newlines if present, else commas, else tabs, else whitespace.
    const re = split !== "auto" ? SPLIT[split] : /\n/.test(input) ? SPLIT.newline : /,/.test(input) ? SPLIT.comma : /\t/.test(input) ? SPLIT.tab : /;/.test(input) ? SPLIT.semicolon : SPLIT.space;
    let items = input.split(re);
    if (trim) items = items.map((s) => s.trim());
    if (dropEmpty) items = items.filter(Boolean);
    if (unique) items = [...new Set(items)];
    if (sort) items.sort(new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare);
    const q = Q[wrap];
    const w = items.map((s) => `${q}${q ? s.replaceAll(q, `\\${q}`) : s}${q}`);
    const out = !input
      ? ""
      : format === "bullets" ? items.map((s) => `• ${s}`).join("\n")
      : format === "numbered" ? items.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : format === "markdown" ? items.map((s) => `- ${s}`).join("\n")
      : format === "html" ? `<ul>\n${items.map((s) => `  <li>${s.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</li>`).join("\n")}\n</ul>`
      : format === "json" ? JSON.stringify(items, null, 2)
      : format === "sql" ? `(${items.map((s) => `'${s.replace(/'/g, "''")}'`).join(", ")})`
      : w.join(join === "custom" ? custom.replace(/\\n/g, "\n") : JOIN[join]);
    return { output: out, count: items.length };
  }, [input, split, format, join, custom, wrap, trim, dropEmpty, unique, sort]);

  return (
    <ToolLayout toolId="list-converter">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        sample={"apple\nbanana\ncherry\nbanana\ndate\n\nelderberry"}
        filename="list.txt"
        outputLabel={input ? `Output · ${count} items` : "Output"}
        options={
          <>
            <Field label="Input separated by">
              <Segmented size="sm" value={split} onChange={setSplit} options={(["auto", "newline", "comma", "semicolon", "tab", "space"] as Split[]).map((v) => ({ value: v, label: v === "auto" ? "Auto" : v[0].toUpperCase() + v.slice(1) }))} />
            </Field>
            <Field label="Output as">
              <Segmented
                size="sm"
                value={format}
                onChange={setFormat}
                options={[
                  { value: "plain", label: "Joined" },
                  { value: "bullets", label: "• Bullets" },
                  { value: "numbered", label: "1. Numbered" },
                  { value: "markdown", label: "Markdown" },
                  { value: "html", label: "HTML" },
                  { value: "json", label: "JSON" },
                  { value: "sql", label: "SQL IN" },
                ]}
              />
            </Field>
            {format === "plain" && (
              <>
                <Field label="Join with">
                  <Segmented
                    size="sm"
                    value={join}
                    onChange={setJoin}
                    options={[
                      { value: "comma-space", label: ", " },
                      { value: "comma", label: "," },
                      { value: "newline", label: "↵" },
                      { value: "semicolon", label: ";" },
                      { value: "tab", label: "Tab" },
                      { value: "space", label: "␣" },
                      { value: "pipe", label: "|" },
                      { value: "custom", label: "…" },
                    ]}
                  />
                </Field>
                {join === "custom" && <Input value={custom} onChange={(e) => setCustom(e.target.value)} className="w-24 font-mono" aria-label="Custom separator" />}
                <Field label="Quote">
                  <Segmented size="sm" value={wrap} onChange={setWrap} options={[{ value: "none", label: "None" }, { value: "single", label: "'a'" }, { value: "double", label: '"a"' }, { value: "backtick", label: "`a`" }]} />
                </Field>
              </>
            )}
            <Toggle label="Trim" checked={trim} onChange={setTrim} />
            <Toggle label="Drop empty" checked={dropEmpty} onChange={setDropEmpty} />
            <Toggle label="Unique" checked={unique} onChange={setUnique} />
            <Toggle label="Sort" checked={sort} onChange={setSort} />
          </>
        }
      />
    </ToolLayout>
  );
}
