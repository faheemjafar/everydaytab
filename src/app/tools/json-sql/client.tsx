"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CodeArea, CodeOutput, Field, OptionsLayout, Segmented, ToolAlert, ToolPanel, Toggle } from "@/components/tool";

type Dialect = "mysql" | "postgres" | "sqlite" | "mssql";

const SAMPLE = `[
  { "id": 1, "name": "Ada Lovelace", "email": "ada@example.com", "active": true, "score": 98.5, "joined": "2024-03-01", "tags": ["admin"] },
  { "id": 2, "name": "Alan O'Neil", "email": null, "active": false, "score": 72, "joined": "2024-06-15T09:30:00Z" },
  { "id": 3, "name": "Grace Hopper", "email": "grace@example.com", "active": true, "score": 88, "manager_id": 1 }
]`;

const quoteId = (d: Dialect, s: string) => (d === "mysql" ? `\`${s.replace(/`/g, "``")}\`` : d === "mssql" ? `[${s.replace(/]/g, "]]")}]` : `"${s.replace(/"/g, '""')}"`);

type Kind = "int" | "bigint" | "float" | "bool" | "date" | "timestamp" | "text" | "json" | "null";
const TYPES: Record<Dialect, Record<Exclude<Kind, "null">, string>> = {
  mysql: { int: "INT", bigint: "BIGINT", float: "DOUBLE", bool: "BOOLEAN", date: "DATE", timestamp: "DATETIME", text: "VARCHAR(255)", json: "JSON" },
  postgres: { int: "INTEGER", bigint: "BIGINT", float: "DOUBLE PRECISION", bool: "BOOLEAN", date: "DATE", timestamp: "TIMESTAMPTZ", text: "TEXT", json: "JSONB" },
  sqlite: { int: "INTEGER", bigint: "INTEGER", float: "REAL", bool: "INTEGER", date: "TEXT", timestamp: "TEXT", text: "TEXT", json: "TEXT" },
  mssql: { int: "INT", bigint: "BIGINT", float: "FLOAT", bool: "BIT", date: "DATE", timestamp: "DATETIME2", text: "NVARCHAR(255)", json: "NVARCHAR(MAX)" },
};

function kindOf(v: unknown): Kind {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return "bool";
  if (typeof v === "number") return Number.isInteger(v) ? (Math.abs(v) > 2147483647 ? "bigint" : "int") : "float";
  if (typeof v === "object") return "json";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return "date";
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(String(v))) return "timestamp";
  return "text";
}

/** Widens two observed kinds to one column type. */
function merge(a: Kind, b: Kind): Kind {
  if (a === b || b === "null") return a;
  if (a === "null") return b;
  const nums: Kind[] = ["int", "bigint", "float"];
  if (nums.includes(a) && nums.includes(b)) return nums[Math.max(nums.indexOf(a), nums.indexOf(b))];
  if ((a === "date" && b === "timestamp") || (a === "timestamp" && b === "date")) return "timestamp";
  return a === "json" || b === "json" ? "json" : "text";
}

function literal(d: Dialect, v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return d === "mysql" || d === "postgres" ? String(v).toUpperCase() : v ? "1" : "0";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return `${d === "mssql" ? "N" : ""}'${s.replace(/'/g, "''")}'`;
}

