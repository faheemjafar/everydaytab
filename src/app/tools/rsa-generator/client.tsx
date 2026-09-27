"use client";

import { useState } from "react";
import { KeyRound, RefreshCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, DownloadButton, Field, OptionsLayout, PrivacyNote, Segmented, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";

type Size = "2048" | "3072" | "4096";
type Use = "RSA-OAEP" | "RSASSA-PKCS1-v1_5" | "RSA-PSS";

const USES: Record<Use, { label: string; usages: KeyUsage[]; hint: string }> = {
  "RSASSA-PKCS1-v1_5": { label: "Signing (RS256)", usages: ["sign", "verify"], hint: "JWT RS256, SSH, code signing" },
  "RSA-PSS": { label: "Signing (PS256)", usages: ["sign", "verify"], hint: "Modern signature padding" },
  "RSA-OAEP": { label: "Encryption (OAEP)", usages: ["encrypt", "decrypt"], hint: "Encrypting small secrets" },
};

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const pem = (label: string, der: ArrayBuffer) => `-----BEGIN ${label}-----\n${b64(der).match(/.{1,64}/g)!.join("\n")}\n-----END ${label}-----\n`;
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** OpenSSH "ssh-rsa AAAA…" public key from the JWK modulus/exponent (RFC 4253 wire format). */
function sshPublicKey(jwk: JsonWebKey, comment: string) {
  const mpint = (b: Uint8Array) => (b[0] & 0x80 ? Uint8Array.of(0, ...b) : b);
  const field = (b: Uint8Array) => { const out = new Uint8Array(4 + b.length); new DataView(out.buffer).setUint32(0, b.length); out.set(b, 4); return out; };
  const parts = [field(new TextEncoder().encode("ssh-rsa")), field(mpint(fromB64url(jwk.e!))), field(mpint(fromB64url(jwk.n!)))];
  const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { all.set(p, o); o += p.length; }
  return `ssh-rsa ${b64(all)}${comment ? ` ${comment}` : ""}`;
}

async function fingerprint(spki: ArrayBuffer) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", spki));
  return Array.from(h, (b) => b.toString(16).padStart(2, "0")).join(":");
}

interface Keys { publicPem: string; privatePem: string; ssh: string; jwkPublic: string; jwkPrivate: string; fp: string; ms: number }

export default function RSAKeyGenerator() {
  const [size, setSize] = useState<Size>("2048");
  const [use, setUse] = useState<Use>("RSASSA-PKCS1-v1_5");
  const [comment, setComment] = useState("");
  const [keys, setKeys] = useState<Keys | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    const t0 = performance.now();
    try {
      // WebCrypto generates keys off the main thread, so the page stays responsive.
      const pair = await crypto.subtle.generateKey({ name: use, modulusLength: Number(size), publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, USES[use].usages);
      const [spki, pkcs8, jwkPub, jwkPriv] = await Promise.all([
        crypto.subtle.exportKey("spki", pair.publicKey),
        crypto.subtle.exportKey("pkcs8", pair.privateKey),
        crypto.subtle.exportKey("jwk", pair.publicKey),
        crypto.subtle.exportKey("jwk", pair.privateKey),
      ]);
      setKeys({
        publicPem: pem("PUBLIC KEY", spki),
        privatePem: pem("PRIVATE KEY", pkcs8),
        ssh: sshPublicKey(jwkPub, comment.trim()),
        jwkPublic: JSON.stringify(jwkPub, null, 2),
        jwkPrivate: JSON.stringify(jwkPriv, null, 2),
        fp: await fingerprint(spki),
        ms: performance.now() - t0,
      });
    } catch (e) {
      setError((e as Error).message || "Key generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const options = (
    <ToolPanel
      title="Key"
      bodyClassName="p-3 space-y-3"
      footer={
        <div className="w-full space-y-2">
          <Button size="lg" onClick={generate} disabled={busy} className="w-full">
            {busy ? <RefreshCw className="animate-spin" /> : <KeyRound />} {busy ? "Generating…" : keys ? "Generate new pair" : "Generate key pair"}
          </Button>
          <PrivacyNote>Generated with WebCrypto in this tab — never sent anywhere.</PrivacyNote>
        </div>
      }
    >
      <Field label="Key size" hint={size === "2048" ? "Minimum recommended today." : size === "3072" ? "Good through 2030+ (NIST)." : "Strongest; slower to generate and use."}>
        <Segmented value={size} onChange={setSize} options={[{ value: "2048", label: "2048" }, { value: "3072", label: "3072" }, { value: "4096", label: "4096" }]} />
      </Field>
      <Field label="Algorithm" hint={USES[use].hint}>
        <Segmented size="sm" value={use} onChange={setUse} options={(Object.keys(USES) as Use[]).map((u) => ({ value: u, label: USES[u].label }))} className="flex-wrap" />
      </Field>
      <Field label="SSH comment" htmlFor="cm">
        <Input id="cm" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="you@laptop" />
      </Field>
    </ToolPanel>
  );

  const block = (title: string, value: string, file: string, secret = false) => (
    <ToolPanel title={title} actions={<>{secret && <StatusBadge tone="warning">keep secret</StatusBadge>}<CopyButton text={value} iconOnly /><DownloadButton content={value} filename={file} mime="text/plain" iconOnly /></>}>
      <pre className="px-3.5 py-2.5 font-mono text-[11.5px] leading-snug break-all whitespace-pre-wrap max-h-56 overflow-auto custom-scrollbar">{value}</pre>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="rsa-generator">
      <OptionsLayout options={options}>
        {error && <ToolAlert tone="error">{error}</ToolAlert>}
        {keys ? (
          <>
            <p className="text-[11px] text-muted-foreground font-mono break-all">SPKI SHA-256 {keys.fp} · generated in {Math.round(keys.ms)} ms</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {block("Public key (PEM, SPKI)", keys.publicPem, "public.pem")}
              {block("Private key (PEM, PKCS#8)", keys.privatePem, "private.pem", true)}
            </div>
            {block("OpenSSH public key (authorized_keys)", keys.ssh, "id_rsa.pub")}
            <div className="grid gap-3 lg:grid-cols-2">
              {block("Public JWK", keys.jwkPublic, "public.jwk.json")}
              {block("Private JWK", keys.jwkPrivate, "private.jwk.json", true)}
            </div>
            <p className="text-[11px] text-muted-foreground">For SSH logins prefer Ed25519 (<code className="font-mono">ssh-keygen -t ed25519</code>) and generate keys on the machine that will use them.</p>
          </>
        ) : (
          <ToolPanel bodyClassName="px-4 py-12 text-center text-sm text-muted-foreground">Choose a size and generate a key pair. Output includes PEM, OpenSSH and JWK formats.</ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
