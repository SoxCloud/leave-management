import {
  Learner, LeaveRequest, LeaveBalance, AbsenteeismRecord,
  AppUser, AuditLog, DashboardStats, ChartData, DepartmentData,
  LeaveStatus, LeaveType, AttendanceStatus, UserRole, CompanySettings
} from '../types';
import { calculateAccruedDays, calculateLeaveBalance } from './leaveCalculations';

function generateId(): string {
  return 'LMS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

const SHEET_ID = '1YyRlBlsuUmYsOMYaWZnYnkFtb8yE9uwySMTGkvESEVw';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzg-eELgtZ2iayEgbQjLJlms54Kv0tuBKbhJwHBdP2DQGsM3xFKLERjiHaK6i577tT/exec';
const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

const SHEETS = {
  LEARNERS: 'Learners',
  LEAVE_REQUESTS: 'LeaveRequests',
  LEAVE_BALANCES: 'LeaveBalances',
  ABSENTEEISM: 'Absenteeism',
  USERS: 'Users',
  AUDIT_LOG: 'AuditLog',
  SETTINGS: 'Settings',
};

async function fetchCSV(tabName: string): Promise<string[][]> {
  const url = `${BASE_URL}&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!text || text.startsWith('<!')) {
    console.warn(`Sheet "${tabName}" not published or inaccessible. Publish your sheet: File > Share > Publish to web > Entire document > Publish`);
    return [];
  }
  return text.trim().split(/\r?\n/).map(row =>
    row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/"/g, '').trim())
  );
}

async function postToSheet(tabName: string, data: string[][]): Promise<boolean> {
  try {
    const payload = { action: 'addRow', sheet: tabName, row: data[0] };
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    const result = JSON.parse(text);
    console.log(`Posted to ${tabName}:`, result);
    return result.success === true;
  } catch (err) {
    console.error(`Error posting to ${tabName}:`, err);
    return false;
  }
}

async function postAction(action: string, data: Record<string, unknown>): Promise<{ success: boolean; [key: string]: unknown }> {
  try {
    const payload = { action, ...data };
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    const result = JSON.parse(text);
    console.log(`Action "${action}":`, result);
    return result;
  } catch (err) {
    console.error(`Error executing action "${action}":`, err);
    return { success: false, error: String(err) };
  }
}

function colIndex(headers: string[], ...names: string[]): number {
  const h = headers.map(h => h.toLowerCase().replace(/\s+/g, ''));
  for (const name of names) {
    const idx = h.indexOf(name.toLowerCase().replace(/\s+/g, ''));
    if (idx !== -1) return idx;
  }
  return 0;
}

function parseCSVToLearners(rows: string[][]): Learner[] {
  if (rows.length < 2) return [];
  const h = rows[0].map(r => r.toLowerCase().replace(/\s+/g, ''));
  return rows.slice(1).filter(r => r[0]).map(row => ({
    fullName: row[colIndex(rows[0], 'Full Name', 'Name')] || '',
    department: row[colIndex(rows[0], 'Department')] || '',
    campaign: row[colIndex(rows[0], 'Campaign')] || '',
    site: row[colIndex(rows[0], 'Site')] || '',
    supervisor: row[colIndex(rows[0], 'Supervisor')] || '',
    manager: row[colIndex(rows[0], 'Manager')] || '',
    startDate: row[colIndex(rows[0], 'Start Date')] || '',
    expectedEndDate: row[colIndex(rows[0], 'Expected End Date')] || '',
    status: row[colIndex(rows[0], 'Status')] || 'Active',
    phone: row[colIndex(rows[0], 'Phone')] || '',
    email: row[colIndex(rows[0], 'Email')] || '',
  }));
}

function parseCSVToLeaveRequests(rows: string[][]): LeaveRequest[] {
  if (rows.length < 2) return [];
  return rows.slice(1).filter(r => r[0] && r[0] !== 'Request ID').map(row => ({
    id: row[colIndex(rows[0], 'Request ID')] || generateId(),
    learnerName: row[colIndex(rows[0], 'Learner Name', 'Learner', 'Name')] || '',
    leaveType: row[colIndex(rows[0], 'Leave Type')] as LeaveType || LeaveType.ANNUAL,
    startDate: row[colIndex(rows[0], 'Start Date')] || '',
    endDate: row[colIndex(rows[0], 'End Date')] || '',
    daysRequested: parseFloat(row[colIndex(rows[0], 'Days Requested')]) || 0,
    reason: row[colIndex(rows[0], 'Reason')] || '',
    medicalCertificate: row[colIndex(rows[0], 'Medical Certificate')]?.toLowerCase() === 'yes',
    documentLink: row[colIndex(rows[0], 'Document Link')] || '',
    approvedBy: row[colIndex(rows[0], 'Approved By')] || '',
    approvalDate: row[colIndex(rows[0], 'Approval Date')] || '',
    status: row[colIndex(rows[0], 'Status')] as LeaveStatus || LeaveStatus.PENDING,
    comments: row[colIndex(rows[0], 'Comments')] || '',
  }));
}

function parseCSVToLeaveBalances(rows: string[][]): LeaveBalance[] {
  if (rows.length < 2) return [];
  return rows.slice(1).filter(r => r[0]).map(row => ({
    learnerName: row[colIndex(rows[0], 'Learner Name', 'Learner', 'Name')] || '',
    daysAccrued: parseFloat(row[colIndex(rows[0], 'Days Accrued')]) || 0,
    annualLeaveTaken: parseFloat(row[colIndex(rows[0], 'Annual Leave Taken')]) || 0,
    annualBalance: parseFloat(row[colIndex(rows[0], 'Annual Balance')]) || 0,
    sickLeaveUsed: parseFloat(row[colIndex(rows[0], 'Sick Leave Used')]) || 0,
    familyResponsibilityUsed: parseFloat(row[colIndex(rows[0], 'Family Responsibility Used')]) || 0,
    lastUpdated: row[colIndex(rows[0], 'Last Updated')] || '',
  }));
}

function parseCSVToAbsenteeism(rows: string[][]): AbsenteeismRecord[] {
  if (rows.length < 2) return [];
  return rows.slice(1).filter(r => r[0]).map(row => ({
    id: row[colIndex(rows[0], 'Date')] + '-' + row[colIndex(rows[0], 'Learner Name', 'Learner', 'Name')] || '',
    date: row[colIndex(rows[0], 'Date')] || '',
    learnerName: row[colIndex(rows[0], 'Learner Name', 'Learner', 'Name')] || '',
    attendanceStatus: row[colIndex(rows[0], 'Attendance Status')] as AttendanceStatus || AttendanceStatus.PRESENT,
    authorised: row[colIndex(rows[0], 'Authorised')]?.toLowerCase() === 'yes',
    reason: row[colIndex(rows[0], 'Reason')] || '',
    capturedBy: row[colIndex(rows[0], 'Captured By')] || '',
    supervisor: row[colIndex(rows[0], 'Supervisor')] || '',
    manager: row[colIndex(rows[0], 'Manager')] || '',
    comments: row[colIndex(rows[0], 'Comments')] || '',
  }));
}

export const LearnersService = {
  async getAll(): Promise<Learner[]> {
    try { return parseCSVToLearners(await fetchCSV(SHEETS.LEARNERS)); }
    catch { return []; }
  },

  async getByName(name: string): Promise<Learner | null> {
    const learners = await this.getAll();
    return learners.find(l => l.fullName.toLowerCase() === name.toLowerCase()) || null;
  },

  async create(learner: Learner): Promise<Learner | null> {
    const result = await postAction('addLearner', learner as unknown as Record<string, unknown>);
    return result.success ? learner : null;
  },

  async updateStatus(fullName: string, status: string): Promise<boolean> {
    const result = await postAction('updateRow', { sheet: 'Learners', idColumn: 0, id: fullName, column: 8, value: status });
    return result.success === true;
  },
};

export const LeaveRequestsService = {
  async getAll(): Promise<LeaveRequest[]> {
    try { return parseCSVToLeaveRequests(await fetchCSV(SHEETS.LEAVE_REQUESTS)); }
    catch { return []; }
  },

  async getByLearnerName(name: string): Promise<LeaveRequest[]> {
    const all = await this.getAll();
    return all.filter(lr => lr.learnerName.toLowerCase() === name.toLowerCase());
  },

  async create(request: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest | null> {
    const newRequest: LeaveRequest = { ...request, id: generateId() };
    const result = await postAction('addLeaveRequest', newRequest as unknown as Record<string, unknown>);
    return result.success ? newRequest : null;
  },

  async approve(id: string, approvedBy: string): Promise<boolean> {
    const result = await postAction('approveLeave', { id, approvedBy });
    return result.success === true;
  },

  async reject(id: string, comments?: string): Promise<boolean> {
    const result = await postAction('rejectLeave', { id, comments: comments || '' });
    return result.success === true;
  },

  async updateDays(id: string, days: number): Promise<boolean> {
    const result = await postAction('updateRow', { sheet: 'LeaveRequests', idColumn: 0, id, column: 5, value: String(days) });
    return result.success === true;
  },
};

export const LeaveBalancesService = {
  async getAll(): Promise<LeaveBalance[]> {
    try { return parseCSVToLeaveBalances(await fetchCSV(SHEETS.LEAVE_BALANCES)); }
    catch { return []; }
  },

  async getByLearnerName(name: string): Promise<LeaveBalance | null> {
    const all = await this.getAll();
    return all.find(lb => lb.learnerName.toLowerCase() === name.toLowerCase()) || null;
  },

  async recalculateAll(learners: Learner[], leaveRequests: LeaveRequest[]): Promise<LeaveBalance[]> {
    return learners.map(learner => {
      const learnerLeaves = leaveRequests.filter(lr => lr.learnerName === learner.fullName);
      const annualTaken = learnerLeaves
        .filter(lr => lr.leaveType === LeaveType.ANNUAL && lr.status === LeaveStatus.APPROVED)
        .reduce((sum, lr) => sum + lr.daysRequested, 0);
      return {
        learnerName: learner.fullName,
        daysAccrued: calculateAccruedDays(learner.startDate, learner.expectedEndDate),
        annualLeaveTaken: annualTaken,
        annualBalance: calculateLeaveBalance(learner.startDate, annualTaken, learner.expectedEndDate),
        sickLeaveUsed: learnerLeaves
          .filter(lr => lr.leaveType === LeaveType.SICK && lr.status === LeaveStatus.APPROVED)
          .reduce((sum, lr) => sum + lr.daysRequested, 0),
        familyResponsibilityUsed: learnerLeaves
          .filter(lr => lr.leaveType === LeaveType.FAMILY_RESPONSIBILITY && lr.status === LeaveStatus.APPROVED)
          .reduce((sum, lr) => sum + lr.daysRequested, 0),
        lastUpdated: new Date().toISOString(),
      };
    });
  },
};

export const AbsenteeismService = {
  async getAll(): Promise<AbsenteeismRecord[]> {
    try { return parseCSVToAbsenteeism(await fetchCSV(SHEETS.ABSENTEEISM)); }
    catch { return []; }
  },

  async getByLearnerName(name: string): Promise<AbsenteeismRecord[]> {
    const all = await this.getAll();
    return all.filter(a => a.learnerName.toLowerCase() === name.toLowerCase());
  },

  async create(record: Omit<AbsenteeismRecord, 'id'>): Promise<AbsenteeismRecord | null> {
    const newRecord: AbsenteeismRecord = { ...record, id: generateId() };
    const result = await postAction('captureAttendance', newRecord as unknown as Record<string, unknown>);
    return result.success ? newRecord : null;
  },

  async bulkCreate(records: Omit<AbsenteeismRecord, 'id'>[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    for (const record of records) {
      const result = await this.create(record);
      if (result) success++;
      else failed++;
    }
    return { success, failed };
  },
};

export const UsersService = {
  async getAll(): Promise<AppUser[]> {
    try {
      const rows = await fetchCSV(SHEETS.USERS);
      if (rows.length < 2) return [];
      return rows.slice(1).filter(r => r[0]).map(row => ({
        id: row[colIndex(rows[0], 'ID')] || '',
        email: row[colIndex(rows[0], 'Email')] || '',
        name: row[colIndex(rows[0], 'Name')] || '',
        role: row[colIndex(rows[0], 'Role')] as UserRole || UserRole.VIEWER,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(row[colIndex(rows[0], 'Name')] || '')}&background=random`,
        department: row[colIndex(rows[0], 'Department')] || undefined,
      }));
    } catch { return []; }
  },
};

