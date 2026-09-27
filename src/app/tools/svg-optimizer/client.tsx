"use client";

import { useMemo, useState } from "react";
import { FileCode } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ClearButton,
  CodeArea,
  CopyButton,
  DownloadButton,
  Field,
  SliderField,
  SplitLayout,
  Stat,
  StatusBadge,
  ToolAlert,
  ToolPanel,
  formatBytes,
} from "@/components/tool";
import { optimize } from "svgo/browser";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: Adobe Illustrator 27.0.0 -->
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
  <g id="Layer_1">
    <circle cx="50.000" cy="50.000" r="40.000" stroke="#000000" stroke-width="3" fill="#FF0000"/>
    <rect x="30" y="30" width="40" height="40" fill="none"/>
  </g>
</svg>`;

export default function SVGOptimizer() {
  const [input, setInput] = useState(SAMPLE);
  const [precision, setPrecision] = useState(2);
  const [multipass, setMultipass] = useState(true);
  const [responsive, setResponsive] = useState(false);
  const [keepIds, setKeepIds] = useState(false);
  const [pretty, setPretty] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", error: null as string | null };
    try {
      const { data } = optimize(input, {
        multipass,
        floatPrecision: precision,
        js2svg: { pretty, indent: 2 },
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                ...(keepIds ? { cleanupIds: false } : {}),
              },
            },
          },
          ...(responsive ? ["removeDimensions" as const] : []),
        ] as never,
      });
      return { output: data, error: null };
    } catch (e) {
      return { output: "", error: (e as Error).message.split("\n")[0] || "Invalid SVG" };
    }
  }, [input, precision, multipass, responsive, keepIds, pretty]);

  const before = new Blob([input]).size;
  const after = new Blob([result.output]).size;
  const saved = before && result.output ? Math.round((1 - after / before) * 100) : 0;

  const loadFile = async (f: File | undefined) => {
    if (f) setInput(await f.text());
  };

  return (
    <ToolLayout toolId="svg-optimizer">
      <div className="space-y-3">
        <ToolPanel title="Options" bodyClassName="p-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <SliderField label="Number precision" value={precision} onChange={setPrecision} min={0} max={5} format={(v) => `${v} dp`} />
          <Field label="Multipass" inline>
            <Switch checked={multipass} onCheckedChange={setMultipass} />
          </Field>
          <Field label="Responsive" hint="Drop width/height, keep viewBox." inline>
            <Switch checked={responsive} onCheckedChange={setResponsive} />
          </Field>
          <Field label="Keep IDs" hint="For CSS/JS hooks." inline>
            <Switch checked={keepIds} onCheckedChange={setKeepIds} />
          </Field>
          <Field label="Pretty print" inline>
            <Switch checked={pretty} onCheckedChange={setPretty} />
          </Field>
        </ToolPanel>

        <SplitLayout>
          <ToolPanel
            title="Input"
            actions={
              <>
                <label className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">
                  <FileCode className="w-3.5 h-3.5" /> Open .svg
                  <input type="file" accept=".svg,image/svg+xml" className="hidden" onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ""; }} />
                </label>
                <ClearButton onClick={() => setInput("")} iconOnly disabled={!input} />
              </>
            }
          >
            <CodeArea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste SVG markup…" minHeight={340} />
          </ToolPanel>
          <ToolPanel
            title="Optimized"
            actions={
              <>
                {result.output && <StatusBadge tone={saved > 0 ? "success" : "neutral"}>−{saved}%</StatusBadge>}
                <CopyButton text={result.output} iconOnly />
                <DownloadButton content={result.output} filename="optimized.svg" mime="image/svg+xml" iconOnly />
              </>
            }
          >
            <CodeArea value={result.output} readOnly minHeight={340} placeholder="Optimized SVG appears here…" />
          </ToolPanel>
        </SplitLayout>

        {result.error && <ToolAlert tone="error" title="Couldn't parse SVG">{result.error}</ToolAlert>}

        {result.output && (
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
            <Stat label="Original" value={formatBytes(before)} />
            <Stat label="Optimized" value={formatBytes(after)} hint={`${saved}% smaller`} />
            <ToolPanel title="Preview" bodyClassName="grid grid-cols-2 divide-x divide-border">
              {[input, result.output].map((svg, i) => (
                <div key={i} className="flex flex-col items-center justify-center gap-1 p-3 h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt="" className="max-h-20 max-w-full" />
                  <span className="text-[10px] text-muted-foreground">{i ? "Optimized" : "Original"}</span>
                </div>
              ))}
            </ToolPanel>
          </div>
        )}
        {!input && (
          <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE)}>
            Load example
          </Button>
        )}
      </div>
    </ToolLayout>
  );
}
