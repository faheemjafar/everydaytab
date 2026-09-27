"use client";

import { useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { FileJson, Pause, Play, Repeat, RotateCcw } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { ColorField, Field, FileDropzone, OptionsLayout, Segmented, SliderField, Stat, StatGrid, ToolAlert, ToolPanel, formatBytes } from "@/components/tool";

interface LottieJson {
  v: string;
  fr: number;
  ip: number;
  op: number;
  w: number;
  h: number;
  nm?: string;
  layers: unknown[];
  assets?: unknown[];
}

export default function LottiePreviewer() {
  const [data, setData] = useState<LottieJson | null>(null);
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);
  const [playing, setPlaying] = useState(true);
  const [loop, setLoop] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [frame, setFrame] = useState(0);
  const [bg, setBg] = useState<"checker" | "light" | "dark" | "custom">("checker");
  const [custom, setCustom] = useState("#ffffff");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<LottieRefCurrentProps>(null);

  const load = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null);
    try {
      const json = JSON.parse(await f.text());
      if (!json.v || !Array.isArray(json.layers)) throw new Error("This JSON isn't a Lottie animation (missing v / layers).");
      setData(json);
      setMeta({ name: f.name, size: f.size });
      setPlaying(true);
      setFrame(0);
    } catch (e) {
      setError((e as Error).message || "Failed to parse the Lottie file.");
    }
  };

  const toggle = () => {
    if (playing) ref.current?.pause();
    else ref.current?.play();
    setPlaying(!playing);
  };

  if (!data) {
    return (
      <ToolLayout toolId="lottie-preview">
        <div className="space-y-3">
          <FileDropzone onFiles={load} accept="application/json,.json,.lottie" icon={<FileJson className="w-5 h-5" />} title="Drop a Lottie JSON file" hint="Exported from After Effects (Bodymovin), LottieFiles or similar." className="min-h-72" />
          {error && <ToolAlert tone="error">{error}</ToolAlert>}
        </div>
      </ToolLayout>
    );
  }

  const total = Math.max(1, data.op - data.ip);
  const duration = total / (data.fr || 30);
  const background = bg === "light" ? "#ffffff" : bg === "dark" ? "#1c1917" : bg === "custom" ? custom : undefined;

  const options = (
    <ToolPanel title="Playback" bodyClassName="p-3 space-y-4">
      <div className="flex gap-1.5">
        <Button onClick={toggle} className="flex-1">
          {playing ? <Pause /> : <Play />} {playing ? "Pause" : "Play"}
        </Button>
        <Button variant="outline" size="icon" onClick={() => { ref.current?.goToAndPlay(0, true); setPlaying(true); }} aria-label="Restart">
          <RotateCcw />
        </Button>
        <Button variant={loop ? "soft" : "outline"} size="icon" onClick={() => setLoop(!loop)} aria-pressed={loop} aria-label="Loop">
          <Repeat />
        </Button>
      </div>
      <SliderField
        label="Speed"
        value={speed}
        onChange={(v) => { setSpeed(v); ref.current?.setSpeed(v); }}
        min={0.25}
        max={3}
        step={0.25}
        format={(v) => `${v}×`}
      />
      <SliderField
        label="Frame"
        value={frame}
        onChange={(v) => { setFrame(v); ref.current?.goToAndStop(v, true); setPlaying(false); }}
        min={0}
        max={total}
        format={(v) => `${Math.round(v)} / ${total}`}
      />
      <Field label="Background">
        <Segmented
          size="sm"
          value={bg}
          onChange={setBg}
          options={[
            { value: "checker", label: "Grid" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "custom", label: "Custom" },
          ]}
        />
      </Field>
      {bg === "custom" && <ColorField value={custom} onChange={setCustom} />}
    </ToolPanel>
  );

  return (
    <ToolLayout toolId="lottie-preview">
      <OptionsLayout options={options}>
        <ToolPanel
          title={<span className="normal-case tracking-normal font-medium text-foreground">{meta?.name}</span>}
          actions={
            <label className="inline-flex items-center h-7 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">
              Replace
              <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => { if (e.target.files) load(Array.from(e.target.files)); e.target.value = ""; }} />
            </label>
          }
        >
          <div
            className={bg === "checker" ? "flex items-center justify-center p-6 min-h-[420px] bg-[conic-gradient(#0000000d_25%,transparent_0_50%,#0000000d_0_75%,transparent_0)] bg-[length:16px_16px]" : "flex items-center justify-center p-6 min-h-[420px]"}
            style={background ? { background } : undefined}
          >
            <div className="w-full max-w-md" style={{ aspectRatio: `${data.w} / ${data.h}` }}>
              <Lottie lottieRef={ref} animationData={data} loop={loop} autoplay onEnterFrame={(e) => setFrame(Math.round((e as unknown as { currentTime: number }).currentTime))} onComplete={() => setPlaying(false)} />
            </div>
          </div>
        </ToolPanel>
        <StatGrid>
          <Stat label="Size" value={`${data.w} × ${data.h}`} />
          <Stat label="Frame rate" value={`${data.fr} fps`} />
          <Stat label="Duration" value={`${duration.toFixed(2)} s`} hint={`${total} frames`} />
          <Stat label="Layers" value={data.layers.length} hint={`${data.assets?.length ?? 0} assets · v${data.v}`} />
        </StatGrid>
        {meta && <p className="text-[11px] text-muted-foreground">{formatBytes(meta.size)} JSON</p>}
      </OptionsLayout>
    </ToolLayout>
  );
}
