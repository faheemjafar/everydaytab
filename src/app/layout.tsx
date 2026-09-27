import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/shell/app-shell";
import { CommandPalette } from "@/components/command-palette";
import { SupportPrompt } from "@/components/support-prompt";
import { ToastProvider } from "@/hooks/use-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { SETTINGS_BOOT_SCRIPT } from "@/lib/settings";
import { StatCounter } from "@statcounter/nextjs";

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EverydayTab",
  url: "https://everydaytab.com",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://everydaytab.com/#search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://everydaytab.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "EverydayTab - 250+ Best Free Online Developer & Utility Tools",
    template: "%s | EverydayTab",
  },
  description:
    "Best free collection of 250+ all-in-one online tools for developers, designers, students, and everyday tasks. JSON formatter, PDF tools, Base64 encoder, color converter, regex tester, QR code generator, and more. All browser-based — no sign-up required.",
  keywords: [
    "online tools",
    "best free online tools",
    "all in one free online tools",
    "free online tools for students",
    "developer tools",
    "free online tools",
    "JSON formatter",
    "Base64 encoder",
    "PDF tools",
    "color converter",
    "regex tester",
    "UUID generator",
    "utility tools",
    "web tools",
    "coding tools",
    "privacy first tools",
    "browser based tools",
    "no signup tools",
    "free developer tools",
    "online utility tools",
    "text tools",
    "converter tools",
    "math tools",
    "image tools",
    "color tools",
    "generator tools",
    "security tools",
    "audio tools",
    "video tools",
    "online calculator",
    "timestamp converter",
    "password generator",
    "QR code generator",
    "cron expression tester",
    "SVG optimizer",
    "glassmorphism generator",
    "CSS gradient generator",
    "flexbox generator",
    "grid generator",
    "hash generator",
    "aes encryption",
    "jwt parser",
    "json viewer",
    "xml formatter",
    "sql prettify",
    "docker compose converter",
    "lorem ipsum",
    "word counter",
    "case converter",
    "text diff",
    "markdown html",
    "slugify",
    "unit converter",
    "percentage calculator",
    "stopwatch",
    "image resize",
    "color palette extractor",
    "contrast checker",
    "barcode generator",
    "wifi qr code",
    "audio converter",
    "video converter",
    "video compressor",
  ],
  authors: [{ name: "EverydayTab" }],
  creator: "EverydayTab",
  publisher: "EverydayTab",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "EverydayTab",
    title: "EverydayTab - 250+ Best Free Online Developer & Utility Tools",
    description:
      "Best free collection of 250+ all-in-one online tools for developers, designers, students, and everyday tasks. All browser-based — no sign-up required.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EverydayTab - 250+ Best Free Online Developer & Utility Tools",
    description:
      "Best free collection of 250+ all-in-one online tools for developers, designers, students, and everyday tasks. All browser-based — no sign-up required.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EverydayTab",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f23" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", jetbrainsMono.variable)}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SETTINGS_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(WEBSITE_JSON_LD),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <CommandPalette />
            <SupportPrompt />
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </ThemeProvider>
        <StatCounter project_id={13248196} security_code="282a098d" />
      </body>
    </html>
  );
}
