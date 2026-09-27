"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, JsonCodegen, Toggle, parseJsonInput } from "@/components/tool";
import { inferRoot, toJsonSchema } from "@/lib/json-types";

const SAMPLE = `[
  { "id": "7f1c8a2e-1b2c-4d3e-8f9a-0b1c2d3e4f5a", "email": "ada@example.com", "age": 36, "website": "https://ada.dev", "joined": "2024-03-01" },
  { "id": "0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d", "email": "alan@example.com", "age": null, "nickname": "AT" }
]`;

export default function JSONSchemaGenerator() {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("Root");
  const [additional, setAdditional] = useState(false);
  const [formats, setFormats] = useState(true);

  const { output, error } = useMemo(() => {
    const p = parseJsonInput(input);
    if (p.error || p.value === undefined) return { output: "", error: p.error };
    return { output: JSON.stringify(toJsonSchema(inferRoot(p.value, title || "Root"), { title, additional, formats }), null, 2), error: null };
  }, [input, title, additional, formats]);

  return (
    <ToolLayout toolId="json-schema">
      <JsonCodegen
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLE}
        outputLabel="JSON Schema (2020-12)"
        filename="schema.json"
        options={
          <>
            <Field label="Title" htmlFor="st">
              <Input id="st" value={title} onChange={(e) => setTitle(e.target.value)} className="w-36" />
            </Field>
            <Toggle label="Detect formats (email, uri, uuid, date-time)" checked={formats} onChange={setFormats} />
            <Toggle label="Allow additional properties" checked={additional} onChange={setAdditional} />
            <p className="text-[11px] text-muted-foreground">Fields missing from some samples are left out of “required”.</p>
          </>
        }
      />
    </ToolLayout>
  );
}
