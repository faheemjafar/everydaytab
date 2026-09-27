"use client";

import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FileDropzone, OptionsLayout, PrivacyNote, Segmented, StatusBadge, ToolAlert, ToolPanel, Toggle } from "@/components/tool";
import { cn } from "@/lib/utils";

type Case = "same" | "lower" | "upper" | "title" | "kebab" | "snake";
type Num = "none" | "prefix" | "suffix";
interface Opts { find: string; replace: string; regex: boolean; matchCase: boolean; caseMode: Case; num: Num; start: number; digits: number; sep: string; prefix: string; suffix: string; ext: string }

const split = (n: string) => { const i = n.lastIndexOf("."); return i > 0 ? [n.slice(0, i), n.slice(i + 1)] : [n, ""]; };
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function rename(name: string, index: number, o: Opts, file: File): string {
  const [first, ext] = split(name);
  let base = first;
  if (o.find) base = base.replace(new RegExp(o.regex ? o.find : esc(o.find), o.matchCase ? "g" : "gi"), o.replace.replace(/\{n\}/g, String(index + o.start)));
  if (o.caseMode === "lower") base = base.toLowerCase();
  else if (o.caseMode === "upper") base = base.toUpperCase();
  else if (o.caseMode === "title") base = base.toLowerCase().replace(/(^|[\s_-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
  else if (o.caseMode === "kebab" || o.caseMode === "snake") base = base.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, o.caseMode === "kebab" ? "-" : "_").replace(/^[-_]|[-_]$/g, "");
  const date = new Date(file.lastModified).toISOString().slice(0, 10);
  base = `${o.prefix}${base}${o.suffix}`.replace(/\{date\}/g, date);
  if (o.num !== "none") {
    const n = String(index + o.start).padStart(o.digits, "0");
    base = o.num === "prefix" ? `${n}${o.sep}${base}` : `${base}${o.sep}${n}`;
  }
  const e = o.ext.trim().replace(/^\./, "") || ext;
  return e ? `${base}.${e}` : base;
}

export default function BatchRenamer() {
  const [files, setFiles] = useState<File[]>([]);
  const [o, setO] = useState<Opts>({ find: "", replace: "", regex: false, matchCase: false, caseMode: "same", num: "none", start: 1, digits: 3, sep: "_", prefix: "", suffix: "", ext: "" });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setO((x) => ({ ...x, [k]: v }));

  let regexError: string | null = null;
  if (o.regex && o.find) try { new RegExp(o.find); } catch (e) { regexError = (e as Error).message; }
  const names = regexError ? files.map((f) => f.name) : files.map((f, i) => rename(f.name, i, o, f));
  const counts = names.reduce<Record<string, number>>((m, n) => ({ ...m, [n.toLowerCase()]: (m[n.toLowerCase()] ?? 0) + 1 }), {});
  const dupes = names.filter((n) => counts[n.toLowerCase()] > 1).length;
  const invalid = names.filter((n) => /[<>:"/\\|?*\x00-\x1f]/.test(n) || !n.trim()).length;
  const changed = names.filter((n, i) => n !== files[i].name).length;

  const download = async () => {
    setBusy(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      files.forEach((f, i) => zip.file(names[i], f, { date: new Date(f.lastModified) }));
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "renamed-files.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } finally {
      setBusy(false);
    }
  };

  const options = (
    <ToolPanel title="Rules" bodyClassName="p-3 space-y-3" footer={<div className="w-full space-y-2"><Button size="lg" onClick={download} disabled={!files.length || busy || dupes > 0 || invalid > 0 || !!regexError} className="w-full">{busy ? <RefreshCw className="animate-spin" /> : <Download />} Download renamed (.zip)</Button><PrivacyNote>Renamed locally; files never leave your device.</PrivacyNote></div>}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Find" htmlFor="rf"><Input id="rf" value={o.find} onChange={(e) => set("find", e.target.value)} className="font-mono" aria-invalid={regexError ? true : undefined} /></Field>
        <Field label="Replace with" htmlFor="rr"><Input id="rr" value={o.replace} onChange={(e) => set("replace", e.target.value)} className="font-mono" /></Field>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Toggle label="Regex" checked={o.regex} onChange={(v) => set("regex", v)} hint="Use $1, $2 for groups" />
        <Toggle label="Match case" checked={o.matchCase} onChange={(v) => set("matchCase", v)} />
      </div>
      {regexError && <p className="text-xs text-destructive">{regexError}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Add prefix" htmlFor="rp"><Input id="rp" value={o.prefix} onChange={(e) => set("prefix", e.target.value)} placeholder="{date}_" /></Field>
        <Field label="Add suffix" htmlFor="rs"><Input id="rs" value={o.suffix} onChange={(e) => set("suffix", e.target.value)} /></Field>
      </div>
      <Field label="Case"><Segmented size="sm" value={o.caseMode} onChange={(v) => set("caseMode", v)} options={[{ value: "same", label: "Keep" }, { value: "lower", label: "lower" }, { value: "upper", label: "UPPER" }, { value: "title", label: "Title" }, { value: "kebab", label: "kebab" }, { value: "snake", label: "snake" }]} className="flex-wrap" /></Field>
      <Field label="Numbering"><Segmented size="sm" value={o.num} onChange={(v) => set("num", v)} options={[{ value: "none", label: "None" }, { value: "prefix", label: "001_name" }, { value: "suffix", label: "name_001" }]} /></Field>
      {o.num !== "none" && (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Start" htmlFor="rst"><Input id="rst" type="number" value={o.start} onChange={(e) => set("start", Number(e.target.value) || 0)} /></Field>
          <Field label="Digits" htmlFor="rd"><Input id="rd" type="number" min={1} max={8} value={o.digits} onChange={(e) => set("digits", Math.max(1, Math.min(8, Number(e.target.value) || 1)))} /></Field>
          <Field label="Separator" htmlFor="rsep"><Input id="rsep" value={o.sep} onChange={(e) => set("sep", e.target.value)} /></Field>
        </div>
      )}
      <Field label="Change extension" hint="Renames only — doesn't convert the file." htmlFor="rext"><Input id="rext" value={o.ext} onChange={(e) => set("ext", e.target.value)} placeholder="keep" className="font-mono w-28" /></Field>
      <p className="text-[11px] text-muted-foreground">Placeholders: <code className="font-mono">{"{date}"}</code> (file&apos;s modified date), <code className="font-mono">{"{n}"}</code> (index, in Replace).</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="renamer">
      <OptionsLayout options={options}>
        <FileDropzone onFiles={(f) => setFiles((cur) => [...cur, ...f].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })))} multiple size={files.length ? "sm" : "lg"} title={files.length ? "Add more files" : "Drop files to rename"} />
        {(dupes > 0 || invalid > 0) && <ToolAlert tone="error">{dupes > 0 && `${dupes} files would end up with the same name. `}{invalid > 0 && `${invalid} names contain characters not allowed in filenames (< > : " / \\ | ? *).`}</ToolAlert>}
        {files.length > 0 && (
          <ToolPanel title="Preview" actions={<><StatusBadge>{changed} of {files.length} renamed</StatusBadge><button type="button" onClick={() => setFiles([])} className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted">Clear</button></>}>
            <ul className="divide-y divide-border max-h-[520px] overflow-y-auto custom-scrollbar text-[13px]">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3.5 py-1.5">
                  <span className="truncate text-muted-foreground" title={f.name}>{f.name}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className={cn("truncate font-medium", counts[names[i].toLowerCase()] > 1 && "text-destructive", names[i] === f.name && "font-normal text-muted-foreground")} title={names[i]}>{names[i]}</span>
                </li>
              ))}
            </ul>
          </ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
