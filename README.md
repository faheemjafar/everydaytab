# EverydayTab

> A comprehensive, privacy-first collection of 160+ high-performance web utilities. Built with modern web standards and designed to run entirely in your browser.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Repo](https://img.shields.io/badge/GitHub-faheemjafar%2Feverydaytab-181717?logo=github)](https://github.com/faheemjafar/everydaytab)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?logo=kofi&logoColor=white)](https://ko-fi.com/faheemj)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2016-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

> Built and maintained solo by [@faheemjafar](https://github.com/faheemjafar).
> If EverydayTab saves you time, [buy me a coffee ☕](https://ko-fi.com/faheemj/?amount=5) — it keeps the project free, ad-free, and actively developed.

## Features

EverydayTab provides **160+ utilities** across **9 categories**, all running client-side:

- **PDF Tools** — Merge, split, rotate, compress, sign, watermark, crop, extract text, edit bookmarks, add page numbers, remove blank pages, apply scanner effects, adjust colors, and more.
- **Developer Tools** — JSON formatters, validators, and converters; YAML/TOML/XML tools; GraphQL utilities; SQL prettifiers; cURL converters; JWT generators & parsers; regex testers; cron utilities; and cheat sheets.
- **Text Tools** — Case converters, diff checkers, word counters, Markdown table generators, string obfuscators, text statistics, and Unicode/Binary converters.
- **Converters** — Unit converters, temperature converters, integer base converters, IPv4 converters, text-to-Unicode, and JSON/XML/YAML/TOML interchanges.
- **Math** — Calculators, math evaluators, percentage calculators, ETA calculators, stopwatches, and timestamp converters.
- **Image Tools** — SVG optimizers, SVG-to-JSX converters, SVG path visualizers, color palette extractors, Lottie previewers, gradient studios, box shadow studios, glassmorphism generators, contrast checkers, color blindness simulators, and placeholder generators.
- **Color Tools** — Modern color converters (HEX, RGB, HSL, OKLCH, LAB, LCH), color blindness simulators, contrast checkers, and palette extractors.
- **Generators** — QR codes, barcodes, WiFi QR codes, UUIDs, ULIDs, tokens, passwords, Lorem Ipsum, meta tags, OG tags, numeronyms, and more.
- **Security** — AES encryption, Bcrypt hashing, HMAC generation, hash generators, JWT tools, SSL decoders, OTP/TOTP generators, BIP39 mnemonic generators, password strength checkers, and safelink decoders.

### Key Design Principles

- **Privacy First** — All processing happens in the browser. No data is sent to any server.
- **Keyboard-Friendly** — Global search with `Cmd+K` / `Ctrl+K`, settings with `Cmd+,`, arrow key navigation, and quick tool access.
- **Accessible** — Built with accessibility in mind using Radix UI primitives and semantic HTML.
- **Dark & Light Mode** — Seamless theme switching with `next-themes`.
- **Responsive** — Icon rail with hover/pinnable tool flyouts on desktop; bottom tab bar and full-screen browser on mobile.
- **Customisable** — Settings page for theme, accent colour, density, font size, sidebar behaviour, and local data management.
- **Fast** — Optimized with Next.js App Router, lazy loading, and efficient client-side rendering.

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) | React framework with App Router |
| [React 19](https://react.dev) | UI library |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [Radix UI](https://www.radix-ui.com) | Accessible UI primitives |
| [Lucide React](https://lucide.dev) | Icon system |
| [pdf-lib](https://pdf-lib.js.org) | PDF creation and manipulation |
| [pdfjs-dist](https://mozilla.github.io/pdf.js/) | PDF rendering and text extraction |
| [shadcn/ui](https://ui.shadcn.com) | Component patterns |
| [cmdk](https://cmdk.paco.me) | Command palette |

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/faheemjafar/everydaytab.git
cd everydaytab

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
```

## Project Structure

```
everydaytab/
├── src/
│   ├── app/
│   │   ├── tools/           # Individual tool pages
│   │   ├── layout.tsx       # Root layout with sidebar, header, footer
│   │   ├── page.tsx         # Home page with tool grid
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── header.tsx       # Top navigation header
│   │   ├── sidebar.tsx      # Category sidebar
│   │   └── tool-card.tsx    # Tool grid cards
│   ├── lib/
│   │   ├── tools.ts         # Tool registry (categories & metadata)
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── modules.d.ts     # Type declarations
├── public/                  # Static assets
├── LICENSE                  # MIT License
├── next.config.ts           # Next.js configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

We welcome contributions from the community!

### How to Contribute

1. **Fork** the repository and clone your fork.
2. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/my-new-tool
   ```
3. **Make your changes** and ensure the app builds successfully:
   ```bash
   npm run build
   ```
4. **Commit** with clear, descriptive messages:
   ```bash
   git commit -m "feat: add JSON diff visualizer tool"
   ```
5. **Push** to your fork and open a **Pull Request**.

### Adding a New Tool

1. Create a new folder under `src/app/tools/` using kebab-case naming.
2. Add your tool's page component as `page.tsx`.
3. Register the tool in `src/lib/tools.ts` with:
   - `id`, `name`, `description`
   - `category` (must match an existing category id)
   - `icon` (a valid Lucide icon name)
   - `path` (matching your folder name)
   - `tags` for searchability
4. Ensure the tool works in **both** light and dark modes.
5. Keep all processing **client-side** unless there's a strong reason otherwise.

### Code Style

- Follow the existing TypeScript and React patterns.
- Use Tailwind CSS utilities for styling.
- Keep components focused and reusable.
- Prefer server components where possible; use client components only for interactivity.

## Roadmap

- [ ] Add more PDF tools (OCR, redaction, form filling)
- [ ] Introduce batch/queue processing for file-based tools
- [ ] Add user preferences and recent tool history (localStorage)
- [ ] Internationalization (i18n) support
- [ ] PWA support for offline usage
- [ ] Plugin system for community tools

## Acknowledgments

- Built with [Next.js](https://nextjs.org) by Vercel
- Icons by [Lucide](https://lucide.dev)
- UI patterns inspired by [shadcn/ui](https://ui.shadcn.com)

## License

This project is licensed under the [MIT License](LICENSE).

## Support

EverydayTab is **free, ad-free, and 100% client-side**, built solo on nights and weekends. If it saves you time, here's how to keep it going:

- ☕ **[Buy me a coffee on Ko-fi](https://ko-fi.com/faheemj/?amount=5)** — directly funds servers and new tools
- ⭐ **Star the repo** on GitHub — biggest free signal of support
- 🐛 **Report bugs or suggest tools** via [Issues](https://github.com/faheemjafar/everydaytab/issues)
- 📣 **Share** the project with anyone who'd find it useful

Every coffee buys a weekend to ship something new instead of taking client work — thank you.

---

Made with precision by [Faheem Jawfar](https://github.com/faheemjafar).
