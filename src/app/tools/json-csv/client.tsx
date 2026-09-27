"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

type Dir = "json-csv" | "csv-json";
type Delim = "," | ";" | "\t" | "|";

const SAMPLE_JSON = `[\n  { "id": 1, "name": "Ada Lovelace", "email": "ada@example.com", "address": { "city": "London" }, "tags": ["math", "code"] },\n  { "id": 2, "name": "Alan Turing", "email": null, "address": { "city": "Wilmslow" } },\n  { "id": 3, "name": "Grace \\"Amazing\\" Hopper", "role": "Admiral" }\n]`;
const SAMPLE_CSV = `id,name,email,city\n1,Ada Lovelace,ada@example.com,London\n2,"Turing, Alan",,Wilmslow\n3,"Grace ""Amazing"" Hopper",grace@example.com,New York`;

/** Flattens nested objects to dotted keys (address.city); arrays become JSON strings. */
function flatten(o: unknown, prefix = "", out: Record<string, unknown> = {}) {
  if (o && typeof o === "object" && !Array.isArray(o)) {
    for (const [k, v] of Object.entries(o)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else out[prefix || "value"] = Array.isArray(o) ? JSON.stringify(o) : o;
  return out;
}

/** Rebuilds nesting from dotted headers. */
function unflatten(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const parts = k.split(".");
    let cur = out;
    parts.slice(0, -1).forEach((p) => (cur = (cur[p] ??= {}) as Record<string, unknown>));
    cur[parts[parts.length - 1]] = v;
  }
  return out;
}

export default function JSONCSVConverter() {
  const [dir, setDir] = useState<Dir>("json-csv");
  const [input, setInput] = useState("");
  const [delim, setDelim] = useState<Delim>(",");
  const [flat, setFlat] = useState(true);
  const [typed, setTyped] = useState(true);
  const [excelBom, setExcelBom] = useState(false);

  const { output, error, rows } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null, rows: 0 };
    try {
      if (dir === "json-csv") {
        const data = JSON.parse(input);
        const arr = (Array.isArray(data) ? data : [data]).map((r) => (flat ? flatten(r) : Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k, v && typeof v === "object" ? JSON.stringify(v) : v]))));
        // Union of columns across all rows, first-seen order.
        const cols = [...new Set(arr.flatMap((r) => Object.keys(r)))];
        return { output: Papa.unparse(arr, { columns: cols, delimiter: delim, newline: "\n" }), error: null, rows: arr.length };
      }
      const res = Papa.parse<Record<string, unknown>>(input.trim(), { header: true, delimiter: "", skipEmptyLines: true, dynamicTyping: typed });
      if (res.errors.length && !res.data.length) throw new Error(res.errors[0].message);
      const data = res.data.map((r) => (flat ? unflatten(r) : r));
      return { output: JSON.stringify(data, null, 2), error: res.errors[0] ? `Row ${(res.errors[0].row ?? 0) + 2}: ${res.errors[0].message}` : null, rows: data.length };
    } catch (e) {
      return { output: "", error: (e as Error).message, rows: 0 };
    }
  }, [input, dir, delim, flat, typed]);

  return (
    <ToolLayout toolId="json-csv">
      <TextTransform
        input={input}
        onInput={setInput}
        output={dir === "json-csv" && excelBom && output ? `\uFEFF${output}` : output}
        error={error}
        sample={dir === "json-csv" ? SAMPLE_JSON : SAMPLE_CSV}
        inputLabel={dir === "json-csv" ? "JSON" : "CSV"}
        outputLabel={`${dir === "json-csv" ? "CSV" : "JSON"}${rows ? ` · ${rows} rows` : ""}`}
        filename={dir === "json-csv" ? "data.csv" : "data.json"}
        options={
          <>
            <Segmented value={dir} onChange={(d) => { setDir(d); setInput(output); }} options={[{ value: "json-csv", label: "JSON → CSV" }, { value: "csv-json", label: "CSV → JSON" }]} />
            <Button variant="ghost" size="icon" onClick={() => { setDir(dir === "json-csv" ? "csv-json" : "json-csv"); setInput(output); }} aria-label="Swap" title="Swap">
              <ArrowLeftRight />
            </Button>
            {dir === "json-csv" && (
              <Field label="Delimiter">
                <Segmented size="sm" value={delim} onChange={setDelim} options={[{ value: ",", label: "," }, { value: ";", label: ";" }, { value: "\t", label: "Tab" }, { value: "|", label: "|" }]} />
              </Field>
            )}
            <Toggle label={dir === "json-csv" ? "Flatten nested (a.b)" : "Nest dotted headers (a.b)"} checked={flat} onChange={setFlat} />
            {dir === "csv-json" ? <Toggle label="Detect numbers & booleans" checked={typed} onChange={setTyped} /> : <Toggle label="Excel-friendly (UTF-8 BOM)" checked={excelBom} onChange={setExcelBom} />}
          </>
        }
      />
    </ToolLayout>
  );
}
