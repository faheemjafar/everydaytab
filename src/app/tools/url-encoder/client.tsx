"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

type Mode = "encode" | "decode";
type Scope = "component" | "uri" | "form";

const SCOPES: Record<Scope, { label: string; hint: string }> = {
  component: { label: "Component", hint: "encodeURIComponent — for a single query value or path segment. Encodes / ? & = # too." },
  uri: { label: "Full URL", hint: "encodeURI — keeps : / ? & = # so the URL still works; encodes spaces and non-ASCII." },
  form: { label: "Form (+)", hint: "application/x-www-form-urlencoded — like Component, but spaces become +." },
};

function encode(s: string, scope: Scope) {
  if (scope === "uri") return encodeURI(s);
  const e = encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`); // RFC 3986 strict
  return scope === "form" ? e.replace(/%20/g, "+") : e;
}

function decode(s: string, scope: Scope, repeat: boolean) {
  let cur = scope === "form" ? s.replace(/\+/g, " ") : s;
  // Optionally unwrap double-encoded strings (%2520 → %20 → " ").
  for (let i = 0; i < (repeat ? 5 : 1); i++) {
    const next = scope === "uri" ? decodeURI(cur) : decodeURIComponent(cur);
    if (next === cur) break;
    cur = next;
  }
  return cur;
}

export default function URLEncoder() {
  const [mode, setMode] = useState<Mode>("encode");
  const [scope, setScope] = useState<Scope>("component");
  const [perLine, setPerLine] = useState(false);
  const [repeat, setRepeat] = useState(true);
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => {
    if (!input) return { output: "", error: null };
    try {
      const f = (s: string) => (mode === "encode" ? encode(s, scope) : decode(s, scope, repeat));
      return { output: perLine ? input.split("\n").map(f).join("\n") : f(input), error: null };
    } catch {
      return { output: "", error: "Malformed percent-encoding — a % must be followed by two hex digits (e.g. %20)." };
    }
  }, [input, mode, scope, perLine, repeat]);

  return (
    <ToolLayout toolId="url-encoder">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        minHeight={220}
        sample={mode === "encode" ? "https://example.com/search?q=café & crème&tag=a/b #1" : "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dcaf%C3%A9%20%26%20cr%C3%A8me"}
        inputLabel={mode === "encode" ? "Text" : "Encoded"}
        outputLabel={mode === "encode" ? "Encoded" : "Decoded"}
        filename="url.txt"
        options={
          <>
            <Segmented value={mode} onChange={(m) => { setMode(m); setInput(output); }} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
            <Button variant="ghost" size="icon" onClick={() => { setMode(mode === "encode" ? "decode" : "encode"); setInput(output); }} aria-label="Swap" title="Swap">
              <ArrowLeftRight />
            </Button>
            <Field label="Scope" hint={SCOPES[scope].hint}>
              <Segmented size="sm" value={scope} onChange={setScope} options={(Object.keys(SCOPES) as Scope[]).map((s) => ({ value: s, label: SCOPES[s].label }))} />
            </Field>
            <Toggle label="Each line separately" checked={perLine} onChange={setPerLine} />
            {mode === "decode" && <Toggle label="Unwrap double encoding" checked={repeat} onChange={setRepeat} />}
          </>
        }
      />
    </ToolLayout>
  );
}
