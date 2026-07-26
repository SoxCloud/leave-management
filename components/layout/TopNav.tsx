import React from 'react';
import { Search, Bell, Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials } from '../../services/utils';

interface TopNavProps {
  title: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMenuToggle: () => void;
  children?: React.ReactNode;
}

const TopNav: React.FC<TopNavProps> = ({ title, searchQuery, onSearchChange, onMenuToggle, children }) => {
  const { user } = useApp();
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

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

          <button className="relative p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>

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
