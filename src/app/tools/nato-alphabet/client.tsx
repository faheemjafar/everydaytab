"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Field, Segmented, TextTransform } from "@/components/tool";

const NATO: Record<string, string> = {
  A: "Alfa", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot", G: "Golf", H: "Hotel", I: "India", J: "Juliett", K: "Kilo", L: "Lima", M: "Mike",
  N: "November", O: "Oscar", P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango", U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee", Z: "Zulu",
  "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Niner",
  ".": "Stop", "-": "Dash", "@": "At", "/": "Slash", "_": "Underscore", "+": "Plus", "#": "Hash", "&": "And",
};
const REVERSE = Object.fromEntries(Object.entries(NATO).flatMap(([k, v]) => [[v.toUpperCase(), k], [v.toUpperCase().replace("-", ""), k]]));
REVERSE.ALPHA = "A";
REVERSE.JULIET = "J";
REVERSE.NINE = "9";

type Mode = "encode" | "decode";
type Layout = "inline" | "lines";

export default function TextToNATO() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [layout, setLayout] = useState<Layout>("inline");

  const output = useMemo(() => {
    if (mode === "decode")
      return input
        .split(/\s*(?:\/|\n)\s*/)
        .map((w) => w.split(/[\s,]+/).filter(Boolean).map((t) => REVERSE[t.toUpperCase()] ?? "").join(""))
        .join(" ");
    const words = input.trim().split(/\s+/).filter(Boolean);
    const spelled = words.map((w) => Array.from(w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()).map((c) => NATO[c] ?? c));
    return layout === "lines" ? words.map((w, i) => `${w}:\n${spelled[i].map((s, j) => `  ${Array.from(w)[j] ?? ""}  ${s}`).join("\n")}`).join("\n\n") : spelled.map((s) => s.join(" ")).join(" / ");
  }, [input, mode, layout]);

  return (
    <ToolLayout toolId="nato-alphabet">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        minHeight={200}
        sample={mode === "encode" ? "Booking ref KX7-42Q" : "Kilo X-ray Seven Dash Four Two Quebec"}
        filename="nato.txt"
        options={
          <>
            <Segmented
              value={mode}
              onChange={(m) => { setMode(m); setInput(output); }}
              options={[
                { value: "encode", label: "Text → NATO" },
                { value: "decode", label: "NATO → Text" },
              ]}
            />
            {mode === "encode" && (
              <Field label="Layout">
                <Segmented size="sm" value={layout} onChange={setLayout} options={[{ value: "inline", label: "One line" }, { value: "lines", label: "Letter per line" }]} />
              </Field>
            )}
            <p className="text-[11px] text-muted-foreground">ICAO/ITU spelling alphabet. Words are separated by “/”.</p>
          </>
        }
      />
    </ToolLayout>
  );
}
