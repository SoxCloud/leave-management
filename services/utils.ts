export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return 'LMS-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-ZA').format(num);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function daysRemaining(endDate: string): number {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    Pending: 'amber',
    Approved: 'emerald',
    Rejected: 'red',
    Cancelled: 'slate',
    Present: 'emerald',
    Absent: 'red',
    Late: 'amber',
    'Half Day': 'blue',
    'No Call No Show': 'rose',
    'Medical Leave': 'purple',
    'Authorised Absence': 'cyan',
    'Unauthorised Absence': 'orange',
    Annual: 'blue',
    Sick: 'red',
    'Family Responsibility': 'purple',
    Other: 'slate',
    Active: 'emerald',
    Inactive: 'slate',
    Graduated: 'blue',
    Terminated: 'red',
  };
  return map[status] || 'slate';
}

export function getStatusBadgeClass(status: string): string {
  const color = getStatusColor(status);
  const classes: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  return classes[color] || classes.slate;
}

export function getStatusBadgeClassLight(status: string): string {
  const color = getStatusColor(status);
  const classes: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    rose: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return classes[color] || classes.slate;
}

export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
