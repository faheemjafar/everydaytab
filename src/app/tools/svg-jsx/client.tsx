"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: Figma -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" class="icon" style="fill: none; stroke-width: 2">
  <defs><linearGradient id="g"><stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>
  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="url(#g)" stroke-linecap="round" stroke-linejoin="round" fill-rule="evenodd"/>
  <use xlink:href="#g"/>
</svg>`;

// Attributes React keeps as-is (already valid, or data-/aria-).
const KEEP = /^(data-|aria-)/;
const SPECIAL: Record<string, string> = { class: "className", "xlink:href": "xlinkHref", "xml:space": "xmlSpace", "xmlns:xlink": "xmlnsXlink", "xml:lang": "xmlLang", for: "htmlFor", tabindex: "tabIndex" };
const camel = (a: string) => SPECIAL[a] ?? (KEEP.test(a) ? a : a.replace(/[:-](\w)/g, (_, c) => c.toUpperCase()));
const styleObj = (css: string) =>
  `{{ ${css
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const [k, ...v] = d.split(":");
      const val = v.join(":").trim();
      return `${k.trim().replace(/-(\w)/g, (_, c) => c.toUpperCase())}: ${/^-?\d+(\.\d+)?$/.test(val) ? val : JSON.stringify(val)}`;
    })
    .join(", ")} }}`;

type Opts = { name: string; ts: boolean; props: boolean; size: "keep" | "remove" | "1em"; current: boolean; memo: boolean; exportStyle: "named" | "default" };

function convert(svg: string, o: Opts) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const err = doc.querySelector("parsererror");
  if (err) throw new Error(err.textContent?.split("\n")[0] || "Invalid SVG");
  const root = doc.documentElement;
  if (root.nodeName.toLowerCase() !== "svg") throw new Error("Root element must be <svg>.");
  const render = (el: Element, depth: number): string => {
    const pad = "  ".repeat(depth);
    const attrs: string[] = [];
    for (const a of Array.from(el.attributes)) {
      if (el === root && (a.name === "xmlns:xlink" || a.name === "version" || a.name.startsWith("xmlns:") || (o.size !== "keep" && (a.name === "width" || a.name === "height")))) continue;
      let v = a.value;
      if (o.current && /^(fill|stroke)$/.test(a.name) && !/^(none|url\(|currentColor)/i.test(v)) v = "currentColor";
      attrs.push(a.name === "style" ? `style=${styleObj(v)}` : `${camel(a.name)}=${JSON.stringify(v)}`);
    }
    if (el === root) {
      if (o.size === "1em") attrs.push('width="1em"', 'height="1em"');
      if (o.props) attrs.push("{...props}");
    }
    const kids = Array.from(el.childNodes)
      .map((n) => (n.nodeType === 1 ? render(n as Element, depth + 1) : n.nodeType === 3 && n.textContent?.trim() ? `${pad}  {${JSON.stringify(n.textContent.trim())}}` : ""))
      .filter(Boolean);
    const multi = attrs.join(" ").length > 70;
    const open = `${pad}<${el.nodeName}${attrs.length ? (multi ? `\n${attrs.map((a) => `${pad}  ${a}`).join("\n")}\n${pad}` : ` ${attrs.join(" ")}`) : ""}`;
    return kids.length ? `${open}>\n${kids.join("\n")}\n${pad}</${el.nodeName}>` : `${open}${multi ? "" : " "}/>`;
  };
  const jsx = render(root, 1);
  const sig = o.props ? (o.ts ? "(props: SVGProps<SVGSVGElement>)" : "(props)") : "()";
  const imp = o.ts && o.props ? `import type { SVGProps } from "react";\n${o.memo ? 'import { memo } from "react";\n' : ""}\n` : o.memo ? 'import { memo } from "react";\n\n' : "";
  const body = `const ${o.name} = ${sig} => (\n${jsx}\n);`;
  const exp = o.exportStyle === "default" ? `\n\nexport default ${o.memo ? `memo(${o.name})` : o.name};` : "";
  return `${imp}${o.exportStyle === "named" ? "export " : ""}${o.memo && o.exportStyle === "named" ? body.replace(`const ${o.name} = `, `const ${o.name} = memo(`).replace(/\);$/, "));") : body}${exp}`;
}

export default function SVGToJSX() {
  const [input, setInput] = useState("");
  const [name, setName] = useState("Icon");
  const [ts, setTs] = useState(true);
  const [props, setProps] = useState(true);
  const [size, setSize] = useState<Opts["size"]>("keep");
  const [current, setCurrent] = useState(false);
  const [memo, setMemo] = useState(false);
  const [exportStyle, setExportStyle] = useState<Opts["exportStyle"]>("named");

  const { output, error } = useMemo(() => {
    if (!input.trim() || typeof DOMParser === "undefined") return { output: "", error: null };
    try {
      const comp = (name.replace(/[^\w]/g, "") || "Icon").replace(/^[a-z]/, (c) => c.toUpperCase());
      return { output: convert(input.replace(/<\?xml[^>]*>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>/g, "").trim(), { name: comp, ts, props, size, current, memo, exportStyle }), error: null };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input, name, ts, props, size, current, memo, exportStyle]);

  return (
    <ToolLayout toolId="svg-jsx">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLE}
        inputLabel="SVG"
        outputLabel={ts ? "React component (TSX)" : "React component (JSX)"}
        filename={`${name || "Icon"}.${ts ? "tsx" : "jsx"}`}
        options={
          <>
            <Field label="Component name" htmlFor="cn">
              <Input id="cn" value={name} onChange={(e) => setName(e.target.value)} className="w-32 font-mono" />
            </Field>
            <Field label="Size">
              <Segmented size="sm" value={size} onChange={setSize} options={[{ value: "keep", label: "Keep" }, { value: "1em", label: "1em (scales with text)" }, { value: "remove", label: "Remove" }]} />
            </Field>
            <Field label="Export">
              <Segmented size="sm" value={exportStyle} onChange={setExportStyle} options={[{ value: "named", label: "Named" }, { value: "default", label: "Default" }]} />
            </Field>
            <Toggle label="TypeScript" checked={ts} onChange={setTs} />
            <Toggle label="Spread props" checked={props} onChange={setProps} />
            <Toggle label="Colours → currentColor" checked={current} onChange={setCurrent} />
            <Toggle label="memo()" checked={memo} onChange={setMemo} />
          </>
        }
      />
    </ToolLayout>
  );
}
