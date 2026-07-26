import React from 'react';
import {
  LayoutDashboard, Users, CalendarCheck, ClipboardList, Timer,
  BarChart3, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { clsx, getInitials } from '../../services/utils';
import { AppUser } from '../../types';

interface SidebarProps {
  user: AppUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'learners', label: 'Learners', icon: Users },
  { id: 'leave', label: 'Leave Requests', icon: CalendarCheck },
  { id: 'attendance', label: 'Attendance', icon: ClipboardList },
  { id: 'calendar', label: 'Calendar', icon: Timer },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, collapsed, onToggleCollapse }) => {
  return (
    <div className={clsx(
      'h-screen flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className={clsx('flex items-center gap-3 px-5 h-16 border-b border-gray-100 dark:border-gray-800', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
          LM
        </div>
        {!collapsed && <span className="text-gray-900 dark:text-white font-semibold text-base">LeaveHub</span>}
        <button onClick={onToggleCollapse} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-300 dark:text-gray-500 transition-colors">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto min-h-0">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className={isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'} />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {getInitials(user.name)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
