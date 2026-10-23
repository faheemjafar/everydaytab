import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "PDF to JPG / PNG Converter – Convert PDF Pages to Images Online Free",
  seoDescription:
    "Convert PDF pages to JPG, PNG or WebP images at 72, 150 or 300 dpi. Pick the pages, download one image or a ZIP of all pages. Free, no upload — rendered in your browser.",
  intro:
    "Turn any PDF into images. Choose the pages you need, pick JPG, PNG or WebP, set the resolution, and download the results individually or as a single ZIP. Each page is rendered in your browser with the same engine Firefox uses for PDFs, so the file never leaves your device.",
  sections: [
    {
      heading: "Choosing a format and resolution",
      paragraphs: [
        "JPG is the right choice for photos, scans and anything you'll share on the web or paste into a document — small files, universally supported. PNG is lossless and keeps sharp text and line art pixel-perfect, which suits slides, diagrams and screenshots. WebP gives the smallest files of the three at the same quality but isn't accepted everywhere yet.",
        "Resolution is measured in dots per inch against the PDF's page size. 72 dpi matches the on-screen size and is ideal for thumbnails and previews; 150 dpi is a good default for sharing; 300 dpi produces print-ready images (a Letter page becomes 2550 × 3300 px). Higher dpi means noticeably larger files and longer rendering on long documents.",
      ],
    },
    {
      heading: "Common uses",
      bullets: [
        "Pull a single page out of a report to paste into a slide, email or chat.",
        "Post a PDF flyer, menu or poster on social media, which only accept images.",
        "Create thumbnails or a gallery preview for a document library.",
        "Convert scanned PDFs back into photos you can crop and annotate.",
        "Prepare pages for an image-only workflow such as OCR or a presentation tool.",
      ],
    },
    {
      heading: "Tips",
      bullets: [
        "Use the page picker's All / Odd / Even shortcuts, or type ranges such as 1-3, 7, 10-.",
        "JPEG quality around 85–90% is visually lossless for most documents; drop lower only when size matters most.",
        "For vector-heavy pages (CAD drawings, charts) choose PNG at 150 dpi or more to avoid blurry lines.",
        "Very large documents render page by page — you can watch the progress bar and the gallery fills as pages finish.",
      ],
    },
  ],
  howTo: [
    { name: "Open the PDF", text: "Drop a PDF onto the page or click to browse. Nothing is uploaded." },
    { name: "Pick pages", text: "Keep all pages or select specific ones with the chips or a range like 2-5." },
    { name: "Choose format and dpi", text: "Select JPG, PNG or WebP, the quality and the resolution." },
    { name: "Convert and download", text: "Click Convert to images, then download a single image or the ZIP with every page." },
  ],
  faqs: [
    {
      question: "Is there a page or file size limit?",
      answer: "No fixed limit — rendering happens on your device, so the practical limit is your browser's memory. Hundreds of pages at 150 dpi are fine on a typical laptop.",
    },
    {
      question: "Does this extract the original embedded images?",
      answer: "It renders each full page as an image, which is what most people need. Embedded photos come out at whatever size they appear on the page at the dpi you choose.",
    },
    {
      question: "Why do PDF files turn out blurry at 72 dpi?",
      answer: "72 dpi is screen resolution; text becomes soft when zoomed or printed. Choose 150 or 300 dpi for crisp results.",
    },
    {
      question: "Can I convert a password-protected PDF?",
      answer: "Only if it opens without a password. Encrypted PDFs that require a password to view can't be rendered.",
    },
    {
      question: "Which option keeps transparency?",
      answer: "PDF pages are rendered on a white background, so none of the formats carries transparency from the PDF itself. Choose PNG if you need to edit the image later without compression artefacts.",
    },
  ],
  related: ["jpg-to-pdf", "pdf-to-text", "split-pdf", "compress-pdf", "image-converter", "image-compressor"],
};

export default content;
