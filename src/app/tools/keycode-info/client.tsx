"use client";

import { useRef, useState } from "react";
import { Keyboard } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { CodeOutput, CopyButton, StatusBadge, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  location: number;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  repeat: boolean;
  id: number;
}

const LOCATION = ["Standard", "Left", "Right", "Numpad"];
const display = (k: string) => (k === " " ? "Space" : k.length === 1 ? k.toUpperCase() : k);

export default function KeycodeInfo() {
  const [last, setLast] = useState<KeyInfo | null>(null);
  const [history, setHistory] = useState<KeyInfo[]>([]);
  const [focused, setFocused] = useState(false);
  const n = useRef(0);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Let Tab / Shift+Tab move focus out so the page stays keyboard-accessible.
    if (e.key === "Tab") return;
    e.preventDefault();
    const info: KeyInfo = { key: e.key, code: e.code, keyCode: e.keyCode, location: e.location, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey, repeat: e.repeat, id: ++n.current };
    setLast(info);
    if (!e.repeat) setHistory((h) => [info, ...h].slice(0, 12));
  };

  const mods = last ? [last.ctrl && "Ctrl", last.alt && "Alt", last.shift && "Shift", last.meta && "Meta"].filter(Boolean) : [];
  const combo = last ? [...mods, display(last.key)].filter((x, i, a) => a.indexOf(x) === i).join(" + ") : "";

  const js = last
    ? `document.addEventListener("keydown", (event) => {
  if (${[last.ctrl && "event.ctrlKey", last.alt && "event.altKey", last.shift && "event.shiftKey", last.meta && "event.metaKey", `event.key === ${JSON.stringify(last.key)}`].filter(Boolean).join(" && ")}) {
    event.preventDefault();
    // handle ${combo}
  }
});`
    : "";
  const react = last ? `onKeyDown={(e) => {\n  if (${[last.ctrl && "e.ctrlKey", last.alt && "e.altKey", last.shift && "e.shiftKey", last.meta && "e.metaKey", `e.code === ${JSON.stringify(last.code)}`].filter(Boolean).join(" && ")}) {\n    // handle ${combo}\n  }\n}}` : "";

  const rows: [string, string, string][] = last
    ? [
        ["event.key", JSON.stringify(last.key), "The character or key name — use this for text/shortcuts"],
        ["event.code", JSON.stringify(last.code), "Physical key position, layout-independent (e.g. WASD)"],
        ["event.keyCode", String(last.keyCode), "Deprecated numeric code — legacy code only"],
        ["event.location", `${last.location} (${LOCATION[last.location]})`, "Distinguishes left/right modifiers and numpad"],
        ["Modifiers", mods.join(", ") || "none", "ctrlKey / altKey / shiftKey / metaKey"],
        ["event.repeat", String(last.repeat), "true while the key is held down"],
      ]
    : [];

  return (
    <ToolLayout toolId="keycode-info">
      <div className="space-y-3">
        <div
          tabIndex={0}
          role="textbox"
          aria-label="Press any key"
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
          className={cn("flex flex-col items-center justify-center gap-2 min-h-56 rounded-md border-2 border-dashed bg-card outline-none cursor-text transition-colors", focused ? "border-primary bg-accent/30" : "border-border")}
        >
          {last ? (
            <>
              <span className="font-mono text-6xl font-semibold tabular-nums">{last.keyCode}</span>
              <span className="text-lg font-medium">{combo}</span>
              <span className="text-xs text-muted-foreground">{focused ? "Press another key" : "Click here to capture keys"}</span>
            </>
          ) : (
            <>
              <Keyboard className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm font-medium">{focused ? "Press any key…" : "Click here, then press a key"}</span>
              <span className="text-xs text-muted-foreground">Keys are only captured inside this box. Tab moves focus away.</span>
            </>
          )}
        </div>

        {last && (
          <>
            <ToolPanel title="Event properties">
              <dl className="divide-y divide-border">
                {rows.map(([k, v, hint]) => (
                  <div key={k} className="group flex items-center gap-3 px-3.5 py-2">
                    <dt className="w-32 shrink-0 font-mono text-xs">{k}</dt>
                    <dd className="w-40 shrink-0 font-mono text-[13px]">{v}</dd>
                    <span className="flex-1 text-xs text-muted-foreground hidden sm:block">{hint}</span>
                    <CopyButton text={v} iconOnly className="opacity-0 group-hover:opacity-100 focus:opacity-100" />
                  </div>
                ))}
              </dl>
            </ToolPanel>
            <CodeOutput title="Handle this key" tabs={[{ id: "js", label: "JavaScript", code: js }, { id: "react", label: "React", code: react }]} />
          </>
        )}

        {history.length > 1 && (
          <ToolPanel title="Recent keys" bodyClassName="p-3 flex flex-wrap gap-1.5">
            {history.map((h) => (
              <StatusBadge key={h.id}>
                {display(h.key)} <span className="text-muted-foreground font-mono ml-1">{h.code} · {h.keyCode}</span>
              </StatusBadge>
            ))}
          </ToolPanel>
        )}
      </div>
    </ToolLayout>
  );
}
