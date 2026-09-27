<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI conventions (Workbench redesign)

- Tokens live in `src/app/globals.css`. Warm-stone neutrals, accent via `--accent-h/--accent-c` (swappable with `<html data-accent>`), `--radius` = 6px. No blur, no drop shadows except `.shadow-float` for floating layers.
- Category colour: each category in `src/lib/tools.ts` has a `hue`; use `style={categoryStyle(cat)}` + class `cat-chip` on icon containers.
- Shell: `src/components/shell/*` (icon `Rail` → hover/pinned `Flyout`, `TopBar`, `MobileNav`, `AppShell`). User prefs: `useSettings()` (`src/hooks/use-settings.ts`), favorites/recents: `usePersistentTools()`. Both are localStorage-backed `useSyncExternalStore` stores (`src/lib/local-store.ts`).
- Tool pages: wrap in `ToolLayout` and build the workspace from `src/components/tool/*` (`ToolPanel`, `SplitLayout`, `OptionsLayout`, `CodeArea`, `FileDropzone`, `FileList`, `Field`, `Segmented`, `Stat`, `CopyButton`, `DownloadButton`, `ClearButton`, `StatusBadge`, `ToolAlert`, `PrivacyNote`). Reference migrations: json-formatter, merge-pdf, qr-generator, regex, image-compressor, timestamp-converter.
- Category scaffolds (use these before hand-rolling layouts):
  - Single-PDF tools: `usePdfFile` + `<PdfTool>`; pages via `<PagePicker>`, text placement via `placeText`, rasterising via `rasterizePages` (output page size = `RasterPage.width/height` in points, never canvas pixels). Reference: split-pdf, page-numbers, compress-pdf.
  - Single-image tools: `useImageFile` + `<ImageTool>` (+ `FormatQuality`, `drawToCanvas`, `canvasToBlob`). Always process from the original `image.img`, not a previous result. Reference: image-resize, image-cropper.
  - Visual generators: `OptionsLayout` + `SliderField` / `ColorField` + preview `ToolPanel` + `<CodeOutput>` tabs (CSS / Tailwind …). Reference: box-shadow, gradient-studio.
  - Text in → text out tools: `<TextTransform input onInput output options sample …>` with `Toggle`s in the toolbar (sample, open file, copy, download, use-output-as-input built in). Reference: text-sorter, list-converter. Line/word diffs: `src/lib/diff.ts`. Rendered Markdown/HTML: wrap in `.md-preview` (no typography plugin is installed — `prose` classes do nothing).
  - Audio/video tools: `useMediaFile(kind)` + `<MediaTool>`; commands via `media.run({ args, output, mime, filename })`. Use `h264()` (adds `-pix_fmt yuv420p`) with `EVEN_DIMS` or an even `scale`, plus `FASTSTART` for MP4. Reference: video-trimmer, video-compressor, aspect-ratio-converter. `useFFmpeg` is a session singleton — don't instantiate FFmpeg directly.
  - Multi-step / multi-output jobs: `media.process(ctx => …)` (`ctx.exec`, `ctx.capture` for parsing logs, `ctx.list`/`ctx.track` for segment outputs). Audio outputs: `AUDIO_FORMATS`, `audioOutput()`, `AudioFormatField`, default to `audioFormatFor(file)` (keep the input's format).
  - FFmpeg.wasm 0.12 gotchas: `libvpx-vp9` crashes (use `libvpx` VP8 for WebM); `libopus` crashes on stereo at `-compression_level` ≥ 5 or non-48k input (use the `AUDIO_FORMATS.opus` args); `soxr` resampler isn't compiled in; libx264 rejects odd dimensions; `-af` is silently ignored when there's no audio, but `[n:a:0]` in a filtergraph fails.
- Never define components that render inputs inside another component's body (`const Row = () => <Input/>` inside render): React remounts them every keystroke and the field loses focus. Hoist them or inline the JSX.
- Anything depending on the viewer's clock, zone or locale (`new Date()`, `toLocaleString`, `Intl…resolvedOptions`) must render after `useMounted()` to avoid hydration mismatches.
- The TS target is below ES2020: use `BigInt(n)`, not `0n` literals.
- Never load remote assets (images, fonts, APIs) from a tool — everything must work offline and nothing may leave the device.
- Exactly one primary action per tool uses `<Button size="lg">`; everything else is default/`sm`. Avoid `rounded-[2rem]`, `backdrop-blur`, `shadow-*` and per-tool colour palettes.
- Lint uses the React Compiler rules: no `setState` synchronously inside effects (derive from a key/pathname instead), no `Date.now()`/`Math.random()` during render.
- Verify with `npx tsc --noEmit -p .`, `npx eslint <paths>`, `npx next build`.
