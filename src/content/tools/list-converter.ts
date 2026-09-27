import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "List Converter – Sort, Dedupe, Reverse, Shuffle & Clean Lists Online",
  seoDescription:
    "Paste any list and sort it A–Z or Z–A, remove duplicates, reverse, shuffle, trim whitespace or change case — one click each. Free online list tool, works in your browser.",
  intro:
    "Paste a list — one item per line — and fix it with single-click actions: sort ascending or descending, remove duplicate lines, reverse the order, shuffle randomly, trim stray spaces, or convert everything to lower or upper case. Chain the operations in any order and copy the result. Ideal for email lists, keyword lists, CSV columns, tag sets and to-do items.",
  sections: [
    {
      heading: "Available operations",
      bullets: [
        "Sort A–Z / Z–A — alphabetical ordering, so names, tags and file names line up.",
        "Unique — removes exact duplicate lines while keeping the first occurrence in place.",
        "Reverse — flips the list end to start.",
        "Shuffle — randomises the order for draws, quiz questions or unbiased sampling.",
        "Trim — strips leading and trailing spaces and tabs from every line.",
        "Lower / Upper — normalises case so \"Apple\" and \"apple\" become identical before deduplication.",
      ],
    },
    {
      heading: "Common list clean-up recipes",
      bullets: [
        "Deduplicate an email list: Trim → Lower → Unique, so case and spacing differences don't hide duplicates.",
        "Prepare keywords for a spreadsheet: Trim → Lower → Unique → Sort A–Z.",
        "Pick a random winner or order: Shuffle, then take the first line.",
        "Tidy a copied column from Excel or Google Sheets: Trim → Unique.",
        "Reverse a chronological log so the newest entry is first.",
      ],
    },
    {
      heading: "Working with other formats",
      paragraphs: [
        "This tool works line by line. If your data is comma-separated, replace the commas with line breaks first (the Text Cleaner can do that), process it here, then join it back. For more advanced text transformations such as adding prefixes and suffixes to each line, use the Text Sorter and Text Repeater tools. Everything runs locally in your browser, so customer lists and internal data stay private.",
      ],
    },
  ],
  howTo: [
    { name: "Paste the list", text: "Put one item per line in the input box." },
    { name: "Apply actions", text: "Click Sort, Unique, Reverse, Shuffle, Trim, Lower or Upper — as many as you need, in any order." },
    { name: "Copy the result", text: "The processed list appears in the output panel; copy it or keep applying actions." },
  ],
  faqs: [
    {
      question: "Does Unique treat \"Apple\" and \"apple\" as duplicates?",
      answer: "No — matching is exact. Click Lower or Upper first if you want case-insensitive deduplication.",
    },
    {
      question: "Is there a limit on list length?",
      answer: "No practical limit. Lists of tens of thousands of lines are processed instantly in your browser.",
    },
    {
      question: "Does sorting handle numbers correctly?",
      answer:
        "Sorting is alphabetical, so 10 comes before 2. For numeric ordering, prefix numbers with leading zeros (01, 02, 10) before sorting, or sort in a spreadsheet.",
    },
    {
      question: "Is my list uploaded?",
      answer: "No. All operations run locally; nothing is transmitted or stored.",
    },
  ],
  related: ["text-sorter", "text-cleaner", "case-converter", "text-repeater", "json-csv"],
};

export default content;
