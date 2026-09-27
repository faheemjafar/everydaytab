"use client";

import { useMemo, useState } from "react";
import CryptoJS from "crypto-js";
import { Check, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CodeArea, CopyButton, Field, OptionsLayout, Segmented, StatusBadge, ToolPanel } from "@/components/tool";

const ALGOS = { SHA256: CryptoJS.HmacSHA256, SHA512: CryptoJS.HmacSHA512, SHA384: CryptoJS.HmacSHA384, SHA224: CryptoJS.HmacSHA224, SHA1: CryptoJS.HmacSHA1, MD5: CryptoJS.HmacMD5, "SHA3-512": CryptoJS.HmacSHA3 } as const;
type Algo = keyof typeof ALGOS;
type KeyEnc = "utf8" | "hex" | "base64";

const parseKey = (k: string, e: KeyEnc) => (e === "hex" ? CryptoJS.enc.Hex.parse(k.replace(/\s|^0x/g, "")) : e === "base64" ? CryptoJS.enc.Base64.parse(k.trim()) : CryptoJS.enc.Utf8.parse(k));

export default function HMACGenerator() {
  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  const [keyEnc, setKeyEnc] = useState<KeyEnc>("utf8");
  const [algo, setAlgo] = useState<Algo>("SHA256");
  const [expected, setExpected] = useState("");

  const out = useMemo(() => {
    if (!secret) return null;
    try {
      const mac = ALGOS[algo](CryptoJS.enc.Utf8.parse(message), parseKey(secret, keyEnc));
      return { hex: mac.toString(CryptoJS.enc.Hex), b64: mac.toString(CryptoJS.enc.Base64) };
    } catch {
      return null;
    }
  }, [message, secret, keyEnc, algo]);

  // Accepts "sha256=abc…" (GitHub), plain hex or base64 (Shopify/Slack style).
  const want = expected.trim().replace(/^(sha\d+|v\d+)=/i, "");
  const match = want && out ? want.toLowerCase() === out.hex || want === out.b64 : null;

  const options = (
    <ToolPanel title="Settings" bodyClassName="p-3 space-y-3">
      <Field label="Algorithm"><Segmented size="sm" value={algo} onChange={setAlgo} options={(Object.keys(ALGOS) as Algo[]).map((a) => ({ value: a, label: a }))} className="flex-wrap" /></Field>
      <Field label="Secret key" htmlFor="sk"><Input id="sk" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="whsec_… or your shared secret" className="font-mono" autoComplete="off" /></Field>
      <Field label="Key encoding"><Segmented size="sm" value={keyEnc} onChange={setKeyEnc} options={[{ value: "utf8", label: "Text" }, { value: "hex", label: "Hex" }, { value: "base64", label: "Base64" }]} /></Field>
      <p className="text-[11px] text-muted-foreground">Webhook signatures (GitHub, Stripe, Shopify, Slack) are HMAC-SHA256 of the raw request body — paste the body exactly as received.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="hmac-generator">
      <OptionsLayout options={options}>
        <ToolPanel title="Message">
          <CodeArea value={message} onChange={(e) => setMessage(e.target.value)} minHeight={160} placeholder='{"event":"payment.succeeded"}' />
        </ToolPanel>
        <ToolPanel title={`HMAC-${algo}`}>
          {out ? (
            <dl className="divide-y divide-border">
              {[["Hex", out.hex], ["Base64", out.b64]].map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 px-3.5 py-2.5">
                  <dt className="w-16 text-xs text-muted-foreground">{k}</dt>
                  <dd className="flex-1 font-mono text-[13px] break-all">{v}</dd>
                  <CopyButton text={v} iconOnly />
                </div>
              ))}
            </dl>
          ) : (
            <p className="px-3.5 py-6 text-center text-xs text-muted-foreground">Enter a secret key to compute the HMAC.</p>
          )}
        </ToolPanel>
        <ToolPanel title="Verify a signature" bodyClassName="p-3 space-y-1.5">
          <Input value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Paste the signature header value (e.g. sha256=…)" className="font-mono" />
          {match !== null && (
            <p className={match ? "flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400" : "flex items-center gap-1.5 text-xs font-medium text-destructive"}>
              {match ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} {match ? "Signature matches" : "Signature does not match — check the secret, algorithm and exact body"}
            </p>
          )}
          {out && <StatusBadge>{out.hex.length * 4}-bit MAC</StatusBadge>}
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
