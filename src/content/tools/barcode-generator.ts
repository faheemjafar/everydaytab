import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Barcode Generator – Free CODE128, EAN-13, UPC-A & CODE39 Online",
  seoDescription:
    "Generate print-ready barcodes online for free. Supports CODE128, CODE39, EAN-13, UPC-A, ITF-14 and MSI. Adjust size, colours and text, then download as a high-resolution PNG. No sign-up.",
  intro:
    "Create scannable 1D barcodes in seconds. Choose a symbology, type the value, adjust bar width, height, margin, colours and the human-readable text, and download a crisp PNG for labels, packaging, inventory tags or documents. The barcode is rendered locally in your browser, so product codes and internal SKUs never leave your device.",
  sections: [
    {
      heading: "Which barcode format should I use?",
      bullets: [
        "CODE128 — the best general-purpose choice. Encodes any ASCII character (letters, numbers, symbols) with high density and a built-in check digit. Used for shipping labels, logistics, asset tags and internal inventory.",
        "EAN-13 — the 13-digit retail barcode used on products sold outside North America. The 12 data digits usually come from GS1; the 13th is a check digit calculated automatically.",
        "UPC-A — the 12-digit retail code used in the US and Canada. Structurally a subset of EAN-13 (an EAN-13 starting with 0).",
        "CODE39 — an older alphanumeric format (uppercase letters, digits and a few symbols) still common in defence, automotive and healthcare because almost every scanner reads it.",
        "ITF-14 — a 14-digit interleaved format printed on cartons and outer cases to identify trade items at the shipping level; tolerant of lower-quality corrugated printing.",
        "MSI (Modified Plessey) — a numeric-only format used mainly for shelf labels and library inventory.",
      ],
    },
    {
      heading: "Getting a barcode that actually scans",
      paragraphs: [
        "Most scan failures come down to size and contrast, not the encoder. Keep dark bars on a light background — black on white is safest — and never invert the colours. Leave a quiet zone (blank margin) of at least 10 times the narrowest bar width on both sides; the margin setting here controls that. For retail EAN/UPC codes the nominal size is about 37 × 26 mm, and you should not shrink below 80% of that.",
        "Download the PNG at a large bar width (3–4) and scale it down in your layout software rather than upscaling a small image, which blurs the bar edges. If you need vector output for professional print, the Barcode Studio tool exports SVG.",
      ],
    },
    {
      heading: "Barcodes vs QR codes",
      paragraphs: [
        "1D barcodes like the ones generated here store a short identifier — typically a product or asset number — and are read by laser and CCD scanners at point-of-sale and in warehouses. If you need to encode a URL, contact card, Wi-Fi credentials or more than a few dozen characters, a 2D code is more appropriate; use the QR Code Generator instead.",
      ],
    },
  ],
  howTo: [
    { name: "Choose a format", text: "Select CODE128 for general use, EAN-13 or UPC-A for retail products, CODE39 for legacy systems, ITF-14 for shipping cartons, or MSI for shelf labels." },
    { name: "Enter the value", text: "Type the number or text to encode. EAN-13 needs 12 or 13 digits and UPC-A needs 11 or 12; the check digit is validated or calculated for you." },
    { name: "Style the barcode", text: "Set the bar width, height, margin, font size and colours. Toggle the human-readable text underneath on or off." },
    { name: "Download", text: "Click Download to save a PNG. Use a larger bar width if the barcode will be printed at a large physical size." },
  ],
  faqs: [
    {
      question: "Is this barcode generator free for commercial use?",
      answer:
        "Yes. The barcodes you generate are yours to use on products, labels, invoices and packaging without attribution or fees. Note that for retail EAN/UPC codes you still need a GS1-issued company prefix so the number itself is globally unique.",
    },
    {
      question: "Why does my EAN-13 or UPC value show an error?",
      answer:
        "EAN-13 requires exactly 12 digits (the check digit is added) or 13 digits with a correct check digit; UPC-A requires 11 or 12 digits. Letters and symbols are not allowed in these retail formats — use CODE128 if you need them.",
    },
    {
      question: "Can I generate many barcodes at once?",
      answer:
        "This tool creates one barcode at a time with full styling control. For batch generation from a list of values, sequential numbering and SVG export, use the Barcode Studio tool on EverydayTab.",
    },
    {
      question: "What resolution is the downloaded image?",
      answer:
        "The PNG is rendered at the pixel dimensions you see on screen, determined by the bar width, height and margin settings. Increase the bar width to 3 or 4 for a higher-resolution image that stays sharp when printed at 300 DPI.",
    },
    {
      question: "Does the barcode data get uploaded anywhere?",
      answer:
        "No. Encoding and rendering happen entirely in your browser with the JsBarcode library. Nothing is sent to a server, so it is safe for internal part numbers and unreleased product codes.",
    },
  ],
  related: ["qr-generator", "wifi-qr", "invoice-generator", "uuid-generator"],
};

export default content;
