"use client";

import { useRef, useState } from "react";
import { Pipette, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ColorThief from "colorthief";
import { ToolLayout } from "@/components/tool-layout";
import { CodeOutput, CopyButton, Field, ImageTool, Segmented, ToolPanel, useImageFile } from "@/components/tool";

const toHex = ([r, g, b]: number[]) => "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
const readableOn = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? "#1c1917" : "#ffffff";
};

type Count = "5" | "8" | "12";

export default function ColorPaletteExtractor() {
  const [count, setCount] = useState<Count>("8");
  const [palette, setPalette] = useState<string[]>([]);
  const [dominant, setDominant] = useState<string | null>(null);

  const extract = (img: HTMLImageElement, n: number) => {
    try {
      const thief = new ColorThief();
      setDominant(toHex(thief.getColor(img)));
      setPalette((thief.getPalette(img, n) ?? []).map(toHex));
    } catch {
      setPalette([]);
      setDominant(null);
    }
  };

  const [picked, setPicked] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const image = useImageFile((img) => {
    extract(img, Number(count));
    // Draw once into an offscreen canvas for pixel sampling.
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d", { willReadFrequently: true })!.drawImage(img, 0, 0);
    canvas.current = c;
    setPicked([]);
  });

  const sample = (e: React.MouseEvent<HTMLImageElement>) => {
    const c = canvas.current;
    if (!c) return null;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * c.width);
    const y = Math.floor(((e.clientY - r.top) / r.height) * c.height);
    const [pr, pg, pb] = c.getContext("2d")!.getImageData(x, y, 1, 1).data;
    return toHex([pr, pg, pb]);
  };
  const addPick = (h: string) => setPicked((p) => (p.includes(h) ? p : [h, ...p].slice(0, 24)));
  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;
  const screenPick = async () => {
    try {
      const r = await new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper().open();
      addPick(r.sRGBHex);
    } catch {
      /* cancelled */
    }
  };

  const all = dominant ? [dominant, ...palette.filter((c) => c !== dominant)] : palette;
  const css = `:root {\n${all.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}\n}`;
  const tailwind = `colors: {\n  brand: {\n${all.map((c, i) => `    ${(i + 1) * 100}: "${c}",`).join("\n")}\n  },\n}`;
  const json = JSON.stringify(all, null, 2);

  return (
    <ToolLayout toolId="color-palette">
      <ImageTool
        image={image}
        hideAction
        action={{ label: "", onClick: () => {} }}
        preview={
          image.url ? (
            <div className="relative flex items-center justify-center p-4 min-h-[320px] bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" draggable={false} onMouseMove={(e) => setHover(sample(e))} onMouseLeave={() => setHover(null)} onClick={(e) => { const h = sample(e); if (h) addPick(h); }} className="max-w-full max-h-[55vh] object-contain cursor-crosshair rounded-xs" />
              {hover && (
                <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs shadow-float">
                  <span className="w-4 h-4 rounded-sm border border-border" style={{ background: hover }} /> {hover}
                </span>
              )}
            </div>
          ) : undefined
        }
        options={
          <>
            <Field label="Colours">
              <Segmented
                size="sm"
                value={count}
                onChange={(c) => {
                  setCount(c);
                  if (image.img) extract(image.img, Number(c));
                }}
                options={[
                  { value: "5", label: "5" },
                  { value: "8", label: "8" },
                  { value: "12", label: "12" },
                ]}
              />
            </Field>
            {dominant && (
              <Field label="Dominant">
                <div className="flex items-center gap-2 h-10 px-2.5 rounded-md border border-border" style={{ background: dominant, color: readableOn(dominant) }}>
                  <code className="font-mono text-sm flex-1">{dominant}</code>
                  <CopyButton text={dominant} iconOnly className="bg-transparent border-current/20" />
                </div>
              </Field>
            )}
          </>
        }
      >
        <ToolPanel
          title={`Picked colours${picked.length ? ` · ${picked.length}` : ""}`}
          actions={
            <>
              {hasEyeDropper && <Button variant="outline" size="sm" onClick={screenPick}><Pipette /> Pick from screen</Button>}
              {picked.length > 0 && <CopyButton getText={() => picked.join("\n")} label="Copy all" />}
            </>
          }
        >
          {picked.length ? (
            <div className="p-3 flex flex-wrap gap-2">
              {picked.map((h) => (
                <span key={h} className="group inline-flex items-center gap-1.5 rounded-md border border-border pl-1 pr-1.5 h-8">
                  <span className="w-6 h-6 rounded-sm border border-border" style={{ background: h }} />
                  <code className="font-mono text-xs">{h}</code>
                  <CopyButton text={h} iconOnly className="size-6" />
                  <button type="button" onClick={() => setPicked((p) => p.filter((x) => x !== h))} aria-label="Remove" className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          ) : (
            <p className="px-3.5 py-4 text-xs text-muted-foreground">Click anywhere on the image to pick the exact pixel colour.</p>
          )}
        </ToolPanel>
        {palette.length > 0 && (
          <>
            <ToolPanel title="Palette">
              <div className="flex h-28">
                {all.map((c) => (
                  <div key={c} className="group relative flex-1 flex items-end justify-center pb-2" style={{ background: c, color: readableOn(c) }}>
                    <code className="font-mono text-[11px] opacity-80 group-hover:opacity-100">{c}</code>
                    <CopyButton text={c} iconOnly className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-transparent border-current/20" />
                  </div>
                ))}
              </div>
            </ToolPanel>
            <CodeOutput
              title="Export"
              tabs={[
                { id: "css", label: "CSS variables", code: css },
                { id: "tw", label: "Tailwind", code: tailwind },
                { id: "json", label: "JSON", code: json },
              ]}
            />
          </>
        )}
      </ImageTool>
    </ToolLayout>
  );
}
