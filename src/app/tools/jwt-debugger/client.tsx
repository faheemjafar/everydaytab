"use client";

import { useEffect, useMemo, useState } from "react";
import { SignJWT, decodeJwt, decodeProtectedHeader, importJWK, importPKCS8, importSPKI, importX509, jwtVerify, type JWTPayload } from "jose";
import { Check, ShieldAlert, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { ClearButton, CodeArea, CopyButton, Field, Segmented, SplitLayout, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";
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

function Decoder({ initialToken = "" }: { initialToken?: string }) {
  const mounted = useMounted();
  const [token, setToken] = useState(initialToken);
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
    <>
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
    </>
  );
}

const SIGN_ALGS = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "ES256", "ES384", "EdDSA"] as const;
type SignAlg = (typeof SIGN_ALGS)[number];

function Encoder({ onDecode }: { onDecode: (token: string) => void }) {
  const [alg, setAlg] = useState<SignAlg>("HS256");
  const [payload, setPayload] = useState('{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "role": "admin"\n}');
  const [key, setKey] = useState("");
  const [exp, setExp] = useState("1h");
  const [iat, setIat] = useState(true);
  const [out, setOut] = useState<{ sig: string; token: string; error: string | null }>({ sig: "", token: "", error: null });

  const sig = `${alg}|${payload}|${key}|${exp}|${iat}`;
  useEffect(() => {
    let alive = true;
    (async () => {
      let claims: Record<string, unknown>;
      try {
        claims = JSON.parse(payload);
      } catch (e) {
        return { error: `Payload is not valid JSON: ${(e as Error).message}` };
      }
      if (!key.trim()) return { error: alg.startsWith("HS") ? "Enter a secret to sign." : "Paste a private key (PKCS#8 PEM or JWK) to sign." };
      const k = alg.startsWith("HS") ? new TextEncoder().encode(key) : key.trim().startsWith("{") ? await importJWK(JSON.parse(key), alg) : await importPKCS8(key, alg);
      let j = new SignJWT(claims as JWTPayload).setProtectedHeader({ alg, typ: "JWT" });
      if (iat) j = j.setIssuedAt();
      if (exp) j = j.setExpirationTime(exp);
      return { token: await j.sign(k) };
    })()
      .then((r) => alive && setOut({ sig, token: r.token ?? "", error: r.error ?? null }))
      .catch((e) => alive && setOut({ sig, token: "", error: (e as Error).message }));
    return () => { alive = false; };
  }, [alg, payload, key, exp, iat, sig]);

  const res = out.sig === sig ? out : { token: "", error: null };
  const weak = alg.startsWith("HS") && key && new TextEncoder().encode(key).length < Number(alg.slice(2)) / 8;

  return (
    <SplitLayout>
      <div className="space-y-3">
        <ToolPanel title="Header" bodyClassName="p-3 space-y-3">
          <Field label="Algorithm"><Segmented size="sm" value={alg} onChange={setAlg} options={SIGN_ALGS.map((a) => ({ value: a, label: a }))} className="flex-wrap" /></Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Expires in" hint="e.g. 15m, 1h, 7d — blank for none" htmlFor="jexp"><Input id="jexp" value={exp} onChange={(e) => setExp(e.target.value)} className="w-28 font-mono" /></Field>
            <label className="inline-flex items-center gap-2 h-(--control-h) text-[13px]"><input type="checkbox" checked={iat} onChange={(e) => setIat(e.target.checked)} className="size-3.5 accent-primary" />Add iat</label>
          </div>
        </ToolPanel>
        <ToolPanel title="Payload (JSON)"><CodeArea value={payload} onChange={(e) => setPayload(e.target.value)} minHeight={180} /></ToolPanel>
        <ToolPanel title={alg.startsWith("HS") ? "Secret" : "Private key"} bodyClassName="p-3 space-y-1.5">
          {alg.startsWith("HS") ? (
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="your-256-bit-secret" className="font-mono" autoComplete="off" />
          ) : (
            <CodeArea value={key} onChange={(e) => setKey(e.target.value)} minHeight={110} placeholder={"-----BEGIN PRIVATE KEY-----\n… (PKCS#8) or a private JWK"} />
          )}
          {weak && <p className="text-xs text-amber-600 dark:text-amber-400">Secret is shorter than {Number(alg.slice(2)) / 8} bytes — too short for {alg} (RFC 7518 §3.2).</p>}
          {!alg.startsWith("HS") && <p className="text-[11px] text-muted-foreground">Need a key? Generate one with the RSA Key Generator (PKCS#8 output).</p>}
        </ToolPanel>
      </div>
      <div className="space-y-3">
        <ToolPanel title="Signed token" actions={<><CopyButton text={res.token} iconOnly /></>}>
          {res.token ? (
            <p className="px-3.5 py-3 font-mono text-[13px] break-all leading-relaxed">
              {res.token.split(".").map((p, i) => (
                <span key={i} className={["text-rose-600 dark:text-rose-400", "text-violet-600 dark:text-violet-400", "text-sky-600 dark:text-sky-400"][i]}>{i ? "." : ""}{p}</span>
              ))}
            </p>
          ) : (
            <p className="px-3.5 py-8 text-center text-xs text-muted-foreground">The signed JWT appears here.</p>
          )}
        </ToolPanel>
        {res.error && <ToolAlert tone="error">{res.error}</ToolAlert>}
        {res.token && <button type="button" onClick={() => onDecode(res.token)} className="text-xs text-primary hover:underline">Open in decoder →</button>}
        <p className="text-[11px] text-muted-foreground">Signed locally with WebCrypto via jose. For testing and development — issue production tokens from your server.</p>
      </div>
    </SplitLayout>
  );
}

export default function JWTDebugger() {
  const [tab, setTab] = useState<"decode" | "encode">("decode");
  const [seed, setSeed] = useState<{ token: string; n: number }>({ token: "", n: 0 });
  return (
    <ToolLayout toolId="jwt-debugger">
      <div className="space-y-3">
        <Segmented value={tab} onChange={setTab} options={[{ value: "decode", label: "Decode & verify" }, { value: "encode", label: "Encode & sign" }]} />
        {tab === "decode" ? <Decoder key={seed.n} initialToken={seed.token} /> : <Encoder onDecode={(t) => { setSeed((s) => ({ token: t, n: s.n + 1 })); setTab("decode"); }} />}
      </div>
    </ToolLayout>
  );
}
