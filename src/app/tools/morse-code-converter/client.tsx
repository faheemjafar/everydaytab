"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Play, Square } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ClearButton, CodeArea, CopyButton, Segmented, SliderField, SplitLayout, ToolAlert, ToolPanel } from "@/components/tool";

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
  N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...",
  ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", _: "..--.-", '"': ".-..-.", $: "...-..-", "@": ".--.-.",
};
const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

function toMorse(s: string) {
  const unknown = new Set<string>();
  const out = s
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => Array.from(w).map((c) => MORSE[c] ?? (unknown.add(c), "")).filter(Boolean).join(" "))
    .join(" / ");
  return { out, unknown: [...unknown] };
}

function fromMorse(s: string) {
  const unknown = new Set<string>();
  // Normalise lookalike characters people paste (•, ·, —, _).
  const norm = s.replace(/[•·∙]/g, ".").replace(/[—–_−]/g, "-").trim();
  const out = norm
    .split(/\s*(?:\/|\|| {3,}|\n)\s*/)
    .map((w) => w.split(/\s+/).filter(Boolean).map((c) => REVERSE[c] ?? (unknown.add(c), "�")).join(""))
    .join(" ");
  return { out, unknown: [...unknown] };
}

export default function MorseCodeConverter() {
  const [mode, setMode] = useState<"toMorse" | "fromMorse">("toMorse");
  const [input, setInput] = useState("SOS Hello world");
  const [wpm, setWpm] = useState(18);
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const r = useMemo(() => (mode === "toMorse" ? toMorse(input) : fromMorse(input)), [input, mode]);
  const morse = mode === "toMorse" ? r.out : input;

  const stop = () => {
    ctxRef.current?.close();
    ctxRef.current = null;
    setPlaying(false);
  };
  useEffect(() => () => { ctxRef.current?.close(); }, []);

  // Schedules the whole message on the Web Audio clock (PARIS timing: dot = 1.2 / wpm s).
  const play = () => {
    stop();
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const unit = 1.2 / wpm;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 650;
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    let t = ctx.currentTime + 0.05;
    for (const ch of morse) {
      if (ch === "." || ch === "-") {
        const d = ch === "." ? unit : unit * 3;
        gain.gain.setTargetAtTime(0.4, t, 0.004);
        gain.gain.setTargetAtTime(0, t + d, 0.004);
        t += d + unit;
      } else if (ch === " ") t += unit * 2;
      else if (ch === "/") t += unit * 2;
    }
    osc.start();
    osc.stop(t + 0.1);
    osc.onended = () => { if (ctxRef.current === ctx) stop(); };
    setPlaying(true);
  };

  return (
    <ToolLayout toolId="morse-code-converter">
      <div className="space-y-3">
        <ToolPanel bodyClassName="p-3 flex flex-wrap items-end gap-4">
          <Segmented
            value={mode}
            onChange={(m) => { setMode(m); setInput(r.out); }}
            options={[
              { value: "toMorse", label: "Text → Morse" },
              { value: "fromMorse", label: "Morse → Text" },
            ]}
          />
          <Button variant="outline" size="sm" onClick={() => { setMode(mode === "toMorse" ? "fromMorse" : "toMorse"); setInput(r.out); }}>
            <ArrowUpDown /> Swap
          </Button>
          <SliderField label="Playback speed" value={wpm} onChange={setWpm} min={5} max={40} format={(v) => `${v} WPM`} className="w-48 ml-auto" />
          <Button onClick={playing ? stop : play} disabled={!morse.trim()} variant={playing ? "outline" : "default"}>
            {playing ? <Square /> : <Play />} {playing ? "Stop" : "Play sound"}
          </Button>
        </ToolPanel>
        <SplitLayout>
          <ToolPanel title={mode === "toMorse" ? "Text" : "Morse code"} actions={<ClearButton onClick={() => setInput("")} iconOnly disabled={!input} />}>
            <CodeArea value={input} onChange={(e) => setInput(e.target.value)} minHeight={220} placeholder={mode === "toMorse" ? "Type text…" : "... --- ... / .... . .-.. .-.. ---"} />
          </ToolPanel>
          <ToolPanel title={mode === "toMorse" ? "Morse code" : "Text"} actions={<CopyButton text={r.out} iconOnly />}>
            <CodeArea value={r.out} readOnly minHeight={220} />
          </ToolPanel>
        </SplitLayout>
        {r.unknown.length > 0 && <ToolAlert tone="warning">No Morse equivalent for: {r.unknown.map((u) => `“${u}”`).join(" ")} — skipped.</ToolAlert>}
        <p className="text-[11px] text-muted-foreground px-0.5">Letters are separated by spaces and words by “/”. When decoding, • · — and _ are accepted too.</p>
      </div>
    </ToolLayout>
  );
}
