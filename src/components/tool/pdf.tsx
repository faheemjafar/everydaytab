"use client";

import { useCallback, useState, type ReactNode } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./file-dropzone";
import { FileList, FileListItem, formatBytes } from "./file-list";
import { PrivacyNote, ToolAlert } from "./status";
import { ToolPanel } from "./tool-panel";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Triggers a browser download for bytes / a Blob. */
export function downloadFile(data: Uint8Array | Blob, filename: string, mime = "application/pdf") {
  const blob = data instanceof Blob ? data : new Blob([data.slice()], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** "report.pdf" + "rotated" → "report-rotated.pdf" */
export function suffixName(file: File | null, suffix: string, ext = "pdf") {
  const base = file?.name.replace(/\.[^.]+$/, "") || "document";
  return `${base}-${suffix}.${ext}`;
}

/**
 * Parses "1-3, 5, 8-" into sorted unique 1-based page numbers within [1, max].
 * Returns null when the input contains anything invalid.
 */
export function parsePageList(input: string, max: number): number[] | null {
  const out = new Set<number>();
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  for (const part of parts) {
    const m = part.match(/^(\d+)?\s*(-)?\s*(\d+)?$/);
    if (!m || (!m[1] && !m[3])) return null;
    const a = m[1] ? parseInt(m[1], 10) : 1;
    const b = m[2] ? (m[3] ? parseInt(m[3], 10) : max) : a;
    if (a < 1 || b > max || a > b) return null;
    for (let i = a; i <= b; i++) out.add(i);
  }
  return Array.from(out).sort((x, y) => x - y);
}

export type HAlign = "left" | "center" | "right";
export type VAlign = "top" | "bottom";

/** x/y for text of a given width so left/center/right alignment is exact. */
export function placeText(
  page: { width: number; height: number },
  textWidth: number,
  h: HAlign,
  v: VAlign,
  margin: number,
  fontSize: number
) {
  const x = h === "left" ? margin : h === "center" ? (page.width - textWidth) / 2 : page.width - margin - textWidth;
  const y = v === "top" ? page.height - margin - fontSize : margin;
  return { x, y };
}

/** Parses "#rrggbb" into pdf-lib's 0–1 channel values. */
export function hexToRgb01(hex: string) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

/** Six-position picker (top/bottom × left/center/right). */
export function PositionPicker({ value, onChange }: { value: `${VAlign}-${HAlign}`; onChange: (v: `${VAlign}-${HAlign}`) => void }) {
  const cells: `${VAlign}-${HAlign}`[] = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
  return (
    <div role="radiogroup" className="relative w-32 aspect-[3/4] rounded-md border border-border bg-card grid grid-cols-3 grid-rows-[auto_1fr_auto] p-1.5 gap-1">
      {cells.slice(0, 3).map((c) => (
        <PosCell key={c} active={value === c} onClick={() => onChange(c)} label={c} />
      ))}
      <div className="col-span-3 flex flex-col justify-center gap-1 px-2" aria-hidden>
        {[80, 95, 70, 90, 60].map((w, i) => (
          <span key={i} className="block h-1 rounded-full bg-muted" style={{ width: `${w}%` }} />
        ))}
      </div>
      {cells.slice(3).map((c) => (
        <PosCell key={c} active={value === c} onClick={() => onChange(c)} label={c} />
      ))}
    </div>
  );
}

function PosCell({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label.replace("-", " ")}
      title={label.replace("-", " ")}
      onClick={onClick}
      className={"h-5 rounded-sm transition-colors " + (active ? "bg-primary" : "bg-muted hover:bg-accent")}
    />
  );
}

/* ------------------------------------------------------------------ */
/* State hook                                                         */
/* ------------------------------------------------------------------ */

export interface PdfFileState {
  file: File | null;
  pageCount: number;
  error: string | null;
  busy: boolean;
  setError: (e: string | null) => void;
  load: (files: File[]) => Promise<void>;
  clear: () => void;
  /** Runs an async job with busy/error handling. */
  run: (job: () => Promise<void>, failMessage?: string) => Promise<void>;
}

/**
 * Single-PDF input state shared by most PDF tools.
 * `onLoaded` fires after a file is accepted (useful for resetting options).
 */
export function usePdfFile(onLoaded?: (file: File, pageCount: number) => void): PdfFileState {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        setError("Please choose a PDF file.");
        return;
      }
      setError(null);
      setFile(f);
      let count = 0;
      try {
        count = (await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true })).getPageCount();
      } catch {
        count = 0;
      }
      setPageCount(count);
      onLoaded?.(f, count);
    },
    [onLoaded]
  );

  const clear = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setError(null);
  }, []);

  const run = useCallback(async (job: () => Promise<void>, failMessage = "Something went wrong processing this PDF.") => {
    setBusy(true);
    setError(null);
    try {
      await job();
    } catch (e) {
      setError((e as Error)?.message || failMessage);
    } finally {
      setBusy(false);
    }
  }, []);

  return { file, pageCount, error, busy, setError, load, clear, run };
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

