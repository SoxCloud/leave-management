import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { clsx, formatDate } from '../../services/utils';
import { LeaveStatus, LeaveType, AttendanceStatus } from '../../types';
import { calculateAccruedDays, calculateLeaveBalance } from '../../services/leaveCalculations';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Award, Users, Target,
  BarChart3, Activity, Percent
} from 'lucide-react';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AnalyticsDashboard: React.FC = () => {
  const { learners, leaveRequests, absenteeism } = useApp();

  const analytics = useMemo(() => {
    const totalLearners = learners.length;
    const totalLeaveDays = leaveRequests.filter(lr => lr.status === LeaveStatus.APPROVED).reduce((s, lr) => s + lr.daysRequested, 0);
    const avgLeavePerLearner = totalLearners > 0 ? (totalLeaveDays / totalLearners) : 0;
    const totalAttendance = absenteeism.length;
    const presentCount = absenteeism.filter(a => a.attendanceStatus === AttendanceStatus.PRESENT).length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;
    const leaveUtilization = totalLearners > 0
      ? Math.round((totalLeaveDays / (totalLearners * 18)) * 100)
      : 0;

    const deptRankings = learners.reduce((acc, l) => {
      if (!acc[l.department]) acc[l.department] = { learners: 0, leave: 0, absences: 0 };
      acc[l.department].learners++;
      return acc;
    }, {} as Record<string, { learners: number; leave: number; absences: number }>);

    leaveRequests.filter(lr => lr.status === LeaveStatus.APPROVED).forEach(lr => {
      const learner = learners.find(l => l.fullName === lr.learnerName);
      if (learner && deptRankings[learner.department]) deptRankings[learner.department].leave += lr.daysRequested;
    });

    absenteeism.forEach(a => {
      const learner = learners.find(l => l.fullName === a.learnerName);
      if (learner && deptRankings[learner.department] && a.attendanceStatus !== AttendanceStatus.PRESENT) {
        deptRankings[learner.department].absences++;
      }
    });

    const mostLeave = [...learners]
      .map(l => ({
        name: l.fullName,
        dept: l.department,
        taken: leaveRequests.filter(lr => lr.learnerName === l.fullName && lr.status === LeaveStatus.APPROVED)
          .reduce((s, lr) => s + lr.daysRequested, 0)
      }))
      .sort((a, b) => b.taken - a.taken)
      .slice(0, 5);

    const leastLeave = [...mostLeave].sort((a, b) => a.taken - b.taken).slice(0, 5);

    return { totalLeaveDays, avgLeavePerLearner, attendanceRate, leaveUtilization, deptRankings, mostLeave, leastLeave };
  }, [learners, leaveRequests, absenteeism]);

  const deptChartData = useMemo(() => {
    return Object.entries(analytics.deptRankings).map(([name, data]) => ({
      name, learners: data.learners, leave: data.leave, absences: data.absences
    }));
  }, [analytics.deptRankings]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Leave Utilization</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.leaveUtilization}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Percent size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Attendance Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.attendanceRate}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Avg Leave / Learner</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.avgLeavePerLearner.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total Leave Days</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalLeaveDays}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Rankings */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Department Rankings</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="learners" fill="#6366f1" radius={[4, 4, 0, 0]} name="Learners" />
              <Bar dataKey="leave" fill="#10b981" radius={[4, 4, 0, 0]} name="Leave Days" />
              <Bar dataKey="absences" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absences" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most vs Least Leave */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Most Leave Taken</h3>
          <div className="space-y-0">
            {analytics.mostLeave.map((l, i) => (
              <div key={l.name} className={clsx('flex items-center gap-3 px-3 py-2 border-b border-gray-100 dark:border-gray-800', learners.find(ln => ln.fullName === l.name)?.status !== 'Active' && 'opacity-50')}>
                <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{l.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{l.dept}</p>
                </div>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{l.taken}d</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 mt-6">Least Leave Taken</h3>
          <div className="space-y-0">
            {analytics.leastLeave.map((l, i) => (
              <div key={l.name} className={clsx('flex items-center gap-3 px-3 py-2 border-b border-gray-100 dark:border-gray-800', learners.find(ln => ln.fullName === l.name)?.status !== 'Active' && 'opacity-50')}>
                <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{l.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{l.dept}</p>
                </div>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">{l.taken}d</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
