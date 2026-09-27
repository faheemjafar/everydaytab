import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "ISO 8601 Date Formatter – Convert Any Date or Timestamp to ISO",
  seoDescription:
    "Convert dates and Unix timestamps to ISO 8601, local ISO, RFC 2822 and localized formats instantly. Paste any date string or epoch value and copy the format you need. Free, no sign-up.",
  intro:
    "Paste a date in almost any form — a Unix timestamp, \"2024-01-01\", \"March 5 2026 14:00\", an RFC 2822 email date — and get it back in the standard formats developers actually need: full ISO 8601 in UTC, date-only ISO, ISO with your local offset, RFC 2822 for HTTP headers and email, and your locale's human-readable string. Click any result to copy it.",
  sections: [
    {
      heading: "Why ISO 8601 is the format to standardise on",
      paragraphs: [
        "ISO 8601 writes dates from the largest unit to the smallest — 2026-03-05T14:00:00.000Z — which means alphabetical order is chronological order, there is no ambiguity between day-first and month-first conventions, and the trailing Z (or an explicit +02:00 offset) states the time zone unambiguously. It is the native format of JavaScript's Date.toISOString(), JSON APIs, databases, log files and most modern standards including RFC 3339, which is a slightly stricter profile of ISO 8601 used on the web.",
      ],
    },
    {
      heading: "The output formats explained",
      bullets: [
        "ISO 8601 (Full) — 2026-03-05T14:00:00.000Z; UTC with milliseconds. Use for APIs, databases and logs.",
        "ISO 8601 (YMD) — 2026-03-05; the date part only, ideal for file names, sorting and date-only fields.",
        "Local ISO — the same instant expressed in your computer's time zone, useful for datetime-local inputs.",
        "Localized String — what your operating system's locale would display, for checking how users will read it.",
        "Short Date — the locale's compact date form.",
        "RFC 2822 / UTC — Thu, 05 Mar 2026 14:00:00 GMT; the format required in HTTP Date headers, cookies and email.",
      ],
    },
    {
      heading: "Input tips",
      bullets: [
        "Unix timestamps in seconds (1704067200) and milliseconds (1704067200000) are both accepted.",
        "Any string JavaScript's Date can parse works — ISO strings, RFC 2822 strings and most natural formats such as \"Jan 5, 2026 10:30\".",
        "Dates without a time zone are interpreted in your local zone; append Z to force UTC.",
        "Click Now to load the current instant and see it in every format at once.",
      ],
    },
  ],
  howTo: [
    { name: "Enter a date", text: "Type or paste a date string or Unix timestamp, or click Now for the current time." },
    { name: "Read the formats", text: "Every supported format is generated instantly in its own card." },
    { name: "Copy", text: "Click a card to copy that representation to your clipboard." },
  ],
  faqs: [
    {
      question: "What does the Z at the end of an ISO date mean?",
      answer: "Z stands for Zulu time — UTC. It tells the reader the timestamp has no local offset applied. An offset such as +05:30 can appear in its place.",
    },
    {
      question: "What is the difference between ISO 8601 and RFC 3339?",
      answer:
        "RFC 3339 is a profile of ISO 8601 for internet timestamps: it requires the full date and time with an explicit offset or Z, and allows a space instead of T. Any RFC 3339 string is valid ISO 8601.",
    },
    {
      question: "How do I convert an ISO date back to a Unix timestamp?",
      answer: "Use the Timestamp Converter tool, which converts in both directions and shows seconds and milliseconds.",
    },
    {
      question: "Why does my date show a different day in Local ISO than in ISO 8601?",
      answer: "Because your time zone is ahead of or behind UTC. 2026-03-05T23:30Z is already 6 March in time zones east of UTC+0:30 — both values represent the same instant.",
    },
  ],
  related: ["timestamp-converter", "time-zone-converter", "date-calculator", "time-duration-converter", "age-calculator"],
};

export default content;
