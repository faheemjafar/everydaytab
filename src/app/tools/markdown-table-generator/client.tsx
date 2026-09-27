"use client";

import { useMemo, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Minus, Plus, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { CodeArea, CodeOutput, ToolPanel, Toggle } from "@/components/tool";
import { cn } from "@/lib/utils";

type Align = "left" | "center" | "right" | "none";

/** Parses CSV/TSV (quoted fields, escaped quotes). Delimiter auto-detected. */
function parseDelimited(text: string): string[][] {
  const first = text.split("\n")[0] ?? "";
  const d = first.includes("\t") ? "\t" : first.split(";").length > first.split(",").length ? ";" : first.includes("|") && !first.includes(",") ? "|" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"' && !cell) q = true;
    else if (c === d) { row.push(cell.trim()); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  // Drop Markdown separator rows and outer pipes if the paste was already a table.
  return rows
    .map((r) => (d === "|" ? r.filter((_, i, a) => !((i === 0 || i === a.length - 1) && _ === "")) : r))
    .filter((r) => r.some(Boolean) && !r.every((c) => /^:?-{2,}:?$/.test(c)));
}

const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
const width = (s: string) => Array.from(s).length;

export default function MarkdownTableGenerator() {
  const [data, setData] = useState<string[][]>([
    ["Feature", "Free", "Pro"],
    ["Tools", "200+", "200+"],
    ["Price", "$0", "$0"],
  ]);
  const [align, setAlign] = useState<Align[]>(["left", "center", "center"]);
  const [pretty, setPretty] = useState(true);
  const [paste, setPaste] = useState("");
  const cols = Math.max(1, ...data.map((r) => r.length));

  const setCell = (r: number, c: number, v: string) => setData((d) => d.map((row, i) => (i === r ? Array.from({ length: cols }, (_, j) => (j === c ? v : row[j] ?? "")) : row)));
  const addRow = () => setData((d) => [...d, Array(cols).fill("")]);
  const addCol = () => { setData((d) => d.map((r, i) => [...r, i === 0 ? `Column ${cols + 1}` : ""])); setAlign((a) => [...a, "left"]); };
  const delRow = (r: number) => setData((d) => (d.length > 1 ? d.filter((_, i) => i !== r) : d));
  const delCol = (c: number) => { if (cols > 1) { setData((d) => d.map((r) => r.filter((_, j) => j !== c))); setAlign((a) => a.filter((_, j) => j !== c)); } };
  const cycle = (c: number) => setAlign((a) => { const n = [...a]; const order: Align[] = ["left", "center", "right", "none"]; n[c] = order[(order.indexOf(n[c] ?? "left") + 1) % 4]; return n; });

  const importPaste = () => {
    const rows = parseDelimited(paste.trim());
    if (!rows.length) return;
    const n = Math.max(...rows.map((r) => r.length));
    setData(rows.map((r) => Array.from({ length: n }, (_, j) => r[j] ?? "")));
    setAlign(Array(n).fill("left"));
    setPaste("");
  };

  const { md, html, csv } = useMemo(() => {
    const rows = data.map((r) => Array.from({ length: cols }, (_, j) => esc(r[j] ?? "")));
    const w = Array.from({ length: cols }, (_, j) => (pretty ? Math.max(3, ...rows.map((r) => width(r[j]))) : 3));
    const padCell = (s: string, j: number) => {
      if (!pretty) return s;
      const gap = w[j] - width(s);
      const a = align[j] ?? "left";
      return a === "right" ? " ".repeat(gap) + s : a === "center" ? " ".repeat(Math.floor(gap / 2)) + s + " ".repeat(Math.ceil(gap / 2)) : s + " ".repeat(gap);
    };
    const sep = w.map((n, j) => {
      const a = align[j] ?? "left";
      const dashes = "-".repeat(Math.max(1, n - (a === "center" ? 2 : a === "none" ? 0 : 1)));
      return a === "center" ? `:${dashes}:` : a === "right" ? `${dashes}:` : a === "left" ? `:${dashes}` : dashes;
    });
    const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
    const md = [line(rows[0].map(padCell)), line(sep), ...rows.slice(1).map((r) => line(r.map(padCell)))].join("\n");
    const cellHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const ta = (j: number) => (align[j] && align[j] !== "none" && align[j] !== "left" ? ` style="text-align:${align[j]}"` : "");
    const html = `<table>\n  <thead>\n    <tr>${data[0].map((c, j) => `<th${ta(j)}>${cellHtml(c)}</th>`).join("")}</tr>\n  </thead>\n  <tbody>\n${data.slice(1).map((r) => `    <tr>${Array.from({ length: cols }, (_, j) => `<td${ta(j)}>${cellHtml(r[j] ?? "")}</td>`).join("")}</tr>`).join("\n")}\n  </tbody>\n</table>`;
    const csv = data.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
    return { md, html, csv };
  }, [data, align, cols, pretty]);

  const AlignIcon = (a: Align) => (a === "center" ? AlignCenter : a === "right" ? AlignRight : a === "none" ? Minus : AlignLeft);

  return (
    <ToolLayout toolId="markdown-table-generator">
      <div className="space-y-3">
        <ToolPanel
          title={`Table · ${data.length} × ${cols}`}
          actions={
            <>
              <Toggle label="Align columns in source" checked={pretty} onChange={setPretty} />
              <Button variant="ghost" size="sm" onClick={addRow}><Plus /> Row</Button>
              <Button variant="ghost" size="sm" onClick={addCol}><Plus /> Column</Button>
            </>
          }
        >
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {Array.from({ length: cols }, (_, j) => {
                    const Icon = AlignIcon(align[j] ?? "left");
                    return (
                      <th key={j} className="border-b border-border px-1 py-1 font-normal">
                        <div className="flex items-center justify-center gap-0.5">
                          <Button variant="ghost" size="icon-sm" onClick={() => cycle(j)} title={`Alignment: ${align[j] ?? "left"}`} aria-label="Change alignment"><Icon /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => delCol(j)} disabled={cols <= 1} aria-label="Delete column" className="text-muted-foreground hover:text-destructive"><X /></Button>
                        </div>
                      </th>
                    );
                  })}
                  <th className="w-8 border-b border-border" />
                </tr>
              </thead>
              <tbody>
                {data.map((row, r) => (
                  <tr key={r} className={cn(r === 0 && "bg-muted/50 font-medium")}>
                    {Array.from({ length: cols }, (_, c) => (
                      <td key={c} className="border-b border-r border-border p-0 min-w-28">
                        <input
                          value={row[c] ?? ""}
                          onChange={(e) => setCell(r, c, e.target.value)}
                          className={cn("w-full h-9 px-2.5 bg-transparent outline-none focus:bg-accent/40", align[c] === "center" && "text-center", align[c] === "right" && "text-right")}
                          aria-label={`Row ${r + 1}, column ${c + 1}`}
                        />
                      </td>
                    ))}
                    <td className="border-b border-border text-center">
                      <Button variant="ghost" size="icon-sm" onClick={() => delRow(r)} disabled={data.length <= 1} aria-label="Delete row" className="text-muted-foreground hover:text-destructive"><X /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ToolPanel>

        <ToolPanel title="Import from spreadsheet" actions={<Button size="sm" onClick={importPaste} disabled={!paste.trim()}>Import</Button>}>
          <CodeArea value={paste} onChange={(e) => setPaste(e.target.value)} minHeight={80} placeholder="Paste cells from Excel / Google Sheets, CSV, or an existing Markdown table — the first row becomes the header." />
        </ToolPanel>

        <CodeOutput
          title="Output"
          tabs={[
            { id: "md", label: "Markdown", code: md },
            { id: "html", label: "HTML", code: html },
            { id: "csv", label: "CSV", code: csv },
          ]}
        />
        <ToolPanel title="Preview">
          <div className="md-preview px-4 py-3">
            <table>
              <thead><tr>{data[0].map((c, j) => <th key={j} style={{ textAlign: align[j] === "none" ? undefined : align[j] }}>{c}</th>)}</tr></thead>
              <tbody>{data.slice(1).map((r, i) => <tr key={i}>{Array.from({ length: cols }, (_, j) => <td key={j} style={{ textAlign: align[j] === "none" ? undefined : align[j] }}>{r[j]}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
