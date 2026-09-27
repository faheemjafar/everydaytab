"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeJwt, decodeProtectedHeader, importJWK, importSPKI, importX509, jwtVerify, type JWTPayload } from "jose";
import { Check, ShieldAlert, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { ClearButton, CodeArea, CopyButton, Field, SplitLayout, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";
import { cn } from "@/lib/utils";

// Sample HS256 token, secret "your-256-bit-secret" (the jwt.io example).
const SAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const CLAIMS: Record<string, string> = {
  iss: "Issuer", sub: "Subject", aud: "Audience", exp: "Expires", nbf: "Not before", iat: "Issued at", jti: "JWT ID",
  scope: "Scope", azp: "Authorized party", email: "Email", name: "Name", roles: "Roles", sid: "Session ID", nonce: "Nonce",
};
const TIME = new Set(["exp", "nbf", "iat", "auth_time", "updated_at"]);

function rel(sec: number, now: number) {
  const d = sec - now / 1000;
  const a = Math.abs(d);
  const t = a < 60 ? `${Math.round(a)}s` : a < 3600 ? `${Math.round(a / 60)} min` : a < 86400 ? `${(a / 3600).toFixed(1)} h` : `${Math.round(a / 86400)} days`;
  return d >= 0 ? `in ${t}` : `${t} ago`;
}

type Verify = { state: "idle" } | { state: "ok" } | { state: "bad"; message: string };

async function verifyToken(token: string, alg: string, key: string): Promise<Verify> {
  if (!key.trim()) return { state: "idle" };
  try {
    let k: CryptoKey | Uint8Array;
    if (alg.startsWith("HS")) k = new TextEncoder().encode(key);
    else if (key.trim().startsWith("{")) k = (await importJWK(JSON.parse(key), alg)) as CryptoKey;
    else if (key.includes("BEGIN CERTIFICATE")) k = await importX509(key, alg);
    else k = await importSPKI(key, alg);
    await jwtVerify(token, k, { algorithms: [alg], clockTolerance: 1e9 }); // expiry reported separately
    return { state: "ok" };
  } catch (e) {
    const m = (e as Error).message;
    return { state: "bad", message: /signature/i.test(m) ? "Signature does not match this key." : m };
  }
}

export default function JWTDebugger() {
  const mounted = useMounted();
  const [token, setToken] = useState("");
  const [key, setKey] = useState("");
  const [verify, setVerify] = useState<{ for: string; v: Verify }>({ for: "", v: { state: "idle" } });

  const clean = token.trim().replace(/^Bearer\s+/i, "");
  type Decoded = { header: ReturnType<typeof decodeProtectedHeader>; payload: JWTPayload & Record<string, unknown>; parts: string[] } | { error: string } | null;
  const decoded = useMemo((): Decoded => {
    if (!clean) return null;
    try {
      const header = decodeProtectedHeader(clean);
      const payload = decodeJwt(clean) as JWTPayload & Record<string, unknown>;
      return { header, payload, parts: clean.split(".") };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [clean]);

  const alg = decoded && "header" in decoded ? String(decoded.header.alg ?? "") : "";
  const sig = `${clean}|${key}`;

  useEffect(() => {
    let alive = true;
    if (!alg || alg === "none") return;
    verifyToken(clean, alg, key).then((v) => alive && setVerify({ for: sig, v }));
    return () => {
      alive = false;
    };
  }, [clean, alg, key, sig]);

  const v: Verify = verify.for === sig ? verify.v : { state: "idle" };
  const [loadedAt] = useState(() => Date.now());
  const now = mounted ? loadedAt : 0;
  const p = decoded && "payload" in decoded ? decoded.payload : null;
  const expired = mounted && typeof p?.exp === "number" && p.exp * 1000 < now;
  const notYet = mounted && typeof p?.nbf === "number" && p.nbf * 1000 > now;

  return (
    <ToolLayout toolId="jwt-debugger">
      <div className="space-y-3">
        <SplitLayout>
          <div className="space-y-3">
            <ToolPanel
              title="Encoded token"
              actions={
                <>
                  {!token && <button type="button" onClick={() => { setToken(SAMPLE); setKey("your-256-bit-secret"); }} className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted">Sample</button>}
                  <ClearButton onClick={() => setToken("")} iconOnly disabled={!token} />
                </>
              }
            >
              {decoded && "parts" in decoded ? (
                <div className="relative">
                  <CodeArea value={token} onChange={(e) => setToken(e.target.value)} minHeight={200} className="text-transparent caret-foreground" />
                  {/* Colour-coded overlay: header · payload · signature */}
                  <pre aria-hidden className="pointer-events-none absolute inset-0 px-3.5 py-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all">
                    {token.match(/^\s*(Bearer\s+)?/i)?.[0]}
                    <span className="text-rose-600 dark:text-rose-400">{decoded.parts[0]}</span>.<span className="text-violet-600 dark:text-violet-400">{decoded.parts[1]}</span>.<span className="text-sky-600 dark:text-sky-400">{decoded.parts[2]}</span>
                  </pre>
                </div>
              ) : (
                <CodeArea value={token} onChange={(e) => setToken(e.target.value)} minHeight={200} placeholder="Paste a JWT (with or without “Bearer ”)…" />
              )}
            </ToolPanel>
            <ToolPanel title="Verify signature" bodyClassName="p-3 space-y-2">
              <Field label={alg.startsWith("HS") ? `Secret (${alg})` : alg ? `Public key for ${alg} — PEM, certificate or JWK` : "Secret or public key"} htmlFor="jwt-key">
                {alg.startsWith("HS") || !alg ? (
                  <Input id="jwt-key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="your-256-bit-secret" className="font-mono" />
                ) : (
                  <CodeArea id="jwt-key" value={key} onChange={(e) => setKey(e.target.value)} minHeight={90} placeholder={"-----BEGIN PUBLIC KEY-----\n…"} />
                )}
              </Field>
              {alg === "none" && <p className="text-xs text-destructive flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> alg “none” — this token is unsigned and must never be trusted.</p>}
              {v.state === "ok" && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Signature verified</p>}
              {v.state === "bad" && <p className="text-xs font-medium text-destructive flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> {v.message}</p>}
              <p className="text-[11px] text-muted-foreground">Verification runs locally with WebCrypto. Never paste production secrets into sites you don&apos;t trust — this one doesn&apos;t send them anywhere.</p>
            </ToolPanel>
          </div>

          <div className="space-y-3">
            {decoded && "header" in decoded && p && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge>{alg || "no alg"}</StatusBadge>
                  {typeof p.exp === "number" && <StatusBadge tone={expired ? "error" : "success"}>{expired ? "Expired" : "Not expired"}</StatusBadge>}
                  {notYet && <StatusBadge tone="warning">Not valid yet</StatusBadge>}
                  {v.state === "ok" && <StatusBadge tone="success">Signature valid</StatusBadge>}
                </div>
                <ToolPanel title={<span className="text-rose-600 dark:text-rose-400">Header</span>} actions={<CopyButton text={JSON.stringify(decoded.header, null, 2)} iconOnly />}>
                  <pre className="px-3.5 py-2.5 font-mono text-[12.5px] overflow-x-auto">{JSON.stringify(decoded.header, null, 2)}</pre>
                </ToolPanel>
                <ToolPanel title={<span className="text-violet-600 dark:text-violet-400">Payload</span>} actions={<CopyButton text={JSON.stringify(p, null, 2)} iconOnly />}>
                  <pre className="px-3.5 py-2.5 font-mono text-[12.5px] overflow-x-auto max-h-72 custom-scrollbar">{JSON.stringify(p, null, 2)}</pre>
                </ToolPanel>
                <ToolPanel title="Claims">
                  <dl className="divide-y divide-border">
                    {Object.entries(p).map(([k, val]) => (
                      <div key={k} className="flex items-start gap-3 px-3.5 py-2 text-[13px]">
                        <dt className="w-32 shrink-0">
                          <code className="font-mono text-xs">{k}</code>
                          {CLAIMS[k] && <span className="block text-[11px] text-muted-foreground">{CLAIMS[k]}</span>}
                        </dt>
                        <dd className={cn("flex-1 min-w-0 break-all font-mono text-xs", k === "exp" && expired && "text-destructive")}>
                          {TIME.has(k) && typeof val === "number" && mounted ? (
                            <>
                              {new Date(val * 1000).toLocaleString()} <span className="text-muted-foreground">({rel(val, now)})</span>
                            </>
                          ) : (
                            typeof val === "object" ? JSON.stringify(val) : String(val)
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </ToolPanel>
              </>
            )}
            {decoded && "error" in decoded && <ToolAlert tone="error" title="Not a valid JWT">{decoded.error}</ToolAlert>}
            {!decoded && <ToolPanel bodyClassName="px-4 py-10 text-center text-xs text-muted-foreground">Decoded header, payload and claims appear here.</ToolPanel>}
          </div>
        </SplitLayout>
      </div>
    </ToolLayout>
  );
}
