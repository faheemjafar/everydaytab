"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, DownloadButton, Field, OptionsLayout, PrivacyNote, Segmented, SliderField, StatusBadge, ToolPanel } from "@/components/tool";
import { randomBytes, randomString } from "@/lib/random";

type Kind = "hex" | "base64url" | "base64" | "alnum" | "base32" | "numeric";
const KINDS: Record<Kind, { label: string; hint: string; unit: "bytes" | "chars"; bitsPer: number }> = {
  hex: { label: "Hex", hint: "Lowercase 0–9a–f. Common for API keys and secrets.", unit: "bytes", bitsPer: 8 },
  base64url: { label: "Base64url", hint: "URL- and filename-safe (A–Z a–z 0–9 - _), no padding.", unit: "bytes", bitsPer: 8 },
  base64: { label: "Base64", hint: "Standard alphabet with + / and = padding.", unit: "bytes", bitsPer: 8 },
  alnum: { label: "Alphanumeric", hint: "A–Z a–z 0–9 — easy to copy, no symbols.", unit: "chars", bitsPer: Math.log2(62) },
  base32: { label: "Base32", hint: "A–Z 2–7 — case-insensitive, used by TOTP secrets.", unit: "chars", bitsPer: 5 },
  numeric: { label: "Numeric", hint: "Digits only — PINs and verification codes.", unit: "chars", bitsPer: Math.log2(10) },
};

function make(kind: Kind, size: number, prefix: string) {
  let t: string;
  if (kind === "hex") t = Array.from(randomBytes(size), (b) => b.toString(16).padStart(2, "0")).join("");
  else if (kind === "base64" || kind === "base64url") {
    const b64 = btoa(String.fromCharCode(...randomBytes(size)));
    t = kind === "base64" ? b64 : b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } else t = randomString(kind === "alnum" ? "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" : kind === "base32" ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567" : "0123456789", size);
  return prefix + t;
}

export default function TokenGenerator() {
  const [kind, setKind] = useState<Kind>("hex");
  const [size, setSize] = useState(32);
  const [count, setCount] = useState(5);
  const [prefix, setPrefix] = useState("");
  const [tokens, setTokens] = useState<string[]>([]);

  const generate = (k = kind, s = size) => setTokens(Array.from({ length: Math.max(1, Math.min(500, count)) }, () => make(k, s, prefix)));
  useEffect(() => {
    const t = setTimeout(() => generate(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bits = Math.round(size * KINDS[kind].bitsPer);

  const options = (
    <ToolPanel title="Token" bodyClassName="p-3 space-y-4" footer={<div className="w-full space-y-2"><Button size="lg" onClick={() => generate()} className="w-full"><RefreshCw /> Generate</Button><PrivacyNote>crypto.getRandomValues, generated in your browser.</PrivacyNote></div>}>
      <Field label="Encoding" hint={KINDS[kind].hint}>
        <Segmented size="sm" value={kind} onChange={(k) => { setKind(k); generate(k); }} options={(Object.keys(KINDS) as Kind[]).map((k) => ({ value: k, label: KINDS[k].label }))} className="flex-wrap" />
      </Field>
      <SliderField label={`Length (${KINDS[kind].unit})`} value={size} onChange={setSize} min={4} max={128} format={(v) => `${v} ${KINDS[kind].unit}`} />
      <p className="text-xs"><StatusBadge tone={bits >= 128 ? "success" : bits >= 64 ? "warning" : "error"}>{bits} bits of entropy</StatusBadge> <span className="text-muted-foreground">{bits >= 128 ? "strong enough for secrets" : bits >= 64 ? "fine for IDs, weak for secrets" : "only for short codes"}</span></p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Prefix" htmlFor="tp"><Input id="tp" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="sk_live_" className="font-mono" /></Field>
        <Field label="How many" htmlFor="tc"><Input id="tc" type="number" min={1} max={500} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} /></Field>
      </div>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="token-generator">
      <OptionsLayout options={options}>
        <ToolPanel title={`Tokens · ${tokens.length}`} actions={<><CopyButton text={tokens.join("\n")} label="Copy all" /><DownloadButton content={tokens.join("\n")} filename="tokens.txt" iconOnly /></>}>
          <ul className="divide-y divide-border max-h-[560px] overflow-y-auto custom-scrollbar">
            {tokens.map((t, i) => (
              <li key={i} className="group flex items-center gap-3 px-3.5 py-2">
                <code className="flex-1 font-mono text-[13px] break-all">{t}</code>
                <CopyButton text={t} iconOnly className="opacity-60 group-hover:opacity-100" />
              </li>
            ))}
          </ul>
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
