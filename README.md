# EverydayTab

> 240 free, privacy-first web tools that run entirely in your browser. No sign-up, no uploads, no watermarks, no file-size limits.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Repo](https://img.shields.io/badge/GitHub-faheemjafar%2Feverydaytab-181717?logo=github)](https://github.com/faheemjafar/everydaytab)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2016-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-%E2%9D%A4-EA4AAA?logo=githubsponsors)](https://github.com/sponsors/faheemjafar)

**Live:** [everydaytab.com](https://everydaytab.com) · Built and maintained solo by [@faheemjafar](https://github.com/faheemjafar).

## What's inside

**240 tools** across **14 categories**, ordered by demand:

| Category | Tools | Examples |
|---|---:|---|
| **PDF** | 24 | Merge, split, compress, rotate, sign, watermark, crop, page numbers, extract text, remove blank pages, scanner effect |
| **Image** | 18 | Compressor, converter, resizer, cropper, aspect-ratio, SVG optimizer, CSS grid/flexbox/gradient/box-shadow generators |
| **Video** | 13 | Converter, compressor, trimmer, merger, cropper, rotator, speed changer, GIF ↔ video, extract audio |
| **Audio** | 19 | Converter, trimmer, merger, compressor, equalizer, loudness normalizer, silence remover, ringtone maker |
| **Converters** | 15 | Unix timestamp, time zones, units, temperature, number bases, Roman numerals, Morse, IBAN validator |
| **Text** | 18 | Word counter, case converter, diff, sorter, cleaner, slugify, readability, Markdown ↔ HTML |
| **Developer** | 65 | JSON (format, diff, schema, → TS/Go/SQL), YAML/TOML/XML, JWT, regex, cron, cURL, Docker Compose, SQL, GraphQL, IP/subnet |
| **Generators** | 13 | QR codes, barcodes, WiFi QR, UUID, ULID, tokens, passwords, Lorem Ipsum, invoices, ASCII art |
| **Color** | 9 | HEX/RGB/HSL/OKLCH/LAB converter, palette extractor, contrast checker, color-blindness simulator, name finder |
| **Math** | 16 | Calculator, expression evaluator, percentage, fractions, BMI, calories, salary, tips, dates, age, ETA |
| **Security** | 15 | Hashes, HMAC, bcrypt, AES, RSA keys, JWT generator, OTP/TOTP, BIP39, password strength, SSL decoder |
| **SEO** | 7 | Meta tags, Open Graph, robots.txt, sitemap, FAQ schema, keyword analyzer, URL slugs |
| **Markdown** | 5 | Live editor, table generator, cheatsheet, → HTML, file combiner |
| **Files** | 3 | ZIP, archive extractor, batch renamer |

Heavy lifting (audio, video, PDF) is done with WebAssembly builds of FFmpeg, pdf-lib and pdf.js — in the browser, on your machine.

## Principles

- **Privacy first.** Nothing you paste or upload leaves your device. There are no accounts and no server-side processing.
- **Fast to reach.** `⌘K` / `Ctrl+K` searches all 240 tools; the sidebar opens any category's tool list on hover and can be pinned; recents and favorites are one click away.
- **Consistent.** One design system ("Workbench": warm neutrals, a single accent, 6px radius, no blur) and a shared set of tool primitives, so every tool behaves the same.
- **Yours to tune.** Settings for theme, accent colour, density, font size, sidebar labels/pinning, guide visibility, and export/import of your local data. `⌘,` opens it.
- **Works everywhere.** Icon rail + flyouts on desktop; bottom tab bar and full-screen browser on mobile. Installable as a PWA.
- **Crawlable.** Every tool and category page has server-rendered guide content, JSON-LD and a generated Open Graph image.

## Tech stack

| | |
|---|---|
| [Next.js 16](https://nextjs.org) (App Router, Turbopack) | Framework, static generation, metadata/OG routes |
| [React 19](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org) | UI and type safety |
| [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com) | Styling and accessible primitives |
| [Lucide](https://lucide.dev) | Icons |
| [cmdk](https://cmdk.paco.me) | Command palette |
| [pdf-lib](https://pdf-lib.js.org), [pdf.js](https://mozilla.github.io/pdf.js/), [@ffmpeg/ffmpeg](https://ffmpegwasm.netlify.app) | Client-side PDF, audio and video processing |

## Getting started

Requires Node.js 20+.

```bash
git clone https://github.com/faheemjafar/everydaytab.git
cd everydaytab
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build (fully static)
npm run lint       # eslint (React Compiler rules)
npx tsc --noEmit   # type-check
```

## Project structure

```
src/
├── app/
│   ├── tools/<tool-id>/         # One folder per tool: page.tsx (metadata) + client.tsx (UI)
│   ├── category/[id]/           # Category hub pages
│   ├── settings/  favorites/    # User preference + favorites pages (local-only)
│   ├── og/route.tsx             # Dynamic Open Graph images for tools & categories
│   ├── layout.tsx               # Root layout → AppShell
│   └── globals.css              # Design tokens
├── components/
│   ├── shell/                   # Rail, Flyout, TopBar, MobileNav, AppShell, footer
│   ├── tool/                    # Shared tool primitives (ToolPanel, CodeArea, FileDropzone, …)
│   ├── ui/                      # shadcn/ui primitives
│   ├── tool-layout.tsx          # Header wrapper every tool renders inside
│   └── command-palette.tsx      # ⌘K
├── content/                     # Server-rendered guide text per tool / category
├── hooks/                       # use-settings, use-persistent-tools, use-toast, use-ffmpeg
└── lib/
    ├── tools.ts                 # The registry: categories (ordered, with hue) and all tools
    ├── settings.ts              # Settings schema, defaults, boot script
    ├── local-store.ts           # localStorage-backed useSyncExternalStore
    └── seo.ts                   # Metadata + JSON-LD generators
```

## Contributing

Issues and pull requests are welcome.

1. Fork, then `git checkout -b feat/my-tool`.
2. Make your change; run `npm run lint`, `npx tsc --noEmit` and `npm run build`.
3. Commit with a conventional message (`feat: add JSON diff visualizer`) and open a PR.

### Adding a tool

1. Create `src/app/tools/<tool-id>/` with:
   - `page.tsx` — copy from any existing tool; it wires `generateToolMetadata`, JSON-LD and `ToolSeoContent`.
   - `client.tsx` — the UI. Wrap it in `<ToolLayout toolId="<tool-id>">` and build the workspace from `@/components/tool` (`ToolPanel`, `SplitLayout`, `OptionsLayout`, `CodeArea`, `FileDropzone`, `FileList`, `Field`, `Segmented`, `Stat`, `CopyButton`, `DownloadButton`, `StatusBadge`, `ToolAlert`, `PrivacyNote`). See `json-formatter`, `merge-pdf`, `qr-generator` or `image-compressor` for reference.
2. Register it in `src/lib/tools.ts`: `id`, `name`, `description`, `category` (existing id), `icon` (a Lucide name that exists in `components/lucide-icon.tsx`), `path`, `tags`.
3. Optionally add guide content in `src/content/tools/<tool-id>.ts` — it renders under the tool and feeds the FAQ/HowTo schema.
4. Keep processing client-side, use exactly one `<Button size="lg">` for the primary action, and check both themes.

Conventions for the UI system are in [`AGENTS.md`](AGENTS.md).

## Roadmap

- [ ] Migrate remaining tools onto the shared primitives (115 of 240 done — PDF, Image, Video, Audio, Converters and Text complete)
- [ ] Build-time popularity ranking from analytics exports
- [ ] More PDF tools (OCR, redaction, form filling)
- [ ] Batch/queue processing for file-based tools
- [ ] Internationalisation

## Support the project

EverydayTab is free, ad-free and 100% client-side, built solo on nights and weekends. If it saves you time:

- 💖 **[Sponsor on GitHub](https://github.com/sponsors/faheemjafar)** — recurring or one-off, companies can expense it
- ⭐ Star the repo
- 🐛 [Report a bug or request a tool](https://github.com/faheemjafar/everydaytab/issues)
- 📣 Share it with someone who'd find it useful

## License

[MIT](LICENSE) — © [Faheem Jafar](https://github.com/faheemjafar)
