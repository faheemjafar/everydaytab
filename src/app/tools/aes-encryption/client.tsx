"use client";

import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import { Eye, EyeOff, Lock, ShieldCheck, Unlock } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Segmented, StatusBadge, TextTransform } from "@/components/tool";

type Mode = "encrypt" | "decrypt";
type Scheme = "gcm" | "openssl";

// Modern format: "etab1:" + base64(salt[16] | iv[12] | ciphertext+tag). PBKDF2-SHA256, 600k iterations (OWASP 2023).
const PREFIX = "etab1:";
const ITER = 600_000;
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/\s/g, "")), (c) => c.charCodeAt(0));

async function keyFrom(pass: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as BufferSource, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function encryptGcm(text: string, pass: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFrom(pass, salt), enc.encode(text)));
  const out = new Uint8Array(28 + ct.length);
  out.set(salt, 0);
  out.set(iv, 16);
  out.set(ct, 28);
  return PREFIX + b64(out);
}

async function decryptGcm(data: string, pass: string) {
  const raw = unb64(data.trim().slice(PREFIX.length));
  if (raw.length < 29) throw new Error("Ciphertext is too short.");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(16, 28) }, await keyFrom(pass, raw.slice(0, 16)), raw.slice(28));
  return dec.decode(pt);
}

async function run(mode: Mode, scheme: Scheme, text: string, pass: string): Promise<{ out: string; detected?: string }> {
  if (mode === "encrypt") return { out: scheme === "gcm" ? await encryptGcm(text, pass) : CryptoJS.AES.encrypt(text, pass).toString() };
  const t = text.trim();
  if (t.startsWith(PREFIX)) return { out: await decryptGcm(t, pass), detected: "AES-256-GCM (EverydayTab)" };
  // "U2FsdGVkX1" = base64("Salted__"): OpenSSL / CryptoJS passphrase format.
  if (t.startsWith("U2FsdGVkX1")) {
    const out = CryptoJS.AES.decrypt(t, pass).toString(CryptoJS.enc.Utf8);
    if (!out) throw new Error("Wrong passphrase, or the data is corrupted.");
    return { out, detected: "OpenSSL / CryptoJS (legacy)" };
  }
  throw new Error("Unrecognised format. Expected text starting with “etab1:” or “U2FsdGVkX1”.");
}

export default function AESEncryption() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [scheme, setScheme] = useState<Scheme>("gcm");
  const [input, setInput] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [state, setState] = useState<{ key: string; out: string; error: string | null; detected?: string; busy: boolean }>({ key: "", out: "", error: null, busy: false });

  const key = `${mode}|${scheme}|${input}|${pass}`;
  // Debounced: PBKDF2 at 600k iterations takes ~0.3 s, so don't run it on every keystroke.
  useEffect(() => {
    if (!input.trim() || !pass) return;
    let alive = true;
    const t = setTimeout(() => {
      setState((s) => ({ ...s, busy: true }));
      run(mode, scheme, input, pass)
        .then((r) => alive && setState({ key, out: r.out, error: null, detected: r.detected, busy: false }))
        .catch((e) => alive && setState({ key, out: "", error: (e as Error).name === "OperationError" ? "Wrong passphrase, or the data was modified." : (e as Error).message, busy: false }));
    }, mode === "encrypt" && scheme === "gcm" ? 400 : 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [mode, scheme, input, pass, key]);

  const fresh = state.key === key && input.trim() && pass;
  const output = fresh ? state.out : "";

  return (
    <ToolLayout toolId="aes-encryption">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={fresh ? state.error : null}
        minHeight={220}
        inputLabel={mode === "encrypt" ? "Plain text" : "Encrypted text"}
        outputLabel={mode === "encrypt" ? "Encrypted" : "Decrypted"}
        filename={mode === "encrypt" ? "encrypted.txt" : "decrypted.txt"}
        placeholder={mode === "encrypt" ? "Type the message to encrypt…" : "Paste text starting with etab1: or U2FsdGVkX1…"}
        options={
          <>
            <Segmented value={mode} onChange={(m) => { setMode(m); if (output) setInput(output); }} options={[{ value: "encrypt", label: <><Lock className="w-3.5 h-3.5" /> Encrypt</> }, { value: "decrypt", label: <><Unlock className="w-3.5 h-3.5" /> Decrypt</> }]} />
            <Field label="Passphrase" htmlFor="pp">
              <div className="flex gap-1">
                <Input id="pp" type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Shared secret" className="w-56" autoComplete="off" />
                <Button variant="ghost" size="icon" onClick={() => setShow(!show)} aria-label={show ? "Hide passphrase" : "Show passphrase"}>{show ? <EyeOff /> : <Eye />}</Button>
              </div>
            </Field>
            {mode === "encrypt" && (
              <Field label="Format">
                <Segmented size="sm" value={scheme} onChange={setScheme} options={[{ value: "gcm", label: "AES-256-GCM (recommended)" }, { value: "openssl", label: "OpenSSL/CryptoJS (legacy)" }]} />
              </Field>
            )}
            {state.busy && <StatusBadge tone="info">Deriving key…</StatusBadge>}
            {fresh && state.detected && <StatusBadge>{state.detected}</StatusBadge>}
            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 basis-full">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px" />
              {scheme === "gcm" || mode === "decrypt"
                ? "AES-256-GCM with a random salt and IV; the key is derived with PBKDF2-SHA256 (600,000 iterations). Tampered ciphertext fails to decrypt. Everything runs in your browser."
                : "Legacy format matches `openssl enc -aes-256-cbc -md md5` and CryptoJS, but derives the key with a single MD5 round — weak against guessing. Use only for compatibility."}
            </p>
          </>
        }
      />
    </ToolLayout>
  );
}
