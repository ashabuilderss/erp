"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "loading";
  duration: number;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast["type"], options?: { action?: ToastAction; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, type: Toast["type"] = "success", options?: { action?: ToastAction; duration?: number }) => {
    const id = nextId.current++;
    const duration = options?.duration ?? (type === "error" ? 6000 : type === "loading" ? Infinity : 3500);
    setToasts((prev) => [...prev, { id, message, type, duration, action: options?.action }]);
    if (duration < Infinity) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg animate-in slide-in-from-right-full fade-in",
              toast.type === "success" && "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
              toast.type === "error" && "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
              toast.type === "info" && "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
              toast.type === "loading" && "border-muted bg-background text-foreground"
            )}
          >
            {toast.type === "loading" && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
            <span className="flex-1 break-words">{toast.message}</span>
            {toast.action && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs shrink-0"
                onClick={() => {
                  toast.action?.onClick();
                  dismissToast(toast.id);
                }}
              >
                {toast.action.label}
              </Button>
            )}
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded p-0.5 hover:bg-black/5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
