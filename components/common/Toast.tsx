import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Notification } from '../../types';
import { useToast } from '../../context/ToastContext';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300',
  error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300',
  warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300',
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300',
};

const ToastContainer: React.FC = () => {
  const { notifications, dismissToast } = useToast();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm">
      {notifications.map(n => {
        const Icon = icons[n.type];
        return (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-up ${colors[n.type]}`}
          >
            <Icon size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm flex-1">{n.message}</p>
            <button onClick={() => dismissToast(n.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
