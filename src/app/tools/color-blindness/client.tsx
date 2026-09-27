"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ChoiceGrid, ImageTool, Segmented, ToolPanel, baseName, canvasToBlob, useImageFile } from "@/components/tool";
import { cn } from "@/lib/utils";

/**
 * Colour-vision deficiency simulation matrices (Machado, Oliveira & Fernandes 2009,
 * severity 1.0), applied in linear RGB — which is SVG feColorMatrix's default space.
 */
const TYPES = [
  { id: "normal", name: "Normal vision", desc: "Trichromatic", m: null },
  { id: "protanopia", name: "Protanopia", desc: "No red cones · ~1% of men", m: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998] },
  { id: "deuteranopia", name: "Deuteranopia", desc: "No green cones · ~1% of men", m: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881] },
  { id: "tritanopia", name: "Tritanopia", desc: "No blue cones · <0.01%", m: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039] },
  { id: "achromatopsia", name: "Achromatopsia", desc: "No colour · very rare", m: [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722] },
] as const;
type TypeId = (typeof TYPES)[number]["id"];

const toSvgMatrix = (m: readonly number[]) => `${m[0]} ${m[1]} ${m[2]} 0 0  ${m[3]} ${m[4]} ${m[5]} 0 0  ${m[6]} ${m[7]} ${m[8]} 0 0  0 0 0 1 0`;
const filterFor = (id: TypeId) => (id === "normal" ? "none" : `url(#cvd-${id})`);

/** Hidden SVG defs so any element can use filter: url(#cvd-…). */
function Filters() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        {TYPES.filter((t) => t.m).map((t) => (
          <filter key={t.id} id={`cvd-${t.id}`} colorInterpolationFilters="linearRGB">
            <feColorMatrix type="matrix" values={toSvgMatrix(t.m!)} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

export default function ColorBlindnessSimulator() {
  const [active, setActive] = useState<TypeId>("deuteranopia");
  const [layout, setLayout] = useState<"single" | "grid">("grid");
  const image = useImageFile();

  // Canvas 2D honours CSS/SVG filters, so the simulated image can be exported.
  const download = async () => {
    if (!image.img || active === "normal") return;
    const c = document.createElement("canvas");
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext("2d")!;
    ctx.filter = filterFor(active);
    ctx.drawImage(image.img, 0, 0);
    const blob = await canvasToBlob(c, "image/png");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${baseName(image.file)}-${active}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const shown = layout === "grid" ? TYPES : TYPES.filter((t) => t.id === active);

  return (
    <ToolLayout toolId="color-blindness">
      <Filters />
      <ImageTool
        image={image}
        hideAction
        action={{ label: "", onClick: () => {} }}
        dropHint="Screenshots of UIs, charts and maps are the most revealing."
        options={
          <>
            <Segmented
              value={layout}
              onChange={setLayout}
              options={[
                { value: "grid", label: "Compare all" },
                { value: "single", label: "One at a time" },
              ]}
            />
            <ChoiceGrid cols={2} value={active} onChange={setActive} options={TYPES.map((t) => ({ value: t.id, label: t.name, hint: t.desc }))} />
            <Button variant="outline" onClick={download} disabled={active === "normal"} className="w-full">
              <Download /> Download simulated PNG
            </Button>
            <p className="text-[11px] text-muted-foreground">Simulation uses the Machado et al. (2009) model at full severity. Real experiences vary.</p>
          </>
        }
        preview={
          image.url ? (
            <div className={cn("p-3 grid gap-3", layout === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "")}>
              {shown.map((t) => (
                <figure key={t.id} className={cn("rounded-md border overflow-hidden bg-muted/30", t.id === active && layout === "grid" ? "border-primary" : "border-border")}>
                  <button type="button" onClick={() => setActive(t.id)} className="block w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url!} alt={t.name} className={cn("w-full object-contain", layout === "grid" ? "max-h-56" : "max-h-[60vh]")} style={{ filter: filterFor(t.id) }} />
                  </button>
                  <figcaption className="flex items-center justify-between px-2.5 h-8 border-t border-border text-xs bg-card">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted-foreground">{t.desc.split(" · ")[1] ?? ""}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : null
        }
      >
        <ToolPanel title="Common colour pairs" bodyClassName="p-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TYPES.map((t) => (
            <div key={t.id} className="space-y-1">
              <div className="flex h-8 rounded-sm overflow-hidden border border-border" style={{ filter: filterFor(t.id) }}>
                {["#dc2626", "#16a34a", "#2563eb", "#f59e0b", "#9333ea"].map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{t.name}</p>
            </div>
          ))}
        </ToolPanel>
      </ImageTool>
    </ToolLayout>
  );
}
