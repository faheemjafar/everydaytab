"use client";

import { useMemo, useState } from "react";
import { UAParser } from "ua-parser-js";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ClearButton, CodeArea, CopyButton, StatusBadge, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

const SAMPLES: [string, string][] = [
  ["iPhone Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"],
  ["Android Chrome", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"],
  ["Windows Edge", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.51"],
  ["macOS Firefox", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:125.0) Gecko/20100101 Firefox/125.0"],
  ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
  ["curl", "curl/8.7.1"],
];

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|curl|wget|python-requests|httpclient|headless|lighthouse|pingdom|uptime/i;

export default function UserAgentParser() {
  const mounted = useMounted();
  const [input, setInput] = useState<string | null>(null);
  // Default to the visitor's own UA once we're in the browser.
  const ua = input ?? (mounted ? navigator.userAgent : "");
  const r = useMemo(() => (ua.trim() ? new UAParser(ua).getResult() : null), [ua]);
  const bot = BOT.test(ua);

  const groups: [string, [string, string | undefined][]][] = r
    ? [
        ["Browser", [["Name", r.browser.name], ["Version", r.browser.version], ["Major", r.browser.major]]],
        ["Engine", [["Name", r.engine.name], ["Version", r.engine.version]]],
        ["Operating system", [["Name", r.os.name], ["Version", r.os.version]]],
        ["Device", [["Type", r.device.type ?? (bot ? "bot" : "desktop")], ["Vendor", r.device.vendor], ["Model", r.device.model]]],
        ["CPU", [["Architecture", r.cpu.architecture]]],
      ]
    : [];

  return (
    <ToolLayout toolId="user-agent-parser">
      <div className="space-y-3">
        <ToolPanel
          title={input === null ? "Your browser's user agent" : "User agent"}
          actions={
            <>
              {input !== null && mounted && <Button variant="ghost" size="sm" onClick={() => setInput(null)}>Use mine</Button>}
              <CopyButton text={ua} iconOnly />
              <ClearButton onClick={() => setInput("")} iconOnly disabled={!ua} />
            </>
          }
          footer={
            <div className="flex flex-wrap gap-1">
              {SAMPLES.map(([l, s]) => (
                <button key={l} type="button" onClick={() => setInput(s)} className="h-6 px-2 rounded-sm border border-border text-[11px] text-muted-foreground hover:text-foreground">
                  {l}
                </button>
              ))}
            </div>
          }
        >
          <CodeArea value={ua} onChange={(e) => setInput(e.target.value)} minHeight={90} placeholder="Paste a User-Agent string…" />
        </ToolPanel>

        {r && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {r.browser.name && <StatusBadge tone="info">{r.browser.name} {r.browser.major}</StatusBadge>}
              {r.os.name && <StatusBadge>{r.os.name} {r.os.version}</StatusBadge>}
              <StatusBadge>{r.device.type ?? (bot ? "bot" : "desktop")}</StatusBadge>
              {bot && <StatusBadge tone="warning">Bot / automated client</StatusBadge>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map(([title, fields]) => (
                <ToolPanel key={title} title={title}>
                  <dl className="divide-y divide-border">
                    {fields.map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3 px-3.5 h-9 text-[13px]">
                        <dt className="w-24 text-xs text-muted-foreground">{k}</dt>
                        <dd className="flex-1 font-mono truncate">{v || <span className="text-muted-foreground">—</span>}</dd>
                      </div>
                    ))}
                  </dl>
                </ToolPanel>
              ))}
              <ToolPanel title="JSON" actions={<CopyButton text={JSON.stringify(r, null, 2)} iconOnly />}>
                <pre className="px-3.5 py-2 font-mono text-[11px] max-h-40 overflow-auto custom-scrollbar">{JSON.stringify({ browser: r.browser, engine: r.engine, os: r.os, device: r.device, cpu: r.cpu }, null, 2)}</pre>
              </ToolPanel>
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
