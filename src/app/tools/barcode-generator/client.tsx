"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { Download, RefreshCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeArea, ColorField, Field, OptionsLayout, Segmented, SliderField, StatusBadge, ToolAlert, ToolPanel, Toggle } from "@/components/tool";

type Fmt = "CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPC" | "UPCE" | "ITF14" | "ITF" | "codabar" | "MSI" | "pharmacode";

const FORMATS: Record<Fmt, { label: string; hint: string; example: string; test: RegExp }> = {
  CODE128: { label: "Code 128", hint: "Any ASCII text — shipping labels, inventory, general use.", example: "EVERYDAYTAB-2026", test: /^[\x00-\x7F]+$/ },
  CODE39: { label: "Code 39", hint: "A–Z, 0–9 and - . $ / + % space — automotive, defence, badges.", example: "CODE 39", test: /^[0-9A-Z\-. $/+%]+$/ },
  EAN13: { label: "EAN-13", hint: "12 digits (check digit added) — retail products outside North America.", example: "590123412345", test: /^\d{12,13}$/ },
  EAN8: { label: "EAN-8", hint: "7 digits (check digit added) — small retail packages.", example: "9638507", test: /^\d{7,8}$/ },
  UPC: { label: "UPC-A", hint: "11 digits (check digit added) — North American retail.", example: "03600029145", test: /^\d{11,12}$/ },
  UPCE: { label: "UPC-E", hint: "6–8 digits — compressed UPC for small packages.", example: "01234565", test: /^\d{6,8}$/ },
  ITF14: { label: "ITF-14", hint: "13 digits (check digit added) — shipping cartons (GTIN-14).", example: "1540014128876", test: /^\d{13,14}$/ },
  ITF: { label: "ITF (Interleaved 2 of 5)", hint: "Even number of digits — warehousing.", example: "123456", test: /^(\d\d)+$/ },
  codabar: { label: "Codabar", hint: "Digits and - $ : / . + with A–D start/stop — libraries, blood banks.", example: "A12345B", test: /^[A-D]?[0-9\-$:/.+]+[A-D]?$/i },
  MSI: { label: "MSI Plessey", hint: "Digits only — shelf labels.", example: "1234567", test: /^\d+$/ },
  pharmacode: { label: "Pharmacode", hint: "Number 3–131070 — pharmaceutical packaging.", example: "1234", test: /^\d+$/ },
};

/** GS1 mod-10 check digit (EAN/UPC/ITF-14). */
function gs1Check(d: string) {
  const sum = d.split("").reverse().reduce((s, c, i) => s + Number(c) * (i % 2 === 0 ? 3 : 1), 0);
  return String((10 - (sum % 10)) % 10);
}
const GS1_LEN: Partial<Record<Fmt, number>> = { EAN13: 13, EAN8: 8, UPC: 12, ITF14: 14 };

function validate(fmt: Fmt, v: string): string | null {
  if (!v) return "Empty value.";
  const f = FORMATS[fmt];
  const val = fmt === "CODE39" ? v.toUpperCase() : v;
  if (!f.test.test(val)) return `Not valid for ${f.label}: ${f.hint}`;
  const n = GS1_LEN[fmt];
  if (n && v.length === n && gs1Check(v.slice(0, -1)) !== v.slice(-1)) return `Wrong check digit — should end in ${gs1Check(v.slice(0, -1))} (${v.slice(0, -1)}${gs1Check(v.slice(0, -1))}).`;
  if (fmt === "pharmacode" && (Number(v) < 3 || Number(v) > 131070)) return "Pharmacode must be between 3 and 131070.";
  return null;
}

interface Opts { format: Fmt; width: number; height: number; displayValue: boolean; fontSize: number; margin: number; lineColor: string; background: string }

function render(svg: SVGSVGElement, value: string, o: Opts) {
  JsBarcode(svg, o.format === "CODE39" ? value.toUpperCase() : value, { ...o, font: "monospace", textMargin: 4 });
}

async function svgToPng(svg: SVGSVGElement, scale = 3): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width * scale;
  c.height = img.height * scale;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob((b) => r(b!), "image/png"));
}

const save = (blob: Blob, name: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};
const safe = (s: string) => s.replace(/[^\w.-]+/g, "_").slice(0, 60) || "barcode";

