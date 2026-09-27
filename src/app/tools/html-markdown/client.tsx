"use client";

import { useMemo, useState } from "react";
import TurndownService from "turndown";
import { ToolLayout } from "@/components/tool-layout";
import { Field, Segmented, TextTransform } from "@/components/tool";

const SAMPLE = `<h1>Release notes</h1>
<p>This version is <strong>faster</strong> and <em>smaller</em>. See the <a href="https://example.com/docs">docs</a>.</p>
<h2>Changes</h2>
<ul>
  <li>New <code>--watch</code> flag</li>
  <li>Fixed a crash on startup</li>
</ul>
<pre><code class="language-bash">npm install my-package</code></pre>
<blockquote>Thanks to all contributors!</blockquote>`;

export default function HTMLToMarkdown() {
  const [input, setInput] = useState("");
  const [heading, setHeading] = useState<"atx" | "setext">("atx");
  const [bullet, setBullet] = useState<"-" | "*" | "+">("-");
  const [code, setCode] = useState<"fenced" | "indented">("fenced");
  const [links, setLinks] = useState<"inlined" | "referenced">("inlined");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      const td = new TurndownService({ headingStyle: heading, bulletListMarker: bullet, codeBlockStyle: code, linkStyle: links, emDelimiter: "*" });
      // Strip elements that have no Markdown equivalent instead of leaking their text.
      td.remove(["script", "style", "noscript", "iframe"]);
      return { output: td.turndown(input), error: null };
    } catch {
      return { output: "", error: "Couldn't parse that HTML." };
    }
  }, [input, heading, bullet, code, links]);

  return (
    <ToolLayout toolId="html-markdown">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLE}
        inputLabel="HTML"
        outputLabel="Markdown"
        filename="converted.md"
        placeholder="Paste HTML…"
        options={
          <>
            <Field label="Headings">
              <Segmented size="sm" value={heading} onChange={setHeading} options={[{ value: "atx", label: "# ATX" }, { value: "setext", label: "Underline" }]} />
            </Field>
            <Field label="Bullets">
              <Segmented size="sm" value={bullet} onChange={setBullet} options={[{ value: "-", label: "-" }, { value: "*", label: "*" }, { value: "+", label: "+" }]} />
            </Field>
            <Field label="Code blocks">
              <Segmented size="sm" value={code} onChange={setCode} options={[{ value: "fenced", label: "``` Fenced" }, { value: "indented", label: "Indented" }]} />
            </Field>
            <Field label="Links">
              <Segmented size="sm" value={links} onChange={setLinks} options={[{ value: "inlined", label: "Inline" }, { value: "referenced", label: "Reference" }]} />
            </Field>
          </>
        }
      />
    </ToolLayout>
  );
}
