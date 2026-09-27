"use client";

import { useEffect, useState } from "react";
import { Download, Image as ImageIcon, Minimize2, RefreshCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ClearButton,
  Field,
  FileDropzone,
  OptionsLayout,
  PrivacyNote,
  Segmented,
  Stat,
  StatusBadge,
  ToolAlert,
  ToolPanel,
  formatBytes,
} from "@/components/tool";

type Format = "image/jpeg" | "image/webp" | "image/png";

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [maxWidth, setMaxWidth] = useState<"0" | "1920" | "1280" | "800">("0");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"before" | "after">("after");

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (result) URL.revokeObjectURL(result.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null);
    setResult(null);
    setFile(f);
    setOriginalUrl(URL.createObjectURL(f));
  };

  const compress = () => {
    if (!originalUrl) return;
    setBusy(true);
    setError(null);
    const img = new Image();
    img.onload = () => {
      const limit = Number(maxWidth);
      const scale = limit && img.width > limit ? limit / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return setBusy(false);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          setBusy(false);
          if (!blob) return setError("Compression failed.");
          if (result) URL.revokeObjectURL(result.url);
          setResult({ url: URL.createObjectURL(blob), size: blob.size });
          setView("after");
        },
        format,
        quality / 100
      );
    };
    img.onerror = () => {
      setBusy(false);
      setError("Could not load that image.");
    };
    img.src = originalUrl;
  };

  const clear = () => {
    setFile(null);
    setOriginalUrl(null);
    setResult(null);
    setError(null);
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${file?.name.replace(/\.[^.]+$/, "") ?? "compressed"}.${format.split("/")[1]}`;
    a.click();
  };

  const saved = file && result ? Math.round(((file.size - result.size) / file.size) * 100) : 0;

  const options = (
    <ToolPanel title="Options" bodyClassName="p-3 space-y-4">
      <Field label="Format">
        <Segmented
          size="sm"
          value={format}
          onChange={setFormat}
          options={[
            { value: "image/jpeg", label: "JPEG" },
            { value: "image/webp", label: "WebP" },
            { value: "image/png", label: "PNG" },
          ]}
        />
      </Field>
      <Field label={`Quality — ${quality}%`} hint={format === "image/png" ? "PNG is lossless; quality is ignored." : undefined}>
        <Slider min={10} max={100} step={1} value={[quality]} onValueChange={(v) => setQuality(v[0])} disabled={format === "image/png"} />
      </Field>
      <Field label="Max width">
        <Segmented
          size="sm"
          value={maxWidth}
          onChange={setMaxWidth}
          options={[
            { value: "0", label: "Original" },
            { value: "1920", label: "1920" },
            { value: "1280", label: "1280" },
            { value: "800", label: "800" },
          ]}
        />
      </Field>
      <Button size="lg" onClick={compress} disabled={!file || busy} className="w-full">
        {busy ? <RefreshCw className="animate-spin" /> : <Minimize2 />}
        {busy ? "Compressing…" : "Compress"}
      </Button>
      <PrivacyNote />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="image-compressor">
      <OptionsLayout options={options}>
        {!file ? (
          <FileDropzone onFiles={load} accept="image/*" icon={<ImageIcon className="w-5 h-5" />} title="Drop an image here or click to browse" hint="JPEG, PNG, WebP, GIF, AVIF…" className="min-h-[360px]" />
        ) : (
          <>
            <ToolPanel
              title={file.name}
              actions={
                <>
                  {result && (
                    <Segmented
                      size="sm"
                      value={view}
                      onChange={setView}
                      options={[
                        { value: "before", label: "Before" },
                        { value: "after", label: "After" },
                      ]}
                    />
                  )}
                  <ClearButton onClick={clear} iconOnly label="Remove image" />
                </>
              }
              footer={
                <>
                  {result ? (
                    <StatusBadge tone={saved > 0 ? "success" : "warning"}>{saved > 0 ? `${saved}% smaller` : "No savings — try a lower quality"}</StatusBadge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Adjust options, then press Compress.</span>
                  )}
                  <span className="flex-1" />
                  <Button variant="outline" onClick={download} disabled={!result}>
                    <Download /> Download
                  </Button>
                  <FileDropzoneInline onFiles={load} />
                </>
              }
            >
              <div className="flex items-center justify-center bg-dots p-4 min-h-[360px]">
                <img
                  src={view === "after" && result ? result.url : originalUrl!}
                  alt={view === "after" && result ? "Compressed" : "Original"}
                  className="max-w-full max-h-[60vh] rounded-sm border border-border object-contain"
                />
              </div>
            </ToolPanel>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Original" value={formatBytes(file.size)} />
              <Stat label="Compressed" value={result ? formatBytes(result.size) : "—"} />
              <Stat label="Saved" value={result ? `${saved}%` : "—"} />
            </div>
          </>
        )}
        {error && <ToolAlert tone="error">{error}</ToolAlert>}
      </OptionsLayout>
    </ToolLayout>
  );
}

function FileDropzoneInline({ onFiles }: { onFiles: (f: File[]) => void }) {
  return (
    <label className="inline-flex items-center h-(--control-h) px-2.5 rounded-md border border-border bg-card text-xs font-medium cursor-pointer hover:bg-muted">
      Replace…
      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onFiles(Array.from(e.target.files))} />
    </label>
  );
}
