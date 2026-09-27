"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, OptionsLayout, SliderField, ToolPanel } from "@/components/tool";

const BASES = [
  { base: 2, name: "Binary", prefix: "0b", re: /^-?[01]+$/ },
  { base: 8, name: "Octal", prefix: "0o", re: /^-?[0-7]+$/ },
  { base: 10, name: "Decimal", prefix: "", re: /^-?\d+$/ },
  { base: 16, name: "Hexadecimal", prefix: "0x", re: /^-?[0-9a-f]+$/i },
  { base: 32, name: "Base 32", prefix: "", re: /^-?[0-9a-v]+$/i },
  { base: 36, name: "Base 36", prefix: "", re: /^-?[0-9a-z]+$/i },
];

const ZERO = BigInt(0);

/** Arbitrary-precision parse in any base 2–36. */
function parseBig(text: string, base: number): bigint | null {
  const t = text.trim().replace(/[\s_]/g, "").replace(/^(-?)0[bxo]/i, "$1").toLowerCase();
  if (!t || t === "-") return null;
  const neg = t.startsWith("-");
  let n = ZERO;
  for (const ch of neg ? t.slice(1) : t) {
    const d = parseInt(ch, 36);
    if (Number.isNaN(d) || d >= base) return null;
    n = n * BigInt(base) + BigInt(d);
  }
  return neg ? -n : n;
}

/** Groups digits (e.g. nibbles for binary) for readability. */
const group = (s: string, size: number) => (size ? s.replace(new RegExp(`\\B(?=(.{${size}})+(?!.))`, "g"), " ") : s);

export default function IntegerBaseConverter() {
  const [source, setSource] = useState<{ base: number; text: string }>({ base: 10, text: "255" });
  const [custom, setCustom] = useState(12);
  const value = parseBig(source.text, source.base);
  const invalid = source.text.trim() !== "" && value === null;

  const row = (base: number, name: string, prefix = "") => {
    const out = value === null ? "" : value.toString(base);
    const shown = base === source.base ? source.text : out;
    const grouped = base === 2 ? group(out, 4) : base === 16 ? group(out, 4) : base === 10 ? out.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : out;
    return (
      <div key={`${base}-${name}`} className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor={`b${base}${name}`} className="font-medium">
            {name} <span className="text-muted-foreground font-normal">base {base}</span>
          </label>
          <CopyButton text={prefix && out ? `${prefix}${out}` : out} iconOnly />
        </div>
        <Input
          id={`b${base}${name}`}
          value={shown}
          onChange={(e) => setSource({ base, text: e.target.value })}
          spellCheck={false}
          className="font-mono"
          aria-invalid={base === source.base && invalid ? true : undefined}
        />
        {base !== source.base && out.length > 6 && grouped !== out && <p className="text-[11px] font-mono text-muted-foreground break-all">{grouped}</p>}
      </div>
    );
  };

  const options = (
    <ToolPanel title="Info" bodyClassName="p-3 space-y-3 text-xs">
      {value !== null ? (
        <dl className="space-y-1.5">
          <div className="flex justify-between"><dt className="text-muted-foreground">Bits needed</dt><dd className="font-mono">{value === ZERO ? 1 : (value < ZERO ? -value : value).toString(2).length}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Fits in</dt><dd className="font-mono">{(() => { const b = (value < ZERO ? -value : value).toString(2).length + (value < ZERO ? 1 : 0); return b <= 8 ? "8-bit" : b <= 16 ? "16-bit" : b <= 32 ? "32-bit" : b <= 64 ? "64-bit" : `${b}-bit`; })()}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Digits (dec)</dt><dd className="font-mono">{value.toString().replace("-", "").length}</dd></div>
          {value >= BigInt(32) && value < BigInt(127) && <div className="flex justify-between"><dt className="text-muted-foreground">ASCII</dt><dd className="font-mono">{String.fromCharCode(Number(value))}</dd></div>}
        </dl>
      ) : (
        <p className="text-muted-foreground">Type a number in any field.</p>
      )}
      <p className="text-muted-foreground">Arbitrary precision — works for numbers far beyond 64-bit. Prefixes like 0x, 0b, 0o and spaces/underscores are accepted.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="integer-base-converter">
      <OptionsLayout options={options}>
        <ToolPanel bodyClassName="p-3.5 grid gap-4 sm:grid-cols-2">{BASES.map((b) => row(b.base, b.name, b.prefix))}</ToolPanel>
        {invalid && <p className="text-xs text-destructive px-0.5">Not a valid base-{source.base} integer.</p>}
        <ToolPanel title="Custom base" bodyClassName="p-3.5 grid gap-4 sm:grid-cols-2 items-end">
          <SliderField label="Base" value={custom} onChange={setCustom} min={2} max={36} />
          {row(custom, "Custom")}
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
