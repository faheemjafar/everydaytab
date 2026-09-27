"use client";

import { useEffect, useState } from "react";
import bcrypt from "bcryptjs";
import { Check, Hash, RefreshCw, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, Field, SliderField, SplitLayout, StatusBadge, ToolPanel } from "@/components/tool";

/** Splits a bcrypt hash into its parts: $2b$10$<22-char salt><31-char hash>. */
function anatomy(h: string) {
  const m = h.match(/^\$(2[abxy]?)\$(\d{2})\$(.{22})(.{31})$/);
  return m ? { version: m[1], cost: Number(m[2]), salt: m[3], hash: m[4] } : null;
}

export default function BcryptHash() {
  const [pw, setPw] = useState("");
  const [cost, setCost] = useState(12);
  const [result, setResult] = useState<{ hash: string; ms: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [vPw, setVPw] = useState("");
  const [vHash, setVHash] = useState("");
  const [verify, setVerify] = useState<{ key: string; ok: boolean | null; ms?: number }>({ key: "", ok: null });

  const hash = async () => {
    setBusy(true);
    const t0 = performance.now();
    // Async API yields to the event loop, so the page doesn't freeze at high cost factors.
    const h = await bcrypt.hash(pw, cost);
    setResult({ hash: h, ms: performance.now() - t0 });
    setBusy(false);
  };

  const vKey = `${vPw}|${vHash}`;
  useEffect(() => {
    if (!vPw || !anatomy(vHash.trim())) return;
    let alive = true;
    const t0 = performance.now();
    bcrypt.compare(vPw, vHash.trim()).then((ok) => alive && setVerify({ key: vKey, ok, ms: performance.now() - t0 }));
    return () => { alive = false; };
  }, [vPw, vHash, vKey]);

  const a = result ? anatomy(result.hash) : null;
  const byteLen = new TextEncoder().encode(pw).length;
  const vA = anatomy(vHash.trim());
  const v = verify.key === vKey ? verify.ok : null;

  return (
    <ToolLayout toolId="bcrypt">
      <SplitLayout>
        <ToolPanel
          title="Hash a password"
          bodyClassName="p-3.5 space-y-4"
          footer={
            <Button size="lg" onClick={hash} disabled={!pw || busy} className="w-full">
              {busy ? <RefreshCw className="animate-spin" /> : <Hash />} {busy ? `Hashing (cost ${cost})…` : "Generate hash"}
            </Button>
          }
        >
          <Field label="Password" htmlFor="bpw"><Input id="bpw" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" className="font-mono" /></Field>
          {byteLen > 72 && <p className="text-xs text-amber-600 dark:text-amber-400">bcrypt only uses the first 72 bytes — the rest ({byteLen - 72} bytes) is ignored.</p>}
          <SliderField label="Cost factor" value={cost} onChange={setCost} min={4} max={16} format={(v) => `${v} (2^${v} = ${(2 ** v).toLocaleString()} rounds)`} />
          <p className="text-[11px] text-muted-foreground">Each +1 doubles the time. Aim for ~250 ms per hash on your server; 12 is a common default today.</p>
          {result && a && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <code className="flex-1 font-mono text-[13px] break-all">
                  <span className="text-muted-foreground">${a.version}$</span><span className="text-sky-600 dark:text-sky-400">{String(a.cost).padStart(2, "0")}</span><span className="text-muted-foreground">$</span><span className="text-amber-600 dark:text-amber-400">{a.salt}</span><span className="text-emerald-600 dark:text-emerald-400">{a.hash}</span>
                </code>
                <CopyButton text={result.hash} iconOnly />
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <StatusBadge>version {a.version}</StatusBadge>
                <StatusBadge tone="info">cost {a.cost}</StatusBadge>
                <StatusBadge tone="warning">salt (random)</StatusBadge>
                <StatusBadge tone="success">hash</StatusBadge>
                <StatusBadge>{Math.round(result.ms)} ms in this browser</StatusBadge>
              </div>
            </div>
          )}
        </ToolPanel>

        <ToolPanel title="Verify" bodyClassName="p-3.5 space-y-4">
          <Field label="Password" htmlFor="vpw"><Input id="vpw" value={vPw} onChange={(e) => setVPw(e.target.value)} autoComplete="off" className="font-mono" /></Field>
          <Field label="bcrypt hash" htmlFor="vh"><Input id="vh" value={vHash} onChange={(e) => setVHash(e.target.value)} placeholder="$2b$12$…" className="font-mono" /></Field>
          {vHash.trim() && !vA && <p className="text-xs text-destructive">Not a valid bcrypt hash (expected 60 characters starting with $2a$, $2b$ or $2y$).</p>}
          {v !== null && (
            <p className={v ? "flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400" : "flex items-center gap-1.5 text-sm font-medium text-destructive"}>
              {v ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} {v ? "Password matches" : "Password does not match"}
            </p>
          )}
          {vA && <p className="text-[11px] text-muted-foreground">Cost {vA.cost} · version ${vA.version}$</p>}
        </ToolPanel>
      </SplitLayout>
    </ToolLayout>
  );
}
