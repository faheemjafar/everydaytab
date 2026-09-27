"use client";

import { useEffect, useMemo, useState } from "react";
import { FileUp } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { CodeOutput, CopyButton, DownloadButton, FileDropzone, OptionsLayout, Segmented, StatusBadge, ToolAlert, ToolPanel, formatBytes } from "@/components/tool";
import { Button } from "@/components/ui/button";

const MAX = 25 * 1024 * 1024;

export default function Base64FileConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [wrap, setWrap] = useState<"none" | "76">("none");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const load = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (f.size > MAX) return setError(`That file is ${formatBytes(f.size)}. Base64 of files over 25 MB gets unwieldy in the browser.`);
    setError(null);
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
    const r = new FileReader();
    r.onload = () => setDataUrl(r.result as string);
    r.readAsDataURL(f);
  };

  const raw = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const body = useMemo(() => (wrap === "76" ? raw.replace(/(.{76})/g, "$1\n") : raw), [raw, wrap]);
  const mime = file?.type || "application/octet-stream";

  if (!file) {
    return (
      <ToolLayout toolId="base64-file">
        <div className="space-y-3">
          <FileDropzone onFiles={load} icon={<FileUp className="w-5 h-5" />} title="Drop any file to encode as Base64" hint="Images, fonts, PDFs, audio… up to 25 MB. Encoded on your device." className="min-h-72" />
          {error && <ToolAlert tone="error">{error}</ToolAlert>}
        </div>
      </ToolLayout>
    );
  }

  const tabs = [
    { id: "raw", label: "Base64", code: body },
    { id: "uri", label: "Data URI", code: dataUrl },
    ...(mime.startsWith("image/") ? [{ id: "img", label: "<img>", code: `<img src="${dataUrl}" alt="" />` }, { id: "css", label: "CSS", code: `background-image: url("${dataUrl}");` }] : []),
    ...(/font|woff|ttf|otf/.test(mime + file.name) ? [{ id: "font", label: "@font-face", code: `@font-face {\n  font-family: "MyFont";\n  src: url("${dataUrl}");\n}` }] : []),
    { id: "json", label: "JSON", code: JSON.stringify({ name: file.name, type: mime, data: raw }, null, 2) },
  ];

  const options = (
    <ToolPanel title="File" bodyClassName="p-3 space-y-3">
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="w-full max-h-40 object-contain rounded-sm border border-border bg-muted/40" />
      )}
      <dl className="text-xs space-y-1">
        <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Name</dt><dd className="truncate">{file.name}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd className="font-mono">{mime}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Original</dt><dd>{formatBytes(file.size)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Base64</dt><dd>{formatBytes(raw.length)} (+{file.size ? Math.round((raw.length / file.size - 1) * 100) : 0}%)</dd></div>
      </dl>
      <div className="space-y-1.5">
        <span className="block text-xs font-medium">Line wrapping</span>
        <Segmented
          size="sm"
          value={wrap}
          onChange={setWrap}
          options={[
            { value: "none", label: "None" },
            { value: "76", label: "76 chars (MIME)" },
          ]}
        />
      </div>
      <div className="flex gap-1.5">
        <CopyButton text={body} label="Copy Base64" />
        <DownloadButton content={body} filename={`${file.name}.b64.txt`} mime="text/plain" label=".txt" />
      </div>
      <Button variant="ghost" size="sm" onClick={() => { setFile(null); setDataUrl(""); }}>
        Choose another file
      </Button>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="base64-file">
      <OptionsLayout options={options}>
        {raw.length > 2_000_000 && <StatusBadge tone="warning">Large output — copying may take a moment.</StatusBadge>}
        <CodeOutput title="Output" tabs={tabs} />
      </OptionsLayout>
    </ToolLayout>
  );
}
