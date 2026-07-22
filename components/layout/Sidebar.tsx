import React from 'react';
import {
  LayoutDashboard, Users, CalendarCheck, ClipboardList, Timer,
  BarChart3, Settings, ChevronLeft, FileText
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
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, collapsed, onToggleCollapse }) => {
  return (
    <div className={clsx(
      'h-screen flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/60 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className={clsx('flex items-center gap-3 px-4 h-16 border-b border-slate-800/60', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0">
          LM
        </div>
        {!collapsed && <span className="text-white font-bold text-lg">LeaveHub</span>}
        <button onClick={onToggleCollapse} className={clsx('p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors', collapsed && 'hidden')}>
          <ChevronLeft size={16} />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800/60">
        <div className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getInitials(user.name)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">Admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
