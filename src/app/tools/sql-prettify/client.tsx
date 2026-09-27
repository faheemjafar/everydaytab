"use client";

import { useMemo, useState } from "react";
import { format, type SqlLanguage } from "sql-formatter";
import { ToolLayout } from "@/components/tool-layout";
import { Field, Segmented, TextTransform } from "@/components/tool";

const DIALECTS: { value: SqlLanguage; label: string }[] = [
  { value: "sql", label: "Standard SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mariadb", label: "MariaDB" },
  { value: "sqlite", label: "SQLite" },
  { value: "tsql", label: "SQL Server" },
  { value: "plsql", label: "Oracle PL/SQL" },
  { value: "bigquery", label: "BigQuery" },
  { value: "snowflake", label: "Snowflake" },
  { value: "redshift", label: "Redshift" },
  { value: "spark", label: "Spark" },
];

const SAMPLE = `select u.id, u.name, count(o.id) as orders, sum(o.total) total from users u left join orders o on o.user_id = u.id where u.created_at >= '2024-01-01' and u.status in ('active','trial') group by u.id, u.name having count(o.id) > 2 order by total desc limit 50;`;

/** Collapses whitespace and strips -- comments outside of quoted strings/identifiers. */
function minifySql(sql: string) {
  return sql
    .split(/('(?:''|[^'])*'|"(?:""|[^"])*"|`[^`]*`)/g)
    .map((part, i) => (i % 2 ? part : part.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").replace(/\s*([,()])\s*/g, "$1").replace(/;\s*/g, ";\n")))
    .join("")
    .trim();
}

export default function SQLPrettify() {
  const [input, setInput] = useState("");
  const [dialect, setDialect] = useState<SqlLanguage>("postgresql");
  const [kw, setKw] = useState<"upper" | "lower" | "preserve">("upper");
  const [indent, setIndent] = useState<"2" | "4">("2");
  const [mode, setMode] = useState<"pretty" | "minify">("pretty");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      const pretty = format(input, { language: dialect, keywordCase: kw, tabWidth: Number(indent), linesBetweenQueries: 2 });
      if (mode === "pretty") return { output: pretty, error: null };
      // Minify from the formatted result so comments/strings are handled by the tokenizer first.
      return { output: minifySql(pretty), error: null };
    } catch (e) {
      return { output: "", error: (e as Error).message.split("\n")[0] };
    }
  }, [input, dialect, kw, indent, mode]);

  return (
    <ToolLayout toolId="sql-prettify">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLE}
        inputLabel="SQL"
        outputLabel={mode === "pretty" ? "Formatted" : "Minified"}
        filename="query.sql"
        options={
          <>
            <Field label="Dialect" htmlFor="dl">
              <select id="dl" value={dialect} onChange={(e) => setDialect(e.target.value as SqlLanguage)} className="h-(--control-h) rounded-md border border-input bg-card px-2 text-sm dark:bg-input/30">
                {DIALECTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
            <Segmented value={mode} onChange={setMode} options={[{ value: "pretty", label: "Format" }, { value: "minify", label: "Minify" }]} />
            {mode === "pretty" && (
              <>
                <Field label="Keywords">
                  <Segmented size="sm" value={kw} onChange={setKw} options={[{ value: "upper", label: "UPPER" }, { value: "lower", label: "lower" }, { value: "preserve", label: "Keep" }]} />
                </Field>
                <Field label="Indent">
                  <Segmented size="sm" value={indent} onChange={setIndent} options={[{ value: "2", label: "2" }, { value: "4", label: "4" }]} />
                </Field>
              </>
            )}
          </>
        }
      />
    </ToolLayout>
  );
}
