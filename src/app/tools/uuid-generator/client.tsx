"use client";

import { useEffect, useState } from "react";
import { Fingerprint, RefreshCw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClearButton, CopyButton, DownloadButton, Field, OptionsLayout, PrivacyNote, Segmented, StatusBadge, ToolPanel, Toggle } from "@/components/tool";

type Kind = "v4" | "v7" | "ulid" | "nil";
type Format = "plain" | "upper" | "braces" | "nodash" | "urn";

const hexOf = (a: Uint8Array) => Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
const dash = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;

function uuidV4() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const a = crypto.getRandomValues(new Uint8Array(16));
  a[6] = (a[6] & 0x0f) | 0x40;
  a[8] = (a[8] & 0x3f) | 0x80;
  return dash(hexOf(a));
}

/** RFC 9562 UUIDv7: 48-bit Unix ms timestamp + random; sorts by creation time. Monotonic within a batch. */
function makeV7() {
  let lastMs = 0;
  let seq = 0;
  return () => {
    let ms = Date.now();
    if (ms <= lastMs) { seq++; ms = lastMs; } else { seq = 0; lastMs = ms; }
    const a = crypto.getRandomValues(new Uint8Array(16));
    for (let i = 0; i < 6; i++) a[i] = Math.floor(ms / 2 ** (8 * (5 - i))) & 0xff;
    a[6] = 0x70 | ((seq >> 8) & 0x0f);
    a[7] = seq & 0xff;
    a[8] = (a[8] & 0x3f) | 0x80;
    return dash(hexOf(a));
  };
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
/** ULID: 48-bit ms timestamp + 80 random bits, Crockford Base32. Monotonic within the same ms. */
function makeUlid() {
  let lastMs = -1;
  let rand: number[] = [];
  return () => {
    const ms = Date.now();
    if (ms === lastMs) {
      for (let i = rand.length - 1; i >= 0; i--) { if (rand[i] < 31) { rand[i]++; break; } rand[i] = 0; }
    } else {
      lastMs = ms;
      rand = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b % 32);
    }
    let t = "";
    let n = ms;
    for (let i = 0; i < 10; i++) { t = CROCKFORD[n % 32] + t; n = Math.floor(n / 32); }
    return t + rand.map((i) => CROCKFORD[i]).join("");
  };
}

function formatId(id: string, kind: Kind, f: Format) {
  if (kind === "ulid") return f === "upper" || f === "plain" ? id : f === "nodash" ? id : id.toLowerCase();
  if (f === "upper") return id.toUpperCase();
  if (f === "braces") return `{${id}}`;
  if (f === "nodash") return id.replace(/-/g, "");
  if (f === "urn") return `urn:uuid:${id}`;
  return id;
}

/** Inspect a pasted UUID or ULID. */
function inspect(raw: string) {
  const s = raw.trim().replace(/^urn:uuid:/i, "").replace(/[{}]/g, "");
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(s)) {
    const ms = s.slice(0, 10).toUpperCase().split("").reduce((n, c) => n * 32 + CROCKFORD.indexOf(c), 0);
    return { type: "ULID", detail: `Created ${new Date(ms).toISOString()}` };
  }
  const h = s.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(h)) return null;
  if (/^0+$/.test(h)) return { type: "Nil UUID", detail: "All zeros" };
  if (/^f+$/.test(h)) return { type: "Max UUID", detail: "All ones (RFC 9562)" };
  const v = parseInt(h[12], 16);
  const variant = (parseInt(h[16], 16) & 0xc) === 0x8 ? "RFC 9562" : "non-standard variant";
  let detail = variant;
  if (v === 7) detail += ` · created ${new Date(parseInt(h.slice(0, 12), 16)).toISOString()}`;
  if (v === 1) {
    const ts = BigInt(`0x${h.slice(13, 16)}${h.slice(8, 12)}${h.slice(0, 8)}`);
    detail += ` · created ${new Date(Number((ts - BigInt("122192928000000000")) / BigInt(10000))).toISOString()} · node ${h.slice(20).match(/../g)!.join(":")}`;
  }
  return { type: `UUID version ${v}`, detail };
}

