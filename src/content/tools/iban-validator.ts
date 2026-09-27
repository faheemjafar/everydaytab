import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "IBAN Validator – Check & Verify Any IBAN Number Online (Free)",
  seoDescription:
    "Validate any IBAN instantly. Checks length, country format and the mod-97 checksum, then shows the country, bank code and account number. Free, private, works offline in your browser.",
  intro:
    "Paste an IBAN and this validator checks it the same way a bank does: it verifies the country prefix, the expected length for that country, the national BBAN structure and the ISO 7064 mod-97 checksum. Valid IBANs are broken down into country, bank/branch code and account number, and re-formatted in the standard 4-character groups so you can copy a clean version. Everything runs in your browser — the number is never sent to a server.",
  sections: [
    {
      heading: "What is an IBAN?",
      paragraphs: [
        "An International Bank Account Number (IBAN) is a standardised way of writing a bank account number so that it can be recognised across borders. It was defined in ISO 13616 and is mandatory for SEPA transfers in the EU and EEA, and used in more than 80 countries including the UK, Switzerland, Turkey, Saudi Arabia, the UAE, Pakistan, Brazil and many others.",
        "Every IBAN has the same skeleton: a two-letter ISO country code, two check digits, and then a Basic Bank Account Number (BBAN) whose length and layout are fixed per country. A German IBAN is always 22 characters (DE + 2 check digits + 8-digit bank code + 10-digit account number); a UK IBAN is 22 characters (GB + 2 check digits + 4-letter bank code + 6-digit sort code + 8-digit account number); French IBANs are 27 characters, and Maltese IBANs are the longest at 31.",
      ],
    },
    {
      heading: "How IBAN validation works (mod-97)",
      paragraphs: [
        "The two check digits after the country code exist purely to catch typos. To verify them, the first four characters are moved to the end of the string, every letter is replaced by two digits (A=10, B=11 … Z=35), and the resulting large integer is divided by 97. If the remainder is exactly 1, the checksum is correct.",
        "This catches the overwhelming majority of single-character mistakes and transposed digits. This tool performs that calculation in full, and additionally checks that the IBAN matches the registered length and BBAN pattern for its country, so an IBAN that happens to pass mod-97 but has the wrong structure for, say, Spain will still be rejected.",
      ],
    },
    {
      heading: "What a valid checksum does and does not tell you",
      paragraphs: [
        "A valid IBAN means the number is well-formed and internally consistent. It does not guarantee that the account exists, is open, or belongs to a particular person — only the receiving bank can confirm that. Use this tool to catch copy-paste errors before you submit a payment, validate form input in an app, or clean a list of supplier bank details. For very large or high-risk payments, confirm the account holder's name with the bank as well.",
      ],
      bullets: [
        "Catches mistyped, missing or transposed characters before a transfer bounces.",
        "Confirms the country and the expected national format (bank code, branch/sort code, account number).",
        "Formats the IBAN in groups of four (e.g. GB29 NWBK 6016 1331 9268 19) for readable invoices and documents.",
        "Does not perform a live lookup against the bank — nothing about your number leaves the page.",
      ],
    },
    {
      heading: "Common reasons an IBAN fails validation",
      bullets: [
        "Wrong length for the country (e.g. 21 characters entered for a 22-character German IBAN).",
        "A letter O typed instead of the digit 0, or I instead of 1 — the checksum will flag it.",
        "A BIC/SWIFT code or a domestic account number pasted instead of the IBAN.",
        "Extra characters copied from a PDF, such as hidden line breaks or non-breaking spaces (ordinary spaces are fine and are stripped automatically).",
        "An unsupported country prefix — IBANs are not used for US, Canadian, Australian or most Asian domestic accounts.",
      ],
    },
  ],
  howTo: [
    { name: "Paste the IBAN", text: "Type or paste the IBAN into the input field. Spaces and mixed case are accepted and cleaned up automatically." },
    { name: "Read the result", text: "The validator instantly shows whether the IBAN is valid, with the specific error (bad checksum, wrong length, unknown country) if it is not." },
    { name: "Review the breakdown", text: "For valid IBANs you'll see the country and the BBAN portion containing the bank code and account number." },
    { name: "Copy the formatted IBAN", text: "Click Copy to grab the IBAN in the standard 4-character grouping for invoices, forms or payment instructions." },
  ],
  faqs: [
    {
      question: "Is this IBAN checker free and does it store my bank details?",
      answer:
        "Yes, it is completely free with no sign-up, and nothing you type is transmitted or stored. The validation runs entirely in your browser using JavaScript, so it works even offline once the page has loaded.",
    },
    {
      question: "Can an IBAN validator tell me who owns the account?",
      answer:
        "No. Validation only proves the number is correctly formed. Account ownership and status can only be confirmed by the bank itself — many banks now offer Confirmation of Payee or IBAN-name checks as part of the transfer flow.",
    },
    {
      question: "Which countries are supported?",
      answer:
        "All countries in the official SWIFT IBAN Registry are supported — every SEPA member plus non-EU adopters such as the United Kingdom, Switzerland, Norway, Turkey, Saudi Arabia, the UAE, Qatar, Pakistan, Brazil, Kazakhstan and dozens more. Each country's length and BBAN pattern is checked individually.",
    },
    {
      question: "What is the difference between an IBAN and a BIC / SWIFT code?",
      answer:
        "An IBAN identifies a specific account. A BIC (Bank Identifier Code, also called a SWIFT code) identifies the bank or branch. International wires often require both; within SEPA the IBAN alone is normally sufficient because the bank can be derived from it.",
    },
    {
      question: "How do I validate an IBAN in my own code?",
      answer:
        "Move the first four characters to the end, convert letters to numbers (A=10 … Z=35), and compute the value modulo 97 — a correct IBAN yields 1. Then check the length and BBAN pattern for the country code against the IBAN registry. Most languages have a maintained library that does this, such as ibantools for JavaScript or schwifty for Python.",
    },
    {
      question: "Why does my IBAN say valid here but my bank rejects it?",
      answer:
        "The checksum can be valid while the underlying account is closed, doesn't exist, or belongs to a bank that doesn't accept the type of transfer you're sending. Double-check the account holder name and, for non-SEPA transfers, that you have the correct BIC as well.",
    },
  ],
  related: ["invoice-generator", "phone-parser", "password-strength", "hash-generator"],
};

export default content;
