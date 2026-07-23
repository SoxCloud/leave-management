import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, Save, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { AbsenteeismService } from '../../services/googleSheets';
import EmptyState from '../common/EmptyState';
import LoadingSkeleton from '../common/LoadingSkeleton';
import { formatDate } from '../../services/utils';
import { AttendanceStatus, AbsenteeismRecord } from '../../types';

type RowStatus = 'Present' | 'Absent' | 'Leave' | 'Off';

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
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 mb-1">Present Today</p>
          <p className="text-2xl font-bold text-emerald-400">{presentToday}</p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 mb-1">Absent Today</p>
          <p className="text-2xl font-bold text-red-400">{absentToday}</p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Learners</p>
          <p className="text-2xl font-bold text-white">{learners.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Attendance for {formatDate(today)}</h2>
          {todayIsSunday && <p className="text-xs text-amber-400 mt-1">Sunday — all learners default to Off</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search learners..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="w-56 pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
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
        <div className="overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Learner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Authorised</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredLearners.map(learner => {
                const row = rows.get(learner.fullName) || { status: todayIsSunday ? 'Off' as const : 'Present' as const, authorised: false };
                const existing = todayRecords.find(r => r.learnerName === learner.fullName);
                return (
                  <tr key={learner.fullName} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {learner.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{learner.fullName}</p>
                          <p className="text-xs text-slate-500">{learner.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={row.status}
                          onChange={e => {
                            const status = e.target.value as RowStatus;
                            const current = rows.get(learner.fullName);
                            setRow(learner.fullName, {
                              status,
                              authorised: status === 'Absent' || status === 'Leave' ? (current?.authorised ?? false) : false,
                            });
                          }}
                          className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50"
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Leave">Leave</option>
                          <option value="Off">Off</option>
                        </select>
                        {existing && (
                          <span className="text-[10px] text-slate-500 italic">(overwrite)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'Absent' || row.status === 'Leave' ? (
                        <button
                          onClick={() => setRow(learner.fullName, { ...row, authorised: !row.authorised })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            row.authorised
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {row.authorised ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {row.authorised ? 'Authorised' : 'Unauthorised'}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-600">—</span>
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
