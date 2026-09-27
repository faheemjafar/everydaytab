import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Slugify Online – Convert Text or Titles to Clean URL Slugs",
  seoDescription:
    "Turn any title into a clean, lowercase, hyphenated URL slug instantly. Strips accents, punctuation and extra spaces. Free slug generator for blog posts, product pages and file names.",
  intro:
    "Paste a headline, product name or sentence and get a URL-safe slug: lowercase, accents removed, punctuation stripped, spaces collapsed into single hyphens. \"How to Use EverydayTab for FREE!\" becomes how-to-use-everydaytab-for-free. Use it for blog and product URLs, file and folder names, HTML ids, CSS classes, database keys and anywhere you need a predictable, readable identifier.",
  sections: [
    {
      heading: "What makes a good slug",
      bullets: [
        "Lowercase only — URLs are case-sensitive on most servers, and lowercase avoids duplicate-content issues between /My-Post and /my-post.",
        "Hyphens, not underscores or spaces — Google treats hyphens as word separators; underscores join words and spaces become %20.",
        "ASCII letters and digits — accented characters are transliterated (café → cafe) so links survive copy-paste, email and older systems.",
        "Short and descriptive — 3–6 meaningful words; drop stop words like \"a\", \"the\" and \"of\" if the slug is long.",
        "Stable — once published, a slug should not change; if it must, add a 301 redirect from the old URL.",
      ],
    },
    {
      heading: "How the conversion works",
      paragraphs: [
        "The text is Unicode-normalised (NFD) so accented letters split into a base letter plus a combining mark, and the marks are removed — this is what turns é into e and ñ into n. The result is lowercased, whitespace runs are replaced with a single hyphen, every remaining character that is not a letter, digit, underscore or hyphen is deleted, and repeated hyphens are collapsed. The same algorithm is what most CMSs — WordPress, Ghost, Hugo, Next.js blog starters — apply to post titles.",
      ],
    },
    {
      heading: "Slugs and SEO",
      paragraphs: [
        "A descriptive slug helps users and search engines understand the page before clicking, and appears in search results as part of the breadcrumb-style URL display. Including the primary keyword is helpful but stuffing several is not. Keep numbers out unless they are meaningful (a year in an annual report is fine; a database id is not). For pages that already rank, do not change the slug without redirecting — a changed URL is a new page to Google.",
      ],
    },
  ],
  howTo: [
    { name: "Enter text", text: "Paste a title, sentence or product name." },
    { name: "Read the slug", text: "The URL-safe version appears instantly as you type." },
    { name: "Copy", text: "Click Copy and paste the slug into your CMS, code or file name." },
  ],
  faqs: [
    {
      question: "What happens to characters like é, ü or ß?",
      answer:
        "Accented Latin letters are converted to their base letter (é → e, ü → u). Characters without a decomposition, such as ß or non-Latin scripts, are removed; transliterate those manually (ß → ss) if needed.",
    },
    {
      question: "Should slugs use hyphens or underscores?",
      answer: "Hyphens. Search engines treat a hyphen as a word boundary, so blue-widgets matches \"blue widgets\"; blue_widgets is read as one token.",
    },
    {
      question: "Is there a maximum slug length?",
      answer:
        "Technically URLs can be about 2,000 characters, but slugs over 60–75 characters get truncated in search results and are hard to share. Keep them to the essential words.",
    },
    {
      question: "Can I use this for file names and CSS classes?",
      answer: "Yes. The output contains only lowercase letters, digits, hyphens and underscores, which is valid in file systems, HTML ids and CSS class names.",
    },
  ],
  related: ["slugify", "url-encoder", "case-converter", "text-cleaner", "renamer", "meta-tag-generator"],
};

export default content;
