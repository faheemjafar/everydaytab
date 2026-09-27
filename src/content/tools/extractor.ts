import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Unzip Files Online Free – Open & Extract ZIP Archives in Browser",
  seoDescription:
    "Open and extract ZIP files online without installing software. Extract one or several archives at once and download the files you need. Free, private — the ZIP never leaves your device.",
  intro:
    "Open a ZIP file on any device — a Chromebook, a locked-down work laptop, a phone or a tablet — and pull out exactly the files you need. Drop one or more archives in, click Extract, and download the files you need from the resulting list with their sizes. Extraction runs locally in your browser, so the archive is never uploaded and there is no size cap imposed by a server.",
  sections: [
    {
      heading: "How online extraction works without uploading",
      paragraphs: [
        "A ZIP file is a container: a list of entries, each compressed independently with the DEFLATE algorithm, plus a central directory describing where every entry lives. This tool reads that directory with JavaScript and decompresses every entry in your browser's memory, then lists the extracted files for download. There is no upload wait, and nothing about the contents is visible to anyone else.",
      ],
    },
    {
      heading: "When an online unzipper is the right tool",
      bullets: [
        "You cannot install software — school or corporate devices, kiosks, Chromebooks.",
        "You only need one file from a large archive and do not want to extract everything.",
        "You want to inspect an archive from an email before trusting it — see the file names and sizes first.",
        "You are on a phone or tablet whose file manager struggles with ZIPs.",
        "You have several archives to unpack at once — drop them all in together.",
        "The archive contains files your OS flags as unsafe; viewing the list lets you decide what to extract.",
      ],
    },
    {
      heading: "Supported archives and limits",
      paragraphs: [
        "Standard .zip files created by Windows, macOS, Linux, 7-Zip, WinRAR and every programming language's zip library are supported, including archives with nested folders and files larger than 4 GB (ZIP64). Password-protected archives cannot be opened here because the encryption key is needed to read the entries. Other formats — RAR, 7z, tar.gz — are different container types; convert them to ZIP first or use a desktop tool. Memory is the only practical limit: multi-gigabyte archives work on desktops with plenty of RAM but may fail on phones.",
      ],
    },
  ],
  howTo: [
    { name: "Add the ZIP", text: "Drag one or more .zip files onto the page or click to browse for them." },
    { name: "Extract", text: "Click Extract. Every entry is decompressed locally and listed with its size." },
    { name: "Download", text: "Click any file in the list to save it to your device." },
  ],
  faqs: [
    {
      question: "Is my ZIP file uploaded to a server?",
      answer:
        "No. The archive is read and decompressed entirely in your browser using JavaScript. It is never transmitted anywhere, which makes it safe for confidential documents.",
    },
    {
      question: "Can I open password-protected ZIP files?",
      answer:
        "Not currently. Encrypted archives require the password to decrypt each entry; use a desktop tool such as 7-Zip for those.",
    },
    {
      question: "What is the maximum ZIP size?",
      answer:
        "There is no fixed limit — it depends on your device's memory. Archives of a few gigabytes typically open fine on a desktop computer.",
    },
    {
      question: "Can I extract RAR or 7z files?",
      answer:
        "This tool handles the ZIP format only. RAR and 7z are different formats that need a dedicated extractor.",
    },
    {
      question: "How do I create a ZIP file online?",
      answer: "Use the File Compressor tool on EverydayTab to bundle files into a ZIP archive, also entirely in your browser.",
    },
  ],
  related: ["compressor", "renamer", "base64-file", "image-converter"],
};

export default content;
