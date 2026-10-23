"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Segmented, Stat, StatGrid, ToolPanel } from "@/components/tool";
import { createLocalStore, useLocalStore, useMounted } from "@/lib/local-store";
import { cn } from "@/lib/utils";

const PASSAGES = [
  "Small steps make steady progress. Choose one useful task and give it your full attention. A quiet room and a clear plan can help you work with care. Take a short break, stretch your hands, and return with fresh eyes. Speed will come with practice, but accuracy should always come first.",
  "The morning light fell across the garden path. Birds moved between the branches while a cool breeze carried the scent of rain. Beyond the gate, a cyclist stopped to read a map. There was no need to hurry. The best part of the journey was finding something new along the way.",
  "Good design makes everyday work feel simple. Each button should have a clear purpose, and every message should help someone take the next step. Test your ideas with real people, listen to their questions, and improve one detail at a time. A thoughtful change can make a big difference.",
];
// One long fixed passage so results are comparable and a fast typist can't run out of text.
const TEXT = Array.from({ length: 12 }, () => PASSAGES.join(" ")).join(" ");
const WINDOW = 180;

type Duration = "30" | "60" | "120";
interface Result { at: number; seconds: number; wpm: number; accuracy: number }
interface Attempt { input: string; started: number; now: number; finished: boolean; typed: number; mistakes: number }
const EMPTY: Attempt = { input: "", started: 0, now: 0, finished: false, typed: 0, mistakes: 0 };
const historyStore = createLocalStore<Result[]>("typing-test-history", []);

const countCorrect = (input: string) => { let n = 0; for (let i = 0; i < input.length; i++) if (input[i] === TEXT[i]) n++; return n; };

export default function TypingTest() {
  const mounted = useMounted();
  const [duration, setDuration] = useState<Duration>("60");
  const [a, setA] = useState<Attempt>(EMPTY);
  const [history, setHistory] = useLocalStore(historyStore);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const limit = Number(duration) * 1000;
  const running = a.started > 0 && !a.finished;

  const elapsedMs = a.started ? Math.min(limit, a.now - a.started) : 0;
  const correct = countCorrect(a.input);
  const wpm = elapsedMs > 0 ? Math.round(correct / 5 / (elapsedMs / 60000)) : 0;
  const accuracy = a.typed ? Math.round((100 * (a.typed - a.mistakes)) / a.typed) : 100;

  // Tick while running; the finishing tick also records the result.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setA((x) => ({ ...x, now: Date.now(), finished: Date.now() - x.started >= limit })), 100);
    return () => clearInterval(id);
  }, [running, limit]);

  const recorded = useRef(0);
  useEffect(() => {
    if (!a.finished || recorded.current === a.started) return;
    recorded.current = a.started;
    setHistory((h) => [{ at: a.now, seconds: limit / 1000, wpm, accuracy }, ...h].slice(0, 10));
  }, [a.finished, a.started, a.now, limit, wpm, accuracy, setHistory]);

  const reset = (d: Duration = duration) => {
    setDuration(d);
    setA(EMPTY);
    inputRef.current?.focus();
  };

  const onType = (value: string) => {
    if (a.finished) return;
    const now = Date.now();
    if (a.started && now - a.started >= limit) { setA((x) => ({ ...x, now, finished: true })); return; }
    // Only pure appends or backspaces are accepted; mistakes stay in the accuracy denominator after correction.
    if (!value.startsWith(a.input) && !a.input.startsWith(value)) return;
    const added = value.length > a.input.length ? value.slice(a.input.length) : "";
    let errors = 0;
    for (let i = 0; i < added.length; i++) if (added[i] !== TEXT[a.input.length + i]) errors++;
    setA({ input: value, started: a.started || now, now, finished: false, typed: a.typed + added.length, mistakes: a.mistakes + errors });
  };

  const offset = Math.floor(a.input.length / WINDOW) * WINDOW;
  const visible = TEXT.slice(offset, offset + WINDOW * 2);

  return (
    <ToolLayout toolId="typing-test">
      <div className="max-w-3xl mx-auto space-y-3">
        <ToolPanel
          title="Typing test"
          actions={<Segmented size="sm" value={duration} onChange={reset} options={(["30", "60", "120"] as Duration[]).map((v) => ({ value: v, label: `${v}s` }))} />}
          bodyClassName="p-4 space-y-4"
        >
          <div className="rounded-md border border-border bg-muted/30 p-4 font-mono text-[17px] leading-8 whitespace-pre-wrap break-words select-none" aria-label="Passage to type" onClick={() => inputRef.current?.focus()}>
            {visible.split("").map((c, i) => {
              const idx = offset + i;
              const typed = idx < a.input.length;
              return (
                <span key={idx} className={cn(typed ? (a.input[idx] === c ? "text-foreground" : "text-destructive bg-destructive/10 underline decoration-destructive") : "text-muted-foreground", idx === a.input.length && "border-l-2 border-primary -ml-px")}>
                  {c}
                </span>
              );
            })}
          </div>
          <Textarea
            ref={inputRef}
            value={a.input}
            onChange={(e) => onType(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            readOnly={a.finished}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="Type the passage here"
            placeholder={a.finished ? "Time's up — press Try again" : "Click here and start typing — the timer starts on your first key"}
            className="font-mono h-24 resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <p role="status" className="text-xs text-muted-foreground">{a.finished ? "Finished — result saved to your history on this device." : running ? "Test in progress…" : "Paste is disabled. Backspace to correct mistakes."}</p>
            <Button size="lg" onClick={() => reset()} disabled={!a.started}><RotateCcw /> Try again</Button>
          </div>
        </ToolPanel>

        <StatGrid className="sm:grid-cols-3 lg:grid-cols-3">
          <Stat label="Time left" value={`${Math.max(0, Math.ceil((limit - elapsedMs) / 1000))}s`} />
          <Stat label="Words / min" value={wpm} hint="5 correct characters = 1 word" />
          <Stat label="Accuracy" value={`${accuracy}%`} hint={`${a.mistakes} mistake${a.mistakes === 1 ? "" : "s"}`} />
        </StatGrid>

        {history.length > 0 && (
          <ToolPanel title={`Recent results · ${history.length}`} actions={<Button size="sm" variant="ghost" onClick={() => setHistory([])}>Clear history</Button>}>
            <table className="w-full text-[13px] tabular-nums">
              <thead className="text-[11px] text-muted-foreground"><tr><th className="text-left font-medium px-3.5 py-1.5">When</th><th className="text-right font-medium px-3.5">Duration</th><th className="text-right font-medium px-3.5">WPM</th><th className="text-right font-medium px-3.5">Accuracy</th></tr></thead>
              <tbody className="divide-y divide-border">
                {history.map((r, i) => (
                  <tr key={`${r.at}-${i}`}><td className="px-3.5 py-1.5">{mounted ? new Date(r.at).toLocaleString() : ""}</td><td className="text-right px-3.5">{r.seconds}s</td><td className="text-right px-3.5 font-semibold">{r.wpm}</td><td className="text-right px-3.5">{r.accuracy}%</td></tr>
                ))}
              </tbody>
            </table>
          </ToolPanel>
        )}
      </div>
    </ToolLayout>
  );
}
