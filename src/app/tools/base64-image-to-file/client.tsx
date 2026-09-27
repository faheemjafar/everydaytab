"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClearButton, CodeArea, Field, OptionsLayout, StatusBadge, ToolAlert, ToolPanel, formatBytes } from "@/components/tool";

/** Recognises common formats from their first bytes, so data without a MIME prefix still works. */
function sniff(b: Uint8Array): { mime: string; ext: string } {
  const h = Array.from(b.slice(0, 12)).map((x) => x.toString(16).padStart(2, "0")).join("");
  const ascii = new TextDecoder().decode(b.slice(0, 256));
  if (h.startsWith("89504e47")) return { mime: "image/png", ext: "png" };
  if (h.startsWith("ffd8ff")) return { mime: "image/jpeg", ext: "jpg" };
  if (h.startsWith("47494638")) return { mime: "image/gif", ext: "gif" };
  if (h.startsWith("52494646") && h.slice(16, 24) === "57454250") return { mime: "image/webp", ext: "webp" };
  if (h.slice(8, 24) === "6674797061766966") return { mime: "image/avif", ext: "avif" };
  if (h.startsWith("25504446")) return { mime: "application/pdf", ext: "pdf" };
  if (h.startsWith("504b0304")) return { mime: "application/zip", ext: "zip" };
  if (h.startsWith("494433") || h.startsWith("fffb")) return { mime: "audio/mpeg", ext: "mp3" };
  if (h.startsWith("774f4646")) return { mime: "font/woff", ext: "woff" };
  if (h.startsWith("774f4632")) return { mime: "font/woff2", ext: "woff2" };
  if (h.startsWith("00000100")) return { mime: "image/x-icon", ext: "ico" };
  if (/^\s*(<\?xml[^>]*>\s*)?<svg/i.test(ascii)) return { mime: "image/svg+xml", ext: "svg" };
  if (/^\s*[{[]/.test(ascii)) return { mime: "application/json", ext: "json" };
  return { mime: "application/octet-stream", ext: "bin" };
}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg", "application/pdf": "pdf", "text/plain": "txt", "application/json": "json" };

function decode(input: string): { bytes: Uint8Array; mime: string; ext: string } | { error: string } | null {
  let s = input.trim();
  if (!s) return null;
  let declared: string | null = null;
  const m = s.match(/^data:([^;,]+)?(?:;[^,]*)?,/);
  if (m) {
    declared = m[1] ?? null;
    s = s.slice(m[0].length);
  }
  // Tolerate line breaks, URL-safe alphabet and missing padding.
  s = s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return { error: "This isn't valid Base64 — it contains characters outside A–Z, a–z, 0–9, + and /." };
  s = s.padEnd(Math.ceil(s.length / 4) * 4, "=");
  try {
    const bin = atob(s);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const sniffed = sniff(bytes);
    const mime = declared && declared !== "application/octet-stream" ? declared : sniffed.mime;
    return { bytes, mime, ext: EXT[mime] ?? sniffed.ext };
  } catch {
    return { error: "Couldn't decode — the Base64 may be truncated." };
  }
}

export default function Base64ImageToFile() {
  const [input, setInput] = useState("");
  const [name, setName] = useState("decoded");
  const r = useMemo(() => decode(input), [input]);
  const ok = r && "bytes" in r ? r : null;

  const url = useMemo(() => (ok ? URL.createObjectURL(new Blob([ok.bytes.slice()], { type: ok.mime })) : null), [ok]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const download = () => {
    if (!url || !ok) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "decoded"}.${ok.ext}`;
    a.click();
  };

  const isImage = ok?.mime.startsWith("image/");
  const text = ok && /^(text\/|application\/json)/.test(ok.mime) ? new TextDecoder().decode(ok.bytes.slice(0, 20000)) : null;

  const options = (
    <ToolPanel
      title="File"
      bodyClassName="p-3 space-y-3"
      footer={
        <Button size="lg" onClick={download} disabled={!ok} className="w-full">
          <Download /> Download {ok ? `.${ok.ext}` : "file"}
        </Button>
      }
    >
      {ok ? (
        <dl className="text-xs space-y-1">
          <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd className="font-mono">{ok.mime}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Size</dt><dd>{formatBytes(ok.bytes.length)}</dd></div>
        </dl>
      ) : (
        <p className="text-xs text-muted-foreground">Paste Base64 or a data: URI. The file type is detected automatically.</p>
      )}
      <Field label="File name" htmlFor="fn">
        <Input id="fn" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="base64-image-to-file">
      <OptionsLayout options={options}>
        <ToolPanel title="Base64 input" actions={<>{ok && <StatusBadge tone="success">{ok.ext.toUpperCase()}</StatusBadge>}<ClearButton onClick={() => setInput("")} iconOnly disabled={!input} /></>}>
          <CodeArea value={input} onChange={(e) => setInput(e.target.value)} minHeight={180} placeholder="data:image/png;base64,iVBORw0KGgo… or just the Base64 text" />
        </ToolPanel>
        {r && "error" in r && <ToolAlert tone="error">{r.error}</ToolAlert>}
        {ok && url && (
          <ToolPanel title="Preview">
            {isImage ? (
              <div className="p-4 flex justify-center bg-[conic-gradient(#0000000d_25%,transparent_0_50%,#0000000d_0_75%,transparent_0)] bg-[length:16px_16px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Decoded" className="max-h-[50vh] max-w-full" />
              </div>
            ) : ok.mime === "application/pdf" ? (
              <iframe src={url} title="PDF preview" className="w-full h-[60vh] bg-white" />
            ) : ok.mime.startsWith("audio/") ? (
              <div className="p-4"><audio src={url} controls className="w-full" /></div>
            ) : text !== null ? (
              <pre className="px-3.5 py-3 font-mono text-[12.5px] whitespace-pre-wrap break-all max-h-80 overflow-auto custom-scrollbar">{text}</pre>
            ) : (
              <p className="px-3.5 py-6 text-center text-xs text-muted-foreground">No preview for {ok.mime} — download to open it.</p>
            )}
          </ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
