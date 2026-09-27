import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Basic Auth Header Generator – Encode Username:Password to Base64",
  seoDescription:
    "Generate an HTTP Basic Authentication header from a username and password. Get the Base64 value, the full Authorization header and a ready-to-run curl command. Runs locally, free.",
  intro:
    "Type a username and password and get the exact Authorization: Basic … header that HTTP Basic Authentication expects, along with a copy-ready curl example. Useful when testing APIs in Postman, curl or a browser extension, configuring webhooks, or debugging why a 401 keeps coming back. Encoding happens in your browser; the credentials are never transmitted.",
  sections: [
    {
      heading: "How HTTP Basic Authentication works",
      paragraphs: [
        "Basic Auth, defined in RFC 7617, is the simplest HTTP authentication scheme. The client joins the username and password with a colon — user:pass — encodes that string as Base64, and sends it in the Authorization header: Authorization: Basic dXNlcjpwYXNz. The server decodes it and checks the credentials. When a protected resource is requested without the header, the server replies 401 Unauthorized with a WWW-Authenticate: Basic realm=\"…\" header, which is what makes browsers show their login dialog.",
        "Base64 is an encoding, not encryption — anyone who sees the header can decode it instantly. Basic Auth is therefore only safe over HTTPS, where the entire request is encrypted in transit.",
      ],
    },
    {
      heading: "Where you'll use the generated header",
      bullets: [
        "curl: curl -H \"Authorization: Basic …\" https://api.example.com — or use curl -u user:pass and let curl encode it.",
        "Postman, Insomnia and Bruno: paste the header value when the built-in auth helper is unavailable or you need a raw request.",
        "Webhook and integration settings that ask for a static Authorization header.",
        "Nginx and Apache password-protected directories (htpasswd) during testing.",
        "Fetch and XMLHttpRequest calls in JavaScript where you build the header manually.",
      ],
    },
    {
      heading: "Security notes",
      bullets: [
        "Never use Basic Auth over plain HTTP; credentials travel in the clear.",
        "Prefer API tokens or OAuth for production integrations — Basic Auth headers are long-lived and cannot be scoped or revoked individually.",
        "Passwords containing a colon are allowed; the server splits on the first colon only.",
        "Non-ASCII passwords depend on the server's charset handling; UTF-8 is the modern expectation.",
      ],
    },
  ],
  howTo: [
    { name: "Enter credentials", text: "Type the username and password. Nothing is sent anywhere — encoding runs in your browser." },
    { name: "Copy the header", text: "Copy the full Authorization: Basic … header, or just the Base64 value." },
    { name: "Use the curl example", text: "Copy the generated curl command to test the endpoint immediately." },
  ],
  faqs: [
    {
      question: "Is Base64 encoding the same as encrypting my password?",
      answer:
        "No. Base64 is trivially reversible — paste the value into any Base64 decoder and the password appears. Basic Auth relies on HTTPS for confidentiality.",
    },
    {
      question: "Why does my API still return 401 with the header set?",
      answer:
        "Common causes: a typo in the credentials, an extra space after Basic, the header being stripped by a proxy, the API expecting a token scheme (Bearer) instead, or the username needing to be an email or API key.",
    },
    {
      question: "How do I decode a Basic Auth header I already have?",
      answer: "Remove the Basic prefix and paste the remainder into the Base64 Converter; the output is username:password.",
    },
    {
      question: "Are my credentials stored?",
      answer: "No. They live only in the page while you use it and are never logged, transmitted or saved.",
    },
  ],
  related: ["base64", "jwt-debugger", "token-generator", "curl-converter", "http-status-codes", "hmac-generator"],
};

export default content;
