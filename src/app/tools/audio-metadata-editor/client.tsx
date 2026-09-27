"use client";

import { useState } from "react";
import { ImagePlus, Tags, X } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { startLogCapture, stopLogCapture, useFFmpeg } from "@/hooks/use-ffmpeg";
import { AUDIO_FORMATS, Field, FieldGrid, MediaTool, StatusBadge, extOf, stem, useMediaFile } from "@/components/tool";

const FIELDS = [
  { key: "title", label: "Title" },
  { key: "artist", label: "Artist" },
  { key: "album", label: "Album" },
  { key: "album_artist", label: "Album artist" },
  { key: "date", label: "Year" },
  { key: "genre", label: "Genre" },
  { key: "track", label: "Track #" },
  { key: "composer", label: "Composer" },
  { key: "comment", label: "Comment" },
] as const;
type Key = (typeof FIELDS)[number]["key"];
type Meta = Record<Key, string>;
const EMPTY = Object.fromEntries(FIELDS.map((f) => [f.key, ""])) as Meta;

/** Parses the "Metadata:" block FFmpeg prints for the input. */
function parseTags(lines: string[]): { meta: Partial<Meta>; hasCover: boolean } {
  const meta: Partial<Meta> = {};
  let inMeta = false;
  for (const l of lines) {
    if (/^\s*Metadata:/.test(l)) {
      inMeta = true;
      continue;
    }
    if (/^\s*(Duration|Stream|Output|Input #1)/.test(l)) inMeta = false;
    const m = inMeta && l.match(/^\s+([A-Za-z_]+)\s*:\s?(.*)$/);
    if (m) {
      const k = m[1].toLowerCase() as Key;
      if (FIELDS.some((f) => f.key === k) && !meta[k]) meta[k] = m[2].trim();
      if (k === ("year" as Key) && !meta.date) meta.date = m[2].trim();
    }
  }
  return { meta, hasCover: lines.some((l) => /Video:.*(mjpeg|png)/i.test(l) || /attached pic/i.test(l)) };
}

export default function AudioMetadataEditor() {
  const engine = useFFmpeg({ lazy: true });
  const [meta, setMeta] = useState<Meta>(EMPTY);
  const [reading, setReading] = useState(false);
  const [hadCover, setHadCover] = useState(false);
  const [cover, setCover] = useState<{ file: File; url: string } | null>(null);
  const [stripOthers, setStripOthers] = useState(false);

  const media = useMediaFile("audio", async (_, file) => {
    setMeta(EMPTY);
    setHadCover(false);
    setReading(true);
    try {
      const ff = await engine.load();
      const name = `probe.${extOf(file.name, "mp3")}`;
      await ff.writeFile(name, await engine.fetchFile(file));
      startLogCapture();
      await ff.exec(["-hide_banner", "-i", name]).catch(() => {});
      const { meta: m, hasCover } = parseTags(stopLogCapture());
      await ff.deleteFile(name).catch(() => {});
      setMeta({ ...EMPTY, ...m });
      setHadCover(hasCover);
    } finally {
      setReading(false);
    }
  });

  const ext = extOf(media.file?.name ?? "", "mp3");
  const supportsCover = ["mp3", "m4a", "flac", "mp4", "aac"].includes(ext);

  const save = () =>
    media.process(async (ctx) => {
      const tags = FIELDS.flatMap((f) => (meta[f.key] ? ["-metadata", `${f.key}=${meta[f.key]}`] : stripOthers ? [] : ["-metadata", `${f.key}=`]));
      const out = `out.${ext}`;
      const mime = Object.values(AUDIO_FORMATS).find((f) => f.label.toLowerCase() === ext)?.mime ?? media.file!.type ?? "audio/mpeg";
      let args: string[];
      if (cover && supportsCover) {
        await ctx.write(`cover.${extOf(cover.file.name, "jpg")}`, cover.file);
        args = [
          "-i", ctx.input, "-i", `cover.${extOf(cover.file.name, "jpg")}`,
          "-map", "0:a", "-map", "1:0", "-c", "copy",
          ...(stripOthers ? ["-map_metadata", "-1"] : []),
          "-disposition:v:0", "attached_pic", "-metadata:s:v", "title=Album cover", "-metadata:s:v", "comment=Cover (front)",
          ...(ext === "mp3" ? ["-id3v2_version", "3"] : []),
          ...tags, out,
        ];
      } else {
        args = ["-i", ctx.input, "-map", "0", "-c", "copy", ...(stripOthers ? ["-map_metadata", "-1"] : []), ...(ext === "mp3" ? ["-id3v2_version", "3"] : []), ...tags, out];
      }
      await ctx.exec(args);
      return [{ blob: await ctx.read(out, mime), filename: `${stem(media.file)}.${ext}` }];
    });

  return (
    <ToolLayout toolId="audio-metadata-editor">
      <MediaTool
        media={media}
        options={
          <>
            {reading ? <StatusBadge tone="info">Reading existing tags…</StatusBadge> : null}
            <FieldGrid>
              {FIELDS.map((f) => (
                <Field key={f.key} label={f.label} htmlFor={`m-${f.key}`} className={f.key === "comment" ? "sm:col-span-2" : undefined}>
                  <Input id={`m-${f.key}`} value={meta[f.key]} onChange={(e) => setMeta((m) => ({ ...m, [f.key]: e.target.value }))} disabled={reading} />
                </Field>
              ))}
            </FieldGrid>
            {supportsCover ? (
              <Field label="Cover art" hint={cover ? undefined : hadCover ? "This file already has cover art — it's kept unless you replace it." : "JPEG or PNG, ideally square (e.g. 1000×1000)."}>
                <div className="flex items-center gap-2">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.url} alt="Cover" className="w-12 h-12 rounded-sm object-cover border border-border" />
                  )}
                  <label className="inline-flex items-center gap-1.5 h-(--control-h) px-2.5 rounded-md border border-border bg-card text-xs font-medium cursor-pointer hover:bg-muted">
                    <ImagePlus className="w-3.5 h-3.5" /> {cover ? "Change" : hadCover ? "Replace" : "Add"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (cover) URL.revokeObjectURL(cover.url);
                        setCover({ file: f, url: URL.createObjectURL(f) });
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {cover && (
                    <Button variant="ghost" size="icon-sm" onClick={() => { URL.revokeObjectURL(cover.url); setCover(null); }} aria-label="Remove new cover">
                      <X />
                    </Button>
                  )}
                </div>
              </Field>
            ) : (
              <p className="text-[11px] text-muted-foreground">Cover art is supported for MP3, M4A and FLAC.</p>
            )}
            <Field label="Remove all other tags" hint="Strip encoder info, lyrics, etc." inline>
              <Switch checked={stripOthers} onCheckedChange={setStripOthers} />
            </Field>
          </>
        }
        action={{ label: "Save tags", busyLabel: "Saving", icon: <Tags />, onClick: save, disabled: reading }}
      />
    </ToolLayout>
  );
}
