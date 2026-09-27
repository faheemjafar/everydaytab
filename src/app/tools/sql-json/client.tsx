"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Segmented, TextTransform, Field } from "@/components/tool";

const SAMPLE = `INSERT INTO users (id, name, email, active, bio) VALUES
  (1, 'Ada Lovelace', 'ada@example.com', TRUE, 'Wrote the first program, (1843)'),
  (2, 'Alan O''Neil', NULL, false, 'Quotes '' and commas, work');
INSERT INTO \`orders\` (\`id\`, \`user_id\`, \`total\`) VALUES (10, 1, 19.99), (11, 2, -5.5);`;

type Val = string | number | boolean | null;

/** Tokenises a VALUES list: respects quotes ('' and \\' escapes), nested parens and commas. */
function parseTuples(s: string): Val[][] {
  const rows: Val[][] = [];
  let i = 0;
  const skip = () => { while (i < s.length && /[\s,]/.test(s[i])) i++; };
  while (i < s.length) {
    skip();
    if (s[i] !== "(") break;
    i++;
    const row: Val[] = [];
    while (i < s.length && s[i] !== ")") {
      while (/\s/.test(s[i])) i++;
      if (s[i] === "'" || s[i] === '"') {
        const qc = s[i++];
        let v = "";
        while (i < s.length) {
          if (s[i] === "\\" && i + 1 < s.length) { v += s[i + 1] === "n" ? "\n" : s[i + 1]; i += 2; continue; }
          if (s[i] === qc && s[i + 1] === qc) { v += qc; i += 2; continue; }
          if (s[i] === qc) { i++; break; }
          v += s[i++];
        }
        row.push(v);
      } else {
        let v = "";
        let depth = 0;
        while (i < s.length && (depth > 0 || (s[i] !== "," && s[i] !== ")"))) {
          if (s[i] === "(") depth++;
          if (s[i] === ")") depth--;
          v += s[i++];
        }
        const t = v.trim();
        row.push(/^null$/i.test(t) ? null : /^true$/i.test(t) ? true : /^false$/i.test(t) ? false : t !== "" && !isNaN(Number(t)) ? Number(t) : t);
      }
      while (/\s/.test(s[i])) i++;
      if (s[i] === ",") i++;
    }
    i++;
    rows.push(row);
  }
  return rows;
}

const unq = (s: string) => s.trim().replace(/^[`"[]|[`"\]]$/g, "");

function convert(sql: string) {
  const tables: Record<string, Record<string, Val>[]> = {};
  const re = /INSERT\s+(?:IGNORE\s+)?INTO\s+([`"[\]\w.]+)\s*(?:\(([^)]*)\))?\s*VALUES\s*/gi;
  let m: RegExpExecArray | null;
  const starts: { table: string; cols: string[] | null; at: number; idx: number }[] = [];
  while ((m = re.exec(sql))) starts.push({ table: unq(m[1]), cols: m[2] ? m[2].split(",").map(unq) : null, at: re.lastIndex, idx: m.index });
  if (!starts.length) throw new Error("No INSERT INTO … VALUES statements found.");
  starts.forEach((st, k) => {
    const end = k + 1 < starts.length ? starts[k + 1].idx : sql.length;
    const rows = parseTuples(sql.slice(st.at, end).replace(/;[\s\S]*$/, ""));
    (tables[st.table] ??= []).push(...rows.map((r) => Object.fromEntries(r.map((v, j) => [st.cols?.[j] ?? `col${j + 1}`, v]))));
  });
  return tables;
}

export default function SQLToJSON() {
  const [input, setInput] = useState("");
  const [shape, setShape] = useState<"auto" | "grouped">("auto");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      const t = convert(input);
      const names = Object.keys(t);
      return { output: JSON.stringify(shape === "auto" && names.length === 1 ? t[names[0]] : t, null, 2), error: null };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input, shape]);

  return (
    <ToolLayout toolId="sql-json">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLE}
        inputLabel="SQL INSERT statements"
        outputLabel="JSON"
        filename="data.json"
        options={
          <>
            <Field label="Output">
              <Segmented size="sm" value={shape} onChange={setShape} options={[{ value: "auto", label: "Array (single table)" }, { value: "grouped", label: "Grouped by table" }]} />
            </Field>
            <p className="text-[11px] text-muted-foreground">Handles multiple statements and tables, quoted strings with commas/parentheses, {"''"} and {"\\'"} escapes, NULL/TRUE/FALSE and numbers.</p>
          </>
        }
      />
    </ToolLayout>
  );
}
