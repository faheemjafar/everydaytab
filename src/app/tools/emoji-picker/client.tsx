"use client";

import { useDeferredValue, useMemo, useState } from "react";
import byGroup from "unicode-emoji-json/data-by-group.json";
import { X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton, Segmented, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

type E = { emoji: string; name: string; slug: string; skin_tone_support: boolean; emoji_version: string };
const GROUPS = (byGroup as unknown as { name: string; slug: string; emojis: E[] }[]).map((g) => ({ name: g.name, slug: g.slug, emojis: g.emojis }));
const ALL = GROUPS.flatMap((g) => g.emojis.map((e) => ({ ...e, group: g.name })));
const TONES = [
  { id: "", label: "✋", name: "Default" },
  { id: "\u{1F3FB}", label: "✋🏻", name: "Light" },
  { id: "\u{1F3FC}", label: "✋🏼", name: "Medium-light" },
  { id: "\u{1F3FD}", label: "✋🏽", name: "Medium" },
  { id: "\u{1F3FE}", label: "✋🏾", name: "Medium-dark" },
  { id: "\u{1F3FF}", label: "✋🏿", name: "Dark" },
];

/** Inserts the skin-tone modifier after the first code point (drops any VS16 there). */
function withTone(e: E, tone: string) {
  if (!tone || !e.skin_tone_support) return e.emoji;
  const cps = Array.from(e.emoji);
  const rest = cps.slice(1);
  if (rest[0] === "\uFE0F") rest.shift();
  return cps[0] + tone + rest.join("");
}
const codepoints = (s: string) => Array.from(s).map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`).join(" ");
const entities = (s: string) => Array.from(s).map((c) => `&#x${c.codePointAt(0)!.toString(16).toUpperCase()};`).join("");

export default function EmojiPicker() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState(GROUPS[0].slug);
  const [tone, setTone] = useState("");
  const [tray, setTray] = useState("");
  const [sel, setSel] = useState<(E & { group: string }) | null>(null);
  const dq = useDeferredValue(q.trim().toLowerCase());

  const list = useMemo(() => {
    if (!dq) return GROUPS.find((g) => g.slug === group)!.emojis.map((e) => ({ ...e, group: "" }));
    const terms = dq.split(/\s+/);
    return ALL.filter((e) => terms.every((t) => e.name.includes(t) || e.slug.includes(t) || e.group.toLowerCase().includes(t)));
  }, [dq, group]);

  const pick = (e: E & { group: string }) => {
    setSel(e);
    setTray((t) => t + withTone(e, tone));
  };
  const selEmoji = sel ? withTone(sel, tone) : "";

  return (
    <ToolLayout toolId="emoji-picker">
      <div className="space-y-3">
        <ToolPanel bodyClassName="p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${ALL.length.toLocaleString()} emoji — e.g. heart, cat, party`} className="flex-1 min-w-56 h-10" autoFocus />
            <div className="flex rounded-md border border-border overflow-hidden" role="radiogroup" aria-label="Skin tone">
              {TONES.map((t) => (
                <button key={t.name} type="button" role="radio" aria-checked={tone === t.id} title={t.name} onClick={() => setTone(t.id)} className={cn("w-9 h-10 text-lg hover:bg-muted", tone === t.id && "bg-accent")}>{t.label}</button>
              ))}
            </div>
          </div>
          {!dq && <Segmented size="sm" value={group} onChange={setGroup} options={GROUPS.map((g) => ({ value: g.slug, label: `${g.emojis[0].emoji} ${g.name.split(" & ")[0]}` }))} className="flex-wrap" />}
        </ToolPanel>

        <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
          <ToolPanel title={dq ? `${list.length} results` : GROUPS.find((g) => g.slug === group)!.name}>
            <div className="p-2 grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] max-h-[520px] overflow-y-auto custom-scrollbar">
              {list.map((e) => (
                <button key={e.emoji} type="button" onClick={() => pick(e as E & { group: string })} title={e.name} aria-label={e.name} className={cn("h-11 text-[26px] rounded-md hover:bg-muted transition-transform active:scale-90", sel?.emoji === e.emoji && "bg-accent")}>
                  {withTone(e, tone)}
                </button>
              ))}
              {!list.length && <p className="col-span-full py-10 text-center text-xs text-muted-foreground">No emoji match “{q}”.</p>}
            </div>
          </ToolPanel>

          <div className="space-y-3">
            <ToolPanel title="Selected" bodyClassName="p-3">
              {sel ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl">{selEmoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize">{sel.name}</p>
                      <p className="text-[11px] text-muted-foreground">Emoji {sel.emoji_version}</p>
                    </div>
                  </div>
                  {[["Emoji", selEmoji], ["Shortcode", `:${sel.slug}:`], ["Code points", codepoints(selEmoji)], ["HTML", entities(selEmoji)]].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-muted-foreground">{k}</span>
                      <code className="flex-1 font-mono truncate">{v}</code>
                      <CopyButton text={v} iconOnly className="size-6" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Click an emoji to add it to the tray below and see its details.</p>
              )}
            </ToolPanel>
            <ToolPanel title="Tray" actions={<>{tray && <Button variant="ghost" size="icon-sm" onClick={() => setTray("")} aria-label="Clear tray"><X /></Button>}<CopyButton text={tray} label="Copy" /></>}>
              <textarea value={tray} onChange={(e) => setTray(e.target.value)} placeholder="Picked emoji collect here…" className="w-full min-h-24 resize-y bg-transparent p-3 text-2xl outline-none" />
            </ToolPanel>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
