"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { TextTransform, Toggle } from "@/components/tool";

const numeronym = (w: string) => {
  const c = Array.from(w);
  return c.length <= 3 ? w : `${c[0]}${c.length - 2}${c[c.length - 1]}`;
};

const FAMOUS = ["internationalization", "localization", "accessibility", "Kubernetes", "Andreessen Horowitz", "interoperability", "observability"];

export default function NumeronymGenerator() {
  const [input, setInput] = useState("");
  const [wholeLine, setWholeLine] = useState(false);
  const [lower, setLower] = useState(true);

  const output = useMemo(
    () =>
      input
        .split("\n")
        .map((l) => {
          const t = lower ? l.toLowerCase() : l;
          // Word mode keeps punctuation and spacing; line mode ignores spaces (e.g. "a16z").
          return wholeLine ? numeronym(t.replace(/\s+/g, "")) : t.replace(/[\p{L}\p{N}]+/gu, numeronym);
        })
        .join("\n"),
    [input, wholeLine, lower]
  );

  return (
    <ToolLayout toolId="numeronym">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        minHeight={180}
        sample={FAMOUS.join("\n")}
        filename="numeronyms.txt"
        options={
          <>
            <Toggle label="Treat each line as one word" checked={wholeLine} onChange={setWholeLine} hint="Andreessen Horowitz → a16z" />
            <Toggle label="Lowercase" checked={lower} onChange={setLower} />
            <p className="text-[11px] text-muted-foreground">First letter + number of letters in between + last letter: i18n, l10n, a11y, k8s.</p>
          </>
        }
      />
    </ToolLayout>
  );
}
