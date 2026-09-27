"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, PenTool, Upload } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChoiceGrid, Field, FieldGrid, PdfTool, Segmented, downloadFile, suffixName, usePdfFile } from "@/components/tool";

type Position = "bottom-right" | "bottom-left" | "center" | "top-right" | "top-left";
type Pages = "all" | "first" | "last";
type Source = "draw" | "upload";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "center", label: "Centre" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
];

/** Minimal pointer-based signature pad that exports a transparent PNG. */
function SignaturePad({ onChange, ink }: { onChange: (png: Blob | null) => void; ink: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4;
  }, []);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) ctx.strokeStyle = ink;
  }, [ink]);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  const emit = () => {
    if (!dirty.current) return onChange(null);
    ref.current!.toBlob((b) => onChange(b), "image/png");
  };

  const clear = () => {
    const c = ref.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    dirty.current = false;
    onChange(null);
  };

  return (
    <div className="space-y-1.5">
      <div className="relative rounded-md border border-dashed border-border bg-white">
        <canvas
          ref={ref}
          className="w-full h-36 touch-none cursor-crosshair rounded-md"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = true;
            const ctx = ref.current!.getContext("2d")!;
            const [x, y] = pos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = ref.current!.getContext("2d")!;
            const [x, y] = pos(e);
            ctx.lineTo(x, y);
            ctx.stroke();
            dirty.current = true;
          }}
          onPointerUp={() => {
            drawing.current = false;
            emit();
          }}
        />
        <span className="pointer-events-none absolute left-4 right-4 bottom-8 border-b border-stone-300" />
        <span className="pointer-events-none absolute left-4 bottom-2 text-[10px] text-stone-400">Sign above the line</span>
      </div>
      <Button variant="ghost" size="sm" onClick={clear}>
        <Eraser /> Clear
      </Button>
    </div>
  );
}

export default function SignPDF() {
  const [source, setSource] = useState<Source>("draw");
  const [sig, setSigState] = useState<Blob | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  // Keep a preview URL in sync with the signature blob (revoking the old one).
  const setSig = (b: Blob | null) => {
    setSigState(b);
    setSigPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return b ? URL.createObjectURL(b) : null;
    });
  };
  const [ink, setInk] = useState("#1e3a8a");
  const [position, setPosition] = useState<Position>("bottom-right");
  const [pages, setPages] = useState<Pages>("last");
  const [size, setSize] = useState(25);
  const pdf = usePdfFile();

  const sign = () =>
    pdf.run(async () => {
      if (!pdf.file || !sig) return;
      const doc = await PDFDocument.load(await pdf.file.arrayBuffer());
      const bytes = await sig.arrayBuffer();
      const image = sig.type === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      const all = doc.getPages();
      const targets = pages === "all" ? all : pages === "first" ? all.slice(0, 1) : all.slice(-1);
      const margin = 36;
      for (const page of targets) {
        const { width, height } = page.getSize();
        // Size is a % of page width; keep aspect ratio.
        const w = (width * size) / 100;
        const h = (image.height / image.width) * w;
        const x = position.endsWith("left") ? margin : position.endsWith("right") ? width - w - margin : (width - w) / 2;
        const y = position.startsWith("top") ? height - h - margin : position.startsWith("bottom") ? margin : (height - h) / 2;
        page.drawImage(image, { x, y, width: w, height: h });
      }
      downloadFile(await doc.save(), suffixName(pdf.file, "signed"));
    }, "Failed to sign PDF.");

  return (
    <ToolLayout toolId="sign-pdf">
      <PdfTool
        pdf={pdf}
        optionsTitle="Signature"
        options={
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <Segmented
                value={source}
                onChange={(s) => {
                  setSource(s);
                  setSig(null);
                }}
                options={[
                  { value: "draw", label: <><PenTool className="w-3.5 h-3.5" /> Draw</> },
                  { value: "upload", label: <><Upload className="w-3.5 h-3.5" /> Upload image</> },
                ]}
              />
              {source === "draw" ? (
                <>
                  <SignaturePad key="pad" onChange={setSig} ink={ink} />
                  <Field label="Ink" inline>
                    <div className="flex gap-1.5">
                      {["#111827", "#1e3a8a", "#7f1d1d"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setInk(c)}
                          aria-label={`Ink ${c}`}
                          aria-pressed={ink === c}
                          style={{ background: c }}
                          className={"w-6 h-6 rounded-full " + (ink === c ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "")}
                        />
                      ))}
                    </div>
                  </Field>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 h-36 rounded-md border border-dashed border-border bg-dots cursor-pointer hover:bg-muted/40">
                  {sigPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sigPreview} alt="Signature" className="max-h-28 max-w-[90%] object-contain" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">PNG with transparent background works best</span>
                    </>
                  )}
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => setSig(e.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>

            <div className="space-y-4">
              <Field label="Placement">
                <ChoiceGrid value={position} onChange={setPosition} options={POSITIONS} />
              </Field>
              <FieldGrid>
                <Field label="Pages">
                  <Segmented
                    size="sm"
                    value={pages}
                    onChange={setPages}
                    options={[
                      { value: "last", label: "Last" },
                      { value: "first", label: "First" },
                      { value: "all", label: "All" },
                    ]}
                  />
                </Field>
                <Field label={`Width — ${size}% of page`}>
                  <Slider min={10} max={60} step={1} value={[size]} onValueChange={(v) => setSize(v[0])} />
                </Field>
              </FieldGrid>
            </div>
          </div>
        }
        action={{ label: "Sign PDF", busyLabel: "Signing…", icon: <PenTool />, onClick: sign, disabled: !sig }}
      />
    </ToolLayout>
  );
}
