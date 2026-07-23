const ACCRUAL_RATE = 1.5;
const ACCRUAL_INTERVAL_DAYS = 30;
const MAX_ANNUAL_LEAVE = 18;

export function calculateAccruedDays(startDate: string, endDate?: string): number {
  let end = new Date();
  if (endDate) {
    const expectedEnd = new Date(endDate);
    if (expectedEnd < end) end = expectedEnd;
  }
  const months = getMonthsBetween(startDate, end.toISOString());
  const accrued = months * ACCRUAL_RATE;
  return Math.min(accrued, MAX_ANNUAL_LEAVE);
}

export function calculateLeaveBalance(startDate: string, leaveTaken: number, endDate?: string): number {
  const accrued = calculateAccruedDays(startDate, endDate);
  return Math.round((accrued - leaveTaken) * 10) / 10;
}

export function calculateAnnualLeaveTaken(leaveRequests: { leaveType: string; status: string; daysRequested: number }[]): number {
  return leaveRequests
    .filter(lr => lr.leaveType === 'Annual' && lr.status === 'Approved')
    .reduce((sum, lr) => sum + lr.daysRequested, 0);
}

export function getDaysBetween(startDate: string, endDate: string, excludeWeekends?: boolean): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    if (!excludeWeekends || (current.getDay() !== 0 && current.getDay() !== 6)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function getDaysExcludingSundays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    if (current.getDay() !== 0) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function hasOverlappingLeave(
  existingRequests: { startDate: string; endDate: string; status: string }[],
  newStart: string,
  newEnd: string,
  excludeId?: string
): boolean {
  const newS = new Date(newStart).getTime();
  const newE = new Date(newEnd).getTime();
  return existingRequests.some(r => {
    if (r.status === 'Cancelled' || r.status === 'Rejected') return false;
    if (excludeId && (r as any).id === excludeId) return false;
    const eS = new Date(r.startDate).getTime();
    const eE = new Date(r.endDate).getTime();
    return newS <= eE && newE >= eS;
  });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateISO(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

export function getMonthsBetween(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
}

export function getLearnershipProgress(startDate: string, expectedEndDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(expectedEndDate).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function calculateAttendancePercentage(attendance: { attendanceStatus: string }[]): number {
  if (attendance.length === 0) return 100;
  const present = attendance.filter(a => a.attendanceStatus === 'Present').length;
  return Math.round((present / attendance.length) * 100);
}

export function calculateAbsenteeismRate(attendance: { attendanceStatus: string }[]): number {
  if (attendance.length === 0) return 0;
  const absent = attendance.filter(a =>
    a.attendanceStatus === 'Absent' ||
    a.attendanceStatus === 'No Call No Show' ||
    a.attendanceStatus === 'Unauthorised Absence'
  ).length;
  return Math.round((absent / attendance.length) * 100);
}

export function getMonthsOptions(): string[] {
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
}

export function getYearOptions(): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => current - 2 + i);
}
