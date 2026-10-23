"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldGrid, Segmented, Stat, StatGrid, ToolPanel } from "@/components/tool";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { cn } from "@/lib/utils";

type Phase = "focus" | "short" | "long";
interface Settings { focus: number; short: number; long: number; every: number; autoStart: boolean; sound: boolean; wakeLock: boolean }
interface Session { phase: Phase; endsAt: number | null; remaining: number; round: number; task: string; day: string; doneToday: number; focusMsToday: number }

const settings = createLocalStore<Settings>("pomodoro-settings", { focus: 25, short: 5, long: 15, every: 4, autoStart: false, sound: true, wakeLock: true });
const session = createLocalStore<Session>("pomodoro-session", { phase: "focus", endsAt: null, remaining: 25 * 60000, round: 0, task: "", day: "", doneToday: 0, focusMsToday: 0 });

const PHASE: Record<Phase, { label: string; ring: string }> = {
  focus: { label: "Focus", ring: "stroke-primary" },
  short: { label: "Short break", ring: "stroke-emerald-500" },
  long: { label: "Long break", ring: "stroke-sky-500" },
};

const fmt = (ms: number) => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
const dayKey = (t: number) => new Date(t).toDateString();

function chime(kind: Phase) {
  try {
    const ctx = new AudioContext();
    const notes = kind === "focus" ? [660, 880] : [880, 660, 523];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.4);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.3);
      o.stop(ctx.currentTime + i * 0.3 + 0.4);
    });
  } catch { /* audio unavailable */ }
}

// Wall clock: first value on the next frame (keeps SSR/hydration consistent), then fast while running.
function useNow(fast: boolean) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    const id = setInterval(() => setNow(Date.now()), fast ? 250 : 30000);
    return () => { cancelAnimationFrame(raf); clearInterval(id); };
  }, [fast]);
  return now;
}

