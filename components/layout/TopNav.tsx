import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Bell, Menu, Moon, Sun, LogOut, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { clsx, getInitials, formatDate } from '../../services/utils';
import { LeaveStatus, AttendanceStatus } from '../../types';

interface TopNavProps {
  title: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMenuToggle: () => void;
  children?: React.ReactNode;
}

const TopNav: React.FC<TopNavProps> = ({ title, searchQuery, onSearchChange, onMenuToggle, children }) => {
  const { user, leaveRequests, absenteeism } = useApp();
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const notifications = useMemo(() => {
    const items: { id: string; type: 'warning' | 'error' | 'info'; message: string; time: string }[] = [];

    const pending = leaveRequests.filter(lr => lr.status === LeaveStatus.PENDING);
    pending.forEach(lr => {
      items.push({ id: lr.id, type: 'warning', message: `${lr.learnerName} requested ${lr.leaveType.toLowerCase()} leave`, time: lr.startDate });
    });

    const lateToday = absenteeism.filter(a => a.date === today && a.attendanceStatus === AttendanceStatus.LATE);
    lateToday.forEach(a => {
      items.push({ id: a.id + '-late', type: 'error', message: `${a.learnerName} arrived late today`, time: today });
    });

    const absentToday = absenteeism.filter(a => a.date === today && (a.attendanceStatus === AttendanceStatus.ABSENT || a.attendanceStatus === AttendanceStatus.NO_CALL_NO_SHOW));
    absentToday.forEach(a => {
      items.push({ id: a.id + '-absent', type: 'error', message: `${a.learnerName} is absent today`, time: today });
    });

    items.sort((a, b) => b.time.localeCompare(a.time));
    return items.filter(n => !dismissed.has(n.id));
  }, [leaveRequests, absenteeism, today, dismissed]);

  const dismissNotification = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const dismissAll = () => {
    setDismissed(prev => new Set([...prev, ...notifications.map(n => n.id)]));
    setNotifOpen(false);
  };

  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-[1600px] flex items-center justify-between px-4 sm:px-6 h-14">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <Menu size={18} />
          </button>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-44 lg:w-56 pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button onClick={toggleDarkMode} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors" title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
              <Bell size={16} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
                  <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => dismissNotification(n.id)}
                        className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                      >
                        <span className={clsx(
                          'w-2 h-2 rounded-full mt-1.5 shrink-0',
                          n.type === 'warning' && 'bg-amber-400',
                          n.type === 'error' && 'bg-red-400',
                          n.type === 'info' && 'bg-blue-400'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(n.time)}</p>
                        </div>
                      </button>
                    ))
                  )}
                  {notifications.length > 0 && (
                    <button onClick={dismissAll} className="w-full px-4 py-2 text-xs text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-800">
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {children}

          <button onClick={logout} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors" title="Log out">
            <LogOut size={16} />
          </button>

          {user && (
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
              {getInitials(user.name)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
