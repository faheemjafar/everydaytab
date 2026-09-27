"use client";

import { useMemo, useState } from "react";
import CryptoJS from "crypto-js";
import { Check, File as FileIcon, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { ClearButton, CodeArea, CopyButton, FileDropzone, PrivacyNote, Segmented, SplitLayout, StatusBadge, ToolPanel, formatBytes } from "@/components/tool";
import { cn } from "@/lib/utils";

type WA = CryptoJS.lib.WordArray;
const ALGOS: { id: string; label: string; fn: (w: WA) => WA; legacy?: boolean }[] = [
  { id: "sha256", label: "SHA-256", fn: (w) => CryptoJS.SHA256(w) },
  { id: "sha512", label: "SHA-512", fn: (w) => CryptoJS.SHA512(w) },
  { id: "sha384", label: "SHA-384", fn: (w) => CryptoJS.SHA384(w) },
  { id: "sha224", label: "SHA-224", fn: (w) => CryptoJS.SHA224(w) },
  { id: "sha3", label: "SHA3-256", fn: (w) => CryptoJS.SHA3(w, { outputLength: 256 }) },
  { id: "ripemd", label: "RIPEMD-160", fn: (w) => CryptoJS.RIPEMD160(w) },
  { id: "sha1", label: "SHA-1", fn: (w) => CryptoJS.SHA1(w), legacy: true },
  { id: "md5", label: "MD5", fn: (w) => CryptoJS.MD5(w), legacy: true },
];

type Mode = "text" | "file";
type Enc = "hex" | "base64";
const MAX_FILE = 200 * 1024 * 1024;

/** Hash raw bytes (not text) so results match sha256sum / certutil. */
const bytesToWA = (buf: ArrayBuffer) => CryptoJS.lib.WordArray.create(new Uint8Array(buf) as unknown as number[]);

export default function HashGenerator() {
  const [mode, setMode] = useState<Mode>("text");
  const [input, setInput] = useState("");
  const [file, setFile] = useState<{ name: string; size: number; wa: WA } | null>(null);
  const [reading, setReading] = useState(false);
  const [enc, setEnc] = useState<Enc>("hex");
  const [upper, setUpper] = useState(false);
  const [expected, setExpected] = useState("");
  const [error, setError] = useState<string | null>(null);

  const source: WA | null = mode === "text" ? (input ? CryptoJS.enc.Utf8.parse(input) : null) : file?.wa ?? null;

  const hashes = useMemo(() => {
    if (!source) return null;
    const encoder = enc === "hex" ? CryptoJS.enc.Hex : CryptoJS.enc.Base64;
    return ALGOS.map((a) => {
      let v = a.fn(source).toString(encoder);
      if (upper && enc === "hex") v = v.toUpperCase();
      return { ...a, value: v };
    });
  }, [source, enc, upper]);

  const want = expected.trim().replace(/\s+/g, "");
  const match = want && hashes ? hashes.find((h) => h.value.toLowerCase() === want.toLowerCase()) : undefined;

  const loadFile = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (f.size > MAX_FILE) return setError(`Files over ${formatBytes(MAX_FILE)} are too large to hash in the browser.`);
    setError(null);
    setReading(true);
    try {
      setFile({ name: f.name, size: f.size, wa: bytesToWA(await f.arrayBuffer()) });
    } finally {
      setReading(false);
    }
  };

  return (
    <ToolLayout toolId="hash-generator">
      <SplitLayout ratio="2fr 3fr">
        <div className="space-y-3">
          <ToolPanel
            title={<Segmented size="sm" value={mode} onChange={setMode} options={[{ value: "text", label: "Text" }, { value: "file", label: "File" }]} />}
            actions={
              mode === "text" ? (
                <>
                  {input && <StatusBadge>{new Blob([input]).size.toLocaleString()} B</StatusBadge>}
                  <ClearButton onClick={() => setInput("")} iconOnly disabled={!input} />
                </>
              ) : file ? (
                <ClearButton onClick={() => setFile(null)} iconOnly />
              ) : null
            }
            footer={<PrivacyNote>{mode === "file" ? "Files are hashed in this tab — nothing is uploaded." : "Hashes update as you type (UTF-8)."}</PrivacyNote>}
          >
            {mode === "text" ? (
              <CodeArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type or paste text to hash…" minHeight={260} />
            ) : file ? (
              <div className="flex items-center gap-3 p-4">
                <FileIcon className="w-8 h-8 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              </div>
            ) : (
              <div className="p-3">
                <FileDropzone onFiles={loadFile} title={reading ? "Reading…" : "Drop a file to checksum"} hint={`Any file up to ${formatBytes(MAX_FILE)} — e.g. verify a download.`} className="min-h-56" />
                {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
              </div>
            )}
          </ToolPanel>
          <ToolPanel title="Verify" bodyClassName="p-3 space-y-1.5">
            <Input value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Paste an expected checksum to compare…" className="font-mono" spellCheck={false} />
            {want && hashes && (
              <p className={cn("flex items-center gap-1.5 text-xs font-medium", match ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                {match ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                {match ? `Matches ${match.label}` : "No algorithm produced this checksum"}
              </p>
            )}
          </ToolPanel>
        </div>

        <ToolPanel
          title="Digests"
          actions={
            <>
              <Segmented size="sm" value={enc} onChange={setEnc} options={[{ value: "hex", label: "Hex" }, { value: "base64", label: "Base64" }]} />
              {enc === "hex" && <Segmented size="sm" value={upper ? "U" : "l"} onChange={(v) => setUpper(v === "U")} options={[{ value: "l", label: "abc" }, { value: "U", label: "ABC" }]} />}
              <CopyButton getText={() => (hashes ? hashes.map((h) => `${h.label}: ${h.value}`).join("\n") : "")} disabled={!hashes} label="Copy all" />
            </>
          }
        >
          <ul className="divide-y divide-border">
            {ALGOS.map((a) => {
              const h = hashes?.find((x) => x.id === a.id);
              return (
                <li key={a.id} className={cn("group px-3.5 py-2.5 space-y-1", match?.id === a.id && "bg-emerald-500/10")}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{a.label}</span>
                    {a.legacy && <StatusBadge tone="warning">not collision-safe</StatusBadge>}
                    <span className="flex-1" />
                    <CopyButton text={h?.value} iconOnly className={cn(!h && "invisible")} />
                  </div>
                  <code className={cn("block font-mono text-[13px] break-all leading-relaxed", !h && "text-muted-foreground/50")}>{h?.value ?? "—"}</code>
                </li>
              );
            })}
          </ul>
        </ToolPanel>
      </SplitLayout>
    </ToolLayout>
  );
}
