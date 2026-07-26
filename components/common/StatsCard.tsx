import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from '../../services/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  subtitle?: string;
  color?: string;
  onClick?: () => void;
}

const iconColorMap: Record<string, string> = {
  indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30',
  emerald: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
  amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
  purple: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30',
  rose: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
  cyan: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, subtitle, color = 'indigo', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconColorMap[color] || iconColorMap.indigo)}>
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      <div className="flex items-end gap-2 pl-11">
        <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{value}</span>
        {trend && (
          <span className={clsx('flex items-center text-xs font-medium', trend.isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            {trend.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 pl-11">{subtitle}</p>}
    </div>
  );
};

export default StatsCard;
