import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "File to Base64 Converter – Encode Images & Files as Data URIs Online",
  seoDescription:
    "Convert any file or image to a Base64 string online for free. Get the raw Base64 or a ready-to-use data URI for HTML, CSS, JSON and APIs. Private — files are encoded in your browser.",
  intro:
    "Turn an image, font, PDF or any other file into a Base64 string you can paste directly into HTML, CSS, JSON, an email template or an API request. Drop the file in and copy either the raw Base64 or the complete data URI with its MIME type. Encoding happens locally in your browser — the file itself is never uploaded.",
  sections: [
    {
      heading: "What Base64 is and why files get encoded this way",
      paragraphs: [
        "Base64 represents binary data using 64 printable ASCII characters (A–Z, a–z, 0–9, + and /), so any file can travel through systems that only accept text — JSON payloads, XML, email bodies, URL parameters, environment variables and source code. Every three bytes of input become four characters of output, so the encoded string is about 33% larger than the original file. That overhead is the trade-off for being able to embed the data inline instead of referencing a separate file.",
        "A data URI wraps the Base64 string with its MIME type — data:image/png;base64,iVBORw0KGgo… — so browsers know how to decode it. Paste it into an <img src>, a CSS url() or a <link> and the asset loads with no extra HTTP request.",
      ],
    },
    {
      heading: "Common uses",
      bullets: [
        "Inline small icons, logos and SVGs in HTML or CSS to eliminate extra requests.",
        "Embed images in HTML emails where external images may be blocked.",
        "Send files inside JSON to REST APIs and webhooks that do not support multipart uploads.",
        "Store small binary blobs in config files, databases or environment variables.",
        "Embed fonts or images in a single self-contained HTML file for offline distribution.",
        "Produce test fixtures for unit tests without shipping binary files.",
      ],
    },
    {
      heading: "When not to use Base64",
      paragraphs: [
        "Because Base64 inflates size by a third and cannot be cached separately from the page, it makes sense for assets under roughly 10–20 KB. Large photos, videos and PDFs should stay as normal files served over HTTP, where compression and caching work in their favour. Inline data also cannot be lazy-loaded, so a page with many Base64 images may render slower than one with regular image tags. For images you can shrink first, the Image Compressor reduces the size before encoding.",
      ],
    },
  ],
  howTo: [
    { name: "Select a file", text: "Drop any file — image, PDF, font, audio, document — onto the page or click to browse." },
    { name: "Wait for encoding", text: "The file is read and encoded instantly in your browser; the size and MIME type are shown." },
    { name: "Copy the output", text: "Copy the raw Base64 string, or the full data URI including the data:mime;base64, prefix." },
    { name: "Paste it in", text: "Use it in your HTML, CSS, JSON, email template or API request." },
  ],
  faqs: [
    {
      question: "What is the difference between the raw Base64 and the data URI?",
      answer:
        "The raw string is just the encoded bytes and is what APIs and databases usually expect. The data URI adds the data:<mime>;base64, prefix so browsers can use it directly in src and url() attributes.",
    },
    {
      question: "Is there a file size limit?",
      answer:
        "No fixed limit — encoding happens in your browser's memory. Files of tens of megabytes work, though very large Base64 strings can be slow for the destination page or editor to handle.",
    },
    {
      question: "Is my file uploaded?",
      answer: "No. The browser's FileReader API encodes the file locally; nothing is sent to a server.",
    },
    {
      question: "How do I convert Base64 back to a file?",
      answer: "Use the Base64 Image to File tool to decode a Base64 string or data URI back into a downloadable file.",
    },
    {
      question: "Why is the Base64 string larger than my file?",
      answer: "Base64 encodes every 3 bytes as 4 text characters, so output is always about 33% larger than the input, plus a few bytes for the data URI prefix.",
    },
  ],
  related: ["base64-image-to-file", "base64", "image-compressor", "svg-placeholder"],
};

export default content;
