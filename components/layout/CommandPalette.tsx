import React, { useState, useEffect, useCallback } from 'react';
import { Search, Command, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { clsx } from '../../services/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { setActiveTab, learners } = useApp();

  const commands = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: '→', action: () => setActiveTab('dashboard') },
    { id: 'learners', label: 'Go to Learners', icon: '→', action: () => setActiveTab('learners') },
    { id: 'leave', label: 'Go to Leave Requests', icon: '→', action: () => setActiveTab('leave') },
    { id: 'attendance', label: 'Go to Attendance', icon: '→', action: () => setActiveTab('attendance') },
    { id: 'reports', label: 'Go to Reports', icon: '→', action: () => setActiveTab('reports') },
    { id: 'analytics', label: 'Go to Analytics', icon: '→', action: () => setActiveTab('analytics') },
    { id: 'settings', label: 'Go to Settings', icon: '→', action: () => setActiveTab('settings') },
    ...learners.slice(0, 5).map(l => ({
      id: `learner-${l.fullName}`, label: `View ${l.fullName}`, icon: '👤', action: () => { setActiveTab('learners'); }
    })),
  ];

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      onClose();
    }
  }, [filtered, selectedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setQuery('');
      setSelectedIndex(0);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search size={18} className="text-slate-500" />
          <input
            autoFocus
            placeholder="Type a command or search..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-xs bg-slate-800 rounded text-slate-400 border border-slate-700">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => { cmd.action(); onClose(); }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                i === selectedIndex ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <span className="w-6 text-center">{cmd.icon}</span>
              <span>{cmd.label}</span>
              <ArrowRight size={14} className="ml-auto opacity-50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
