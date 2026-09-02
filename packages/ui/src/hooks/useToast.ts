import { useState, useCallback } from 'react';
import type { ToastData, ToastVariant } from '../components/Toast.js';

let counter = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback(
    (title: string, options?: { description?: string; variant?: ToastVariant; duration?: number }) => {
      const id = `toast-${++counter}`;
      setToasts((prev) => [...prev, { id, title, ...options }]);
      return id;
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    toast,
    dismiss,
    success: (title: string, desc?: string) => toast(title, { variant: 'success', description: desc }),
    error:   (title: string, desc?: string) => toast(title, { variant: 'error',   description: desc }),
    warning: (title: string, desc?: string) => toast(title, { variant: 'warning', description: desc }),
  };
};
