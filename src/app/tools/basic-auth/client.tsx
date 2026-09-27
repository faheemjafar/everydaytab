"use client";

import { useEffect, useState } from "react";
import bcrypt from "bcryptjs";
import { Eye, EyeOff } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeOutput, CopyButton, Field, OptionsLayout, Segmented, ToolAlert, ToolPanel } from "@/components/tool";

// UTF-8 safe Base64 (btoa alone throws on characters outside Latin-1).
const toB64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const fromB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));

export default function BasicAuthGenerator() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [header, setHeader] = useState("");
  const [htpasswd, setHtpasswd] = useState<{ key: string; line: string } | null>(null);

  const token = user || pass ? toB64(`${user}:${pass}`) : "";
  const hKey = `${user}:${pass}`;

  // bcrypt is slow on purpose; compute the .htpasswd line off the render path.
  useEffect(() => {
    if (mode !== "encode" || !user || !pass) return;
    let alive = true;
    const t = setTimeout(() => bcrypt.hash(pass, 10).then((h) => alive && setHtpasswd({ key: hKey, line: `${user}:${h.replace(/^\$2b\$/, "$2y$")}` })), 300);
    return () => { alive = false; clearTimeout(t); };
  }, [mode, user, pass, hKey]);

  let decoded: { user: string; pass: string } | { error: string } | null = null;
  if (mode === "decode" && header.trim()) {
    try {
      const raw = fromB64(header.trim().replace(/^(Authorization:\s*)?Basic\s+/i, ""));
      const i = raw.indexOf(":");
      decoded = i === -1 ? { error: "Decoded value has no “:” separator." } : { user: raw.slice(0, i), pass: raw.slice(i + 1) };
    } catch {
      decoded = { error: "Not valid Base64." };
    }
  }

  const options = (
    <ToolPanel title="Credentials" bodyClassName="p-3 space-y-3">
      <Segmented value={mode} onChange={setMode} options={[{ value: "encode", label: "Create header" }, { value: "decode", label: "Decode header" }]} />
      {mode === "encode" ? (
        <>
          <Field label="Username" htmlFor="bu"><Input id="bu" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="off" /></Field>
          <Field label="Password" htmlFor="bp">
            <div className="flex gap-1">
              <Input id="bp" type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" />
              <Button variant="ghost" size="icon" onClick={() => setShow(!show)} aria-label={show ? "Hide" : "Show"}>{show ? <EyeOff /> : <Eye />}</Button>
            </div>
          </Field>
          {user.includes(":") && <p className="text-xs text-destructive">Usernames can&apos;t contain “:”.</p>}
        </>
      ) : (
        <Field label="Authorization header or token" htmlFor="bh"><Input id="bh" value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Basic dXNlcjpwYXNz" className="font-mono" /></Field>
      )}
      <p className="text-[11px] text-muted-foreground">Base64 is encoding, not encryption — anyone who sees the header can read the password. Only send it over HTTPS.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="basic-auth">
      <OptionsLayout options={options}>
        {mode === "encode" ? (
          token ? (
            <>
              <ToolPanel title="Header" actions={<CopyButton text={`Authorization: Basic ${token}`} />}>
                <pre className="px-3.5 py-3 font-mono text-[13px] break-all whitespace-pre-wrap">Authorization: Basic {token}</pre>
              </ToolPanel>
              <CodeOutput
                title="Use it"
                tabs={[
                  { id: "curl", label: "curl", code: `curl -u ${JSON.stringify(`${user}:${pass}`)} https://api.example.com/\n# or\ncurl -H "Authorization: Basic ${token}" https://api.example.com/` },
                  { id: "fetch", label: "fetch", code: `fetch("https://api.example.com/", {\n  headers: { Authorization: "Basic ${token}" },\n});` },
                  { id: "python", label: "Python", code: `import requests\nrequests.get("https://api.example.com/", auth=(${JSON.stringify(user)}, ${JSON.stringify(pass)}))` },
                  { id: "htpasswd", label: ".htpasswd", code: htpasswd?.key === hKey ? `${htpasswd.line}\n\n# Apache: AuthType Basic + AuthUserFile /path/.htpasswd\n# nginx:  auth_basic "Restricted"; auth_basic_user_file /path/.htpasswd;` : "Hashing…" },
                ]}
              />
            </>
          ) : (
            <ToolPanel bodyClassName="px-4 py-12 text-center text-sm text-muted-foreground">Enter a username and password.</ToolPanel>
          )
        ) : decoded && "error" in decoded ? (
          <ToolAlert tone="error">{decoded.error}</ToolAlert>
        ) : decoded ? (
          <ToolPanel title="Decoded">
            <dl className="divide-y divide-border">
              {[["Username", decoded.user], ["Password", decoded.pass]].map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 px-3.5 h-10"><dt className="w-24 text-xs text-muted-foreground">{k}</dt><dd className="flex-1 font-mono text-[13px] break-all">{v}</dd><CopyButton text={v} iconOnly /></div>
              ))}
            </dl>
          </ToolPanel>
        ) : null}
      </OptionsLayout>
    </ToolLayout>
  );
}
