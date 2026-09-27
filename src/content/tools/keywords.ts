import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Keyword Density Checker & Extractor – Free SEO Content Analyzer",
  seoDescription:
    "Analyze keyword density online for free. Paste any article to extract the top keywords, count occurrences, check the density of your target terms and download a report. No sign-up, private.",
  intro:
    "Paste a draft, a competitor's page or a finished article and see which words dominate it. The analyzer counts every term, ranks the top 20 keywords by frequency, calculates their density as a percentage of total words, and — if you enter your target keywords — shows exactly how often each one appears and whether the density is in a healthy range. Use it to catch keyword stuffing, spot missing terms and keep your copy natural.",
  sections: [
    {
      heading: "What keyword density is and why it still matters",
      paragraphs: [
        "Keyword density is the number of times a term appears divided by the total word count, expressed as a percentage. A 1,000-word article that mentions \"loudness normalizer\" 15 times has a density of 1.5%. Google no longer rewards hitting a magic percentage — it understands synonyms, entities and topical coverage — but density is still a useful diagnostic. Too low and the page may not clearly signal what it is about; too high and it reads as spam to both readers and ranking systems.",
        "A practical guideline is 0.5–2% for a primary keyword, with related phrases and natural variations making up the rest. The analyzer colour-codes densities so you can see at a glance which terms are under-used, in range, or over-used.",
      ],
    },
    {
      heading: "How to read the report",
      bullets: [
        "Target keywords — the terms you typed in, with their exact count and density. This is your on-page optimisation check.",
        "Top keywords — the 20 most frequent words of three or more letters in the text. If your topic's main terms are not near the top, the copy is probably off-focus.",
        "Word and character count — context for the percentages; density is only meaningful on a few hundred words or more.",
        "Downloadable report — a plain-text summary you can attach to a content brief or client deliverable.",
      ],
    },
    {
      heading: "Using it in an SEO workflow",
      bullets: [
        "Competitor research: paste the top-ranking page for your query to see which terms it leans on, then make sure your page covers them.",
        "Brief compliance: check that a writer used the primary and secondary keywords from the brief without over-doing it.",
        "De-stuffing: if a term exceeds 3%, replace some instances with synonyms or pronouns.",
        "Pair with the Readability Analyzer to confirm the copy is still easy to read after optimisation, and the Meta Tag Generator to carry the main keyword into the title and description.",
      ],
    },
  ],
  howTo: [
    { name: "Paste your content", text: "Drop the article text into the editor. Formatting is ignored; only words are counted." },
    { name: "Add target keywords", text: "Optionally enter the keywords you are optimising for, separated by commas." },
    { name: "Analyze", text: "The top keywords, counts and densities appear immediately, with your targets highlighted." },
    { name: "Export", text: "Download the report or copy the figures into your content brief." },
  ],
  faqs: [
    {
      question: "What is a good keyword density?",
      answer:
        "Roughly 0.5–2% for your main keyword is natural for most content. Above 3% starts to read as repetitive; there is no minimum that guarantees ranking, so prioritise clear, complete coverage of the topic over a specific number.",
    },
    {
      question: "Does the analyzer count phrases or only single words?",
      answer:
        "The automatic top-20 list counts single words. Enter multi-word phrases such as \"video speed changer\" in the target keywords field and they are counted as exact phrases.",
    },
    {
      question: "Why are words like \"the\" and \"and\" not in the list?",
      answer:
        "Words shorter than three letters are excluded to keep the list useful. Longer common words such as \"with\" or \"that\" may still appear; skip past them to your topical terms.",
    },
    {
      question: "Can I analyze a live web page by URL?",
      answer:
        "Copy the page's visible text and paste it in. Because the tool runs entirely in your browser it does not fetch URLs — which also means the content you analyse is never sent to a server.",
    },
  ],
  related: ["readability-analyzer", "meta-tag-generator", "word-counter", "text-statistics", "slugify", "faq-schema"],
};

export default content;