export default function Pomodoro() {
  const [cfg, setCfg] = useLocalStore(settings);
  const [s, setS] = useLocalStore(session);
  const running = s.endsAt !== null;
  const now = useNow(running);
  const durationOf = (p: Phase) => cfg[p] * 60000;
  const left = running && now ? Math.max(0, s.endsAt! - now) : s.remaining;
  const duration = durationOf(s.phase);
  const lock = useWakeLock(running && cfg.wakeLock);

  const nextPhase = (x: Session): Phase => (x.phase !== "focus" ? "focus" : (x.round + 1) % cfg.every === 0 ? "long" : "short");

  // Finish the current phase: tally, advance, optionally auto-start the next one.
  const advance = (x: Session, auto: boolean, t: number): Session => {
    const day = dayKey(t);
    const sameDay = x.day === day;
    const finishedFocus = x.phase === "focus";
    const next = nextPhase(x);
    const dur = durationOf(next);
    return {
      ...x,
      phase: next,
      round: finishedFocus ? x.round + 1 : x.round,
      day,
      doneToday: (sameDay ? x.doneToday : 0) + (finishedFocus ? 1 : 0),
      focusMsToday: (sameDay ? x.focusMsToday : 0) + (finishedFocus ? durationOf("focus") : 0),
      endsAt: auto ? t + dur : null,
      remaining: dur,
    };
  };

  const toggle = () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
    setS((x) => (x.endsAt === null ? { ...x, endsAt: Date.now() + x.remaining } : { ...x, remaining: Math.max(0, x.endsAt - Date.now()), endsAt: null }));
  };
  const skip = () => setS((x) => advance(x, false, Date.now()));
  const reset = () => setS((x) => ({ ...x, endsAt: null, remaining: durationOf(x.phase) }));
  const setPhase = (p: Phase) => setS((x) => ({ ...x, phase: p, endsAt: null, remaining: durationOf(p) }));
  const updateCfg = (patch: Partial<Settings>) => {
    setCfg((c) => ({ ...c, ...patch }));
    if (!running) setS((x) => ({ ...x, remaining: ({ ...cfg, ...patch })[x.phase] * 60000 }));
  };

  // Phase completion: chime, notify, advance. The handler is kept in a ref so the
  // timeout is only re-armed when the deadline itself changes.
  const onDone = useRef<() => void>(() => {});
  useEffect(() => {
    onDone.current = () => {
      const t = Date.now();
      if (cfg.sound) chime(s.phase);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(s.phase === "focus" ? "Focus session complete" : "Break over", { body: s.phase === "focus" ? `Time for a ${nextPhase(s) === "long" ? "long" : "short"} break.` : "Back to focus." });
      }
      setS((x) => advance(x, cfg.autoStart, t));
    };
  });
  useEffect(() => {
    if (s.endsAt === null) return;
    const id = setTimeout(() => onDone.current(), Math.max(0, s.endsAt - Date.now()));
    return () => clearTimeout(id);
  }, [s.endsAt]);

  const baseTitle = useRef("");
  useEffect(() => { baseTitle.current = document.title; return () => { document.title = baseTitle.current; }; }, []);
  useEffect(() => { document.title = running ? `${fmt(left)} · ${PHASE[s.phase].label}` : baseTitle.current; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      else if (e.key.toLowerCase() === "r") reset();
      else if (e.key.toLowerCase() === "s") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const today = now && s.day === dayKey(now) ? s : { doneToday: 0, focusMsToday: 0 };
  const C = 339.3;

  return (
    <ToolLayout toolId="pomodoro-timer">
      <div className="space-y-3 max-w-2xl mx-auto">
        <ToolPanel bodyClassName="py-8 flex flex-col items-center gap-5">
          <Segmented value={s.phase} onChange={setPhase} options={(["focus", "short", "long"] as Phase[]).map((p) => ({ value: p, label: PHASE[p].label }))} />
          <div className="relative">
            <svg viewBox="0 0 120 120" className="w-64 h-64 -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" strokeWidth="6" className="stroke-muted" />
              <circle cx="60" cy="60" r="54" fill="none" strokeWidth="6" strokeLinecap="round" className={cn("transition-[stroke-dashoffset] duration-300", PHASE[s.phase].ring)} strokeDasharray={C} strokeDashoffset={C * (1 - left / (duration || 1))} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-mono text-5xl font-semibold tabular-nums">{fmt(left)}</p>
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground mt-1">Round {s.round % cfg.every + 1} of {cfg.every}</p>
            </div>
          </div>
          <Input value={s.task} onChange={(e) => setS((x) => ({ ...x, task: e.target.value }))} placeholder="What are you working on?" className="max-w-xs text-center h-8" aria-label="Current task" />
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={reset} aria-label="Reset"><RotateCcw /></Button>
            <Button size="lg" onClick={toggle} className="w-36">{running ? <><Pause /> Pause</> : <><Play /> {left !== duration ? "Resume" : "Start"}</>}</Button>
            <Button variant="outline" size="lg" onClick={skip} aria-label="Skip phase"><SkipForward /></Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Space start/pause · S skip · R reset {running && cfg.wakeLock && lock === "active" && "· screen kept awake"}</p>
        </ToolPanel>

        <StatGrid className="sm:grid-cols-3 lg:grid-cols-3">
          <Stat label="Sessions today" value={today.doneToday} />
          <Stat label="Focus time today" value={`${Math.round(today.focusMsToday / 60000)} min`} />
          <Stat label="Next" value={PHASE[nextPhase(s)].label} hint={`${cfg[nextPhase(s)]} min`} />
        </StatGrid>

        <ToolPanel title="Settings" bodyClassName="p-3.5 space-y-4">
          <FieldGrid cols={4}>
            {(["focus", "short", "long"] as Phase[]).map((p) => (
              <Field key={p} label={`${PHASE[p].label} (min)`} htmlFor={`d-${p}`}>
                <Input id={`d-${p}`} type="number" min={1} max={180} value={cfg[p]} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= 180) updateCfg({ [p]: v } as Pick<Settings, Phase>); }} />
              </Field>
            ))}
            <Field label="Long break every" htmlFor="every" hint="focus sessions">
              <Input id="every" type="number" min={1} max={12} value={cfg.every} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= 12) updateCfg({ every: v }); }} />
            </Field>
          </FieldGrid>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Auto-start next phase" inline><Switch checked={cfg.autoStart} onCheckedChange={(v) => updateCfg({ autoStart: v })} /></Field>
            <Field label="Sound" inline><Switch checked={cfg.sound} onCheckedChange={(v) => updateCfg({ sound: v })} /></Field>
            <Field label={<span className="inline-flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> Keep screen awake</span>} inline><Switch checked={cfg.wakeLock} onCheckedChange={(v) => updateCfg({ wakeLock: v })} /></Field>
          </div>
        </ToolPanel>
      </div>
    </ToolLayout>
  );
}
