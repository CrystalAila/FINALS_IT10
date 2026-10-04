import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  const toastMethods = React.useMemo(
    () => ({ success, error, warning, info }),
    [success, error, warning, info]
  );

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200 text-red-900',
          icon: <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-900',
          icon: <Info className="h-5 w-5 text-slate-600 shrink-0" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, toast: toastMethods }}>
      {children}
      {/* Toast Floating Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const { bg, icon } = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${bg}`}
              role="alert"
            >
              <div className="mt-0.5">{icon}</div>
              <p className="flex-1 text-xs font-semibold leading-relaxed break-words">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-lg p-0.5 opacity-60 hover:opacity-100 hover:bg-black/5 transition"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
