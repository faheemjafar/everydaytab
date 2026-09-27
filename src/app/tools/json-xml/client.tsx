"use client";

import { useMemo, useState } from "react";
import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import { ArrowLeftRight } from "lucide-react";
import { ToolLayout } from "@/components/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Segmented, TextTransform, Toggle } from "@/components/tool";

type Dir = "json-xml" | "xml-json";

const SAMPLE_JSON = `{\n  "catalog": {\n    "@_version": "2",\n    "book": [\n      { "@_id": "bk101", "title": "XML Developer's Guide", "price": 44.95 },\n      { "@_id": "bk102", "title": "Midnight Rain", "price": 5.95 }\n    ]\n  }\n}`;
const SAMPLE_XML = `<?xml version="1.0"?>\n<catalog version="2">\n  <book id="bk101">\n    <title>XML Developer's Guide</title>\n    <price>44.95</price>\n  </book>\n  <book id="bk102">\n    <title>Midnight Rain</title>\n    <price>5.95</price>\n  </book>\n</catalog>`;

export default function JSONXMLConverter() {
  const [dir, setDir] = useState<Dir>("xml-json");
  const [input, setInput] = useState("");
  const [prefix, setPrefix] = useState("@_");
  const [attrs, setAttrs] = useState(true);
  const [typed, setTyped] = useState(true);
  const [root, setRoot] = useState("root");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null };
    try {
      const opts = { ignoreAttributes: !attrs, attributeNamePrefix: prefix, parseTagValue: typed, parseAttributeValue: typed, textNodeName: "#text" };
      if (dir === "xml-json") {
        const valid = XMLValidator.validate(input);
        if (valid !== true) return { output: "", error: `Line ${valid.err.line}: ${valid.err.msg}` };
        const obj = new XMLParser({ ...opts, ignoreDeclaration: true }).parse(input);
        return { output: JSON.stringify(obj, null, 2), error: null };
      }
      let obj = JSON.parse(input);
      // XML needs a single root element.
      if (Array.isArray(obj) || typeof obj !== "object" || obj === null || Object.keys(obj).length !== 1) obj = { [root || "root"]: Array.isArray(obj) ? { item: obj } : obj };
      const xml = new XMLBuilder({ ...opts, format: true, indentBy: "  ", suppressEmptyNode: true }).build(obj);
      return { output: `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`.trim(), error: null };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input, dir, prefix, attrs, typed, root]);

  return (
    <ToolLayout toolId="json-xml">
      <TextTransform
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={dir === "json-xml" ? SAMPLE_JSON : SAMPLE_XML}
        inputLabel={dir === "json-xml" ? "JSON" : "XML"}
        outputLabel={dir === "json-xml" ? "XML" : "JSON"}
        filename={dir === "json-xml" ? "converted.xml" : "converted.json"}
        options={
          <>
            <Segmented value={dir} onChange={(d) => { setDir(d); setInput(output); }} options={[{ value: "xml-json", label: "XML → JSON" }, { value: "json-xml", label: "JSON → XML" }]} />
            <Button variant="ghost" size="icon" onClick={() => { setDir(dir === "json-xml" ? "xml-json" : "json-xml"); setInput(output); }} aria-label="Swap" title="Swap">
              <ArrowLeftRight />
            </Button>
            <Toggle label="Attributes" checked={attrs} onChange={setAttrs} />
            {attrs && (
              <Field label="Attribute prefix" htmlFor="ap">
                <Input id="ap" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="w-16 font-mono" />
              </Field>
            )}
            {dir === "xml-json" ? <Toggle label="Numbers & booleans typed" checked={typed} onChange={setTyped} /> : (
              <Field label="Root (if needed)" htmlFor="rt">
                <Input id="rt" value={root} onChange={(e) => setRoot(e.target.value.replace(/[^\w.-]/g, ""))} className="w-24 font-mono" />
              </Field>
            )}
          </>
        }
      />
    </ToolLayout>
  );
}
