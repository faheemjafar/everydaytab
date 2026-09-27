import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "TOTP Generator Online – Get 2FA Codes from a Base32 Secret Key",
  seoDescription:
    "Generate time-based one-time passwords (TOTP) from a Base32 secret in your browser. Standard 6-digit, 30-second codes compatible with Google Authenticator and Authy. Free, nothing uploaded.",
  intro:
    "Paste a Base32 secret key and get the same 6-digit, 30-second codes an authenticator app would show, with a live countdown to the next refresh. Handy for testing two-factor login flows during development, verifying that a secret was stored correctly, or reading a code when your phone is not to hand. The secret never leaves your browser.",
  sections: [
    {
      heading: "How TOTP codes are generated",
      paragraphs: [
        "TOTP (RFC 6238) combines a shared secret with the current time. The Unix time is divided into 30-second steps, that step counter is HMAC-SHA1-signed with the secret, and a 6-digit number is derived from the result. Because both your device and the server know the secret and the time, they produce the same code independently — no network exchange is needed and each code is valid only for its 30-second window. This tool implements exactly that algorithm with the standard parameters (SHA-1, 6 digits, 30 seconds), so its output matches Google Authenticator, Microsoft Authenticator, Authy, 1Password and every other RFC-compliant app.",
      ],
    },
    {
      heading: "Where the secret comes from",
      bullets: [
        "When you enable 2FA, the service shows a QR code and usually a text version of the key — a Base32 string such as JBSWY3DPEHPK3PXP. That string is what you paste here.",
        "Developers: your backend generates the secret when a user enrols and encodes it in an otpauth:// URI for the QR code.",
        "Spaces and lower-case letters in the secret are tolerated; they are stripped and normalised before use.",
        "The issuer and label fields are informational — they identify the account in authenticator apps and do not affect the code.",
      ],
    },
    {
      heading: "Security guidance",
      bullets: [
        "Your secret is processed locally and never transmitted, but treat it like a password: anyone with the secret can generate your codes indefinitely.",
        "Use this tool for development, testing and recovery — for day-to-day logins, a dedicated authenticator app with encrypted backup is safer.",
        "If the codes do not match the server, check the device clock: TOTP tolerates only about 30 seconds of drift.",
        "Never share screenshots that include the secret key or its QR code.",
      ],
    },
  ],
  howTo: [
    { name: "Paste the secret", text: "Enter the Base32 secret key from the service's 2FA setup screen." },
    { name: "Optionally add issuer and label", text: "Name the service and account so you can tell keys apart." },
    { name: "Read the code", text: "The current 6-digit TOTP appears with a countdown; a new code is generated every 30 seconds." },
    { name: "Copy", text: "Click the code to copy it and paste it into the login form." },
  ],
  faqs: [
    {
      question: "Why does the code here differ from my authenticator app?",
      answer:
        "Almost always a clock problem — one of the devices is more than 30 seconds off. Sync the system time. Otherwise check that the secret was pasted completely and that the service does not use non-standard parameters (8 digits, 60 seconds or SHA-256).",
    },
    {
      question: "Can I generate HOTP (counter-based) codes?",
      answer: "This tool generates TOTP only, which is what nearly every consumer service uses. HOTP requires a counter that both sides increment and is rare outside hardware tokens.",
    },
    {
      question: "Is it safe to paste my real 2FA secret?",
      answer:
        "The code is computed in your browser with no network calls, and nothing is stored. As with any browser tool, use it on a trusted device and avoid public computers.",
    },
    {
      question: "How do I get the secret from a QR code?",
      answer:
        "Most services show a \"can't scan?\" link revealing the text key. Alternatively decode the QR image with a reader — the otpauth:// URI it contains has the secret in its secret= parameter.",
    },
  ],
  related: ["token-generator", "hmac-generator", "password-generator", "qr-generator", "jwt-debugger"],
};

export default content;
