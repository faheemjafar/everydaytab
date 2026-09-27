import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Online Markdown Editor with Live Preview – Free, No Sign-up",
  seoDescription:
    "Write Markdown online with a side-by-side live preview, syntax highlighting, and .md upload/download. Free browser-based Markdown editor for READMEs, docs and notes — nothing uploaded.",
  intro:
    "Write Markdown on the left and see the rendered result on the right as you type. Upload an existing .md file to edit it, or download what you have written. Supports the GitHub-flavoured syntax you use every day — headings, emphasis, links, images, code blocks with highlighting, tables, task lists and blockquotes — with nothing saved to a server.",
  sections: [
    {
      heading: "Why write in Markdown?",
      paragraphs: [
        "Markdown is plain text with a light sprinkling of punctuation to indicate formatting: # for headings, ** for bold, - for lists, and so on. Because it is just text, it works in any editor, diffs cleanly in version control, and converts to HTML, PDF and Word with standard tools. It has become the default format for README files, documentation sites, static blogs, GitHub and GitLab issues, Notion, Obsidian, Slack and Discord messages, and many CMS editors.",
      ],
    },
    {
      heading: "Markdown quick reference",
      bullets: [
        "# Heading 1, ## Heading 2, ### Heading 3",
        "**bold**, *italic*, ~~strikethrough~~, `inline code`",
        "- item or * item for bullets; 1. item for numbered lists; - [ ] task for checkboxes",
        "[link text](https://example.com) and ![alt text](image.png)",
        "> quoted text for blockquotes",
        "``` on its own line to open and close a fenced code block; add a language after the opening fence for highlighting",
        "| Col A | Col B | with a |---|---| separator row for tables",
        "--- on its own line for a horizontal rule",
      ],
    },
    {
      heading: "Working with files",
      paragraphs: [
        "Click Upload to open any .md or .txt file from your computer — it is read locally, not sent anywhere — and Download to save your work as a .md file. When you need the finished HTML rather than the Markdown, the Markdown to HTML converter produces clean markup ready to paste into a web page or email template. The Markdown Table Generator helps build wide tables without counting pipes, and the Markdown Cheatsheet covers the full syntax.",
      ],
    },
  ],
  howTo: [
    { name: "Start writing", text: "Type Markdown in the editor pane, or click Upload to load an existing .md file." },
    { name: "Watch the preview", text: "The rendered output updates instantly beside the editor, including code highlighting and tables." },
    { name: "Refine", text: "Fix formatting as you go; the preview shows exactly how GitHub-style renderers will display it." },
    { name: "Save", text: "Download the .md file or copy the text into your repository, wiki or notes app." },
  ],
  faqs: [
    {
      question: "Is my writing saved if I close the tab?",
      answer:
        "No. The editor keeps everything in your browser's memory only, so download or copy your work before leaving. Nothing is stored on a server.",
    },
    {
      question: "Does it support GitHub Flavored Markdown?",
      answer:
        "Yes — tables, fenced code blocks with syntax highlighting, task lists, strikethrough and autolinked URLs all render as they do on GitHub.",
    },
    {
      question: "Can I export to HTML or PDF?",
      answer:
        "Use the Markdown to HTML tool for clean HTML. For PDF, render the HTML in your browser and print to PDF, or paste the HTML into a document editor.",
    },
    {
      question: "Can I edit several Markdown files together?",
      answer: "The Combine Markdown tool merges multiple .md files into one document that you can then edit here.",
    },
  ],
  related: ["markdown-to-html", "markdown-table-generator", "markdown-cheatsheet", "combine-markdown", "html-markdown", "html-editor"],
};

export default content;
