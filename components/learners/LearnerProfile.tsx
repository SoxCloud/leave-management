import React, { useMemo } from 'react';
import {
  ArrowLeft, Calendar, Clock, Activity, Award, FileText,
  CheckCircle, XCircle, AlertTriangle, Users, UserX,
  Ban, PhoneOff, UserCheck, Sunset
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Badge from '../common/Badge';
import LoadingSkeleton from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';
import {
  clsx, formatDate, getInitials, getStatusColor
} from '../../services/utils';
import {
  calculateAccruedDays, calculateLeaveBalance, calculateAttendancePercentage,
  getLearnershipProgress, getDaysBetween
} from '../../services/leaveCalculations';
import { Learner, LeaveRequest, LeaveStatus, LeaveType, AttendanceStatus } from '../../types';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';

interface LearnerProfileProps {
  learnerName: string;
  onBack: () => void;
}

const LearnerProfile: React.FC<LearnerProfileProps> = ({ learnerName, onBack }) => {
  const { learners, leaveRequests, absenteeism, loading } = useApp();

  const learner = useMemo(() => learners.find(l => l.fullName === learnerName), [learners, learnerName]);
  const learnerLeaves = useMemo(() => leaveRequests.filter(lr => lr.learnerName === learnerName), [leaveRequests, learnerName]);
  const learnerAttendance = useMemo(() => absenteeism.filter(a => a.learnerName === learnerName), [absenteeism, learnerName]);

  if (loading) return <LoadingSkeleton type="profile" />;
  if (!learner) {
    return <EmptyState title="Learner not found" description="The requested learner could not be found." action={<button onClick={onBack} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">Go Back</button>} />;
  }

  const accrued = calculateAccruedDays(learner.startDate, learner.expectedEndDate);
  const annualTaken = learnerLeaves
    .filter(lr => lr.leaveType === LeaveType.ANNUAL && lr.status === LeaveStatus.APPROVED)
    .reduce((sum, lr) => sum + lr.daysRequested, 0);
  const balance = calculateLeaveBalance(learner.startDate, annualTaken, learner.expectedEndDate);
  const attendancePct = calculateAttendancePercentage(learnerAttendance);
  const progress = getLearnershipProgress(learner.startDate, learner.expectedEndDate);
  const pendingLeaves = learnerLeaves.filter(lr => lr.status === LeaveStatus.PENDING).length;

  const approvedLeaves = learnerLeaves.filter(lr => lr.status === LeaveStatus.APPROVED);
  const totalDaysTaken = annualTaken;
  const unpaidTaken = approvedLeaves.filter(lr => lr.leaveType === LeaveType.UNPAID).reduce((sum, lr) => sum + lr.daysRequested, 0);
  const sickTaken = approvedLeaves.filter(lr => lr.leaveType === LeaveType.SICK).reduce((sum, lr) => sum + lr.daysRequested, 0);
  const familyTaken = approvedLeaves.filter(lr => lr.leaveType === LeaveType.FAMILY_RESPONSIBILITY).reduce((sum, lr) => sum + lr.daysRequested, 0);

  const nonPresent = learnerAttendance.filter(a => a.attendanceStatus !== AttendanceStatus.PRESENT);
  const absenteeismRate = learnerAttendance.length > 0 ? Math.round((nonPresent.length / learnerAttendance.length) * 100) : 0;
  const unauthorised = nonPresent.filter(a => !a.authorised).length;
  const noCallNoShowAbsent = learnerAttendance.filter(a =>
    a.attendanceStatus === AttendanceStatus.NO_CALL_NO_SHOW || a.attendanceStatus === AttendanceStatus.ABSENT
  ).length;
  const authorised = nonPresent.filter(a => a.authorised).length;
  const lateArrivals = learnerAttendance.filter(a => a.attendanceStatus === AttendanceStatus.LATE).length;

  const leaveChartData = [
    { name: 'Accrued', days: accrued },
    { name: 'Taken', days: annualTaken },
    { name: 'Balance', days: balance },
  ];

  const timeline = [
    ...learnerAttendance.map(a => ({ date: a.date, type: 'attendance' as const, desc: a.attendanceStatus })),
    ...learnerLeaves.map(l => ({ date: l.startDate, type: 'leave' as const, desc: `${l.leaveType} - ${l.status}` })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
          {getInitials(learner.fullName)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{learner.fullName}</h2>
            <Badge label={learner.status} size="sm" />
          </div>
          <p className="text-sm text-slate-400">{learner.email} · {learner.department} · {learner.campaign}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { label: 'Annual Leave Accrued', value: accrued, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Total Days Taken', value: totalDaysTaken, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Current Balance', value: balance, icon: Award, color: balance >= 0 ? 'text-emerald-400' : 'text-red-400', bg: balance >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
          { label: 'Absenteeism Rate', value: `${absenteeismRate}%`, icon: Activity, color: absenteeismRate <= 10 ? 'text-emerald-400' : 'text-red-400', bg: absenteeismRate <= 10 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
          { label: 'Sick Leave Taken', value: sickTaken, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Family Resp. Taken', value: familyTaken, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Unpaid Leave Taken', value: unpaidTaken, icon: Ban, color: 'text-slate-400', bg: 'bg-slate-500/10' },
          { label: 'No Call / Absent', value: noCallNoShowAbsent, icon: PhoneOff, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Unauthorised', value: unauthorised, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Authorised', value: authorised, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Late Arrivals', value: lateArrivals, icon: Sunset, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Attendance Rate', value: `${attendancePct}%`, icon: CheckCircle, color: attendancePct >= 90 ? 'text-emerald-400' : 'text-amber-400', bg: attendancePct >= 90 ? 'bg-emerald-500/10' : 'bg-amber-500/10' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl ${stat.bg} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={14} className={stat.color} />
              <span className="text-xs text-slate-400">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Balance Chart */}
        <div className="rounded-2xl bg-slate-800/60 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Leave Balance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={leaveChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="days" radius={[6, 6, 0, 0]}>
                {leaveChartData.map((_, i) => (
                  <Cell key={i} fill={['#6366f1', '#f59e0b', '#10b981'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leave History */}
        <div className="rounded-2xl bg-slate-800/60 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Leave History</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {learnerLeaves.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No leave requests yet</p>
            ) : (
              learnerLeaves.slice(0, 10).map(lr => (
                <div key={lr.id} className="flex items-center justify-between px-3 py-2 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {lr.status === LeaveStatus.APPROVED ? <CheckCircle size={14} className="text-emerald-400" /> :
                     lr.status === LeaveStatus.REJECTED ? <XCircle size={14} className="text-red-400" /> :
                     <AlertTriangle size={14} className="text-amber-400" />}
                    <span className="text-sm text-slate-300">{lr.leaveType}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{formatDate(lr.startDate)}</span>
                    <Badge label={lr.status} size="sm" />
                    <span className="text-xs text-slate-400">{lr.daysRequested}d</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-slate-800/60 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Activity Timeline</h3>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {timeline.slice(0, 20).map((event, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <div className={clsx(
                'w-2 h-2 rounded-full',
                event.type === 'leave' ? 'bg-indigo-400' : 'bg-amber-400'
              )} />
              <span className="text-xs text-slate-500 w-24">{formatDate(event.date)}</span>
              <span className="text-sm text-slate-300 capitalize">{event.desc.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl bg-slate-800/60 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Learnership Progress</span>
          <span className="text-sm font-semibold text-white">{progress}%</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-slate-500">{formatDate(learner.startDate)}</span>
          <span className="text-xs text-slate-500">{formatDate(learner.expectedEndDate)}</span>
        </div>
      </div>
    </div>
  );
};

export default LearnerProfile;
