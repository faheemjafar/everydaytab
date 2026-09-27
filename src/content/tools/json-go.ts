import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "JSON to Go Struct Converter – Generate Go Types with JSON Tags Online",
  seoDescription:
    "Paste JSON and get idiomatic Go structs with exported field names, correct types and json:\"…\" tags, including nested structs and slices. Free converter that runs in your browser.",
  intro:
    "Paste a JSON payload — an API response, a config file, a webhook body — and get the Go struct definitions needed to unmarshal it: PascalCase exported fields, inferred types (string, int, float64, bool), nested structs for nested objects, slices for arrays, and json:\"key\" tags that preserve the original field names. Name the top-level struct, copy, and paste into your package.",
  sections: [
    {
      heading: "What the generator produces",
      bullets: [
        "Exported field names — user_id becomes UserID-style PascalCase so the fields are accessible from other packages.",
        "Types — whole numbers map to int, decimals to float64, true/false to bool, text to string, null to interface{}.",
        "Nested objects — each becomes its own named struct, declared after the parent.",
        "Arrays — []T using the type of the first element; arrays of objects generate a struct for the element.",
        "JSON tags — `json:\"original_key\"` on every field so encoding/json maps the data correctly.",
      ],
    },
    {
      heading: "Refining the generated code",
      bullets: [
        "Add ,omitempty to tags for optional fields so zero values are dropped when marshalling: `json:\"nickname,omitempty\"`.",
        "Use pointer types (*string, *int) when you must distinguish \"absent\" from \"zero\".",
        "Replace interface{} (or any) for null fields with the type the field actually holds when present.",
        "Change int to int64 for IDs and counters that may exceed 2³¹ on 32-bit platforms, and consider json.Number for very large or precise numbers.",
        "Map ISO date strings to time.Time — encoding/json parses RFC 3339 automatically.",
        "Run gofmt; the output follows its conventions but your editor may adjust alignment.",
      ],
    },
    {
      heading: "Why generate instead of hand-writing",
      paragraphs: [
        "Real-world JSON is nested, inconsistently named and large; transcribing it by hand is slow and a single typo in a tag produces silently empty fields at runtime. Generating from a representative sample gets the shape right in seconds so you can spend your time on the semantics — which fields are optional, which need custom types. Feed several samples through if different responses include different optional keys, then merge the results. The equivalent tool for TypeScript is JSON to TypeScript, and JSON Schema Generator produces a language-neutral schema.",
      ],
    },
  ],
  howTo: [
    { name: "Paste JSON", text: "Drop your JSON object into the input panel." },
    { name: "Name the struct", text: "Enter a name for the top-level type (for example Response or User)." },
    { name: "Copy the Go code", text: "The struct definitions appear instantly; click Copy and paste into your .go file." },
  ],
  faqs: [
    {
      question: "Why are some fields typed as interface{}?",
      answer: "The sample had null for those keys, so the type could not be inferred. Replace interface{} with the real type (often *string or *int) once you know it.",
    },
    {
      question: "How are arrays of mixed types handled?",
      answer: "The element type is inferred from the first item. For heterogeneous arrays use []interface{} or []json.RawMessage and decode elements individually.",
    },
    {
      question: "Does it handle deeply nested JSON?",
      answer: "Yes. Every nested object at any depth becomes a named struct, declared after its parent in the output.",
    },
    {
      question: "Is my JSON sent anywhere?",
      answer: "No. Conversion runs in your browser, so production payloads and credentials stay on your machine.",
    },
  ],
  related: ["json-ts", "json-schema", "json-formatter", "json-sql", "json-yaml"],
};

export default content;
