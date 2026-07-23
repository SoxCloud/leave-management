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

export function getSouthAfricanHolidays(year: number): Date[] {
  const holidays: Date[] = [
    new Date(year, 0, 1),    // New Year's Day
    new Date(year, 2, 21),   // Human Rights Day
    new Date(year, 3, 27),   // Freedom Day
    new Date(year, 4, 1),    // Workers' Day
    new Date(year, 5, 16),   // Youth Day
    new Date(year, 7, 9),    // National Women's Day
    new Date(year, 8, 24),   // Heritage Day
    new Date(year, 11, 16),  // Day of Reconciliation
    new Date(year, 11, 25),  // Christmas Day
    new Date(year, 11, 26),  // Day of Goodwill
  ];

  const easter = getEasterDate(year);
  holidays.push(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2)); // Good Friday
  holidays.push(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1)); // Family Day (Easter Monday)

  return holidays;
}

export function isPublicHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getSouthAfricanHolidays(year);
  return holidays.some(h =>
    h.getFullYear() === date.getFullYear() &&
    h.getMonth() === date.getMonth() &&
    h.getDate() === date.getDate()
  );
}

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    if (current.getDay() !== 0 && !isPublicHoliday(current)) count++;
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
