"use client";

import { useEffect, useMemo, useState } from "react";
import * as OTPAuth from "otpauth";
import { QRCodeSVG } from "qrcode.react";
import { Check, Dices, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, Field, OptionsLayout, Segmented, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

type Algo = "SHA1" | "SHA256" | "SHA512";
type Kind = "totp" | "hotp";

const newSecret = () => new OTPAuth.Secret({ size: 20 }).base32;

export default function OTPGenerator() {
  const mounted = useMounted();
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const [issuer, setIssuer] = useState("EverydayTab");
  const [label, setLabel] = useState("user@example.com");
  const [kind, setKind] = useState<Kind>("totp");
  const [algo, setAlgo] = useState<Algo>("SHA1");
  const [digits, setDigits] = useState<"6" | "8">("6");
  const [period, setPeriod] = useState<"30" | "60">("30");
  const [counter, setCounter] = useState(0);
  const [uri, setUri] = useState("");
  const [check, setCheck] = useState("");
  const [now, setNow] = useState(0);

  // Tick once a second for the countdown (client only).
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const otp = useMemo(() => {
    try {
      const s = OTPAuth.Secret.fromBase32(secret.replace(/[\s-]/g, "").toUpperCase());
      const common = { issuer, label, algorithm: algo, digits: Number(digits), secret: s };
      return { ok: true as const, o: kind === "totp" ? new OTPAuth.TOTP({ ...common, period: Number(period) }) : new OTPAuth.HOTP({ ...common, counter }) };
    } catch {
      return { ok: false as const };
    }
  }, [secret, issuer, label, algo, digits, period, kind, counter]);

  const p = Number(period);
  const left = p - (Math.floor(now / 1000) % p);
  const code = mounted && otp.ok ? (otp.o instanceof OTPAuth.TOTP ? otp.o.generate({ timestamp: now }) : otp.o.generate({ counter })) : "";
  const next = mounted && otp.ok && otp.o instanceof OTPAuth.TOTP ? otp.o.generate({ timestamp: now + p * 1000 }) : "";
  const verified = check.length >= 6 && otp.ok ? (otp.o instanceof OTPAuth.TOTP ? otp.o.validate({ token: check, timestamp: now, window: 1 }) : otp.o.validate({ token: check, counter, window: 5 })) : undefined;
  const uriStr = otp.ok ? otp.o.toString() : "";

  const importUri = (s: string) => {
    setUri(s);
    try {
      const o = OTPAuth.URI.parse(s.trim());
      setSecret(o.secret.base32);
      setIssuer(o.issuer);
      setLabel(o.label);
      setAlgo(o.algorithm as Algo);
      setDigits(String(o.digits) as "6" | "8");
      if (o instanceof OTPAuth.TOTP) { setKind("totp"); setPeriod(String(o.period) as "30" | "60"); } else { setKind("hotp"); setCounter(o.counter); }
    } catch {
      /* keep typing */
    }
  };

  const fmt = (c: string) => (c.length === 8 ? `${c.slice(0, 4)} ${c.slice(4)}` : `${c.slice(0, 3)} ${c.slice(3)}`);

  const options = (
    <ToolPanel title="Account" bodyClassName="p-3 space-y-3">
      <Field label="Secret (Base32)" htmlFor="sec">
        <div className="flex gap-1">
          <Input id="sec" value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono uppercase" spellCheck={false} autoComplete="off" />
          <Button variant="outline" size="icon" onClick={() => setSecret(newSecret())} aria-label="Random secret" title="Generate a random 160-bit secret"><Dices /></Button>
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Issuer" htmlFor="iss"><Input id="iss" value={issuer} onChange={(e) => setIssuer(e.target.value)} /></Field>
        <Field label="Account" htmlFor="lbl"><Input id="lbl" value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
      </div>
      <Field label="Type"><Segmented size="sm" value={kind} onChange={setKind} options={[{ value: "totp", label: "TOTP (time)" }, { value: "hotp", label: "HOTP (counter)" }]} /></Field>
      <Field label="Algorithm" hint={algo !== "SHA1" ? "Many authenticator apps only support SHA1." : undefined}><Segmented size="sm" value={algo} onChange={setAlgo} options={[{ value: "SHA1", label: "SHA1" }, { value: "SHA256", label: "SHA256" }, { value: "SHA512", label: "SHA512" }]} /></Field>
      <div className="flex gap-4">
        <Field label="Digits"><Segmented size="sm" value={digits} onChange={setDigits} options={[{ value: "6", label: "6" }, { value: "8", label: "8" }]} /></Field>
        {kind === "totp" ? (
          <Field label="Period"><Segmented size="sm" value={period} onChange={setPeriod} options={[{ value: "30", label: "30 s" }, { value: "60", label: "60 s" }]} /></Field>
        ) : (
          <Field label="Counter" htmlFor="ctr"><Input id="ctr" type="number" min={0} value={counter} onChange={(e) => setCounter(Math.max(0, Number(e.target.value) || 0))} className="w-24" /></Field>
        )}
      </div>
      <Field label="Or import an otpauth:// URI" htmlFor="uri"><Input id="uri" value={uri} onChange={(e) => importUri(e.target.value)} placeholder="otpauth://totp/…" className="font-mono" /></Field>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="otp-generator">
      <OptionsLayout options={options}>
        {!otp.ok ? (
          <ToolAlert tone="error">Invalid Base32 secret — use letters A–Z and digits 2–7.</ToolAlert>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <ToolPanel title="Current code" actions={<CopyButton text={code} iconOnly />} bodyClassName="p-5 space-y-3">
                <p className="font-mono text-5xl font-semibold tracking-wider tabular-nums">{code ? fmt(code) : "••• •••"}</p>
                {kind === "totp" ? (
                  <>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className={left <= 5 ? "h-full bg-red-500 transition-[width] duration-1000 ease-linear" : "h-full bg-primary transition-[width] duration-1000 ease-linear"} style={{ width: `${(left / p) * 100}%` }} /></div>
                    <p className="text-xs text-muted-foreground tabular-nums">Refreshes in {mounted ? left : p}s · next {next ? fmt(next) : ""}</p>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setCounter((c) => c + 1)}>Next counter ({counter + 1})</Button>
                )}
              </ToolPanel>
              <ToolPanel title="Scan with an authenticator" bodyClassName="p-3 flex justify-center bg-white">
                <QRCodeSVG value={uriStr} size={168} marginSize={1} />
              </ToolPanel>
            </div>
            <ToolPanel title="otpauth:// URI" actions={<CopyButton text={uriStr} iconOnly />}>
              <p className="px-3.5 py-2.5 font-mono text-[12px] break-all">{uriStr}</p>
            </ToolPanel>
            <ToolPanel title="Verify a code" bodyClassName="p-3 flex items-center gap-3">
              <Input value={check} onChange={(e) => setCheck(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="123456" inputMode="numeric" className="w-36 font-mono text-lg tracking-widest" />
              {verified !== undefined && (verified !== null ? <StatusBadge tone="success"><Check className="w-3 h-3" /> Valid{verified !== 0 ? ` (${verified > 0 ? "+" : ""}${verified} step)` : ""}</StatusBadge> : <StatusBadge tone="error"><X className="w-3 h-3" /> Invalid</StatusBadge>)}
              <span className="text-[11px] text-muted-foreground">Accepts ±1 time step to allow for clock drift.</span>
            </ToolPanel>
            <p className="text-[11px] text-muted-foreground">For testing your own 2FA implementation. Don&apos;t paste secrets for real accounts into any website — keep those in your authenticator app.</p>
          </>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
