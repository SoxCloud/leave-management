import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { clsx, formatDate } from '../../services/utils';
import { AttendanceStatus } from '../../types';
import { AlertTriangle, Award, Clock, TrendingUp } from 'lucide-react';

const AbsenteeismReport: React.FC = () => {
  const { absenteeism, learners } = useApp();

  const topAbsentees = useMemo(() => {
    const counts: Record<string, { name: string; absences: number; late: number; total: number; score: number }> = {};
    absenteeism.forEach(a => {
      const key = a.learnerName;
      if (!counts[key]) {
        const learner = learners.find(l => l.fullName === a.learnerName);
        counts[key] = { name: learner?.fullName || a.learnerName, absences: 0, late: 0, total: 0, score: 100 };
      }
      counts[key].total++;
      if (a.attendanceStatus === AttendanceStatus.ABSENT || a.attendanceStatus === AttendanceStatus.NO_CALL_NO_SHOW) {
        counts[key].absences++;
      }
      if (a.attendanceStatus === AttendanceStatus.LATE) counts[key].late++;
    });

    return Object.entries(counts)
      .map(([, data]) => ({
        ...data,
        score: data.total > 0 ? Math.round(((data.total - data.absences - data.late * 0.5) / data.total) * 100) : 100,
      }))
      .sort((a, b) => a.score - b.score);
  }, [absenteeism, learners]);

  const mostPunctual = useMemo(() => {
    return [...topAbsentees].sort((a, b) => b.score - a.score).slice(0, 5);
  }, [topAbsentees]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-xs text-slate-500">Total Absences</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{absenteeism.filter(a => a.attendanceStatus === AttendanceStatus.ABSENT || a.attendanceStatus === AttendanceStatus.NO_CALL_NO_SHOW).length}</p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-400" />
            <span className="text-xs text-slate-500">Late Arrivals</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{absenteeism.filter(a => a.attendanceStatus === AttendanceStatus.LATE).length}</p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-emerald-400" />
            <span className="text-xs text-slate-500">Avg Attendance Score</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {topAbsentees.length > 0 ? Math.round(topAbsentees.reduce((s, a) => s + a.score, 0) / topAbsentees.length) : 100}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-400" />
            <span className="text-xs text-slate-500">Unauthorised Rate</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {absenteeism.length > 0
              ? Math.round((absenteeism.filter(a => !a.authorised && a.attendanceStatus !== AttendanceStatus.PRESENT).length / absenteeism.length) * 100)
              : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Absentees */}
        <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top 10 Highest Absentees</h3>
          <div className="space-y-2">
            {topAbsentees.slice(0, 10).map((learner, i) => (
              <div key={learner.name} className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/30 rounded-lg">
                <span className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  i < 3 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-400'
                )}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{learner.name}</p>
                  <p className="text-xs text-slate-500">{learner.absences} absences · {learner.late} late</p>
                </div>
                <div className="text-right">
                  <p className={clsx('text-sm font-bold', learner.score < 70 ? 'text-red-400' : learner.score < 85 ? 'text-amber-400' : 'text-emerald-400')}>
                    {learner.score}%
                  </p>
                  <p className="text-[10px] text-slate-500">Score</p>
                </div>
              </div>
            ))}
            {topAbsentees.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No attendance data available</p>}
          </div>
        </div>

        {/* Most Punctual */}
        <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Most Punctual Learners</h3>
          <div className="space-y-2">
            {mostPunctual.map((learner, i) => (
              <div key={learner.name} className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Award size={14} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{learner.name}</p>
                  <p className="text-xs text-slate-500">{learner.absences} absences · {learner.late} late</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{learner.score}%</p>
                  <p className="text-[10px] text-slate-500">Score</p>
                </div>
              </div>
            ))}
            {mostPunctual.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No attendance data available</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsenteeismReport;
