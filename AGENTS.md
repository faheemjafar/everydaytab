<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI conventions (Workbench redesign)

- Tokens live in `src/app/globals.css`. Warm-stone neutrals, accent via `--accent-h/--accent-c` (swappable with `<html data-accent>`), `--radius` = 6px. No blur, no drop shadows except `.shadow-float` for floating layers.
- Category colour: each category in `src/lib/tools.ts` has a `hue`; use `style={categoryStyle(cat)}` + class `cat-chip` on icon containers.
- Shell: `src/components/shell/*` (icon `Rail` → hover/pinned `Flyout`, `TopBar`, `MobileNav`, `AppShell`). User prefs: `useSettings()` (`src/hooks/use-settings.ts`), favorites/recents: `usePersistentTools()`. Both are localStorage-backed `useSyncExternalStore` stores (`src/lib/local-store.ts`).
- Tool pages: wrap in `ToolLayout` and build the workspace from `src/components/tool/*` (`ToolPanel`, `SplitLayout`, `OptionsLayout`, `CodeArea`, `FileDropzone`, `FileList`, `Field`, `Segmented`, `Stat`, `CopyButton`, `DownloadButton`, `ClearButton`, `StatusBadge`, `ToolAlert`, `PrivacyNote`). Reference migrations: json-formatter, merge-pdf, qr-generator, regex, image-compressor, timestamp-converter.
- Exactly one primary action per tool uses `<Button size="lg">`; everything else is default/`sm`. Avoid `rounded-[2rem]`, `backdrop-blur`, `shadow-*` and per-tool colour palettes.
- Lint uses the React Compiler rules: no `setState` synchronously inside effects (derive from a key/pathname instead), no `Date.now()`/`Math.random()` during render.
- Verify with `npx tsc --noEmit -p .`, `npx eslint <paths>`, `npx next build`.
