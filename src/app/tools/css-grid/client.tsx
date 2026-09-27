"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CodeOutput, Field, FieldGrid, OptionsLayout, SliderField, ToolPanel } from "@/components/tool";

export default function CSSGridGenerator() {
  const [columns, setColumns] = useState(3);
  const [rows, setRows] = useState(3);
  const [columnGap, setColumnGap] = useState(12);
  const [rowGap, setRowGap] = useState(12);
  const [colTemplate, setColTemplate] = useState("");
  const [rowTemplate, setRowTemplate] = useState("");
  const [minWidth, setMinWidth] = useState(0);

  // Custom template overrides the repeat(); "auto-fit" mode when a min width is set.
  const cols = colTemplate.trim() || (minWidth > 0 ? `repeat(auto-fit, minmax(${minWidth}px, 1fr))` : `repeat(${columns}, 1fr)`);
  const rowsT = rowTemplate.trim() || `repeat(${rows}, 1fr)`;
  const count = minWidth > 0 && !colTemplate ? columns * rows : (colTemplate ? colTemplate.trim().split(/\s+/).length : columns) * (rowTemplate ? rowTemplate.trim().split(/\s+/).length : rows);

  const css = `.grid {
  display: grid;
  grid-template-columns: ${cols};
  grid-template-rows: ${rowsT};
  gap: ${rowGap === columnGap ? `${rowGap}px` : `${rowGap}px ${columnGap}px`};
}`;
  const tailwind = [
    "grid",
    !colTemplate && !minWidth ? `grid-cols-${columns}` : `grid-cols-[${cols.replace(/\s+/g, "_")}]`,
    !rowTemplate ? `grid-rows-${rows}` : `grid-rows-[${rowsT.replace(/\s+/g, "_")}]`,
    rowGap === columnGap ? `gap-[${rowGap}px]` : `gap-x-[${columnGap}px] gap-y-[${rowGap}px]`,
  ].join(" ");
  const html = `<div class="grid">\n${Array.from({ length: Math.min(count, 24) }, (_, i) => `  <div>${i + 1}</div>`).join("\n")}\n</div>`;

  const options = (
    <ToolPanel title="Grid" bodyClassName="p-3 space-y-4">
      <FieldGrid>
        <SliderField label="Columns" value={columns} onChange={setColumns} min={1} max={12} />
        <SliderField label="Rows" value={rows} onChange={setRows} min={1} max={12} />
        <SliderField label="Column gap" value={columnGap} onChange={setColumnGap} min={0} max={64} format={(v) => `${v}px`} />
        <SliderField label="Row gap" value={rowGap} onChange={setRowGap} min={0} max={64} format={(v) => `${v}px`} />
      </FieldGrid>
      <SliderField label="Responsive min column width" value={minWidth} onChange={setMinWidth} min={0} max={400} step={10} format={(v) => (v ? `${v}px (auto-fit)` : "off")} />
      <Field label="Custom columns" hint="e.g. 200px 1fr 2fr — overrides the slider." htmlFor="ct">
        <Input id="ct" value={colTemplate} onChange={(e) => setColTemplate(e.target.value)} placeholder={`repeat(${columns}, 1fr)`} className="font-mono" />
      </Field>
      <Field label="Custom rows" htmlFor="rt">
        <Input id="rt" value={rowTemplate} onChange={(e) => setRowTemplate(e.target.value)} placeholder={`repeat(${rows}, 1fr)`} className="font-mono" />
      </Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="css-grid">
      <OptionsLayout options={options}>
        <ToolPanel title="Preview" bodyClassName="p-4 bg-dots">
          <div className="min-h-80" style={{ display: "grid", gridTemplateColumns: cols, gridTemplateRows: rowsT, columnGap, rowGap }}>
            {Array.from({ length: Math.min(count, 144) }, (_, i) => (
              <div key={i} className="min-h-12 rounded-md border border-primary/30 bg-accent text-accent-foreground text-xs font-medium flex items-center justify-center tabular-nums">
                {i + 1}
              </div>
            ))}
          </div>
        </ToolPanel>
        <CodeOutput
          tabs={[
            { id: "css", label: "CSS", code: css },
            { id: "tw", label: "Tailwind", code: tailwind },
            { id: "html", label: "HTML", code: html },
          ]}
        />
      </OptionsLayout>
    </ToolLayout>
  );
}
