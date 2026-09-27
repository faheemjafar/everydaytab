import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Binary, Hex, Decimal & Octal Converter – Number Base Calculator",
  seoDescription:
    "Convert numbers between decimal, binary, hexadecimal and octal instantly. Type in any base and see all four at once with a step-by-step breakdown. Free programmer's base converter.",
  intro:
    "Type a number in decimal, binary, hexadecimal or octal and see it in all four bases at the same time, with a step-by-step explanation of how the conversion works. Ideal for debugging bit flags, reading memory addresses, understanding file permissions, working with colour codes or studying for a computer science exam.",
  sections: [
    {
      heading: "The four number systems",
      bullets: [
        "Decimal (base 10) — digits 0–9; the everyday system.",
        "Binary (base 2) — digits 0 and 1; how computers store everything. Each digit is one bit.",
        "Hexadecimal (base 16) — digits 0–9 and A–F; one hex digit represents exactly four bits, so two hex digits make a byte. Used for memory addresses, colour codes (#FF8800), MAC addresses and hashes.",
        "Octal (base 8) — digits 0–7; one octal digit is three bits. Still used for Unix file permissions (chmod 755) and some legacy systems.",
      ],
    },
    {
      heading: "How base conversion works",
      paragraphs: [
        "To convert from decimal to another base, divide the number by the base repeatedly and collect the remainders; read them in reverse order. For 156 to binary: 156÷2=78 r0, 78÷2=39 r0, 39÷2=19 r1, 19÷2=9 r1, 9÷2=4 r1, 4÷2=2 r0, 2÷2=1 r0, 1÷2=0 r1 → 10011100. To convert back, multiply each digit by its positional power and sum them: 1×128 + 0×64 + 0×32 + 1×16 + 1×8 + 1×4 + 0×2 + 0×1 = 156.",
        "Binary, octal and hex convert directly between each other by grouping bits: every hex digit is 4 bits and every octal digit is 3 bits. 10011100 in binary groups as 1001 1100 = 9C in hex, and as 010 011 100 = 234 in octal. The breakdown panel shows these steps for the number you enter.",
      ],
    },
    {
      heading: "Where you'll meet each base",
      bullets: [
        "Hex colour codes: #1E90FF is red 0x1E (30), green 0x90 (144), blue 0xFF (255).",
        "File permissions: chmod 644 is octal for rw-r--r-- (110 100 100 in binary).",
        "Bit flags and masks: 0x0F masks the low four bits; 0b1010 has bits 1 and 3 set.",
        "Networking: a subnet mask of 255.255.255.0 is 11111111.11111111.11111111.00000000.",
        "Memory and debugging: addresses and register values are always shown in hex.",
      ],
    },
  ],
  howTo: [
    { name: "Choose the input base", text: "Select whether the number you are typing is decimal, binary, hex or octal." },
    { name: "Enter the number", text: "Type it in. Invalid digits for the chosen base are flagged immediately." },
    { name: "Read the results", text: "All four representations update live, along with the step-by-step conversion." },
    { name: "Copy", text: "Click any result to copy it to the clipboard." },
  ],
  faqs: [
    {
      question: "How do I convert decimal to binary by hand?",
      answer:
        "Divide by 2 repeatedly, writing down each remainder, until you reach 0. The binary number is the remainders read from last to first. The step-by-step panel shows this for any number you enter.",
    },
    {
      question: "What is 0x and 0b in front of a number?",
      answer:
        "They are prefixes used in most programming languages to indicate hexadecimal (0x) and binary (0b) literals, so 0xFF is 255 and 0b1111 is 15. A leading 0o (or in older C-style syntax just a leading 0) indicates octal.",
    },
    {
      question: "Can I convert negative or very large numbers?",
      answer:
        "Negative numbers are shown with a minus sign in every base. Very large values are supported up to the precision your browser handles for safe integers (about 2^53); for two's-complement representations of negatives, specify the bit width in your own code.",
    },
    {
      question: "Why does hex use letters?",
      answer:
        "Base 16 needs sixteen distinct digit symbols, and we only have ten numerals, so A–F stand for the values 10–15.",
    },
  ],
  related: ["text-binary", "chmod-calculator", "subnet-calculator", "roman-numeral-converter", "color-converter", "hash-generator"],
};

export default content;
