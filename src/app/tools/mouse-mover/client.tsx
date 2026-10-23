"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, MousePointer2, Play, Square, Volume2 } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, StatusBadge, ToolAlert, ToolPanel } from "@/components/tool";
import { createLocalStore, useLocalStore, useMounted } from "@/lib/local-store";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { cn } from "@/lib/utils";

interface Prefs { wakeLock: boolean; audio: boolean; autoStop: string; autoStopOn: boolean }
const prefs = createLocalStore<Prefs>("mouse-mover", { wakeLock: true, audio: true, autoStop: "", autoStopOn: false });

const IDLE_MS = 3000;

function fmt(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(t / 3600), Math.floor(t / 60) % 60, t % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

// "HH:MM" → next occurrence of that wall-clock time after `from`.
function nextOccurrence(hhmm: string, from: number) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const d = new Date(from);
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (d.getTime() <= from) d.setDate(d.getDate() + 1);
  return d.getTime();
}

// Near-silent looping tone: many OSes treat a tab playing audio as "busy" and won't idle-lock.
function useSilentAudio(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let ctx: AudioContext | null = null;
    try {
      ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 20;
      gain.gain.value = 0.001;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      ctx.resume();
    } catch {
      /* audio unavailable */
    }
    return () => { ctx?.close(); };
  }, [enabled]);
}

export default function MouseMover() {
  const mounted = useMounted();
  const [p, setP] = useLocalStore(prefs);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [userActive, setUserActive] = useState(false);
  const running = startedAt !== null;

  const stop = useCallback(() => { setStartedAt(null); setUserActive(false); }, []);
  const start = () => { const t = Date.now(); setStartedAt(t); setNow(t); };

  const lock = useWakeLock(running && p.wakeLock);
  useSilentAudio(running && p.audio);

  const autoStopAt = running && p.autoStopOn ? nextOccurrence(p.autoStop, startedAt) : null;

  // 1 Hz clock for the session timer and the auto-stop check.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (autoStopAt !== null && t >= autoStopAt) stop();
    }, 1000);
    return () => clearInterval(id);
  }, [running, autoStopAt, stop]);

  // Pause the simulated cursor while the user is actually using the machine.
  const idleTimer = useRef(0);
  useEffect(() => {
    if (!running) return;
    const onActivity = () => {
      setUserActive(true);
      clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setUserActive(false), IDLE_MS);
    };
    const events = ["mousemove", "keydown", "pointerdown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearTimeout(idleTimer.current);
    };
  }, [running]);

  // Drive the on-screen cursor with rAF + transforms so nothing re-renders per frame.
  const cursorRef = useRef<HTMLDivElement>(null);
  const moving = running && !userActive;
  useEffect(() => {
    const el = cursorRef.current;
    if (!moving || !el) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (t: number) => {
      const s = (t - t0) / 1000;
      const x = 50 + 36 * Math.sin(s * 0.9), y = 50 + 30 * Math.sin(s * 1.3 + 1);
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [moving]);

  // Live timer in the tab title while running.
  const baseTitle = useRef("");
  useEffect(() => {
    baseTitle.current = document.title;
    return () => { document.title = baseTitle.current; };
  }, []);
  const elapsed = running && now ? now - startedAt : 0;
  useEffect(() => {
    document.title = running ? `${fmt(elapsed)} · Mouse Mover` : baseTitle.current;
  });

  const status = !running ? { tone: "neutral" as const, label: "Inactive" } : userActive ? { tone: "warning" as const, label: "Paused — you're active" } : { tone: "success" as const, label: "Active" };

  return (
    <ToolLayout toolId="mouse-mover">
      <div className="space-y-3 max-w-2xl mx-auto">
        <ToolPanel bodyClassName="p-4 sm:p-6 flex flex-col items-center gap-5">
          <Button size="lg" onClick={running ? stop : start} variant={running ? "outline" : "default"} className="w-full">
            {running ? <><Square /> Stop</> : <><Play /> Start</>}
          </Button>

          <div className={cn("relative w-full max-w-xs aspect-[3/2] rounded-md border border-border bg-muted/40 overflow-hidden", running && "border-primary/50")} aria-hidden>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
            <div ref={cursorRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transition: moving ? "none" : "left .4s, top .4s" }}>
              <MousePointer2 className={cn("w-6 h-6 drop-shadow-none", running ? "text-primary" : "text-muted-foreground")} fill="currentColor" />
            </div>
          </div>

          <StatusBadge tone={status.tone} className="h-6 px-2 text-xs">{status.label}</StatusBadge>

          <div className="text-center">
            <p className="font-mono text-5xl sm:text-6xl font-semibold tabular-nums tracking-tight">{fmt(elapsed)}</p>
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground mt-1">Current session</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            <label className={cn("flex items-center justify-between gap-3 rounded-md border px-3 py-2 cursor-pointer", p.wakeLock ? "border-primary/50 bg-primary/5" : "border-border")}>
              <span className="flex items-center gap-2 text-sm font-medium"><Monitor className="w-4 h-4" /> Force screen awake</span>
              <Switch checked={p.wakeLock} onCheckedChange={(v) => setP((x) => ({ ...x, wakeLock: v }))} />
            </label>
            <label className={cn("flex items-center justify-between gap-3 rounded-md border px-3 py-2 cursor-pointer", p.audio ? "border-primary/50 bg-primary/5" : "border-border")}>
              <span className="flex items-center gap-2 text-sm font-medium"><Volume2 className="w-4 h-4" /> Silent audio mode</span>
              <Switch checked={p.audio} onCheckedChange={(v) => setP((x) => ({ ...x, audio: v }))} />
            </label>
          </div>

          {running && p.wakeLock && lock === "unsupported" && (
            <ToolAlert tone="warning" className="w-full">Your browser doesn&apos;t support the Screen Wake Lock API. Silent audio mode is still active, but keeping the screen on isn&apos;t guaranteed — try Chrome, Edge or Safari 16.4+.</ToolAlert>
          )}
          {running && p.wakeLock && lock === "denied" && (
            <ToolAlert tone="warning" className="w-full">The wake lock was refused (usually low-power mode or a background tab). Keep this tab visible and try again.</ToolAlert>
          )}
          <ToolAlert tone="info" className="w-full">
            Pauses automatically while you use your mouse or keyboard and resumes a few seconds after you stop. Keep this tab open — it can sit in the background.
          </ToolAlert>
        </ToolPanel>

        <ToolPanel title="Auto-stop">
          <div className="p-3.5">
            <Field label="Stop at" hint={autoStopAt !== null && mounted ? `Stops ${new Date(autoStopAt).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}` : "Schedule automatic shutdown at a time of day"} inline>
              <div className="flex items-center gap-3">
                <Input type="time" value={p.autoStop} onChange={(e) => setP((x) => ({ ...x, autoStop: e.target.value, autoStopOn: x.autoStopOn && !!e.target.value }))} className="w-32 h-8" aria-label="Auto-stop time" />
                <label className="flex items-center gap-2 text-xs font-medium">
                  <Switch size="sm" checked={p.autoStopOn} disabled={!p.autoStop} onCheckedChange={(v) => setP((x) => ({ ...x, autoStopOn: v }))} /> Enable
                </label>
              </div>
            </Field>
          </div>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
