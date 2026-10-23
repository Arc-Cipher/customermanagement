import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import type { ApiError } from '../types/api';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  handleApiError: (error: unknown, fallbackMessage?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function extractErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Partial<ApiError>;
    if (typeof data === 'object' && data.message) {
      if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
        const fieldMsgs = Object.entries(data.fieldErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
        return `${data.message} (${fieldMsgs})`;
      }
      return data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function extractFieldErrors(error: unknown): Record<string, string> | null {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Partial<ApiError>;
    if (typeof data === 'object' && data.fieldErrors) {
      return data.fieldErrors;
    }
  }
  return null;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const handleApiError = useCallback((err: unknown, fallback = 'Operation failed') => {
    const message = extractErrorMessage(err, fallback);
    error(message);
  }, [error]);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
      success,
      error,
      info,
      handleApiError,
    }),
    [toasts, showToast, removeToast, success, error, info, handleApiError]
  );

  return React.createElement(ToastContext.Provider, { value }, children);
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
