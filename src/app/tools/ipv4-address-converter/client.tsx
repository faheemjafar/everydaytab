"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, OptionsLayout, StatusBadge, ToolPanel } from "@/components/tool";

/** Accepts dotted-quad, a 32-bit integer, 0x hex, or dotted binary. */
function parseIPv4(raw: string): number | null {
  const s = raw.trim();
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(s)) {
    const p = s.split(".").map(Number);
    return p.every((x) => x <= 255) ? ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3] : null;
  }
  if (/^([01]{8}\.){3}[01]{8}$/.test(s)) return parseInt(s.replace(/\./g, ""), 2);
  if (/^0x[0-9a-f]{1,8}$/i.test(s)) return parseInt(s, 16);
  if (/^\d{1,10}$/.test(s)) {
    const n = Number(s);
    return n <= 0xffffffff ? n : null;
  }
  return null;
}

const octets = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

function classify(o: number[]) {
  const [a, b] = o;
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return { label: "Private (RFC 1918)", tone: "info" as const };
  if (a === 127) return { label: "Loopback", tone: "info" as const };
  if (a === 169 && b === 254) return { label: "Link-local", tone: "warning" as const };
  if (a === 100 && b >= 64 && b <= 127) return { label: "Carrier-grade NAT", tone: "warning" as const };
  if (a >= 224 && a <= 239) return { label: "Multicast", tone: "warning" as const };
  if (a === 0 || a >= 240) return { label: "Reserved", tone: "error" as const };
  return { label: "Public", tone: "success" as const };
}

export default function IPv4AddressConverter() {
  const [input, setInput] = useState("192.168.1.1");
  const n = useMemo(() => parseIPv4(input), [input]);

  const rows: [string, string][] =
    n === null
      ? []
      : (() => {
          const o = octets(n);
          const hex = o.map((x) => x.toString(16).padStart(2, "0"));
          return [
            ["Dotted decimal", o.join(".")],
            ["Integer", String(n)],
            ["Hexadecimal", `0x${hex.join("").toUpperCase()}`],
            ["Dotted hex", hex.join(".").toUpperCase()],
            ["Binary", o.map((x) => x.toString(2).padStart(8, "0")).join(".")],
            ["Octal", o.map((x) => x.toString(8).padStart(4, "0")).join(".")],
            ["IPv6 mapped", `::ffff:${hex[0]}${hex[1]}:${hex[2]}${hex[3]}`],
            ["IPv6 mapped (full)", `0000:0000:0000:0000:0000:ffff:${hex[0]}${hex[1]}:${hex[2]}${hex[3]}`],
            ["Reverse DNS", `${[...o].reverse().join(".")}.in-addr.arpa`],
          ];
        })();

  const kind = n === null ? null : classify(octets(n));
  const cls = n === null ? "" : (() => { const a = n >>> 24; return a < 128 ? "A" : a < 192 ? "B" : a < 224 ? "C" : a < 240 ? "D" : "E"; })();

  const options = (
    <ToolPanel title="About this address" bodyClassName="p-3 space-y-2 text-xs">
      {kind ? (
        <>
          <StatusBadge tone={kind.tone}>{kind.label}</StatusBadge>
          <p className="text-muted-foreground">Legacy class {cls}</p>
        </>
      ) : (
        <p className="text-muted-foreground">Enter an address as 192.168.1.1, 3232235777, 0xC0A80101 or dotted binary.</p>
      )}
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="ipv4-address-converter">
      <OptionsLayout options={options}>
        <ToolPanel bodyClassName="p-3.5 space-y-1.5">
          <Input value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} autoFocus className="h-12 text-lg font-mono" aria-invalid={input.trim() !== "" && n === null ? true : undefined} />
          {input.trim() && n === null && <p className="text-xs text-destructive">Not a valid IPv4 address.</p>}
        </ToolPanel>
        {rows.length > 0 && (
          <ToolPanel title="Representations">
            <dl className="divide-y divide-border">
              {rows.map(([k, v]) => (
                <div key={k} className="group flex items-center gap-3 px-3.5 h-10">
                  <dt className="w-40 shrink-0 text-xs text-muted-foreground">{k}</dt>
                  <dd className="flex-1 font-mono text-[13px] truncate">{v}</dd>
                  <CopyButton text={v} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                </div>
              ))}
            </dl>
          </ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
