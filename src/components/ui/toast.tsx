import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ToastVariant = "success" | "error";

interface ToastMessage {
  id: string;
  title: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((toastId: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const notify = useMemo(() => {
    const addToast = (title: string, variant: ToastVariant) => {
      const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${variant}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current, { id, title, variant }]);
      setTimeout(() => removeToast(id), 4200);
    };

    return {
      success: (message: string) => addToast(message, "success"),
      error: (message: string) => addToast(message, "error"),
    };
  }, [removeToast]);

  useEffect(() => {
    return () => {
      setToasts([]);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed inset-0 pointer-events-none z-50 flex justify-end p-4">
        <div className="flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              className={`pointer-events-auto w-80 rounded-xl border px-4 py-3 text-sm shadow-lg transition-all dark:shadow-none ${
                toast.variant === "success"
                  ? "border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/80"
                  : "border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/80"
              }`}
            >
              {toast.title}
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context.notify;
}
