import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification } from '../types';

interface ToastContextType {
  notifications: Notification[];
  showToast: (type: Notification['type'], message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  notifications: [],
  showToast: () => {},
  dismissToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismissToast = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showToast = useCallback((type: Notification['type'], message: string, duration = 5000) => {
    const id = 'toast-' + Date.now();
    setNotifications(prev => [...prev, { id, type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ notifications, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};
