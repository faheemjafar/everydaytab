"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { CopyButton, Field, Segmented, TextTransform, ToolPanel } from "@/components/tool";

type Mode = "encode" | "decode";
type Level = "essential" | "non-ascii" | "all";
type Style = "named" | "decimal" | "hex";

const NAMED: Record<string, string> = {
  "&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "apos", "\u00a0": "nbsp", "©": "copy", "®": "reg", "™": "trade", "€": "euro", "£": "pound", "¥": "yen", "¢": "cent",
  "§": "sect", "°": "deg", "±": "plusmn", "×": "times", "÷": "divide", "¼": "frac14", "½": "frac12", "¾": "frac34", "–": "ndash", "—": "mdash", "‘": "lsquo", "’": "rsquo",
  "“": "ldquo", "”": "rdquo", "…": "hellip", "•": "bull", "←": "larr", "→": "rarr", "↑": "uarr", "↓": "darr", "é": "eacute", "è": "egrave", "à": "agrave", "ü": "uuml", "ö": "ouml", "ä": "auml", "ñ": "ntilde", "ç": "ccedil", "ß": "szlig",
};

function encode(s: string, level: Level, style: Style) {
  return Array.from(s)
    .map((c) => {
      const cp = c.codePointAt(0)!;
      const essential = /[&<>"']/.test(c);
      const should = essential || (level === "non-ascii" && cp > 126) || (level === "all" && (cp > 126 || /[^\w\s]/.test(c)));
      if (!should) return c;
      if (style === "named" && NAMED[c]) return `&${NAMED[c]};`;
      return style === "hex" ? `&#x${cp.toString(16).toUpperCase()};` : `&#${cp};`;
    })
    .join("");
}

/**
 * Decodes each entity token with the browser's HTML parser (so all 2,000+
 * named entities work) while leaving the rest of the text untouched.
 */
function decode(s: string) {
  if (typeof document === "undefined") return s;
  const t = document.createElement("textarea");
  return s.replace(/&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);?/gi, (ent) => {
    t.innerHTML = ent;
    return t.value;
  });
}

const COMMON: [string, string][] = [["&amp;", "&"], ["&lt;", "<"], ["&gt;", ">"], ["&quot;", '"'], ["&apos;", "'"], ["&nbsp;", "non-breaking space"], ["&copy;", "©"], ["&reg;", "®"], ["&trade;", "™"], ["&euro;", "€"], ["&mdash;", "—"], ["&hellip;", "…"], ["&rarr;", "→"], ["&times;", "×"], ["&deg;", "°"], ["&hearts;", "♥"]];

export default function HTMLEntities() {
  const [mode, setMode] = useState<Mode>("encode");
  const [level, setLevel] = useState<Level>("essential");
  const [style, setStyle] = useState<Style>("named");
  const [input, setInput] = useState("");

  const output = useMemo(() => (!input ? "" : mode === "encode" ? encode(input, level, style) : decode(input)), [input, mode, level, style]);

  return (
    <ToolLayout toolId="html-entities">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        minHeight={220}
        sample={mode === "encode" ? `<a href="/café?x=1&y=2">Tom's “special” offer — 50% off → €9.99</a>` : "&lt;p&gt;Caf&eacute; &amp; cr&egrave;me &mdash; &#x1F600; &hearts;&lt;/p&gt;"}
        inputLabel={mode === "encode" ? "Text / HTML" : "Encoded"}
        outputLabel={mode === "encode" ? "Encoded" : "Decoded"}
        filename="entities.txt"
        options={
          <>
            <Segmented value={mode} onChange={(m) => { setMode(m); setInput(output); }} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
            <Button variant="ghost" size="icon" onClick={() => { setMode(mode === "encode" ? "decode" : "encode"); setInput(output); }} aria-label="Swap" title="Swap">
              <ArrowLeftRight />
            </Button>
            {mode === "encode" && (
              <>
                <Field label="Encode">
                  <Segmented size="sm" value={level} onChange={setLevel} options={[{ value: "essential", label: "& < > \" ' only" }, { value: "non-ascii", label: "+ non-ASCII" }, { value: "all", label: "+ all symbols" }]} />
                </Field>
                <Field label="Style">
                  <Segmented size="sm" value={style} onChange={setStyle} options={[{ value: "named", label: "&name;" }, { value: "decimal", label: "&#123;" }, { value: "hex", label: "&#x7B;" }]} />
                </Field>
              </>
            )}
          </>
        }
      >
        <ToolPanel title="Common entities">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-x divide-y divide-border">
            {COMMON.map(([e, c]) => (
              <div key={e} className="group flex items-center justify-between gap-1 px-2.5 py-1.5">
                <span className="text-sm">{c.length === 1 ? c : "␣"}</span>
                <code className="font-mono text-[11px] text-muted-foreground">{e}</code>
                <CopyButton text={e} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100 size-6" />
              </div>
            ))}
          </div>
        </ToolPanel>
      </TextTransform>
    </ToolLayout>
  );
}
