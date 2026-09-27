"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, Pause, Play, RotateCcw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadButton, Segmented, ToolPanel } from "@/components/tool";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { cn } from "@/lib/utils";

// Running state is stored as timestamps, so it survives reloads and background tabs exactly.
interface Watch { startedAt: number | null; acc: number; laps: number[] }
interface Timer { endsAt: number | null; remaining: number; duration: number }
const watchStore = createLocalStore<Watch>("stopwatch", { startedAt: null, acc: 0, laps: [] });
const timerStore = createLocalStore<Timer>("countdown-timer", { endsAt: null, remaining: 300000, duration: 300000 });

function fmt(ms: number, cs = true) {
  const t = Math.max(0, ms);
  const h = Math.floor(t / 3600000);
  const m = Math.floor(t / 60000) % 60;
  const s = Math.floor(t / 1000) % 60;
  const c = Math.floor(t / 10) % 100;
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s).padStart(2, "0")}${cs ? `.${String(c).padStart(2, "0")}` : ""}`;
}

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
  } catch {
    /* audio unavailable */
  }
}

function useNow(active: boolean) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => { setNow(Date.now()); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return now;
}

export default function Stopwatch() {
  const [mode, setMode] = useState<"watch" | "timer">("watch");
  const [w, setW] = useLocalStore(watchStore);
  const [t, setT] = useLocalStore(timerStore);
  const now = useNow(mode === "watch" ? w.startedAt !== null : t.endsAt !== null);

  const elapsed = w.acc + (w.startedAt !== null && now ? now - w.startedAt : 0);
  const left = t.endsAt !== null && now ? Math.max(0, t.endsAt - now) : t.remaining;

  const toggleWatch = () => setW((x) => (x.startedAt === null ? { ...x, startedAt: Date.now() } : { ...x, acc: x.acc + Date.now() - x.startedAt, startedAt: null }));
  const lap = () => w.startedAt !== null && setW((x) => ({ ...x, laps: [...x.laps, x.acc + Date.now() - x.startedAt!] }));
  const resetWatch = () => setW({ startedAt: null, acc: 0, laps: [] });
  const toggleTimer = () => setT((x) => (x.endsAt === null ? { ...x, endsAt: Date.now() + (x.remaining || x.duration), remaining: x.remaining || x.duration } : { ...x, remaining: Math.max(0, x.endsAt - Date.now()), endsAt: null }));
  const setDuration = (ms: number) => setT({ endsAt: null, remaining: ms, duration: ms });

  // Fire the alarm once when the countdown reaches zero.
  useEffect(() => {
    if (t.endsAt === null) return;
    const id = setTimeout(() => {
      beep();
      setT((x) => ({ ...x, endsAt: null, remaining: 0 }));
      if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("Timer finished");
    }, Math.max(0, t.endsAt - Date.now()));
    return () => clearTimeout(id);
  }, [t.endsAt, setT]);

  // Live time in the tab title while running; restore the page title otherwise.
  const baseTitle = useRef("");
  useEffect(() => {
    baseTitle.current = document.title;
    return () => { document.title = baseTitle.current; };
  }, []);
  useEffect(() => {
    document.title = mode === "timer" && t.endsAt !== null ? `${fmt(left, false)} · Timer` : mode === "watch" && w.startedAt !== null ? `${fmt(elapsed, false)} · Stopwatch` : baseTitle.current;
  });

  // Keyboard: Space start/pause, L lap, R reset (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      if (e.code === "Space") { e.preventDefault(); if (mode === "watch") toggleWatch(); else toggleTimer(); }
      else if (e.key.toLowerCase() === "l" && mode === "watch") lap();
      else if (e.key.toLowerCase() === "r") { if (mode === "watch") resetWatch(); else setDuration(t.duration); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const splits = w.laps.map((l, i) => l - (w.laps[i - 1] ?? 0));
  const best = splits.length > 1 ? Math.min(...splits) : -1;
  const worst = splits.length > 1 ? Math.max(...splits) : -1;
  const csv = ["lap,split_ms,total_ms", ...w.laps.map((l, i) => `${i + 1},${splits[i]},${l}`)].join("\n");

  return (
    <ToolLayout toolId="stopwatch">
      <div className="space-y-3 max-w-2xl mx-auto">
        <Segmented value={mode} onChange={setMode} options={[{ value: "watch", label: "Stopwatch" }, { value: "timer", label: "Timer" }]} />
        {mode === "watch" ? (
          <>
            <ToolPanel bodyClassName="py-10 flex flex-col items-center gap-6">
              <p className="font-mono text-6xl sm:text-7xl font-semibold tabular-nums tracking-tight">{fmt(elapsed)}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="lg" onClick={resetWatch} disabled={!elapsed}><RotateCcw /> Reset</Button>
                <Button size="lg" onClick={toggleWatch} className="w-32">{w.startedAt !== null ? <><Pause /> Pause</> : <><Play /> {elapsed ? "Resume" : "Start"}</>}</Button>
                <Button variant="outline" size="lg" onClick={lap} disabled={w.startedAt === null}><Flag /> Lap</Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Space start/pause · L lap · R reset</p>
            </ToolPanel>
            {w.laps.length > 0 && (
              <ToolPanel title={`Laps · ${w.laps.length}`} actions={<DownloadButton content={csv} filename="laps.csv" mime="text/csv" iconOnly />}>
                <table className="w-full text-[13px] font-mono tabular-nums">
                  <thead className="text-[11px] text-muted-foreground font-sans"><tr><th className="text-left font-medium px-3.5 py-1.5">Lap</th><th className="text-right font-medium px-3.5">Split</th><th className="text-right font-medium px-3.5">Total</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {w.laps.map((l, i) => ({ l, i })).reverse().map(({ l, i }) => (
                      <tr key={i} className={cn(splits[i] === best && "text-emerald-600 dark:text-emerald-400", splits[i] === worst && "text-red-600 dark:text-red-400")}>
                        <td className="px-3.5 py-1.5">{i + 1}</td><td className="text-right px-3.5">{fmt(splits[i])}</td><td className="text-right px-3.5">{fmt(l)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ToolPanel>
            )}
          </>
        ) : (
          <ToolPanel bodyClassName="py-8 flex flex-col items-center gap-5">
            <div className="relative">
              <svg viewBox="0 0 120 120" className="w-64 h-64 -rotate-90">
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="6" className="stroke-muted" />
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="6" strokeLinecap="round" className={cn("transition-[stroke-dashoffset]", left === 0 && t.duration ? "stroke-red-500" : "stroke-primary")} strokeDasharray={339.3} strokeDashoffset={339.3 * (1 - left / (t.duration || 1))} />
              </svg>
              <p className="absolute inset-0 flex items-center justify-center font-mono text-5xl font-semibold tabular-nums">{fmt(left, false)}</p>
            </div>
            {t.endsAt === null && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {[1, 3, 5, 10, 15, 25, 30, 60].map((m) => <button key={m} type="button" onClick={() => setDuration(m * 60000)} className={cn("h-7 px-2.5 rounded-md border text-xs", t.duration === m * 60000 ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>{m} min</button>)}
                <Input type="number" min={1} placeholder="min" aria-label="Custom minutes" className="w-20 h-7 text-xs" onChange={(e) => { const v = Number(e.target.value); if (v > 0) setDuration(v * 60000); }} />
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="lg" onClick={() => setDuration(t.duration)}><RotateCcw /> Reset</Button>
              <Button size="lg" onClick={() => { toggleTimer(); if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); }} disabled={!t.duration} className="w-32">{t.endsAt !== null ? <><Pause /> Pause</> : <><Play /> Start</>}</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Keeps running in background tabs; beeps and notifies when done.</p>
          </ToolPanel>
        )}
      </div>
    </ToolLayout>
  );
}
