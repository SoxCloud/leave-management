import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from '../../services/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  subtitle?: string;
  onClick?: () => void;
  progress?: number;
  accent?: 'default' | 'positive' | 'negative';
}

const accentNumber: Record<string, string> = {
  default: 'text-gray-900 dark:text-white',
  positive: 'text-[#22C55E]',
  negative: 'text-[#EF4444]',
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, subtitle, onClick, progress, accent = 'default' }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-lg border border-gray-200 dark:border-[#1F2937] bg-white dark:bg-[#0B0B0B] p-4 transition-all duration-200',
        onClick && 'cursor-pointer',
        'hover:shadow-md hover:bg-gray-50 dark:hover:bg-[#111827]'
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-[#9CA3AF]">{title}</span>
      </div>
      <div className="pl-11">
        <div className="flex items-center gap-2">
          <span className={clsx('text-2xl font-bold leading-none', accentNumber[accent])}>{value}</span>
          {trend && (
            <span className={clsx('flex items-center gap-0.5 text-xs font-medium', trend.isUp ? 'text-[#22C55E]' : 'text-[#EF4444]')}>
              {trend.isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {trend.isUp ? '+' : ''}{trend.value}{trend.isUp ? ' ↑' : ' ↓'}
            </span>
          )}
        </div>
        {progress !== undefined && (
          <div className="mt-2 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all', accent === 'positive' ? 'bg-[#22C55E]' : accent === 'negative' ? 'bg-[#EF4444]' : 'bg-indigo-500')}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
