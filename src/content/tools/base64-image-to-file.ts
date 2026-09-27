import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Base64 to Image / File Converter – Decode & Download Online, Free",
  seoDescription:
    "Paste a Base64 string or data URI and download it as a real file — PNG, JPG, PDF, SVG or anything else. Preview images instantly. Free, private, decodes in your browser.",
  intro:
    "Turn a Base64 string back into the file it represents. Paste the text — with or without the data:image/png;base64, prefix — and the tool reads the file type from the prefix (defaulting to PNG when there is none), shows a preview for images, and gives you a download button. Useful for extracting images embedded in HTML or CSS, saving attachments from API responses and logs, or checking what an encoded blob actually contains. Decoding happens locally.",
  sections: [
    {
      heading: "Where Base64 files come from",
      bullets: [
        "Data URIs in HTML <img src> and CSS url() — inline images and fonts on web pages and in emails.",
        "JSON API responses and webhooks that carry files as Base64 strings because JSON cannot hold binary.",
        "Database columns and log files that store screenshots, signatures or PDFs as text.",
        "Kubernetes Secrets and configuration files where certificates and keys are Base64-encoded.",
        "Mobile app and Postman exports that embed request bodies with encoded attachments.",
      ],
    },
    {
      heading: "How the type is detected",
      paragraphs: [
        "If the string starts with a data URI prefix (data:application/pdf;base64,…), the MIME type is taken from it and the file extension follows. If there is no prefix, the file is treated as a PNG image — so for a bare Base64 string of a PDF, ZIP or other type, add the appropriate prefix (for example data:application/pdf;base64,) before decoding. Images are rendered in a preview so you can confirm the content before saving; other types show their size.",
      ],
    },
    {
      heading: "Troubleshooting a decode",
      bullets: [
        "\"Invalid character\" errors usually mean the string is Base64URL (uses - and _) — replace them with + and / — or contains line breaks and spaces, which are stripped automatically here.",
        "A length that is not a multiple of four needs = padding; the tool adds it.",
        "If a PNG preview appears broken, the string was probably truncated when copied — check the end of the source.",
        "Very large strings (tens of MB) work, but paste them from a file rather than a terminal to avoid clipboard limits.",
      ],
    },
  ],
  howTo: [
    { name: "Paste the Base64", text: "Drop the encoded string into the input, with or without a data URI prefix." },
    { name: "Check the preview", text: "Images are shown immediately; other files show their type and size." },
    { name: "Download", text: "Click Download to save the decoded file with the correct extension." },
  ],
  faqs: [
    {
      question: "Can I convert Base64 to PDF, MP3 or ZIP, not just images?",
      answer: "Yes. Any file type decodes. Include the data URI prefix (data:application/pdf;base64,…) so the correct extension is used; without a prefix the output is saved as PNG.",
    },
    {
      question: "Why does my image look wrong or fail to load?",
      answer:
        "The string is most likely incomplete or was altered (for example line-wrapped by an email client). Copy it again from the source and make sure the whole string is included.",
    },
    {
      question: "Is my data sent to a server?",
      answer: "No. Decoding uses the browser's built-in functions and the file is assembled in memory on your device.",
    },
    {
      question: "How do I go the other way, from file to Base64?",
      answer: "Use the Base64 File Converter, which produces the raw Base64 and a ready-made data URI.",
    },
  ],
  related: ["base64-file", "base64", "image-converter", "svg-placeholder", "jwt-debugger"],
};

export default content;