export default function BarcodeGenerator() {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [value, setValue] = useState(FORMATS.CODE128.example);
  const [batch, setBatch] = useState("");
  const [o, setO] = useState<Opts>({ format: "CODE128", width: 2, height: 90, displayValue: true, fontSize: 16, margin: 10, lineColor: "#000000", background: "#ffffff" });
  const [zipping, setZipping] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setO((x) => ({ ...x, [k]: v }));

  const error = mode === "single" ? validate(o.format, value) : null;
  const lines = useMemo(() => batch.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 200), [batch]);

  useEffect(() => {
    if (mode === "single" && svgRef.current && !error) {
      try { render(svgRef.current, value, o); } catch { /* validated above */ }
    }
  }, [mode, value, o, error]);

  const downloadSvg = () => svgRef.current && save(new Blob([new XMLSerializer().serializeToString(svgRef.current)], { type: "image/svg+xml" }), `${safe(value)}.svg`);
  const downloadPng = async () => svgRef.current && save(await svgToPng(svgRef.current), `${safe(value)}.png`);

  const downloadZip = async () => {
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      for (const [i, l] of lines.entries()) {
        if (validate(o.format, l)) continue;
        render(svg, l, o);
        zip.file(`${String(i + 1).padStart(3, "0")}-${safe(l)}.png`, await svgToPng(svg));
      }
      save(await zip.generateAsync({ type: "blob" }), "barcodes.zip");
    } finally {
      setZipping(false);
    }
  };

  const options = (
    <ToolPanel title="Barcode" bodyClassName="p-3 space-y-4">
      <Field label="Format" hint={FORMATS[o.format].hint} htmlFor="bf">
        <select id="bf" value={o.format} onChange={(e) => { const f = e.target.value as Fmt; set("format", f); if (mode === "single") setValue(FORMATS[f].example); }} className="h-(--control-h) w-full rounded-md border border-input bg-card px-2 text-sm dark:bg-input/30">
          {(Object.keys(FORMATS) as Fmt[]).map((f) => <option key={f} value={f}>{FORMATS[f].label}</option>)}
        </select>
      </Field>
      <SliderField label="Bar width" value={o.width} onChange={(v) => set("width", v)} min={1} max={4} step={0.5} format={(v) => `${v}px`} />
      <SliderField label="Height" value={o.height} onChange={(v) => set("height", v)} min={30} max={200} format={(v) => `${v}px`} />
      <SliderField label="Quiet zone" value={o.margin} onChange={(v) => set("margin", v)} min={0} max={40} format={(v) => `${v}px`} />
      <Toggle label="Show text" checked={o.displayValue} onChange={(v) => set("displayValue", v)} />
      {o.displayValue && <SliderField label="Font size" value={o.fontSize} onChange={(v) => set("fontSize", v)} min={8} max={32} />}
      <div className="grid grid-cols-2 gap-2">
        <ColorField label="Bars" value={o.lineColor} onChange={(v) => set("lineColor", v)} />
        <ColorField label="Background" value={o.background} onChange={(v) => set("background", v)} />
      </div>
      <p className="text-[11px] text-muted-foreground">Keep dark bars on a light background with a quiet zone — low contrast or inverted colours often won&apos;t scan.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="barcode-generator">
      <OptionsLayout options={options}>
        <Segmented value={mode} onChange={setMode} options={[{ value: "single", label: "Single barcode" }, { value: "batch", label: "Batch (one per line)" }]} />
        {mode === "single" ? (
          <>
            <ToolPanel bodyClassName="p-3 space-y-1.5">
              <Input value={value} onChange={(e) => setValue(e.target.value)} className="h-11 text-lg font-mono" spellCheck={false} aria-invalid={error ? true : undefined} />
              {GS1_LEN[o.format] && /^\d+$/.test(value) && value.length === GS1_LEN[o.format]! - 1 && <p className="text-[11px] text-muted-foreground">Check digit {gs1Check(value)} will be added automatically.</p>}
            </ToolPanel>
            {error ? (
              <ToolAlert tone="error">{error}</ToolAlert>
            ) : (
              <ToolPanel
                title="Preview"
                actions={<StatusBadge tone="success">Valid {FORMATS[o.format].label}</StatusBadge>}
                footer={
                  <>
                    <span className="flex-1" />
                    <Button variant="outline" onClick={downloadSvg}><Download /> SVG</Button>
                    <Button onClick={downloadPng}><Download /> PNG</Button>
                  </>
                }
              >
                <div className="p-6 flex justify-center overflow-x-auto" style={{ background: o.background }}>
                  <svg ref={svgRef} />
                </div>
              </ToolPanel>
            )}
          </>
        ) : (
          <>
            <ToolPanel title={`Values · ${lines.length}`} actions={!batch && <button type="button" onClick={() => setBatch("SKU-0001\nSKU-0002\nSKU-0003\nSKU-0004")} className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted">Sample</button>}>
              <CodeArea value={batch} onChange={(e) => setBatch(e.target.value)} minHeight={140} placeholder="One value per line (up to 200)…" />
            </ToolPanel>
            {lines.length > 0 && (
              <ToolPanel
                title="Barcodes"
                footer={<><span className="text-xs text-muted-foreground">{lines.filter((l) => !validate(o.format, l)).length} valid · {lines.filter((l) => validate(o.format, l)).length} skipped</span><span className="flex-1" /><Button variant="outline" onClick={() => window.print()}>Print sheet</Button><Button onClick={downloadZip} disabled={zipping}>{zipping ? <RefreshCw className="animate-spin" /> : <Download />} PNGs (.zip)</Button></>}
              >
                <div className="p-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3" style={{ background: o.background }}>
                  {lines.map((l, i) => {
                    const err = validate(o.format, l);
                    return err ? (
                      <div key={i} className="rounded-md border border-destructive/40 p-2 text-xs text-destructive break-all">{l}: {err}</div>
                    ) : (
                      <svg key={`${i}-${l}-${JSON.stringify(o)}`} ref={(el) => { if (el) try { render(el, l, o); } catch { /* skip */ } }} className="max-w-full mx-auto" />
                    );
                  })}
                </div>
              </ToolPanel>
            )}
          </>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
