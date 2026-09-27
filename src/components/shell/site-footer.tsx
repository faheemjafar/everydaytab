import Link from "next/link";
import { GithubIcon as Github } from "@/components/github-icon";
import { tools } from "@/lib/tools";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="w-4 h-4 rounded-xs" />
          <span>
            EverydayTab · {tools.length} free tools · runs entirely in your browser
          </span>
        </div>
        <nav className="flex items-center gap-1">
          <Link href="/settings" className="px-2 py-1 rounded-sm hover:text-foreground hover:bg-muted transition-colors">
            Settings
          </Link>
          <a
            href="https://github.com/faheemjafar/everydaytab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm hover:text-foreground hover:bg-muted transition-colors"
          >
            <Github className="w-3.5 h-3.5" /> GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
