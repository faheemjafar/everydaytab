"use client";

import { useState } from "react";
import { Plus, Trash2, Type } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, PdfTool, PositionPicker, ToolPanel, downloadFile, placeText, suffixName, usePdfFile, type HAlign, type VAlign } from "@/components/tool";

type LabelStyle = "decimal" | "roman" | "roman-upper" | "letters" | "letters-upper";

interface LabelRule {
  id: string;
  pageRange: string;
  style: LabelStyle;
  prefix: string;
  startValue: number;
}

function toRoman(num: number): string {
  const roman: Record<string, number> = {
    M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90,
    L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1,
  };
  let result = "";
  for (const [letter, value] of Object.entries(roman)) {
    while (num >= value) {
      result += letter;
      num -= value;
    }
  }
  return result;
}

function toLetters(num: number): string {
  let result = "";
  while (num > 0) {
    num--;
    result = String.fromCharCode(97 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

function formatLabel(num: number, style: LabelStyle): string {
  switch (style) {
    case "roman": return toRoman(num);
    case "roman-upper": return toRoman(num).toUpperCase();
    case "letters": return toLetters(num);
    case "letters-upper": return toLetters(num).toUpperCase();
    default: return String(num);
  }
}

function parsePageRange(range: string, maxPages: number): number[] {
  if (!range.trim()) {
    return Array.from({ length: maxPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  const parts = range.split(/,\s*/);
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end && i <= maxPages; i++) pages.add(i);
    } else if (part.toLowerCase() === "odd") {
      for (let i = 1; i <= maxPages; i += 2) pages.add(i);
    } else if (part.toLowerCase() === "even") {
      for (let i = 2; i <= maxPages; i += 2) pages.add(i);
    } else {
      const n = Number(part);
      if (n > 0 && n <= maxPages) pages.add(n);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

let ruleCounter = 0;
function createRule(overrides: Partial<LabelRule> = {}): LabelRule {
  ruleCounter++;
  return {
    id: `rule-${ruleCounter}`,
    pageRange: "",
    style: "decimal",
    prefix: "",
    startValue: 1,
    ...overrides,
  };
}

const STYLES: { value: LabelStyle; label: string }[] = [
  { value: "decimal", label: "1, 2, 3" },
  { value: "roman", label: "i, ii, iii" },
  { value: "roman-upper", label: "I, II, III" },
  { value: "letters", label: "a, b, c" },
  { value: "letters-upper", label: "A, B, C" },
];

/** Label for each page (1-based) given the rules; first matching rule wins. */
function computeLabels(rules: LabelRule[], pageCount: number): string[] {
  const ranges = rules.map((r) => parsePageRange(r.pageRange, pageCount));
  return Array.from({ length: pageCount }, (_, i) => {
    const n = i + 1;
    for (let k = 0; k < rules.length; k++) {
      const idx = ranges[k].indexOf(n);
      if (idx >= 0) return rules[k].prefix + formatLabel(rules[k].startValue + idx, rules[k].style);
    }
    return "";
  });
}

export default function AddPageLabels() {
  const [rules, setRules] = useState<LabelRule[]>(() => [createRule({ pageRange: "1-4", style: "roman" }), createRule({ pageRange: "5-" })]);
  const [position, setPosition] = useState<`${VAlign}-${HAlign}`>("bottom-right");
  const [fontSize, setFontSize] = useState(10);
  const pdf = usePdfFile();
  const { pageCount } = pdf;

  const addRule = () => setRules((prev) => [...prev, createRule()]);
  const removeRule = (id: string) => setRules((prev) => prev.filter((r) => r.id !== id));
  const updateRule = (id: string, updates: Partial<LabelRule>) => setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));

  // "5-" means "5 to the end".
  const normalized = rules.map((r) => ({ ...r, pageRange: r.pageRange.replace(/(\d+)-\s*(,|$)/g, `$1-${pageCount}$2`) }));
  const labels = pageCount ? computeLabels(normalized, pageCount) : [];

  const applyLabels = () =>
    pdf.run(async () => {
      if (!pdf.file || !pageCount) return;
      const doc = await PDFDocument.load(await pdf.file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const [v, h] = position.split("-") as [VAlign, HAlign];
      doc.getPages().forEach((page, i) => {
        const label = labels[i];
        if (!label) return;
        const { x, y } = placeText(page.getSize(), font.widthOfTextAtSize(label, fontSize), h, v, 24, fontSize);
        page.drawText(label, { x, y, font, size: fontSize, color: rgb(0.45, 0.45, 0.45) });
      });
      downloadFile(await doc.save(), suffixName(pdf.file, "labeled"));
    }, "Failed to add page labels.");

  return (
    <ToolLayout toolId="add-page-labels">
      <PdfTool
        pdf={pdf}
        options={
          <div className="flex flex-col md:flex-row gap-5">
            <Field label="Position">
              <PositionPicker value={position} onChange={setPosition} />
            </Field>
            <div className="flex-1 space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Rules apply top to bottom; the first rule that covers a page wins. Ranges like <code className="font-mono">1-4</code>, <code className="font-mono">5-</code> (to the end), <code className="font-mono">odd</code>, <code className="font-mono">even</code>. Leave blank for all pages.
              </p>
              <Field label="Font size" inline>
                <Input type="number" min={6} max={24} value={fontSize} onChange={(e) => setFontSize(Math.min(24, Math.max(6, Number(e.target.value) || 10)))} className="w-20" />
              </Field>
            </div>
          </div>
        }
        action={{ label: "Add labels", busyLabel: "Labelling…", icon: <Type />, onClick: applyLabels, disabled: !labels.some(Boolean) }}
      >
        <ToolPanel
          title="Rules"
          footer={
            <Button variant="outline" size="sm" onClick={addRule}>
              <Plus /> Add rule
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {rules.map((rule, i) => (
              <li key={rule.id} className="grid grid-cols-[auto_1fr_1fr] sm:grid-cols-[auto_1fr_150px_1fr_90px_auto] items-end gap-2 px-3 py-2.5">
                <span className="w-5 pb-2 text-[11px] text-muted-foreground tabular-nums text-right">{i + 1}</span>
                <Field label="Pages">
                  <Input value={rule.pageRange} onChange={(e) => updateRule(rule.id, { pageRange: e.target.value })} placeholder="all" className="font-mono" />
                </Field>
                <Field label="Style">
                  <select
                    value={rule.style}
                    onChange={(e) => updateRule(rule.id, { style: e.target.value as LabelStyle })}
                    className="h-(--control-h) w-full rounded-md border border-input bg-transparent px-2 text-xs dark:bg-input/30"
                  >
                    {STYLES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Prefix">
                  <Input value={rule.prefix} onChange={(e) => updateRule(rule.id, { prefix: e.target.value })} placeholder="e.g. A-" />
                </Field>
                <Field label="Start at">
                  <Input type="number" min={1} value={rule.startValue} onChange={(e) => updateRule(rule.id, { startValue: Math.max(1, Number(e.target.value) || 1) })} />
                </Field>
                <Button variant="ghost" size="icon" onClick={() => removeRule(rule.id)} disabled={rules.length === 1} aria-label="Remove rule" className="text-muted-foreground hover:text-destructive">
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </ToolPanel>

        {labels.length > 0 && (
          <ToolPanel title="Preview" bodyClassName="p-3">
            <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto custom-scrollbar">
              {labels.map((l, i) => (
                <span key={i} className="inline-flex flex-col items-center justify-center w-12 h-11 rounded-sm border border-border bg-card text-[11px]">
                  <span className="text-muted-foreground tabular-nums">p.{i + 1}</span>
                  <span className="font-medium truncate max-w-11">{l || "—"}</span>
                </span>
              ))}
            </div>
          </ToolPanel>
        )}
      </PdfTool>
    </ToolLayout>
  );
}