interface PdfToolProps {
  pdf: PdfFileState;
  /** Option controls, rendered inside the "Options" panel. */
  options?: ReactNode;
  optionsTitle?: string;
  /** Primary action. */
  action: {
    label: ReactNode;
    busyLabel?: ReactNode;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
  /** Content shown below options (previews, results). */
  children?: ReactNode;
  /** Info line in the options footer, next to the action. */
  footerInfo?: ReactNode;
  dropHint?: ReactNode;
}

/**
 * Standard layout for single-PDF tools:
 *   empty → large dropzone
 *   loaded → file row (replace / remove) → options panel with primary action → children
 */
export function PdfTool({ pdf, options, optionsTitle = "Options", action, children, footerInfo, dropHint }: PdfToolProps) {
  const { file, pageCount, error, busy, load, clear } = pdf;

  return (
    <div className="space-y-3">
      {!file ? (
        <FileDropzone
          onFiles={load}
          accept="application/pdf"
          icon={<FileText className="w-5 h-5" />}
          title="Drop a PDF here or click to browse"
          hint={dropHint ?? "Processed locally — the file never leaves your device."}
        />
      ) : (
        <>
          <FileList>
            <FileListItem
              name={file.name}
              meta={`${pageCount ? `${pageCount} page${pageCount === 1 ? "" : "s"} · ` : ""}${formatBytes(file.size)}`}
              icon={<FileText className="w-4 h-4" />}
              actions={
                <label className="inline-flex items-center h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">
                  Replace
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) load(Array.from(e.target.files));
                      e.target.value = "";
                    }}
                  />
                </label>
              }
              onRemove={clear}
            />
          </FileList>

          <ToolPanel
            title={options ? optionsTitle : undefined}
            bodyClassName={options ? "p-3.5 space-y-4" : undefined}
            footer={
              <>
                {footerInfo ?? <PrivacyNote />}
                <span className="flex-1" />
                <Button size="lg" onClick={action.onClick} disabled={busy || action.disabled}>
                  {busy ? <RefreshCw className="animate-spin" /> : action.icon}
                  {busy ? action.busyLabel ?? "Working…" : action.label}
                </Button>
              </>
            }
          >
            {options}
          </ToolPanel>

          {children}
        </>
      )}

      {error && (
        <ToolAlert tone="error" title="Couldn't process the PDF">
          {error}
        </ToolAlert>
      )}
    </div>
  );
}

/** [1,2,3,5,7,8] → "1-3, 5, 7-8" */
export function formatPageList(pages: number[]): string {
  const sorted = [...pages].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    while (i + 1 < sorted.length && sorted[i + 1] === sorted[i] + 1) i++;
    out.push(start === sorted[i] ? String(start) : `${start}-${sorted[i]}`);
  }
  return out.join(", ");
}

/**
 * Page selection: a range text field ("1-3, 5") kept in sync with a grid of
 * clickable page chips. `value` is the raw text so users can type freely.
 */
export function PagePicker({
  value,
  onChange,
  pageCount,
  tone = "primary",
  label = "Pages",
}: {
  value: string;
  onChange: (v: string) => void;
  pageCount: number;
  /** "destructive" tints selected chips red (e.g. pages to delete). */
  tone?: "primary" | "destructive";
  label?: string;
}) {
  const parsed = value.trim() ? parsePageList(value, pageCount) : [];
  const selected = new Set(parsed ?? []);
  const toggle = (n: number) => {
    const next = new Set(selected);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    onChange(formatPageList(Array.from(next)));
  };
  const activeCls = tone === "destructive" ? "bg-destructive text-white border-destructive line-through" : "bg-primary text-primary-foreground border-primary";

  return (
    <div className="space-y-2.5">
      <div className="flex items-end gap-2">
        <label className="flex-1 space-y-1.5">
          <span className="block text-xs font-medium">{label}</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`e.g. 1-3, 5, 8-${pageCount || 10}`}
            className="w-full h-(--control-h) rounded-md border border-input bg-transparent px-2.5 font-mono text-[13px] outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
            aria-invalid={parsed === null}
          />
        </label>
        <div className="flex items-center gap-1 pb-px">
          <button type="button" onClick={() => onChange(pageCount ? `1-${pageCount}` : "")} className="h-7 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            All
          </button>
          <button type="button" onClick={() => onChange(formatPageList(Array.from({ length: pageCount }, (_, i) => i + 1).filter((n) => n % 2 === 1)))} className="h-7 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            Odd
          </button>
          <button type="button" onClick={() => onChange(formatPageList(Array.from({ length: pageCount }, (_, i) => i + 1).filter((n) => n % 2 === 0)))} className="h-7 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            Even
          </button>
          <button type="button" onClick={() => onChange("")} className="h-7 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            None
          </button>
        </div>
      </div>
      {parsed === null && <p className="text-[11px] text-destructive">Use page numbers and ranges between 1 and {pageCount}, separated by commas.</p>}
      {pageCount > 0 && pageCount <= 400 && (
        <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto custom-scrollbar p-px">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => toggle(n)}
              aria-pressed={selected.has(n)}
              className={
                "w-9 h-8 rounded-sm border text-[11px] font-medium tabular-nums transition-colors " +
                (selected.has(n) ? activeCls : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted")
              }
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Large tile choice (used for positions, rotations, presets). */
export function ChoiceGrid<T extends string | number>({
  value,
  onChange,
  options,
  cols = 3,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode; hint?: ReactNode }[];
  cols?: 2 | 3 | 4 | 6;
}) {
  const colCls = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4", 6: "grid-cols-3 sm:grid-cols-6" }[cols];
  return (
    <div role="radiogroup" className={`grid gap-1.5 ${colCls}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={
              "flex flex-col items-center justify-center gap-1.5 rounded-md border px-2 py-2.5 text-xs font-medium transition-colors " +
              (active ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60")
            }
          >
            {o.icon}
            <span className="text-center leading-tight">{o.label}</span>
            {o.hint && <span className="text-[10.5px] font-normal text-muted-foreground leading-tight">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
