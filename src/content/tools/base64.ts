import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Base64 Encode / Decode Online – Free Base64 Converter for Text",
  seoDescription:
    "Encode text to Base64 or decode Base64 back to text instantly. Full UTF-8 support for accents, emoji and every language. Free online Base64 converter — runs in your browser, nothing uploaded.",
  intro:
    "Convert text to Base64 and back in real time. Paste a string to encode it for a header, config file, JSON payload or URL; paste a Base64 blob to decode it and read what's inside. Unicode is handled correctly — accents, CJK characters and emoji survive the round trip — and nothing leaves your browser.",
  sections: [
    {
      heading: "What Base64 is",
      paragraphs: [
        "Base64 represents binary data using 64 printable ASCII characters: A–Z, a–z, 0–9, + and /, with = used as padding. Every 3 bytes of input become 4 characters of output, so encoded data is about 33% larger. It exists because many systems — email, JSON, XML, HTTP headers, URLs, environment variables — can only carry text safely. Base64 is an encoding, not encryption: anyone can decode it, and it offers no secrecy whatsoever.",
        "Text is first converted to UTF-8 bytes and then Base64-encoded, which is why \"é\" becomes w6k= and \"👍\" becomes 8J+RjQ==. Decoding reverses both steps, so text in any language decodes correctly.",
      ],
    },
    {
      heading: "Where you'll meet Base64",
      bullets: [
        "HTTP Basic Authentication headers (user:password encoded).",
        "JWT tokens — the header and payload are Base64URL-encoded JSON.",
        "Data URIs for inline images and fonts in HTML and CSS.",
        "Kubernetes Secrets, which store values Base64-encoded in YAML.",
        "Email attachments (MIME) and embedded images in HTML emails.",
        "API responses that carry binary files inside JSON.",
        "SAML assertions, X.509 certificates (PEM) and SSH public keys.",
      ],
    },
    {
      heading: "Base64 vs Base64URL",
      paragraphs: [
        "Standard Base64 uses + and /, which have special meaning in URLs and file names. Base64URL swaps them for - and _ and usually drops the = padding. JWTs, OAuth and many web APIs use Base64URL. If a decode fails on a token from a URL, replace - with + and _ with / (and add = padding to a multiple of four characters) before decoding — or use the JWT Parser, which handles it automatically.",
      ],
    },
  ],
  howTo: [
    { name: "Choose a mode", text: "Select Encode to convert text to Base64, or Decode to convert Base64 back to text." },
    { name: "Paste the input", text: "Type or paste into the input box. The result updates instantly." },
    { name: "Copy the output", text: "Click Copy to put the result on your clipboard." },
  ],
  faqs: [
    {
      question: "Is Base64 secure? Can I use it to hide passwords?",
      answer:
        "No. Base64 is reversible by anyone in a fraction of a second. Use real encryption (see the AES Encryption tool) for anything confidential.",
    },
    {
      question: "Why does decoding give garbled text or an error?",
      answer:
        "The input may be Base64URL (contains - or _), may be missing padding, may include line breaks or spaces, or may not be text at all (an image or binary file). For files, use the Base64 Image to File converter.",
    },
    {
      question: "Why is the encoded output longer than my text?",
      answer: "Base64 always expands data by roughly a third — 3 bytes in, 4 characters out — plus up to two = padding characters.",
    },
    {
      question: "Can I Base64-encode a file or image?",
      answer: "Yes — use the Base64 File Converter, which produces both the raw Base64 and a data URI with the correct MIME type.",
    },
  ],
  related: ["base64-file", "base64-image-to-file", "url-encoder", "jwt-debugger", "basic-auth", "text-unicode"],
};

export default content;
