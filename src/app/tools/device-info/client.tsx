"use client";

import { useSyncExternalStore } from "react";
import { UAParser } from "ua-parser-js";
import { ToolLayout } from "@/components/tool-layout";
import { CopyButton, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

type Nav = Navigator & { deviceMemory?: number; connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean }; userAgentData?: { platform?: string; mobile?: boolean } };

// Re-read on resize/orientation/online changes.
const subscribe = (cb: () => void) => {
  const evs = ["resize", "orientationchange", "online", "offline"];
  evs.forEach((e) => window.addEventListener(e, cb));
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => { evs.forEach((e) => window.removeEventListener(e, cb)); mq.removeEventListener("change", cb); };
};
let cache = "";
const snapshot = () => {
  const s = `${innerWidth}x${innerHeight}|${screen.orientation?.type}|${navigator.onLine}|${matchMedia("(prefers-color-scheme: dark)").matches}`;
  if (s !== cache) cache = s;
  return cache;
};

function collect(): [string, [string, string][]][] {
  const n = navigator as Nav;
  const ua = new UAParser(navigator.userAgent).getResult();
  const mq = (q: string) => matchMedia(q).matches;
  let webgl = "—";
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    webgl = ext && gl ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : gl ? "Available" : "Not supported";
  } catch {
    /* ignore */
  }
  return [
    ["Browser", [["Browser", `${ua.browser.name ?? "?"} ${ua.browser.version ?? ""}`], ["Engine", `${ua.engine.name ?? "?"} ${ua.engine.version ?? ""}`], ["Language", navigator.languages?.join(", ") || navigator.language], ["Cookies", navigator.cookieEnabled ? "Enabled" : "Disabled"], ["Do Not Track", navigator.doNotTrack === "1" ? "On" : "Off"], ["Online", navigator.onLine ? "Yes" : "No"]]],
    ["System", [["OS", `${ua.os.name ?? "?"} ${ua.os.version ?? ""}`], ["Device", ua.device.vendor ? `${ua.device.vendor} ${ua.device.model ?? ""}` : ua.device.type ?? "Desktop"], ["CPU cores", String(navigator.hardwareConcurrency || "—")], ["Memory (approx.)", n.deviceMemory ? `≥ ${n.deviceMemory} GB` : "—"], ["GPU", webgl], ["Touch points", String(navigator.maxTouchPoints)]]],
    ["Screen", [["Screen", `${screen.width} × ${screen.height}`], ["Viewport", `${innerWidth} × ${innerHeight}`], ["Pixel ratio", String(devicePixelRatio)], ["Colour depth", `${screen.colorDepth}-bit`], ["Orientation", screen.orientation?.type ?? "—"], ["HDR / wide gamut", mq("(dynamic-range: high)") ? "HDR" : mq("(color-gamut: p3)") ? "P3" : "sRGB"]]],
    ["Preferences", [["Colour scheme", mq("(prefers-color-scheme: dark)") ? "Dark" : "Light"], ["Reduced motion", mq("(prefers-reduced-motion: reduce)") ? "Yes" : "No"], ["High contrast", mq("(prefers-contrast: more)") ? "Yes" : "No"], ["Pointer", mq("(pointer: coarse)") ? "Touch (coarse)" : "Mouse (fine)"], ["Time zone", Intl.DateTimeFormat().resolvedOptions().timeZone], ["Locale", Intl.DateTimeFormat().resolvedOptions().locale]]],
    ["Network", [["Connection", n.connection?.effectiveType ?? "—"], ["Downlink", n.connection?.downlink ? `${n.connection.downlink} Mb/s` : "—"], ["Round-trip", n.connection?.rtt ? `${n.connection.rtt} ms` : "—"], ["Data saver", n.connection?.saveData ? "On" : "Off"]]],
  ];
}

export default function DeviceInformation() {
  const mounted = useMounted();
  useSyncExternalStore(subscribe, snapshot, () => "");
  const groups = mounted ? collect() : [];
  const text = groups.map(([g, rows]) => `${g}\n${rows.map(([k, v]) => `  ${k}: ${v}`).join("\n")}`).join("\n\n");

  return (
    <ToolLayout toolId="device-info">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Read from your browser locally — nothing is sent anywhere. Updates live as you resize.</p>
          <CopyButton text={text} label="Copy report" disabled={!mounted} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map(([title, rows]) => (
            <ToolPanel key={title} title={title}>
              <dl className="divide-y divide-border">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 px-3.5 h-9 text-[13px]">
                    <dt className="w-32 shrink-0 text-xs text-muted-foreground">{k}</dt>
                    <dd className="flex-1 font-mono truncate" title={v}>{v}</dd>
                  </div>
                ))}
              </dl>
            </ToolPanel>
          ))}
          {!mounted && <div className="h-64 rounded-md border border-border bg-card sm:col-span-2 xl:col-span-3" />}
        </div>
      </div>
    </ToolLayout>
  );
}
