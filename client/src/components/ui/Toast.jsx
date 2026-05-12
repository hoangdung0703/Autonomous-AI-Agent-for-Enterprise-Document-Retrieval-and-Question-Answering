import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const STYLES = {
  success: {
    border: 'border-status-ready',
    icon: <CheckCircle2 size={16} className="text-status-ready flex-shrink-0" />,
  },
  error: {
    border: 'border-status-failed',
    icon: <XCircle size={16} className="text-status-failed flex-shrink-0" />,
  },
  warning: {
    border: 'border-status-processing',
    icon: <AlertTriangle size={16} className="text-status-processing flex-shrink-0" />,
  },
  info: {
    border: 'border-border-default',
    icon: <Info size={16} className="text-text-secondary flex-shrink-0" />,
  },
};

export default function Toast({ toasts, onRemove }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const style = STYLES[toast.type] || STYLES.info;
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border min-w-64 max-w-sm shadow-lg bg-background-elevated text-text-primary animate-fade-in ${style.border}`}
          >
            {style.icon}
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
