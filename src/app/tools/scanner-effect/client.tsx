"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, ScanLine } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Field, FieldGrid, PdfProgress, PdfTool, Segmented, ToolPanel, canvasToBytes, downloadFile, rasterizePages, suffixName, usePdfFile } from "@/components/tool";

interface ScanSettings {
  grayscale: boolean;
  border: boolean;
  rotate: number;
  rotateVariance: number;
  brightness: number;
  contrast: number;
  blur: number;
  noise: number;
  yellowish: number;
  resolution: number;
}

function applyScannerEffect(
  sourceData: ImageData,
  canvas: HTMLCanvasElement,
  settings: ScanSettings,
  rotationAngle: number,
  scale: number = 1
): void {
  const ctx = canvas.getContext("2d")!;
  const w = sourceData.width;
  const h = sourceData.height;

  const scaledBlur = settings.blur * scale;
  const scaledNoise = settings.noise * scale;

  const workCanvas = document.createElement("canvas");
  workCanvas.width = w;
  workCanvas.height = h;
  const workCtx = workCanvas.getContext("2d")!;

  if (scaledBlur > 0) {
    workCtx.filter = `blur(${scaledBlur}px)`;
  }

  workCtx.putImageData(sourceData, 0, 0);
  if (scaledBlur > 0) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.filter = `blur(${scaledBlur}px)`;
    tempCtx.drawImage(workCanvas, 0, 0);
    workCtx.filter = "none";
    workCtx.clearRect(0, 0, w, h);
    workCtx.drawImage(tempCanvas, 0, 0);
  }

  const imageData = workCtx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const contrastFactor =
    settings.contrast !== 0
      ? (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast))
      : 1;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (settings.grayscale) {
      const grey = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      r = grey;
      g = grey;
      b = grey;
    }

    if (settings.brightness !== 0) {
      r += settings.brightness;
      g += settings.brightness;
      b += settings.brightness;
    }

    if (settings.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    if (settings.yellowish > 0) {
      const intensity = settings.yellowish / 50;
      r += 20 * intensity;
      g += 12 * intensity;
      b -= 15 * intensity;
    }

    if (scaledNoise > 0) {
      const n = (Math.random() - 0.5) * scaledNoise;
      r += n;
      g += n;
      b += n;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  workCtx.putImageData(imageData, 0, 0);

  if (settings.border) {
    const borderSize = Math.max(w, h) * 0.02;
    const gradient1 = workCtx.createLinearGradient(0, 0, borderSize, 0);
    gradient1.addColorStop(0, "rgba(0,0,0,0.3)");
    gradient1.addColorStop(1, "rgba(0,0,0,0)");
    workCtx.fillStyle = gradient1;
    workCtx.fillRect(0, 0, borderSize, h);

    const gradient2 = workCtx.createLinearGradient(w, 0, w - borderSize, 0);
    gradient2.addColorStop(0, "rgba(0,0,0,0.3)");
    gradient2.addColorStop(1, "rgba(0,0,0,0)");
    workCtx.fillStyle = gradient2;
    workCtx.fillRect(w - borderSize, 0, borderSize, h);

    const gradient3 = workCtx.createLinearGradient(0, 0, 0, borderSize);
    gradient3.addColorStop(0, "rgba(0,0,0,0.3)");
    gradient3.addColorStop(1, "rgba(0,0,0,0)");
    workCtx.fillStyle = gradient3;
    workCtx.fillRect(0, 0, w, borderSize);

    const gradient4 = workCtx.createLinearGradient(0, h, 0, h - borderSize);
    gradient4.addColorStop(0, "rgba(0,0,0,0.3)");
    gradient4.addColorStop(1, "rgba(0,0,0,0)");
    workCtx.fillStyle = gradient4;
    workCtx.fillRect(0, h - borderSize, w, borderSize);
  }

  if (rotationAngle !== 0) {
    const rad = (rotationAngle * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const newW = Math.ceil(w * cos + h * sin);
    const newH = Math.ceil(w * sin + h * cos);

    canvas.width = newW;
    canvas.height = newH;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, newW, newH);
    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(rad);
    ctx.drawImage(workCanvas, -w / 2, -h / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(workCanvas, 0, 0);
  }
}

const DEFAULTS: ScanSettings = {
  grayscale: false,
  border: false,
  rotate: 0,
  rotateVariance: 0,
  brightness: 0,
  contrast: 0,
  blur: 0,
  noise: 10,
  yellowish: 0,
  resolution: 150,
};

const PRESETS: Record<string, Partial<ScanSettings>> = {
  Subtle: { noise: 8, rotate: 0.3, rotateVariance: 0.3, contrast: 5 },
  Office: { grayscale: true, noise: 14, rotate: 0.6, rotateVariance: 0.5, contrast: 18, blur: 0.3, border: true },
  "Old copy": { grayscale: false, noise: 22, rotate: 1, rotateVariance: 0.8, contrast: 12, blur: 0.5, yellowish: 30, border: true },
  Fax: { grayscale: true, noise: 30, contrast: 60, blur: 0.4, rotate: 0.4, resolution: 100 },
};

export default function ScannerEffect() {
  const [settings, setSettings] = useState<ScanSettings>(DEFAULTS);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [baselineVersion, setBaselineVersion] = useState(0);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const baselineRef = useRef<ImageData | null>(null);

  const pdf = usePdfFile(async (f) => {
    baselineRef.current = null;
    // Render page 1 once at 1x as the preview baseline.
    await rasterizePages(f, 1, ({ canvas, ctx }) => {
      baselineRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }, undefined, [1]);
    setBaselineVersion((v) => v + 1);
  });

  // Redraw the preview whenever settings or the baseline change.
  useEffect(() => {
    const base = baselineRef.current;
    if (!base || !previewRef.current) return;
    applyScannerEffect(new ImageData(new Uint8ClampedArray(base.data), base.width, base.height), previewRef.current, settings, settings.rotate);
  }, [settings, baselineVersion]);

  const set = <K extends keyof ScanSettings>(key: K, value: ScanSettings[K]) => setSettings((s) => ({ ...s, [key]: value }));

  const apply = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const out = await PDFDocument.create();
      const dpiScale = settings.resolution / 72;
      await rasterizePages(
        pdf.file,
        dpiScale,
        async ({ canvas, ctx }) => {
          const base = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const output = document.createElement("canvas");
          const angle = settings.rotate + (settings.rotateVariance > 0 ? (Math.random() - 0.5) * 2 * settings.rotateVariance : 0);
          applyScannerEffect(base, output, settings, angle, dpiScale);
          const jpg = await out.embedJpg(await canvasToBytes(output, "image/jpeg", 0.85));
          // Convert pixels back to points so the paper size matches the original.
          const w = output.width / dpiScale;
          const h = output.height / dpiScale;
          out.addPage([w, h]).drawImage(jpg, { x: 0, y: 0, width: w, height: h });
        },
        (done, total) => setProgress({ done, total })
      );
      downloadFile(await out.save(), suffixName(pdf.file, "scanned"));
    }, "Failed to apply scanner effect.");

  const slider = (label: string, key: keyof ScanSettings, min: number, max: number, step: number, suffix = "") => (
    <Field label={`${label} — ${settings[key]}${suffix}`}>
      <Slider min={min} max={max} step={step} value={[settings[key] as number]} onValueChange={(v) => set(key, v[0] as never)} />
    </Field>
  );

  return (
    <ToolLayout toolId="scanner-effect">
      <PdfTool
        pdf={pdf}
        options={
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <Field label="Presets">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(PRESETS).map(([name, p]) => (
                    <Button key={name} variant="outline" size="sm" onClick={() => setSettings({ ...DEFAULTS, ...p })}>
                      {name}
                    </Button>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => setSettings(DEFAULTS)}>
                    <RotateCcw /> Reset
                  </Button>
                </div>
              </Field>
              <FieldGrid>
                {slider("Tilt", "rotate", -5, 5, 0.1, "°")}
                {slider("Tilt variance per page", "rotateVariance", 0, 3, 0.1, "°")}
                {slider("Brightness", "brightness", -60, 60, 1)}
                {slider("Contrast", "contrast", -60, 100, 1)}
                {slider("Blur", "blur", 0, 2, 0.1, "px")}
                {slider("Noise", "noise", 0, 60, 1)}
                {slider("Yellowing", "yellowish", 0, 60, 1)}
              </FieldGrid>
              <FieldGrid>
                <Field label="Greyscale" inline>
                  <Switch checked={settings.grayscale} onCheckedChange={(v) => set("grayscale", v)} />
                </Field>
                <Field label="Dark scanner edges" inline>
                  <Switch checked={settings.border} onCheckedChange={(v) => set("border", v)} />
                </Field>
              </FieldGrid>
              <Field label="Output resolution">
                <Segmented
                  size="sm"
                  value={String(settings.resolution)}
                  onChange={(v) => set("resolution", Number(v))}
                  options={[
                    { value: "100", label: "100 dpi" },
                    { value: "150", label: "150 dpi" },
                    { value: "200", label: "200 dpi" },
                    { value: "300", label: "300 dpi" },
                  ]}
                />
              </Field>
            </div>
            <ToolPanel title="Preview · page 1" bodyClassName="p-3 bg-dots flex items-center justify-center min-h-72">
              <canvas ref={previewRef} className="max-w-full max-h-[420px] h-auto border border-border rounded-xs bg-white" />
            </ToolPanel>
          </div>
        }
        action={{ label: "Apply to all pages", busyLabel: "Scanning…", icon: <ScanLine />, onClick: apply }}
      >
        {pdf.busy && <PdfProgress {...progress} />}
      </PdfTool>
    </ToolLayout>
  );
}
