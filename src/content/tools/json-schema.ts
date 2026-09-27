import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "JSON to JSON Schema Generator – Create a Schema from Sample JSON",
  seoDescription:
    "Generate a JSON Schema from any JSON example instantly. Paste your JSON and get a schema with inferred types, nested objects and arrays, ready for validation, OpenAPI or form builders. Free.",
  intro:
    "Paste a JSON document and get a matching JSON Schema in seconds. The generator walks the structure, infers the type of every property — strings, numbers, integers, booleans, nulls, arrays and nested objects — and produces a schema you can use to validate API payloads, document your data model, drive form generation or seed an OpenAPI definition. Everything runs in your browser.",
  sections: [
    {
      heading: "What JSON Schema is for",
      paragraphs: [
        "JSON Schema is a vocabulary for describing the shape of JSON data: which properties exist, what types they hold, which are required, and constraints such as string formats or numeric ranges. Validators exist for every major language (Ajv for JavaScript, jsonschema for Python, everit for Java), so a single schema can enforce the same contract in a browser form, a Node API and a data pipeline. It also underpins OpenAPI request and response definitions, VS Code's settings and config-file IntelliSense, and low-code form builders.",
      ],
    },
    {
      heading: "What the generator infers",
      bullets: [
        "Primitive types — string, number, integer (for whole numbers), boolean and null.",
        "Objects — a properties block for each key with its own nested schema.",
        "Arrays — an items schema based on the first element, so arrays of objects produce a full object schema.",
        "Nesting — arbitrarily deep structures are handled recursively.",
      ],
    },
    {
      heading: "Turning the draft into a production schema",
      bullets: [
        "Add a required array listing the properties that must always be present; a generator cannot know which fields are optional.",
        "Tighten types: add format (email, date-time, uri), enum, minimum/maximum, minLength/maxLength and pattern where appropriate.",
        "Set additionalProperties: false on objects whose shape is fixed, so unexpected keys are rejected.",
        "Declare the draft with $schema (for example https://json-schema.org/draft/2020-12/schema) and give the schema a $id and title.",
        "Feed several representative samples through the generator and merge the results so optional and nullable fields are captured.",
      ],
    },
  ],
  howTo: [
    { name: "Paste JSON", text: "Drop a JSON object or array into the input panel. Parsing errors are shown immediately." },
    { name: "Review the schema", text: "The generated JSON Schema appears in the output panel, formatted and ready to read." },
    { name: "Copy", text: "Click Copy and paste the schema into your validator, OpenAPI file or project." },
  ],
  faqs: [
    {
      question: "Which JSON Schema draft does the output follow?",
      answer:
        "The structure — type, properties, items — is compatible with every draft from 04 through 2020-12. Add the $schema keyword for the draft your validator expects.",
    },
    {
      question: "Why are all my fields optional in the generated schema?",
      answer:
        "A single sample cannot reveal which properties are mandatory. Add a required array yourself, listing the keys that must always be present.",
    },
    {
      question: "How are arrays with mixed types handled?",
      answer:
        "The items schema is inferred from the array's first element. For heterogeneous arrays, edit the schema to use anyOf or oneOf with each expected shape.",
    },
    {
      question: "Is my JSON sent to a server?",
      answer: "No. Parsing and generation run in your browser, so real API payloads and customer data stay on your device.",
    },
  ],
  related: ["json-formatter", "json-ts", "json-go", "json-sql", "json-diff"],
};

export default content;
