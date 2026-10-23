import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastItem } from '../../hooks/useToast';

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const configs = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
      closeHover: 'hover:bg-emerald-100 text-emerald-600',
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
      closeHover: 'hover:bg-red-100 text-red-600',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
      closeHover: 'hover:bg-blue-100 text-blue-600',
    },
  };

  const config = configs[toast.type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all transform ease-out duration-300 pointer-events-auto ${config.bg} max-w-sm w-full`}
    >
      {config.icon}
      <div className="flex-1 text-sm font-medium leading-5 break-words">
        {toast.message}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className={`p-1 rounded-md transition-colors ${config.closeHover}`}
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
