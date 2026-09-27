"use client";

import { useRef, useState, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  title?: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  /** "lg" for the primary upload step, "sm" for "add more" strips. */
  size?: "lg" | "sm";
  className?: string;
}

export function FileDropzone({
  onFiles,
  accept,
  multiple,
  disabled,
  title = "Drop files here or click to browse",
  hint,
  icon,
  size = "lg",
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = Array.from(list);
    onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files);
      }}
      className={cn(
        "group flex flex-col items-center justify-center text-center rounded-md border border-dashed bg-dots transition-colors cursor-pointer outline-none",
        "focus-visible:ring-1 focus-visible:ring-ring",
        size === "lg" ? "gap-2 px-6 py-10 min-h-44" : "gap-1.5 px-4 py-4 flex-row justify-start text-left",
        over ? "border-primary bg-accent/40" : "border-border hover:border-ring/60 hover:bg-muted/40",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => { handle(e.target.files); e.target.value = ""; }} />
      <span
        className={cn(
          "flex items-center justify-center rounded-md bg-card border border-border text-muted-foreground group-hover:text-foreground transition-colors shrink-0",
          size === "lg" ? "w-10 h-10 mb-1" : "w-8 h-8"
        )}
      >
        {icon ?? <Upload className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />}
      </span>
      <div className="min-w-0">
        <p className={cn("font-medium", size === "lg" ? "text-sm" : "text-[13px]")}>{title}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}
