import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Regex Tester Online – Test Regular Expressions with Live Matches",
  seoDescription:
    "Test regular expressions online for free. Type a pattern and sample text to see every match highlighted instantly, toggle case sensitivity and global matching. JavaScript regex, no sign-up.",
  intro:
    "Type a regular expression, paste some sample text, and see every match highlighted as you type. Toggle case-insensitive and global flags, read the exact list of matched strings, and get a clear error message when the pattern is invalid. Uses the JavaScript regex engine, so what works here works in Node, browsers, TypeScript and most modern tools.",
  sections: [
    {
      heading: "Regex syntax quick reference",
      bullets: [
        ". any character  |  \\d digit  |  \\w word character  |  \\s whitespace  |  \\b word boundary",
        "[abc] character set  |  [^abc] negated set  |  [a-z] range",
        "* zero or more  |  + one or more  |  ? optional  |  {3} exactly 3  |  {2,5} between 2 and 5",
        "^ start of string  |  $ end of string  |  (with m flag: start/end of each line)",
        "(abc) capturing group  |  (?:abc) non-capturing  |  (?<name>abc) named group  |  a|b alternation",
        "*? +? lazy quantifiers — match as little as possible",
        "(?=abc) lookahead  |  (?!abc) negative lookahead  |  (?<=abc) lookbehind",
      ],
    },
    {
      heading: "Patterns people test most often",
      bullets: [
        "Email (practical): [\\w.+-]+@[\\w-]+\\.[\\w.-]+",
        "URL: https?:\\/\\/[^\\s/$.?#].[^\\s]*",
        "IPv4 address: \\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",
        "Date YYYY-MM-DD: \\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])",
        "Hex colour: #(?:[0-9a-fA-F]{3}){1,2}\\b",
        "Phone digits with separators: \\+?\\d[\\d\\s().-]{7,}\\d",
        "Trailing whitespace: [ \\t]+$ (with the m flag)",
      ],
    },
    {
      heading: "Tips for debugging a regex",
      bullets: [
        "Build incrementally: start with the literal part that must match, then add quantifiers and groups one at a time while watching the highlights.",
        "Greedy quantifiers (.*) grab as much as possible; switch to lazy (.*?) when a match runs past where you expected.",
        "Escape special characters — . ( ) [ ] { } * + ? ^ $ | \\ / — with a backslash when you mean them literally.",
        "Turn off the global flag to see only the first match, which helps isolate where a pattern starts matching.",
        "Case-insensitive matching (i) is often simpler than writing [Aa][Bb] sets.",
        "Save a pattern you'll reuse in the Regex Memo cheatsheet.",
      ],
    },
  ],
  howTo: [
    { name: "Enter a pattern", text: "Type the regular expression without surrounding slashes." },
    { name: "Add sample text", text: "Paste the text you want to search." },
    { name: "Set flags", text: "Toggle case sensitivity and global matching." },
    { name: "Read the matches", text: "Matches are highlighted in the text and listed below; syntax errors are reported immediately." },
  ],
  faqs: [
    {
      question: "Which regex flavour does this tester use?",
      answer:
        "JavaScript (ECMAScript), as implemented by your browser. It supports lookbehind, named groups and Unicode property escapes in all modern browsers. Python, PCRE and Java regexes are largely compatible for everyday patterns, but check engine-specific features like possessive quantifiers or \\A and \\Z anchors.",
    },
    {
      question: "Why does my pattern match the whole text instead of just a piece?",
      answer:
        "A greedy quantifier such as .* expands as far as it can. Use the lazy form .*? or replace the dot with a more specific set like [^\"]* to stop at a delimiter.",
    },
    {
      question: "How do I match across multiple lines?",
      answer:
        "The dot does not match newlines by default. Use [\\s\\S] to match any character including newlines, and remember ^ and $ apply to the whole string unless the m (multiline) flag is used.",
    },
    {
      question: "Is my text sent anywhere?",
      answer: "No. Matching runs in your browser, so it is safe to test against logs, configuration and real data.",
    },
  ],
  related: ["regex", "text-diff", "url-parser", "json-formatter", "text-cleaner"],
};

export default content;
