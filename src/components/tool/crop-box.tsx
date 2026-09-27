"use client";

import { useRef, type ReactNode } from "react";

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Handle = "move" | "nw" | "ne" | "sw" | "se";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Largest centred rect of aspect `r` inside W×H (80% of the frame if free). */
export function initialCrop(W: number, H: number, r: number | null): CropRect {
  if (!r) return { x: Math.round(W * 0.1), y: Math.round(H * 0.1), w: Math.round(W * 0.8), h: Math.round(H * 0.8) };
  let w = W;
  let h = w / r;
  if (h > H) {
    h = H;
    w = h * r;
  }
  return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w: Math.round(w), h: Math.round(h) };
}

/** Clamp and (optionally) re-apply the aspect ratio after a numeric edit. */
export function fitCrop(r: CropRect, W: number, H: number, ratio: number | null, changed?: keyof CropRect, even = false): CropRect {
  const n = { ...r };
  if (ratio && changed === "w") n.h = Math.round(n.w / ratio);
  if (ratio && changed === "h") n.w = Math.round(n.h * ratio);
  n.w = clamp(n.w, 2, W);
  n.h = clamp(n.h, 2, H);
  if (even) {
    n.w -= n.w % 2;
    n.h -= n.h % 2;
  }
  n.x = clamp(Math.round(n.x), 0, W - n.w);
  n.y = clamp(Math.round(n.y), 0, H - n.h);
  return n;
}

/**
 * Draggable/resizable crop rectangle over any media element. Coordinates are
 * in the media's natural pixels; `children` is the media, stretched to fill.
 */
export function CropBox({
  width: W,
  height: H,
  rect,
  onChange,
  ratio,
  children,
  maxHeight = "60vh",
}: {
  width: number;
  height: number;
  rect: CropRect;
  onChange: (r: CropRect) => void;
  ratio: number | null;
  children: ReactNode;
  maxHeight?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: Handle; start: CropRect; px: number; py: number } | null>(null);

  const startDrag = (e: React.PointerEvent, handle: Handle) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { handle, start: rect, px: e.clientX, py: e.clientY };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const stage = stageRef.current;
    if (!d || !stage) return;
    const scale = W / stage.clientWidth;
    const dx = (e.clientX - d.px) * scale;
    const dy = (e.clientY - d.py) * scale;
    const s = d.start;
    if (d.handle === "move") {
      onChange({ ...s, x: Math.round(clamp(s.x + dx, 0, W - s.w)), y: Math.round(clamp(s.y + dy, 0, H - s.h)) });
      return;
    }
    const left = d.handle.includes("w");
    const top = d.handle.includes("n");
    const maxW = left ? s.x + s.w : W - s.x;
    const maxH = top ? s.y + s.h : H - s.y;
    let w = clamp(s.w + (left ? -dx : dx), 8, maxW);
    let h = clamp(s.h + (top ? -dy : dy), 8, maxH);
    if (ratio) {
      if (Math.abs(dx) > Math.abs(dy)) h = w / ratio;
      else w = h * ratio;
      if (w > maxW) {
        w = maxW;
        h = w / ratio;
      }
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }
    }
    onChange({ x: Math.round(left ? s.x + s.w - w : s.x), y: Math.round(top ? s.y + s.h - h : s.y), w: Math.round(w), h: Math.round(h) });
  };

  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div className="flex items-center justify-center p-4 bg-muted/40">
      <div
        ref={stageRef}
        className="relative select-none touch-none max-w-full"
        style={{ aspectRatio: `${W} / ${H}`, maxHeight, width: `min(100%, calc(${maxHeight} * ${W / H}))` }}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
      >
        <div className="absolute inset-0 [&>*]:w-full [&>*]:h-full [&>*]:object-contain">{children}</div>
        <div
          className="absolute border border-white cursor-move"
          style={{ left: pct(rect.x, W), top: pct(rect.y, H), width: pct(rect.w, W), height: pct(rect.h, H), boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)" }}
          onPointerDown={(e) => startDrag(e, "move")}
        >
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="border-white/30 border-r border-b [&:nth-child(3n)]:border-r-0 [&:nth-child(n+7)]:border-b-0" />
            ))}
          </div>
          {(["nw", "ne", "sw", "se"] as const).map((h) => (
            <span
              key={h}
              onPointerDown={(e) => startDrag(e, h)}
              className="absolute w-3.5 h-3.5 bg-white border border-stone-400 rounded-xs"
              style={{
                left: h.includes("w") ? -7 : undefined,
                right: h.includes("e") ? -7 : undefined,
                top: h.includes("n") ? -7 : undefined,
                bottom: h.includes("s") ? -7 : undefined,
                cursor: h === "nw" || h === "se" ? "nwse-resize" : "nesw-resize",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
