import React from 'react';
import { clsx, getStatusBadgeClass } from '../../services/utils';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'outline' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', size = 'sm', dot, className }) => {
  const badgeClass = getStatusBadgeClass(label);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full border whitespace-nowrap',
        variant === 'default' && badgeClass,
        variant === 'outline' && 'border-slate-600 text-slate-300',
        variant === 'subtle' && 'bg-slate-800/50 text-slate-400 border-transparent',
        sizeClasses[size],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
};

export default Badge;
