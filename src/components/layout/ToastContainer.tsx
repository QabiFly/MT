import React from 'react';
import { useApp } from '../../context/AppContext.js';
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((toast) => {
        let bgClass = 'bg-white border-slate-200 text-slate-900 shadow-lg';
        let Icon = Info;
        let iconColor = 'text-indigo-600';

        if (toast.type === 'success') {
          bgClass = 'bg-emerald-50/95 border-emerald-200 text-emerald-950 shadow-md';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-600';
        } else if (toast.type === 'warning') {
          bgClass = 'bg-amber-50/95 border-amber-200 text-amber-950 shadow-md';
          Icon = AlertTriangle;
          iconColor = 'text-amber-600';
        } else if (toast.type === 'alert') {
          bgClass = 'bg-rose-50/95 border-rose-200 text-rose-950 shadow-md';
          Icon = AlertCircle;
          iconColor = 'text-rose-600';
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${bgClass}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-xs leading-snug truncate">{toast.title}</p>
                <span className="text-[10px] opacity-60 shrink-0">{toast.timestamp}</span>
              </div>
              <p className="text-xs mt-1 text-slate-600 leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