const KINDS: Record<Kind, { label: string; hint: string }> = {
  v4: { label: "UUID v4", hint: "122 random bits — the default everywhere." },
  v7: { label: "UUID v7", hint: "Timestamp-ordered (RFC 9562) — sorts by creation time; better database index locality." },
  ulid: { label: "ULID", hint: "26-char, time-sortable, URL-safe Crockford Base32." },
  nil: { label: "Nil", hint: "00000000-0000-0000-0000-000000000000" },
};

export default function UuidGenerator() {
  const [kind, setKind] = useState<Kind>("v4");
  const [count, setCount] = useState(10);
  const [fmt, setFmt] = useState<Format>("plain");
  const [quoted, setQuoted] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [check, setCheck] = useState("");

  const generate = (k = kind, n = count) => {
    const gen = k === "v4" ? uuidV4 : k === "v7" ? makeV7() : k === "ulid" ? makeUlid() : () => "00000000-0000-0000-0000-000000000000";
    setIds(Array.from({ length: Math.min(Math.max(n, 1), 1000) }, gen));
  };
  // Generate after mount only (client) to avoid server/client mismatches.
  useEffect(() => {
    const t = setTimeout(() => generate(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rendered = ids.map((u) => (quoted ? `"${formatId(u, kind, fmt)}"` : formatId(u, kind, fmt)));
  const joined = rendered.join(quoted ? ",\n" : "\n");
  const info = check.trim() ? inspect(check) : null;

  const options = (
    <ToolPanel
      title="Options"
      bodyClassName="p-3 space-y-4"
      footer={
        <div className="w-full space-y-2">
          <Button size="lg" onClick={() => generate()} className="w-full"><RefreshCw /> Generate</Button>
          <PrivacyNote>Generated with crypto.getRandomValues in your browser.</PrivacyNote>
        </div>
      }
    >
      <Field label="Type" hint={KINDS[kind].hint}>
        <Segmented size="sm" value={kind} onChange={(k) => { setKind(k); generate(k); }} options={(Object.keys(KINDS) as Kind[]).map((k) => ({ value: k, label: KINDS[k].label }))} />
      </Field>
      <Field label="Quantity" hint="Up to 1,000." htmlFor="uuid-count">
        <Input id="uuid-count" type="number" min={1} max={1000} value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} className="font-mono" />
      </Field>
      {kind !== "ulid" && (
        <Field label="Format">
          <Segmented size="sm" value={fmt} onChange={setFmt} options={[{ value: "plain", label: "Default" }, { value: "upper", label: "UPPER" }, { value: "braces", label: "{…}" }, { value: "nodash", label: "No dashes" }, { value: "urn", label: "URN" }]} className="flex-wrap" />
        </Field>
      )}
      <Toggle label="Quote values (JSON / SQL)" checked={quoted} onChange={setQuoted} />
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="uuid-generator">
      <OptionsLayout options={options}>
        <ToolPanel
          title={`${KINDS[kind].label} · ${ids.length}`}
          actions={
            <>
              <CopyButton text={joined} label="Copy all" />
              <DownloadButton content={joined} filename={`${kind}.txt`} iconOnly />
              <ClearButton onClick={() => setIds([])} iconOnly disabled={!ids.length} />
            </>
          }
        >
          {ids.length ? (
            <ul className="divide-y divide-border max-h-[520px] overflow-y-auto custom-scrollbar">
              {rendered.map((u, i) => (
                <li key={i} className="group flex items-center gap-3 px-3 h-9">
                  <span className="w-8 text-[11px] text-muted-foreground tabular-nums text-right">{i + 1}</span>
                  <code className="flex-1 font-mono text-[13px] truncate">{u}</code>
                  <CopyButton text={u} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground bg-dots">
              <Fingerprint className="w-8 h-8 opacity-40" />
              <p className="text-sm">Nothing generated yet</p>
            </div>
          )}
        </ToolPanel>
        <ToolPanel title="Inspect a UUID / ULID" bodyClassName="p-3 space-y-1.5">
          <Input value={check} onChange={(e) => setCheck(e.target.value)} placeholder="Paste a UUID or ULID to see its version and timestamp" className="font-mono" />
          {check.trim() && (info ? <p className="text-xs"><StatusBadge tone="success">{info.type}</StatusBadge> <span className="text-muted-foreground font-mono">{info.detail}</span></p> : <p className="text-xs text-destructive">Not a valid UUID or ULID.</p>)}
        </ToolPanel>
      </OptionsLayout>
    </ToolLayout>
  );
}
