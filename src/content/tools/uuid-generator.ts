import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "UUID Generator – Bulk Random UUID v4 Online, Free & Secure",
  seoDescription:
    "Generate one or hundreds of cryptographically secure UUID v4 identifiers instantly. Copy individually or as a list for databases, tests, config files and APIs. Free, runs in your browser.",
  intro:
    "Generate random UUIDs (universally unique identifiers) in the standard 8-4-4-4-12 format — one at a time or up to 500 in a batch — using your browser's cryptographically secure random source. Paste them into database seeds, test fixtures, API requests, config files or anywhere you need an identifier that will never collide with another.",
  sections: [
    {
      heading: "What a UUID is",
      paragraphs: [
        "A UUID is a 128-bit value written as 32 hexadecimal digits in five groups: 550e8400-e29b-41d4-a716-446655440000. Version 4 UUIDs are generated from 122 random bits (the remaining 6 encode the version and variant), giving 5.3 × 10³⁶ possible values. The odds of two random UUIDs colliding are so small that they are treated as unique without any coordination between systems — which is exactly why they are used as primary keys, request IDs, file names and correlation tokens across distributed services.",
      ],
    },
    {
      heading: "UUID versions at a glance",
      bullets: [
        "v4 (random) — generated here; the default choice for almost everything.",
        "v1 (time + MAC address) — sortable by creation time but leaks the generating machine's address; largely superseded.",
        "v7 (Unix timestamp + random) — the modern time-ordered UUID, great for database keys where insertion order matters; see the ULID Generator for a similar sortable ID.",
        "v3 / v5 (name-based hashes) — deterministic: the same input always yields the same UUID.",
        "Nil UUID — 00000000-0000-0000-0000-000000000000, used as a placeholder.",
      ],
    },
    {
      heading: "Using UUIDs well",
      bullets: [
        "Store them in a native uuid column (PostgreSQL) or BINARY(16) (MySQL) rather than as 36-character strings to save space and speed up indexes.",
        "Random v4 keys fragment B-tree indexes on very high-insert tables; consider v7 or ULID if that becomes a problem.",
        "Lowercase is the canonical form (RFC 9562); comparisons should be case-insensitive.",
        "UUIDs are identifiers, not secrets — they are hard to guess but are often exposed in URLs. Use the Token Generator for secrets.",
      ],
    },
  ],
  howTo: [
    { name: "Set the quantity", text: "Choose how many UUIDs to generate (1–500)." },
    { name: "Generate", text: "Click Generate; new UUIDs are produced instantly with crypto.getRandomValues()." },
    { name: "Copy", text: "Copy a single UUID or the whole list to your clipboard." },
  ],
  faqs: [
    {
      question: "Are these UUIDs truly unique?",
      answer:
        "Statistically yes. With 122 random bits you would need to generate about a billion UUIDs per second for 85 years to reach a 50% chance of a single collision.",
    },
    {
      question: "Are the UUIDs secure enough to use as tokens?",
      answer:
        "They are generated with a cryptographically secure source, but UUIDs are designed as identifiers and are frequently logged or exposed in URLs. For secrets, generate a dedicated token with the Token Generator.",
    },
    {
      question: "What is the difference between UUID and GUID?",
      answer: "None in practice — GUID is Microsoft's name for the same 128-bit identifier format.",
    },
    {
      question: "How do I generate UUIDs in code?",
      answer:
        "JavaScript: crypto.randomUUID(). Python: uuid.uuid4(). PostgreSQL: gen_random_uuid(). Java: UUID.randomUUID(). Go: github.com/google/uuid. All produce v4 UUIDs equivalent to the ones generated here.",
    },
  ],
  related: ["token-generator", "password-generator", "random-number-generator", "hash-generator", "json-schema"],
};

export default content;
