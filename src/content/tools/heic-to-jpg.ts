import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "HEIC to JPG Converter – Convert iPhone Photos Online Free, No Upload",
  seoDescription:
    "Convert HEIC and HEIF photos from iPhone or iPad to JPG or PNG in your browser. Batch convert, adjust quality, download a ZIP. Free, private — files are never uploaded.",
  intro:
    "Convert HEIC photos to JPG or PNG without installing anything or sending your pictures to a server. Drop one photo or a whole batch, choose the quality, and download the converted files individually or in a single ZIP. Decoding happens entirely in your browser using WebAssembly.",
  sections: [
    {
      heading: "Why iPhone photos are HEIC",
      paragraphs: [
        "Since iOS 11, iPhones and iPads save photos in HEIF (High Efficiency Image Format) with the .heic extension. It stores the same quality as JPEG in roughly half the space, which is why Apple made it the default. The downside is compatibility: Windows needs a paid extension to open it, many websites and forms reject it, and older software doesn't recognise it at all.",
        "Converting to JPG gives you a file that opens everywhere. Choose PNG instead when you need a lossless copy or plan to edit the image further; expect PNG files to be several times larger.",
      ],
    },
    {
      heading: "Quality and file size",
      bullets: [
        "JPEG quality 90% keeps the photo visually identical to the original for most uses.",
        "Drop to 75–80% for email attachments or web uploads where size matters more than pixel-level fidelity.",
        "HEIC photos taken in Portrait mode or as Live Photos convert as a single still image; depth and motion data aren't carried over.",
        "Converted files don't include the HEIC's EXIF metadata (location, camera settings), which is often what you want when sharing publicly.",
      ],
    },
    {
      heading: "Avoiding HEIC in the first place",
      paragraphs: [
        "If you'd rather your iPhone shot JPEG directly, open Settings → Camera → Formats and choose Most Compatible. You can also set Settings → Photos → Transfer to Mac or PC to Automatic, which converts to JPEG when you copy photos by cable.",
      ],
    },
  ],
  howTo: [
    { name: "Add HEIC photos", text: "Drop .heic or .heif files onto the page, or click to browse. You can add more afterwards." },
    { name: "Choose JPG or PNG", text: "Pick the output format and, for JPG, the quality level." },
    { name: "Convert", text: "Click Convert. Each photo is decoded locally; thumbnails appear as they finish." },
    { name: "Download", text: "Save photos one at a time or click Download all to get a ZIP." },
  ],
  faqs: [
    {
      question: "Are my photos uploaded anywhere?",
      answer: "No. The HEIC decoder runs in your browser via WebAssembly and the converted files stay on your device until you download them.",
    },
    {
      question: "Why did a file fail to convert?",
      answer: "Some files with a .heic extension are actually JPEGs renamed by a messaging app, and some HEIF variants (10-bit, HDR or image sequences) aren't supported by the decoder. Try exporting the photo again from the Photos app.",
    },
    {
      question: "Can I convert many photos at once?",
      answer: "Yes — add as many as you like. They're processed one after another and you can download everything as a ZIP.",
    },
    {
      question: "Does converting reduce quality?",
      answer: "HEIC is already lossy, and JPG adds a second lossy step. At 90% quality the difference isn't visible. Choose PNG for a lossless copy of the decoded image.",
    },
    {
      question: "Does it work on Windows and Android?",
      answer: "Yes. Because decoding runs in the browser, it works on any modern desktop or mobile browser regardless of operating system.",
    },
  ],
  related: ["image-converter", "image-compressor", "image-resize", "jpg-to-pdf", "pdf-to-image"],
};

export default content;
