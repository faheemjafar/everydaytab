import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Text to Unicode Converter – \\uXXXX, HTML Entities, CSS & JS Escapes",
  seoDescription:
    "Convert text to Unicode escape sequences online: \\uXXXX hex escapes, HTML decimal entities (&#NNNN;), CSS escapes and ES6 \\u{...} code points. Handles emoji and every script. Free.",
  intro:
    "Turn any text — including accented letters, non-Latin scripts, symbols and emoji — into escape sequences you can safely paste into source code, JSON, HTML, CSS or configuration files. Four output formats are generated at once, so you can grab exactly the notation your language expects. Conversion happens instantly in your browser.",
  sections: [
    {
      heading: "The four output formats",
      bullets: [
        "Unicode hex (\\uXXXX) — the classic 4-hex-digit escape used by Java, C#, JSON, Python and older JavaScript. Characters above U+FFFF (most emoji) are shown as surrogate pairs.",
        "HTML decimal entity (&#NNNN;) — numeric character references that work in any HTML document regardless of its declared charset.",
        "CSS escape (\\XXXX) — the backslash-hex form used in CSS content properties, e.g. for icon fonts: content: \"\\f101\".",
        "JavaScript code point (\\u{XXXXX}) — the ES6 syntax that expresses any code point directly, including emoji, without surrogate pairs.",
      ],
    },
    {
      heading: "Why escape text as Unicode?",
      paragraphs: [
        "Escaping guarantees that a character survives any file encoding, build step or transport. A source file saved as Latin-1 by mistake, a legacy database column, an email template, or a tool that strips non-ASCII bytes will all mangle a literal \"é\" or \"→\" — but \\u00e9 and \\u2192 are plain ASCII and cannot be corrupted. Escapes are also the safest way to embed zero-width or invisible characters (such as U+200B) in code so their presence is obvious to reviewers.",
        "Unicode assigns every character a number called a code point, written U+ followed by hex. Code points up to U+FFFF fit in a single 16-bit unit and one \\uXXXX escape; anything higher — most emoji, many CJK extension characters, mathematical alphanumerics — needs either a \\u{...} escape or two \\uXXXX surrogate escapes. This tool produces both forms so you can pick the one your runtime supports.",
      ],
    },
    {
      heading: "Common uses",
      bullets: [
        "Embedding symbols and emoji in JSON payloads and localisation files without encoding worries.",
        "Writing CSS content strings for icon fonts and bullet characters.",
        "Producing HTML entities for characters an editor or CMS refuses to save.",
        "Debugging encoding issues by seeing exactly which code points a string contains.",
        "Obfuscating or safely quoting strings in JavaScript and Python source.",
      ],
    },
  ],
  howTo: [
    { name: "Type or paste text", text: "Enter any text, including accented characters, symbols or emoji." },
    { name: "Choose a format", text: "Read the \\uXXXX, &#NNNN;, CSS or \\u{…} output — all are generated at once." },
    { name: "Copy", text: "Click the copy button next to the format you need and paste it into your code." },
  ],
  faqs: [
    {
      question: "Why does an emoji become two \\uXXXX escapes?",
      answer:
        "Most emoji have code points above U+FFFF, which cannot fit in a single 16-bit escape. UTF-16 represents them as a surrogate pair, so \\uXXXX notation needs two escapes. The ES6 \\u{XXXXX} format shows the single true code point instead.",
    },
    {
      question: "What is the difference between \\u00e9 and &#233;?",
      answer:
        "They encode the same character (é, U+00E9). \\u00e9 is a hex escape for programming languages and JSON; &#233; is a decimal numeric entity for HTML and XML.",
    },
    {
      question: "How do I convert Unicode escapes back to text?",
      answer:
        "Paste the escaped string into the reverse direction of this tool, or into a JavaScript console as a quoted string — the runtime decodes the escapes. The HTML Entities tool also decodes &#...; references.",
    },
    {
      question: "Does it work for Arabic, Hindi, Chinese and other scripts?",
      answer:
        "Yes. Every character has a Unicode code point, so text in any language is converted; combining marks and joined characters are output as their individual code points.",
    },
  ],
  related: ["html-entities", "text-binary", "base64", "url-encoder", "morse-code-converter"],
};

export default content;
