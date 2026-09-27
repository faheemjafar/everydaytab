"use client";

import { useState } from "react";
import { differenceCie76, differenceCie94, differenceEuclidean } from "culori";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ColorField, OptionsLayout, StatusBadge, ToolPanel } from "@/components/tool";
import { contrast, deltaE, hex, parseColor } from "@/lib/color";

function verdict(d: number) {
  if (d < 1) return { t: "Not perceptible", tone: "success" as const };
  if (d < 2) return { t: "Perceptible on close inspection", tone: "success" as const };
  if (d < 3.5) return { t: "Perceptible at a glance", tone: "warning" as const };
  if (d < 5) return { t: "Clearly different", tone: "warning" as const };
  return { t: "Different colours", tone: "error" as const };
}

export default function ColorDistance() {
  const [a, setA] = useState("#0d9488");
  const [b, setB] = useState("#14a394");
  const ca = parseColor(a);
  const cb = parseColor(b);
  const ok = ca && cb;
  const d2000 = ok ? deltaE(ca, cb) : 0;
  const v = verdict(d2000);

  const rows: [string, string, string][] = ok
    ? [
        ["ΔE 2000 (CIEDE2000)", d2000.toFixed(2), "Current industry standard; best match to human perception"],
        ["ΔE 94", differenceCie94()(ca, cb).toFixed(2), "Graphic arts / textiles"],
        ["ΔE 76 (Lab distance)", differenceCie76()(ca, cb).toFixed(2), "Simple Euclidean distance in CIE Lab"],
        ["OKLab distance", (differenceEuclidean("oklab")(ca, cb) * 100).toFixed(2), "Euclidean in OKLab (×100)"],
        ["RGB distance", differenceEuclidean("rgb")(ca, cb).toFixed(4), "Naive sRGB distance (0–√3) — poor perceptual match"],
        ["Contrast ratio", `${contrast(ca, cb).toFixed(2)}:1`, "WCAG luminance contrast between the two"],
      ]
    : [];

  return (
    <ToolLayout toolId="color-distance">
      <OptionsLayout
        options={
          <ToolPanel title="Colours" bodyClassName="p-3 space-y-3">
            <ColorField label="Colour 1" value={a} onChange={setA} />
            <Button variant="ghost" size="sm" onClick={() => { setA(b); setB(a); }}><ArrowLeftRight /> Swap</Button>
            <ColorField label="Colour 2" value={b} onChange={setB} />
            <p className="text-[11px] text-muted-foreground">Useful for brand-colour QA, checking print proofs, or deciding whether two “different” colours in a design system are really distinguishable.</p>
          </ToolPanel>
        }
      >
        {ok && (
          <>
            <ToolPanel bodyClassName="p-0">
              <div className="grid grid-cols-2 h-36">
                <div className="flex items-end p-3 font-mono text-xs" style={{ background: hex(ca), color: "#fff", textShadow: "0 0 3px #0008" }}>{hex(ca)}</div>
                <div className="flex items-end p-3 font-mono text-xs" style={{ background: hex(cb), color: "#fff", textShadow: "0 0 3px #0008" }}>{hex(cb)}</div>
              </div>
              <div className="flex items-center gap-3 px-3.5 py-3 border-t border-border">
                <span className="text-3xl font-semibold tabular-nums">ΔE {d2000.toFixed(2)}</span>
                <StatusBadge tone={v.tone}>{v.t}</StatusBadge>
              </div>
            </ToolPanel>
            <ToolPanel title="All metrics">
              <dl className="divide-y divide-border">
                {rows.map(([k, val, hint]) => (
                  <div key={k} className="flex items-center gap-3 px-3.5 py-2">
                    <dt className="w-44 shrink-0 text-[13px]">{k}</dt>
                    <dd className="w-24 font-mono text-[13px] tabular-nums">{val}</dd>
                    <span className="flex-1 text-xs text-muted-foreground hidden sm:block">{hint}</span>
                  </div>
                ))}
              </dl>
            </ToolPanel>
          </>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