export default function JSONToSQL() {
  const [input, setInput] = useState(SAMPLE);
  const [table, setTable] = useState("users");
  const [dialect, setDialect] = useState<Dialect>("postgres");
  const [batch, setBatch] = useState(100);
  const [create, setCreate] = useState(true);
  const [ifNotExists, setIfNotExists] = useState(true);
  const [pk, setPk] = useState("id");

  const result = useMemo(() => {
    if (!input.trim()) return null;
    let data: unknown;
    try {
      data = JSON.parse(input);
    } catch (e) {
      return { error: `Invalid JSON: ${(e as Error).message}` };
    }
    const rows = (Array.isArray(data) ? data : [data]).filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && !Array.isArray(r));
    if (!rows.length) return { error: "Expected an object or an array of objects." };
    // Union of keys across all rows, in first-seen order.
    const cols: string[] = [];
    const kinds: Record<string, Kind> = {};
    const nullable: Record<string, boolean> = {};
    for (const r of rows) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
    for (const c of cols) {
      kinds[c] = rows.reduce<Kind>((acc, r) => merge(acc, kindOf(r[c])), "null");
      nullable[c] = rows.some((r) => r[c] === null || r[c] === undefined);
    }
    const t = quoteId(dialect, table || "table_name");
    const ddl = `CREATE TABLE ${ifNotExists && dialect !== "mssql" ? "IF NOT EXISTS " : ""}${t} (\n${cols
      .map((c) => `  ${quoteId(dialect, c)} ${TYPES[dialect][kinds[c] === "null" ? "text" : kinds[c]]}${c === pk ? " PRIMARY KEY" : nullable[c] ? "" : " NOT NULL"}`)
      .join(",\n")}\n);`;
    const colList = cols.map((c) => quoteId(dialect, c)).join(", ");
    const chunks: string[] = [];
    for (let i = 0; i < rows.length; i += Math.max(1, batch)) {
      const vals = rows.slice(i, i + Math.max(1, batch)).map((r) => `  (${cols.map((c) => literal(dialect, r[c])).join(", ")})`);
      chunks.push(`INSERT INTO ${t} (${colList}) VALUES\n${vals.join(",\n")};`);
    }
    return { ddl, inserts: chunks.join("\n\n"), rows: rows.length, cols: cols.length };
  }, [input, table, dialect, batch, ifNotExists, pk]);

  const options = (
    <ToolPanel title="Options" bodyClassName="p-3 space-y-3">
      <Field label="Dialect">
        <Segmented size="sm" value={dialect} onChange={setDialect} options={[{ value: "postgres", label: "PostgreSQL" }, { value: "mysql", label: "MySQL" }, { value: "sqlite", label: "SQLite" }, { value: "mssql", label: "SQL Server" }]} className="flex-wrap" />
      </Field>
      <Field label="Table name" htmlFor="tn">
        <Input id="tn" value={table} onChange={(e) => setTable(e.target.value)} className="font-mono" />
      </Field>
      <Field label="Primary key column" htmlFor="pk">
        <Input id="pk" value={pk} onChange={(e) => setPk(e.target.value)} placeholder="none" className="font-mono" />
      </Field>
      <Field label="Rows per INSERT" htmlFor="bs">
        <Input id="bs" type="number" min={1} value={batch} onChange={(e) => setBatch(Math.max(1, Number(e.target.value) || 1))} />
      </Field>
      <Toggle label="Include CREATE TABLE" checked={create} onChange={setCreate} />
      {create && dialect !== "mssql" && <Toggle label="IF NOT EXISTS" checked={ifNotExists} onChange={setIfNotExists} />}
      <p className="text-[11px] text-muted-foreground">Column types are inferred from every row. Nested objects/arrays become JSON columns.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="json-sql">
      <OptionsLayout options={options}>
        <ToolPanel title="JSON">
          <CodeArea value={input} onChange={(e) => setInput(e.target.value)} minHeight={220} placeholder='[{"id": 1, "name": "…"}]' />
        </ToolPanel>
        {result && "error" in result && <ToolAlert tone="error">{result.error}</ToolAlert>}
        {result && "ddl" in result && (
          <CodeOutput
            title={`SQL · ${result.rows} rows × ${result.cols} columns`}
            tabs={[
              { id: "all", label: "Full script", code: create ? `${result.ddl}\n\n${result.inserts}` : result.inserts ?? "" },
              { id: "ddl", label: "CREATE TABLE", code: result.ddl ?? "" },
              { id: "ins", label: "INSERT", code: result.inserts ?? "" },
            ]}
          />
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
