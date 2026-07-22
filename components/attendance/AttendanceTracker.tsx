import React, { useMemo, useState } from 'react';
import { Search, Plus, Filter, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import EmptyState from '../common/EmptyState';
import LoadingSkeleton from '../common/LoadingSkeleton';
import { clsx, formatDate } from '../../services/utils';
import { AttendanceStatus, AbsenteeismRecord } from '../../types';

const STATUS_STYLES: Record<string, string> = {
  [AttendanceStatus.PRESENT]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [AttendanceStatus.ABSENT]: 'bg-red-500/10 text-red-400 border-red-500/20',
  [AttendanceStatus.LATE]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [AttendanceStatus.HALF_DAY]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [AttendanceStatus.NO_CALL_NO_SHOW]: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  [AttendanceStatus.MEDICAL_LEAVE]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [AttendanceStatus.AUTHORISED_ABSENCE]: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  [AttendanceStatus.UNAUTHORISED_ABSENCE]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const AttendanceTracker: React.FC = () => {
  const { absenteeism, learners, loading, filters, setFilters } = useApp();
  const { showToast } = useToast();
  const [showCaptureModal, setShowCaptureModal] = useState(false);

  const filteredRecords = useMemo(() => {
    return absenteeism.filter(a => {
      const learner = learners.find(l => l.fullName === a.learnerName);
      const name = learner?.fullName || '';
      const q = filters.search.toLowerCase();
      if (q && !name.toLowerCase().includes(q) && !a.attendanceStatus.toLowerCase().includes(q)) return false;
      if (filters.attendanceStatus && a.attendanceStatus !== filters.attendanceStatus) return false;
      if (filters.month) {
        const m = new Date(a.date).getMonth();
        if (m !== parseInt(filters.month)) return false;
      }
      return true;
    });
  }, [absenteeism, learners, filters]);

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = useMemo(() => absenteeism.filter(a => a.date === today), [absenteeism, today]);
  const presentToday = todayRecords.filter(a => a.attendanceStatus === AttendanceStatus.PRESENT).length;
  const absentToday = todayRecords.filter(a =>
    a.attendanceStatus === AttendanceStatus.ABSENT ||
    a.attendanceStatus === AttendanceStatus.NO_CALL_NO_SHOW
  ).length;

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
          <p className="text-xs text-slate-500 mb-1">Total Records</p>
          <p className="text-2xl font-bold text-white">{absenteeism.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search attendance..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <select
          value={filters.attendanceStatus}
          onChange={e => setFilters({ ...filters, attendanceStatus: e.target.value })}
          className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300"
        >
          <option value="">All Status</option>
          {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setShowCaptureModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Capture Attendance
        </button>
      </div>

      {/* Attendance Records */}
      {filteredRecords.length === 0 ? (
        <EmptyState title="No attendance records" description="No records match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Learner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Authorised</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Captured By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredRecords.map((record, i) => {
                const learner = learners.find(l => l.fullName === record.learnerName);
                return (
                  <tr key={`${record.date}-${record.learnerName}-${i}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-400">{formatDate(record.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {learner?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <span className="text-sm text-white">{learner?.fullName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full border', STATUS_STYLES[record.attendanceStatus])}>
                        {record.attendanceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {record.authorised ? <CheckCircle size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 max-w-[200px] truncate">{record.reason || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{record.capturedBy || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Capture Attendance Modal */}
      <Modal isOpen={showCaptureModal} onClose={() => setShowCaptureModal(false)} title="Capture Attendance" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-300 mb-1">Learner</label>
            <select className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm">
              <option value="">Select learner</option>
              {learners.map(l => <option key={l.fullName}>{l.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Date</label>
            <input type="date" defaultValue={today} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Status</label>
            <select className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm">
              {Object.values(AttendanceStatus).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-300 mb-1">Reason</label>
            <input type="text" className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-300 mb-1">Comments</label>
            <textarea rows={2} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800/60">
          <button onClick={() => setShowCaptureModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium">Save Record</button>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceTracker;
