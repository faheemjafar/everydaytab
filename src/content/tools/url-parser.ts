import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "URL Parser Online – Break Down Protocol, Host, Path & Query Parameters",
  seoDescription:
    "Paste any URL to see its protocol, hostname, port, path, hash and every query parameter decoded in a table. Free URL analyzer for debugging links, tracking codes and API calls.",
  intro:
    "Paste a URL and see every component laid out: the protocol, hostname, port, path, fragment (hash) and — most usefully — each query-string parameter as a decoded key/value row. Untangle long tracking links, check what an OAuth redirect actually contains, verify the parameters an API call is sending, or decode percent-encoded values you can't read by eye. Parsing runs in your browser.",
  sections: [
    {
      heading: "Anatomy of a URL",
      bullets: [
        "Protocol (scheme) — https:, http:, mailto:, ftp: — how the resource is fetched.",
        "Hostname — the domain (www.example.com) or IP address. Case-insensitive.",
        "Port — explicit port if present (:8080); omitted when using the scheme default (80 for HTTP, 443 for HTTPS).",
        "Origin — protocol + host + port; the unit browsers use for security decisions (CORS, cookies).",
        "Pathname — /docs/guide/intro; case-sensitive on most servers.",
        "Search (query string) — ?utm_source=newsletter&page=2; key=value pairs separated by &, each percent-encoded.",
        "Hash (fragment) — #section-3; handled by the browser only and never sent to the server.",
      ],
    },
    {
      heading: "Things you can figure out with the parser",
      bullets: [
        "Which UTM or click-ID parameters (utm_campaign, gclid, fbclid) a marketing link carries, and whether they are spelled consistently.",
        "What a shortened or redirected link resolves to once you paste the final URL.",
        "Whether a value was double-encoded (%2520 instead of %20) — a common cause of broken redirects.",
        "The exact redirect_uri, scope and state in an OAuth authorisation URL.",
        "Whether the URL has a port, a trailing slash or a fragment your router should ignore.",
        "Duplicate parameters, which some servers read as the first value and others as the last.",
      ],
    },
    {
      heading: "Encoding notes",
      paragraphs: [
        "Characters outside the unreserved set are percent-encoded in URLs: a space becomes %20 (or + inside a query string), & becomes %26, and non-ASCII text becomes its UTF-8 bytes as %XX sequences. The parser decodes these for display so you see the real values. To build or repair a URL, the URL Encoder encodes components correctly; encode each parameter value individually rather than the whole string to avoid encoding the separators themselves.",
      ],
    },
  ],
  howTo: [
    { name: "Paste the URL", text: "Drop the full URL into the input, including the scheme." },
    { name: "Read the components", text: "Protocol, host, port, path, hash and origin are shown at a glance." },
    { name: "Inspect the parameters", text: "Each query parameter is listed with its decoded value; copy any part you need." },
  ],
  faqs: [
    {
      question: "Why does the parser say my URL is invalid?",
      answer: "It probably lacks a scheme — add https:// — or contains unescaped spaces or characters. The WHATWG URL parser used here matches browser behaviour, so anything a browser accepts works.",
    },
    {
      question: "Is the fragment (#…) sent to the server?",
      answer: "No. The fragment is handled client-side only, which is why single-page apps and OAuth implicit flows use it to keep data out of server logs.",
    },
    {
      question: "How do I remove tracking parameters from a link?",
      answer: "Parse the URL here, note the parameters you want to keep, and rebuild the link with only those — or delete everything from the ? onward if none are needed.",
    },
    {
      question: "Is the URL I paste sent anywhere?",
      answer: "No. Parsing uses your browser's built-in URL API; nothing is transmitted.",
    },
  ],
  related: ["url-encoder", "slugify", "opengraph", "base64", "jwt-debugger", "user-agent-parser"],
};

export default content;