export const AuditService = {
  async log(entry: Omit<AuditLog, 'id'>): Promise<void> {
    const log: AuditLog = { ...entry, id: generateId() };
    await postToSheet(SHEETS.AUDIT_LOG, [[log.id, log.user, log.date, log.time, log.action, log.oldValue, log.newValue, log.ip]]);
  },
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [learners, leaveRequests, absenteeism] = await Promise.all([
    LearnersService.getAll(), LeaveRequestsService.getAll(), AbsenteeismService.getAll(),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const annualLeaveDays = leaveRequests
    .filter(lr => lr.leaveType === LeaveType.ANNUAL && lr.status === LeaveStatus.APPROVED)
    .reduce((sum, lr) => sum + lr.daysRequested, 0);
  const totalAbsences = absenteeism.filter(a => a.attendanceStatus !== AttendanceStatus.PRESENT).length;
  const unauthorised = absenteeism.filter(a => !a.authorised && a.attendanceStatus !== AttendanceStatus.PRESENT).length;
  const todayAttendance = absenteeism.filter(a => a.date === today);

  const balances = learners.map(learner => {
    const learnerLeaves = leaveRequests.filter(lr => lr.learnerName === learner.fullName);
    const annualTaken = learnerLeaves
      .filter(lr => lr.leaveType === LeaveType.ANNUAL && lr.status === LeaveStatus.APPROVED)
      .reduce((sum, lr) => sum + lr.daysRequested, 0);
    return calculateLeaveBalance(learner.startDate, annualTaken, learner.expectedEndDate);
  });
  const totalBalance = balances.reduce((sum, b) => sum + b, 0);

  return {
    totalLearners: learners.length,
    activeLearners: learners.filter(l => l.status === 'Active').length,
    pendingLeaveRequests: leaveRequests.filter(lr => lr.status === LeaveStatus.PENDING).length,
    approvedLeaveToday: leaveRequests.filter(lr => lr.status === LeaveStatus.APPROVED && lr.startDate === today).length,
    annualLeaveDaysUsed: annualLeaveDays,
    currentLeaveBalance: totalBalance,
    absenteeismRate: totalAbsences > 0 ? Math.round((unauthorised / totalAbsences) * 100) : 0,
    unauthorisedAbsences: unauthorised,
    authorisedAbsences: absenteeism.filter(a => a.authorised).length,
    lateArrivals: absenteeism.filter(a => a.attendanceStatus === AttendanceStatus.LATE).length,
    averageLeaveBalance: learners.length > 0 ? Math.round((totalBalance / learners.length) * 10) / 10 : 0,
    todayAttendance: {
      present: todayAttendance.filter(a => a.attendanceStatus === AttendanceStatus.PRESENT).length,
      absent: todayAttendance.filter(a => a.attendanceStatus === AttendanceStatus.ABSENT || a.attendanceStatus === AttendanceStatus.NO_CALL_NO_SHOW).length,
      late: todayAttendance.filter(a => a.attendanceStatus === AttendanceStatus.LATE).length,
      total: todayAttendance.length,
    },
  };
}

export async function fetchChartData(): Promise<ChartData[]> {
  const leaveRequests = await LeaveRequestsService.getAll();
  const months: Record<string, ChartData> = {};
  leaveRequests.filter(lr => lr.status === LeaveStatus.APPROVED).forEach(lr => {
    const date = new Date(lr.startDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!months[key]) months[key] = { month: label, annual: 0, sick: 0, familyResponsibility: 0, unpaid: 0, total: 0 };
    if (lr.leaveType === LeaveType.ANNUAL) months[key].annual += lr.daysRequested;
    else if (lr.leaveType === LeaveType.SICK) months[key].sick += lr.daysRequested;
    else if (lr.leaveType === LeaveType.FAMILY_RESPONSIBILITY) months[key].familyResponsibility += lr.daysRequested;
    else if (lr.leaveType === LeaveType.UNPAID) months[key].unpaid += lr.daysRequested;
    months[key].total += lr.daysRequested;
  });
  return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

export async function fetchDepartmentData(): Promise<DepartmentData[]> {
  const [learners, leaveRequests, absenteeism] = await Promise.all([
    LearnersService.getAll(), LeaveRequestsService.getAll(), AbsenteeismService.getAll(),
  ]);

  const deptMap: Record<string, { learners: Set<string>; leaveUsed: number; absences: number }> = {};
  learners.forEach(l => {
    if (!deptMap[l.department]) deptMap[l.department] = { learners: new Set(), leaveUsed: 0, absences: 0 };
    deptMap[l.department].learners.add(l.fullName);
  });
  leaveRequests.filter(lr => lr.status === LeaveStatus.APPROVED).forEach(lr => {
    const learner = learners.find(l => l.fullName === lr.learnerName);
    if (learner && deptMap[learner.department]) deptMap[learner.department].leaveUsed += lr.daysRequested;
  });
  absenteeism.filter(a => a.attendanceStatus !== AttendanceStatus.PRESENT).forEach(a => {
    const learner = learners.find(l => l.fullName === a.learnerName);
    if (learner && deptMap[learner.department]) deptMap[learner.department].absences++;
  });

  return Object.entries(deptMap).map(([department, data]) => ({
    department, learners: data.learners.size, leaveUsed: data.leaveUsed,
    absenteeism: data.absences, avgBalance: 0,
  }));
}
