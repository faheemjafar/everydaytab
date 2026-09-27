"use client";

import { useState, type ComponentProps } from "react";
import { Check, Copy, Download, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BtnProps = Omit<ComponentProps<typeof Button>, "onClick" | "children">;

/** Copies `text` (or the result of `getText`) and shows a transient "Copied" state. */
export function CopyButton({
  text,
  getText,
  label = "Copy",
  iconOnly,
  className,
  ...props
}: BtnProps & { text?: string; getText?: () => string; label?: string; iconOnly?: boolean }) {
  const [copied, setCopied] = useState(false);
  const value = getText ? undefined : text;
  const disabled = props.disabled ?? (!getText && !text);

  const onClick = async () => {
    const v = getText ? getText() : value ?? "";
    if (!v) return;
    await navigator.clipboard.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      variant="outline"
      size={iconOnly ? "icon-sm" : "sm"}
      {...props}
      disabled={disabled}
      onClick={onClick}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      className={cn(copied && "text-emerald-600 dark:text-emerald-400 border-emerald-500/40", className)}
    >
      {copied ? <Check /> : <Copy />}
      {!iconOnly && (copied ? "Copied" : label)}
    </Button>
  );
}

/** Downloads `content` as a file. `content` may be a string or Blob. */
export function DownloadButton({
  content,
  filename,
  mime = "text/plain",
  label = "Download",
  iconOnly,
  ...props
}: BtnProps & { content?: string | Blob | null; filename: string; mime?: string; label?: string; iconOnly?: boolean }) {
  const disabled = props.disabled ?? !content;
  const onClick = () => {
    if (!content) return;
    const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button
      variant="outline"
      size={iconOnly ? "icon-sm" : "sm"}
      {...props}
      disabled={disabled}
      onClick={onClick}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
    >
      <Download />
      {!iconOnly && label}
    </Button>
  );
}

export function ClearButton({ onClick, label = "Clear", iconOnly, ...props }: BtnProps & { onClick: () => void; label?: string; iconOnly?: boolean }) {
  return (
    <Button
      variant="ghost"
      size={iconOnly ? "icon-sm" : "sm"}
      {...props}
      onClick={onClick}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      className={cn("text-muted-foreground hover:text-destructive", props.className)}
    >
      <Eraser />
      {!iconOnly && label}
    </Button>
  );
}
