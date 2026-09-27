"use client";

import { useState } from "react";
import { Archive, Download, FolderOpen, RefreshCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FileDropzone, FileList, FileListItem, formatBytes, OptionsLayout, PrivacyNote, Segmented, Stat, StatGrid, ToolAlert, ToolPanel, Toggle } from "@/components/tool";

interface Entry { id: number; file: File; path: string }
type Level = "store" | "fast" | "normal" | "max";
const LEVELS: Record<Level, number> = { store: 0, fast: 1, normal: 6, max: 9 };
// Already-compressed formats barely shrink; storing them saves time.
const PRECOMPRESSED = /\.(jpe?g|png|gif|webp|avif|heic|mp[34]|m4a|aac|ogg|opus|webm|mkv|mov|zip|gz|7z|rar|xz|bz2|zst|docx|xlsx|pptx|pdf|woff2?)$/i;

let nid = 1;

export default function FileCompressor() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [level, setLevel] = useState<Level>("normal");
  const [smart, setSmart] = useState(true);
  const [name, setName] = useState("archive");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; key: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = (files: File[]) => {
    setEntries((cur) => {
      const taken = new Set(cur.map((e) => e.path));
      const next = files.map((file) => {
        // Keep folder structure when a directory is picked; de-duplicate clashing names.
        let path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
        const dot = path.lastIndexOf(".");
        for (let i = 2; taken.has(path); i++) path = dot > 0 ? `${path.slice(0, dot)} (${i})${path.slice(dot)}` : `${path} (${i})`;
        taken.add(path);
        return { id: nid++, file, path };
      });
      return [...cur, ...next];
    });
    setError(null);
  };

  const key = `${entries.map((e) => e.id).join(",")}|${level}|${smart}`;
  const total = entries.reduce((s, e) => s + e.file.size, 0);
  const fresh = result?.key === key ? result.blob : null;

  const compress = async () => {
    setBusy(true);
    setProgress(0);
    setError(null);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const e of entries) {
        const store = level === "store" || (smart && PRECOMPRESSED.test(e.path));
        zip.file(e.path, e.file, { compression: store ? "STORE" : "DEFLATE", compressionOptions: { level: LEVELS[level] || 1 }, date: new Date(e.file.lastModified) });
      }
      const blob = await zip.generateAsync({ type: "blob", streamFiles: true }, (m) => setProgress(m.percent));
      setResult({ blob, key });
    } catch (e) {
      setError((e as Error).message || "Compression failed.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!fresh) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(fresh);
    a.download = `${name.trim() || "archive"}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const options = (
    <ToolPanel
      title="Archive"
      bodyClassName="p-3 space-y-3"
      footer={
        <div className="w-full space-y-2">
          {fresh ? (
            <Button size="lg" onClick={download} className="w-full"><Download /> Download {name || "archive"}.zip</Button>
          ) : (
            <Button size="lg" onClick={compress} disabled={!entries.length || busy} className="w-full">{busy ? <RefreshCw className="animate-spin" /> : <Archive />} {busy ? `Compressing ${Math.round(progress)}%` : "Create ZIP"}</Button>
          )}
          <PrivacyNote>Compressed in your browser — files are never uploaded.</PrivacyNote>
        </div>
      }
    >
      <Field label="File name" htmlFor="zn"><div className="flex items-center gap-1"><Input id="zn" value={name} onChange={(e) => setName(e.target.value)} /><span className="text-sm text-muted-foreground">.zip</span></div></Field>
      <Field label="Compression"><Segmented size="sm" value={level} onChange={setLevel} options={[{ value: "store", label: "None" }, { value: "fast", label: "Fast" }, { value: "normal", label: "Normal" }, { value: "max", label: "Maximum" }]} /></Field>
      <Toggle label="Skip already-compressed files" hint="JPG, PNG, MP4, PDF, DOCX… are stored as-is — they barely shrink and compress slowly." checked={smart} onChange={setSmart} />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="compressor">
      <OptionsLayout options={options}>
        <FileDropzone onFiles={add} multiple size={entries.length ? "sm" : "lg"} title={entries.length ? "Add more files" : "Drop files here or click to browse"} hint="Any file type, any size your browser's memory allows." />
        <label className="inline-flex items-center gap-2 h-8 px-2.5 rounded-md border border-input text-[13px] cursor-pointer hover:bg-muted w-fit">
          <FolderOpen className="w-4 h-4" /> Add a folder
          <input type="file" className="sr-only" multiple {...({ webkitdirectory: "" } as object)} onChange={(e) => { add(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        </label>
        {error && <ToolAlert tone="error">{error}</ToolAlert>}
        {entries.length > 0 && (
          <>
            {fresh && (
              <StatGrid>
                <Stat label="Original" value={formatBytes(total)} />
                <Stat label="ZIP" value={formatBytes(fresh.size)} />
                <Stat label="Saved" value={`${Math.max(0, Math.round((1 - fresh.size / total) * 100))}%`} />
                <Stat label="Files" value={String(entries.length)} />
              </StatGrid>
            )}
            <FileList className="max-h-[420px] overflow-y-auto custom-scrollbar">
              {entries.map((e, i) => (
                <FileListItem key={e.id} index={i} name={e.path} meta={`${formatBytes(e.file.size)}${smart && PRECOMPRESSED.test(e.path) ? " · stored" : ""}`} onRemove={() => setEntries((x) => x.filter((y) => y.id !== e.id))} />
              ))}
            </FileList>
            <div className="flex justify-between text-xs text-muted-foreground"><span>{entries.length} files · {formatBytes(total)}</span><button type="button" onClick={() => { setEntries([]); setResult(null); }} className="hover:text-foreground">Clear all</button></div>
          </>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
