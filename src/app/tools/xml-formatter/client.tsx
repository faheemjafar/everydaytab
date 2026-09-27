"use client";

import { useMemo, useState } from "react";
import formatXml from "xml-formatter";
import { XMLValidator } from "fast-xml-parser";
import { ToolLayout } from "@/components/tool-layout";
import { Field, Segmented, StatusBadge, TextTransform, Toggle } from "@/components/tool";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?><note priority="high"><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don't forget me this weekend!<!-- a comment --></body><tags><tag>personal</tag><tag>weekend</tag></tags></note>`;

export default function XMLFormatter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"pretty" | "minify">("pretty");
  const [indent, setIndent] = useState<"2" | "4" | "tab">("2");
  const [collapse, setCollapse] = useState(true);
  const [comments, setComments] = useState(true);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    const v = XMLValidator.validate(input, { allowBooleanAttributes: true });
    if (v !== true) return { output: "", error: `Line ${v.err.line}, column ${v.err.col}: ${v.err.msg}` };
    try {
      const src = comments ? input : input.replace(/<!--[\s\S]*?-->/g, "");
      if (mode === "minify") return { output: src.replace(/>\s+</g, "><").trim(), error: null };
      return { output: formatXml(src, { indentation: indent === "tab" ? "\t" : " ".repeat(Number(indent)), collapseContent: collapse, lineSeparator: "\n" }), error: null };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input, mode, indent, collapse, comments]);

  return (
    <ToolLayout toolId="xml-formatter">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLE}
        inputLabel="XML"
        outputLabel={mode === "pretty" ? "Formatted" : "Minified"}
        filename="formatted.xml"
        options={
          <>
            {input.trim() && <StatusBadge tone={error ? "error" : "success"}>{error ? "Invalid XML" : "Well-formed"}</StatusBadge>}
            <Segmented value={mode} onChange={setMode} options={[{ value: "pretty", label: "Beautify" }, { value: "minify", label: "Minify" }]} />
            {mode === "pretty" && (
              <>
                <Field label="Indent">
                  <Segmented size="sm" value={indent} onChange={setIndent} options={[{ value: "2", label: "2" }, { value: "4", label: "4" }, { value: "tab", label: "Tab" }]} />
                </Field>
                <Toggle label="Keep short text inline" checked={collapse} onChange={setCollapse} />
              </>
            )}
            <Toggle label="Keep comments" checked={comments} onChange={setComments} />
          </>
        }
      />
    </ToolLayout>
  );
}
