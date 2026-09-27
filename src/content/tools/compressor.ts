import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Zip Files Online Free – Create ZIP Archives in Your Browser",
  seoDescription:
    "Compress multiple files into a single ZIP archive online, free and private. Drag in documents, images or any files, see the size saving, and download the ZIP. No upload, no software to install.",
  intro:
    "Bundle several files into one ZIP archive — to email a set of documents, share a folder of photos, or shrink text-heavy files before uploading them somewhere. Drop the files in, click Compress, see how much space you saved, and download the archive. Compression runs in your browser with the JSZip library, so your files never leave your device.",
  sections: [
    {
      heading: "How much will ZIP shrink my files?",
      paragraphs: [
        "ZIP uses the DEFLATE algorithm, which finds repeated patterns in data. Text-based files — documents, spreadsheets exported as CSV, source code, logs, XML and JSON — often compress by 60–90%. Files that are already compressed gain almost nothing: JPEG photos, MP4 video, MP3 audio, PDFs with embedded images and Office .docx/.xlsx files (which are already ZIPs internally) typically shrink by only 1–5%. For those, the value of zipping is bundling many files into one attachment rather than saving space.",
      ],
    },
    {
      heading: "When to zip",
      bullets: [
        "Emailing several attachments at once — one ZIP is easier to send and to save than ten separate files.",
        "Uploading to a form or portal that accepts a single file.",
        "Archiving a project folder, a batch of scans or a set of exports.",
        "Preserving file names with characters some platforms mangle.",
        "Reducing large text or CSV datasets before transfer.",
      ],
    },
    {
      heading: "Tips",
      bullets: [
        "Rename files first with the Batch File Renamer if you want a tidy archive.",
        "To make images smaller, compress them with the Image Compressor before zipping — ZIP cannot shrink JPEGs meaningfully.",
        "ZIP archives created here have no password; use a desktop tool such as 7-Zip if you need encryption.",
        "The archive opens with the built-in extractor on Windows, macOS, Linux, iOS and Android — recipients need no extra software.",
      ],
    },
  ],
  howTo: [
    { name: "Add files", text: "Drag any number of files onto the page or click to browse. You can add more before compressing." },
    { name: "Compress", text: "Click Compress. Files are deflated in your browser and the size saving is shown." },
    { name: "Download", text: "Save the ZIP archive." },
  ],
  faqs: [
    {
      question: "Is there a file size limit?",
      answer: "No server limit — everything is processed in your browser's memory. A few gigabytes works on most desktops; phones have less headroom.",
    },
    {
      question: "Why did my photos barely shrink?",
      answer:
        "JPEG, PNG, video and audio files are already compressed; ZIP can only bundle them. Use the Image Compressor or Video Compressor to reduce their size first.",
    },
    {
      question: "Can I add a password to the ZIP?",
      answer: "Not in this tool. Password-protected ZIPs require a desktop utility such as 7-Zip, WinRAR or the macOS Terminal (zip -e).",
    },
    {
      question: "Are my files uploaded?",
      answer: "No. Compression happens locally; the files and the archive never leave your device.",
    },
  ],
  related: ["extractor", "renamer", "image-compressor", "compress-pdf", "video-compressor"],
};

export default content;
