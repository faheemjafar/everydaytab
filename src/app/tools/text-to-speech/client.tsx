"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGrid, PrivacyNote, ToolAlert, ToolPanel } from "@/components/tool";
import { useMounted } from "@/lib/local-store";

export default function TextToSpeech() {
  const mounted = useMounted();
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [state, setState] = useState<"idle" | "speaking" | "paused">("idle");
  const [error, setError] = useState("");
  const token = useRef(0);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const supported = mounted && "speechSynthesis" in window;
  const selected = voices.find((v) => v.voiceURI === voiceURI) ?? voices[0];

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const session = token;
    const refresh = () => setVoices(synth.getVoices().filter((v) => v.localService));
    const id = setTimeout(refresh, 0);
    synth.addEventListener("voiceschanged", refresh);
    return () => { clearTimeout(id); synth.removeEventListener("voiceschanged", refresh); session.current++; synth.cancel(); };
  }, []);

  function stop() {
    token.current++;
    window.speechSynthesis.cancel();
    utterance.current = null;
    setState("idle");
  }
  function speak() {
    if (!selected || !text.trim()) return;
    stop();
    setError("");
    const session = token.current;
    // Short utterances avoid browser limits when reading long paragraphs.
    const parts = text.match(/[\s\S]{1,220}(?:\s|$)|[\s\S]{1,220}/g) ?? [];
    let index = 0;
    const next = () => {
      if (session !== token.current) return;
      if (index === parts.length) { setState("idle"); utterance.current = null; return; }
      const u = new SpeechSynthesisUtterance(parts[index++]);
      u.voice = selected;
      u.lang = selected.lang;
      u.rate = rate; u.pitch = pitch; u.volume = volume;
      u.onend = next;
      u.onerror = (e) => {
        if (session !== token.current) return;
        setState("idle");
        setError(`Playback failed (${e.error}). Try another installed voice.`);
      };
      utterance.current = u;
      window.speechSynthesis.speak(u);
    };
    setState("speaking");
    next();
  }

  return (
    <ToolLayout toolId="text-to-speech">
      <div className="space-y-3 max-w-3xl mx-auto">
        <ToolPanel title="Read text aloud" bodyClassName="p-4 space-y-4">
          <Field label="Text" htmlFor="speech-text">
            <Textarea id="speech-text" value={text} onChange={(e) => setText(e.target.value)} disabled={state !== "idle"} placeholder="Paste or type something to read aloud…" className="min-h-56" maxLength={50000} />
          </Field>
          <Field label="Installed voice" htmlFor="speech-voice" hint="Only voices marked as local by your browser are offered.">
            <select id="speech-voice" className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={selected?.voiceURI ?? ""} onChange={(e) => setVoiceURI(e.target.value)} disabled={state !== "idle" || !voices.length}>
              {!voices.length && <option value="">No local voices available</option>}
              {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
            </select>
          </Field>
          <FieldGrid cols={3}>
            <Field label={`Speed · ${rate}×`} htmlFor="speech-rate"><input id="speech-rate" type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} disabled={state !== "idle"} className="w-full accent-primary" /></Field>
            <Field label={`Pitch · ${pitch}`} htmlFor="speech-pitch"><input id="speech-pitch" type="range" min={0.5} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} disabled={state !== "idle"} className="w-full accent-primary" /></Field>
            <Field label={`Volume · ${Math.round(volume * 100)}%`} htmlFor="speech-volume"><input id="speech-volume" type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} disabled={state !== "idle"} className="w-full accent-primary" /></Field>
          </FieldGrid>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="lg" disabled={!supported || !selected || !text.trim()} onClick={() => {
              if (state === "idle") speak();
              else if (state === "paused") { window.speechSynthesis.resume(); setState("speaking"); }
              else { window.speechSynthesis.pause(); setState("paused"); }
            }}>{state === "speaking" ? <><Pause /> Pause</> : <><Play /> {state === "paused" ? "Resume" : "Read aloud"}</>}</Button>
            <Button variant="outline" onClick={stop} disabled={state === "idle"}><Square /> Stop</Button>
            <span role="status" className="text-xs text-muted-foreground">{state === "speaking" ? "Reading…" : state === "paused" ? "Paused" : `${text.length.toLocaleString("en-US")} characters`}</span>
          </div>
        </ToolPanel>
        {mounted && !supported && <ToolAlert tone="warning">This browser does not support text to speech.</ToolAlert>}
        {supported && !voices.length && <ToolAlert tone="warning">No local voices were found. Install an offline voice in your device&apos;s language or accessibility settings, then reload this page. Some browsers expose only online voices; those are excluded.</ToolAlert>}
        {error && <ToolAlert tone="error">{error}</ToolAlert>}
        <p className="text-xs text-muted-foreground">Audio download is not available: browser speech playback does not expose an audio file. Voice quality and pause support depend on your browser and installed voices.</p>
        <PrivacyNote>Text is read using a local device voice; this tool does not upload it.</PrivacyNote>
      </div>
    </ToolLayout>
  );
}
