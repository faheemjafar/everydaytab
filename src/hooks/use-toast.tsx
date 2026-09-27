"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title?: string;
  description: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (description: string, options?: Omit<Toast, "id" | "description">) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (description: string, options?: Omit<Toast, "id" | "description">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = options?.duration ?? 4000;

      const newToast: Toast = {
        id,
        description,
        type: options?.type ?? "info",
        title: options?.title,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, toasts, dismiss }), [toast, toasts, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToasterContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Visual layout container for toasts
function ToasterContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-80 pointer-events-none">
      {toasts.map((t) => {
        let Icon = Info;
        let iconColor = "text-sky-600 dark:text-sky-400";
        if (t.type === "success") {
          Icon = CheckCircle;
          iconColor = "text-emerald-600 dark:text-emerald-400";
        } else if (t.type === "error") {
          Icon = AlertCircle;
          iconColor = "text-destructive";
        } else if (t.type === "warning") {
          Icon = AlertTriangle;
          iconColor = "text-amber-600 dark:text-amber-400";
        }

        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-popover text-popover-foreground shadow-float animate-in slide-in-from-bottom-2 fade-in duration-200 select-none"
            role="alert"
          >
            <Icon className={`w-4 h-4 mt-px shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-xs font-semibold text-foreground leading-tight">{t.title}</p>}
              <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-muted-foreground/60 hover:text-foreground transition-colors h-5 w-5 rounded-sm flex items-center justify-center hover:bg-muted shrink-0 cursor-pointer -mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
