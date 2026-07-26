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
    Unpaid: 'cyan',
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
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    emerald: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
    slate: 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    purple: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
    cyan: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    rose: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
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
