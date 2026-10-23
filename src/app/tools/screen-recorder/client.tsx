"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, Download, Mic, Monitor, Pause, Play, Square } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, OptionsLayout, PrivacyNote, Segmented, Stat, StatusBadge, ToolAlert, ToolPanel, formatBytes } from "@/components/tool";

type Quality = "720" | "1080" | "native";
const QUALITY: Record<Quality, { label: string; height?: number; bps: number }> = {
  "720": { label: "720p", height: 720, bps: 2_500_000 },
  "1080": { label: "1080p", height: 1080, bps: 5_000_000 },
  native: { label: "Native", bps: 8_000_000 },
};
const MIME_CANDIDATES = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
const pickMime = () => (typeof MediaRecorder === "undefined" ? "" : MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "");
const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function ScreenRecorder() {
  const [mic, setMic] = useState(true);
  const [systemAudio, setSystemAudio] = useState(true);
  const [quality, setQuality] = useState<Quality>("1080");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "recording" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState<{ url: string; blob: Blob; seconds: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const liveRef = useRef<HTMLVideoElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const tracks = useRef<MediaStreamTrack[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);
  const startedAt = useRef(0);
  const pausedFor = useRef(0);
  const pausedAt = useRef(0);

  useEffect(() => () => { tracks.current.forEach((t) => t.stop()); audioCtx.current?.close(); }, []);
  useEffect(() => { if (liveRef.current) liveRef.current.srcObject = stream; }, [stream]);
  useEffect(() => {
    if (state !== "recording") return;
    const t = setInterval(() => setElapsed((Date.now() - startedAt.current - pausedFor.current) / 1000), 250);
    return () => clearInterval(t);
  }, [state]);

  const stopAll = () => {
    tracks.current.forEach((t) => t.stop());
    tracks.current = [];
    audioCtx.current?.close();
    audioCtx.current = null;
    setStream(null);
  };

  // Capture the screen (plus optional tab/system audio) and mix in the microphone.
  const share = async () => {
    setError(null);
    try {
      const h = QUALITY[quality].height;
      const display = await navigator.mediaDevices.getDisplayMedia({ video: h ? { height: { ideal: h }, frameRate: { ideal: 30 } } : { frameRate: { ideal: 30 } }, audio: systemAudio });
      let micStream: MediaStream | null = null;
      if (mic) {
        try { micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
        catch { setError("Microphone access was denied — recording screen without your voice."); }
      }
      const audioTracks = [...display.getAudioTracks(), ...(micStream?.getAudioTracks() ?? [])];
      const mixed = new MediaStream(display.getVideoTracks());
      if (audioTracks.length > 1) {
        const ctx = new AudioContext();
        const dest = ctx.createMediaStreamDestination();
        for (const t of audioTracks) ctx.createMediaStreamSource(new MediaStream([t])).connect(dest);
        audioCtx.current = ctx;
        dest.stream.getAudioTracks().forEach((t) => mixed.addTrack(t));
      } else audioTracks.forEach((t) => mixed.addTrack(t));
      tracks.current = [...display.getTracks(), ...(micStream?.getTracks() ?? [])];
      display.getVideoTracks()[0]?.addEventListener("ended", () => { if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop(); stopAll(); });
      setStream(mixed);
    } catch (e) {
      const name = (e as DOMException).name;
      setError(name === "NotAllowedError" ? "Screen sharing was cancelled or blocked." : name === "NotSupportedError" || typeof navigator.mediaDevices?.getDisplayMedia !== "function" ? "Screen recording isn't supported in this browser. Use a desktop Chrome, Edge, Firefox or Safari." : (e as Error).message || "Couldn't start screen capture.");
    }
  };

  const start = () => {
    if (!stream) return;
    const mimeType = pickMime();
    chunks.current = [];
    const rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: QUALITY[quality].bps });
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks.current, { type: rec.mimeType || "video/webm" });
      const seconds = (Date.now() - startedAt.current - pausedFor.current) / 1000;
      setClip((old) => { if (old) URL.revokeObjectURL(old.url); return { url: URL.createObjectURL(blob), blob, seconds }; });
      setState("idle");
    };
    startedAt.current = Date.now();
    pausedFor.current = 0;
    rec.start(1000);
    recRef.current = rec;
    setElapsed(0);
    setState("recording");
  };
  const pause = () => { recRef.current?.pause(); pausedAt.current = Date.now(); setState("paused"); };
  const resume = () => { pausedFor.current += Date.now() - pausedAt.current; recRef.current?.resume(); setState("recording"); };
  const stop = () => recRef.current && recRef.current.state !== "inactive" && recRef.current.stop();

  const download = () => {
    if (!clip) return;
    const a = document.createElement("a");
    a.href = clip.url;
    a.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${clip.blob.type.includes("mp4") ? "mp4" : "webm"}`;
    a.click();
  };

  const options = (
    <ToolPanel title="Recording" bodyClassName="p-3 space-y-4" footer={<PrivacyNote>Recorded in your browser; nothing is uploaded.</PrivacyNote>}>
      <Field label="Quality">
        <Segmented value={quality} onChange={setQuality} options={(Object.keys(QUALITY) as Quality[]).map((q) => ({ value: q, label: QUALITY[q].label }))} size="sm" />
      </Field>
      <Field label={<span className="inline-flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> Microphone</span>} inline>
        <Switch checked={mic} onCheckedChange={setMic} disabled={!!stream} />
      </Field>
      <Field label="System / tab audio" hint="Offered by Chrome and Edge when sharing a tab or screen" inline>
        <Switch checked={systemAudio} onCheckedChange={setSystemAudio} disabled={!!stream} />
      </Field>
      {!stream ? (
        <Button size="lg" onClick={share} className="w-full"><Monitor /> Choose what to share</Button>
      ) : state === "idle" ? (
        <div className="space-y-2">
          <Button size="lg" onClick={start} className="w-full"><Circle className="fill-current text-red-500" /> Start recording</Button>
          <Button variant="ghost" onClick={stopAll} className="w-full">Stop sharing</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Button size="lg" variant="destructive" onClick={stop} className="w-full"><Square className="fill-current" /> Stop · {fmtTime(elapsed)}</Button>
          <Button variant="outline" onClick={state === "paused" ? resume : pause} className="w-full">{state === "paused" ? <><Play /> Resume</> : <><Pause /> Pause</>}</Button>
        </div>
      )}
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="screen-recorder">
      <OptionsLayout options={options}>
        <ToolPanel title="Preview" actions={state !== "idle" ? <StatusBadge tone={state === "paused" ? "warning" : "error"}>{state === "paused" ? "Paused" : "● REC"} {fmtTime(elapsed)}</StatusBadge> : stream ? <StatusBadge tone="success">Sharing</StatusBadge> : null}>
          <div className="aspect-video bg-stone-950 flex items-center justify-center">
            {stream ? (
              <video ref={liveRef} autoPlay muted playsInline className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-stone-400 space-y-2">
                <Monitor className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-sm">Choose a screen, window or tab to begin</p>
              </div>
            )}
          </div>
        </ToolPanel>

        {clip && (
          <ToolPanel
            title="Your recording"
            actions={<StatusBadge>{clip.blob.type.includes("mp4") ? "MP4" : "WebM"}</StatusBadge>}
            footer={<><span className="flex-1" /><Button variant="outline" onClick={download}><Download /> Download</Button></>}
          >
            <video src={clip.url} controls className="w-full aspect-video bg-stone-950" />
            <div className="grid grid-cols-2 gap-2 p-3">
              <Stat label="Duration" value={fmtTime(clip.seconds)} />
              <Stat label="Size" value={formatBytes(clip.blob.size)} />
            </div>
          </ToolPanel>
        )}
        {error && <ToolAlert tone={stream ? "warning" : "error"}>{error}</ToolAlert>}
        <ToolAlert tone="info">Switching to another tab or window while recording is fine — the recorder keeps going until you press Stop or end sharing from the browser bar.</ToolAlert>
      </OptionsLayout>
    </ToolLayout>
  );
}
