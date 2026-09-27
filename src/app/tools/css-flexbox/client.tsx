"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { CodeOutput, Field, OptionsLayout, Segmented, SliderField, ToolPanel } from "@/components/tool";

const DIRECTION = ["row", "row-reverse", "column", "column-reverse"] as const;
const JUSTIFY = ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"] as const;
const ALIGN = ["stretch", "flex-start", "center", "flex-end", "baseline"] as const;
const WRAP = ["nowrap", "wrap", "wrap-reverse"] as const;

const TW: Record<string, string> = {
  row: "flex-row", "row-reverse": "flex-row-reverse", column: "flex-col", "column-reverse": "flex-col-reverse",
  "flex-start": "start", center: "center", "flex-end": "end", "space-between": "between", "space-around": "around", "space-evenly": "evenly",
  stretch: "stretch", baseline: "baseline", nowrap: "flex-nowrap", wrap: "flex-wrap", "wrap-reverse": "flex-wrap-reverse",
};

const short = (v: string) => v.replace("flex-", "").replace("space-", "");

export default function CSSFlexboxGenerator() {
  const [direction, setDirection] = useState<(typeof DIRECTION)[number]>("row");
  const [justify, setJustify] = useState<(typeof JUSTIFY)[number]>("center");
  const [align, setAlign] = useState<(typeof ALIGN)[number]>("center");
  const [wrap, setWrap] = useState<(typeof WRAP)[number]>("wrap");
  const [gap, setGap] = useState(16);
  const [items, setItems] = useState(5);
  const [varied, setVaried] = useState(true);

  const css = `.flex {
  display: flex;
  flex-direction: ${direction};
  justify-content: ${justify};
  align-items: ${align};
  flex-wrap: ${wrap};
  gap: ${gap}px;
}`;
  const tailwind = `flex ${TW[direction]} justify-${TW[justify]} items-${TW[align]} ${TW[wrap]} gap-[${gap}px]`;

  const group = <T extends string>(label: string, value: T, set: (v: T) => void, opts: readonly T[]) => (
    <Field label={<>{label} <code className="text-muted-foreground font-mono font-normal">{value}</code></>}>
      <Segmented size="sm" value={value} onChange={set} options={opts.map((o) => ({ value: o, label: short(o) }))} className="flex-wrap" />
    </Field>
  );

  const options = (
    <ToolPanel title="Container" bodyClassName="p-3 space-y-4">
      {group("Direction", direction, setDirection, DIRECTION)}
      {group("Justify content", justify, setJustify, JUSTIFY)}
      {group("Align items", align, setAlign, ALIGN)}
      {group("Wrap", wrap, setWrap, WRAP)}
      <SliderField label="Gap" value={gap} onChange={setGap} min={0} max={64} format={(v) => `${v}px`} />
      <SliderField label="Items" value={items} onChange={setItems} min={1} max={16} />
      <Field label="Varied item sizes" inline>
        <Segmented
          size="sm"
          value={varied ? "on" : "off"}
          onChange={(v) => setVaried(v === "on")}
          options={[
            { value: "off", label: "Off" },
            { value: "on", label: "On" },
          ]}
        />
      </Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="css-flexbox">
      <OptionsLayout options={options}>
        <ToolPanel title="Preview" bodyClassName="p-4 bg-dots">
          <div className="min-h-96 rounded-md border border-dashed border-border" style={{ display: "flex", flexDirection: direction, justifyContent: justify, alignItems: align, flexWrap: wrap, gap }}>
            {Array.from({ length: items }, (_, i) => (
              <div
                key={i}
                className="rounded-md border border-primary/30 bg-accent text-accent-foreground text-xs font-medium flex items-center justify-center tabular-nums"
                style={varied ? { minWidth: 48 + ((i * 29) % 60), minHeight: 40 + ((i * 17) % 50), padding: 8 } : { width: 64, height: 56 }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </ToolPanel>
        <CodeOutput
          tabs={[
            { id: "css", label: "CSS", code: css },
            { id: "tw", label: "Tailwind", code: tailwind },
          ]}
        />
      </OptionsLayout>
    </ToolLayout>
  );
}
