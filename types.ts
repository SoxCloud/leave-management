export enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  MANAGER = 'MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  VIEWER = 'VIEWER',
}

export enum LeaveType {
  ANNUAL = 'Annual',
  SICK = 'Sick',
  FAMILY_RESPONSIBILITY = 'Family Responsibility',
  UNPAID = 'Unpaid',
  LEAVE = 'Leave',
  OTHER = 'Other',
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late',
  HALF_DAY = 'Half Day',
  NO_CALL_NO_SHOW = 'No Call No Show',
  MEDICAL_LEAVE = 'Medical Leave',
  AUTHORISED_ABSENCE = 'Authorised Absence',
  UNAUTHORISED_ABSENCE = 'Unauthorised Absence',
}

export enum ApprovalType {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface Learner {
  fullName: string;
  department: string;
  campaign: string;
  site: string;
  supervisor: string;
  manager: string;
  startDate: string;
  expectedEndDate: string;
  status: string;
  phone: string;
  email: string;
}

export interface LeaveRequest {
  id: string;
  learnerName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  medicalCertificate: boolean;
  documentLink: string;
  approvedBy: string;
  approvalDate: string;
  status: LeaveStatus;
  comments: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  learnerName: string;
  daysAccrued: number;
  annualLeaveTaken: number;
  annualBalance: number;
  sickLeaveUsed: number;
  familyResponsibilityUsed: number;
  lastUpdated: string;
}

export interface AbsenteeismRecord {
  id: string;
  date: string;
  learnerName: string;
  attendanceStatus: AttendanceStatus;
  authorised: boolean;
  reason: string;
  capturedBy: string;
  supervisor: string;
  manager: string;
  comments: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  department?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  date: string;
  time: string;
  action: string;
  oldValue: string;
  newValue: string;
  ip: string;
}

export interface DashboardStats {
  totalLearners: number;
  activeLearners: number;
  pendingLeaveRequests: number;
  approvedLeaveToday: number;
  annualLeaveDaysUsed: number;
  currentLeaveBalance: number;
  absenteeismRate: number;
  unauthorisedAbsences: number;
  authorisedAbsences: number;
  lateArrivals: number;
  averageLeaveBalance: number;
  todayAttendance: { present: number; absent: number; late: number; total: number };
}

export interface ChartData {
  month: string;
  annual: number;
  sick: number;
  familyResponsibility: number;
  unpaid: number;
  total: number;
}

export interface DepartmentData {
  department: string;
  learners: number;
  leaveUsed: number;
  absenteeism: number;
  avgBalance: number;
}

export interface CompanySettings {
  companyName: string;
  logo: string;
  leaveAccrualRate: number;
  maxAnnualLeave: number;
  accrualInterval: number;
  requiresMedicalCertificateAfter: number;
  publicHolidays: string[];
  approvalWorkflow: string;
  branding: { primaryColor: string; secondaryColor: string; accentColor: string };
}

export interface LearnerProfile extends Learner {
  leaveBalance: LeaveBalance;
  attendancePercentage: number;
  absenceHistory: AbsenteeismRecord[];
  leaveHistory: LeaveRequest[];
  medicalCertificates: LeaveRequest[];
  timeline: TimelineEvent[];
  attendanceScore: number;
}

export interface TimelineEvent {
  date: string;
  type: 'leave' | 'attendance' | 'balance' | 'profile';
  description: string;
  status?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  authorised: number;
  unauthorised: number;
  medical: number;
  noCallNoShow: number;
  percentage: number;
}

export interface FilterState {
  search: string;
  learner: string;
  manager: string;
  supervisor: string;
  campaign: string;
  department: string;
  month: string;
  year: string;
  leaveType: string;
  attendanceStatus: string;
  status: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
