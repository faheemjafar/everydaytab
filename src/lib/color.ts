/** Colour helpers built on culori (parsing, formatting, gamut mapping, naming). */
import { colorsNamed, converter, differenceCiede2000, displayable, formatHex, formatHex8, formatHsl, formatRgb, nearest, parse, toGamut, wcagContrast, type Color } from "culori";

export const toRgb = converter("rgb");
export const toHsl = converter("hsl");
export const toHsv = converter("hsv");
export const toLab = converter("lab");
export const toLch = converter("lch");
export const toOklch = converter("oklch");
export const toOklab = converter("oklab");
export const toP3 = converter("p3");
const mapRgb = toGamut("rgb", "oklch");

export function parseColor(input: string): Color | undefined {
  const t = input.trim();
  if (!t) return undefined;
  // Accept bare hex without "#".
  return parse(/^[0-9a-f]{3,8}$/i.test(t) ? `#${t}` : t) ?? undefined;
}

/** Nearest sRGB colour (perceptual gamut mapping in OKLCH, not naive clipping). */
export const inGamut = (c: Color) => (displayable(c) ? c : mapRgb(c));
export const hex = (c: Color) => formatHex(inGamut(c));
export const hexA = (c: Color) => (c.alpha !== undefined && c.alpha < 1 ? formatHex8(inGamut(c)) : formatHex(inGamut(c)));

const r = (n: number | undefined, d = 0) => Number((n ?? 0).toFixed(d));

export function formats(c: Color): { id: string; label: string; value: string }[] {
  const g = inGamut(c);
  const rgb = toRgb(g);
  const hsl = toHsl(g);
  const hsv = toHsv(g);
  const lab = toLab(c);
  const lch = toLch(c);
  const ok = toOklch(c);
  const p3 = toP3(c);
  const a = c.alpha !== undefined && c.alpha < 1 ? ` / ${r(c.alpha, 2)}` : "";
  return [
    { id: "hex", label: "HEX", value: hexA(c) },
    { id: "rgb", label: "RGB", value: formatRgb(g) },
    { id: "hsl", label: "HSL", value: formatHsl(g) },
    { id: "hsv", label: "HSV / HSB", value: `hsv(${r(hsv.h ?? 0)} ${r((hsv.s ?? 0) * 100)}% ${r((hsv.v ?? 0) * 100)}%)` },
    { id: "oklch", label: "OKLCH", value: `oklch(${r(ok.l * 100, 1)}% ${r(ok.c, 3)} ${r(ok.h ?? 0, 1)}${a})` },
    { id: "oklab", label: "OKLab", value: (() => { const o = toOklab(c); return `oklab(${r(o.l * 100, 1)}% ${r(o.a, 3)} ${r(o.b, 3)}${a})`; })() },
    { id: "lab", label: "CIE Lab", value: `lab(${r(lab.l, 1)}% ${r(lab.a, 1)} ${r(lab.b, 1)}${a})` },
    { id: "lch", label: "CIE LCH", value: `lch(${r(lch.l, 1)}% ${r(lch.c, 1)} ${r(lch.h ?? 0, 1)}${a})` },
    { id: "p3", label: "Display P3", value: `color(display-p3 ${r(p3.r, 4)} ${r(p3.g, 4)} ${r(p3.b, 4)}${a})` },
    { id: "rgb-float", label: "RGB (0–1)", value: `${r(rgb.r, 4)}, ${r(rgb.g, 4)}, ${r(rgb.b, 4)}` },
    { id: "cmyk", label: "CMYK (naive)", value: (() => { const k = 1 - Math.max(rgb.r, rgb.g, rgb.b); const f = (x: number) => (k === 1 ? 0 : r(((1 - x - k) / (1 - k)) * 100)); return `cmyk(${f(rgb.r)}% ${f(rgb.g)}% ${f(rgb.b)}% ${r(k * 100)}%)`; })() },
    { id: "swift", label: "SwiftUI", value: `Color(red: ${r(rgb.r, 3)}, green: ${r(rgb.g, 3)}, blue: ${r(rgb.b, 3)})` },
    { id: "android", label: "Android", value: `0xFF${formatHex(g).slice(1).toUpperCase()}` },
  ];
}

const nearestNamed = nearest(Object.keys(colorsNamed), differenceCiede2000());
export function colorName(c: Color) {
  const [name] = nearestNamed(c, 1);
  return { name, exact: differenceCiede2000()(c, parse(name)!) < 0.5 };
}

export const contrast = (a: Color | string, b: Color | string) => wcagContrast(a, b);
export const readableText = (c: Color) => (wcagContrast(c, "#ffffff") >= wcagContrast(c, "#111111") ? "#ffffff" : "#111111");
export const deltaE = differenceCiede2000();
