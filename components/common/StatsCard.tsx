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

const colorMap: Record<string, string> = {
  indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20',
  emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
  blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
  amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
  purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
  rose: 'from-rose-500/10 to-rose-600/5 border-rose-500/20',
  cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
};

const iconColorMap: Record<string, string> = {
  indigo: 'text-indigo-400 bg-indigo-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  blue: 'text-blue-400 bg-blue-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  purple: 'text-purple-400 bg-purple-500/10',
  rose: 'text-rose-400 bg-rose-500/10',
  cyan: 'text-cyan-400 bg-cyan-500/10',
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, subtitle, color = 'indigo', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all duration-300',
        'hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5',
        colorMap[color] || colorMap.indigo,
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconColorMap[color] || iconColorMap.indigo)}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {trend && (
          <span className={clsx('flex items-center text-xs font-medium', trend.isUp ? 'text-emerald-400' : 'text-red-400')}>
            {trend.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
};

export default StatsCard;
