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
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
        >
          {reportTypes.map(r => <option key={r}>{r}</option>)}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors">
            <Printer size={16} />
            Print
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors">
            <FileSpreadsheet size={16} />
            CSV
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leave Management Report</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Generated on {new Date().toLocaleDateString('en-ZA')}</p>
        </div>


        {/* All Learners Report */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Individual Leave Summary</h3>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white dark:bg-gray-900">
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-2 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">Department</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400 uppercase">Accrued</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400 uppercase">Taken</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400 uppercase">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
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
                    <tr key={l.fullName} className={l.status !== 'Active' ? 'opacity-50' : ''}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{l.fullName}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{l.department}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-right">{accrued}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-right">{taken}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-right">{balance}</td>
                      <td className="px-4 py-2 text-sm text-right">
                        <span className={attPct >= 90 ? 'text-green-600 dark:text-green-400' : attPct >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}>{attPct}%</span>
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
