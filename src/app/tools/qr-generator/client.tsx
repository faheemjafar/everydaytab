"use client";

import { useRef, useState } from "react";
import { Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ClearButton, Field, OptionsLayout, Segmented, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

const PRESETS = [
  { fg: "#000000", bg: "#ffffff", name: "Classic" },
  { fg: "#1e3a8a", bg: "#ffffff", name: "Navy" },
  { fg: "#ffffff", bg: "#0f172a", name: "Dark" },
  { fg: "#065f46", bg: "#ecfdf5", name: "Emerald" },
];

type Level = "L" | "M" | "Q" | "H";

export default function QrGenerator() {
  const [text, setText] = useState("https://everydaytab.com");
  const [size, setSize] = useState([512]);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [level, setLevel] = useState<Level>("M");
  const [margin, setMargin] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);

  const svgString = () => {
    const svg = qrRef.current?.querySelector("svg");
    return svg ? new XMLSerializer().serializeToString(svg) : null;
  };

  const downloadPng = () => {
    const data = svgString();
    if (!data) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = canvas.height = size[0];
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size[0], size[0]);
        ctx.drawImage(img, 0, 0, size[0], size[0]);
      }
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-${Date.now()}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };

  const downloadSvg = () => {
    const data = svgString();
    if (!data) return;
    const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const options = (
    <ToolPanel title="Options" bodyClassName="p-3 space-y-4">
      <Field label="Content" htmlFor="qr-text">
        <div className="relative">
          <Input id="qr-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="URL or text…" className="pr-8" />
          {text && <ClearButton onClick={() => setText("")} iconOnly className="absolute right-0.5 top-0.5 h-7 w-7" />}
        </div>
      </Field>

      <Field label={`Export size — ${size[0]} px`}>
        <Slider min={128} max={2048} step={64} value={size} onValueChange={setSize} />
      </Field>

      <Field label="Error correction" hint="Higher levels survive damage and logos but pack denser.">
        <Segmented
          value={level}
          onChange={setLevel}
          options={[
            { value: "L", label: "L 7%" },
            { value: "M", label: "M 15%" },
            { value: "Q", label: "Q 25%" },
            { value: "H", label: "H 30%" },
          ]}
        />
      </Field>

      <Field label="Quiet zone" inline>
        <Segmented
          size="sm"
          value={margin ? "on" : "off"}
          onChange={(v) => setMargin(v === "on")}
          options={[
            { value: "on", label: "On" },
            { value: "off", label: "Off" },
          ]}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Foreground" value={fgColor} onChange={setFgColor} />
        <ColorField label="Background" value={bgColor} onChange={setBgColor} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const active = fgColor === p.fg && bgColor === p.bg;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                setFgColor(p.fg);
                setBgColor(p.bg);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 pl-1 pr-2.5 rounded-md border text-xs font-medium transition-colors",
                active ? "border-foreground bg-muted" : "border-border hover:bg-muted/60"
              )}
            >
              <span className="w-4.5 h-4.5 rounded-sm border border-border" style={{ background: `linear-gradient(135deg, ${p.fg} 50%, ${p.bg} 50%)` }} />
              {p.name}
            </button>
          );
        })}
      </div>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="qr-generator">
      <OptionsLayout options={options}>
        <ToolPanel
          title="Preview"
          footer={
            <>
              <Button size="lg" onClick={downloadPng} disabled={!text}>
                <Download /> PNG · {size[0]}px
              </Button>
              <Button variant="outline" onClick={downloadSvg} disabled={!text}>
                <Download /> SVG
              </Button>
              <span className="ml-auto text-[11px] text-muted-foreground">{text.length} chars</span>
            </>
          }
        >
          <div className="flex items-center justify-center p-6 bg-dots min-h-[420px]">
            <div ref={qrRef} className="rounded-md border border-border overflow-hidden" style={{ backgroundColor: bgColor }}>
              {text ? (
                <QRCodeSVG value={text} size={320} fgColor={fgColor} bgColor={bgColor} level={level} marginSize={margin ? 4 : 0} />
              ) : (
                <div className="w-80 h-80 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <QrCode className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Enter content to generate</p>
                </div>
              )}
            </div>
          </div>
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color`}
          className="w-8 h-8 rounded-md border border-input bg-card p-0.5 cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono uppercase" />
      </div>
    </Field>
  );
}
