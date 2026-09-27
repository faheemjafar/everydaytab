"use client";

import { useMemo, useState } from "react";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import yaml from "js-yaml";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Field, Segmented, TextTransform } from "@/components/tool";

type Fmt = "json" | "toml" | "yaml";
const LABEL: Record<Fmt, string> = { json: "JSON", toml: "TOML", yaml: "YAML" };

const SAMPLES: Record<Fmt, string> = {
  toml: `title = "My App"

[server]
host = "0.0.0.0"
port = 8080
tls = true

[database]
url = "postgres://localhost/app"
pool = 10

[[workers]]
name = "email"
concurrency = 4

[[workers]]
name = "thumbnails"
concurrency = 2`,
  json: `{\n  "title": "My App",\n  "server": { "host": "0.0.0.0", "port": 8080, "tls": true },\n  "workers": [{ "name": "email", "concurrency": 4 }]\n}`,
  yaml: `title: My App\nserver:\n  host: 0.0.0.0\n  port: 8080\n  tls: true\nworkers:\n  - name: email\n    concurrency: 4`,
};

const parsers: Record<Fmt, (s: string) => unknown> = { json: (s) => JSON.parse(s), toml: (s) => parseToml(s), yaml: (s) => yaml.load(s) };
const writers: Record<Fmt, (v: unknown, indent: number) => string> = {
  json: (v, i) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x), i),
  toml: (v) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("TOML documents must be a table (an object at the top level), not an array or single value.");
    return stringifyToml(v as Record<string, unknown>);
  },
  yaml: (v, i) => yaml.dump(v, { indent: i, lineWidth: 120, noRefs: true }),
};

export default function JSONTOMLConverter() {
  const [from, setFrom] = useState<Fmt>("toml");
  const [to, setTo] = useState<Fmt>("json");
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<"2" | "4">("2");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      return { output: writers[to](parsers[from](input), Number(indent)), error: null };
    } catch (e) {
      return { output: "", error: `${LABEL[from]} → ${LABEL[to]}: ${(e as Error).message}` };
    }
  }, [input, from, to, indent]);

  const fmtOpts = (Object.keys(LABEL) as Fmt[]).map((f) => ({ value: f, label: LABEL[f] }));

  return (
    <ToolLayout toolId="json-toml">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLES[from]}
        inputLabel={LABEL[from]}
        outputLabel={LABEL[to]}
        filename={`converted.${to}`}
        placeholder={`Paste ${LABEL[from]}…`}
        options={
          <>
            <Field label="From">
              <Segmented size="sm" value={from} onChange={(f) => { setFrom(f); if (f === to) setTo(from); }} options={fmtOpts} />
            </Field>
            <Button variant="ghost" size="icon" onClick={() => { setFrom(to); setTo(from); setInput(output); }} aria-label="Swap" title="Swap direction">
              <ArrowLeftRight />
            </Button>
            <Field label="To">
              <Segmented size="sm" value={to} onChange={(t) => { setTo(t); if (t === from) setFrom(to); }} options={fmtOpts} />
            </Field>
            {to !== "toml" && (
              <Field label="Indent">
                <Segmented size="sm" value={indent} onChange={setIndent} options={[{ value: "2", label: "2" }, { value: "4", label: "4" }]} />
              </Field>
            )}
          </>
        }
      />
    </ToolLayout>
  );
}
