import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, Save, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { AbsenteeismService } from '../../services/googleSheets';
import EmptyState from '../common/EmptyState';
import LoadingSkeleton from '../common/LoadingSkeleton';
import { clsx, formatDate } from '../../services/utils';
import { AttendanceStatus, AbsenteeismRecord } from '../../types';

type RowStatus = 'Present' | 'Late' | 'Absent' | 'Leave' | 'Off';

interface AttendanceRow {
  status: RowStatus;
  authorised: boolean;
}

const isSunday = (dateStr: string) => new Date(dateStr).getDay() === 0;

const AttendanceTracker: React.FC = () => {
  const { absenteeism, learners, user, loading, filters, setFilters, refresh } = useApp();
  const { showToast } = useToast();
  const [rows, setRows] = useState<Map<string, AttendanceRow>>(new Map());
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayIsSunday = isSunday(today);

  const todayRecords = useMemo(() => absenteeism.filter(a => a.date === today), [absenteeism, today]);
  const presentToday = todayRecords.filter(a => a.attendanceStatus === AttendanceStatus.PRESENT).length;
  const lateToday = todayRecords.filter(a => a.attendanceStatus === AttendanceStatus.LATE).length;
  const absentToday = todayRecords.filter(a =>
    a.attendanceStatus === AttendanceStatus.ABSENT ||
    a.attendanceStatus === AttendanceStatus.NO_CALL_NO_SHOW
  ).length;

  const initRows = useCallback(() => {
    const map = new Map<string, AttendanceRow>();
    for (const learner of learners) {
      const existing = todayRecords.find(r => r.learnerName === learner.fullName);
      if (existing) {
        const status: RowStatus =
          existing.attendanceStatus === AttendanceStatus.PRESENT ? 'Present' :
          existing.attendanceStatus === AttendanceStatus.LATE ? 'Late' :
          existing.attendanceStatus === AttendanceStatus.AUTHORISED_ABSENCE ? 'Leave' :
          'Absent';
        map.set(learner.fullName, { status, authorised: existing.authorised });
      } else if (todayIsSunday) {
        map.set(learner.fullName, { status: 'Off', authorised: false });
      } else {
        map.set(learner.fullName, { status: 'Present', authorised: false });
      }
    }
    setRows(map);
  }, [learners, todayRecords, todayIsSunday]);

  useEffect(() => { initRows(); }, [initRows]);

  const setRow = (learnerName: string, row: AttendanceRow) => {
    setRows(prev => {
      const next = new Map(prev);
      next.set(learnerName, row);
      return next;
    });
  };

  const handleSave = async () => {
    const toSave: Omit<AbsenteeismRecord, 'id'>[] = [];
    for (const [learnerName, row] of rows) {
      if (row.status === 'Off') continue;
      const learner = learners.find(l => l.fullName === learnerName);
      const attendanceStatus =
        row.status === 'Late' ? AttendanceStatus.LATE :
        row.status === 'Absent' ? AttendanceStatus.ABSENT :
        row.status === 'Leave' ? AttendanceStatus.AUTHORISED_ABSENCE :
        AttendanceStatus.PRESENT;
      toSave.push({
        learnerName,
        date: today,
        attendanceStatus,
        authorised: row.authorised,
        reason: '',
        capturedBy: user.name,
        supervisor: learner?.supervisor || '',
        manager: learner?.manager || '',
        comments: '',
      });
    }
    if (toSave.length === 0) {
      showToast('info', 'No attendance changes to save');
      return;
    }
    setSaving(true);
    try {
      const { success, failed } = await AbsenteeismService.bulkCreate(toSave);
      if (failed === 0) {
        showToast('success', `Attendance saved for ${success} learner${success !== 1 ? 's' : ''}`);
      } else {
        showToast('warning', `${success} saved, ${failed} failed`);
      }
      await refresh();
    } catch {
      showToast('error', 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const filteredLearners = useMemo(() => {
    const q = filters.search.toLowerCase();
    if (!q) return learners;
    return learners.filter(l =>
      l.fullName.toLowerCase().includes(q) ||
      l.department.toLowerCase().includes(q)
    );
  }, [learners, filters.search]);

  if (loading) return <LoadingSkeleton type="table" count={8} />;

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0B0B0B] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mb-1">Present Today</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{presentToday}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0B0B0B] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mb-1">Late Today</p>
          <p className="text-2xl font-bold text-[#EF4444]">{lateToday}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0B0B0B] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mb-1">Absent Today</p>
          <p className="text-2xl font-bold text-[#EF4444]">{absentToday}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0B0B0B] p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mb-1">Total Learners</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{learners.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Attendance for {formatDate(today)}</h2>
          {todayIsSunday && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Sunday — all learners default to Off</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search learners..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="w-56 pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Attendance Grid */}
      {filteredLearners.length === 0 ? (
        <EmptyState title="No learners found" description="Try adjusting your search." />
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">Learner</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">Authorised</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLearners.map(learner => {
                const row = rows.get(learner.fullName) || { status: todayIsSunday ? 'Off' as const : 'Present' as const, authorised: false };
                const existing = todayRecords.find(r => r.learnerName === learner.fullName);
                return (
                  <tr key={learner.fullName} className={clsx('hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors', learner.status !== 'Active' && 'opacity-50')}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {learner.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white font-medium">{learner.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{learner.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={row.status}
                          onChange={e => {
                            const status = e.target.value as RowStatus;
                            const current = rows.get(learner.fullName);
                            setRow(learner.fullName, {
                              status,
                              authorised: status === 'Late' || status === 'Absent' || status === 'Leave' ? (current?.authorised ?? false) : false,
                            });
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Present">Present</option>
                          <option value="Late">Late</option>
                          <option value="Absent">Absent</option>
                          <option value="Leave">Leave</option>
                          <option value="Off">Off</option>
                        </select>
                        {existing && (
                          <span className="text-gray-400 italic text-xs">(overwrite)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {row.status === 'Late' || row.status === 'Absent' || row.status === 'Leave' ? (
                        <button
                          onClick={() => setRow(learner.fullName, { ...row, authorised: !row.authorised })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            row.authorised
                              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                          }`}
                        >
                          {row.authorised ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {row.authorised ? 'Authorised' : 'Unauthorised'}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-300 dark:text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
