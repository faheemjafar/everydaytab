"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

const SAMPLE = `<article>
  <h1>Hello &amp; welcome</h1>
  <p>This is <strong>bold</strong>, this is a <a href="https://example.com">link</a>.</p>
  <ul><li>First item</li><li>Second&nbsp;item</li></ul>
  <script>alert("removed")</script>
  <style>p { color: red }</style>
  <p>Caf&eacute; &mdash; &lt;tags&gt; stay as text.</p>
</article>`;

const BLOCK = new Set(["P", "DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "MAIN", "ASIDE", "NAV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "TR", "TABLE", "BLOCKQUOTE", "PRE", "FIGURE", "FIGCAPTION", "DT", "DD", "HR", "FORM"]);

type Links = "text" | "text-url" | "markdown";

/** Walks the parsed DOM so entities decode correctly and block elements become line breaks. */
function toText(html: string, o: { breaks: boolean; links: Links; bullets: boolean; collapse: boolean }) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, noscript, template, head, svg").forEach((n) => n.remove());
  let out = "";
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      out += n.textContent ?? "";
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const el = n as Element;
    const block = o.breaks && BLOCK.has(el.tagName);
    if (el.tagName === "BR") { out += "\n"; return; }
    if (block) out += "\n";
    if (el.tagName === "LI" && o.bullets) out += el.parentElement?.tagName === "OL" ? `${Array.from(el.parentElement.children).indexOf(el) + 1}. ` : "• ";
    if (el.tagName === "TD" || el.tagName === "TH") out += "\t";
    const href = el.tagName === "A" ? el.getAttribute("href") : null;
    if (href && o.links === "markdown") out += "[";
    el.childNodes.forEach(walk);
    if (href && o.links === "markdown") out += `](${href})`;
    else if (href && o.links === "text-url" && href !== el.textContent) out += ` (${href})`;
    // List items only need a break before them; others get one on both sides.
    if (block && el.tagName !== "LI") out += "\n";
  };
  walk(doc.body);
  if (o.collapse) out = out.replace(/[ \t\u00a0]+/g, " ").replace(/ *\n */g, "\n");
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export default function StripHTML() {
  const [input, setInput] = useState("");
  const [breaks, setBreaks] = useState(true);
  const [bullets, setBullets] = useState(true);
  const [collapse, setCollapse] = useState(true);
  const [links, setLinks] = useState<Links>("text");

  const output = useMemo(() => (typeof DOMParser !== "undefined" && input ? toText(input, { breaks, links, bullets, collapse }) : ""), [input, breaks, links, bullets, collapse]);

  return (
    <ToolLayout toolId="strip-html">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        sample={SAMPLE}
        inputLabel="HTML"
        outputLabel="Plain text"
        filename="text.txt"
        placeholder="Paste HTML, an email source or a web page's markup…"
        options={
          <>
            <Toggle label="Keep paragraphs & line breaks" checked={breaks} onChange={setBreaks} />
            <Toggle label="List bullets" checked={bullets} onChange={setBullets} />
            <Toggle label="Collapse whitespace" checked={collapse} onChange={setCollapse} />
            <Field label="Links">
              <Segmented size="sm" value={links} onChange={setLinks} options={[{ value: "text", label: "Text only" }, { value: "text-url", label: "Text (URL)" }, { value: "markdown", label: "[Markdown](url)" }]} />
            </Field>
            <p className="text-[11px] text-muted-foreground">Scripts, styles and hidden templates are dropped; entities like &amp;amp; and &amp;eacute; are decoded.</p>
          </>
        }
      />
    </ToolLayout>
  );
}
