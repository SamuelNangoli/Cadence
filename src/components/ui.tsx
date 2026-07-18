"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger" | "success";
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
        size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm",
        variant === "default" &&
          "border border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--panel2)] text-[var(--text)]",
        variant === "primary" && "bg-[var(--accent)] text-white hover:opacity-90",
        variant === "ghost" && "hover:bg-[var(--panel2)] text-[var(--muted)] hover:text-[var(--text)]",
        variant === "danger" && "border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10",
        variant === "success" && "bg-emerald-600 text-white hover:bg-emerald-700",
        className
      )}
      {...props}
    />
  );
}

export function Input(props: React.ComponentPropsWithRef<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 resize-y",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-9 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer",
        props.className
      )}
    />
  );
}

export function Badge({
  color,
  bg,
  children,
  className,
}: {
  color: string;
  bg: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4", className)}
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-[var(--border)] bg-[var(--panel2)] px-1 font-mono text-[10px] text-[var(--muted)]">
      {children}
    </kbd>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[8vh]" onMouseDown={onClose}>
      <div
        className={cn(
          "fade-up w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl",
          wide ? "max-w-2xl" : "max-w-md"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--panel2)] cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]",
        className
      )}
    />
  );
}
