import React, { useMemo, useState } from 'react';
import {
  Users, UserCheck, Clock, CalendarCheck, CalendarDays, Wallet,
  AlertTriangle, Ban, CheckCircle, Timer, BarChart3, Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatsCard from '../common/StatsCard';
import LoadingSkeleton from '../common/LoadingSkeleton';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { clsx } from '../../services/utils';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
const PIE_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const ExecutiveDashboard: React.FC = () => {
  const { dashboardStats, chartData, departmentData, loading } = useApp();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  const leaveTypeData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const totals = chartData.reduce((acc, curr) => ({
      annual: acc.annual + curr.annual,
      sick: acc.sick + curr.sick,
      familyResponsibility: acc.familyResponsibility + curr.familyResponsibility,
    }), { annual: 0, sick: 0, familyResponsibility: 0 });
    return [
      { name: 'Annual', value: totals.annual },
      { name: 'Sick', value: totals.sick },
      { name: 'Family Resp.', value: totals.familyResponsibility },
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
      {/* Timeframe selector */}
      <div className="flex items-center gap-2">
        {(['7d', '30d', '90d'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              timeframe === t ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Learners" value={stats.totalLearners} icon={<Users size={20} />} color="indigo" subtitle="All registered learners" />
        <StatsCard title="Active Learners" value={stats.activeLearners} icon={<UserCheck size={20} />} color="emerald" subtitle="Currently active" />
        <StatsCard title="Pending Requests" value={stats.pendingLeaveRequests} icon={<Clock size={20} />} color="amber" subtitle="Awaiting approval" />
        <StatsCard title="Approved Today" value={stats.approvedLeaveToday} icon={<CalendarCheck size={20} />} color="blue" subtitle="Leave approved today" />
        <StatsCard title="Annual Leave Used" value={stats.annualLeaveDaysUsed} icon={<CalendarDays size={20} />} color="purple" subtitle="Total days taken" />
        <StatsCard title="Current Balance" value={stats.currentLeaveBalance} icon={<Wallet size={20} />} color="cyan" subtitle="Total leave balance" />
        <StatsCard title="Absenteeism Rate" value={`${stats.absenteeismRate}%`} icon={<Activity size={20} />} color="rose" subtitle="Unauthorised absences" />
        <StatsCard title="Avg Leave Balance" value={stats.averageLeaveBalance} icon={<BarChart3 size={20} />} color="indigo" subtitle="Per learner" />

        <StatsCard title="Unauthorised" value={stats.unauthorisedAbsences} icon={<Ban size={20} />} color="rose" subtitle="No call no show / absent" />
        <StatsCard title="Authorised" value={stats.authorisedAbsences} icon={<CheckCircle size={20} />} color="emerald" subtitle="Approved absences" />
        <StatsCard title="Late Arrivals" value={stats.lateArrivals} icon={<Timer size={20} />} color="amber" subtitle="Total late arrivals" />
        <StatsCard title="Today's Attendance" value={`${stats.todayAttendance.present}/${stats.todayAttendance.total}`} icon={<Activity size={20} />} color="blue" subtitle="Present today" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Leave Trends */}
        <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Leave Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="annual" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Annual" />
              <Line type="monotone" dataKey="sick" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Sick" />
              <Line type="monotone" dataKey="familyResponsibility" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Family Resp." />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Type Distribution */}
        <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Leave Type Distribution</h3>
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
        <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Department Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={departmentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="learners" fill="#6366f1" radius={[4, 4, 0, 0]} name="Learners" />
              <Bar dataKey="absences" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absences" />
              <Bar dataKey="leaveUsed" fill="#10b981" radius={[4, 4, 0, 0]} name="Leave Used" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Absenteeism Trend */}
        <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Absenteeism Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
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
