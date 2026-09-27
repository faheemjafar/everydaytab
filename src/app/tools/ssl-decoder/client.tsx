"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ClearButton, CodeArea, CopyButton, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";
import { decodePem, type Decoded } from "@/lib/x509";

function Cert({ d, index, total, now }: { d: Decoded; index: number; total: number; now: number }) {
  const days = d.notAfter && now ? Math.floor((d.notAfter.getTime() - now) / 86400000) : null;
  const notYet = d.notBefore && now ? d.notBefore.getTime() > now : false;
  const status = d.kind === "csr" ? null : notYet ? { tone: "warning" as const, t: "Not yet valid" } : days === null ? null : days < 0 ? { tone: "error" as const, t: `Expired ${-days} days ago` } : days < 30 ? { tone: "warning" as const, t: `Expires in ${days} days` } : { tone: "success" as const, t: `Valid · ${days} days left` };
  const role = d.kind === "csr" ? "Certificate signing request" : d.selfSigned ? (d.ca ? "Root CA (self-signed)" : "Self-signed") : d.ca ? "Intermediate CA" : "Leaf certificate";
  const rows: [string, string][] = [
    ["Subject", d.subject.text],
    ...(d.issuer ? ([["Issuer", d.issuer.text]] as [string, string][]) : []),
    ...(d.notBefore ? ([["Valid from", d.notBefore.toUTCString()], ["Valid until", d.notAfter!.toUTCString()]] as [string, string][]) : []),
    ["Public key", `${d.key.type}${d.key.size ? ` ${d.key.size}-bit` : ""}${d.key.detail ? ` (${d.key.detail})` : ""}`],
    ["Signature", d.sigAlg],
    ...(d.serial ? ([["Serial", d.serial]] as [string, string][]) : []),
    ...(d.keyUsage.length ? ([["Key usage", d.keyUsage.join(", ")]] as [string, string][]) : []),
    ...(d.extKeyUsage.length ? ([["Extended usage", d.extKeyUsage.join(", ")]] as [string, string][]) : []),
    ...(d.ca !== undefined ? ([["Basic constraints", `CA: ${d.ca ? "yes" : "no"}${d.pathLen !== undefined ? `, path length ${d.pathLen}` : ""}`]] as [string, string][]) : []),
    ["SHA-256 fingerprint", d.sha256],
    ["SHA-1 fingerprint", d.sha1],
  ];
  const cn = d.subject.fields.find(([k]) => k === "CN")?.[1];
  return (
    <ToolPanel
      title={`${total > 1 ? `${index + 1}. ` : ""}${cn ?? d.subject.text}`}
      actions={<><StatusBadge>{role}</StatusBadge>{status && <StatusBadge tone={status.tone}>{status.t}</StatusBadge>}{d.key.type === "RSA" && d.key.size < 2048 && <StatusBadge tone="error">Weak key</StatusBadge>}{/sha1With/i.test(d.sigAlg) && <StatusBadge tone="error">SHA-1 signature</StatusBadge>}</>}
    >
      <dl className="divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="group flex items-start gap-3 px-3.5 py-2">
            <dt className="w-36 shrink-0 text-xs text-muted-foreground pt-0.5">{k}</dt>
            <dd className="flex-1 min-w-0 font-mono text-[12.5px] break-all">{v}</dd>
            <CopyButton text={v} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
          </div>
        ))}
        {d.san.length > 0 && (
          <div className="flex items-start gap-3 px-3.5 py-2">
            <dt className="w-36 shrink-0 text-xs text-muted-foreground pt-0.5">Subject alt names ({d.san.length})</dt>
            <dd className="flex-1 flex flex-wrap gap-1">{d.san.map((s) => <StatusBadge key={s}>{s}</StatusBadge>)}</dd>
          </div>
        )}
      </dl>
    </ToolPanel>
  );
}

export default function SSLDecoder() {
  const mounted = useMounted();
  const [now] = useState(() => Date.now());
  const [input, setInput] = useState("");
  const result = useMemo((): null | { error: string } | { certs: Decoded[] } => {
    if (!input.trim()) return null;
    try {
      return { certs: decodePem(input) };
    } catch (e) {
      return { error: (e as Error).message.includes("PEM") ? (e as Error).message : `Couldn't parse: ${(e as Error).message}` };
    }
  }, [input]);

  return (
    <ToolLayout toolId="ssl-decoder">
      <div className="space-y-3">
        <ToolPanel title="PEM certificate(s) or CSR" actions={<ClearButton onClick={() => setInput("")} iconOnly disabled={!input} />} footer={<span className="text-[11px] text-muted-foreground">Paste a full chain to decode every certificate. Get one with <code className="font-mono">openssl s_client -connect host:443 -showcerts</code>. Private keys are never needed.</span>}>
          <CodeArea value={input} onChange={(e) => setInput(e.target.value)} minHeight={180} placeholder={"-----BEGIN CERTIFICATE-----\nMIIF…\n-----END CERTIFICATE-----"} />
        </ToolPanel>
        {result && "error" in result && <ToolAlert tone="error">{result.error}</ToolAlert>}
        {result && "certs" in result && result.certs.map((d, i) => <Cert key={d.sha256} d={d} index={i} total={result.certs.length} now={mounted ? now : 0} />)}
        {/PRIVATE KEY/.test(input) && <ToolAlert tone="warning">This text contains a private key. It isn&apos;t sent anywhere, but avoid pasting private keys into websites in general.</ToolAlert>}
      </div>
    </ToolLayout>
  );
}
