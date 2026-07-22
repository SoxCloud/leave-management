import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { clsx } from '../../services/utils';

interface TopNavProps {
  title: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMenuToggle: () => void;
  children?: React.ReactNode;
}

const TopNav: React.FC<TopNavProps> = ({ title, searchQuery, onSearchChange, onMenuToggle, children }) => {
  return (
    <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-48 lg:w-64 pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <button className="relative p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {children}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
