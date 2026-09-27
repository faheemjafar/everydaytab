import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Phone Number Parser & Validator – Format to E.164 & International",
  seoDescription:
    "Validate and format any phone number. Detects the country, checks validity, identifies mobile vs landline and outputs E.164, international and national formats. Free, runs in your browser.",
  intro:
    "Paste a phone number in any style — with spaces, dashes, brackets or a leading + — and find out whether it is valid, which country and region it belongs to, whether it is a mobile or fixed line, and how it should be written in E.164, international and national formats. Built on the same libphonenumber data Google uses in Android, so the rules are current for every country. Nothing you enter is sent to a server.",
  sections: [
    {
      heading: "The formats explained",
      bullets: [
        "E.164 — +12133734253: country code plus number, no spaces or punctuation, maximum 15 digits. The canonical storage format for databases, SMS gateways, Twilio and WhatsApp APIs.",
        "International — +1 213-373-4253: E.164 with the country's conventional grouping, for display to a global audience.",
        "National — (213) 373-4253: how the number is written for callers inside the same country, without the country code.",
        "Type — mobile, fixed line, toll-free, premium rate, VoIP or shared cost, derived from the number's prefix.",
      ],
    },
    {
      heading: "Why parse phone numbers properly",
      paragraphs: [
        "Users type numbers dozens of different ways, and a naive regex cannot know that 07911 123456 in the UK is +44 7911 123456, that US numbers have exactly ten national digits, or that a German number can be anywhere from 5 to 13 digits long. libphonenumber carries the numbering plan for every country — area code lengths, mobile prefixes, valid ranges — and updates as regulators change them. Normalising to E.164 at input time means deduplication, SMS delivery and click-to-call links all work reliably.",
      ],
    },
    {
      heading: "Common uses",
      bullets: [
        "Cleaning a CRM or contact list before an SMS or WhatsApp campaign.",
        "Validating sign-up forms and deciding whether to send an SMS one-time code (mobile) or not (landline).",
        "Checking numbers copied from emails, PDFs and business cards before dialling internationally.",
        "Debugging why an SMS API rejects a number — usually a missing country code or a non-mobile type.",
        "Generating tel: links with the E.164 value so they dial correctly from any country.",
      ],
    },
  ],
  howTo: [
    { name: "Enter the number", text: "Paste the phone number. Include the + and country code if you have it; otherwise the default region is assumed." },
    { name: "Read the analysis", text: "Validity, country, region, and number type appear instantly." },
    { name: "Copy a format", text: "Copy the E.164, international or national representation for your system." },
  ],
  faqs: [
    {
      question: "Why is my number marked invalid even though it works?",
      answer:
        "Most often the country code is missing so the number is parsed against the wrong region, or the number is a new range not yet in the numbering data. Try adding the + and country code. Very new ranges are added in libphonenumber updates.",
    },
    {
      question: "Can it tell me who owns a phone number?",
      answer:
        "No. The parser works from public numbering plans and can identify the country, region and type, but not the subscriber or current carrier — that requires a paid lookup service.",
    },
    {
      question: "What is E.164 and why do APIs require it?",
      answer:
        "E.164 is the ITU standard for international numbers: + followed by up to 15 digits with no formatting. Because it is unambiguous and globally unique, SMS, voice and messaging APIs use it to route calls and deduplicate contacts.",
    },
    {
      question: "Is the phone number I enter stored or sent anywhere?",
      answer: "No. Parsing runs entirely in your browser.",
    },
  ],
  related: ["iban-validator", "user-agent-parser", "url-parser"],
};

export default content;
