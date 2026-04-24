"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";

// ───────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "EXIT"; id: string }
  | { type: "REMOVE"; id: string };

function reducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case "ADD":
      return [...state.slice(-4), action.toast];
    case "EXIT":
      return state.map((t) => (t.id === action.id ? { ...t, exiting: true } : t));
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
  }
}

// ───────────────────────────────────────────────────────────
// Context
// ───────────────────────────────────────────────────────────
interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ───────────────────────────────────────────────────────────
// Toast item
// ───────────────────────────────────────────────────────────
const STYLES: Record<
  ToastType,
  { card: string; icon: string; iconBg: string; symbol: string }
> = {
  success: {
    card: "border-emerald-200/80 bg-emerald-50/90",
    icon: "text-emerald-700",
    iconBg: "bg-emerald-500 text-white",
    symbol: "✓",
  },
  error: {
    card: "border-red-200/80 bg-red-50/90",
    icon: "text-red-700",
    iconBg: "bg-red-500 text-white",
    symbol: "✕",
  },
  info: {
    card: "border-blue-200/80 bg-blue-50/90",
    icon: "text-blue-700",
    iconBg: "bg-blue-500 text-white",
    symbol: "ℹ",
  },
  warning: {
    card: "border-amber-200/80 bg-amber-50/90",
    icon: "text-amber-700",
    iconBg: "bg-amber-500 text-white",
    symbol: "⚠",
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const s = STYLES[toast.type];
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md ${s.card} ${
        toast.exiting ? "toast-exit" : "toast-enter"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${s.iconBg}`}
      >
        {s.symbol}
      </span>
      <p className={`flex-1 text-sm font-medium leading-snug ${s.icon}`}>
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`ml-1 mt-0.5 flex-shrink-0 text-xs opacity-50 transition hover:opacity-100 ${s.icon}`}
        aria-label="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Provider
// ───────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "EXIT", id });
    setTimeout(() => dispatch({ type: "REMOVE", id }), 300);
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    dispatch({ type: "ADD", toast: { id, message, type } });
  }, []);

  const success = useCallback((msg: string) => toast(msg, "success"), [toast]);
  const error = useCallback((msg: string) => toast(msg, "error"), [toast]);
  const info = useCallback((msg: string) => toast(msg, "info"), [toast]);
  const warning = useCallback((msg: string) => toast(msg, "warning"), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Thông báo"
        className="fixed bottom-6 right-4 z-[200] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
