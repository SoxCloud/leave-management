import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, Clock, CalendarCheck, CalendarDays, Wallet,
  AlertTriangle, Ban, CheckCircle, Timer, BarChart3, Activity, Filter, UserX
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatsCard from '../common/StatsCard';
import LoadingSkeleton from '../common/LoadingSkeleton';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { clsx, formatDate } from '../../services/utils';
import { fetchAttendanceRangeStats } from '../../services/googleSheets';
import { AttendanceRangeStats } from '../../types';
import ReportGenerator from '../reports/ReportGenerator';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
const PIE_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-gray-900 dark:text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const ExecutiveDashboard: React.FC = () => {
  const { dashboardStats, chartData, departmentData, loading } = useApp();
  const [rangeStart, setRangeStart] = useState(() => new Date().toISOString().split('T')[0]);
  const [rangeEnd, setRangeEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [rangeStats, setRangeStats] = useState<AttendanceRangeStats | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);

  const loadRangeStats = useCallback(async (start: string, end: string) => {
    setRangeLoading(true);
    try {
      setRangeStats(await fetchAttendanceRangeStats(start, end));
    } catch {
      setRangeStats(null);
    } finally {
      setRangeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRangeStats(rangeStart, rangeEnd);
  }, [loadRangeStats, rangeStart, rangeEnd]);

  const leaveTypeData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const totals = chartData.reduce((acc, curr) => ({
      annual: acc.annual + curr.annual,
      sick: acc.sick + curr.sick,
      familyResponsibility: acc.familyResponsibility + curr.familyResponsibility,
      unpaid: acc.unpaid + (curr.unpaid || 0),
    }), { annual: 0, sick: 0, familyResponsibility: 0, unpaid: 0 });
    return [
      { name: 'Annual', value: totals.annual },
      { name: 'Sick', value: totals.sick },
      { name: 'Family Resp.', value: totals.familyResponsibility },
      { name: 'Unpaid', value: totals.unpaid },
    ];
  }, [chartData]);

  const departmentChartData = useMemo(() => {
    return departmentData.map(d => ({
      name: d.department,
      learners: d.learners,
      absences: d.absenteeism,
      leaveUsed: d.leaveUsed,
    }));
  }, [departmentData]);

  if (loading || !dashboardStats) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={12} />
      </div>
    );
  }

  const stats = dashboardStats;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Learners" value={stats.totalLearners} icon={<Users size={16} />} subtitle="All registered learners" />
        <StatsCard title="Active Learners" value={stats.activeLearners} icon={<UserCheck size={16} />} accent="positive" subtitle="Currently active" />
        <StatsCard title="Pending Requests" value={stats.pendingLeaveRequests} icon={<Clock size={16} />} accent={stats.pendingLeaveRequests > 0 ? 'negative' : 'positive'} subtitle="Awaiting approval" />
        <StatsCard title="Approved Today" value={stats.approvedLeaveToday} icon={<CalendarCheck size={16} />} accent={stats.approvedLeaveToday > 0 ? 'positive' : 'default'} subtitle="Leave approved today" />
        <StatsCard title="Annual Leave Used" value={stats.annualLeaveDaysUsed} icon={<CalendarDays size={16} />} subtitle="Total days taken" />
        <StatsCard title="Current Balance" value={stats.currentLeaveBalance} icon={<Wallet size={16} />} subtitle="Total leave balance" />
        <StatsCard title="Absenteeism Rate" value={`${stats.absenteeismRate}%`} icon={<Activity size={16} />} accent={stats.absenteeismRate > 5 ? 'negative' : 'positive'} subtitle="Unauthorised absences" />
        <StatsCard title="Avg Leave Balance" value={stats.averageLeaveBalance} icon={<BarChart3 size={16} />} subtitle="Per learner" />
        <StatsCard title="Unauthorised" value={stats.unauthorisedAbsences} icon={<Ban size={16} />} accent="negative" subtitle="No call no show / absent" />
        <StatsCard title="Authorised" value={stats.authorisedAbsences} icon={<CheckCircle size={16} />} accent="positive" subtitle="Approved absences" />
        <StatsCard title="Late Arrivals" value={stats.lateArrivals} icon={<Timer size={16} />} accent={stats.lateArrivals > 0 ? 'negative' : 'positive'} subtitle="Total late arrivals" />
        <StatsCard title="Today's Attendance" value={`${stats.todayAttendance.present}/${stats.todayAttendance.total}`} icon={<Activity size={16} />} accent={stats.todayAttendance.present / stats.todayAttendance.total >= 0.8 ? 'positive' : 'negative'} subtitle="Present today" />
      </div>

      {/* Attendance Overview — date range filterable */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Attendance Overview</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Present, late, absent and on-leave counts for a selected date range</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Filter size={14} />
              <span>From</span>
              <input
                type="date"
                value={rangeStart}
                max={rangeEnd}
                onChange={e => setRangeStart(e.target.value)}
                className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-white"
              />
              <span>To</span>
              <input
                type="date"
                value={rangeEnd}
                min={rangeStart}
                onChange={e => setRangeEnd(e.target.value)}
                className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {rangeLoading ? (
          <LoadingSkeleton type="card" count={6} />
        ) : rangeStats && rangeStats.daily.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Average Attendance</p>
                <p className={clsx('text-2xl font-bold', rangeStats.averageAttendance >= 80 ? 'text-gray-900 dark:text-white' : 'text-amber-600 dark:text-amber-400')}>{rangeStats.averageAttendance}%</p>
                <p className="text-[10px] text-gray-400 mt-1">{formatDate(rangeStats.startDate)} → {formatDate(rangeStats.endDate)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Attendance Days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{rangeStats.presentDays}<span className="text-sm font-normal text-gray-400"> / {rangeStats.totalDays}</span></p>
                <p className="text-[10px] text-gray-400 mt-1">{rangeStats.days} day{rangeStats.days !== 1 ? 's' : ''} with data</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Late</p>
                <p className="text-2xl font-bold text-[#F59E0B]">{rangeStats.lateDays}</p>
                <p className="text-[10px] text-gray-400 mt-1">Included in attendance</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Absent</p>
                <p className="text-2xl font-bold text-[#EF4444]">{rangeStats.absentDays}</p>
                <p className="text-[10px] text-gray-400 mt-1">Absent / no-call-no-show</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">On Leave</p>
                <p className="text-2xl font-bold text-[#8B5CF6]">{rangeStats.leaveDays}</p>
                <p className="text-[10px] text-gray-400 mt-1">Approved leave</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Daily Attendance</h4>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={rangeStats.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 10 }} tickFormatter={(d: string) => formatDate(d)} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="present" stroke="#10b981" fill="#10b981" fillOpacity={0.12} strokeWidth={2} name="Present" />
                  <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} name="Late" />
                  <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} name="Absent" />
                  <Area type="monotone" dataKey="leave" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} name="On Leave" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <UserX size={28} className="text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No attendance data in the selected range.</p>
          </div>
        )}
      </div>

      {/* Reports Section */}
      <ReportGenerator />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Leave Trends */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Monthly Leave Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="annual" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Annual" />
              <Line type="monotone" dataKey="sick" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Sick" />
              <Line type="monotone" dataKey="familyResponsibility" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Family Resp." />
              <Line type="monotone" dataKey="unpaid" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} name="Unpaid" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Type Distribution */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Leave Type Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={leaveTypeData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {leaveTypeData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Comparison */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Department Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={departmentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="learners" fill="#6366f1" radius={[4, 4, 0, 0]} name="Learners" />
              <Bar dataKey="absences" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absences" />
              <Bar dataKey="leaveUsed" fill="#10b981" radius={[4, 4, 0, 0]} name="Leave Used" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Absenteeism Trend */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Absenteeism Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} name="Total Leave" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
