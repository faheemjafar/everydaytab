export interface CategoryContent {
  /** Short H1-adjacent tagline (one sentence). */
  tagline: string;
  /** 2–3 paragraphs of crawlable intro copy. */
  intro: string[];
  /** Tool ids to feature at the top of the hub, in order. */
  featured: string[];
  faqs: { question: string; answer: string }[];
}

const shared = {
  privacy:
    "Every tool in this category runs inside your browser. Files and text are processed on your own device with JavaScript and WebAssembly and are never uploaded to EverydayTab or any third-party server — which also means there are no queues, no file size caps set by a server, and nothing to delete afterwards.",
};

export const categoryContent: Record<string, CategoryContent> = {
  pdf: {
    tagline: "Merge, split, compress, crop and edit PDFs without uploading them anywhere.",
    intro: [
      "EverydayTab's PDF tools cover the everyday jobs that usually push people towards a paid desktop suite: combining several files into one, pulling out or deleting pages, rotating scans, adding page numbers, headers, footers and watermarks, cropping margins, inverting colours for night reading, and checking whether a file is damaged.",
      shared.privacy,
    ],
    featured: ["merge-pdf", "split-pdf", "compress-pdf", "crop-pdf", "rotate-pdf", "delete-pages", "jpg-to-pdf", "page-numbers"],
    faqs: [
      { question: "Are these PDF tools really free?", answer: "Yes — every tool is free with no page limits, no watermark and no account. They are funded by the wider EverydayTab site rather than by upsells." },
      { question: "Is it safe to use with confidential documents?", answer: "The PDF never leaves your device; it is opened and rewritten in your browser using the pdf-lib and PDF.js libraries. Close the tab and nothing remains." },
      { question: "Can I edit the text inside a PDF?", answer: "These tools work on the page level — combining, splitting, cropping, stamping and re-ordering. For rewriting body text you still need a dedicated PDF editor, though PDF to Text lets you extract the content for editing elsewhere." },
    ],
  },
  developer: {
    tagline: "Formatters, converters, testers and generators for everyday programming work.",
    intro: [
      "A working developer's toolbox: format and validate JSON, decode JWTs, test regular expressions, validate and explain cron expressions, convert curl commands and docker run lines, prettify SQL, generate TypeScript or Go types from JSON, inspect HTTP status codes and headers, and much more.",
      "Nothing you paste — tokens, connection strings, production payloads — is sent to a server. Each tool runs locally, so it is safe to use with real data during debugging.",
    ],
    featured: ["json-formatter", "jwt-debugger", "regex", "crontab-generator", "curl-converter", "json-ts", "sql-prettify", "url-parser"],
    faqs: [
      { question: "Is it safe to paste a production JWT or API key here?", answer: "Yes. Decoding and formatting happen in your browser only; nothing is transmitted. Still, avoid pasting live secrets on shared or public machines." },
      { question: "Do the tools work offline?", answer: "Once a tool page has loaded it keeps working without a connection, because all processing is client-side." },
    ],
  },
  text: {
    tagline: "Count, clean, convert, compare and transform text in your browser.",
    intro: [
      "Text tools for writers, students, editors and developers: count words and characters against platform limits, change case, remove duplicate or blank lines, sort and reverse lists, strip HTML, add line numbers, compare two versions of a document, generate placeholder copy and analyse readability.",
      "Everything runs locally — paste a manuscript, a legal document or a customer list and it stays on your machine.",
    ],
    featured: ["word-counter", "case-converter", "text-diff", "text-cleaner", "text-sorter", "lorem-ipsum", "strip-html", "readability-analyzer"],
    faqs: [
      { question: "Is there a length limit for the text tools?", answer: "No practical limit. Because processing happens in your browser, even book-length documents are handled instantly." },
      { question: "Is my text stored anywhere?", answer: "No. Text lives in the page while you work and is discarded when you close the tab." },
    ],
  },
  converter: {
    tagline: "Convert between formats, units, encodings and standards — instantly.",
    intro: [
      "Converters for data and everyday values: validate IBANs, convert Unix timestamps and time zones, translate between number bases and units, encode Base64 and URLs, switch between JSON, YAML, TOML, XML and CSV, convert colour formats and turn text into Unicode escapes or Morse code.",
      "Conversions are computed locally, with no rate limits and no account.",
    ],
    featured: ["iban-validator", "timestamp-converter", "unit-converter", "integer-base-converter", "base64-file", "json-yaml", "color-converter", "time-zone-converter"],
    faqs: [
      { question: "Do the converters handle large files?", answer: "Yes — file-based converters such as Base64 File Converter and JSON/CSV work with anything your browser's memory can hold, typically hundreds of megabytes." },
      { question: "Are the results accurate for financial use?", answer: "Validators like the IBAN checker follow the official standards (ISO 13616 and the SWIFT registry). They confirm a number is well-formed, not that an account exists — always confirm with the bank for large payments." },
    ],
  },
  math: {
    tagline: "Calculators for everyday numbers — percentages, dates, health, money and more.",
    intro: [
      "Quick, accurate calculators that show their working: percentages and percentage change, dates and ages, BMI and calorie needs, GPA, salary and tip splitting, fractions, ETA and elapsed time, and a scientific expression evaluator.",
      "All calculations run in your browser and update as you type — no page reloads, no ads between you and the answer.",
    ],
    featured: ["calculator", "percentage-calculator", "date-calculator", "age-calculator", "bmi-calculator", "tip-calculator", "salary-calculator", "gpa-calculator"],
    faqs: [
      { question: "Can I trust these calculators for important decisions?", answer: "They use standard formulas and are accurate for everyday use. For medical, legal or tax decisions, treat the results as a starting point and confirm with a professional." },
    ],
  },
  image: {
    tagline: "Resize, crop, compress and convert images — plus CSS layout generators.",
    intro: [
      "Image tools that keep your photos on your device: resize to exact dimensions, crop to a ratio, compress for the web, convert between JPG, PNG, WebP and more, calculate aspect ratios, optimise SVGs, extract palettes and check contrast. Alongside them sit visual generators for CSS grid, flexbox, box shadows, gradients and glassmorphism.",
      shared.privacy,
    ],
    featured: ["image-resize", "image-cropper", "image-compressor", "image-converter", "aspect-ratio", "svg-optimizer", "css-grid", "css-flexbox"],
    faqs: [
      { question: "Will compressing or converting reduce my image quality?", answer: "Resizing and cropping are lossless apart from the discarded pixels. Compression and conversion to JPG or WebP are lossy by design, and you control the quality slider; PNG output stays lossless." },
      { question: "Is there a maximum image size?", answer: "Images up to the browser's canvas limit — roughly 16,000 pixels per side — work, which covers phone and DSLR photos comfortably." },
    ],
  },
  color: {
    tagline: "Convert, name, mix, compare and test colours for design and accessibility.",
    intro: [
      "Colour tools for designers and front-end developers: convert between HEX, RGB, HSL, LAB, LCH and OKLCH; find the closest named colour; build harmonies; mix two colours; measure perceptual distance (Delta E); extract palettes from images; check WCAG contrast; and preview how a palette looks to people with colour vision deficiency.",
    ],
    featured: ["color-converter", "color-name-finder", "contrast-checker", "color-palette", "color-harmony", "color-mixer", "color-distance", "color-blindness"],
    faqs: [
      { question: "What is OKLCH and why do these tools support it?", answer: "OKLCH is a perceptually uniform colour space now supported in CSS. Equal steps in OKLCH look like equal steps to the eye, which makes it far better than HSL for generating consistent palettes and tints." },
    ],
  },
  file: {
    tagline: "Zip, unzip and rename files without installing anything.",
    intro: [
      "File utilities that run in your browser: create ZIP archives from multiple files, extract existing ZIPs, batch-rename files with patterns, and compress text. Because nothing is uploaded, they are safe for confidential documents and fast for large archives.",
    ],
    featured: ["compressor", "extractor", "renamer"],
    faqs: [
      { question: "Can I open password-protected ZIP files?", answer: "Not currently — encrypted archives need the key to read their entries. Standard ZIPs, including nested folders and ZIP64 archives over 4 GB, are supported." },
    ],
  },
  seo: {
    tagline: "Generate meta tags, schema, sitemaps and robots files; analyse keywords and readability.",
    intro: [
      "SEO tools built by people who use them: generate title and meta description tags, Open Graph and Twitter card markup, FAQ schema, robots.txt and XML sitemaps; extract and check keyword density; analyse readability; slugify URLs; and debug how a page's Open Graph tags will render.",
    ],
    featured: ["meta-tag-generator", "keywords", "faq-schema", "opengraph", "robots", "sitemap", "slugify"],
    faqs: [
      { question: "Will structured data from the FAQ schema generator get me rich results?", answer: "It produces valid schema.org FAQPage JSON-LD. Google decides whether to show rich results based on page quality and eligibility; validate the output with Google's Rich Results Test after publishing." },
    ],
  },
  markdown: {
    tagline: "Write, preview, convert and combine Markdown.",
    intro: [
      "Markdown tools for documentation and content: a live-preview editor with syntax highlighting and file upload, a Markdown-to-HTML converter, an HTML-to-Markdown converter, a table generator that saves you counting pipes, a tool for combining several .md files, and a full syntax cheatsheet.",
    ],
    featured: ["markdown-editor", "markdown-to-html", "markdown-table-generator", "html-markdown", "combine-markdown", "markdown-cheatsheet"],
    faqs: [
      { question: "Which Markdown flavour is supported?", answer: "GitHub Flavored Markdown — tables, fenced code blocks, task lists and strikethrough render exactly as they do on GitHub." },
    ],
  },
  generator: {
    tagline: "Passwords, UUIDs, QR codes, barcodes, invoices, placeholder text and more.",
    intro: [
      "Generators for the things you need to create quickly and correctly: strong passwords, UUIDs and ULIDs, QR codes and Wi-Fi QR codes, retail and logistics barcodes, random numbers, formal emails, invoices, hashes and Lorem Ipsum. Everything is generated locally using your browser's cryptographically secure random source where randomness matters.",
    ],
    featured: ["password-generator", "uuid-generator", "qr-generator", "barcode-generator", "wifi-qr", "invoice-generator", "random-number-generator", "lorem-ipsum"],
    faqs: [
      { question: "Are the generated passwords and UUIDs safe to use?", answer: "Yes. They are produced with the Web Crypto API's secure random generator on your device and are never transmitted or logged." },
    ],
  },
  security: {
    tagline: "Hash, encrypt, sign and inspect — all client-side.",
    intro: [
      "Security utilities for developers and admins: generate and verify hashes and HMACs, encrypt and decrypt with AES, hash and check bcrypt passwords, generate RSA key pairs, create and decode JWTs, produce TOTP codes, generate BIP39 mnemonics, decode SSL certificates and test password strength.",
      "Because these tools handle sensitive material, they are built to run entirely in your browser — keys and plaintext never leave your device.",
    ],
    featured: ["hash-generator", "aes-encryption", "bcrypt", "rsa-generator", "jwt-debugger", "otp-generator", "password-strength", "ssl-decoder"],
    faqs: [
      { question: "Is it safe to encrypt real data here?", answer: "The cryptography runs locally with the Web Crypto API and audited libraries, and nothing is transmitted. As with any browser tool, use a trusted device and avoid public computers for sensitive work." },
    ],
  },
  audio: {
    tagline: "Convert, trim, normalise, equalise and transform audio — no upload, no watermark.",
    intro: [
      "A browser-based audio toolkit powered by FFmpeg compiled to WebAssembly: convert between MP3, WAV, FLAC, AAC and OGG; trim, split and merge; change volume or normalise to LUFS standards; equalise; change speed and pitch; reverse; fade; remove silence; resample; isolate vocals; edit metadata and make ringtones.",
      shared.privacy,
    ],
    featured: ["audio-converter", "audio-trimmer", "loudness-normalizer", "audio-equalizer", "speed-changer", "audio-reverser", "volume-adjuster", "audio-resampler"],
    faqs: [
      { question: "Why do audio tools take a moment to start?", answer: "The first use downloads the FFmpeg WebAssembly engine (about 30 MB) to your browser. It is cached afterwards, so subsequent tools load instantly." },
      { question: "Is there a file size or length limit?", answer: "No server limit — files are processed on your device. Full albums and hour-long recordings work on any modern computer." },
    ],
  },
  video: {
    tagline: "Trim, convert, compress, rotate, re-time and capture video in your browser.",
    intro: [
      "Video tools that never upload your footage: convert between formats, compress for sharing, trim without re-encoding, merge clips, change speed with pitch-corrected audio, rotate and flip, crop and change aspect ratio, mute, extract audio, grab full-resolution screenshots and convert to and from GIF.",
      shared.privacy,
    ],
    featured: ["video-trimmer", "video-converter", "video-compressor", "video-speed-changer", "video-rotator", "video-screenshot", "video-to-gif", "extract-audio"],
    faqs: [
      { question: "How long does processing take?", answer: "It depends on your device rather than a server queue. Trimming is near-instant because it copies streams; re-encoding tasks such as speed changes and rotation run at roughly real-time for 1080p on a modern laptop." },
      { question: "Is there a watermark or size limit?", answer: "No watermark, no account, and no upload limit — the only constraint is your device's memory." },
    ],
  },
};

export function getCategoryContent(id: string): CategoryContent | undefined {
  return categoryContent[id];
}
