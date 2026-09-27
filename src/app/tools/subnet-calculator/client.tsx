"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, OptionsLayout, SliderField, StatusBadge, ToolPanel } from "@/components/tool";
import { classify, intToIp, ipToInt, parsePrefix, subnet, toBin } from "@/lib/ipv4";

export default function SubnetCalculator() {
  const [input, setInput] = useState("192.168.1.130/26");
  const [split, setSplit] = useState(0);

  // Accept "ip/prefix", "ip mask", or "ip" (+ separate prefix via slider).
  const parsed = useMemo(() => {
    const [ipPart, maskPart] = input.trim().split(/[\s/]+/);
    const ip = ipToInt(ipPart ?? "");
    const prefix = maskPart !== undefined ? parsePrefix(maskPart) : 24;
    return ip === null || prefix === null ? null : { ip, prefix };
  }, [input]);

  const s = parsed ? subnet(parsed.ip, parsed.prefix) : null;
  const newPrefix = parsed ? Math.min(32, parsed.prefix + split) : 0;
  const subnets = s && split > 0 ? Array.from({ length: Math.min(256, 2 ** split) }, (_, i) => subnet((s.network + i * 2 ** (32 - newPrefix)) >>> 0, newPrefix)) : [];

  const rows: [string, string][] = s
    ? [
        ["Network address", `${intToIp(s.network)}/${s.prefix}`],
        ["Usable host range", s.usable > 0 ? `${intToIp(s.first)} – ${intToIp(s.last)}` : "—"],
        ["Broadcast address", s.prefix >= 31 ? "— (none for /31, /32)" : intToIp(s.broadcast)],
        ["Usable hosts", s.usable.toLocaleString()],
        ["Total addresses", s.total.toLocaleString()],
        ["Subnet mask", intToIp(s.mask)],
        ["Wildcard mask", intToIp(s.wildcard)],
        ["CIDR notation", `/${s.prefix}`],
        ["Binary mask", toBin(s.mask)],
        ["Binary address", toBin(parsed!.ip)],
        ["Address type", classify(parsed!.ip)],
        ["Reverse DNS zone", `${intToIp(s.network).split(".").slice(0, Math.max(1, Math.floor(s.prefix / 8))).reverse().join(".")}.in-addr.arpa`],
      ]
    : [];

  const options = (
    <ToolPanel title="Mask" bodyClassName="p-3 space-y-4">
      <SliderField
        label="Prefix length"
        value={parsed?.prefix ?? 24}
        onChange={(p) => setInput(`${input.trim().split(/[\s/]+/)[0] || "192.168.1.0"}/${p}`)}
        min={0}
        max={32}
        format={(v) => `/${v} · ${intToIp(subnet(0, v).mask)}`}
      />
      {s && s.prefix < 32 && (
        <SliderField label="Split into subnets" value={split} onChange={setSplit} min={0} max={Math.min(8, 32 - s.prefix)} format={(v) => (v ? `${2 ** v} × /${s.prefix + v}` : "off")} />
      )}
      <p className="text-[11px] text-muted-foreground">Accepts 10.0.0.5/20, 10.0.0.5 255.255.240.0 or 10.0.0.5 /20.</p>
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="subnet-calculator">
      <OptionsLayout options={options}>
        <ToolPanel bodyClassName="p-3.5 space-y-1.5">
          <Input value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} className="h-12 text-lg font-mono" aria-invalid={!parsed && input.trim() ? true : undefined} autoFocus />
          {!parsed && input.trim() && <p className="text-xs text-destructive">Enter an IPv4 address with a prefix (/24) or dotted mask.</p>}
        </ToolPanel>
        {s && (
          <ToolPanel title="Subnet" actions={<StatusBadge>{classify(parsed!.ip)}</StatusBadge>}>
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
        {subnets.length > 0 && (
          <ToolPanel title={`${2 ** split} subnets of /${newPrefix}`} actions={<CopyButton getText={() => subnets.map((x) => `${intToIp(x.network)}/${x.prefix}`).join("\n")} label="Copy list" />}>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              <table className="w-full text-[12.5px] font-mono">
                <thead className="sticky top-0 bg-muted text-left text-[11px] text-muted-foreground font-sans">
                  <tr><th className="px-3.5 py-1.5 font-medium">Network</th><th className="px-3.5 py-1.5 font-medium">Usable range</th><th className="px-3.5 py-1.5 font-medium">Broadcast</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subnets.map((x) => (
                    <tr key={x.network}><td className="px-3.5 py-1.5">{intToIp(x.network)}/{x.prefix}</td><td className="px-3.5 py-1.5">{intToIp(x.first)} – {intToIp(x.last)}</td><td className="px-3.5 py-1.5">{intToIp(x.broadcast)}</td></tr>
                  ))}
                </tbody>
              </table>
              {2 ** split > 256 && <p className="px-3.5 py-2 text-[11px] text-muted-foreground">Showing the first 256.</p>}
            </div>
          </ToolPanel>
        )}
      </OptionsLayout>
    </ToolLayout>
  );
}
