"use client";

import { useEffect, useState } from "react";
import figlet from "figlet";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, DownloadButton, Field, OptionsLayout, Segmented, SliderField, StatusBadge, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

// Fonts load on demand (each is a separate chunk) instead of shipping them all up front.
const FONTS: Record<string, () => Promise<{ default: string }>> = {
  "Standard": () => import("figlet/importable-fonts/Standard.js"),
  "Slant": () => import("figlet/importable-fonts/Slant.js"),
  "Small": () => import("figlet/importable-fonts/Small.js"),
  "Big": () => import("figlet/importable-fonts/Big.js"),
  "Banner3": () => import("figlet/importable-fonts/Banner3.js"),
  "Doom": () => import("figlet/importable-fonts/Doom.js"),
  "Ogre": () => import("figlet/importable-fonts/Ogre.js"),
  "Shadow": () => import("figlet/importable-fonts/Shadow.js"),
  "Small Slant": () => import("figlet/importable-fonts/Small Slant.js"),
  "Colossal": () => import("figlet/importable-fonts/Colossal.js"),
  "Graffiti": () => import("figlet/importable-fonts/Graffiti.js"),
  "Epic": () => import("figlet/importable-fonts/Epic.js"),
  "Isometric1": () => import("figlet/importable-fonts/Isometric1.js"),
  "Larry 3D": () => import("figlet/importable-fonts/Larry 3D.js"),
  "Star Wars": () => import("figlet/importable-fonts/Star Wars.js"),
  "ANSI Shadow": () => import("figlet/importable-fonts/ANSI Shadow.js"),
  "ANSI Regular": () => import("figlet/importable-fonts/ANSI Regular.js"),
  "Bloody": () => import("figlet/importable-fonts/Bloody.js"),
  "Calvin S": () => import("figlet/importable-fonts/Calvin S.js"),
  "Rectangles": () => import("figlet/importable-fonts/Rectangles.js"),
  "Script": () => import("figlet/importable-fonts/Script.js"),
  "Block": () => import("figlet/importable-fonts/Block.js"),
  "Bubble": () => import("figlet/importable-fonts/Bubble.js"),
  "Mini": () => import("figlet/importable-fonts/Mini.js"),
  "Digital": () => import("figlet/importable-fonts/Digital.js"),
  "3D-ASCII": () => import("figlet/importable-fonts/3D-ASCII.js"),
  "Speed": () => import("figlet/importable-fonts/Speed.js"),
  "Georgia11": () => import("figlet/importable-fonts/Georgia11.js"),
  "Univers": () => import("figlet/importable-fonts/Univers.js"),
  "Roman": () => import("figlet/importable-fonts/Roman.js"),
};
type FontName = keyof typeof FONTS;
type Wrap = "none" | "slash" | "hash" | "block" | "html";

const loaded = new Set<string>();
async function ensure(name: string) {
  if (loaded.has(name)) return;
  const mod = await FONTS[name]();
  figlet.parseFont(name as figlet.Fonts, mod.default);
  loaded.add(name);
}
const draw = (text: string, font: string, width: number) => figlet.textSync(text, { font: font as figlet.Fonts, width, whitespaceBreak: true }).replace(/\s+$/gm, "");

function wrap(art: string, w: Wrap) {
  const lines = art.split("\n");
  if (w === "slash") return lines.map((l) => `// ${l}`).join("\n");
  if (w === "hash") return lines.map((l) => `# ${l}`).join("\n");
  if (w === "block") return `/*\n${lines.map((l) => ` * ${l}`).join("\n")}\n */`;
  if (w === "html") return `<!--\n${art}\n-->`;
  return art;
}

export default function ASCIITextDrawer() {
  const [text, setText] = useState("Hello");
  const [font, setFont] = useState<FontName>("Standard");
  const [width, setWidth] = useState(100);
  const [comment, setComment] = useState<Wrap>("none");
  const [art, setArt] = useState<{ key: string; value: string }>({ key: "", value: "" });
  const [gallery, setGallery] = useState<Record<string, string>>({});
  const [showGallery, setShowGallery] = useState(false);

  const key = `${text}|${font}|${width}`;
  useEffect(() => {
    let alive = true;
    ensure(font).then(() => alive && setArt({ key, value: text ? draw(text, font, width) : "" }));
    return () => { alive = false; };
  }, [text, font, width, key]);

  // Gallery: render the current text in every font (loads fonts lazily, once).
  useEffect(() => {
    if (!showGallery) return;
    let alive = true;
    const sample = (text || "Abc").slice(0, 12);
    Promise.all(Object.keys(FONTS).map(async (f) => { await ensure(f); return [f, draw(sample, f, 200)] as const; })).then((r) => alive && setGallery(Object.fromEntries(r)));
    return () => { alive = false; };
  }, [showGallery, text]);

  const out = art.key === key ? wrap(art.value, comment) : "";
  const widest = out ? Math.max(...out.split("\n").map((l) => l.length)) : 0;

  const options = (
    <ToolPanel title="Options" bodyClassName="p-3 space-y-4">
      <Field label="Text" htmlFor="at"><Input id="at" value={text} onChange={(e) => setText(e.target.value)} maxLength={80} autoFocus /></Field>
      <Field label="Font" htmlFor="af">
        <select id="af" value={font} onChange={(e) => setFont(e.target.value as FontName)} className="h-(--control-h) w-full rounded-md border border-input bg-card px-2 text-sm dark:bg-input/30">
          {Object.keys(FONTS).map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </Field>
      <SliderField label="Max width" value={width} onChange={setWidth} min={40} max={200} step={10} format={(v) => `${v} columns`} />
      <Field label="Wrap as comment">
        <Segmented size="sm" value={comment} onChange={setComment} options={[{ value: "none", label: "None" }, { value: "slash", label: "//" }, { value: "hash", label: "#" }, { value: "block", label: "/* */" }, { value: "html", label: "<!-- -->" }]} className="flex-wrap" />
      </Field>
      <p className="text-[11px] text-muted-foreground">Handy for README headers, CLI splash screens and source-file banners.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="ascii-text-drawer">
      <OptionsLayout options={options}>
        <ToolPanel
          title={font}
          actions={<>{widest > 0 && <StatusBadge>{widest} × {out.split("\n").length}</StatusBadge>}<CopyButton text={out} label="Copy" /><DownloadButton content={out} filename="ascii-art.txt" iconOnly /></>}
        >
          <pre className="p-4 font-mono text-[12px] leading-[1.15] overflow-x-auto custom-scrollbar min-h-40 whitespace-pre">{out || " "}</pre>
        </ToolPanel>
        <ToolPanel title="All fonts" actions={<button type="button" onClick={() => setShowGallery((s) => !s)} className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted">{showGallery ? "Hide" : "Preview every font"}</button>}>
          {showGallery && (
            <div className="grid gap-px bg-border lg:grid-cols-2">
              {Object.keys(FONTS).map((f) => (
                <button key={f} type="button" onClick={() => setFont(f as FontName)} className={cn("text-left bg-card p-3 hover:bg-muted/60 overflow-hidden", f === font && "bg-accent/40")}>
                  <p className="text-[11px] text-muted-foreground mb-1">{f}</p>
                  <pre className="font-mono text-[9px] leading-[1.1] overflow-hidden whitespace-pre">{gallery[f] ?? "…"}</pre>
                </button>
              ))}
            </div>
          )}
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
