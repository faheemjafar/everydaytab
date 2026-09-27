"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { ClearButton, CodeArea, CopyButton, Stat, ToolPanel } from "@/components/tool";

export default function WordCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return {
      words,
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, "").length,
      lines: text ? text.split("\n").filter((l) => l.trim()).length : 0,
      paragraphs: text ? text.split(/\n\n+/).filter((p) => p.trim()).length : 0,
      sentences: text ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0,
      readingTime: Math.ceil(words / 200),
      speakingTime: Math.ceil(words / 130),
    };
  }, [text]);

  const items = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
    { label: "No spaces", value: stats.charactersNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Lines", value: stats.lines },
    { label: "Reading", value: `${stats.readingTime} min`, hint: "≈200 wpm" },
    { label: "Speaking", value: `${stats.speakingTime} min`, hint: "≈130 wpm" },
  ];

  return (
    <ToolLayout toolId="word-counter">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3 items-start">
        <ToolPanel
          title="Text"
          actions={
            <>
              <CopyButton text={text} iconOnly />
              <ClearButton onClick={() => setText("")} iconOnly disabled={!text} />
            </>
          }
        >
          <CodeArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing or paste your text here…"
            className="font-sans text-sm"
            minHeight={460}
          />
        </ToolPanel>

        <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 lg:sticky lg:top-16">
          {items.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value.toLocaleString()} hint={s.hint} />
          ))}
          <p className="col-span-full text-[11px] text-muted-foreground leading-relaxed px-0.5">
            Tip: meta descriptions should stay under 160 characters; tweets under 280.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
