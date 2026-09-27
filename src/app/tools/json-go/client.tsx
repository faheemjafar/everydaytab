"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { Field, JsonCodegen, Toggle, parseJsonInput } from "@/components/tool";
import { inferRoot, pascal, toGo } from "@/lib/json-types";

const SAMPLE = `{
  "id": 1,
  "user_name": "gopher",
  "api_url": "https://api.example.com",
  "created_at": "2024-03-01T10:00:00Z",
  "is_active": true,
  "metadata": { "login_count": 5, "last_ip": "127.0.0.1" },
  "roles": [
    { "id": 1, "name": "admin" },
    { "id": 2, "name": "editor", "expires_at": "2025-01-01T00:00:00Z" }
  ]
}`;

export default function JSONToGoStruct() {
  const [input, setInput] = useState("");
  const [name, setName] = useState("Root");
  const [pkg, setPkg] = useState("main");
  const [omitempty, setOmitempty] = useState(true);
  const [pointers, setPointers] = useState(true);
  const [inline, setInline] = useState(false);
  const [timeType, setTimeType] = useState(true);

  const { output, error } = useMemo(() => {
    const p = parseJsonInput(input);
    if (p.error || p.value === undefined) return { output: "", error: p.error };
    return { output: toGo(inferRoot(p.value, pascal(name) || "Root"), { omitempty, pointers, inline, timeType, pkg }), error: null };
  }, [input, name, pkg, omitempty, pointers, inline, timeType]);

  return (
    <ToolLayout toolId="json-go">
      <JsonCodegen
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        sample={SAMPLE}
        outputLabel="Go"
        filename="types.go"
        options={
          <>
            <Field label="Struct name" htmlFor="sn">
              <Input id="sn" value={name} onChange={(e) => setName(e.target.value)} className="w-32 font-mono" />
            </Field>
            <Field label="Package" htmlFor="pk">
              <Input id="pk" value={pkg} onChange={(e) => setPkg(e.target.value.replace(/[^a-z0-9_]/gi, ""))} className="w-28 font-mono" />
            </Field>
            <Toggle label="omitempty on optional" checked={omitempty} onChange={setOmitempty} />
            <Toggle label="Pointers for optional" checked={pointers} onChange={setPointers} />
            <Toggle label="time.Time for timestamps" checked={timeType} onChange={setTimeType} />
            <Toggle label="Inline nested structs" checked={inline} onChange={setInline} />
          </>
        }
      />
    </ToolLayout>
  );
}
