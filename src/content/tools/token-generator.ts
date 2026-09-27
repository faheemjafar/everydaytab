import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Random Token Generator – Secure API Keys, Secrets & Hex Strings",
  seoDescription:
    "Generate cryptographically secure random tokens in bulk: alphanumeric, hex, Base64 or Base32, any length. Perfect for API keys, session secrets, salts and .env values. Free, runs locally.",
  intro:
    "Create random strings that are actually random. Choose the alphabet — alphanumeric, hexadecimal, Base64 or Base32 — set the length, and generate one or many tokens at once for API keys, webhook secrets, session signing keys, password salts, invite codes or test fixtures. Every character comes from your browser's cryptographically secure random number generator, and nothing is sent to a server.",
  sections: [
    {
      heading: "Why cryptographic randomness matters",
      paragraphs: [
        "Math.random(), rand() and similar functions are designed for speed, not unpredictability — their output can be reconstructed from a few observed values. Anything used as a secret must come from a cryptographically secure source. This generator uses the Web Crypto API's crypto.getRandomValues(), which draws from the operating system's entropy pool (the same source as /dev/urandom or CryptGenRandom), so tokens cannot be predicted or reproduced.",
      ],
    },
    {
      heading: "Which format and length to pick",
      bullets: [
        "Alphanumeric (A–Z, a–z, 0–9) — about 5.95 bits per character; readable and URL-safe. 32 characters ≈ 190 bits — more than enough for API keys.",
        "Hex (0–9, a–f) — 4 bits per character; matches the format of hashes and many framework secrets. Use 64 characters for a 256-bit key.",
        "Base64 (A–Z, a–z, 0–9, +, /) — 6 bits per character; densest, but + and / need escaping in URLs.",
        "Base32 (A–Z, 2–7) — 5 bits per character; case-insensitive and unambiguous, used for TOTP secrets and human-entered codes.",
        "Rule of thumb: aim for at least 128 bits of entropy for anything security-related — 22 alphanumeric, 32 hex or 26 Base32 characters.",
      ],
    },
    {
      heading: "Common uses",
      bullets: [
        "API keys and client secrets for your own services.",
        "SESSION_SECRET, JWT signing keys and cookie secrets in .env files.",
        "Per-user salts for password hashing (though bcrypt and Argon2 generate their own).",
        "Webhook verification tokens shared with third-party services.",
        "One-time invite or coupon codes — generate them in bulk and paste into a database seed.",
        "Test data where you need unique, unguessable identifiers (see also the UUID and ULID generators).",
      ],
    },
  ],
  howTo: [
    { name: "Choose a format", text: "Select alphanumeric, hex, Base64 or Base32." },
    { name: "Set length and count", text: "Choose how many characters each token should have and how many tokens to generate." },
    { name: "Generate", text: "Tokens are produced instantly using the Web Crypto API." },
    { name: "Copy", text: "Copy an individual token or the whole list." },
  ],
  faqs: [
    {
      question: "Are the tokens truly random and safe for production secrets?",
      answer:
        "Yes. They are generated with crypto.getRandomValues(), a cryptographically secure source, entirely on your device. They are never transmitted or logged.",
    },
    {
      question: "How long should an API key be?",
      answer:
        "At least 128 bits of entropy — roughly 22 alphanumeric or 32 hex characters. Many providers use 32–48 alphanumeric characters to leave a comfortable margin.",
    },
    {
      question: "What is the difference between a token and a UUID?",
      answer:
        "A UUID v4 is also random but has a fixed format and 122 bits of entropy; it is designed as an identifier, not a secret. Tokens here can be any length and alphabet, making them better suited for secrets.",
    },
    {
      question: "Can two generated tokens ever be the same?",
      answer:
        "For a 32-character alphanumeric token the chance is about 1 in 10^57 — effectively zero. Longer tokens make collisions even less likely.",
    },
  ],
  related: ["password-generator", "uuid-generator", "otp-generator", "hmac-generator", "hash-generator"],
};

export default content;
