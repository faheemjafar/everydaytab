"use client";

import { useState } from "react";
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

  const image = useImageFile((img) => extract(img, Number(count)));

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
