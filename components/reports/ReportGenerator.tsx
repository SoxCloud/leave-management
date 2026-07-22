import React, { useMemo, useRef } from 'react';
import { FileText, Download, Printer, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { clsx, formatDate } from '../../services/utils';
import { LeaveStatus, LeaveType, AttendanceStatus } from '../../types';
import { calculateAccruedDays, calculateLeaveBalance } from '../../services/leaveCalculations';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const ReportGenerator: React.FC = () => {
  const { learners, leaveRequests, absenteeism, filters, setFilters } = useApp();
  const reportRef = useRef<HTMLDivElement>(null);

  const reportTypes = ['Individual Leave Report', 'Monthly Leave Summary', 'Annual Leave Summary', 'Attendance Report', 'Absenteeism Report', 'Department Report'];

  const leaveSummary = useMemo(() => {
    const approved = leaveRequests.filter(lr => lr.status === LeaveStatus.APPROVED);
    return {
      total: approved.length,
      annual: approved.filter(lr => lr.leaveType === LeaveType.ANNUAL).reduce((s, lr) => s + lr.daysRequested, 0),
      sick: approved.filter(lr => lr.leaveType === LeaveType.SICK).reduce((s, lr) => s + lr.daysRequested, 0),
      family: approved.filter(lr => lr.leaveType === LeaveType.FAMILY_RESPONSIBILITY).reduce((s, lr) => s + lr.daysRequested, 0),
    };
  }, [leaveRequests]);

  const departmentReport = useMemo(() => {
    const map: Record<string, { learners: number; leave: number; absences: number }> = {};
    learners.forEach(l => {
      if (!map[l.department]) map[l.department] = { learners: 0, leave: 0, absences: 0 };
      map[l.department].learners++;
    });
    leaveRequests.filter(lr => lr.status === LeaveStatus.APPROVED).forEach(lr => {
      const learner = learners.find(l => l.fullName === lr.learnerName);
      if (learner && map[learner.department]) map[learner.department].leave += lr.daysRequested;
    });
    absenteeism.forEach(a => {
      const learner = learners.find(l => l.fullName === a.learnerName);
      if (learner && map[learner.department] && a.attendanceStatus !== AttendanceStatus.PRESENT) map[learner.department].absences++;
    });
    return Object.entries(map).map(([dept, data]) => ({ department: dept, ...data }));
  }, [learners, leaveRequests, absenteeism]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [['Learner', 'Department', 'Accrued', 'Taken', 'Balance', 'Attendance']];
    learners.forEach(l => {
      const taken = leaveRequests
        .filter(lr => lr.learnerName === l.fullName && lr.leaveType === LeaveType.ANNUAL && lr.status === LeaveStatus.APPROVED)
        .reduce((s, lr) => s + lr.daysRequested, 0);
      const accrued = calculateAccruedDays(l.startDate, l.expectedEndDate);
      const balance = calculateLeaveBalance(l.startDate, taken, l.expectedEndDate);
      const learnerRecords = absenteeism.filter(a => a.learnerName === l.fullName);
      const attPct = learnerRecords.length > 0
        ? Math.round((learnerRecords.filter(a => a.attendanceStatus === AttendanceStatus.PRESENT).length / learnerRecords.length) * 100)
        : 100;
      rows.push([l.fullName, l.department, `${accrued}`, `${taken}`, `${balance}`, `${attPct}%`]);
    });

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leave-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.search ? 'Individual Leave Report' : 'Monthly Leave Summary'}
          onChange={() => {}}
          className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300"
        >
          {reportTypes.map(r => <option key={r}>{r}</option>)}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-sm text-slate-300 transition-colors">
            <Printer size={16} />
            Print
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-sm text-slate-300 transition-colors">
            <FileSpreadsheet size={16} />
            CSV
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 space-y-6">
        {/* Header */}
        <div className="text-center pb-6 border-b border-slate-800/60">
          <h2 className="text-xl font-bold text-white">Leave Management Report</h2>
          <p className="text-sm text-slate-400">Generated on {new Date().toLocaleDateString('en-ZA')}</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Learners', value: learners.length },
            { label: 'Total Leave Days', value: leaveSummary.total },
            { label: 'Annual Leave', value: leaveSummary.annual },
            { label: 'Sick Leave', value: leaveSummary.sick },
          ].map(s => (
            <div key={s.label} className="px-4 py-3 bg-slate-800/30 rounded-xl text-center">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Department Breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Department Breakdown</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800/40">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="px-4 py-2 text-left text-xs text-slate-400 uppercase">Department</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400 uppercase">Learners</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400 uppercase">Leave Used</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400 uppercase">Absences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {departmentReport.map(d => (
                  <tr key={d.department}>
                    <td className="px-4 py-2 text-sm text-white">{d.department}</td>
                    <td className="px-4 py-2 text-sm text-slate-300 text-right">{d.learners}</td>
                    <td className="px-4 py-2 text-sm text-slate-300 text-right">{d.leave}</td>
                    <td className="px-4 py-2 text-sm text-slate-300 text-right">{d.absences}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Learners Report */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Individual Leave Summary</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800/40 max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="bg-slate-800/80">
                  <th className="px-4 py-2 text-left text-xs text-slate-400 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs text-slate-400 uppercase">Department</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400 uppercase">Accrued</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400 uppercase">Taken</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400 uppercase">Balance</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400 uppercase">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {learners.map(l => {
                  const taken = leaveRequests
                    .filter(lr => lr.learnerName === l.fullName && lr.leaveType === LeaveType.ANNUAL && lr.status === LeaveStatus.APPROVED)
                    .reduce((s, lr) => s + lr.daysRequested, 0);
                  const accrued = calculateAccruedDays(l.startDate, l.expectedEndDate);
                  const balance = calculateLeaveBalance(l.startDate, taken, l.expectedEndDate);
                  const attRecords = absenteeism.filter(a => a.learnerName === l.fullName);
                  const attPct = attRecords.length > 0
                    ? Math.round((attRecords.filter(a => a.attendanceStatus === AttendanceStatus.PRESENT).length / attRecords.length) * 100)
                    : 100;
                  return (
                    <tr key={l.fullName}>
                      <td className="px-4 py-2 text-sm text-white">{l.fullName}</td>
                      <td className="px-4 py-2 text-sm text-slate-300">{l.department}</td>
                      <td className="px-4 py-2 text-sm text-slate-300 text-right">{accrued}</td>
                      <td className="px-4 py-2 text-sm text-slate-300 text-right">{taken}</td>
                      <td className="px-4 py-2 text-sm text-slate-300 text-right">{balance}</td>
                      <td className="px-4 py-2 text-sm text-right">
                        <span className={attPct >= 90 ? 'text-emerald-400' : attPct >= 75 ? 'text-amber-400' : 'text-red-400'}>{attPct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
