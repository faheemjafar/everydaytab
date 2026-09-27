import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "YAML Viewer & Validator Online – Format, Check and Read YAML",
  seoDescription:
    "Paste YAML to validate it, catch indentation errors and view it cleanly formatted with 2, 4 or 8-space indentation. Free online YAML viewer for Kubernetes, Docker Compose, CI configs. No upload.",
  intro:
    "Paste a YAML document — a Kubernetes manifest, Docker Compose file, GitHub Actions workflow, Ansible playbook or app config — and instantly see whether it parses, exactly where any error is, and a clean re-indented version you can copy back. Indentation mistakes are the number one cause of broken YAML, and this viewer makes them visible. Everything runs in your browser.",
  sections: [
    {
      heading: "What the viewer checks",
      bullets: [
        "Syntax — the document is parsed with the js-yaml library; errors report the line and column so you can jump straight to the problem.",
        "Indentation — the output is re-serialised with consistent 2, 4 or 8-space indentation, revealing where mixed spacing crept in.",
        "Structure — nested mappings and sequences are laid out clearly so you can confirm keys are at the level you intended.",
        "Types — quoted strings, numbers, booleans and nulls are normalised, exposing gotchas like unquoted yes/no becoming booleans.",
      ],
    },
    {
      heading: "YAML mistakes this catches",
      bullets: [
        "Tabs used for indentation — YAML only allows spaces.",
        "A list item or key indented one space too many or too few, silently attaching it to the wrong parent.",
        "Missing space after a colon (key:value instead of key: value).",
        "Unquoted strings containing colons, hashes or leading special characters (*, &, !, %, @).",
        "Duplicate keys in the same mapping, which many parsers reject.",
        "Values like NO, Off, 1.0 or 012 being interpreted as booleans, floats or octal instead of strings — quote them.",
      ],
    },
    {
      heading: "Where YAML shows up",
      paragraphs: [
        "YAML is the configuration language of modern infrastructure: Kubernetes objects, Helm charts, Docker Compose, GitHub Actions, GitLab CI, CircleCI, Ansible, CloudFormation, Serverless Framework, OpenAPI specs, Hugo and Jekyll front matter, and countless application settings files. Because whitespace is significant, a file that looks right can still be wrong — validating before you commit or apply saves failed deployments. To move between formats, the JSON ↔ YAML and TOML ↔ YAML converters sit alongside this viewer.",
      ],
    },
  ],
  howTo: [
    { name: "Paste YAML", text: "Drop your raw YAML into the input panel." },
    { name: "Check for errors", text: "If parsing fails, the error message and line number appear immediately." },
    { name: "Choose indentation", text: "Select 2, 4 or 8 spaces for the formatted output." },
    { name: "Copy", text: "Copy the clean, validated YAML back into your project." },
  ],
  faqs: [
    {
      question: "Why does my YAML fail with \"bad indentation of a mapping entry\"?",
      answer:
        "A key is indented differently from its siblings, or a tab was used. Compare the reported line with the lines above it and make sure every level uses the same number of spaces.",
    },
    {
      question: "Does the viewer preserve comments?",
      answer:
        "Comments are stripped when the document is re-serialised, as the YAML data model has no place for them. Use the formatted output to fix structure, then reapply comments in your editor if needed.",
    },
    {
      question: "Can I convert YAML to JSON here?",
      answer: "Use the JSON ↔ YAML converter, which shares the same parser and converts in both directions.",
    },
    {
      question: "Is my configuration uploaded?",
      answer: "No. Parsing happens in your browser, so secrets and internal manifests stay on your machine.",
    },
  ],
  related: ["json-yaml", "json-toml", "json-formatter", "docker-compose-converter", "xml-formatter"],
};

export default content;
