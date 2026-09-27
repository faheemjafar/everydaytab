"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Field, FieldGrid, PdfProgress, PdfTool, Segmented, ToolPanel, canvasToBytes, downloadFile, rasterizePages, suffixName, usePdfFile } from "@/components/tool";

interface AdjustSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hueShift: number;
  temperature: number;
  tint: number;
  gamma: number;
  sepia: number;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function applyColorAdjustments(
  sourceData: ImageData,
  canvas: HTMLCanvasElement,
  settings: AdjustSettings
): void {
  const ctx = canvas.getContext("2d")!;
  const w = sourceData.width;
  const h = sourceData.height;

  canvas.width = w;
  canvas.height = h;

  const imageData = new ImageData(new Uint8ClampedArray(sourceData.data), w, h);
  const data = imageData.data;

  const contrastFactor =
    settings.contrast !== 0
      ? (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast))
      : 1;

  const gammaCorrection = settings.gamma !== 1.0 ? 1 / settings.gamma : 1;
  const sepiaAmount = settings.sepia / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (settings.brightness !== 0) {
      const adj = settings.brightness * 2.55;
      r += adj;
      g += adj;
      b += adj;
    }

    if (settings.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    if (settings.saturation !== 0 || settings.hueShift !== 0) {
      const [hue, sat, lig] = rgbToHsl(
        Math.max(0, Math.min(255, r)),
        Math.max(0, Math.min(255, g)),
        Math.max(0, Math.min(255, b))
      );

      let newHue = hue;
      if (settings.hueShift !== 0) {
        newHue = (hue + settings.hueShift / 360) % 1;
        if (newHue < 0) newHue += 1;
      }

      let newSat = sat;
      if (settings.saturation !== 0) {
        const satAdj = settings.saturation / 100;
        newSat = satAdj > 0 ? sat + (1 - sat) * satAdj : sat * (1 + satAdj);
        newSat = Math.max(0, Math.min(1, newSat));
      }

      [r, g, b] = hslToRgb(newHue, newSat, lig);
    }

    if (settings.temperature !== 0) {
      const t = settings.temperature / 50;
      r += 30 * t;
      b -= 30 * t;
    }

    if (settings.tint !== 0) {
      const t = settings.tint / 50;
      g += 30 * t;
    }

    if (settings.gamma !== 1.0) {
      r = Math.pow(Math.max(0, Math.min(255, r)) / 255, gammaCorrection) * 255;
      g = Math.pow(Math.max(0, Math.min(255, g)) / 255, gammaCorrection) * 255;
      b = Math.pow(Math.max(0, Math.min(255, b)) / 255, gammaCorrection) * 255;
    }

    if (settings.sepia > 0) {
      const sr = 0.393 * r + 0.769 * g + 0.189 * b;
      const sg = 0.349 * r + 0.686 * g + 0.168 * b;
      const sb = 0.272 * r + 0.534 * g + 0.131 * b;
      r = r + (sr - r) * sepiaAmount;
      g = g + (sg - g) * sepiaAmount;
      b = b + (sb - b) * sepiaAmount;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
}

const DEFAULTS: AdjustSettings = { brightness: 0, contrast: 0, saturation: 0, hueShift: 0, temperature: 0, tint: 0, gamma: 1, sepia: 0 };

const PRESETS: Record<string, Partial<AdjustSettings>> = {
  Greyscale: { saturation: -100 },
  "High contrast": { contrast: 45, saturation: -20 },
  Warm: { temperature: 25, saturation: 10 },
  Cool: { temperature: -25 },
  Sepia: { sepia: 80, contrast: 5 },
  "Brighten scan": { brightness: 12, contrast: 25, gamma: 1.2 },
};

export default function AdjustColors() {
  const [settings, setSettings] = useState<AdjustSettings>(DEFAULTS);
  const [quality, setQuality] = useState<"1.5" | "2" | "3">("2");
  const [format, setFormat] = useState<"jpeg" | "png">("jpeg");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [baselineVersion, setBaselineVersion] = useState(0);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const baselineRef = useRef<ImageData | null>(null);

  const pdf = usePdfFile(async (f) => {
    baselineRef.current = null;
    await rasterizePages(f, 1, ({ canvas, ctx }) => {
      baselineRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }, undefined, [1]);
    setBaselineVersion((v) => v + 1);
  });

  useEffect(() => {
    if (baselineRef.current && previewRef.current) applyColorAdjustments(baselineRef.current, previewRef.current, settings);
  }, [settings, baselineVersion]);

  const set = <K extends keyof AdjustSettings>(key: K, value: AdjustSettings[K]) => setSettings((s) => ({ ...s, [key]: value }));

  const apply = () =>
    pdf.run(async () => {
      if (!pdf.file) return;
      const out = await PDFDocument.create();
      await rasterizePages(
        pdf.file,
        Number(quality),
        async ({ canvas, ctx, width, height }) => {
          const output = document.createElement("canvas");
          applyColorAdjustments(ctx.getImageData(0, 0, canvas.width, canvas.height), output, settings);
          const img =
            format === "png"
              ? await out.embedPng(await canvasToBytes(output, "image/png"))
              : await out.embedJpg(await canvasToBytes(output, "image/jpeg", 0.9));
          out.addPage([width, height]).drawImage(img, { x: 0, y: 0, width, height });
        },
        (done, total) => setProgress({ done, total })
      );
      downloadFile(await out.save(), suffixName(pdf.file, "adjusted"));
    }, "Failed to adjust colours.");

  const slider = (label: string, key: keyof AdjustSettings, min: number, max: number, step: number, suffix = "") => (
    <Field label={`${label} — ${settings[key]}${suffix}`}>
      <Slider min={min} max={max} step={step} value={[settings[key]]} onValueChange={(v) => set(key, v[0])} />
    </Field>
  );

  const changed = (Object.keys(DEFAULTS) as (keyof AdjustSettings)[]).some((k) => settings[k] !== DEFAULTS[k]);

  return (
    <ToolLayout toolId="adjust-colors">
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
                  <Button variant="ghost" size="sm" onClick={() => setSettings(DEFAULTS)} disabled={!changed}>
                    <RotateCcw /> Reset
                  </Button>
                </div>
              </Field>
              <FieldGrid>
                {slider("Brightness", "brightness", -100, 100, 1)}
                {slider("Contrast", "contrast", -100, 100, 1)}
                {slider("Saturation", "saturation", -100, 100, 1)}
                {slider("Hue shift", "hueShift", -180, 180, 1, "°")}
                {slider("Temperature", "temperature", -50, 50, 1)}
                {slider("Tint", "tint", -50, 50, 1)}
                {slider("Gamma", "gamma", 0.2, 3, 0.05)}
                {slider("Sepia", "sepia", 0, 100, 1, "%")}
              </FieldGrid>
              <FieldGrid>
                <Field label="Render quality">
                  <Segmented
                    size="sm"
                    value={quality}
                    onChange={setQuality}
                    options={[
                      { value: "1.5", label: "Standard" },
                      { value: "2", label: "High" },
                      { value: "3", label: "Print" },
                    ]}
                  />
                </Field>
                <Field label="Image format" hint="JPEG is much smaller; PNG is lossless.">
                  <Segmented
                    size="sm"
                    value={format}
                    onChange={setFormat}
                    options={[
                      { value: "jpeg", label: "JPEG" },
                      { value: "png", label: "PNG" },
                    ]}
                  />
                </Field>
              </FieldGrid>
            </div>
            <ToolPanel title="Preview · page 1" bodyClassName="p-3 bg-dots flex items-center justify-center min-h-72">
              <canvas ref={previewRef} className="max-w-full max-h-[420px] h-auto border border-border rounded-xs bg-white" />
            </ToolPanel>
          </div>
        }
        action={{ label: "Apply to all pages", busyLabel: "Adjusting…", icon: <SlidersHorizontal />, onClick: apply, disabled: !changed }}
      >
        {pdf.busy && <PdfProgress {...progress} />}
      </PdfTool>
    </ToolLayout>
  );
}
