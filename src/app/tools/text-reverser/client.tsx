"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Field, Segmented, TextTransform } from "@/components/tool";

type Mode = "chars" | "words-letters" | "word-order" | "lines" | "upside-down" | "mirror";

// Grapheme-aware so emoji, flags and accented letters don't get split apart.
const seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
const graphemes = (s: string) => (seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s));
const rev = (s: string) => graphemes(s).reverse().join("");

const FLIP: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
  A: "∀", B: "ᗺ", C: "Ɔ", D: "ᗡ", E: "Ǝ", F: "Ⅎ", G: "⅁", H: "H", I: "I", J: "ſ", K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ", Q: "Ό", R: "ᴚ", S: "S", T: "⊥", U: "∩", V: "Λ", W: "M", X: "X", Y: "⅄", Z: "Z",
  "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9", "7": "ㄥ", "8": "8", "9": "6", "0": "0",
  ".": "˙", ",": "'", "'": ",", '"': "„", "?": "¿", "!": "¡", "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<", _: "‾", "&": "⅋",
};
const MIRROR: Record<string, string> = { b: "d", d: "b", p: "q", q: "p", "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<", "/": "\\", "\\": "/" };

const MODES: Record<Mode, { label: string; fn: (s: string) => string }> = {
  chars: { label: "Whole text", fn: rev },
  "words-letters": { label: "Letters in each word", fn: (s) => s.replace(/\S+/g, rev) },
  "word-order": { label: "Word order", fn: (s) => s.split("\n").map((l) => l.split(/(\s+)/).reverse().join("")).join("\n") },
  lines: { label: "Line order", fn: (s) => s.split("\n").reverse().join("\n") },
  "upside-down": { label: "Upside down", fn: (s) => graphemes(s).reverse().map((c) => FLIP[c] ?? c).join("") },
  mirror: { label: "Mirror", fn: (s) => s.split("\n").map((l) => graphemes(l).reverse().map((c) => MIRROR[c] ?? c).join("")).join("\n") },
};

export default function TextReverser() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("chars");
  const output = useMemo(() => MODES[mode].fn(input), [input, mode]);

  return (
    <ToolLayout toolId="text-reverser">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        sample={"Hello World 👋🏽\nThe quick brown fox\nLine three"}
        filename="reversed.txt"
        options={
          <Field label="Reverse">
            <Segmented size="sm" value={mode} onChange={setMode} options={(Object.keys(MODES) as Mode[]).map((m) => ({ value: m, label: MODES[m].label }))} />
          </Field>
        }
      />
    </ToolLayout>
  );
}
